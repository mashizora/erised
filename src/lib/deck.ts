/** 从 txt 文本解析卡牌：一行一张，忽略首尾空白与空行 */
export function parseCards(text: string): string[] {
  return text
    .split(/\r\n|[\r\n]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** 从 URL 的 deck 参数读取 UTF-8 文本牌组；未传参数时返回 null。 */
export function parseCustomDeck(search: string): string[] | null {
  const encoded = new URLSearchParams(search).get("deck");
  if (encoded === null) return null;

  let text: string;
  try {
    // 兼容 Base64URL，以及直接拼接 URL 时被解析为空格的 Base64 加号。
    const base64 = encoded.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("自定义牌组格式无效，请使用 UTF-8 文本文件的 Base64 编码");
  }

  const cards = parseCards(text);
  if (cards.length === 0) throw new Error("自定义牌组为空，请至少提供一张卡牌");
  return cards;
}

export async function loadDeck(search: string, defaultUrl: string, signal?: AbortSignal): Promise<string[]> {
  const customDeck = parseCustomDeck(search);
  if (customDeck !== null) return customDeck;

  const response = await fetch(defaultUrl, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const cards = parseCards(await response.text());
  if (cards.length === 0) throw new Error("默认牌组为空，请在 cards.txt 中至少提供一张卡牌");
  return cards;
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
