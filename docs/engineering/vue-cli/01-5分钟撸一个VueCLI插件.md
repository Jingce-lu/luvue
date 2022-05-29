# 5分钟撸一个Vue CLI 插件
<!-- TOC -->

- [5分钟撸一个Vue CLI 插件](#5分钟撸一个vue-cli-插件)
  - [前言](#前言)
  - [1. 什么是CLI plugin](#1-什么是cli-plugin)
  - [2. Vue-cli插件目录结构](#2-vue-cli插件目录结构)
    - [2.1 GeneratorAPI](#21-generatorapi)
    - [2.2 Service 插件](#22-service-插件)
    - [2.3 Package.json](#23-packagejson)
  - [3. 通过generator添加依赖项](#3-通过generator添加依赖项)
  - [4. 本地测试cli-plugin](#4-本地测试cli-plugin)
  - [5. 通过generator创建示例组件](#5-通过generator创建示例组件)
    - [5.1 编写示例组件](#51-编写示例组件)
    - [5.2 命令行提示安装](#52-命令行提示安装)
  - [6.如何发布插件](#6如何发布插件)

<!-- /TOC -->

## 前言
如果你正在使用Vue框架，那么你肯定知道Vue CLI是什么。Vue-cli 3，它是Vue.js 开发的标准工具（脚手架），提供项目支架和原型设计。

除了日常构建打包项目，`Vue CLI3` 的一个重要部分是`cli-plugins`，插件开发。
 
本文将教你如何科学的创建一个 `Vue-CLI 插件`，以及项目独立`npm`包。



## 1. 什么是CLI plugin
它可以修改内部`webpack`配置并将命令注入到`vue-cli-service`。一个很好的例子是`@vue/cli-plugin-typescript`：当你调用它时，它会`tsconfig.json`为你的项目添加一个并更改`App.vue`类型，整个过程不需要手动执行。

插件非常有用，但有很多不同的情况: `Electron`构建器，添加`UI库`，如`iview`或`ElementUI` ....如果你想为某个特定的库提供一个插件但却不存在呢？这时候，构建一个属于自己项目的插件就是个不错的选择。

<img :src="$withBase('/images/engineering/2020010701.png')" alt="engineering/2020010701.png">

在本文中，我们将构建一个`vue-cli-plugin-rx`。它允许我们向项目添加`vue-rx`库，并在我们的Vue应用程序中获得`RxJS`支持。



## 2. Vue-cli插件目录结构
`CLI` 插件是一个可以为 `@vue/cli`项目添加额外特性的 `npm` 包。它应该始终包含:

- 一个`Service`插件作为其主要导出
- 可选的包含一个 `Generator` 和一个 `Prompt` 文件。

```
.
├── README.md
├── generator.js  # generator (可选)
├── prompts.js    # prompt 文件 (可选)
├── index.js      # service 插件
└── package.json
```

如果你需要在插件安装的同时，通过命令行来选择是否创建一些示例组件，那么目录可以改为：

```
.
├── README.md
├── generator
│   └── index.js  # generator
├── prompts.js    # 命令行提示安装
├── index.js      # service 插件
└── package.json
```

### 2.1 GeneratorAPI
一个发布为 npm 包的 CLI 插件可以包含一个 `generator.js` 或 `generator/index.js` 文件。插件内的 generator 将会在两种场景下被调用：

- 在一个项目的初始化创建过程中，如果 `CLI` 插件作为项目创建 `preset` 的一部分被安装。
- 插件在项目创建好之后通过 `vue invoke` 独立调用时被安装。

`GeneratorAPI`允许一个 `generator` 向 `package.json` 注入额外的依赖或字段，并向项目中添加文件。

### 2.2 Service 插件
`Service` 插件接收两个参数的函数：一个`PluginAPI`实例和一个包含项目本地选项的对象。它可以扩展/修改不同环境的内部`webpack`配置，并为其注入其他命令`vue-cli-service`。

但在这里，我们只想在必要时添加一些依赖项和示例组件。所以我们的index.js长这样：

```js
module.exports = (api, opts) => {}
```

如果你想改变内部`webpack`配置或其它操作，请在官方Vue CLI文档中阅读[本节](https://cli.vuejs.org/dev-guide/plugin-dev.html#service-plugin)


### 2.3 Package.json
> `keywords` 指定了在库中搜索时能够被哪些关键字搜索到，所以一般这个会多写一些项目相关的词在这里，是一个字符串的数组。

```json
{
  "name": "vue-cli-plugin-rx",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "keywords": [
    "vue",
    "vue-cli",
    "rxjs",
    "vue-rx"
  ],
  "author": "",
  "license": "ISC"
}
```


## 3. 通过generator添加依赖项
`generator`可帮助我们添加依赖项并更改项目文件。所以，我们需要的第一步是让我们的插件添加依赖项：`rxjs`和`vue-rx`（你也可以添加其它）：

```js
// generator/index.js
module.exports = (api, options, rootOptions) => {
  api.extendPackage({
    dependencies: {
      'rxjs': '^6.3.3',
      'vue-rx': '^6.1.0',
    },
  });
}
```

`generator` 导出一个接收三个参数的函数：`GeneratorAPI`实例，生成器选项和 - 如果用户使用某个预设创建项目 - 整个预设将作为第三个参数传递。

`api.extendPackage`方法将会修改项目的`package.json`。

在本文的例子中，我们将两个依赖项添加到`dependencies`。

现在我们需要更改`main.js`文件。为了使`RxJS`能在Vue组件中工作，我们需要导入`VueRx`和调用`Vue.use(VueRx)`

- 首先，我们创建一个想要添加的字符串到主文件：
    ```js
    let rxLines = `\nimport VueRx from 'vue-rx';\n\nVue.use(VueRx);`;
    ```
- 使用`api.onCreateCompletehook`。在文件写入磁盘时调用它:
    ```js
    api.onCreateComplete(() => {
        const fs = require('fs');
        const mainPath = api.resolve('./src/main.js');
    });
    ```
- 现在我们修改文件内容:
    ```js
    api.onCreateComplete(() => {
      const fs = require('fs');
      const mainPath = api.resolve('./src/main.js');
      // 获取内容
      let contentMain = fs.readFileSync(mainPath, { encoding: 'utf-8' });
      const lines = contentMain.split(/\r?\n/g).reverse();
      // 注入import
      const lastImportIndex = lines.findIndex(line => line.match(/^import/));
      lines[lastImportIndex] += rxLines;
      // 修改应用
      contentMain = lines.reverse().join('\n');
      fs.writeFileSync(mainPath, contentMain, { encoding: 'utf-8' });
    });
    ```


## 4. 本地测试cli-plugin
首先我们创建一个简单的Vue-cli项目：
```bash
vue create test-app
```

cd到项目文件夹并安装我们新创建的插件：
```bash
cd test-app
npm install --save-dev file://Users/hiro/练习/测试/vue-plugin
```

安装插件后，需要调用它：
```
vue invoke vue-cli-plugin-rx
```

现在，你查看`test-app`项目的`main.js`,将会看到：  

```js
import Vue from 'vue'
import App from './App.vue'
import VueRx from 'vue-rx';
Vue.use(VueRx);
```

同时，查看package.json将会发现：
```json
"dependencies": {
    "core-js": "^2.6.5",
    "rxjs": "^6.3.3",
    "vue": "^2.6.10",
    "vue-router": "^3.0.3",
    "vue-rx": "^6.1.0",
    "vuex": "^3.0.1"
  }
```


## 5. 通过generator创建示例组件
经过上面的验证，插件已有效。此时，我们可以扩展一下它的功能，创建示例组件，方便其他人理解和使用。

### 5.1 编写示例组件
我们创建的这个示例组件。它应该是位于项目`src/components`文件夹中的文件。

于是我们可以在`generator`目录下，创建`/template/src/components`:

<img :src="$withBase('/images/engineering/2020010702.png')" alt="engineering/2020010702.png">

这一个简单的`RxJS`驱动的计数器，带有两个按钮

<img :src="$withBase('/images/engineering/2020010703.png')" alt="engineering/2020010703.png">


源码如下：
```vue
<template>
    <section>
        <h1>Click on 'Count' button to count your clicks</h1>
        <button v-stream:click="count$">Count clicks</button>
        <button @click="clearCounter">Clear counter</button>
        <p>{{result$}}</p>
    </section>
</template>

<script>
import {
  filter,
  bufferWhen,
  debounceTime,
  map,
  startWith,
} from 'rxjs/operators';
export default {
  domStreams: ['count$'],
  subscriptions() {
    return {
      result$: this.count$.pipe(
        filter(event => !!event),
        bufferWhen(() => this.count$.pipe(debounceTime(400))),
        map(clicks => clicks.length),
        startWith(0),
      ),
    };
  },
  methods: {
    clearCounter() {
      this.count$.next(null);
    },
  },
};
</script>

<style>
button {
  padding: 10px;
  font-size: 14px;
  margin-right: 10px;
  border-radius: 4px;
  outline: none;
}
</style>
```

不需要关心`RxJS`做了什么（反正我也没看懂），引就`vans`了。

此时我们需要改动`generator/index.js`，使它可以识别并写入文件夹。  

```js
api.render('./template', {
  ...options,
});
```

**当你调用 `api.render('./template')`时，`generator`将会使用 `EJS`渲染 `./template`中的文件 (相对于 `generator` 中的文件路径进行解析)**


### 5.2 命令行提示安装
如果用户是个老手，不想拥有示例组件，该怎么办？在插件安装过程中，我们可以向`prompts.js`添加提示代码，以供用户在命令行选择：
```js
module.exports = [
  {
    name: `addExample`,
    type: 'confirm',
    message: '是否添加示例组件到项目components目录？',
    default: false,
  },
];
```

询问用户是否要将示例组件添加到项目`components`目录下。默认是：`false`。

这时我们需要修改下`generator/index.js`:
```js
if (options.addExample) {
  api.render('./template', {
    ...options,
  });
}
```

<img :src="$withBase('/images/engineering/2020010704.jpg')" alt="engineering/2020010704.jpg">

此时我们撤回安装，重新运行

```bash
yarn add --save-dev file://Users/hiro/练习/测试/vue-plugin

vue invoke vue-cli-plugin-rx
```

将会看到：

<img :src="$withBase('/images/engineering/2020010705.jpg')" alt="engineering/2020010705.jpg">

此时你查看项目`component`s目录，将会发现多了示例组件文件

<img :src="$withBase('/images/engineering/2020010706.jpg')" alt="engineering/2020010706.jpg">


## 6.如何发布插件
为了让一个 `CLI` 插件能够被其它开发者使用，你必须遵循 `vue-cli-plugin-<name>` 的命名约定将其发布到 npm 上。插件遵循命名约定之后就可以：
- 被 `@vue/cli-service` 发现;
- 被其他开发者搜索到；
- 通过 `vue add <name>`或 `vue invoke <name>` 安装下来。

你只需要在`package.json`中添加描述`description`，以及在插件项目根目录下创建`logo.png`。

接下来就是注册[npmjs.com](https://juejin.im/post/npmjs.com)

```
2、设置仓库地址为npm官方仓库地址(国内大部分都使用阿里淘宝镜像，如果没改publish会失败)
npm config set registry https://registry.npmjs.org/

3、登陆npm,用户名密码邮箱需要全部匹配
npm whoami
npm login
Username: xxxxx
Password:
Email: (this IS public) xxx@gmail.com
Logged in as xxxxx on https://registry.npmjs.org/.

4、登陆完可以publish了,执行以下命令
cd dist && npm publish && cd ../
或npm publish dist
输出以下信息说明发布成功
+ ngx-xxx@0.0.1
这时登录https://www.npmjs.com/可以看到自己发布的项目
```
