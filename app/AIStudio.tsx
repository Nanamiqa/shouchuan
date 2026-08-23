"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type ProductType = "bracelet" | "phone-chain" | "necklace";

type MaterialImage = {
  file: File;
  id: string;
  url: string;
};

type ImageQuality = "low" | "medium" | "high" | "auto";
type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";

type ImageApiResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: {
    code?: string;
    message?: string;
    type?: string;
    moderation_details?: { moderation_stage?: string; categories?: string[] };
  };
};

const PRODUCT_TYPES: Array<{ id: ProductType; name: string; note: string; mark: string }> = [
  { id: "bracelet", name: "手串", note: "围合佩戴 · 珠序清楚", mark: "○" },
  { id: "phone-chain", name: "手机链", note: "垂坠结构 · 配件完整", mark: "⌁" },
  { id: "necklace", name: "项链", note: "颈部比例 · 主石突出", mark: "∪" },
];

const STYLE_OPTIONS = ["白底商品图", "自然佩戴图", "东方静物", "社媒氛围图"];

const PRODUCT_PROMPTS: Record<ProductType, string> = {
  bracelet: "手串：完整闭合成环，珠序清晰、松紧自然，尺寸符合真实手腕佩戴比例",
  "phone-chain": "手机链：有可连接手机壳的挂绳结构，垂坠自然，配件与珠子连接方式真实可靠",
  necklace: "项链：完整项链结构，颈部佩戴比例自然，主珠或吊坠位置明确，连接件真实",
};

const SCENE_PROMPTS: Record<string, string> = {
  白底商品图: "纯净暖白背景的专业电商产品摄影，主体居中，柔和阴影，无文字无水印",
  自然佩戴图: "自然光下的真实佩戴效果，肤色与比例自然，重点展示成品和素材细节",
  东方静物: "克制的东方静物摄影，米白与深松绿色调，留白充足，材质细节清楚",
  社媒氛围图: "精致生活方式摄影，适合社交媒体分享，构图有呼吸感，主体清晰",
};

