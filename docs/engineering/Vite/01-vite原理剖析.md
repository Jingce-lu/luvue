# vite 原理剖析

[[toc]]

## 一.什么是 Vite？

法语 Vite（轻量，轻快）`vite` 是一个基于 `Vue3` 单文件组件的非打包开发服务器，它做到了本地快速开发启动, 实现按需编译，不再等待整个应用编译完成

> 面向现代浏览器，基于原生模块系统 `ESModule` 实现。`webpack` 的开发环境很慢（开发时需要进行编译放到内存中）

## 二.vite 的实现原理

我们先来总结下 Vite 的实现原理，`vite` 在浏览器端使用 `export import` 的方式导入和导出模块，同时实现了按需加载。vite 高度依赖 module script 特性

**过程如下**:

- 在 `koa` 中间件里获取请求 body
- 通过 [es-module-lexer](https://www.npmjs.com/package/es-module-lexer) 解析资源 `ast` 拿到 `import` 的内容
- 判断 `import` 的资源是否是 `npm` 模块
- 返回处理后的资源路径：`"vue" => "/@modules/vue"`

将处理的 template,script,style 等所需的依赖以 `http` 请求的形式，通过 query 参数形式区分并加载 `SFC` 文件各个模块内容。

## 三.手把手实现 vite

### 1.安装依赖

```sh
npm install es-module-lexer koa koa-static magic-string
```

- `koa`、`koa-static` `vite`内部使用 `koa` 进行编写
- `es-module-lexer` 分析 `ES6import` 语法
- `magic-string` 实现重写字符串内容

### 2.基本结构搭建

```js
const Koa = require('koa');
function createServer() {
  const app = new Koa();
  const root = process.cwd();
  // 构建上下文对象
  const context = {
    app,
    root,
  };
  app.use((ctx, next) => {
    // 扩展ctx属性
    Object.assign(ctx, context);
    return next();
  });
  const resolvedPlugins = [];
  // 依次注册所有插件
  resolvedPlugins.forEach(plugin => plugin(context));
  return app;
}
createServer().listen(4000);
```

### 3.静态服务配置

```js
const { serveStaticPlugin } = require('./serverPluginServeStatic');
const resolvedPlugins = [serveStaticPlugin];
```

```js
const path = require('path');
function serveStaticPlugin({ app, root }) {
  // 以当前根目录作为静态目录
  app.use(require('koa-static')(root));
  // 以public目录作为根目录
  app.use(require('koa-static')(path.join(root, 'public')));
}
exports.serveStaticPlugin = serveStaticPlugin;
```

> 让当前目录下的文件和 public 目录下的文件可以直接被访问

### 4.重写模块路径

```js
const { moduleRewritePlugin } = require('./serverPluginModuleRewrite');
const resolvedPlugins = [moduleRewritePlugin, serveStaticPlugin];
```

```js
const { readBody } = require('./utils');
const { parse } = require('es-module-lexer');
const MagicString = require('magic-string');
function rewriteImports(source) {
  let imports = parse(source)[0];
  const magicString = new MagicString(source);
  if (imports.length) {
    for (let i = 0; i < imports.length; i++) {
      const { s, e } = imports[i];
      let id = source.substring(s, e);
      if (/^[^\/\.]/.test(id)) {
        id = `/@modules/${id}`;
        // 修改路径增加 /@modules 前缀
        magicString.overwrite(s, e, id);
      }
    }
  }
  return magicString.toString();
}
function moduleRewritePlugin({ app, root }) {
  app.use(async (ctx, next) => {
    await next();
    // 对类型是js的文件进行拦截
    if (ctx.body && ctx.response.is('js')) {
      // 读取文件中的内容
      const content = await readBody(ctx.body);
      // 重写import中无法识别的路径
      const r = rewriteImports(content);
      ctx.body = r;
    }
  });
}
exports.moduleRewritePlugin = moduleRewritePlugin;
```

> 对 `js` 文件中的 `import` 语法进行路径的重写，改写后的路径会再次向服务器拦截请求

**读取文件内容**

```js
const { Readable } = require('stream');
async function readBody(stream) {
  if (stream instanceof Readable) {
    //
    return new Promise((resolve, reject) => {
      let res = '';
      stream.on('data', chunk => (res += chunk)).on('end', () => resolve(res));
    });
  } else {
    return stream.toString();
  }
}
exports.readBody = readBody;
```

### 5.解析 `/@modules` 文件

```js
const { moduleResolvePlugin } = require('./serverPluginModuleResolve');
const resolvedPlugins = [moduleRewritePlugin, moduleResolvePlugin, serveStaticPlugin];
```

```js
const fs = require('fs').promises;
const path = require('path');
const { resolve } = require('path');
const moduleRE = /^\/@modules\//;
const { resolveVue } = require('./utils');
function moduleResolvePlugin({ app, root }) {
  const vueResolved = resolveVue(root);
  app.use(async (ctx, next) => {
    // 对 /@modules 开头的路径进行映射
    if (!moduleRE.test(ctx.path)) {
      return next();
    }
    // 去掉 /@modules/路径
    const id = ctx.path.replace(moduleRE, '');
    ctx.type = 'js';
    const content = await fs.readFile(vueResolved[id], 'utf8');
    ctx.body = content;
  });
}
exports.moduleResolvePlugin = moduleResolvePlugin;
```

> 将/@modules 开头的路径解析成对应的真实文件，返回给浏览器

```js
const path = require('path');
function resolveVue(root) {
  const compilerPkgPath = path.resolve(root, 'node_modules', '@vue/compiler-sfc/package.json');
  const compilerPkg = require(compilerPkgPath);
  // 编译模块的路径  node中编译
  const compilerPath = path.join(path.dirname(compilerPkgPath), compilerPkg.main);
  const resolvePath = name =>
    path.resolve(root, 'node_modules', `@vue/${name}/dist/${name}.esm-bundler.js`);
  // dom运行
  const runtimeDomPath = resolvePath('runtime-dom');
  // 核心运行
  const runtimeCorePath = resolvePath('runtime-core');
  // 响应式模块
  const reactivityPath = resolvePath('reactivity');
  // 共享模块
  const sharedPath = resolvePath('shared');
  return {
    vue: runtimeDomPath,
    '@vue/runtime-dom': runtimeDomPath,
    '@vue/runtime-core': runtimeCorePath,
    '@vue/reactivity': reactivityPath,
    '@vue/shared': sharedPath,
    compiler: compilerPath,
  };
}
```

> 编译的模块使用 `commonjs` 规范,其他文件均使用 `es6` 模块

### 6.处理 process 的问题

浏览器中并没有 process 变量，所以我们需要在 `html` 中注入 process 变量

```js
const { htmlRewritePlugin } = require('./serverPluginHtml');
const resolvedPlugins = [
  htmlRewritePlugin,
  moduleRewritePlugin,
  moduleResolvePlugin,
  serveStaticPlugin,
];
```

```js
const { readBody } = require('./utils');
function htmlRewritePlugin({ root, app }) {
  const devInjection = `
    <script>
        window.process = {env:{NODE_ENV:'development'}}
    </script>
    `;
  app.use(async (ctx, next) => {
    await next();
    if (ctx.response.is('html')) {
      const html = await readBody(ctx.body);
      ctx.body = html.replace(/<head>/, `$&${devInjection}`);
    }
  });
}
exports.htmlRewritePlugin = htmlRewritePlugin;
```

> 在 `html` 的 `head` 标签中注入脚本

### 7.处理`.vue`后缀文件

```js
const { vuePlugin } = require('./serverPluginVue');
const resolvedPlugins = [
  htmlRewritePlugin,
  moduleRewritePlugin,
  moduleResolvePlugin,
  vuePlugin,
  serveStaticPlugin,
];
```

```js
const path = require('path');
const fs = require('fs').promises;
const { resolveVue } = require('./utils');
const defaultExportRE = /((?:^|\n|;)\s*)export default/;

function vuePlugin({ app, root }) {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.vue')) {
      return next();
    }
    // vue文件处理
    const filePath = path.join(root, ctx.path);
    const content = await fs.readFile(filePath, 'utf8');
    // 获取文件内容
    let { parse, compileTemplate } = require(resolveVue(root).compiler);
    let { descriptor } = parse(content); // 解析文件内容
    if (!ctx.query.type) {
      let code = ``;
      if (descriptor.script) {
        let content = descriptor.script.content;
        let replaced = content.replace(defaultExportRE, '$1const __script =');
        code += replaced;
      }
      if (descriptor.template) {
        const templateRequest = ctx.path + `?type=template`;
        code += `\nimport { render as __render } from ${JSON.stringify(templateRequest)}`;
        code += `\n__script.render = __render`;
      }
      ctx.type = 'js';
      code += `\nexport default __script`;
      ctx.body = code;
    }
    if (ctx.query.type == 'template') {
      ctx.type = 'js';
      let content = descriptor.template.content;
      const { code } = compileTemplate({ source: content });
      ctx.body = code;
    }
  });
}
exports.vuePlugin = vuePlugin;
```

> 在后端将.vue 文件进行解析成如下结果

```js
import { reactive } from '/@modules/vue';
const __script = {
  setup() {
    let state = reactive({ count: 0 });
    function click() {
      state.count += 1;
    }
    return {
      state,
      click,
    };
  },
};
import { render as __render } from '/src/App.vue?type=template';
__script.render = __render;
export default __script;
```

```js
import {
  toDisplayString as _toDisplayString,
  createVNode as _createVNode,
  Fragment as _Fragment,
  openBlock as _openBlock,
  createBlock as _createBlock,
} from '/@modules/vue';

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createBlock(
      _Fragment,
      null,
      [
        _createVNode('div', null, '计数器:' + _toDisplayString(_ctx.state.count), 1 /* TEXT */),
        _createVNode(
          'button',
          {
            onClick: _cache[1] || (_cache[1] = $event => _ctx.click($event)),
          },
          '+'
        ),
      ],
      64 /* STABLE_FRAGMENT */
    )
  );
}
```

> 解析后的结果可以直接在 `createApp` 方法中进行使用

### 8.热更新(Hot Module Reload)原理

Vite 的热加载原理，其实就是在客户端与服务端建立了一个 websocket 链接，当代码被修改时，服务端发送消息通知客户端去请求修改模块的代码，完成热更新。

**服务端原理**

服务端做的就是监听代码文件的改变，在合适的时机向客户端发送 websocket 信息通知客户端去请求新的模块代码。

**客户端原理**

Vite 的 websocket 相关代码在 处理 html 中时被写入代码中。

```js
export const clientPublicPath = `/vite/client`;

const devInjectionCode = `\n<script type="module">import "${clientPublicPath}"</script>\n`;

async function rewriteHtml(importer: string, html: string) {
  return injectScriptToHtml(html, devInjectionCode);
}
```

当 request.path 路径是 `/vite/client` 时，请求得到对应的客户端代码，因此在客户端中我们创建了一个 websocket 服务并与服务端建立了连接。
Vite 会接受到来自客户端的消息。通过不同的消息触发一些事件。做到浏览器端的即时热模块更换（热更新）。

```js
// Listen for messages
socket.addEventListener('message', async ({ data }) => {
  const payload = JSON.parse(data) as HMRPayload | MultiUpdatePayload
  if (payload.type === 'multi') {
    payload.updates.forEach(handleMessage)
  } else {
    handleMessage(payload)
  }
})
async function handleMessage(payload: HMRPayload) {
  const { path, changeSrcPath, timestamp } = payload as UpdatePayload
  console.log(path)
  switch (payload.type) {
    case 'connected':
      console.log(`[vite] connected.`)
      break
    case 'vue-reload':
      queueUpdate(
        import(`${path}?t=${timestamp}`)
          .catch((err) => warnFailedFetch(err, path))
          .then((m) => () => {
            __VUE_HMR_RUNTIME__.reload(path, m.default)
            console.log(`[vite] ${path} reloaded.`)
          })
      )
      break
    case 'vue-rerender':
      const templatePath = `${path}?type=template`
      import(`${templatePath}&t=${timestamp}`).then((m) => {
        __VUE_HMR_RUNTIME__.rerender(path, m.render)
        console.log(`[vite] ${path} template updated.`)
      })
      break
    case 'style-update':
      // check if this is referenced in html via <link>
      const el = document.querySelector(`link[href*='${path}']`)
      if (el) {
        el.setAttribute(
          'href',
          `${path}${path.includes('?') ? '&' : '?'}t=${timestamp}`
        )
        break
      }
      // imported CSS
      const importQuery = path.includes('?') ? '&import' : '?import'
      await import(`${path}${importQuery}&t=${timestamp}`)
      console.log(`[vite] ${path} updated.`)
      break
    case 'style-remove':
      removeStyle(payload.id)
      break
    case 'js-update':
      queueUpdate(updateModule(path, changeSrcPath, timestamp))
      break
    case 'custom':
      const cbs = customUpdateMap.get(payload.id)
      if (cbs) {
        cbs.forEach((cb) => cb(payload.customData))
      }
      break
    case 'full-reload':
      if (path.endsWith('.html')) {
        // if html file is edited, only reload the page if the browser is
        // currently on that page.
        const pagePath = location.pathname
        if (
          pagePath === path ||
          (pagePath.endsWith('/') && pagePath + 'index.html' === path)
        ) {
          location.reload()
        }
        return
      } else {
        location.reload()
      }
  }
}
```

## Vite 热更新的实现

我们知道，如果要实现热更新，那么就需要浏览器和服务器建立某种通信机制，这样浏览器才能收到通知进行热更新。Vite 的是通过 `WebSocket` 来实现的热更新通信。

### 客户端

客户端的代码在 `src/client/client.ts`，主要是创建 `WebSocket` 客户端，监听来自服务端的 `HMR` 消息推送。

Vite 的 `WS` 客户端目前监听这几种消息：

- `connected`: WebSocket 连接成功
- `vue-reload`: Vue 组件重新加载（当你修改了 script 里的内容时）
- `vue-rerender`: Vue 组件重新渲染（当你修改了 template 里的内容时）
- `style-update`: 样式更新
- `style-remove`: 样式移除
- `js-update`: js 文件更新
- `full-reload`: fallback 机制，网页重刷新

其中针对 Vue 组件本身的一些更新，都可以直接调用 `HMRRuntime` 提供的方法，非常方便。其余的更新逻辑，基本上都是利用了 `timestamp` 刷新缓存重新执行的方法来达到更新的目的。
核心逻辑如下，我感觉非常清晰明了：

```js
import { HMRRuntime } from 'vue'; // 来自 Vue3.0 的 HMRRuntime

console.log('[vite] connecting...');

declare var __VUE_HMR_RUNTIME__: HMRRuntime;

const socket = new WebSocket(`ws://${location.host}`);

// Listen for messages
socket.addEventListener('message', ({ data }) => {
  const { type, path, id, index, timestamp, customData } = JSON.parse(data);
  switch (type) {
    case 'connected':
      console.log(`[vite] connected.`);
      break;
    case 'vue-reload':
      import(`${path}?t=${timestamp}`).then(m => {
        __VUE_HMR_RUNTIME__.reload(path, m.default);
        console.log(`[vite] ${path} reloaded.`); // 调用 HMRRUNTIME 的方法更新
      });
      break;
    case 'vue-rerender':
      import(`${path}?type=template&t=${timestamp}`).then(m => {
        __VUE_HMR_RUNTIME__.rerender(path, m.render);
        console.log(`[vite] ${path} template updated.`); // 调用 HMRRUNTIME 的方法更新
      });
      break;
    case 'style-update':
      updateStyle(id, `${path}?type=style&index=${index}&t=${timestamp}`); // 重新加载 style 的 URL
      console.log(`[vite] ${path} style${index > 0 ? `#${index}` : ``} updated.`);
      break;
    case 'style-remove':
      const link = document.getElementById(`vite-css-${id}`);
      if (link) {
        document.head.removeChild(link); // 删除 style
      }
      break;
    case 'js-update':
      const update = jsUpdateMap.get(path);
      if (update) {
        update(timestamp); // 用新的时间戳加载并执行 js，达到更新的目的
        console.log(`[vite]: js module reloaded: `, path);
      } else {
        console.error(
          `[vite] got js update notification but no client callback was registered. Something is wrong.`
        );
      }
      break;
    case 'custom':
      const cbs = customUpdateMap.get(id);
      if (cbs) {
        cbs.forEach(cb => cb(customData));
      }
      break;
    case 'full-reload':
      location.reload();
  }
});
```

### 服务端

服务端的实现位于 `src/node/serverPluginHmr.ts`。核心是监听项目文件的变更，然后根据不同文件类型（目前只有 `vue` 和 `js`）来做不同的处理：

```js
watcher.on('change', async file => {
  const timestamp = Date.now(); // 更新时间戳
  if (file.endsWith('.vue')) {
    handleVueReload(file, timestamp);
  } else if (file.endsWith('.js')) {
    handleJSReload(file, timestamp);
  }
});
```

对于 `Vue` 文件的热更新而言，主要是重新编译 Vue 文件，检测 `template 、script 、style` 的改动，如果有改动就通过 `WS` 服务端发起对应的热更新请求。

简单的源码分析如下：

```js
async function handleVueReload(file: string, timestamp: number = Date.now(), content?: string) {
  const publicPath = resolver.fileToRequest(file); // 获取文件的路径
  const cacheEntry = vueCache.get(file); // 获取缓存里的内容

  debugHmr(`busting Vue cache for ${file}`);
  vueCache.del(file); // 发生变动了因此之前的缓存可以删除

  const descriptor = await parseSFC(root, file, content); // 编译 Vue 文件

  const prevDescriptor = cacheEntry && cacheEntry.descriptor; // 获取前一次的缓存

  if (!prevDescriptor) {
    // 这个文件之前从未被访问过（本次是第一次访问），也就没必要热更新
    return;
  }

  // 设置两个标志位，用于判断是需要 reload 还是 rerender
  let needReload = false;
  let needRerender = false;

  // 如果 script 部分不同则需要 reload
  if (!isEqual(descriptor.script, prevDescriptor.script)) {
    needReload = true;
  }

  // 如果 template 部分不同则需要 rerender
  if (!isEqual(descriptor.template, prevDescriptor.template)) {
    needRerender = true;
  }

  const styleId = hash_sum(publicPath);
  // 获取之前的 style 以及下一次（或者说热更新）的 style
  const prevStyles = prevDescriptor.styles || [];
  const nextStyles = descriptor.styles || [];

  // 如果不需要 reload，则查看是否需要更新 style
  if (!needReload) {
    nextStyles.forEach((_, i) => {
      if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
        send({
          type: 'style-update',
          path: publicPath,
          index: i,
          id: `${styleId}-${i}`,
          timestamp,
        });
      }
    });
  }

  // 如果 style 标签及内容删掉了，则需要发送 `style-remove` 的通知
  prevStyles.slice(nextStyles.length).forEach((_, i) => {
    send({
      type: 'style-remove',
      path: publicPath,
      id: `${styleId}-${i + nextStyles.length}`,
      timestamp,
    });
  });

  // 如果需要 reload 发送 `vue-reload` 通知
  if (needReload) {
    send({
      type: 'vue-reload',
      path: publicPath,
      timestamp,
    });
  } else if (needRerender) {
    // 否则发送 `vue-rerender` 通知
    send({
      type: 'vue-rerender',
      path: publicPath,
      timestamp,
    });
  }
}
```

对于热更新 `js` 文件而言，会递归地查找引用这个文件的 `importer`。比如是某个 `Vue` 文件所引用了这个 js，就会被查找出来。假如最终发现找不到引用者，则会返回 `hasDeadEnd: true`。

```js
const vueImporters = new Set<string>() // 查找并存放需要热更新的 Vue 文件
const jsHotImporters = new Set<string>() // 查找并存放需要热更新的 js 文件
const hasDeadEnd = walkImportChain(
  publicPath,
  importers,
  vueImporters,
  jsHotImporters
)
```

如果 `hasDeadEnd` 为 `true`，则直接发送 `full-reload`。如果 `vueImporters`或 `jsHotImporters` 里查找到需要热更新的文件，则发起热更新通知：

```js
if (hasDeadEnd) {
  send({
    type: 'full-reload',
    timestamp,
  });
} else {
  vueImporters.forEach(vueImporter => {
    send({
      type: 'vue-reload',
      path: vueImporter,
      timestamp,
    });
  });
  jsHotImporters.forEach(jsImporter => {
    send({
      type: 'js-update',
      path: jsImporter,
      timestamp,
    });
  });
}
```

### 客户端逻辑的注入

写到这里，还有一个问题是，我们在自己的代码里并没有引入 `HRM` 的 `client` 代码，Vite 是如何把 client 代码注入的呢？

回到上面的一张图，Vite 重写 App.vue 文件的内容并返回时：

<div align="center"><img :src="$withBase('/images/vite/vite66.awebp')" alt="vite/vite66.awebp"></div>

注意这张图里的代码区第一句话 `import { updateStyle } from '/@hmr'`，并且在左侧请求列表中也有一个对 `@hmr` 文件的请求。这个请求是啥呢？

<div align="center"><img :src="$withBase('/images/vite/vite67.awebp')" alt="vite/vite67.awebp"></div>

可以发现，这个请求就是上面说的客户端逻辑的 `client.ts` 的内容。

在 `src/node/serverPluginHmr.ts` 里，有针对 `@hmr` 文件的解析处理：

```ts
export const hmrClientFilePath = path.resolve(__dirname, './client.js');
export const hmrClientId = '@hmr';
export const hmrClientPublicPath = `/${hmrClientId}`;

app.use(async (ctx, next) => {
  if (ctx.path !== hmrClientPublicPath) {
    // 请求路径如果不是 @hmr 就跳过
    return next();
  }
  debugHmr('serving hmr client');
  ctx.type = 'js';
  await cachedRead(ctx, hmrClientFilePath); // 返回 client.js 的内容
});
```
