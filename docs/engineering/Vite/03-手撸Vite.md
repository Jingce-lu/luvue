# 手撸 Vite，揭开 Vite 神秘面纱

[[toc]]

## Webpack 的问题

大家熟悉的 webpack 在开发时需要启动本地开发服务器实时预览。因为需要对整个项目文件进行打包，开发时启动速度会随着项目规模扩大越来越缓慢。对于开发时文件修改后的热更新也存在同样的问题。

<div align="center"><img :src="$withBase('/images/vite/vite20.awebp')" alt="vite/vite20.awebp"></div>

## Vite 另辟蹊径

`Vite` 则很好地解决了上面的两个问题。启动一台开发服务器，并不对文件代码打包，根据客户端的请求加载需要的模块处理，**实现真正的按需加载**。对于文件更新，Vite 的 HMR 是在原生 ESM 上执行的。只需要精确地使已编辑的模块与其最近的 HMR 边界之间的链失效（大多数时候只需要模块本身），使 HMR 更新始终快速，无论应用的大小。真正的想吃什么就给什么！

<div align="center"><img :src="$withBase('/images/vite/vite21.awebp')" alt="vite/vite21.awebp"></div>

## Vite 工作原理

神奇魔法如何实现？秘诀是 Vite 利用了浏览器 [native ES module imports](https://caniuse.com/#feat=es6-module) 特性，使用 ES 方式组织代码，浏览器自动请求需要的文件，并在服务端按需编译返回，完全跳过了打包过程。关键变化是 `index.html` 中的入口文件导入方式

<div align="center"><img :src="$withBase('/images/vite/vite22.awebp')" alt="vite/vite22.awebp"></div>

这样 main.js 中就可以使用 ES6 Module 方式组织代码：

<div align="center"><img :src="$withBase('/images/vite/vite23.awebp')" alt="vite/vite23.awebp"></div>

vite 需要根据请求资源类型做不同解析工作，比如 `App.vue`，返回给用户的内容如下：

```js
// 原先的script部分内容
import HelloWorld from '/src/components/HelloWorld.vue';

const __script = {
  name: 'App',
  components: {
    HelloWorld,
  },
};

// 可见`template`部分转换为了一个模板请求，解析结果是一个渲染函数
import { render as __render } from '/src/App.vue?type=template';

__script.render = __render;
__script.__hmrId = '/src/App.vue';
__script.__file = '/Users/yt/projects/vite-study/src/App.vue';
export default __script;
```

下面是解析得到的渲染函数的内容：

<div align="center"><img :src="$withBase('/images/vite/vite24.awebp')" alt="vite/vite24.awebp"></div>

## 手写实现自己的 Vite

### 创建开发服务器

开发服务器能够将 `index.html` 返回给浏览器：

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  const url = ctx.request.url;
  if (url === '/') {
    ctx.type = 'text/html';
    ctx.body = fs.readFileSync('./index.html', 'utf-8');
  }
});

app.listen(3000, () => {
  console.log('kvite start');
});
```

浏览报错，需要处理 `main.js` 加载

<div align="center"><img :src="$withBase('/images/vite/vite25.awebp')" alt="vite/vite25.awebp"></div>

### 加载 JS

服务器添加对 js 文件请求支持：

```js
// 导入path
const path = require('path');

app.use(async ctx => {
  if (url === '/') {
  } else if (url.endsWith('.js')) {
    // 获取js文件绝对路径，读取并返回
    const p = path.join(__dirname, url);
    ctx.type = 'text/javascript';
    ctx.body = fs.readFileSync(p, 'utf-8');
  }
});
```

### 加载第三方库

如果用户导入第三方依赖，例如 `vue`

```js
import { createApp, h } from 'vue';

