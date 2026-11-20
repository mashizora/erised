import assert from "node:assert/strict";
import test from "node:test";
import { progressKey, restoreProgress } from "../src/lib/progress.ts";

const cards = ["春", "春", "秋"];
const deck = ["秋", "春", "春"];

test("恢复原来的牌序和位置，包括未抽与抽完的状态", () => {
  for (const drawn of [0, 1, deck.length]) {
    const saved = { deck, drawn };
    assert.deepEqual(restoreProgress(JSON.stringify(saved), cards), saved);
  }
});

test("忽略损坏的进度、越界的位置和已变更的牌组", () => {
  for (const raw of [null, "{", "null", ...[-1, 4, 1.5, "1"].map(drawn => JSON.stringify({ deck, drawn }))]) {
    assert.equal(restoreProgress(raw, cards), null);
  }
  assert.equal(restoreProgress(JSON.stringify({ deck, drawn: 1 }), ["春", "秋", "秋"]), null);
});

test("默认牌组和不同自定义牌组分别保存，同一牌组可通过不同编码的链接恢复", () => {
  const base = new URL("https://example.com/game/");
  const custom = new URL("?deck=abc", base);
  assert.notEqual(progressKey(base, cards), progressKey(custom, cards));
  assert.notEqual(progressKey(custom, cards), progressKey(custom, ["夏"]));
  assert.equal(progressKey(custom, cards), progressKey(new URL("?deck=xyz", base), cards));
});
