# CSS/SCSS 样式结构说明

## 概述

本项目采用模块化的SCSS结构，使用现代的`@use`和`@forward`语法，将原有的大型CSS文件重构为更易维护的模块化样式系统。兼容Sass 1.89.1+版本。

## 文件结构

```bash
src/assets/styles/
├── index.scss                   # 样式入口文件（使用@forward）
├── global.scss                  # 全局CSS变量定义
├── base/                        # 基础样式
│   ├── reset.scss              # CSS重置
│   ├── variables.scss          # CSS变量
│   └── common.scss             # 公共样式
├── components/                  # 组件样式
│   └── lottery/                # 抽奖组件
│       ├── lottery-main.scss   # 主抽奖样式
│       └── lottery-buttons.scss # 按钮样式
├── layout/                      # 布局样式
│   └── responsive.scss         # 响应式设计
└── utils/                       # 工具样式
    ├── animations.scss         # 动画效果
    └── effects.scss            # 特效样式
```

## 文件说明

### 入口文件

- **index.scss**: 使用`@forward`组织所有模块，作为样式库的入口

### 基础样式 (base/)

- **reset.scss**: CSS重置，确保跨浏览器一致性
- **variables.scss**: CSS变量定义，统一管理颜色、字体、间距等
- **common.scss**: 公共样式，包括布局、按钮、模态框等基础组件

### 组件样式 (components/)

- **lottery-main.scss**: 抽奖主界面样式，包括容器、边框、内容区域
- **lottery-buttons.scss**: 抽奖按钮样式，包括奖项按钮、控制按钮等

### 布局样式 (layout/)

- **responsive.scss**: 响应式设计，适配不同屏幕尺寸

### 工具样式 (utils/)

- **animations.scss**: 动画效果，包括旋转、淡入淡出等
- **effects.scss**: 特效样式，包括奖项展示、模态框等

## 使用方法

### 在Vue组件中引入（推荐）

```vue
<style lang="scss" scoped>
@use "@/styles/index.scss";
</style>
```

### 按需引入特定模块

```vue
<style lang="scss" scoped>
@use "@/styles/base/variables.scss";
@use "@/styles/components/lottery/lottery-main.scss";
</style>
```

## 现代SCSS语法

### @use 语法

```scss
// 引入模块
@use './base/variables';

// 使用模块中的变量
.element {
  color: variables.$primary-color;
}
```

### @forward 语法

```scss
// 转发模块，使其可以被其他文件使用
@forward './base/variables';
@forward './components/lottery/lottery-main';
```

### 嵌套语法

```scss
.dashboard {
  margin: 6rem auto 0 auto;
  
  &:first-of-type {
    flex-wrap: nowrap;
  }
  
  .lottery-btn {
    &:hover {
      transform: translateY(-2px);
    }
  }
}
```

## CSS变量系统

项目使用CSS变量统一管理样式：

```scss
:root {
  /* 颜色变量 */
  --primary-color: #FD361F;
  --secondary-color: #2980B9;
  
  /* 字体变量 */
  --font-family-chinese: 'STKaiti', 'KaiTi ';
  --font-size-base: 1.5rem;
  
  /* 间距变量 */
  --spacing-lg: 2rem;
  
  /* 过渡变量 */
  --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 维护指南

### 添加新组件样式

1. 在 `components/` 下创建对应文件夹
2. 创建组件的SCSS文件
3. 在 `index.scss` 中添加 `@forward './components/your-component/your-component.scss';`

### 修改主题

1. 编辑 `global.scss` 中的变量
2. 整个项目样式会自动更新

### 添加新动画

1. 在 `utils/animations.scss` 中定义
2. 在对应组件中使用

## 优势

### 现代语法

- 使用`@use`和`@forward`，符合Sass最新规范
- 避免`@import`弃用警告
- 更好的模块化组织

### 模块化

- 每个文件都有明确的职责
- 便于维护和扩展

### 可重用性

- CSS变量统一管理
- 组件样式可复用

### 可扩展性

- 新组件可以轻松添加对应SCSS文件
- 样式结构清晰

### 性能优化

- 按需引入，减少不必要的样式
- 浏览器缓存优化

### 团队协作

- 清晰的文件结构
- 统一的命名规范

## 注意事项

1. **使用现代语法**: 优先使用`@use`和`@forward`，避免`@import`
2. **保持一致性**: 使用统一的CSS变量和命名规范
3. **避免重复**: 公共样式放在 `common.scss` 中
4. **响应式优先**: 所有组件都要考虑响应式设计
5. **性能考虑**: 避免过度嵌套，合理使用选择器

## 迁移说明

从原有的 `style.css` 迁移到新的SCSS结构：

1. ✅ 已完成CSS文件重构
2. ✅ 已创建模块化SCSS文件
3. ✅ 已更新Vue组件引用
4. ✅ 已移除旧的CSS文件
5. ✅ 已升级到现代SCSS语法
6. ✅ 已删除重复的main.scss文件

现在项目使用更清晰、更易维护的现代SCSS结构！
