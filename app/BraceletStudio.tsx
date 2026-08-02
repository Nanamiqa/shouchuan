"use client";

import {
  ChangeEvent,
  type CSSProperties,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type BraceletPreset = {
  id: string;
  name: string;
  note: string;
  palette: [string, string, string][];
};

type BeadMaterial = {
  id: string;
  name: string;
  kind: string;
  palette: [string, string, string];
};

const PRESETS: BraceletPreset[] = [
  {
    id: "sandalwood",
    name: "小叶紫檀",
    note: "沉稳暖棕",
    palette: [
      ["#c8734c", "#783624", "#34150f"],
      ["#ad5838", "#642719", "#2c100b"],
    ],
  },
  {
    id: "obsidian",
    name: "黑曜石",
    note: "利落深黑",
    palette: [
      ["#697078", "#22272d", "#050607"],
      ["#494f55", "#15191d", "#020303"],
    ],
  },
  {
    id: "moonstone",
    name: "月光白",
    note: "清透柔和",
    palette: [
      ["#ffffff", "#d9e2e1", "#9caeae"],
      ["#fff8e9", "#d9ddd3", "#9caaa2"],
    ],
  },
  {
    id: "jade",
    name: "青玉",
    note: "温润东方",
    palette: [
      ["#b6d1b7", "#6d967d", "#315b4b"],
      ["#d3dcc1", "#829b74", "#405c40"],
    ],
  },
];

const MATERIALS: BeadMaterial[] = [
  { id: "sandalwood", name: "紫檀", kind: "木", palette: ["#c8734c", "#783624", "#34150f"] },
  { id: "obsidian", name: "黑曜", kind: "石", palette: ["#697078", "#22272d", "#050607"] },
  { id: "moonstone", name: "月光", kind: "晶", palette: ["#ffffff", "#d9e2e1", "#9caeae"] },
  { id: "jade", name: "青玉", kind: "玉", palette: ["#b6d1b7", "#6d967d", "#315b4b"] },
  { id: "amber", name: "蜜蜡", kind: "蜜", palette: ["#ffe08a", "#d28a18", "#7a4708"] },
  { id: "cinnabar", name: "南红", kind: "红", palette: ["#ff846a", "#b92f27", "#65110f"] },
  { id: "tiger-eye", name: "虎眼", kind: "纹", palette: ["#e1ae55", "#81501b", "#2f1c0a"] },
  { id: "gold", name: "金隔珠", kind: "金", palette: ["#fff1ae", "#c79536", "#704714"] },
];

const STARTER_SEQUENCE = [
  "sandalwood", "sandalwood", "gold", "jade", "sandalwood", "sandalwood", "moonstone", "sandalwood", "gold",
  "gold", "sandalwood", "moonstone", "sandalwood", "sandalwood", "jade", "gold", "sandalwood", "sandalwood",
];

const BEAD_COUNT = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function BraceletStudio() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState(PRESETS[0].id);
  const [diySequence, setDiySequence] = useState<string[]>(STARTER_SEQUENCE);
  const [selectedBead, setSelectedBead] = useState<number | null>(null);
  const [lastMaterialId, setLastMaterialId] = useState("sandalwood");
  const [position, setPosition] = useState({ x: 50, y: 57 });
  const [size, setSize] = useState(245);
  const [rotation, setRotation] = useState(-8);
  const [opacity, setOpacity] = useState(96);
  const [showBracelet, setShowBracelet] = useState(true);
  const [status, setStatus] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const activePreset: BraceletPreset = activePresetId === "custom"
    ? {
        id: "custom",
        name: "我的 DIY",
        note: `${diySequence.length} 颗自选珠`,
        palette: diySequence.map((id) => MATERIALS.find((material) => material.id === id)?.palette ?? MATERIALS[0].palette),
      }
    : PRESETS.find((preset) => preset.id === activePresetId) ?? PRESETS[0];
  const renderedBeadCount = activePresetId === "custom" ? activePreset.palette.length : BEAD_COUNT;
  const selectedMaterial = selectedBead === null
    ? null
    : MATERIALS.find((material) => material.id === diySequence[selectedBead]) ?? null;
  const uniqueMaterialCount = new Set(diySequence).size;
  const designHint = diySequence.length < 12
    ? `还差 ${18 - diySequence.length} 颗，继续挑喜欢的珠子`
    : uniqueMaterialCount <= 2
      ? "主次清楚，简洁耐看"
      : uniqueMaterialCount <= 4
        ? "配色有层次，对称排法会更稳"
        : "颜色比较丰富，可以点“帮我排好看”";

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  function loadPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("请选择 JPG、PNG 或 HEIC 照片");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setStatus("照片请控制在 15MB 以内");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPhotoUrl(nextUrl);
    setPosition({ x: 50, y: 57 });
    setStatus("照片已加入，可以拖动手串贴合手腕");
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    loadPhoto(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    loadPhoto(event.dataTransfer.files?.[0]);
  }

  function addBead(materialId: string) {
    if (diySequence.length >= BEAD_COUNT) {
      setStatus("这串已经有 18 颗了，可先删掉一颗再添加");
      return;
    }
    setDiySequence((current) => [...current, materialId]);
    setSelectedBead(diySequence.length);
    setLastMaterialId(materialId);
    setActivePresetId("custom");
  }

  function moveSelected(direction: -1 | 1) {
    if (selectedBead === null) return;
    const target = selectedBead + direction;
    if (target < 0 || target >= diySequence.length) return;
    setDiySequence((current) => {
      const next = [...current];
      [next[selectedBead], next[target]] = [next[target], next[selectedBead]];
      return next;
    });
    setSelectedBead(target);
    setActivePresetId("custom");
  }

  function removeSelected() {
    if (selectedBead === null) return;
    setDiySequence((current) => current.filter((_, index) => index !== selectedBead));
    setSelectedBead(null);
    setActivePresetId("custom");
  }

  function clearDiy() {
    setDiySequence([]);
    setSelectedBead(null);
    setActivePresetId("custom");
    setStatus("珠盘已清空，重新挑一串吧");
  }

  function arrangeBeautifully() {
    const candidates = Array.from(new Set(diySequence));
    const main = lastMaterialId;
    const accent = candidates.find((id) => id !== main) ?? (main === "gold" ? "sandalwood" : "gold");
    const highlight = candidates.find((id) => id !== main && id !== accent) ?? (main === "moonstone" ? "jade" : "moonstone");
    const half = [main, main, accent, main, highlight, main, accent, main, "gold"];
    setDiySequence([...half, ...[...half].reverse()]);
    setSelectedBead(null);
    setActivePresetId("custom");
    setStatus("已经按主色 + 点睛珠排成对称款");
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    setPosition({
      x: clamp(drag.originX + ((event.clientX - drag.pointerX) / rect.width) * 100, 5, 95),
      y: clamp(drag.originY + ((event.clientY - drag.pointerY) / rect.height) * 100, 5, 95),
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  function resetBracelet() {
    setPosition({ x: 50, y: 57 });
    setSize(245);
    setRotation(-8);
    setOpacity(96);
    setStatus("已恢复默认位置");
  }

  function drawBracelet(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    angle: number,
  ) {
    const height = width * 0.58;
    const beadSize = width * 0.105;
    const radiusX = width * 0.405;
    const radiusY = height * 0.31;
    const points = Array.from({ length: renderedBeadCount }, (_, index) => {
      const beadAngle = (index / renderedBeadCount) * Math.PI * 2;
      return {
        index,
        x: Math.cos(beadAngle) * radiusX,
        y: Math.sin(beadAngle) * radiusY,
        depth: Math.sin(beadAngle),
      };
    }).sort((a, b) => a.depth - b.depth);

    context.save();
    context.globalAlpha = opacity / 100;
    context.translate(centerX, centerY);
    context.rotate((angle * Math.PI) / 180);
    context.strokeStyle = "rgba(37, 27, 18, 0.48)";
    context.lineWidth = Math.max(2, width * 0.013);
    context.beginPath();
    context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.stroke();

    points.forEach(({ index, x, y, depth }) => {
      const scale = 0.92 + (depth + 1) * 0.055;
      const radius = (beadSize * scale) / 2;
      const palette = activePreset.palette[index % activePreset.palette.length];
      context.save();
      context.shadowColor = "rgba(19, 13, 9, 0.32)";
      context.shadowBlur = width * 0.022;
      context.shadowOffsetY = width * 0.012;
      const gradient = context.createRadialGradient(
        x - radius * 0.32,
        y - radius * 0.38,
        radius * 0.05,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, palette[0]);
      gradient.addColorStop(0.52, palette[1]);
      gradient.addColorStop(1, palette[2]);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
    context.restore();
  }

  async function downloadResult() {
    const stage = stageRef.current;
    if (!photoUrl || !stage) return;
    setStatus("正在生成试戴图…");

    const photo = new Image();
    photo.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1500;
      const context = canvas.getContext("2d");
      if (!context) return;

      const scale = Math.max(canvas.width / photo.naturalWidth, canvas.height / photo.naturalHeight);
      const drawWidth = photo.naturalWidth * scale;
      const drawHeight = photo.naturalHeight * scale;
      context.drawImage(
        photo,
        (canvas.width - drawWidth) / 2,
        (canvas.height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );

      const stageWidth = stage.getBoundingClientRect().width;
      drawBracelet(
        context,
        (position.x / 100) * canvas.width,
        (position.y / 100) * canvas.height,
        (size / stageWidth) * canvas.width,
        rotation,
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `腕间-${activePreset.name}-试戴.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        setStatus("试戴图已保存");
      }, "image/png");
    };
    photo.onerror = () => setStatus("生成失败，请换一张照片试试");
    photo.src = photoUrl;
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="腕间首页">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>腕间</span>
          <small>WRIST VIEW</small>
        </a>
        <p className="privacy-pill"><span aria-hidden="true">●</span> 照片仅在本机处理</p>
      </header>

      <section className="hero" id="top">
        <div className="intro">
          <p className="eyebrow">VIRTUAL BRACELET TRY-ON</p>
          <h1>不用想象，<br /><em>戴上</em>再决定。</h1>
          <p className="lede">上传一张手腕照片，试试不同材质、尺寸与角度。<br className="desktop-break" />简单一点，也更接近你真正戴上的样子。</p>
          <ol className="steps" aria-label="使用步骤">
            <li><span>01</span> 上传腕部照</li>
            <li><span>02</span> 选择手串</li>
            <li><span>03</span> 拖动贴合</li>
          </ol>
        </div>

        <div className="studio-card">
          <div className="studio-toolbar">
            <div>
              <span className="status-dot" />
              <strong>试戴画布</strong>
            </div>
            <button type="button" className="text-button" onClick={resetBracelet}>重置调整</button>
          </div>

          <div
            ref={stageRef}
            className={`photo-stage ${photoUrl ? "has-photo" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="wrist-photo" src={photoUrl} alt="你上传的腕部照片" draggable={false} />
            ) : (
              <div className="empty-photo" aria-label="等待上传腕部照片">
                <div className="demo-arm" aria-hidden="true" />
                <div className="upload-prompt">
                  <span className="upload-icon" aria-hidden="true">＋</span>
                  <strong>放入你的腕部照片</strong>
                  <small>拖进来，或点击下方上传</small>
                </div>
              </div>
            )}

            {showBracelet && (
              <div
                className="bracelet-overlay"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${size}px`,
                  height: `${size * 0.58}px`,
                  opacity: opacity / 100,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
                onPointerDown={beginDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                role="img"
                aria-label={`${activePreset.name}手串，可拖动调整位置`}
              >
                <span className="bracelet-string" />
                {Array.from({ length: renderedBeadCount }, (_, index) => {
                  const beadAngle = (index / renderedBeadCount) * Math.PI * 2;
                  const x = 50 + Math.cos(beadAngle) * 40.5;
                  const y = 50 + Math.sin(beadAngle) * 31;
                  const depth = Math.sin(beadAngle);
                  const palette = activePreset.palette[index % activePreset.palette.length];
                  const beadStyle = {
                    "--bead-x": `${x.toFixed(4)}%`,
                    "--bead-y": `${y.toFixed(4)}%`,
                    "--bead-z": `${Math.round((depth + 1) * 10)}`,
                    "--bead-scale": (0.92 + (depth + 1) * 0.055).toFixed(5),
                    "--bead-light": palette[0],
                    "--bead-mid": palette[1],
                    "--bead-dark": palette[2],
                  } as CSSProperties;
                  return (
                    <i
                      className="bead"
                      key={`${activePreset.id}-${index}`}
                      style={beadStyle}
                    />
                  );
                })}
              </div>
            )}

            <div className="stage-actions">
              <button
                type="button"
                className="compare-button"
                onPointerDown={() => setShowBracelet(false)}
                onPointerUp={() => setShowBracelet(true)}
                onPointerLeave={() => setShowBracelet(true)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") setShowBracelet(false);
                }}
                onKeyUp={() => setShowBracelet(true)}
              >
                按住看原图
              </button>
            </div>
          </div>

          <div className="upload-row">
            <input ref={photoInputRef} className="sr-only" type="file" accept="image/*" onChange={handleInput} />
            <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleInput} />
            <button type="button" className="upload-button" onClick={() => photoInputRef.current?.click()}>
              <span aria-hidden="true">↑</span> {photoUrl ? "更换照片" : "上传照片"}
            </button>
            <button type="button" className="camera-button" onClick={() => cameraInputRef.current?.click()}>
              <span aria-hidden="true">◎</span> 手机拍照
            </button>
            <p>建议正上方拍摄，露出完整手腕</p>
          </div>
        </div>
      </section>

      <section className="control-panel" aria-label="手串样式与调整">
        <div className="presets-block">
          <div className="section-heading">
            <p><span>01</span> 选择材质</p>
            <small>点击即可试戴</small>
          </div>
          <div className="preset-list">
            {PRESETS.map((preset) => (
              <button
                type="button"
                className={`preset-card ${activePresetId === preset.id ? "is-active" : ""}`}
                key={preset.id}
                onClick={() => setActivePresetId(preset.id)}
                aria-pressed={activePresetId === preset.id}
              >
                <span className="preset-beads" aria-hidden="true">
                  {[0, 1, 2].map((index) => (
                    <i
                      key={index}
                      style={{
                        "--bead-light": preset.palette[index % preset.palette.length][0],
                        "--bead-mid": preset.palette[index % preset.palette.length][1],
                        "--bead-dark": preset.palette[index % preset.palette.length][2],
                      } as CSSProperties}
                    />
                  ))}
                </span>
                <strong>{preset.name}</strong>
                <small>{preset.note}</small>
                <span className="check-mark">✓</span>
              </button>
            ))}
          </div>
        </div>

        <div className="adjust-block">
          <div className="section-heading">
            <p><span>02</span> 贴合手腕</p>
            <small>也可以直接拖动画面中的手串</small>
          </div>
          <div className="sliders">
            <label>
              <span><b>尺寸</b><output>{Math.round(size / 20)} mm</output></span>
              <input type="range" min="150" max="380" value={size} onChange={(event) => setSize(Number(event.target.value))} />
            </label>
            <label>
              <span><b>角度</b><output>{rotation > 0 ? "+" : ""}{rotation}°</output></span>
              <input type="range" min="-45" max="45" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} />
            </label>
            <label>
              <span><b>真实感</b><output>{opacity}%</output></span>
              <input type="range" min="45" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
            </label>
          </div>
          <button type="button" className="save-button" disabled={!photoUrl} onClick={downloadResult}>
            保存试戴图 <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className={`diy-block ${activePresetId === "custom" ? "is-active" : ""}`}>
          <div className="section-heading diy-heading">
            <p><span>03</span> 自己串 · DIY</p>
            <div>
              <small>{designHint}</small>
              <button type="button" className="clear-button" onClick={clearDiy}>清空</button>
            </div>
          </div>

          <div className="diy-layout">
            <div className="material-box">
              <div className="diy-subheading">
                <strong>珠子盒</strong>
                <small>点一下，加一颗</small>
              </div>
              <div className="material-list">
                {MATERIALS.map((material) => (
                  <button
                    type="button"
                    className="material-item"
                    key={material.id}
                    onClick={() => addBead(material.id)}
                    disabled={diySequence.length >= BEAD_COUNT}
                  >
                    <i
                      className="material-bead"
                      aria-hidden="true"
                      style={{
                        "--bead-light": material.palette[0],
                        "--bead-mid": material.palette[1],
                        "--bead-dark": material.palette[2],
                      } as CSSProperties}
                    />
                    <span><strong>{material.name}</strong><small>{material.kind}</small></span>
                    <b aria-hidden="true">＋</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="sequence-box">
              <div className="diy-subheading">
                <strong>我的串珠</strong>
                <small><b>{diySequence.length}</b> / {BEAD_COUNT} 颗</small>
              </div>
              <div className="sequence-track" aria-label="你的 DIY 串珠顺序">
                {Array.from({ length: BEAD_COUNT }, (_, index) => {
                  const materialId = diySequence[index];
                  const material = MATERIALS.find((item) => item.id === materialId);
                  if (!material) return <span className="empty-slot" key={`empty-${index}`} aria-hidden="true" />;
                  return (
                    <button
                      type="button"
                      className={`sequence-bead ${selectedBead === index ? "is-selected" : ""}`}
                      key={`${materialId}-${index}`}
                      onClick={() => {
                        setSelectedBead(index);
                        setActivePresetId("custom");
                      }}
                      aria-label={`第 ${index + 1} 颗，${material.name}${selectedBead === index ? "，已选中" : ""}`}
                      style={{
                        "--bead-light": material.palette[0],
                        "--bead-mid": material.palette[1],
                        "--bead-dark": material.palette[2],
                      } as CSSProperties}
                    />
                  );
                })}
              </div>
              <div className="sequence-actions">
                <p>{selectedMaterial ? `已选：${selectedMaterial.name}` : "点一颗珠子，可以移动或删除"}</p>
                <div>
                  <button type="button" disabled={selectedBead === null || selectedBead === 0} onClick={() => moveSelected(-1)} aria-label="把选中珠子向左移动">←</button>
                  <button type="button" disabled={selectedBead === null || selectedBead === diySequence.length - 1} onClick={() => moveSelected(1)} aria-label="把选中珠子向右移动">→</button>
                  <button type="button" disabled={selectedBead === null} onClick={removeSelected}>删除</button>
                </div>
              </div>
              <button type="button" className="arrange-button" onClick={arrangeBeautifully}>
                <span aria-hidden="true">✦</span>
                <span><strong>帮我排好看</strong><small>保留主色，自动做成对称款</small></span>
                <b aria-hidden="true">↗</b>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <p><span className="footer-mark" aria-hidden="true">•••</span> 腕间 <small>BETA</small></p>
        <p>你的照片不会离开这台设备。</p>
      </footer>

      {status && <div className="toast" role="status">{status}</div>}
    </main>
  );
}
