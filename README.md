# 腕间 · 手串试戴

一个轻量的网页手串试戴工具。上传腕部照片后，可以切换材质、拖动手串，并调整尺寸、角度和透明度，最后下载合成图。

在线体验：[GitHub Pages](https://nanamiqa.github.io/shouchuan/) · [Sites 版本](https://wanjian-bracelet-diy.nanananannananinanani.chatgpt.site/)

## 当前功能

- 照片只在浏览器本地处理，不上传服务器
- 支持上传照片或手机拍照
- 四种手串材质预设
- DIY 珠子盒：逐颗添加、移动、删除，实时试戴
- 一键将自选珠子整理成主次清楚的对称款
- 鼠标与触屏拖动、尺寸、角度、真实感调整
- 按住对比原图，导出 PNG 试戴图
- 响应式中文界面

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

## GitHub Pages

推送到 `main` 后，GitHub Actions 会自动构建静态版本并发布到 GitHub Pages。

```bash
npm run build
npm run pages:build
```

静态文件会生成在 `out-pages/`。

## 开源参考

首版交互参考了以下开源项目的思路，并采用独立实现：

- [MediaPipe](https://github.com/google-ai-edge/mediapipe)（Apache-2.0）：后续自动识别手腕位置的技术方向
- [react-easy-crop](https://github.com/ValentinH/react-easy-crop)（MIT）：移动、缩放、旋转的触屏交互方式
- [Fabric.js](https://github.com/fabricjs/fabric.js)（MIT）：画布对象与图片导出的产品思路

## 下一步

- 使用 MediaPipe Hand Landmarker 自动定位腕部
- 支持上传透明背景的自定义手串素材
- 增加手部遮挡，让试戴效果更真实

## License

MIT
