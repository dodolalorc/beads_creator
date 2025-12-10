# beads_creator

一个基于 Tauri + Vue 3 + TypeScript 的像素画生成器。通过自定义色板将图片量化为指定尺寸的像素网格，支持手动修正、批量换色，以及导出带色号标注的 CSV/PNG。

## 功能亮点

- 从 `public/palette.json` 读取固定色板，支持全选/清空、点击设定当前画笔。
- 上传任意图片后按画布尺寸缩放，并按选中色板自动量化到最接近的颜色。
- 手动点选像素上色，或批量将某种颜色替换为另一种颜色。
- 导出当前网格为 CSV（色名+色号）或 PNG（包含像素色号与底部颜色用量汇总）。
- 显示颜色使用统计，便于估算颗粒数量。

## 预备条件

- Node.js 18+ 与 npm（或 pnpm/bun，按需切换）。
- Rust 工具链（用于 Tauri 桌面端）：`cargo`、`rustc` 可用。

## 快速开始

```bash
npm install       # 安装前端依赖
npm run dev       # 启动前端开发服务器（Vite）

npm run tauri dev # 桌面端开发（需满足 Tauri 系统依赖）
```

构建产物：

```bash
npm run build      # 生成前端静态文件
npm run tauri build# 打包桌面应用
```

## 使用指南

1. 设定画布尺寸（默认 16×16），点击“新建空白画布”。
2. 上传图片，应用会按画布大小缩放并量化到当前选中色板。
3. 在色板中点击色块设为画笔，再点击画布像素进行手动修正。
4. 如需批量换色，选择“从/替换为”颜色后点击“执行替换”。
5. 导出：
   - CSV：每格输出 `色名 (HEX)`。
   - PNG：每格标注 HEX，底部附颜色用量列表。

## 配置与扩展

- 色板：编辑 `public/palette.json` 可自定义颜色列表（字段：`id`、`name`、`hex`）。
- 画布尺寸：`App.vue` 默认限制 1–200，可按需调整。
- 导出分辨率：PNG 每格像素大小会根据画布尺寸自适应，核心逻辑位于 `downloadPng`。

## 脚本

- `npm run dev`：启动 Vite 开发服务。
- `npm run build`：类型检查并打包前端。
- `npm run preview`：预览打包结果。
- `npm run tauri dev`：运行 Tauri 开发模式。
- `npm run tauri build`：打包桌面应用。

## 目录结构（摘录）

```
├─ public/
│  └─ palette.json        # 预设色板
├─ src/
│  ├─ main.ts             # 入口
│  └─ App.vue             # 主界面与核心逻辑（量化、换色、导出）
├─ src-tauri/             # Tauri 桌面端配置与 Rust 入口
├─ package.json
└─ vite.config.ts
```

## 致谢

项目基于 Tauri + Vue 生态，感谢社区提供的工具链与模板。
