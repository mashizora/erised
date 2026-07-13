import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // 让 Svelte 组件的 <script lang="ts"> 经过 TypeScript 预处理
  preprocess: vitePreprocess(),
}
