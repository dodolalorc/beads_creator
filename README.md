# beads_creator · 拼豆像素画画板

用固定色板把图片量化成可编辑的拼豆像素画，可手动涂改、批量换色，并导出 CSV/PNG 便于制作和备料。基于 **Vue 3 + TypeScript + Vite**，桌面端使用 **Tauri 2**。

## 功能

- 预设色板：从 `public/palette.json` 读取系列色（含编号/名称/HEX），可全选/清空，点击设定当前画笔。
- 图片量化：上传图片后按画布尺寸缩放，将每个像素映射到最接近的色板颜色。
- 手动上色：点击网格像素使用当前画笔涂改。
- 批量换色：选择来源色与目标色，一键替换全局像素。
- 导出：
  - CSV：输出色名+色号。
  - PNG：输出带 HEX 标注的像素图，并附颜色用量统计图例。
- 颜色统计：实时显示每种颜色的使用数量。

## 环境准备

- Node.js 18+（可用 npm/pnpm/bun）。
- Rust 工具链（Tauri 桌面端需要）：确保 `cargo`、`rustc` 可用。

## 快速开始（Web）

```bash
npm install      # 或 bun install / pnpm install
npm run dev      # 启动 Vite 开发
```

构建与预览：

```bash
npm run build    # 类型检查并打包
npm run preview  # 预览打包结果
```

## 桌面端（Tauri）

```bash
npm run tauri dev    # 开发模式
npm run tauri build  # 打包桌面应用
```

## 使用指南

1. 画布：在左侧面板设置宽高（默认 30×30），点击“新建画布”。
2. 量化：上传图片，应用会按画布尺寸缩放并量化到色板。
3. 涂改：在色板点击色块设定画笔，再点击画布像素进行微调。
4. 批量换色：选择“从/替换为”颜色后执行替换。
5. 导出：
   - CSV：每格输出 `色名 (HEX)`。
   - PNG：网格带 HEX 标注，底部附用量统计。

## 配置

- 色板：编辑 `public/palette.json`，字段 `id`、`name`、`hex`。
- 画布限制：`App.vue` 内默认 1–200（可调整）。
- 导出细节：PNG 生成逻辑在 `downloadPng`，可自定义单格大小/字体。

## 项目结构（摘录）

```
├─ public/
│  └─ palette.json          # 预设色板
├─ src/
│  ├─ main.ts               # 入口
│  ├─ App.vue               # 主页面与核心逻辑
│  └─ components/
│     ├─ PaletteSelector.vue
│     ├─ CanvasViewer.vue
│     ├─ NewImportControls.vue
│     ├─ CanvasSizeControls.vue
│     ├─ BatchReplaceControls.vue
│     └─ ExportTools.vue
├─ src-tauri/               # Tauri 配置与 Rust 入口
└─ package.json
```

## 脚本

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run tauri dev` / `npm run tauri build`

## 许可

未声明许可证（default: all rights reserved）。如需开放协议，请在根目录添加 LICENSE 并更新本说明。
