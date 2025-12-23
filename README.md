# Beads Creator · 拼豆像素画板

Beads Creator 是一款专为拼豆/像素画爱好者打造的在线画板工具，支持图片量化、手动涂色、批量换色、颜色统计与多格式导出，适用于 Web 和桌面端（Tauri）。

## 功能亮点

- **色板管理**：支持自定义色板（编号/名称/HEX），一键全选/清空，便捷切换画笔色。
- **图片量化**：上传图片后自动缩放并量化为最接近色板的像素画。
- **手动编辑**：点击网格像素即可上色，支持批量换色操作。
- **导出多样**：支持导出 CSV（色名+色号）和 PNG（带 HEX 标注及用量统计）。
- **颜色统计**：实时统计每种颜色的用量，辅助备料与制作。
- **跨平台**：Web 端即开即用，桌面端基于 Tauri，支持本地运行。

## 快速开始

### 环境要求

- Node.js 18+
- Rust 工具链（仅桌面端/Tauri 需要）

### 本地开发

```bash
npm install
npm run dev
```

### 构建与预览

```bash
npm run build
npm run preview
```

### 桌面端（Tauri）

```bash
npm run tauri dev
npm run tauri build
```

## 使用说明

1. **新建画布**：设置宽高（默认 30×30），点击“新建画布”。
2. **图片量化**：上传图片，自动生成像素画。
3. **手动涂色**：点击色板选择画笔，再点击画布像素微调。
4. **批量换色**：选择来源色与目标色，一键替换全局像素。
5. **导出**：支持 CSV/PNG 格式，PNG 附带色号与用量统计。

## 配置与扩展

- **色板**：编辑 `public/palette.json`，自定义色号、名称、HEX。
- **画布限制**：可在 `App.vue` 调整画布尺寸范围。
- **导出细节**：PNG 生成逻辑可在 `downloadPng` 方法自定义。

## 目录结构

```
├─ public/
│  └─ palette.json          # 预设色板
├─ src/
│  ├─ main.ts               # 入口
│  ├─ App.vue               # 主页面与核心逻辑
│  └─ components/           # 主要功能组件
│     ├─ PaletteSelector.vue
│     ├─ CanvasViewer.vue
│     ├─ NewImportControls.vue
│     ├─ CanvasSizeControls.vue
│     ├─ BatchReplaceControls.vue
│     └─ ExportPanel.vue
├─ src-tauri/               # Tauri 配置与 Rust 入口
└─ package.json
```

## 常用脚本

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run tauri dev` / `npm run tauri build`

## 许可

本项目暂未声明开源协议，默认保留所有权利。如需开放授权，请在根目录添加 LICENSE 文件。
