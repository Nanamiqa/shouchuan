import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the bracelet try-on experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>腕间 · AI 配饰设计与手串试戴<\/title>/i);
  assert.match(html, /不用想象/);
  assert.match(html, /试戴照仅本机处理/);
  assert.match(html, /上传照片/);
  assert.match(html, /小叶紫檀/);
  assert.match(html, /自己串 · DIY/);
  assert.match(html, /帮我排好看/);
  assert.match(html, /AI 实物创作/);
  assert.match(html, /把手里的实物/);
  assert.match(html, /手机链/);
  assert.match(html, /API 与模型设置/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
