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
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 16px 60px rgba(15, 23, 42, 0.6);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #7dd3fc;
  margin-bottom: 6px;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
  color: #e2e8f0;
}

.lede {
  margin: 0;
  color: #cbd5e1;
  max-width: 100%;
  line-height: 1.6;
}

.star-tip {
  margin-top: 12px;
  color: #fbbf24;
  font-size: 15px;
  font-weight: 500;
}

</style>
