export type DoubaoEditRequest = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  prompt: string;
  imageDataUrl: string;
  size?: string;
  guidanceScale?: number;
  watermark?: boolean;
};

export type DoubaoEditResponse = {
  imageDataUrl: string;
  mimeType: string;
  revisedPrompt?: string | null;
  remoteUrl?: string | null;
};

export async function isTauriEnvironment() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function invokeDoubaoImageEdit(payload: DoubaoEditRequest) {
  const api = await import("@tauri-apps/api/core");
  return api.invoke<DoubaoEditResponse>("doubao_image_edit", { payload });
}
