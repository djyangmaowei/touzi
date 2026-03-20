# 🎲 3D摇骰子 (微信小程序)

一个沉浸式 3D 摇骰子微信小程序，专为朋友聚会大话骰/吹牛玩家设计。支持 1-10 个骰子，真实音效，手机竖屏体验。

![演示](https://github.com/djyangmaowei/touzi/raw/main/assets/screenshot.png)

## ✨ 功能特性

- 🎲 **3D 拟真渲染**：Canvas 2D 实现 3D 透视效果，象牙白骰子，深绿色高级绒布桌布
- 🔊 **真实音效**：骰子碰撞声，音画同步
- 🎛️ **骰子数量**：支持 1-10 个骰子，设置面板快速调节
- 📱 **手机适配**：竖屏优化，支持屏幕常亮（聚会场景必备）
- 🎨 **沉浸视觉**：高级绒布纹理、金属质感按钮、三盏舞台灯光效果

## 🚀 快速开始

### 开发环境

1. 克隆项目
```bash
git clone https://github.com/djyangmaowei/touzi.git
cd touzi
```

2. 使用微信开发者工具打开项目
   - 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
   - 选择「导入项目」，指向项目目录

3. 填写你的小程序 AppID（或选择测试号）

### 发布流程

1. 微信开发者工具 → 上传代码
2. 微信公众平台 → 版本管理 → 提交审核
3. 审核通过后发布上线

## 📁 项目结构

```
touzi/
├── app.js              # 小程序入口
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── sitemap.json        # 搜索配置
├── project.config.json # 项目配置
├── pages/
│   └── index/          # 首页
│       ├── index.js    # 页面逻辑
│       ├── index.wxml  # 页面结构
│       └── index.wxss  # 页面样式
├── assets/             # 资源文件
│   ├── felt-texture.png
│   └── settings.svg
└── design.md           # 设计文档
```

## 🛠️ 技术栈

- **3D 渲染**：Canvas 2D API（自定义 3D 透视算法）
- **样式**：WXSS
- **音效**：微信小程序 InnerAudioContext
- **屏幕常亮**：wx.setKeepScreenOn

## 🎯 使用场景

1. 朋友聚会玩大话骰/吹牛
2. 酒桌游戏需要隐私摇骰子
3. 单纯想体验 3D 摇骰子的快感

## 📝 更新日志

### v1.0.0 (2026-03-20)
- ✨ 初始版本发布
- 🎲 Canvas 2D 实现 3D 骰子渲染与动画
- 🔊 真实骰子音效
- 🎛️ 骰子数量设置（1-10）
- 📱 屏幕常亮支持
- 🎨 高级绒布纹理 + 三盏舞台灯效果

## 📄 License

MIT License - 自由使用，聚会愉快！🍻
