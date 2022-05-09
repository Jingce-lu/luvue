# vite2 常用插件篇- 基础插件

[[toc]]

## 一、准备

我们在项目根目录下创建 build/vite/plugin 目录，用来存放 vite 所有的插件配置，我们的项目结构就像这样

<img :src="$withBase('/images/vite/vite71.awebp')" alt="vite/vite71.awebp">

### 1.说明

[vite plugins 官方说明传送门](https://cn.vitejs.dev/config/#plugins)

原文：

类型： `(Plugin | Plugin[])[]`

将要用到的插件数组。查看 [插件 API](https://cn.vitejs.dev/guide/api-plugin.html) 获取 `Vite` 插件的更多细节。

### 2.配置插件

它接收一个插件对象，或者一个插件数组。由于我们需要配置很多插件，而每一个插件的配置也不一样，所以我们可以把插件数组封装到一个方法中去。统一配置 `vite` 所有的插件。

#### 2.1.创建生成插件数组方法

这个是导入所有 `vite` 的入口

`build/vite/plugin/index.ts`：

```js
import type { Plugin } from 'vite';
import type { ViteEnv } from '../../../types/global.d.ts';

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const {
    VITE_USE_IMAGEMIN,
    VITE_USE_MOCK,
    VITE_LEGACY,
    VITE_BUILD_COMPRESS,
  } = viteEnv;

  const vitePlugins: (Plugin | Plugin[])[] = [];
  return vitePlugins;
}
```

`types/global.d.ts`

```ts
declare interface ViteEnv {
  VITE_PORT: number;
  VITE_USE_MOCK: boolean;
  VITE_USE_PWA: boolean;
  VITE_PUBLIC_PATH: string;
  VITE_PROXY: [string, string][];
  VITE_GLOB_APP_TITLE: string;
  VITE_GLOB_APP_SHORT_NAME: string;
  VITE_USE_CDN: boolean;
  VITE_DROP_CONSOLE: boolean;
  VITE_BUILD_COMPRESS: 'gzip' | 'brotli' | 'none';
  VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE: boolean;
  VITE_LEGACY?: boolean;
  VITE_USE_IMAGEMIN: boolean;
  VITE_GENERATE_UI: string;
}
```

#### 2.2.配置 Vite 插件

`vite.config.ts`：

```ts
// ...
import { createVitePlugins } from './build/vite/plugin';
// ...
export default ({ command, mode }: ConfigEnv): UserConfig => {
  // ...

  return {
    // ...
    // 考录到项目使用的vite插件数量大，那就抽离出去单独管理
    plugins: createVitePlugins(viteEnv, isBuild),

    // ...
  };
};
```

## 二、基础的插件

接下来就是介绍几种基础的插件

### 一、@vitejs/plugin-vue

#### 1.说明

[@vitejs/plugin-vue](https://www.npmjs.com/package/@vitejs/plugin-vue)

要编写 Vue 程序，这个不用解释了吧，在使用 Vite 创建应用程序的时候，这个依赖就已经默认加上了。

#### 2.引入组件

这个是 `vue` 插件不用安装，也不用配置，可以直接放进去。

`build/vite/plugin/index.ts`：

```ts
// ...

import vue from '@vitejs/plugin-vue';
// ...

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  const vitePlugins: (Plugin | Plugin[])[] = [vue()];
  // ...
  return vitePlugins;
}
```

### 二、 @vitejs-plugin-vue-jsx

#### 1.说明

参考链接：

- [@vitejs/plugin-vue-jsx](https://www.npmjs.com/package/@vitejs/plugin-vue-jsx)
- [Vue-JSX](https://v3.cn.vuejs.org/guide/render-function.html#jsx)
- [Vue- JSX 中的用法](https://v3.cn.vuejs.org/guide/composition-api-template-refs.html#jsx-中的用法)
- [Vue-setup 中使用 JSX](https://v3.cn.vuejs.org/api/options-composition.html#setup)
- [Vue-模板语法](https://v3.cn.vuejs.org/guide/template-syntax.html#模板语法)

为什么使用 `JSX`?

- 其实 `JSX` 的效果和我们在 `vue` 的 `template` 中写的代码效果是一样的。最终都会被渲染成 `createElement`。
- 区别是 `template` 的标签是不可变的，我们要实现动态标签，只能使用`v-if`。而 `JSX` 的最大特点就是灵活，我们可以随意组装 `HTML` 代码。

假如我们要实现一个组件渲染`<hn></hn>`标签，`n`是我们传入的参数。如果用`template`，那么我们要写 6 个`v-if`。但是如果使用`JSX`，我们就可以直接将`n`放到标签中去。

#### 2.引入组件

安装：

```sh
yarn add @vitejs/plugin-vue-jsx --dev
```

`vue-jsx` 插件不用配置，可以直接放到插件目录。

`build/vite/plugin/index.ts`：

```ts
// ...

import vueJsx from '@vitejs/plugin-vue-jsx';
// ...

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  const vitePlugins: (Plugin | Plugin[])[] = [vue(), vueJsx()];
  // ...
  return vitePlugins;
}
```

### 三、@vitejs-plugin-legacy

#### 1.说明

[@vitejs/plugin-legacy](https://www.npmjs.com/package/@vitejs/plugin-legacy)

原文描述：

注：此插件需要`vite@^2.0.0-beta.12`。

`Vite` 默认的浏览器支持基线是原生 [ESM](https://caniuse.com/es6-module)。本插件为不支持原生 `ESM` 的传统浏览器提供支持。

默认情况下，该插件将为最终 `bundle` 中的每个 `chunk` 生成一个相应的 `legacy chunk`，用[@babel/reset-env](https://babeljs.io/docs/en/babel-preset-env) 进行转换，并以 [SystemJS](https://github.com/systemjs/systemjs) 模块的形式发布（仍然支持代码分割！）。

生成一个包含 `SystemJS` 运行时的 `polyfill chunk`，以及由指定的浏览器目标和捆绑包中的实际使用情况决定的任何必要的 `polyfills`。

在生成的 HTML 中注入`<script nomodule>`标签，以便在没有本地 ESM 支持的浏览器中有条件地加载 `polyfills` 和 `legacy bundle`。

注入 `import.meta.env.LEGACY env` 变量，该变量仅在 `legacy` 生产构建中为真，而在所有其他情况下为假。(需要 `vite@^2.0.0-beta.69`)。

所以这个是一个浏览器兼容的插件。我们直接安装使用，个人感觉学习的话也用不上。

#### 2.安装

```sh
yarn add @vitejs/plugin-legacy --dev
```

`build/vite/plugin/index.ts`：

```js
// ...
import legacyPlugin from '@vitejs/plugin-legacy';
// ...

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  const { VITE_LEGACY } = viteEnv;
  // @vitejs/plugin-legacy
  VITE_LEGACY &&
    vitePlugins.push(
      legacy({
        targets: [
          'Android > 39',
          'Chrome >= 60',
          'Safari >= 10.1',
          'iOS >= 10.3',
          'Firefox >= 54',
          'Edge >= 15',
        ],
      })
    );
  // ...
  return vitePlugins;
}
```

可以根据项目情况是否在正式环境才使用此插件，比如像这样

```js
VITE_LEGACY && isBuild && vitePlugins.push(legacy());
```

## 一、vite-plugin-html

### 1.说明

`npm`: [vite-plugin-html](https://www.npmjs.com/package/vite-plugin-html)

git: [vite-plugin-html](https://github.com/anncwb/vite-plugin-html)

原文：

一个为 `index.html` 提供 [minify](https://www.npmjs.com/package/html-minifier-terser) 和基于 [EJS](https://ejs.bootcss.com/) 模板功能的 Vite 插件。

- minify：压缩 `index.html` 代码。
- EJS：给 `index.html` 提供访问变量的能力。

详情看配置和使用。

另外这个插件可以在 在 `index.html` 中增加 `EJS` 标签，例如：

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%- title %></title>
  <%- injectScript %>
</head>
```

其中 `title` 和 `injectScript` 就是可以注入的数据

### 2.安装

```sh
yarn add vite-plugin-html --dev
```

### 3.创建配置文件

`build/vite/plugin/html.ts`

```tsx
import type { Plugin } from 'vite';
import html from 'vite-plugin-html';
import { GLOB_CONFIG_FILE_NAME } from '../../constant';
import pkg from '../../../package.json';

export function configHtmlPlugin(env: ViteEnv, isBuild: boolean) {
  const {
    VITE_GLOB_APP_TITLE: appTitle,
    VITE_PUBLIC_PATH: publicPath = './',
  } = env;

  const path = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;

  const getAppConfigSrc = () =>
    `${path || '/'}${GLOB_CONFIG_FILE_NAME}?v=${
      pkg.version
    }-${new Date().getTime()}`;

  const htmlPlugin: Plugin[] = html({
    minify: isBuild,
    inject: {
      // Inject data into ejs template
      injectData: {
        title: appTitle,
      },
      // Embed the generated app.config.js file
      tags: isBuild
        ? [
            {
              tag: 'script',
              attrs: {
                src: getAppConfigSrc(),
              },
            },
          ]
        : [],
    },
  });
  return htmlPlugin;
}
```

### 4.配置 Vite 插件

```js
// ...
import { configHtmlPlugin } from './html';

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  // vite-plugin-html
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild));
  // ...
}
```

## 二、vite-plugin-svg-icon

### 1.说明

npm： [vite-plugin-svg-icons](https://www.npmjs.com/package/vite-plugin-html)

git： [vite-plugin-svg-icons](https://github.com/anncwb/vite-plugin-svg-icons)

当我们遇到首屏需要性能优化时，比如有很多 `http` 请求场景下，用这个插件就不会再产生 `http` 请求来渲染出 `svg` 图片。

**怎么做到的呢？**

使用该插件时，插件会自动将所有 `svg` 图片加载到 `HTML` 中。并且每一个 `svg` 将会被过滤去无用的信息数据。让 svg 达到最小的值。之后使用 svg 图片就只需要操作 `DOM` 即可，而不需要发送 http 请求。

当使用该插件的时候，指定好存放 `svg` 的文件夹。再按照指定的方式去访问 `svg` 图片。

### 2.安装

```sh
yarn add vite-plugin-svg-icons --dev
```

### 3.创建配置

`build/vite/plugin/svgSprite.ts`

```js
import SvgIconsPlugin from 'vite-plugin-svg-icons';
import path from 'path';

export function configSvgIconsPlugin(isBuild: boolean) {
  const svgIconsPlugin = SvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), 'src/assets/svg')],
    svgoOptions: isBuild,
    // default
    symbolId: 'icon-[dir]-[name]',
  });
  return svgIconsPlugin;
}
```

> 选项 `svgOptions` 的 `boolean` 类型不太清楚是干什么的。但是对象类型是控制 `svg` 过滤无用信息的选项。使用 `true` 是使用默认选项，`false` 时不知道做什么的但是也没什么影响。

### 4.用于配置

`build/vite/plugin/index.ts`

```ts
// ...
import { configSvgIconsPlugin } from './svgSprite';

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  // vite-plugin-svg-icons
  vitePlugins.push(configSvgIconsPlugin(isBuild));
  // ...
  return vitePlugins;
}
```

### 5.main 导入

`src/main.ts`：

```ts
// ...
import 'vite-plugin-svg-icons/register';
// ...
```

### 6.创建 Svg 组件

```
src/components/Icon/src/SvgIcon.vue
```

这里有一个样式，是全局上下文注入的

```html
<template>
  <svg :class="svgClass" v-bind="$attrs" :style="{ color: color }">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  export default defineComponent({
    props: {
      name: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      const iconName = computed(() => `#icon-${props.name}`);
      const svgClass = computed(() => {
        if (props.name) {
          return `svg-icon icon-${props.name}`;
        }
        return 'svg-icon';
      });
      return {
        iconName,
        svgClass,
      };
    },
  });
</script>

<style lang="scss">
  .svg-icon {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    fill: currentColor;
  }
</style>
```

## 三、vite-plugin-style-import

### 1.说明

npm: [vite-plugin-style-import](https://www.npmjs.com/package/vite-plugin-style-import)

git: [vite-plugin-style-import](https://github.com/anncwb/vite-plugin-style-import)

该插件可按需导入组件库样式，由于 `vite` 本身已按需导入了组件库，然后目前 `element-plus` 按需加载使用的插件方式不太优雅，其实就仅仅样式不是按需导入的，因此只需按需导入样式即可。

### 2.安装

```sh
yarn add vite-plugin-style-import --dev
```

### 3.配置插件

`build/vite/plugin/styleImport.ts`：

```js
import styleImport from 'vite-plugin-style-import';

export function configStyleImportPlugin(isBuild: boolean) {
  if (!isBuild) return [];
  const styleImportPlugin = styleImport({
    libs: [
      // 按需加载 element-plus
      {
        libraryName: 'element-plus',
        esModule: true,
        ensureStyleFile: true,
        resolveStyle: (name) => {
          const cssName: string = name.slice(3);
          return `element-plus/packages/theme-chalk/src/${cssName}.scss`;
        },
        resolveComponent: (name) => `element-plus/lib/${name}`,
      },
    ],
  });
  return styleImportPlugin;
}
```

### 4.配置 Vite

`build/vite/plugin/index.ts`：

```js
// ...
import { configStyleImportPlugin } from './styleImport';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  // vite-plugin-style-import
  vitePlugins.push(configStyleImportPlugin(isBuild));

  return vitePlugins;
}
```

## 四、vite-plugin-compression

### 1.说明

`vite-plugin-compress` 的增强版，压缩用的。

`npm`: [vite-plugin-compression](https://www.npmjs.com/package/vite-plugin-compression)

`git`: [vite-plugin-compression](https://github.com/anncwb/vite-plugin-compression)

### 2.安装

```sh
yarn add vite-plugin-compression --dev
```

### 3.配置插件

`build/vite/plugin/compress.ts`：

```ts
import type { Plugin } from 'vite';
import compressPlugin from 'vite-plugin-compression';

export function configCompressPlugin(
  compress: 'gzip' | 'brotli' | 'none' = 'none',
  deleteOriginFile = false
): Plugin | Plugin[] {
  const compressList = compress.split(',');

  const plugins: Plugin[] = [];

  if (compressList.includes('gzip')) {
    plugins.push(
      compressPlugin({
        ext: '.gz',
        deleteOriginFile,
      })
    );
  }
  if (compressList.includes('brotli')) {
    plugins.push(
      compressPlugin({
        ext: '.br',
        algorithm: 'brotliCompress',
        deleteOriginFile,
      })
    );
  }
  return plugins;
}
```

### 4.配置 Vite

`build/vite/plugin/index.t`s：

```js
// ...
import { configCompressPlugin } from './compress';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  const {
    VITE_BUILD_COMPRESS: compressType,
    VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE: shouldBuildCompressDeleteFile,
  } = viteEnv;
  // 生产环境使用插件
  if (isBuild) {
    // ...
    // rollup-plugin-gzip
    vitePlugins.push(
      configCompressPlugin(compressType, shouldBuildCompressDeleteFile)
    );
  }

  return vitePlugins;
}
```
