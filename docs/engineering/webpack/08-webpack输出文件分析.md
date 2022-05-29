# webpack系列之输出文件分析
<!-- TOC -->

- [webpack系列之输出文件分析](#webpack系列之输出文件分析)
  - [1.配置](#1配置)
    - [1.1安装](#11安装)
    - [1.2新建文件](#12新建文件)
    - [1.3打包](#13打包)
  - [2.文件分析](#2文件分析)
  - [3.思考](#3思考)

<!-- /TOC -->

## 1.配置
### 1.1安装
开发环境 `webpack: 4.34.0`

```bash
> npm init -y
> cnpm i webpack webpack-cli -D
```

### 1.2新建文件
- 新建文件 `webpack.config.js`
- 新建文件夹 `src`

webpack.config.js
```js
const path = require('path');
module.exports = {
  devtool: 'inline-source-map',
  mode: 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
};
```

src 文件夹下，新增三个文件 `main.js`（入口文件） `a.js` `b.js`

main.js
```js
import { A1, A2 } from './a';
import B from './b';
console.log(A1, A2);
B();
```

a.js
```js
export const A1 = 'a1';
export const A2 = 'a2';
```

b.js
```js
export default function() {
  console.log('b');
}
```

### 1.3打包
```
npx webpack --config webpack.config.js
```

然后就会在 `dist` 下生成一个 `bundle.js` 文件，接下来开始分析文件



## 2.文件分析
首先先来看看大致的结果
```js
(function(modules) {
  function __webpack_require__(moduleId) {
    ...
  }
  ...
  return __webpack_require__(__webpack_require__.s = "./src/main.js");
})({
  "./src/a.js": (function(module, __webpack_exports__, __webpack_require__) {}
  "./src/b.js": (function(module, __webpack_exports__, __webpack_require__) {}
  "./src/main.js": (function(module, __webpack_exports__, __webpack_require__) {}
})
```

从上面我们可以看到一个立即执行的函数，传递了一个对象，也就是 `modules` 的值，最终执行了 `__webpack_require__` 函数，执行的这个方法其实是我们在 `webpack` 里面设置的 `entry: ./src/main.js`，对象里还有`key`，`./src/a.js` 、`./src/b.js`，也就是我们的 `a.js` 和` b.js`

我们知道最开始执行了 `__webpack_require__(__webpack_require__.s = "./src/main.js")` 方法，也就是 `__webpack_require__("./src/main.js")`，那么这个 `__webpack_require__` 方法又做了什么的

原始的 `__webpack_require__` 方法

```js
// The module cache
var installedModules = {};
function __webpack_require__(moduleId) {
  // Check if module is in cache
  if(installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }
  // Create a new module (and put it into the cache)
  var module = installedModules[moduleId] = {
    i: moduleId,
    l: false,
    exports: {}
  };
  // Execute the module function
  modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  // Flag the module as loaded
  module.l = true;
  // Return the exports of the module
  return module.exports;
}
```

现在我在这上面写上注释
```js
// 模块缓存
var installedModules = {};
function __webpack_require__(moduleId) {
  // 首先全局有一个模块对象，最先判断是否存在这个模块，是否做过相应操作，如果有则直接返回当前模块的一个对象，这里的exports其实就是一个对象
  if(installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }
  // 这里就直接创建了一个模块，并且缓存在全局的模块中，这里重点关注这个exports，
  // i 指的是模块的名称，比如 './src/main.js'
  // l 意思是当前模块是否加载
  // exports 就是返回出去的对象内容
  var module = installedModules[moduleId] = {
    i: moduleId,
    l: false,
    exports: {}
  };
  // 到这里就开始通过key去执行 modules（就是刚开始立即执行函数传过来的对象）对象的方法
  // 然后使用call来指向 对象的方法 的this，并且把 module, module.exports, __webpack_require__ 三个值传过去，
  // 这里先做预告，module这个参数传过去其实是没有用到的，主要使用 module.exports 对象, 以及__webpack_require__方法
  modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  // 上面说到有一个参数 l，到这里当前模块已经加载
  module.l = true;
  // 最后把module.exports这个模块返回出去
  return module.exports;
}
```

接下来我们看看主入口 `./src/main.js` 这个 `key` 的值的内容

`./src/main.js`，原内容是这样的，接下来来解释一下

```js
{
  "./src/main.js": (function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _a__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./a */ "./src/a.js");
    /* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./b */ "./src/b.js");

    console.log(_a__WEBPACK_IMPORTED_MODULE_0__["A1"], _a__WEBPACK_IMPORTED_MODULE_0__["A2"]);
    Object(_b__WEBPACK_IMPORTED_MODULE_1__["default"])();

  })
}
```

```js
{
  "./src/main.js": (function(module, __webpack_exports__, __webpack_require__) {
    // 上面我们说到 __webpack_require__ 方法内部会执行 modules[moduleId].call，并传递了三个参数，那么他执行的方法就是这个内部方法

    // 这段代码可以先忽略，在当前项目没有作用
    __webpack_require__.r(__webpack_exports__);

    // 我们看到下面有两段__webpack_require__函数代码的执行，你可以回顾一下main.js的内容，我们是不是做了 import { A1, A2 } from './a';并且 console.log(A1, A2);
    /* harmony import */ var _a__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./a */ "./src/a.js");
    /* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./b */ "./src/b.js");
    console.log(_a__WEBPACK_IMPORTED_MODULE_0__["A1"], _a__WEBPACK_IMPORTED_MODULE_0__["A2"]);

    // 这段代码其实是 import B from './b'; B();代码的执行
    Object(_b__WEBPACK_IMPORTED_MODULE_1__["default"])();

  })
}
```

好了，现在来分析一下 `__webpack_require__("./src/a.js")` 做了哪些操作，我们先来看看 模块./src/a.js 的内容

./src/a.js
```js
{
  "./src/a.js": (function(module, __webpack_exports__, __webpack_require__) {
      __webpack_require__.r(__webpack_exports__);
      /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "A1", function() { return A1; });
      /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "A2", function() { return A2; });
      const A1 = 'a1';
      const A2 = 'a2';
 }),
}
```

代码内容很简单，首先 `__webpack_require__("./src/a.js")` 执行之后，会创建一个模块，然后去执行模块 `./src/a.js` 内部得方法，也是是上面这段，执行完成之后最终会把 `module.exports` 返回处理

那么 `module.exports` 这个是什么内容呢？

看看 **webpack_require** 内部

```js
var module = installedModules[moduleId] = {
  i: moduleId,
  l: false,
  exports: {}
};
// Execute the module function
modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
return module.exports
```

其实就是我们创建模块时的 `exports`，然后执行到了模块 `./src/a.js` 内部得方法，它内部方法关键的地方在于又调用了 `__webpack_require__.d` 方法

`__webpack_require__.d`

```js
__webpack_require__.d = function(exports, name, getter) {
  if(!__webpack_require__.o(exports, name)) {
    Object.defineProperty(exports, name, { enumerable: true, get: getter });
  }
};
```

执行 `__webpack_require__.d(__webpack_exports__, "A1", function() { return A1; });` 可以看出来他给 `module.exports` 定义了一个 `key` 值 `"key"`，然后取值 `get` 的时候返回的是 A1(也就是a1)

所以最终 `return module.exports` 的值为 `{A1: 'a1'}`，

我们回到 `./src/main.js` 模块，所以这段代码：`var _a__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./a */ "./src/a.js");`

`_a__WEBPACK_IMPORTED_MODULE_0__` 其实就是等于 `{A1: 'a1'} console.log(_a__WEBPACK_IMPORTED_MODULE_0__["A1"])`，取值为 `a1`，`A2` 同理

<img :src="$withBase('/images/engineering/webpack-bundle-a-js.jpg')" alt="engineering/webpack-bundle-a-js.jpg">

接下来我们看看模块 `./src/b.js`，在主模块它做了什么呢？看看 `./src/main.js`

```js
...
var _b__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./b */ "./src/b.js");
Object(_b__WEBPACK_IMPORTED_MODULE_1__["default"])();
```

看上面模块 `./src/b.js` 在主模块的执行第一段代码和之前介绍的一样，第二段代码直接执行了一个方法，这里我们可以猜测出 `_b__WEBPACK_IMPORTED_MODULE_1__` 其实就是一个对象，访问了它的 `key: default` <br>
然后它的key值其实是一个函数，最后执行了这个函数

同理我们可以看看模块 `./src/b.js` 内部的方法，以及我们在 `src` 文件夹下的 `b.js` 是怎么写的

模块 `./src/b.js`
```js
{
  "./src/b.js": (function(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    /* harmony default export */ __webpack_exports__["default"] = (function() {
      console.log('b');
  });
}
```

b.js
```js
export default function() {
  console.log('b');
}
```

从我们源代码看出，我们是直接导出了一个方法，内部执行了打印字符串b，然后再来看看 `webapck` 的源码部分，`__webpack_require__.r(__webpack_exports__);` 这段可以忽略，解释一下，其实这段代码在对象里定义了一个 `__esModule: true`，接着看下面一段，我们从之前讲的知道知道 `__webpack_exports__` 其实就是一个单纯的空对象（其实不是，执行了 `__webpack_require__.r(__webpack_exports__ )`就变成了 `{__esModule: true})`，然后它又在对象里增加了一个 `default` 属性，然后把一个方法赋值给它(其实就是我们打包之前写的一个方法)，最终在主入口里执行的模块 `var _b__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./b */ "./src/b.js")`；其实就等于 `{"default": function{}}`，然后下一步执行访问对象 `default` 的值去执行函数

<img :src="$withBase('/images/engineering/webpack-bundle-b-js.jpg')" alt="engineering/webpack-bundle-b-js.jpg">


## 3.思考
可能现在你可能会思考🤔，通过上面的比较可以得出一个结论

通过 `export` 出来，如果 `import {a,b,c} from '..'`，打包出来的代码执行简单操作之后（执行 `__webpack_require__` 函数）首先会是一个对象，对象会是 `{a: ..., b: ..., c: ...}`

同过 `export default` 出来，如果 `import a from '..'`，打包处理的代码执行简单操作之后（执行 `__webpack_require__` 函数）首先会是一个对象，然后会往对象里添加一个default的key，类似 `{default: ...}`
