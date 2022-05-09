# Vite2 搞 Vue2

[[toc]]

## 前

<div align="center"><img :src="$withBase('/images/vite/vite58.awebp')" alt="vite/vite58.awebp"></div>

## 1 起 Vue2 项目

[git 地址 https://github.com/Otto-J/vue2-vite2-ts.git](https://github.com/Otto-J/vue2-vite2-ts.git)

搭建项目这块比较简单:

```sh
Vue2 + router + vuex + + less + ts + prettier

vue add element
```

<div align="center"><img :src="$withBase('/images/vite/vite59.awebp')" alt="vite/vite59.awebp"></div>

最终项目通过 `yarn serve` 跑起来。

<div align="center"><img :src="$withBase('/images/vite/vite60.awebp')" alt="vite/vite60.awebp"></div>

## 2 引入 Vite 依赖

得益于 vite 插件的机制，我们要从 vue-cli 迁移到 vite 只需要做下面的操作：

```sh
npm i vite vite-pugin-vue2 -D
```

修改 `package.json` 中的 `script.dev="vite"` 。

接下来我们准备 `src/index.html` ，内容和 原来 `public/index.html` 的大致内容一致，只不过需要手动引入 `src/main.ts` 启动入口，设置 `type=module` ，如下图：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>vue2 vite2</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

我们需要准备配置文件了，可以参考我的配置文件 `/vite.config.js`

```js
import { createVuePlugin } from 'vite-plugin-vue2';
import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
  base: '/',
  plugins: [
    // vue()
    createVuePlugin(),
  ],
});
```

这里我们设置了 `base=/` 和 `alias` 两项配置。

还有一项配置需要处理，因为默认的 `router/index.ts` 用到了环境变量，根据 vite 文档，这里需要做修改

```js
const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes,
});
```

从 `process.env` 改成了 `import.meta.env`

万事俱备，试试吧：

```sh
npm run dev
```

<div align="center"><img :src="$withBase('/images/vite/vite61.awebp')" alt="vite/vite61.awebp"></div>

就，跑起来了：router 工作、element 工作、Vue2 Devtools 工作、修改文件热更新工作。

<div align="center"><img :src="$withBase('/images/vite/vite62.awebp')" alt="vite/vite62.awebp"></div>

等等，既然 Vue3 的 composition API 这么火，也试试呗

## 3 试试 CompositionAPI

参考文档 [github.com/vuejs/compo…](https://github.com/vuejs/composition-api)

安装、配置、使用一条龙

```sh
npm install @vue/composition-api
```

修改 src/main.ts

```ts
import VueCompositionAPI from '@vue/composition-api';

Vue.use(VueCompositionAPI);
```

修改下页面

```vue
<template>
  <div class="about">
    <h1>info</h1>
    <p>{{ number }}</p>
    <el-button @click="addCount" type="primary">add</el-button>
    <p>我是{{ obj.name }}</p>
    <p>今年 {{ prettyAge }}</p>
  </div>
</template>
<script lang="ts">
  import { ref, reactive, defineComponent, computed } from '@vue/composition-api';
  interface TypeInfo {
    name: string;
    age: number;
    hobby?: string[];
  }
  export default defineComponent({
    setup() {
      const number = ref(0);
      const obj: TypeInfo = reactive({
        name: 'xinbao',
        age: 18,
      });
      const addCount = () => number.value++;
      const prettyAge = computed(() => obj.age + '岁');
      return {
        number,
        prettyAge,
        obj,
        addCount,
      };
    },
  });
</script>
```

再跑，就跑起来了

<div align="center"><img :src="$withBase('/images/vite/vite63.awebp')" alt="vite/vite63.awebp"></div>

## 4 初步结论

理论可行，能跑

技术收益：

- webpack dev 模式

<div align="center"><img :src="$withBase('/images/vite/vite64.awebp')" alt="vite/vite64.awebp"></div>

- vite 模式

<div align="center"><img :src="$withBase('/images/vite/vite65.awebp')" alt="vite/vite65.awebp"></div>

4584/407 约等于 11.3 , 那你觉得我从 webpack 切换到 vite 是否提升了 10x 倍的编译速度？
