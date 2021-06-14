# vite-plugin 常用的插件

[[toc]]

最近在用 vite 开发，整合了一下常用的插件。 vite 自带移除 console.log 和注释的配置

```js
export default defineConfig({
  build: {
    terserOptions: {
      //打包后移除console和注释
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## 1.vite-plugin-style-import 按需导入样式

```js
import styleImport from 'vite-plugin-style-import';

export default defineConfig({
  plugins: [
    styleImport({
      libs: [
        {
          libraryName: 'element-plus',
          esModule: true,
          resolveStyle: name => {
            return `element-plus/lib/theme-chalk/${name}.css`; // 按需引入样式
          },
        },
      ],
    }),
  ],
});
```

## 2.unplugin-vue-components 按需导入组件

```js
import ViteComponents, { ElementPlusResolver } from 'unplugin-vue-components';

export default defineConfig({
  plugins: [
    ViteComponents({
      customComponentResolvers: [ElementPlusResolver()],
    }),
  ],
});
```

## 3.vite-plugin-compression 开启 gzip 压缩

```js
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      //生成压缩包gz
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
});
```

## 4.vite-plugin-cdn-import 引入 cdn 资源

```js
import importToCDN, { autoComplete } from 'vite-plugin-cdn-import';

export default defineConfig({
  plugins: [
    vue(),
    importToCDN({
      modules: [
        autoComplete('vue'),
        {
          name: 'element-plus',
          var: 'ElementPlus',
          path: 'https://unpkg.com/element-plus/lib/index.full.js',
          css: 'https://unpkg.com/element-plus/lib/theme-chalk/index.css',
        },
        {
          name: 'vant',
          var: 'vant',
          path: 'https://cdn.jsdelivr.net/npm/vant@next/lib/vant.min.js',
          css: 'https://cdn.jsdelivr.net/npm/vant@next/lib/index.css',
        },
      ],
    }),
  ],
});
```

## 5.rollup-plugin-external-globals （另一种引入 CDN 资源）

```js
import externalGlobals from 'rollup-plugin-external-globals';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'element-plus'],
      plugins: [
        externalGlobals({
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        }),
      ],
    },
  },
});
```