const DEFAULT_API_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-image-2";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function AIStudio() {
  const [materials, setMaterials] = useState<MaterialImage[]>([]);
  const [productType, setProductType] = useState<ProductType>("bracelet");
  const [sceneStyle, setSceneStyle] = useState(STYLE_OPTIONS[0]);
  const [prompt, setPrompt] = useState("用我上传的珠子和配件，设计一款简洁耐看的作品，保留材质本来的颜色与纹理。");
  const [apiKey, setApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [quality, setQuality] = useState<ImageQuality>("medium");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const materialsRef = useRef<MaterialImage[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localKey = window.localStorage.getItem("wanjian-openai-api-key");
      const sessionKey = window.sessionStorage.getItem("wanjian-openai-api-key");
      if (localKey) {
        setApiKey(localKey);
        setRememberKey(true);
      } else if (sessionKey) {
        setApiKey(sessionKey);
      }
      const savedSettings = window.localStorage.getItem("wanjian-ai-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Partial<{ apiBase: string; model: string; quality: ImageQuality; size: ImageSize }>;
          if (parsed.apiBase) setApiBase(parsed.apiBase);
          if (parsed.model) setModel(parsed.model);
          if (parsed.quality) setQuality(parsed.quality);
          if (parsed.size) setSize(parsed.size);
        } catch {
          window.localStorage.removeItem("wanjian-ai-settings");
        }
      }
      setSettingsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  useEffect(() => () => {
    materialsRef.current.forEach((material) => URL.revokeObjectURL(material.url));
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    window.localStorage.setItem("wanjian-ai-settings", JSON.stringify({ apiBase, model, quality, size }));
  }, [apiBase, model, quality, settingsHydrated, size]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 4200);
    return () => window.clearTimeout(timer);
  }, [status]);

  function addMaterials(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const next = files
      .filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type) && file.size <= MAX_FILE_BYTES)
      .slice(0, Math.max(0, 4 - materials.length))
      .map((file) => ({ file, id: `${file.name}-${file.lastModified}-${file.size}`, url: URL.createObjectURL(file) }));
    setMaterials((current) => [...current, ...next]);
    if (files.some((file) => file.size > MAX_FILE_BYTES)) setStatus("单张素材图请控制在 15MB 以内");
    else if (files.some((file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type))) setStatus("素材图支持 JPG、PNG 与 WEBP");
    else if (files.length > next.length) setStatus("最多加入 4 张素材图");
    event.target.value = "";
  }

  function removeMaterial(id: string) {
    setMaterials((current) => {
      const target = current.find((material) => material.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((material) => material.id !== id);
    });
  }

  function saveKey(value: string) {
    setApiKey(value);
    if (value) window.sessionStorage.setItem("wanjian-openai-api-key", value);
    else window.sessionStorage.removeItem("wanjian-openai-api-key");
    if (rememberKey && value) window.localStorage.setItem("wanjian-openai-api-key", value);
    else window.localStorage.removeItem("wanjian-openai-api-key");
  }

  function changeRememberKey(remember: boolean) {
    setRememberKey(remember);
    if (remember && apiKey) window.localStorage.setItem("wanjian-openai-api-key", apiKey);
    else window.localStorage.removeItem("wanjian-openai-api-key");
  }

  function buildPrompt() {
    const materialList = materials.map((material, index) => `参考图 ${index + 1}：${material.file.name}`).join("；");
    return [
      "你是一位专业的珠宝与生活配饰设计师、产品摄影师。",
      `请使用上传参考图中的实物珠子、吊坠和配件，设计并呈现一件完整的${PRODUCT_TYPES.find((item) => item.id === productType)?.name}。`,
      PRODUCT_PROMPTS[productType],
      `呈现要求：${SCENE_PROMPTS[sceneStyle]}`,
      "必须尽量忠实保留参考素材可辨识的颜色、纹理、透明度、金属质感和造型，不要把素材替换成无关物件。连接结构必须真实可制作。画面只出现一件主要成品，不添加品牌字样、说明文字、水印、边框或拼贴。",
      `用户的具体需求：${prompt.trim()}`,
      `素材索引：${materialList}`,
    ].join("\n");
  }

  async function generateDesign() {
    if (!materials.length) {
      setStatus("请先上传至少一张实物素材图");
      return;
    }
    if (!apiKey) {
      setSettingsOpen(true);
      setStatus("请先填写自己的 API Key");
      return;
    }
    if (!prompt.trim()) {
      setStatus("请写下你的设计要求");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setStatus("已把素材交给视觉模型，请稍候…");

    try {
      let endpoint: URL;
      try {
        endpoint = new URL(`${apiBase.trim().replace(/\/+$/, "")}/images/edits`);
      } catch {
        throw new Error("API 地址格式不正确，请填写完整地址，例如 https://api.openai.com/v1。");
      }

      const isLocalEndpoint = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1";
      if (endpoint.protocol !== "https:" && !isLocalEndpoint) {
        throw new Error("为保护 API Key，远程接口必须使用 HTTPS；本机 localhost 接口可以使用 HTTP。");
      }

      const body = new FormData();
      body.append("model", model.trim() || DEFAULT_MODEL);
      body.append("prompt", buildPrompt());
      body.append("quality", quality);
      body.append("size", size);
      body.append("output_format", "webp");
      body.append("output_compression", "88");
      body.append("background", "auto");
      body.append("moderation", "auto");
      body.append("n", "1");
      materials.forEach((material) => body.append("image[]", material.file, material.file.name));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({})) as ImageApiResponse;

      if (!response.ok) {
        const code = payload.error?.code;
        if (response.status === 401) throw new Error("API Key 无效或已失效，请检查后重试");
        if (response.status === 429) throw new Error("当前额度不足或请求较多，请检查账户额度后重试");
        if (code === "moderation_blocked") throw new Error("这次内容未通过安全检查，请调整描述或素材后重试");
        throw new Error(payload.error?.message || `生成失败（HTTP ${response.status}）`);
      }

      const image = payload.data?.[0];
      const nextResult = image?.b64_json ? `data:image/webp;base64,${image.b64_json}` : image?.url;
      if (!nextResult) throw new Error("模型没有返回图片，请稍后重试");

      const productName = PRODUCT_TYPES.find((item) => item.id === productType)?.name ?? "配饰";
      setResultUrl(nextResult);
      setResultName(`腕间-AI-${productName}-${Date.now()}.webp`);
      setStatus("成品设计已生成，可以下载或继续调整需求");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("已取消本次生成");
      } else if (error instanceof TypeError) {
        setStatus("浏览器无法连接接口，请检查 API 地址、网络或跨域设置");
      } else {
        setStatus(error instanceof Error ? error.message : "生成失败，请稍后重试");
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }

  function cancelGeneration() {
    abortRef.current?.abort();
  }

  function downloadResult() {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = resultName || "腕间-AI-设计.webp";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  }

  return (
    <section className="ai-studio" id="ai-studio" aria-labelledby="ai-studio-title">
      <div className="ai-studio-intro">
        <p className="eyebrow">AI MATERIAL-TO-DESIGN</p>
        <h2 id="ai-studio-title">把手里的实物，<br /><em>变成完整作品。</em></h2>
        <p>上传珠子、吊坠或配件实拍，告诉视觉模型你想做什么。它会参考素材的颜色、纹理和造型，生成可继续调整的成品效果图。</p>
        <div className="ai-privacy-note">
          <span aria-hidden="true">⌁</span>
          <div><strong>每个人使用自己的 API Key</strong><small>仅保存在当前浏览器；素材不会存入本站数据库。</small></div>
        </div>
      </div>

      <div className="ai-workbench">
        <div className="ai-column ai-compose-column">
          <div className="ai-step-heading"><span>01</span><div><strong>上传实物素材</strong><small>珠子、配件、吊坠，最多 4 张</small></div></div>
          <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addMaterials} />
          <div className="material-upload-grid">
            {materials.map((material, index) => (
              <figure className="material-preview" key={material.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={material.url} alt={`实物素材 ${index + 1}`} />
                <figcaption>素材 {String(index + 1).padStart(2, "0")}</figcaption>
                <button type="button" onClick={() => removeMaterial(material.id)} aria-label={`删除素材 ${index + 1}`}>×</button>
              </figure>
            ))}
            {materials.length < 4 && (
              <button type="button" className="material-upload-button" onClick={() => inputRef.current?.click()}>
                <span aria-hidden="true">＋</span><strong>加入素材图</strong><small>JPG · PNG · WEBP</small>
              </button>
            )}
          </div>

          <div className="ai-step-heading"><span>02</span><div><strong>选择要做什么</strong><small>模型会自动匹配结构与比例</small></div></div>
          <div className="product-type-grid">
            {PRODUCT_TYPES.map((product) => (
              <button type="button" key={product.id} className={productType === product.id ? "is-active" : ""} onClick={() => setProductType(product.id)} aria-pressed={productType === product.id}>
                <i aria-hidden="true">{product.mark}</i><span><strong>{product.name}</strong><small>{product.note}</small></span><b aria-hidden="true">✓</b>
              </button>
            ))}
          </div>

          <label className="ai-field">
            <span><strong>设计要求</strong><small>{prompt.length} / 500</small></span>
            <textarea value={prompt} maxLength={500} rows={4} onChange={(event) => setPrompt(event.target.value)} />
          </label>
          <label className="ai-field ai-select-field">
            <span><strong>呈现方式</strong><small>决定成品图的氛围</small></span>
            <select value={sceneStyle} onChange={(event) => setSceneStyle(event.target.value)}>
              {STYLE_OPTIONS.map((style) => <option key={style}>{style}</option>)}
            </select>
          </label>

          <button type="button" className="api-settings-toggle" onClick={() => setSettingsOpen((current) => !current)} aria-expanded={settingsOpen}>
            <span><b className={apiKey ? "is-ready" : ""} /> API 与模型设置</span><small>{apiKey ? "已在本机配置" : "生成前需要配置"}　{settingsOpen ? "−" : "＋"}</small>
          </button>
          {settingsOpen && (
            <div className="api-settings-panel">
              <label className="api-key-field"><span>OpenAI API Key <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">获取 Key ↗</a></span><div><input type={showKey ? "text" : "password"} value={apiKey} placeholder="sk-..." autoComplete="off" spellCheck={false} onChange={(event) => saveKey(event.target.value.trim())} /><button type="button" onClick={() => setShowKey((current) => !current)}>{showKey ? "隐藏" : "显示"}</button></div></label>
              <label className="remember-key"><input type="checkbox" checked={rememberKey} onChange={(event) => changeRememberKey(event.target.checked)} /><span>关闭网页后仍记住 Key（仅限自己的设备）</span></label>
              <div className="api-advanced-grid">
                <label><span>模型</span><input value={model} onChange={(event) => setModel(event.target.value)} spellCheck={false} /></label>
                <label><span>API 地址</span><input value={apiBase} onChange={(event) => setApiBase(event.target.value)} spellCheck={false} /></label>
                <label><span>清晰度</span><select value={quality} onChange={(event) => setQuality(event.target.value as ImageQuality)}><option value="low">草图 · 快速</option><option value="medium">标准 · 推荐</option><option value="high">精细 · 较慢</option><option value="auto">自动</option></select></label>
                <label><span>画面比例</span><select value={size} onChange={(event) => setSize(event.target.value as ImageSize)}><option value="1024x1024">方形 1:1</option><option value="1536x1024">横版 3:2</option><option value="1024x1536">竖版 2:3</option><option value="auto">自动</option></select></label>
              </div>
              <p>Key 默认只在当前标签页会话中使用；勾选后才会写入本机浏览器。请求由此浏览器直接发送到你配置的接口，本站不存储 Key、素材或结果。</p>
            </div>
          )}
        </div>

        <div className="ai-column ai-result-column">
          <div className="ai-result-toolbar"><div><span className="status-dot" /><strong>AI 成品预览</strong></div><small>GPT Image</small></div>
          <div className={`ai-result-stage ${isGenerating ? "is-generating" : ""} ${resultUrl ? "has-result" : ""}`}>
            {resultUrl ? (
              <div className="ai-generated-result">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt={`AI 生成的${PRODUCT_TYPES.find((item) => item.id === productType)?.name}设计`} />
                <div><button type="button" onClick={downloadResult}>下载成品图</button><button type="button" onClick={() => setResultUrl(null)}>重新开始</button></div>
              </div>
            ) : isGenerating ? (
              <div className="ai-result-empty ai-loading-state">
                <span aria-hidden="true" className="ai-spinner"><i /><i /><i /></span>
                <strong>正在理解素材并设计</strong>
                <p>模型会先辨认珠子和配件，再组合成完整作品。复杂图片可能需要约 2 分钟。</p>
                <button type="button" onClick={cancelGeneration}>取消生成</button>
              </div>
            ) : (
              <div className="ai-result-empty">
                <span aria-hidden="true" className="ai-orbit"><i /><i /><i /></span>
                <strong>等待你的第一组素材</strong>
                <p>上传实物图并写下需求，模型会在这里生成完整的{PRODUCT_TYPES.find((item) => item.id === productType)?.name}设计。</p>
              </div>
            )}
          </div>
          <button type="button" className="ai-generate-button" disabled={!materials.length || !prompt.trim() || !apiKey || isGenerating} onClick={generateDesign}>
            <span aria-hidden="true">✦</span><span><strong>{isGenerating ? "正在生成设计" : `生成${PRODUCT_TYPES.find((item) => item.id === productType)?.name}设计`}</strong><small>{sceneStyle} · {model || DEFAULT_MODEL}</small></span><b aria-hidden="true">↗</b>
          </button>
          <p className="ai-result-footnote">生成通常需要几十秒；复杂图片可能更久。</p>
        </div>
      </div>
      {status && <div className="toast" role="status">{status}</div>}
    </section>
  );
}
