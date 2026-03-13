use base64::{engine::general_purpose, Engine as _};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DoubaoImageEditPayload {
    api_key: Option<String>,
    base_url: Option<String>,
    model: String,
    prompt: String,
    image_data_url: String,
    size: Option<String>,
    guidance_scale: Option<f32>,
    watermark: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DoubaoImageEditResponse {
    image_data_url: String,
    mime_type: String,
    revised_prompt: Option<String>,
    remote_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ArkImageDataItem {
    b64_json: Option<String>,
    url: Option<String>,
    revised_prompt: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ArkImageResponse {
    data: Vec<ArkImageDataItem>,
}

fn resolve_api_key(payload: &DoubaoImageEditPayload) -> Result<String, String> {
    if let Some(api_key) = payload.api_key.as_ref().map(|value| value.trim()).filter(|value| !value.is_empty()) {
        return Ok(api_key.to_string());
    }

    std::env::var("ARK_API_KEY").map_err(|_| "未提供豆包 API Key，且环境变量 ARK_API_KEY 不存在".to_string())
}

fn data_url_to_mime_and_base64(data_url: &str) -> Result<(String, String), String> {
    let Some((meta, data)) = data_url.split_once(',') else {
        return Err("图片数据不是合法的 data URL".to_string());
    };

    let mime = meta
        .strip_prefix("data:")
        .and_then(|value| value.strip_suffix(";base64"))
        .ok_or_else(|| "图片 data URL 缺少 MIME 信息".to_string())?;

    Ok((mime.to_string(), data.to_string()))
}

async fn url_to_data_url(url: &str) -> Result<(String, String), String> {
    let response = reqwest::get(url)
        .await
        .map_err(|error| format!("下载豆包结果图失败: {error}"))?;
    let mime_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("image/png")
        .to_string();
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("读取豆包结果图失败: {error}"))?;
    let encoded = general_purpose::STANDARD.encode(bytes);
    Ok((mime_type.clone(), format!("data:{mime_type};base64,{encoded}")))
}

#[tauri::command]
async fn doubao_image_edit(payload: DoubaoImageEditPayload) -> Result<DoubaoImageEditResponse, String> {
    let api_key = resolve_api_key(&payload)?;
    let base_url = payload
        .base_url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("https://ark.cn-beijing.volces.com/api/v3")
        .trim_end_matches('/');

    let (mime_type, image_base64) = data_url_to_mime_and_base64(&payload.image_data_url)?;
    let image_data_url = format!("data:{mime_type};base64,{image_base64}");

    let request_body = json!({
        "model": payload.model,
        "prompt": payload.prompt,
        "image": image_data_url,
        "size": payload.size.unwrap_or_else(|| "adaptive".to_string()),
        "guidance_scale": payload.guidance_scale.unwrap_or(5.5),
        "watermark": payload.watermark.unwrap_or(true),
        "response_format": "b64_json"
    });

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{base_url}/images/generations"))
        .bearer_auth(api_key)
        .json(&request_body)
        .send()
        .await
        .map_err(|error| format!("调用豆包图片编辑接口失败: {error}"))?;

    let status = response.status();
    let body = response.text().await.map_err(|error| format!("读取豆包响应失败: {error}"))?;

    if !status.is_success() {
        return Err(format!("豆包接口返回错误 {status}: {body}"));
    }

    let parsed: ArkImageResponse = serde_json::from_str(&body)
        .map_err(|error| format!("解析豆包响应失败: {error}; 原始响应: {body}"))?;

    let first = parsed
        .data
        .into_iter()
        .next()
        .ok_or_else(|| "豆包接口未返回图片数据".to_string())?;

    if let Some(b64_json) = first.b64_json {
        return Ok(DoubaoImageEditResponse {
            image_data_url: format!("data:image/png;base64,{b64_json}"),
            mime_type: "image/png".to_string(),
            revised_prompt: first.revised_prompt,
            remote_url: first.url,
        });
    }

    if let Some(url) = first.url {
        let (downloaded_mime, downloaded_data_url) = url_to_data_url(&url).await?;
        return Ok(DoubaoImageEditResponse {
            image_data_url: downloaded_data_url,
            mime_type: downloaded_mime,
            revised_prompt: first.revised_prompt,
            remote_url: Some(url),
        });
    }

    Err("豆包接口已响应，但没有返回 b64_json 或 url".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![doubao_image_edit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
