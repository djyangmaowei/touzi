# 🎲 摇骰子 (Touzi)

一个沉浸式 3D 摇骰子 H5 应用，专为朋友聚会大话骰/吹牛玩家设计。支持 1-10 个骰子，真实音效，手机竖屏体验。

![演示](https://github.com/djyangmaowei/touzi/raw/main/assets/screenshot.png)

## ✨ 功能特性

- 🎲 **3D 拟真渲染**：Three.js 实现，象牙白骰子，深绿色毛毡桌布
- 🔊 **真实音效**：从真实视频提取的骰子碰撞声，音画同步
- 🎛️ **骰子数量**：支持 1-10 个骰子，设置面板快速调节
- 📱 **手机适配**：竖屏优化，支持屏幕常亮（聚会场景必备）
- 🎨 **沉浸视觉**：毛玻璃效果、金属质感按钮、绿色数码管字体

## 🚀 快速开始

### 本地运行

```bash
git clone https://github.com/djyangmaowei/touzi.git
cd touzi
# 用浏览器打开 index.html
```

或者使用本地服务器：

```bash
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 在线体验

> 通过 GitHub Pages 部署后添加链接

## 📁 项目结构

```
touzi/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式（毛玻璃、金属按钮）
├── js/
│   ├── main.js         # 主逻辑、动画循环
│   ├── dice.js         # 3D 骰子对象
│   └── audio.js        # 音效管理
├── assets/
│   ├── dice-roll.mp3   # 骰子音效
│   └── felt-texture.png # 毛毡背景
└── design.md           # 设计文档
```

## 🛠️ 技术栈

- **3D 渲染**：Three.js
- **样式**：原生 CSS（backdrop-filter 毛玻璃效果）
- **音效**：HTML5 Audio API
- **屏幕常亮**：Screen Wake Lock API

## 🎯 使用场景

1. 朋友聚会玩大话骰/吹牛
2. 酒桌游戏需要隐私摇骰子
3. 单纯想体验 3D 摇骰子的快感

## 📝 更新日志

### v1.0.0 (2026-03-18)
- ✨ 初始版本发布
- 🎲 3D 骰子渲染与动画
- 🔊 真实骰子音效
- 🎛️ 骰子数量设置（1-10）
- 📱 竖屏适配与屏幕常亮

## 📄 License

MIT License - 自由使用，聚会愉快！🍻
