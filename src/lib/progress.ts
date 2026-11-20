export function progressKey(url: URL, cards: readonly string[]): string {
  const group = url.searchParams.has("deck") ? JSON.stringify(cards) : "default";
  return `erised:progress:v1:${new URL(".", url).pathname}:${group}`;
}

export function restoreProgress(raw: string | null, cards: readonly string[]): { deck: string[]; drawn: number } | null {
  if (!raw) return null;

  try {
    const { deck, drawn } = JSON.parse(raw);
    if (!Array.isArray(deck) || deck.length !== cards.length ||
        !Number.isInteger(drawn) || drawn < 0 || drawn > cards.length) return null;

    // 逐张核对，保留重复牌，也能识别已经更新的默认牌组。
    const expected = [...cards].sort();
    if (![...deck].sort().every((card, i) => card === expected[i])) return null;
    return { deck, drawn };
  } catch {
    return null;
  }
}
