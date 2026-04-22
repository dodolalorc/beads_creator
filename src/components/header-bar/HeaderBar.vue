<template>
  <header class="hero">
    <div>
      <p class="eyebrow">像素画工作台</p>
      <h1>用自定义色板，把图片变成颗粒像素画</h1>
      <p class="lede">
        选择固定色彩、设定画布尺寸，上传图片后自动量化；支持手工修正、换色、CSV
        导出，以及带色号标注的 PNG。
      </p>
      <p class="star-tip">
        如果你喜欢这个项目，欢迎在 GitHub 仓库点个 Star 支持！
      </p>
    </div>
  </header>
</template>
<style scoped>
.hero {
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 252, 245, 0.94), rgba(244, 233, 214, 0.9));
  border: 1px solid var(--paper-line);
  border-radius: 24px;
  padding: 28px;
  box-shadow: var(--paper-shadow);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: "";
  position: absolute;
  inset: auto 24px 20px auto;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184, 135, 87, 0.18), transparent 70%);
  pointer-events: none;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--paper-accent);
  margin-bottom: 6px;
}

h1 {
  margin: 0 0 8px;
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: 30px;
  line-height: 1.2;
  color: var(--paper-text);
}

.lede {
  margin: 0;
  color: var(--paper-text-muted);
  max-width: 100%;
  line-height: 1.6;
}

.star-tip {
  margin-top: 12px;
  color: var(--paper-accent-strong);
  font-size: 15px;
  font-weight: 500;
}
</style>
