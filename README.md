# 抽牌

用于聚会的随机抽牌网页，使用 Svelte 5、TypeScript 和 Vite 实现。

## 自定义牌组

默认读取 `public/cards.txt`。可以通过 URL 查询参数 `deck` 传入自定义牌组：

```text
https://你的站点/?deck=<牌组文件内容的 Base64>
```

牌组文件为 **UTF-8 纯文本**，每行一张牌，忽略空行与首尾空白。传入的是文件内容的编码，不是文件名或文件地址。支持标准 Base64 和 Base64URL。

使用 Node.js 从本地文件生成链接（将文件路径和站点地址替换为实际值）：

```js
import { readFileSync } from "node:fs";

const url = new URL("https://你的站点/");
url.searchParams.set("deck", readFileSync("my-cards.txt").toString("base64"));
console.log(url.href);
```

用 `URLSearchParams` 自动转义参数；手动拼接标准 Base64 时请使用 `encodeURIComponent`。

存在 `deck` 参数时只使用自定义牌组，抽完后重新洗牌也沿用该牌组。参数格式错误、不是有效 UTF-8 或牌组为空时，页面显示错误；移除参数即可使用默认牌组。牌组直接包含在链接中，适合较短的文本牌组，较大的文件可能超过浏览器或托管平台的 URL 长度限制。

## 本地开发

```sh
npm install
npm run dev
npm run check
npm run build
```

---

## Vite 模板说明

This template should help get you started developing with Svelte in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
