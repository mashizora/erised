<script module lang="ts">
  export type CardPhase = "idle" | "opening" | "burning" | "closing";
</script>

<script lang="ts">
  import { createBurnPattern } from "./burn-pattern";

  let { currentCard, phase, remaining, total, burnMs }: {
    currentCard: string | null;
    phase: CardPhase;
    remaining: number;
    total: number;
    burnMs: number;
  } = $props();
  const isBurning = $derived(phase === "burning");
  // 初始、燃烧和重洗时，中央牌背已经占用一张待抽牌。
  const cardsBelow = $derived(Math.max(0, remaining - (currentCard === null || isBurning || phase === "closing" ? 1 : 0)));
  // 最后三张逐张露边；更厚的牌堆按整副牌的大小压缩到最多十二道纸边。
  const fullStack = $derived(Math.max(0, total - 1));
  const edgeDepth = $derived(cardsBelow <= 3 ? cardsBelow :
    3 + (cardsBelow - 3) * (Math.min(12, fullStack) - 3) / (fullStack - 3));
  const id = $props.id();
</script>

{#snippet cardBack()}
  <div class="face back" aria-hidden="true">
    <div class="frame">
      <span class="corner">✧</span>
      <div class="dial">
        <span class="orbit"></span>
        <span class="star"></span>
      </div>
      <span class="corner opposite">✧</span>
    </div>
  </div>
{/snippet}

<div class="stage">
  <div class="stack" aria-hidden="true">
    {#each { length: Math.ceil(edgeDepth) } as _, i}
      <div class="edge" style:--depth={Math.min(i + 1, edgeDepth)} style:z-index={-i}></div>
    {/each}
  </div>
  <div class="top-card">
    {#if isBurning}
      {@render cardBack()}
    {/if}
    <div class="card" class:flipped={currentCard !== null && phase !== "closing"} class:opening={phase === "opening"}>
      {@render cardBack()}
      <div class="face front" aria-live="polite" style:clip-path={isBurning ? `url(#${id}-paper)` : undefined}>
        {#key remaining}<p>{currentCard}</p>{/key}
      </div>
    </div>
    {#if isBurning}
      {@const burn = createBurnPattern()}
      {@const duration = `${burnMs}ms`}
      <svg class="burn" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <!-- 锯齿轮廓同时裁切纸面、绘制焦边，两者沿同一路径移动。 -->
          <path id="{id}-edge" d={burn.paths[0]}>
            <animate attributeName="d" values={burn.paths.join(";")} dur={duration} fill="freeze"/>
          </path>
          <clipPath id="{id}-paper" clipPathUnits="objectBoundingBox">
            <use href="#{id}-edge"/>
          </clipPath>
          <filter id="{id}-char" filterUnits="userSpaceOnUse" x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="52 68" numOctaves="2" seed={burn.grainSeed} result="grain"/>
            <feDisplacementMap in="SourceGraphic" in2="grain" scale=".023" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <g fill="none" stroke-linejoin="round" filter="url(#{id}-char)">
          <use href="#{id}-edge" stroke="#603a21" stroke-width=".045"/>
          <use href="#{id}-edge" stroke="#301f1a" stroke-width=".031"/>
          <use href="#{id}-edge" stroke="#f1772d" stroke-width=".015"/>
          <use href="#{id}-edge" stroke="#ffe198" stroke-width=".005"/>
        </g>
        <g class="embers" fill="#ffb75d" style:animation-duration={duration}>
          {#each burn.embers as ember}
            <circle cx={ember.x} r={ember.radius}>
              <animate attributeName="cy" values={ember.heights} dur={duration} fill="freeze"/>
            </circle>
          {/each}
        </g>
      </svg>
    {/if}
  </div>
</div>

<style>
  .stage {
    width: min(68vw, 270px, max(180px, 36svh));
    aspect-ratio: 5 / 7;
    position: relative;
    isolation: isolate;
    perspective: 1000px;
    --radius: 15px;
    --foil: #dfc184;
  }

  .stack {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }

  .edge {
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
    background: #365447;
    border: 1px solid #af9e7b;
    transform: translate(calc(var(--depth) * 1px), calc(var(--depth) * 1.8px));
  }

  .edge:last-child { box-shadow: 0 8px 18px #051e2066; }

  .top-card, .card {
    position: relative;
    height: 100%;
    transform-style: preserve-3d;
  }

  .card { transition: transform var(--flip-close) cubic-bezier(.42,0,.65,1); }
  .card.flipped { transform: rotateY(180deg); }
  .card.opening { animation: reveal var(--flip-open) cubic-bezier(.22,.73,.23,1.04); }
  @keyframes reveal {
    from { transform: rotateY(0); }
    to { transform: rotateY(180deg); }
  }

  .burn {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: var(--radius);
    overflow: hidden;
    pointer-events: none;
    transform: translateZ(1px);
  }

  .embers { animation: drift ease-out both; }
  @keyframes drift {
    from { opacity: 0; transform: translateY(.025px); }
    35% { opacity: 1; }
    to { opacity: 0; transform: translate(.035px, -.02px); }
  }

  .face {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border-radius: var(--radius);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 8px 18px #091d2540;
  }

  .back {
    padding: 8px;
    border: 1px solid var(--foil);
    color: var(--foil);
    background:
      repeating-linear-gradient(45deg, transparent 0 3px, #eadab807 3px 4px),
      linear-gradient(135deg, #275447, #173b36 62%, #274b40);
  }

  .frame {
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid #c3aa7280;
    border-radius: 9px;
    background:
      radial-gradient(ellipse 78% 41% at 50% -13%, transparent 98%, #c3aa7270 99%, transparent 100%),
      radial-gradient(ellipse 78% 41% at 50% 113%, transparent 98%, #c3aa7270 99%, transparent 100%);
  }

  .corner {
    position: absolute;
    top: .25em;
    left: .45em;
    font: 1.4rem/1.2 Georgia, serif;
  }

  .opposite { inset: auto .45em .25em auto; }
  .dial {
    position: relative;
    display: grid;
    place-items: center;
    width: 65%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid #d7bc827a;
    background: repeating-conic-gradient(from -.4deg, #dbc28cbf 0 .8deg, transparent 1deg 7.5deg);
  }

  .dial::before {
    content: "";
    position: absolute;
    inset: 5%;
    border: 1px solid #ccb07c99;
    border-radius: 50%;
    background: radial-gradient(circle, #355649, #1b4039 75%);
  }

  .orbit {
    position: absolute;
    inset: 16%;
    border: 1px dashed #ccb07c77;
    border-radius: 50%;
  }

  .star {
    width: 64%;
    aspect-ratio: 1;
    background: conic-gradient(from 0deg, #f4dea4, #b49057 12%, #eed39a 25%, #aa8756 38%, #f4dea4 50%, #b49057 62%, #eed39a 75%, #aa8756 87%, #f4dea4);
    clip-path: polygon(50% 0, 55% 37%, 75% 25%, 63% 45%, 100% 50%, 63% 55%, 75% 75%, 55% 63%, 50% 100%, 45% 63%, 25% 75%, 37% 55%, 0 50%, 37% 45%, 25% 25%, 45% 37%);
  }

  .front {
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    place-items: center;
    container-type: inline-size;
    padding: 2rem 1.35rem;
    overflow: hidden;
    color: var(--ink);
    background: linear-gradient(145deg, #fff8e8, var(--paper) 65%, #e7ddc4);
    border: 1px solid #d4be91;
    transform: rotateY(180deg);
  }

  .front::before {
    content: "";
    position: absolute;
    inset: 8px;
    border: 1px solid #b1a07e8c;
    border-radius: 8px;
    pointer-events: none;
  }

  .front::after {
    content: "✧";
    position: absolute;
    bottom: .65rem;
    color: #80673e;
  }

  .front p {
    margin: 0;
    min-height: 0;
    max-height: 100%;
    max-width: 100%;
    overflow: auto;
    overflow-wrap: anywhere;
    color-scheme: light;
    font: 500 clamp(.9375rem, 8.5cqi, 1.1875rem)/1.6 var(--sans);
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .card, .card.flipped { transition: none; }
    .card.opening, .embers { animation: none; }
    .burn { visibility: hidden; }
  }
</style>
