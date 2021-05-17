# 从零搭建 Vue 组件库

[[toc]]

## 一.组件库的划分

我们的划分以 `elementUi` 为基准分为

- Basic: `Button`、`Icon图标`、`Layout布局`、`container布局容器`...
- Form: `Input`、`Radio`、`checkbox`、`DatePicker`、`Upload`...
- Data: `Table`、`Tree`、`Pagination`...
- Notice: `Alert`、`Loading`、`Message`...
- Navigation: `Tabs`、`Dropdown`、`NavMenu`...
- Others: `Popover`,`Dialog`、`inifiniteScroll`、`Carousel`...

## 二.通过 Vue-Cli 初始化项目

`vue create lu-ui`

```sh
? Check the features needed for your project:
 (*) Choose Vue version
 (*) Babel
 ( ) TypeScript
 ( ) Progressive Web App (PWA) Support
 ( ) Router
 ( ) Vuex
 (*) CSS Pre-processors
 ( ) Linter / Formatter
 (*) Unit Testing
 ( ) E2E Testing
```

```sh
  2.x
> 3.x (Preview)
```

```sh
> Sass/SCSS (with dart-sass)
  Sass/SCSS (with node-sass)
  Less
  Stylus
```

> 为什么选择[dart-sass](https://www.dart-china.org/t/topic/146)

```sh
? Pick a unit testing solution:
> Mocha + Chai # ui测试需要使用karma
  Jest
```

## 三.目录结构配置

```sh
│  .browserslistrc # 兼容版本
│  .gitignore
│  babel.config.js # babel的配置文件
│  package-lock.json
│  package.json
│  README.md
|  examples   # 组件使用案例
├─public
│      favicon.ico
│      index.html
├─src
│  │  App.vue
│  │  main.js
│  │
│  ├─packages # 需要打包的组件
│  │      button
|  |      button-group
│  │      icon
│  │      index.js # 所有组件的入口
│  │
│  └─styles # 公共样式
│         common
|         mixins
└─tests # 单元测试
    └─unit
          button.spec.js
```

## 四.编写插件入口

```js
import Icon from "./icon";
import Button from "./button";
import ButtonGroup from "./button-group";
const plugins = [Icon, Button, ButtonGroup];
const install = (app: any) => {
  plugins.forEach((plugin) => app.use(plugin));
};
export default {
  install,
};
```

```js
import { createApp } from "vue";
import App from "./App.vue";
import LuUI from "./packages/index";
createApp(App).use(LuUI).mount("#app");
```

> 我们可以通过插件的方式去引入我们的组件库

## 五.编写 Button 组件

### 实现功能规划

- [ ] 按钮的基本用法
- [ ] 图标按钮
- [ ] 按钮加载中状态
- [ ] 按钮组的实现 #准备备用样式

### 准备备用样式

```sh
├─common
│   |-- var.scss  # 基本样式
└─mixins
│   |-- mixins.scss # 混合的方法
│   button.scss
|   button-group.scss
|   icon.scss
```

```scss
// 样式变量
$primary: #409eff;
$success: #67c23a;
$warning: #e6a23c;
$danger: #f56c6c;
$info: #909399;

$primary-active: #3a8ee6;
$success-active: #5daf34;
$warning-active: #cf9236;
$danger-active: #dd6161;
$info-active: #82848a;
$font-size: 12px;
$border-radius: 4px;
```

### (1).按钮的实现

```js
<template>
  <button :class="classs" :disabled="loading">
    <lu-icon :icon="icon" v-if="icon && !loading" class="icon"></lu-icon>
    <lu-icon icon="loading" v-if="loading"  class="icon loading"></lu-icon>
    <span v-if="$slots.default">
      <slot></slot>
    </span>
  </button>
</template>
<script>
import { computed } from "vue";
export default {
  props: {
    type: {
      type: String,
      default: "primary",
      validator(type) {
        if (
          type &&
          !["warning", "success", "danger", "info", "primary"].includes(type)
        ) {
          console.log(
            "组件的type类型必须为:" +
              ["warning", "success", "danger", "info", "primary"].join("、")
          );
        }
        return true;
      },
    },
    icon: String,
    loading:{
      type:Boolean,
      default:false
    },
    position:{
       type:String,
       default:'left'
    }
  },
  name: "LuButton",
  setup(props, context) {
    // 计算出所有样式
    const classs = computed(() => [
      `lu-button`,
      `lu-button-${props.type}`,
      `lu-button-${props.position}`
    ]);
    return {
      classs,
    };
  },
};
</script>
```

> 使用 `iconfont` [添加图标](http://at.alicdn.com/t/font_12421_615eijc41lx.js)

### (2)创建图标组件

```vue
<template>
  <svg class="lu-icon" aria-hidden="true">
    <use :xlink:href="`#icon-${icon}`" />
  </svg>
</template>
<script>
import "./font";
export default {
  props: {
    icon: String,
  },
  name: "LuIcon",
};
</script>
```

```scss
@import "./common/var.scss";
@import "./mixins/mixins.scss";
@include blockquote(icon) {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
```

### (4).按钮组的实现

以按钮组的方式出现，常用于多项类似操作。

```html
<template>
  <div class="lu-button-group">
    <slot></slot>
  </div>
</template>
<script>
  import { onMounted, getCurrentInstance } from "vue";
  export default {
    name: "LuButtonGroup",
    setup(props) {
      onMounted(() => {
        let context = getCurrentInstance();
        let ele = context.ctx.$el;
        let children = ele.children;
        for (let i = 0; i < children.length; i++) {
          console.assert(
            children[i].tagName === "BUTTON",
            "必须子节点是button"
          );
        }
      });
    },
  };
</script>
```

```scss
@import "./common/var.scss"; // 公共样式
@import "./mixins/mixins.scss";
@include blockquote(button-group) {
  display: inline-flex;
  vertical-align: middle;
  button {
    border-radius: 0;
    position: relative;
    box-shadow: none;
    &:not(first-child) {
      margin-left: -1px;
    }
    &:first-child {
      border-top-left-radius: $border-radius;
      border-bottom-left-radius: $border-radius;
    }
    &:last-child {
      border-top-right-radius: $border-radius;
      border-bottom-right-radius: $border-radius;
    }
  }
  button:hover {
    z-index: 1;
  }
  button:focus {
    z-index: 2;
  }
}
```

## 六.搭建测试环境

我们需要测试 ui 渲染后的结果。需要在浏览器中测试,所有需要使用 `Karma`

### Karma 配置

(1)安装 karma `npm install --save-dev karma karma-chrome-launcher karma-mocha karma-sourcemap-loader karma-spec-reporter karma-webpack mocha karma-chai`

(2)配置 karma 文件

karma.conf.js

```js
var webpackConfig = require("@vue/cli-service/webpack.config");

module.exports = function (config) {
  config.set({
    frameworks: ["mocha"],
    files: ["tests/**/*.spec.js"],
    preprocessors: {
      "**/*.spec.js": ["webpack", "sourcemap"],
    },
    autoWatch: true,
    webpack: webpackConfig,
    reporters: ["spec"],
    browsers: ["ChromeHeadless"],
  });
};
```

```sh
{
  "scripts": {
    "test": "karma start"
  }
}
```

### 单元测试

```js
import { expect } from "chai";
import Button from "@/packages/button";
import Icon from "@/packages/icon";
// @ts-ignore
import { createApp } from "vue/dist/vue.esm-bundler.js";

describe("HelloWorld.vue", () => {
  it("测试插槽显示是否正常", () => {
    const container = document.createElement("div");
    const app = createApp(
      {
        template: `<luButton>hello</luButton>`,
        components: {
          luButton: Button,
        },
      },
      {
        icon: "edit",
      }
    ).mount(container);
    let html = app.$el.innerHTML;
    expect(html).to.match(/hello/);
  });

  it("测试icon是否能够正常显示", () => {
    const container = document.createElement("div");
    const app = createApp(
      {
        ...Button,
      },
      {
        icon: "edit",
      }
    )
      .use(Icon)
      .mount(container);
    let useEle = app.$el.querySelector("use");
    let href = useEle.getAttribute("xlink:href");
    expect(href).to.eq("#icon-edit");
  });

  it("测试传入loading时 按钮为禁用态", () => {
    const container = document.createElement("div");
    const app = createApp(
      {
        template: `<luButton></luButton>`,
        components: {
          luButton: Button,
        },
      },
      {
        loading: true,
      }
    )
      .use(Icon)
      .mount(container);
    let useEle = app.$el.querySelector("use");
    let href = useEle.getAttribute("xlink:href");
    let disabeld = app.$el.getAttribute("disabled");
    expect(href).to.eq("#icon-loading");
    expect(disabeld).not.to.eq(null);
  });
  // todo....
});
```

## 七.打包组件

### (1)配置打包命令

`"build": "vue-cli-service build --target lib --name lu ./src/packages/index.ts --no-clean && vue-cli-service build --all --no-clean",`

```js
const args = process.argv.slice(2);
if (process.env.NODE_ENV == "production" && args.includes("--all")) {
  const fs = require("fs");
  const path = require("path");
  const getEntries = (dir) => {
    let absPath = path.resolve(dir);
    let files = fs.readdirSync(absPath);
    let entries = {};
    files.forEach((item) => {
      let p = path.resolve(absPath, item);
      if (fs.statSync(p).isDirectory()) {
        p = path.resolve(p, "index.ts");
        entries[item.split(".")[0]] = p;
      }
    });
    return entries;
  };
  module.exports = {
    outputDir: "dist", // 打包出口
    configureWebpack: {
      entry: {
        // 配置多入口
        ...getEntries("./src/packages"),
      },
      output: {
        filename: `lib/[name]/index.js`,
        libraryTarget: "umd",
        libraryExport: "default",
        library: ["lu", "[name]"],
      },
      externals: {
        vue: {
          root: "Vue",
          commonjs: "vue",
          commonjs2: "vue",
          amd: "vue",
        },
      },
    },
    css: {
      sourceMap: true,
      extract: {
        filename: "css/[name]/style.css",
      },
    },
    chainWebpack: (config) => {
      config.optimization.delete("splitChunks");
      config.plugins.delete("copy");
      config.plugins.delete("preload");
      config.plugins.delete("prefetch");
      config.plugins.delete("html");
      config.plugins.delete("hmr");
      config.entryPoints.delete("app");
    },
  };
}
```

### (2)配置运行入口

```json
"main": "./dist/lu.umd.min.js"
```

### (3)link 到全局下

`npm link`

## 八.使用 VitePress 搭建文档

### VuePress 基本配置:

(1).安装 `npm install vitepress -D`  
(2).配置 scripts

```json
{
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs"
}
```

(3).初始化 docs `增加入口页面index.md`

(4).配置导航 `增加config.js`

```js
module.exports = {
  title: "lu-ui", // 设置网站标题
  description: "ui 库", //描述
  dest: "./build", // 设置输出目录
  themeConfig: {
    //主题配置
    nav: [
      { text: "主页", link: "/" },
      { text: "联系我", link: "/contact/" },
      { text: "我的博客", link: "https://" },
    ],
    // 为以下路由添加侧边栏
    sidebar: [
      {
        text: "Button 按钮", // 必要的
        link: "/button/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1, // 可选的, 默认值是 1
      },
      {
        text: "Icon 图标", // 必要的
        link: "/icon/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1, // 可选的, 默认值是 1
      },
    ],
  },
};
```

## 九.发布到 npm

配置`.npmignore`配置文件

```sh
npm addUser
npm publish
```

## 十.推送到 git

添加 `npm` 图标 https://badge.fury.io/for/js

```sh
git remote add origin
git push origin master
```
