# 📚 Libs 目录说明

本目录包含成绩分析可视化系统的所有外部库文件和样式文件。

## 📁 文件结构

### CSS 样式文件
- **`main.css`** - 主样式文件，包含整个应用的所有样式
  - 响应式布局
  - 暗黑/浅色主题
  - 组件样式
  - 动画效果
  
- **`chart.css`** - Chart.js 图表库的样式文件
  - 图表容器样式
  - 图表响应式布局
  - 工具提示样式

- **`main_backup.css`** - 主样式文件的备份版本
  - 用于版本回退
  - 保留历史样式

### JavaScript 库文件
- **`chart.min.js`** - Chart.js 图表库 (压缩版)
  - 用于生成各种类型的图表
  - 支持柱状图、折线图、饼图、雷达图等

## 🔧 使用说明

在 `index.html` 中引用这些文件：

```html
<!-- CSS 样式 -->
<link rel="stylesheet" href="libs/main.css">
<link rel="stylesheet" href="libs/chart.css">

<!-- JavaScript 库 -->
<script src="libs/chart.min.js"></script>
```

## 📝 维护说明

- 修改样式时请先备份 `main.css` 到 `main_backup.css`
- 新增样式建议添加到 `main.css` 的相应区域
- 保持文件命名的一致性和清晰性 