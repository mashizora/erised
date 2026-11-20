import assert from "node:assert/strict";
import test from "node:test";
import { loadDeck, shuffle } from "../src/lib/deck.ts";

test("默认牌组按行读取，保留重复牌，忽略空行与首尾空白", async () => {
  const text = "  春  \r\n\r\n夏\r秋\n春\n";
  const url = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
  assert.deepEqual(await loadDeck("?other=1", url), ["春", "夏", "秋", "春"]);
});

test("默认牌组为空时报告错误", async () => {
  await assert.rejects(loadDeck("", "data:text/plain,%20%0A"), /默认牌组为空/);
});

test("默认牌组请求失败时显示 HTTP 状态", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
  await assert.rejects(loadDeck("", "./cards.txt"), /HTTP 404/);
});

test("自定义牌组支持标准 Base64、未转义的加号和 Base64URL", async () => {
  const bytes = Buffer.from("🌸\n春");
  const base64 = bytes.toString("base64");
  assert.ok(base64.includes("+"));
  for (const encoded of [encodeURIComponent(base64), base64, bytes.toString("base64url")]) {
    assert.deepEqual(await loadDeck(`?deck=${encoded}`, ""), ["🌸", "春"]);
  }
});

test("无效编码、无效 UTF-8 和空自定义牌组均报错，不回退到默认牌组", async () => {
  const fallback = "data:text/plain,fallback";
  for (const encoded of ["!", "/w=="]) {
    await assert.rejects(loadDeck(`?deck=${encoded}`, fallback), /自定义牌组格式无效/);
  }
  await assert.rejects(loadDeck("?deck=", fallback), /自定义牌组为空/);
});

test("洗牌保留每张牌及其出现次数，原数组可重复使用", () => {
  const original = Object.freeze(["春", "夏", "春"]);
  const shuffled = shuffle(original);
  assert.notStrictEqual(shuffled, original);
  assert.deepEqual(shuffled.sort(), [...original].sort());
});
