# 10 分钟快速入门 rollup.js

<!-- TOC -->

- [10 分钟快速入门 rollup.js](#10分钟快速入门rollupjs)
  - [为什么要学习 rollup.js](#为什么要学习rollupjs)
  - [rollup.js 的工作原理](#rollupjs的工作原理)
  - [安装 rollup.js](#安装rollupjs)
    - [全局安装 rollup.js](#全局安装rollupjs)
    - [rollup.js 打包实例](#rollupjs打包实例)
    - [验证 rollup.js 打包结果](#验证rollupjs打包结果)
    - [rollup.js 配置文件](#rollupjs配置文件)
    - [rollup.js api 打包](#rollupjs-api打包)
      - [编写 rollup.js 配置](#编写rollupjs配置)
      - [编写 rollup.js build 代码](#编写rollupjs-build代码)
  - [总结](#总结)

<!-- /TOC -->

## 为什么要学习 rollup.js

`rollup.js`是 Javascript 的`ES模块`打包器，我们熟知的 Vue、React 等诸多知名框架或类库都通过 rollup.js 进行打包。与`Webpack偏向于应用打包`的定位不同，rollup.js 更专注于`Javascript类库打包`（虽然 rollup.js 也可以提供资源打包，但显然这不是它的强项）。在我们学习 Vue 和 React 等框架源码或者自己编写 Javascript 类库时，rollup.js 是一条必经之路。

## rollup.js 的工作原理

rollup.js 可以将我们自己编写的 Javascript 代码（通过插件可以支持更多语言，如 Tyepscript）与第三方模块打包在一起，形成一个文件，该文件可以是一个库（Library）或者一个应用（App），在打包过程中可以应用各类插件实现特定功能。下图揭示了 rollup.js 的运行机制：

<div align="center">
  <img :src="$withBase('/images/opt/rollup.jpg')" alt="images/opt/rollup.jpg">
</div>

rollup.js 默认采用 ES 模块标准，我们可以通过 rollup-plugin-commonjs 插件使之支持 CommonJS 标准。

## 安装 rollup.js

### 全局安装 rollup.js

首先全局安装 rollup：

```bash
npm i rollup -g
```

### rollup.js 打包实例

安装成功后，我们尝试使用 rollup 做一个简单的案例，创建 src 目录：

    mkdir src

在 src 目录下创建 a.js：

    vim src/a.js

写入如下代码，这个模块非常简单，仅仅对外暴露一个变量 a：

    const a = 1
    export default a

在 src 目录下再创建 main.js：

    vim src/main.js

写入如下代码，这个模块会引入模块 a，并对外暴露一个 function：

```js
import a from './a.js';

export default function () {
  console.log(a);
}
```

通过 rollup 指令，我们可以快速地预览打包后的源码，这点和 babel 非常类似：

```js
$ rollup src/main.js -f es

src/main.js  stdout...
const a = 1;

function main() {
  console.log(a);
}

export default main;
created stdout in 26ms
```

需要注意的是 rollup 必须带有`-f`参数，否则会报错：

```js
$ rollup src/main.js

src/main.js  stdout...
[!] Error: You must specify output.format, which can be one of 'amd', 'cjs', 'system', 'esm', 'iife' or 'umd'
https://rollupjs.org/guide/en#output-format-f-format
```

rollup 的报错提示非常棒，非常有利于我们定位错误和修复问题。通过上面的错误提示，我们了解到`-f`的值可以为’amd’、‘cjs’、‘system’、‘esm’（'es’也可以）、'iife’或’umd’中的任何一个。`-f`参数是`--format`的缩写，它表示生成代码的格式，amd 表示采用 AMD 标准，cjs 为 CommonJS 标准，esm（或 es）为 ES 模块标准。接着我们把这段代码输出到一个文件中：

    $ rollup src/main.js -f es -o dist/bundle.js

    src/main.js  dist/bundle.js...
    created dist/bundle.js in 29ms

参数`-o`指定了输出的路径，这里我们将打包后的文件输出到 dist 目录下的 bundle.js，这个文件内容与我们之前预览的内容是完全一致的。我们再输出一份 CommonJS 格式的代码：

    $ rollup src/main.js --format cjs --output.file dist/bundle-cjs.js

    src/main.js  dist/bundle-cjs.js...
    created dist/bundle-cjs.js in 27ms

参数`--output.file`是`-o`的全称，它们是等价的，输出后我们在 dist 目录下会多一个 bundle-cjs.js 文件，查看这个文件的内容：

```js
'use strict';

const a = 1;

function main() {
  console.log(a);
}

module.exports = main;
```

可以看到代码采用 CommonJS 标准编写，并且将 a.js 和 main.js 两个文件进行了融合。

### 验证 rollup.js 打包结果

在打包成功后，我们尝试运行 dist/bundle-cjs.js 代码：

    $ node
    > const m = require('./dist/bundle-cjs.js')
    > m()
    1

我们接着尝试运行之前输出的 ES 标准代码 dist/bundle.js，由于 nodejs 并不支持 ES 标准，直接运行会报错：

    $ node
    > require('./dist/bundle.js')()
    /Users/sam/Desktop/rollup-test/dist/bundle.js:7
    export default main;
    ^^^^^^

    SyntaxError: Unexpected token export

babel 为我们提供了一个工具：babel-node，它可以在运行时将 ES 标准的代码转换为 CommonJS 格式，从而使得运行 ES 标准的代码成为可能，首先全局安装 babel-node 及相关工具，@babel/node 包含 babel-node，@babel/cli 包含 babel，而这两个工具都依赖@babel/core，所以建议都安装：

    npm i @babel/core @babel/node @babel/cli -g

这里要注意的是 babel 7 改变了 npm 包的名称，之前的 babel-core 和 babel-cli 已经被弃用，所以安装老版本 babel 的同学建议先卸载：

    npm uninstall babel-cli babel-core -g

然后到代码的根目录下，初始化项目：

    npm init

一路回车后，在代码根目录下创建 babel 的配置文件.babelrc，写入如下配置

    {
      "presets": ["@babel/preset-env"]
    }

完成 babel 配置后安装 babel 的依赖：

    npm i -D @babel/core @babel/preset-env

尝试通过 babel 编译代码：

```js
$ babel dist/bundle.js
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var a = 1;

function main() {
  console.log(a);
}

var _default = main;
exports.default = _default;
```

可以看到 ES 模块代码被编译成了 CommonJS 格式，下面通过 babel-node 运行代码：

```js
$ babel-node
> require('./dist/bundle.js')
{ default: [Function: main] }
> require('./dist/bundle.js').default()
1
```

注意 babel 会认为`export default function()`是一个名称为 default 的函数，如果想更改这个函数名称，可以修改 main.js：

```js
import a from './a.js';

export function test() {
  console.log(a);
}
```

重写打包后通过 babel-node 运行：

```js
$ rollup -f es --file dist/bundle.js src/main.js

src/main.js  dist/bundle.js...
created dist/bundle.js in 26ms

$ babel-node
> require('./dist/bundle.js').test()
1
```

注意这里的`--file`定价于`-o`和`--output.file`，通过上述案例，我们完成了 rollup 打包的基本操作，并验证了打包结果。但很多时候我们不会这样操作，因为直接使用命令行功能单一，而且无法使用插件，所以我们需要借助配置文件来操作。

### rollup.js 配置文件

首先在代码根目录下创建 rollup.config.js 文件：

    touch rollup.config.js

写入如下配置：

```js
export default {
  input: './src/main.js',
  output: [
    {
      file: './dist/index-cjs.js',
      format: 'cjs',
      banner: '// welcome to imooc.com',
      footer: '// powered by sam',
    },
    {
      file: './dist/index-es.js',
      format: 'es',
      banner: '// welcome to imooc.com',
      footer: '// powered by sam',
    },
  ],
};
```

rollup 的配置文件非常容易理解，这里有几点需要说明：

- rollup 的配置文件需要采用 ES 模块标准编写
- input 表示入口文件的路径（老版本为 entry，已经废弃）
- output 表示输出文件的内容，它允许传入一个对象或一个数组，当为数组时，依次输出多个文件，它包含以下内容：
  - output.file：输出文件的路径（老版本为 dest，已经废弃）
  - output.format：输出文件的格式
  - output.banner：文件头部添加的内容
  - output.footer：文件末尾添加的内容

通过`rollup -c`指令进行打包，rollup.js 会自动寻找名称为 rollup.config.js 的配置文件：

    $ rollup -c

    ./src/main.js  ./dist/index-cjs.js, ./dist/index-es.js...
    created ./dist/index-cjs.js, ./dist/index-es.js in 13ms

查看 dist/index-es.js 文件：

```js
// welcome to imooc.com
const a = 1;

function test() {
  console.log(a);
}

export { test };
// powered by sam
```

代码的内容与命令行生成的无异，但头部和末尾添加了自定义的注释信息。接着我们修改配置文件的名称，并通过`-c`参数指定配置文件进行打包：

    $ mv rollup.config.js rollup.config.dev.js
    $ rollup -c rollup.config.dev.js

    ./src/main.js  ./dist/index-cjs.js, ./dist/index-es.js...
    created ./dist/index-cjs.js, ./dist/index-es.js in 13ms

### rollup.js api 打包

#### 编写 rollup.js 配置

很多时候命令行和配置文件的打包方式无法满足需求，我们需要更加个性化的打包方式，这时我们可以考虑通过 rollup.js 的 api 进行打包，创建 rollup-input-options.js，这是输入配置，我们单独封装一个模块，提高复用性和可扩展性：

    touch rollup-input-options.js

在输入配置文件中加入以下内容，需要注意的是这个文件必须为 CommonJS 格式，因为需要使用 nodejs 来执行：

```js
module.exports = {
  input: './src/main.js',
};
```

再添加一个输出配置文件：

    touch rollup-output-options.js

在输出配置文件我们仍然使用一个数组，实现多种文件格式的输出，需要注意的是 umd 格式必须指定模块的名称，通过 name 属性来实现：

```js
module.exports = [
  {
    file: './dist/index-cjs.js',
    format: 'cjs',
    banner: '// welcome to imooc.com',
    footer: '// powered by sam',
  },
  {
    file: './dist/index-es.js',
    format: 'es',
    banner: '// welcome to imooc.com',
    footer: '// powered by sam',
  },
  {
    file: './dist/index-amd.js',
    format: 'amd',
    banner: '// welcome to imooc.com',
    footer: '// powered by sam',
  },
  {
    file: './dist/index-umd.js',
    format: 'umd',
    name: 'sam-umd', // 指定文件名称
    banner: '// welcome to imooc.com',
    footer: '// powered by sam',
  },
];
```

#### 编写 rollup.js build 代码

接下来我们要在当前项目中安装 rollup 库：

     i -D rollup

创建一个 rollup-build 文件，通过这个文件来调用 rollup 的 api：

    touch rollup-build.js

rollup-build 的源码如下：

```js
const rollup = require('rollup');
const inputOptions = require('./rollup-input-options');
const outputOptions = require('./rollup-output-options');

async function rollupBuild(input, output) {
  const bundle = await rollup.rollup(input); // 根据input配置进行打包
  console.log(`正在生成：${output.file}`);
  await bundle.write(output); // 根据output配置输出文件
  console.log(`${output.file}生成成功！`);
}

(async function () {
  for (let i = 0; i < outputOptions.length; i++) {
    await rollupBuild(inputOptions, outputOptions[i]);
  }
})();
```

代码的核心有两点：

- 通过`rollup.rollup(input)`得到打包对象
- 通过`bundle.write(output)`输出打包文件

这里我们还可以通过 async 和 await 实现同步操作，因为`bundle.write(output)`是异步的，会返回 Promise 对象，我们可以借助 async 机制实现按配置顺序依次打包。执行 rollup-build 文件：

```js
$ node rollup-build.js
正在生成：./dist/index-cjs.js
./dist/index-cjs.js生成成功！
正在生成：./dist/index-es.js
./dist/index-es.js生成成功！
正在生成：./dist/index-amd.js
./dist/index-amd.js生成成功！
正在生成：./dist/index-umd.js
./dist/index-umd.js生成成功！
```

查看 dist/index-umd.js 文件：

```js
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global['sam-umd'] = {})));
}(this, (function (exports) {
	// ...
}
```

可以看到 index-umd.js 文件中在 global 全局变量中添加了 sam-umd 属性，这就是我们之前需要在 umd 配置中添加 name 属性的原因。

## 总结

本文向大家介绍了 rollup.js 的三种打包方式：命令行、配置文件和 API，在下一篇教程中我将继续为大家介绍更多 rollup.js 的特性，如 Tree-shaking、watch 等，还会详细演示各种插件的用途及用法，敬请关注。