createApp({
  render: () => h('div', 'hello, kvite!'),
}).mount('#app');
```

`main.js` 请求已经成功返回内容：

<div align="center"><img :src="$withBase('/images/vite/vite26.awebp')" alt="vite/vite26.awebp"></div>

但是我们发现浏览器只支持相对路径文件加载：

<div align="center"><img :src="$withBase('/images/vite/vite27.awebp')" alt="vite/vite27.awebp"></div>

这里的关键是替换`裸模块路径`为`相对路径`，比如我们将 `from 'vue'`替换为 `from '/@modules/vue'`

```js
function rewriteImport(content) {
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, function (s0, s1) {
    if (s1.startsWith('./') || s1.startsWith('/') || s1.startsWith('../')) {
      return s0;
    } else {
      return ` from '/@modules/${s1}'`;
    }
  });
}

app.use(async ctx => {
  const url = ctx.request.url;
  if (url === '/') {
    // ...
  } else if (url.endsWith('.js')) {
    // ...
    const ret = fs.readFileSync(p, 'utf-8');
    // 重写裸模块导入部分
    ctx.body = rewriteImport(ret);
  }
});
```

查看转换结果

<div align="center"><img :src="$withBase('/images/vite/vite28.awebp')" alt="vite/vite28.awebp"></div>

可以看到浏览器在尝试加载`/@modules/vue`，说明替换已经成功

<div align="center"><img :src="$withBase('/images/vite/vite29.awebp')" alt="vite/vite29.awebp"></div>

最后处理依赖模块加载：目标文件在模块的 `package.json` 中有描述：

<div align="center"><img :src="$withBase('/images/vite/vite30.awebp')" alt="vite/vite30.awebp"></div>

获取此路径并读取目标文件，具体实现如下：

```js
else if (url.startsWith('/@modules')) {
    const moduleName = url.replace("/@modules/", "");
    const prefix = path.join(__dirname, "../node_modules", moduleName);
    const module = require(prefix + "/package.json").module;
    const filePath = path.join(prefix, module);
    const ret = fs.readFileSync(filePath, "utf8");
    ctx.type = "text/javascript";
    ctx.body = rewriteImport(ret);
}
```

### process 模拟

一些库会访问 `process`，因此会报 `process` 未定义的错误，给宿主页加一个 `mock` 规避即可

```js
if (url === '/') {
  ctx.type = 'text/html';
  const content = fs.readFileSync('./index.html', 'utf-8').replace(
    '<script type="module" src="/src/main.js"></script>',
    `
        <script>
          window.process = {env:{NODE_ENV:'dev'}}
        </script>
        <script type="module" src="/src/main.js"></script>
      `
  );
  ctx.body = content;
}
```

成功渲染出内容！

<div align="center"><img :src="$withBase('/images/vite/vite31.awebp')" alt="vite/vite31.awebp"></div>

### SFC 请求处理

最后处理 `SFC` 解析，例如 `App.vue`，

```vue
<template>
  <div>{{ title }}</div>
</template>

<script>
  import { ref } from 'vue';
  export default {
    setup() {
      const title = ref('hello, kvite!');
      return { title };
    },
  };
</script>
```

```js
import { createApp, h } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

使用 `compiler-sfc` 和 `compiler-dom` 编译 SFC

```js
const compilerSfc = require('@vue/compiler-sfc');
const compilerDom = require('@vue/compiler-dom');
```

```js
else if (url.indexOf('.vue') > -1) {
   // SFC路径
		const p = path.join(__dirname, url.split("?")[0]);
    const ret = compilerSfc.parse(fs.readFileSync(p, 'utf-8'))
		// SFC文件请求
    if (!query.type) {
      const scriptContent = ret.descriptor.script.content
      const script = scriptContent.replace('export default ', 'const __script = ')
      // 返回App.vue解析结果
      ctx.type = 'text/javascript'
      ctx.body = `
        ${rewriteImport(script)}
        import { render as __render } from '${url}?type=template'
        __script.render = __render
        export default __script
      `
    } else if (query.type === 'template') {
      // 模板内容
      const template = ret.descriptor.template.content
      // 编译为render
      const render = compilerDom.compile(template, { mode: 'module' }).code
      ctx.type = 'text/javascript'
      ctx.body = rewriteImport(render)
    }
}
```
