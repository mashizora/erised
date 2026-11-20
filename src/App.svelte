<script lang="ts">
  import { onMount } from "svelte";
  import FlipCard, { type CardPhase } from "./lib/FlipCard.svelte";
  import { loadDeck, shuffle } from "./lib/deck";

  const FLIP_OPEN_MS = 480;
  const FLIP_CLOSE_MS = 210;
  const BURN_MS = 940;

  let deck = $state.raw<string[]>([]);
  let drawn = $state(0);
  let phase = $state<CardPhase>("idle");
  let loadError = $state("");
  let timer: ReturnType<typeof setTimeout>;

  const remaining = $derived(deck.length - drawn);
  const currentCard = $derived(drawn > 0 ? deck[drawn - 1] : null);

  onMount(() => {
    const controller = new AbortController();
    loadDeck(window.location.search, `${import.meta.env.BASE_URL}cards.txt`, controller.signal)
      .then((cards) => {
        if (!controller.signal.aborted) deck = shuffle(cards);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          loadError = `卡牌数据加载失败：${error instanceof Error ? error.message : String(error)}`;
        }
      });

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  });

  function advance() {
    if (remaining === 0) {
      deck = shuffle(deck);
      drawn = 0;
      phase = "idle";
      return;
    }

    drawn += 1;
    phase = "opening";
    timer = setTimeout(() => {
      phase = "idle";
    }, motionDuration(FLIP_OPEN_MS));
  }

  function motionDuration(ms: number) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
  }

  function handleDraw() {
    if (phase !== "idle" || deck.length === 0) return;
    if (drawn === 0) {
      advance();
      return;
    }

    if (remaining > 0) {
      if (motionDuration(BURN_MS) === 0) {
        advance();
        return;
      }
      phase = "burning";
      timer = setTimeout(advance, BURN_MS);
    } else {
      phase = "closing";
      timer = setTimeout(advance, motionDuration(FLIP_CLOSE_MS));
    }
  }
</script>

<main
  style:--flip-open="{FLIP_OPEN_MS}ms"
  style:--flip-close="{FLIP_CLOSE_MS}ms"
>
  <header>
    <h1>抽牌</h1>
    <p class="count">
      {#if deck.length > 0}
        剩余 <strong>{remaining}</strong> / {deck.length} 张
      {:else if !loadError}
        加载中…
      {/if}
    </p>
  </header>

  {#if loadError}
    <p class="error" role="alert">{loadError}</p>
  {:else}
    <FlipCard {currentCard} {phase} burnMs={BURN_MS} />
    <div class="actions">
      <button class="primary" onclick={handleDraw} disabled={deck.length === 0 || phase !== "idle"}>
        <span class="deck-icon" aria-hidden="true"></span>
        {deck.length > 0 && remaining === 0 ? "重新洗牌" : "抽一张"}
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100svh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(1.75rem, 4.8svh, 3rem);
    padding: 2rem 1.5rem;
  }

  header { text-align: center; }
  h1 {
    margin: 0;
    font: 600 clamp(2.25rem, 6vw, 3rem)/1.25 var(--serif);
    letter-spacing: .16em;
    text-indent: .16em;
    color: var(--paper);
  }

  .count {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: .35em;
    margin: .6rem 0 0;
    min-height: 1.5em;
    color: var(--muted);
    font-size: .9rem;
    font-variant-numeric: tabular-nums;
  }

  .count:not(:empty)::before, .count:not(:empty)::after {
    content: "";
    width: 1.65rem;
    height: 1px;
    margin: 0 .4rem;
    background: #a9a57b80;
  }

  .count strong { color: var(--gold); }
  .error { color: #ffccb8; text-align: center; }

  .primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .8em;
    min-width: 10.5rem;
    min-height: 3.15rem;
    padding: .7rem 1.8rem;
    border: 1px solid #f6db9f;
    border-radius: 999px;
    background: linear-gradient(150deg, #f3dca6, var(--gold) 70%, #d9b778);
    color: var(--ink);
    box-shadow: 0 4px 12px #061c254d;
    font: inherit;
    font-weight: 650;
    letter-spacing: .08em;
    transition: transform 140ms ease-out, box-shadow 140ms ease-out;
    cursor: pointer;
    touch-action: manipulation;
  }

  .deck-icon {
    position: relative;
    width: .65em;
    height: .9em;
    border: 1.4px solid currentColor;
    border-radius: 2px;
    transform: rotate(8deg);
  }

  .deck-icon::before {
    content: "";
    position: absolute;
    inset: .1em .2em -.2em -.28em;
    border: solid currentColor;
    border-width: 0 0 1.4px 1.4px;
    border-radius: 2px;
    transform: rotate(-12deg);
  }

  @media (hover: hover) {
    .primary:hover:enabled { transform: translateY(-2px); box-shadow: 0 7px 16px #061c2566; }
  }

  .primary:active:enabled { transform: translateY(1px); }
  .primary:focus-visible { outline: 2px solid var(--paper); outline-offset: 5px; }
  .primary:disabled { background: #c9bf9e; border-color: #c9bf9e; cursor: default; }

  @media (prefers-reduced-motion: reduce) {
    .primary { transition: none; }
    .primary:hover:enabled, .primary:active:enabled { transform: none; }
  }
</style>
