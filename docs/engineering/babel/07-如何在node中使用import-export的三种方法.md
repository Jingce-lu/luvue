# 如何在 Node.js 中使用 import / export 的三种方法

[[toc]]

下面我来介绍三种方法可以让我们在 Node.js 中使用 `import/export` 。

> 注：第 1、2 种方法均是借助 `babel`，需要注意的是文章使用的 babel 版本 < 7。从 babel 7.X 版本开始，部分包名、用法发生了些许变化，大体与 7 之前的用法类似，详细请到官方手册学习 7.X 版本的改动（Babel 踩坑总结(三) —— 7.X 版本升级是我对 7.X 版本三大改动的总结）

## 1. 使用 babel-register

### 1.1 下载必须的包

```sh
npm install babel-register babel-preset-env -D
```

### 1.2 修改你的 server.js

下面是一个 server.js 的例子：

```js
const Koa = require('koa');
const app = new Koa();

app.listen(8225, console.log('application is start at port 8225'));
```

用 `import` 替换 `require`

```js
import Koa from 'koa';
const app = new Koa();

app.listen(8225, console.log('application is start at port 8225'));
```

如果你现在用 `node server.js` 跑这个文件，你会收到像这样的错误提示:

```
/Users/zwkkkk1/myStudy/demo/chatroom/server/app.js:1
(function (exports, require, module, __filename, __dirname) { import Koa from 'koa'

那么原来应该是 example.js 要改为 example.mjs                                                                     ^^^

SyntaxError: Unexpected identifier
```

下面让我们用 babel 来解决这个问题

### 新增一个 start.js 文件

这个文件将成为我们的入口文件，里面是一些 babel 的代码

```js
require('babel-register')({
  presets: ['env'],
});

module.exports = require('./server.js');
```

注意，接下来不是 `node server.js`，而是用 `node start.js` 来启动这个文件

## 2. 使用 babel-node 命令

如果你不想添加新的文件也可以，这里需要在命令行中使用 `babel-node` 命令。`babel-node` 命令不是独立安装，在 Babel 7.X 版本前，需要通过安装 `babel-cli` 包获得；在 Babel 7.X 版本，需要安装 `@babel/core`、`@babel/cli` 两个包。

> 此处以 7.X 之前的版本举例，7.X 版本可去官网查找对应包的使用用例

安装必要的插件

全局安装 `babel-cli`

```sh
npm install babel-cli -g
```

安装 `babel-preset-env`

```sh
npm install babel-preset-env -D
```

然后原来是 `node server.js`，改为这样调用：`babel-node --presets env server.js`

> 需要注意的是如果只是为了 `babel-node` 这一个命令，安装 `babel-cli` 会加载安装很多资源和模块，出于性能考虑不推荐在生产环境使用。自己在开发调试的时候，可以鼓捣着玩玩

## 3. 来自 Node.js 官方的力量

Node 9 提供了一个尚处于 `Experimental` 阶段的模块，让我们可以抛弃 `babel` 等一类工具的束缚，直接在 Node 环境下使用 `import/export`。

> 官方手册：[ECMAScript Modules](http://nodejs.cn/api/esm.html#esm_ecmascript_modules)  
> 一个不错的教程：[Node 9 下 import/export 的丝般顺滑使用](https://github.com/ChenShenhai/blog/issues/24)  
> 有兴趣的可以去了解一下，嫌字多的可以继续往下看看我总结的使用方法

用前须知

- Node 版本需在 9.0 及以上
- 不加 loader 时候，使用 `import/export` 的文件后缀名必须为 `.mjs`

举个例子，还是用上面的例子，请将代码回退到 Babel 中第一步的样子

### 3.1 改写 server.js

```js
import Koa from 'koa';
const app = new Koa();

app.listen(8225, console.log('application is start at port 8225'));
```

和前面一样，不过将文件名改一下，从 `server.js` 改为 `server.mjs`

### 3.2 启动文件

执行下面代码，来启动文件

```sh
node --experimental-modules ./server.mjs
```

注意这是引用 `koa` 第三方模块不用做其他变化，如果要 `import` 自己的文件，那么那个待引入的文件也要改后缀。

比如

```js
import example from './example';
```

那么原来应该是 `example.js` 要改为 `example.mjs`
