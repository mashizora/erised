<script lang="ts">
  import { onMount } from "svelte";
  import { parseCards, shuffle } from "./lib/deck";

  /** 翻开卡牌的时长：曲线带回弹，稍长一些让弹性完整呈现 */
  const FLIP_OPEN_MS = 650;
  /** 合上卡牌的时长：干脆利落，为下一张让路 */
  const FLIP_CLOSE_MS = 300;

  /** 全部卡牌（加载后不再变化） */
  let allCards: string[] = $state([]);
  /** 尚未抽到的卡牌，洗牌后从队首依次抽取 */
  let deck: string[] = $state([]);
  /** 当前展示的卡牌文字；尚未抽过时为 null */
  let currentCard: string | null = $state(null);
  /** 卡牌是否处于翻开（正面朝上）状态 */
  let isFlipped = $state(false);
  /** 动画进行中，屏蔽连点 */
  let isAnimating = $state(false);
  let loadError = $state("");

  const hasDrawn = $derived(deck.length < allCards.length);
  const isDeckEmpty = $derived(allCards.length > 0 && deck.length === 0);

  const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  onMount(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}cards.txt`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      allCards = parseCards(await response.text());
      deck = shuffle(allCards);
    } catch (error) {
      loadError = `卡牌数据加载失败：${error instanceof Error ? error.message : String(error)}`;
    }
  });

  /** 若卡牌正翻开着，先合上再继续 */
  async function closeCardIfOpen(): Promise<void> {
    if (!isFlipped) return;
    isFlipped = false;
    await delay(FLIP_CLOSE_MS);
  }

  /** 抽出下一张卡并翻开展示 */
  async function draw(): Promise<void> {
    if (isAnimating || deck.length === 0) return;
    isAnimating = true;

    await closeCardIfOpen();
    currentCard = deck[0];
    deck = deck.slice(1);
    isFlipped = true;
    await delay(FLIP_OPEN_MS);

    isAnimating = false;
  }

  /** 收回所有卡牌，重新洗牌开始新一轮 */
  async function reset(): Promise<void> {
    if (isAnimating) return;
    isAnimating = true;

    await closeCardIfOpen();
    currentCard = null;
    deck = shuffle(allCards);

    isAnimating = false;
  }
</script>

<main
  style:--flip-open="{FLIP_OPEN_MS}ms"
  style:--flip-close="{FLIP_CLOSE_MS}ms"
>
  <header>
    <h1>抽牌</h1>
    <p class="count">
      {#if allCards.length > 0}
        剩余 {deck.length} / {allCards.length} 张
      {:else if !loadError}
        加载中…
      {/if}
    </p>
  </header>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else}
    <div class="stage">
      <div class="lift" class:raised={isAnimating}>
        <div class="card" class:flipped={isFlipped}>
          <div class="face back">
            <span class="pattern">✦</span>
          </div>
          <div class="face front">
            <p>{currentCard}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      {#if isDeckEmpty}
        <button class="primary" onclick={reset} disabled={isAnimating}>
          重新洗牌
        </button>
      {:else}
        <button class="primary" onclick={draw} disabled={isAnimating}>
          抽一张
        </button>
        {#if hasDrawn}
          <button class="ghost" onclick={reset} disabled={isAnimating}>
            重置
          </button>
        {/if}
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 1.5rem;
    box-sizing: border-box;
  }

  header {
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-indent: 0.3em;
    color: #f0ecff;
  }

  .count {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: rgba(240, 236, 255, 0.55);
    min-height: 1.2em;
  }

  .error {
    color: #ff8080;
  }

  .stage {
    perspective: 1200px;
  }

  /*
   * 抬升层：翻牌期间沿 Z 轴抬起悬浮，结束后落回。
   * 与 .card 的旋转分属两个元素的 transform，互不干扰，均由 GPU 合成。
   */
  .lift {
    transform-style: preserve-3d;
    /* 落下：长尾 ease-out，轻轻放回桌面 */
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .lift.raised {
    transform: translateZ(70px);
    /* 抬起：快速利落地离开桌面 */
    transition: transform 0.25s cubic-bezier(0.3, 0.7, 0.4, 1);
  }

  .card {
    position: relative;
    width: min(72vw, 300px);
    aspect-ratio: 3 / 4.2;
    transform-style: preserve-3d;
    /* 合上：标准 ease-in-out，快速干脆 */
    transition: transform var(--flip-close) cubic-bezier(0.45, 0, 0.55, 1);
  }

  .card.flipped {
    transform: rotateY(180deg);
    /* 翻开：back-out 曲线，翻过头一点再弹回，更有翻实体牌的手感 */
    transition: transform var(--flip-open) cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }

  .back {
    background: radial-gradient(
        circle at 30% 20%,
        rgba(255, 255, 255, 0.12),
        transparent 50%
      ),
      linear-gradient(145deg, #4c3a8f, #2b2160);
    border: 2px solid rgba(255, 255, 255, 0.18);
  }

  .pattern {
    font-size: 3.5rem;
    color: rgba(255, 255, 255, 0.55);
    text-shadow: 0 0 24px rgba(255, 255, 255, 0.4);
  }

  .front {
    background: linear-gradient(160deg, #fdfbf7, #ece5d8);
    color: #2b2438;
    transform: rotateY(180deg);
    padding: 1.5rem;
    box-sizing: border-box;
  }

  .front p {
    margin: 0;
    font-size: clamp(1.05rem, 4.5vw, 1.3rem);
    line-height: 1.7;
    text-align: center;
    word-break: break-word;
  }

  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    min-height: 3.2rem;
  }

  button {
    font: inherit;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  button:active:not(:disabled) {
    transform: scale(0.96);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .primary {
    padding: 0.9rem 2.8rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #7c5cff, #5a3de0);
    box-shadow: 0 6px 20px rgba(108, 76, 240, 0.45);
  }

  .ghost {
    padding: 0.9rem 1.4rem;
    font-size: 0.95rem;
    color: rgba(240, 236, 255, 0.7);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
</style>
