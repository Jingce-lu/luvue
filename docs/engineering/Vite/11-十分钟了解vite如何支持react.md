# 十分钟了解 vite 如何支持 react

[[toc]]

## 前言

`vite` 是基于浏览器支持 `ESM` 模块，用以解决大型应用本地开发环境打包、热更新时间久的一套解决方案，目前已支持 `vue`、`react`、`Svelte`、`Solid` 等主流框架，相信不少同学已经开始使用 vite，并体验到“飞一般”的体验啦，下面我们来看看 vite 是如何支持 react 的吧

## 一、启动

首先从 github 上拉下 vite 的源码，做好准备工作

```sh
git clone https://github.com/vitejs/vite.git
cd vite
yarn
cd packages/vite
yarn build
yarn link
```

用脚手架搭建好 vite-react 项目

```sh
yarn create @vitejs/app my-react-app --template react
yarn link vite
yarn dev
```

加上 node 浏览器端调试 script

```js
"debug": "node --inspect-brk node_modules/vite/dist/node/cli.js"
```

启动服务，可以看到

<div align="center"><img :src="$withBase('/images/vite/vite1.awebp')" alt="vite/vite1.awebp"></div>

index.html 里比源码多了一块 `vite/clinet`、`@react/refresh` 的代码，另外 `script` 的 type 都是 `module` 类型，我们来根据源码分析下 vite 是如何做了这一层转化。

## 二、中间件（middleware）

vite 2.x 之后放弃了原先 1.x 的 koa 模型，采用 node 原生 http 模块+connect 的中间件模型，在请求 localhost 过程中首先会被 `connect-history-api-fallback` 重定向到 index.html，随后会进入到下一个中间件 `indexHtmlMiddleware`，这里实际是会执行 `createDevHtmlTransformFn` 函数

```ts
// packages\vite\src\node\server\middlewares\indexHtml.ts
export function createDevHtmlTransformFn(
  server: ViteDevServer
): (url: string, html: string, originalUrl: string) => Promise<string> {
  const [preHooks, postHooks] = resolveHtmlTransforms(server.config.plugins);

  return (url: string, html: string, originalUrl: string): Promise<string> => {
    return applyHtmlTransforms(html, [...preHooks, devHtmlHook, ...postHooks], {
      path: url,
      filename: getHtmlFilename(url, server),
      server,
      originalUrl,
    });
  };
}
```

这里会导出两个 hook，作用分别是

- devHtmlHook， 将@/vite/client.js 插入头部
- react-refresh， 将一堆 react-refresh 的代码插入头部

这里就解释了截图中的两端 `script` 从哪里来的，`@/vite/client.js` 简单来讲就是支持 `vite-hmr` 热更新的一些代码，而`@react-refresh` 是 vite 支持 react 的热更新插件代码

## 三、转换（transform）

从入口文件（index.htm)

```ts
// packages\vite\src\node\server\index.ts  文件转换的核心
middlewares.use(transformMiddleware(server));
```

```ts
// packages\vite\src\node\server\transformRequest.ts
export async function transformRequest(
  url
  { config, pluginContainer, moduleGraph, watcher }
  options
) {

  ...
  const loadResult = await pluginContainer.load(id, ssr)

  code = loadResult.code
  map = loadResult.map

  // 代码转换，调用一系列 plugin 做代码转换
  const transformStart = isDebug ? Date.now() : 0
  const transformResult = await pluginContainer.transform(code, id, map, ssr)

  code = transformResult.code!
  map = transformResult.map

  return (mod.transformResult = {
    code,
    map,
    etag: getEtag(code, { weak: true })
  } as TransformResult)

}
```

而 pluginContainer 的 transform 函数是会调用初始化时 vite 内置的一系列 plugin 对源码进行转换，以 src/main.jsx 文件为例，首先源码

