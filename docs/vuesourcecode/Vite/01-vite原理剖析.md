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
const Koa = require("koa");
function createServer() {
  const app = new Koa();
  const root = process.cwd();
  // 构建上下文对象
  const context = {
    app,
    root
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
const { serveStaticPlugin } = require("./serverPluginServeStatic");
const resolvedPlugins = [serveStaticPlugin];
```

```js
const path = require("path");
function serveStaticPlugin({ app, root }) {
  // 以当前根目录作为静态目录
  app.use(require("koa-static")(root));
  // 以public目录作为根目录
  app.use(require("koa-static")(path.join(root, "public")));
}
exports.serveStaticPlugin = serveStaticPlugin;
```

> 让当前目录下的文件和 public 目录下的文件可以直接被访问

### 4.重写模块路径

```js
const { moduleRewritePlugin } = require("./serverPluginModuleRewrite");
const resolvedPlugins = [moduleRewritePlugin, serveStaticPlugin];
```

```js
const { readBody } = require("./utils");
const { parse } = require("es-module-lexer");
const MagicString = require("magic-string");
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
    if (ctx.body && ctx.response.is("js")) {
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
const { Readable } = require("stream");
async function readBody(stream) {
  if (stream instanceof Readable) {
    //
    return new Promise((resolve, reject) => {
      let res = "";
      stream.on("data", chunk => (res += chunk)).on("end", () => resolve(res));
    });
  } else {
    return stream.toString();
  }
}
exports.readBody = readBody;
```

### 5.解析 `/@modules` 文件

```js
const { moduleResolvePlugin } = require("./serverPluginModuleResolve");
const resolvedPlugins = [
  moduleRewritePlugin,
  moduleResolvePlugin,
  serveStaticPlugin
];
```

```js
const fs = require("fs").promises;
const path = require("path");
const { resolve } = require("path");
const moduleRE = /^\/@modules\//;
const { resolveVue } = require("./utils");
function moduleResolvePlugin({ app, root }) {
  const vueResolved = resolveVue(root);
  app.use(async (ctx, next) => {
    // 对 /@modules 开头的路径进行映射
    if (!moduleRE.test(ctx.path)) {
      return next();
    }
    // 去掉 /@modules/路径
    const id = ctx.path.replace(moduleRE, "");
    ctx.type = "js";
    const content = await fs.readFile(vueResolved[id], "utf8");
    ctx.body = content;
  });
}
exports.moduleResolvePlugin = moduleResolvePlugin;
```

> 将/@modules 开头的路径解析成对应的真实文件，返回给浏览器

```js
const path = require("path");
function resolveVue(root) {
  const compilerPkgPath = path.resolve(
    root,
    "node_modules",
    "@vue/compiler-sfc/package.json"
  );
  const compilerPkg = require(compilerPkgPath);
  // 编译模块的路径  node中编译
  const compilerPath = path.join(
    path.dirname(compilerPkgPath),
    compilerPkg.main
  );
  const resolvePath = name =>
    path.resolve(
      root,
      "node_modules",
      `@vue/${name}/dist/${name}.esm-bundler.js`
    );
  // dom运行
  const runtimeDomPath = resolvePath("runtime-dom");
  // 核心运行
  const runtimeCorePath = resolvePath("runtime-core");
  // 响应式模块
  const reactivityPath = resolvePath("reactivity");
  // 共享模块
  const sharedPath = resolvePath("shared");
  return {
    vue: runtimeDomPath,
    "@vue/runtime-dom": runtimeDomPath,
    "@vue/runtime-core": runtimeCorePath,
    "@vue/reactivity": reactivityPath,
    "@vue/shared": sharedPath,
    compiler: compilerPath
  };
}
```

> 编译的模块使用 `commonjs` 规范,其他文件均使用 `es6` 模块

### 6.处理 process 的问题

浏览器中并没有 process 变量，所以我们需要在 `html` 中注入 process 变量

```js
const { htmlRewritePlugin } = require("./serverPluginHtml");
const resolvedPlugins = [
  htmlRewritePlugin,
  moduleRewritePlugin,
  moduleResolvePlugin,
  serveStaticPlugin
];
```

```js
const { readBody } = require("./utils");
function htmlRewritePlugin({ root, app }) {
  const devInjection = `
    <script>
        window.process = {env:{NODE_ENV:'development'}}
    </script>
    `;
  app.use(async (ctx, next) => {
    await next();
    if (ctx.response.is("html")) {
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
const { vuePlugin } = require("./serverPluginVue");
const resolvedPlugins = [
  htmlRewritePlugin,
  moduleRewritePlugin,
  moduleResolvePlugin,
  vuePlugin,
  serveStaticPlugin
];
```

```js
const path = require("path");
const fs = require("fs").promises;
const { resolveVue } = require("./utils");
const defaultExportRE = /((?:^|\n|;)\s*)export default/;

function vuePlugin({ app, root }) {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith(".vue")) {
      return next();
    }
    // vue文件处理
    const filePath = path.join(root, ctx.path);
    const content = await fs.readFile(filePath, "utf8");
    // 获取文件内容
    let { parse, compileTemplate } = require(resolveVue(root).compiler);
    let { descriptor } = parse(content); // 解析文件内容
    if (!ctx.query.type) {
      let code = ``;
      if (descriptor.script) {
        let content = descriptor.script.content;
        let replaced = content.replace(defaultExportRE, "$1const __script =");
        code += replaced;
      }
      if (descriptor.template) {
        const templateRequest = ctx.path + `?type=template`;
        code += `\nimport { render as __render } from ${JSON.stringify(
          templateRequest
        )}`;
        code += `\n__script.render = __render`;
      }
      ctx.type = "js";
      code += `\nexport default __script`;
      ctx.body = code;
    }
    if (ctx.query.type == "template") {
      ctx.type = "js";
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
import { reactive } from "/@modules/vue";
const __script = {
  setup() {
    let state = reactive({ count: 0 });
    function click() {
      state.count += 1;
    }
    return {
      state,
      click
    };
  }
};
import { render as __render } from "/src/App.vue?type=template";
__script.render = __render;
export default __script;
```

```js
import {
  toDisplayString as _toDisplayString,
  createVNode as _createVNode,
  Fragment as _Fragment,
  openBlock as _openBlock,
  createBlock as _createBlock
} from "/@modules/vue";

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createBlock(
      _Fragment,
      null,
      [
        _createVNode(
          "div",
          null,
          "计数器:" + _toDisplayString(_ctx.state.count),
          1 /* TEXT */
        ),
        _createVNode(
          "button",
          {
            onClick: _cache[1] || (_cache[1] = $event => _ctx.click($event))
          },
          "+"
        )
      ],
      64 /* STABLE_FRAGMENT */
    )
  );
}
```

> 解析后的结果可以直接在 `createApp` 方法中进行使用

### 8.热更新原理
