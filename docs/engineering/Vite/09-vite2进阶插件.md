# vite2 进阶插件

[[toc]]

## 一、vite-plugin-windicss

### 1.说明

在 `Vite` 上单独使用 `Tailwind` 时，渲染速度很慢。

`vite-plugin-windicss` 比 Tailwind 快 20 到 100 倍。

- [vite-plugin-windicss](https://www.npmjs.com/package/vite-plugin-windicss)
- [windicss 官网](https://windicss.org/)

### 2.安装

```sh
yarn add vite-plugin-windicss --dev
```

### 3.创建 Windicss 配置文件

（1）[windicss 的配置](https://windicss.org/guide/configuration.html)

（2）[tailwind 的配置](https://tailwindcss.com/docs/configuration)

`tailwind.config.ts`：

```ts
import lineClamp from 'windicss/plugin/line-clamp';
import colors from 'windicss/colors';

import { defineConfig } from 'vite-plugin-windicss';
import { primaryColor } from './build/config/themeConfig';

export default defineConfig({
  darkMode: 'class',
  plugins: [lineClamp, createEnterPlugin()],
  theme: {
    extend: {
      colors: {
        ...colors,
        primary: primaryColor,
      },
      screens: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        '2xl': '1600px',
      },
    },
  },
});

/**
 * 用于元素显示时的动画
 * @param maxOutput 输出越大，生成的css体积越大
 */
function createEnterPlugin(maxOutput = 10) {
  const createCss = (index: number, d = 'x') => {
    const upd = d.toUpperCase();
    return {
      [`*> .enter-${d}:nth-child(${index})`]: {
        transform: `translate${upd}(50px)`,
      },
      [`*> .-enter-${d}:nth-child(${index})`]: {
        transform: `translate${upd}(-50px)`,
      },
      [`* > .enter-${d}:nth-child(${index}),* > .-enter-${d}:nth-child(${index})`]: {
        'z-index': `${10 - index}`,
        opacity: '0',
        animation: `enter-${d}-animation 0.4s ease-in-out 0.3s`,
        'animation-fill-mode': 'forwards',
        'animation-delay': `${(index * 1) / 10}s`,
      },
    };
  };
  const handler = ({ addBase }) => {
    const addRawCss = {};
    for (let index = 1; index < maxOutput; index++) {
      Object.assign(addRawCss, {
        ...createCss(index, 'x'),
        ...createCss(index, 'y'),
      });
    }
    addBase({
      ...addRawCss,
      [`@keyframes enter-x-animation`]: {
        to: {
          opacity: '1',
          transform: 'translateX(0)',
        },
      },
      [`@keyframes enter-y-animation`]: {
        to: {
          opacity: '1',
          transform: 'translateY(0)',
        },
      },
    });
  };
  return { handler };
}
```

### 3.创建配置文件

`build/vite/plugin/windicss.ts`：

```ts
import type { Plugin } from 'vite';

import windiCSS from 'vite-plugin-windicss';

export function configWindiCssPlugin(): Plugin[] {
  return windiCSS({
    safelist: 'no-select',
    preflight: {
      enableAll: true,
    },
  });
}
```

### 4.应用配置

`build/vite/plugin/index.ts`：

```ts
// ...
import { configWindiCssPlugin } from './windicss';

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  // vite-plugin-windicss
  vitePlugins.push(configWindiCssPlugin());
  return vitePlugins;
}
```

### 5.导入样式

src/main.ts：

```ts
// ...
import '@virtual/windi.css';

// ...
```

## 二、vite-plugin-mock

### 1.说明

[vite-plugin-mock](https://www.npmjs.com/package/vite-plugin-mock)

根据我自己的试验：

- `localEnabled` 用来控制 `mock` 开发环境是否启动。
- 如果生产环境想要使用 `mock`，只有 `prodEnabled` 为 `true`，`injectCode` 注入指定代码时才会生效。

### 2.安装 mockjs 和 vite-plugin-mock

```sh
# node version: >=12.0.0
# vite version: >=2.0.0

yarn add mockjs -S
yarn add vite-plugin-mock -D

# 或者:

npm install mockjs -S
npm install vite-plugin-mock -D
```

### 3.编写 Mock 用例

这里直接将根目录下的 mock 目录拷贝出来就行。

- `mock/_util.ts`：里面封装的是数据请求结构类型。
- `mock\_createProductionServer.ts`：用于配置生产环境动态 Mock 的 js 文件，文档中有说。
- `其他的`：都是 Mock 用例。每一个 js、ts。都要默认导出一个 `MockMethod` 类型的数组。每一项 `MockMethod` 就是拦截的一个方法。MockMethod 的 `response` 对应方法的 `return` 将会被 Mock 实例处理。也就是说，你可以在 return 的对象中使用 Mock 规则

> 不过`_createProductionServer.ts` 中使用了 [Glob 导入](https://www.pipipi.net/vite/guide/features.html#glob-导入)。

在根目录下新建两个文件:

> mock/demo/user.ts  
> mock/\_createMockServer.ts

`user.ts`:

```ts
import { MockMethod } from 'vite-plugin-mock';
export default [
  // mock userInfo
  {
    url: '/api/v1/userInfo',
    timeout: 200,
    method: 'get',
    response: ({ body }) => {
      console.log('body', body);
      return {
        code: 0,
        message: 'OK',
        data: {
          userName: 'admin',
          headThumb: 'http://xxx/avatars/profile.gif',
        },
      };
    },
  },
] as MockMethod[];
```

`_createMockServer.ts`：

> 经试验，这个 mock 文件名称最好这样命名，否则会有不可预料的错误

```ts
import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer';

const modules = import.meta.globEager('./**/*.ts');

const mockModules: any[] = [];
Object.keys(modules).forEach((key) => {
  if (key.includes('/_')) {
    return;
  }
  mockModules.push(...modules[key].default);
});

/**
 * 在生产环境中使用。 需要手动导入所有模块
 */
export function setupProdMockServer() {
  createProdMockServer(mockModules);
}
```

⚠️ 注意：此时 `import.meta.globEager` 可能会有类型错误提示:

<div align="center"><img :src="$withBase('/images/vite/vite68.awebp')" alt="vite/vite68.awebp"></div>

修改 `tsconfig.json` 配置的 `include` 属性就正常了：

```json
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "mock/**/*.ts" //++ 新增
  ]
```

### 4.配置使用 vite-plugin-mock

build/vite/plugin/mock.ts：

```ts
import { viteMockServe } from 'vite-plugin-mock';

export function configMockPlugin(isBuild: boolean) {
  return viteMockServe({
    // eslint-disable-next-line no-useless-escape
    ignore: /^\_/,
    mockPath: 'mock',
    localEnabled: !isBuild,
    prodEnabled: isBuild,
    injectCode: `
      import { setupProdMockServer } from '../mock/_createMockServer';

      setupProdMockServer();
      `,
  });
}
```

### 5.配置进 Vite

build/vite/plugin/index.ts：

```ts
// ...
import { configMockPlugin } from './mock';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  const { VITE_USE_MOCK: shouldUseMock } = viteEnv;
  // vite-plugin-mock
  shouldUseMock && vitePlugins.push(configMockPlugin(isBuild));

  return vitePlugins;
}
```

### 6. 测试 mock

在 src 目录下新增：

api/user/index.ts

```ts
import http from '@/utils/http/index';
enum UserAPI {
  getUserInfo = '/api/v1/userInfo',
}

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<any> {
  return http.get({
    url: UserAPI.getUserInfo,
  });
}
```

src/views/demo/index.vue

```vue
<template>
  <div>
    <div>demo</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive } from 'vue';
import { getUserInfo as getUserInfoApi } from '@/api/user/index';

export default defineComponent({
  setup() {
    // ------------------------------------------ reactive ------------------------------------------

    const getUserInfo = async () => {
      try {
        const result = await getUserInfoApi();
        if (result && result.code === 0 && result.data) {
          console.log(result.data);
        }
      } catch (error) {
        console.log('error', error);
      }
    };
    onMounted(() => {
      getUserInfo();
    });
    return {
      userInfo,
    };
  },
});
</script>

<style lang="scss"></style>
```

终端效果如下：

<img :src="$withBase('/images/vite/vite69.awebp')" alt="vite/vite69.awebp">

说明 `mock` 是成功的

## 三、vite-plugin-purge-icons

### 1.说明

这个插件是可以让我们很方便高效的使用 [Iconify](https://iconify.design/) 中所有的图标。

这里要讲的是 `Iconify` 各个版本插件的区别：

- [Vue3 版 Iconify 插件](https://docs.iconify.design/implementations/vue/)：使用时需要安装指定库的图标，然后静态引用。每一次引用都会产生一次 `http` 请求。
- [PurgeIcons](https://github.com/antfu/purge-icons)：将我们所使用的 `Iconify` 图标都已 `html` 的 `dom` 节点形式保存在 `html` 中，这样我们就可以不发送 `http` 请求就可以使用图标了。
- [vite-plugin-purge-icons](https://www.npmjs.com/package/vite-plugin-purge-icons)：就是 `Vite` 版的 `PurgeIcons`。

### 2.安装

```sh
yarn add @iconify/iconify
yarn add vite-plugin-purge-icons @iconify/json --dev
```

### 3.配置 Vite

build/vite/plugin/index.ts：

```ts
// ...
import PurgeIcons from 'vite-plugin-purge-icons';

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // ...
  // vite-plugin-purge-icons
  vitePlugins.push(
    PurgeIcons({
      /* PurgeIcons Options */
    })
  );

  // ...
  return vitePlugins;
}
```

### 4.main 中导入

src/main.ts：

```ts
import { createApp } from 'vue';
import App from './App.vue';

// 导入 icons
import '@purge-icons/generated';

createApp(App).mount('#app');
```

## 四、rollup-plugin-visualizer

### 1.说明

- rollup-plugin-visualizer：依赖分析插件。
- cross-env：命令行配置环境变量

### 2.安装 visualizer

```sh
yarn add rollup-plugin-visualizer @types/rollup-plugin-visualizer --dev
```

### 3.配置插件

build/vite/plugin/visualizer.ts：

```ts
/**
 * 包文件体积分析
 */
import visualizer from 'rollup-plugin-visualizer';
import { isReportMode } from '../../utils';
import type { Plugin } from 'vite';

export function configVisualizerConfig() {
  if (isReportMode()) {
    return visualizer({
      filename: './node_modules/.cache/visualizer/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) as Plugin;
  }
  return [];
}
```

### 4.配置 Vite

build/vite/plugin/index.ts：

```ts
// ...
import { configVisualizerConfig } from './visualizer';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  // rollup-plugin-visualizer
  vitePlugins.push(configVisualizerConfig());

  return vitePlugins;
}
```

### 5.安装 cross-env

```sh
yarn add cross-env --dev
```

### 6.添加脚本

package.json：

```json
{
  // ...
  "scripts": {
    // ...
    "report": "cross-env REPORT=true npm run build"
    // ...
  }
  // ...
}
```

### 7. 执行脚本查看报告

```sh
npm run report
```

生成报告后会自动打开浏览器，就像下面这样 👇🏻

<img :src="$withBase('/images/vite/vite70.awebp')" alt="vite/vite70.awebp">

## 五、vite-plugin-theme

### 1.说明

这个是用于动态更改界面主题色的 vite 插

- npm：[vite-plugin-theme]（https://www.npmjs.com/package/vite-plugin-theme
- git：[vite-plugin-theme](https://github.com/anncwb/vite-plugin-theme)

### 2.安装

```sh
yarn add vite-plugin-theme --dev
```

### 3.配置插件

`build/vite/plugin/theme.ts`：

```js
/**
 * 网站主题颜色切换的Vite插件
 * https://github.com/anncwb/vite-plugin-theme
 */
import {
  viteThemePlugin,
  mixLighten,
  mixDarken,
  tinycolor,
} from 'vite-plugin-theme';
import { getThemeColors, generateColors } from '../../config/themeConfig';

export function configThemePlugin() {
  const colors = generateColors({
    mixDarken,
    mixLighten,
    tinycolor,
  });

  const plugin = viteThemePlugin({
    // 生成的很多个颜色方法
    colorVariables: [...getThemeColors(), ...colors],
  });
  return plugin;
}
```

### 4.配置 Vite

`build/vite/plugin/index.ts`：

```js
// ...
import { configThemePlugin } from './theme';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  //vite-plugin-theme
  vitePlugins.push(configThemePlugin());

  return vitePlugins;
}
```

### 5.修改主题方法

之后要修改主题，直接调用一下这个方法即可。

`src/theme/index.ts`：

```js
import {
  getThemeColors,
  ThemeMode,
  generateColors,
} from '../../build/config/themeConfig';

import { replaceStyleVariables } from 'vite-plugin-theme/es/client';
import {
  mixLighten,
  mixDarken,
  tinycolor,
} from 'vite-plugin-theme/es/colorUtils';

export async function changeTheme(color: string, theme?: ThemeMode) {
  const colors = generateColors({
    mixDarken,
    mixLighten,
    tinycolor,
    color,
  });

  return await replaceStyleVariables({
    colorVariables: [...getThemeColors(color, theme), ...colors],
  });
}
```

## 六、vite-plugin-imagemin

### 1.说明

[vite-plugin-imagemin](https://www.npmjs.com/package/vite-plugin-imagemin) ：一个压缩图片资源的 vite 插件。

### 2.配置镜像

`package.json`：

> 官方建议：用于安装 imagemin 的依赖关系，因为中国可能没有安装 imagemin

```json
"resolutions": {
  "bin-wrapper": "npm:bin-wrapper-china"
},
```

### 3.安装

```sh
yarn add vite-plugin-imagemin --dev
```

### 4.配置插件

`build/vite/plugin/imagemin.ts`：

```js
/**
 * 用于压缩生产环境输出的图片资源
 * https://github.com/anncwb/vite-plugin-imagemin
 */

import viteImagemin from 'vite-plugin-imagemin';

export function configImageminPlugin() {
  const plugin = viteImagemin({
    gifsicle: {
      optimizationLevel: 7,
      interlaced: false,
    },
    optipng: {
      optimizationLevel: 7,
    },
    mozjpeg: {
      quality: 8,
    },
    pngquant: {
      quality: [0.8, 0.9],
      speed: 4,
    },
    svgo: {
      plugins: [
        {
          removeViewBox: false,
        },
        {
          removeEmptyAttrs: false,
        },
      ],
    },
  });
  return plugin;
}
```

详细的配置信息可以看 [options](https://github.com/anncwb/vite-plugin-imagemin#options)

### 5.配置 Vite

`build/vite/plugin/index.ts`：

```js
// ...
import { configImageminPlugin } from './imagemin';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  const { VITE_USE_IMAGEMIN: shouldUseImagemin } = viteEnv;
  // 生产环境使用插件
  if (isBuild) {
    // vite-plugin-imagemin
    shouldUseImagemin && vitePlugins.push(configImageminPlugin());
  }

  return vitePlugins;
}
```

## 七、 vite-plugin-pwa

### 1.说明

- [vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa) ：PWA 一些技术集成。
- [Service Worker-参考链接](https://www.jianshu.com/p/768be2733872)
- [PWA-MDN 说明](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

如果你还不清楚 `PWA` 是什么也没关系。直接配置即可。不影响应用在网页端的运行。

### 2.安装

```sh
yarn add vite-plugin-pwa --dev
```

### 3.配置插件

`build/vite/plugin/pwa.ts`：

```js
/**
 * vite pwa 0 配置插件
 * https://github.com/antfu/vite-plugin-pwa
 */

import { VitePWA } from 'vite-plugin-pwa';

export function configPwaConfig(env: ViteEnv) {
  const {
    VITE_USE_PWA: shouldUsePwa,
    VITE_GLOB_APP_TITLE: appTitle,
    VITE_GLOB_APP_SHORT_NAME: shortName,
  } = env;

  if (shouldUsePwa) {
    // vite-plugin-pwa
    const pwaPlugin = VitePWA({
      manifest: {
        name: appTitle,
        short_name: shortName,
        icons: [
          {
            src: './resource/img/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: './resource/img/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    });
    return pwaPlugin;
  }
  return [];
}
```

### 4.配置 Vite

`build/vite/plugin/index.ts`：

```js
// ...
import { configPwaConfig } from './pwa';

export function createVitePlugins(
  viteEnv: ViteEnv,
  isBuild: boolean,
  pkg: any
) {
  // ...
  // 生产环境使用插件
  if (isBuild) {
    // ...
    // vite-plugin-pwa
    vitePlugins.push(configPwaConfig(viteEnv));
  }

  return vitePlugins;
}
```