```ts
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

会被标识名为 `vite:esbuild` 的 `plugin` 利用 `esbuild` 的内置 `apitransform`，将 jsx 语法转译成 `React.createElement`，算是替代了 `babel` 的一部分作用

```ts
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
ReactDOM.render(
  /* @__PURE__ */ React.createElement(
    React.StrictMode,
    null,
    /* @__PURE__ */ React.createElement(App, null)
  ),
  document.getElementById('root')
);
```

接着会进入标识名为 `vite:import-analysis` 的 plugin

> 原生 ES 引入不支持裸模块导入，Vite 将在服务的所有源文件中检测此类裸模块导入，预构建和重写导入合法 url

```ts
import { someMethod } from 'my-dep';
```

由于浏览器不支持直接的裸模块导入，所以需要将模块地址改写成真实的资源文件地址，`import-analysis` 使用了 `es-module-lexer` 这个包，去动态的分析当前代码中的 `import` 语法涉及的依赖，比如上面的 react、react-dom，解析成依赖文件所在的本地地址（/node_modules/.vite 文件夹），然后再调用内置的 `transformCjsImport` 函数，转换 `Commonjs` 类型包的 `import` 语句，比如

```ts
import React from 'react';
```

将会被转译成

```ts
import __vite__cjsImport0_react from '/node_modules/.vite/react.js?v=21227a2f';
const React = __vite__cjsImport0_react.__esModule
  ? __vite__cjsImport0_react.default
  : __vite__cjsImport0_react;
```

总感觉这部分在 webpack 中也有类似的实现，感兴趣的朋友也可以找找看，同时多啰嗦几句，vue3+也是一样的转换逻辑，只是针对单文件需要 `@vitejs/plugin-vue` 的支持

## 四、@vitejs/plugin-react-refresh

最后再讲下这个包，其实 `vite` 对 `react` 的支持主要还是用 `esbuild` 一部分得替代了原来 `@babel/preset-react` 的作用，另外一块就是封装了官方的 `react-refresh`，来支持 react 的热更新，下面，我们来看下它做了什么。

### 转码

实际上所有的文件资源都会被@react-refresh 处理一遍，所有 jsx 文件会被`@react-refresh`通过`@babel/core`转译一遍，不过只有真正需要热更新的 react 组件才会被输出

```ts
const result = transformSync(code, {
  babelrc: false,
  configFile: false,
  filename: id,
  parserOpts: {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    plugins: parserPlugins,
  },
  generatorOpts: {
    decoratorsBeforeExport: true,
  },
  plugins: [
    require('@babel/plugin-transform-react-jsx-self'),
    require('@babel/plugin-transform-react-jsx-source'),
    [require('react-refresh/babel'), { skipEnvCheck: true }],
  ],
  ast: !isReasonReact,
  sourceMaps: true,
  sourceFileName: id,
});

if (!/\$RefreshReg\$\(/.test(result.code)) {
  // 这里会用正则去分析，代码块是否是个需要热更新支持的 react component，否则就返回源码
  return code;
}
```

### 提供额外的运行时代码

```ts
// index.html 被插入这一串初始化代码
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
```

```ts
import { createHotContext as __vite__createHotContext } from '/@vite/client';
import.meta.hot = __vite__createHotContext('/src/App.jsx');
import RefreshRuntime from '/@react-refresh';
if (import.meta.hot) {
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, 'D:/xxx/vite-react/src/App.jsx ' + id);
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}

// 这里插入组件转换后的代码
if (import.meta.hot) {
  import.meta.hot.accept();
  if (!window.__vite_plugin_react_timeout) {
    window.__vite_plugin_react_timeout = setTimeout(() => {
      window.__vite_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}
```

`importAnalysis` 会在 jsx 文件上动态插入 `createHotContext` 的代码，`createHotContext`是 vite 提供的机制，用于缓存 `context`。

`RefreshRuntime.register` 是 `react-refresh` 提供的 api，用于注册组件，第二个参数是组件的文件路径加上 id，用于识别哪个组件需要被热替换。

`RefreshRuntime.performReactRefresh` 触发 react 渲染。

## 五、总结

我们来个图归纳下 vite 在支持 react 上做了哪些事吧

<div align="center"><img :src="$withBase('/images/vite/vite2.awebp')" alt="vite/vite2.awebp"></div>

其实在启动服务时，vite 会从入口文件起扫描一遍所有的依赖并进行预构建，并生成模块依赖 moduleGraph，类似于树状的形式，方便管理缓存
