/**
 * 卡牌数据的纯函数工具：解析与洗牌。
 * 与 UI 无关，便于单独测试。
 */

/** 从 txt 文本解析卡牌：一行一张，忽略首尾空白与空行 */
export function parseCards(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Fisher–Yates 洗牌，返回打乱后的新数组，不修改原数组 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
