# 腕间 · AI 配饰设计与手串试戴

一个轻量的 AI 配饰设计与手串试戴工具。可以上传珠子、吊坠和配件实拍，让视觉模型生成手串、手机链或项链成品图；也可以上传腕部照片，自由串珠并下载试戴图。

在线体验：[GitHub Pages](https://nanamiqa.github.io/shouchuan/) · [Sites 版本](https://wanjian-bracelet-diy.nanananannananinanani.chatgpt.site/)

## 当前功能

- 照片只在浏览器本地处理，不上传服务器
- 支持上传照片或手机拍照
- 四种手串材质预设
- DIY 珠子盒：逐颗添加、移动、删除，实时试戴
- 一键将自选珠子整理成主次清楚的对称款
- 鼠标与触屏拖动、尺寸、角度、真实感调整
- 按住对比原图，导出 PNG 试戴图
- 上传最多四张实物素材图，生成手串、手机链和项链设计
- 支持成品类型、呈现风格、画面比例、清晰度和模型配置
- 默认对接 OpenAI `gpt-image-2` 图片编辑接口，也可填写兼容接口与模型名称
- API Key 默认只保存在当前浏览器会话，可选择记住在本机
- AI 素材从浏览器直接发送到使用者配置的模型接口，本站不保存素材与结果
- 响应式中文界面

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

## Docker 本地部署

需要安装 Docker Desktop 或 Docker Engine，并启用 Compose。

```bash
docker compose up -d --build
```

打开 <http://localhost:3000> 即可使用。查看运行日志或停止服务：

```bash
docker compose logs -f
docker compose down
```

如果本机的 `3000` 端口已被占用，可以改用其他端口：

```bash
WANJIAN_PORT=8080 docker compose up -d --build
```

然后访问 <http://localhost:8080>。Docker 部署不需要在服务器配置 OpenAI API Key；每位使用者仍在自己的浏览器中填写 Key，默认只保存在当前会话。

如果通过域名和反向代理提供访问，可以同时配置网站公开地址，让分享图片链接使用正确域名：

```bash
PUBLIC_SITE_URL=https://bracelet.example.com docker compose up -d --build
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
