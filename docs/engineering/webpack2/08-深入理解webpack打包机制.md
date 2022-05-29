# 深入理解webpack打包机制
<!-- TOC -->

- [深入理解webpack打包机制](#深入理解webpack打包机制)
  - [一、单入口文件如何打包](#一单入口文件如何打包)
  - [二、多入口文件如何进行代码切割](#二多入口文件如何进行代码切割)
  - [webpack2如何做到tree shaking?](#webpack2如何做到tree-shaking)
  - [四、webpack3如何做到scope hoisting?](#四webpack3如何做到scope-hoisting)

<!-- /TOC -->

## 一、单入口文件如何打包
/src/single/index.js
```js
var index2 = require('./index2');
var util = require('./util');

console.log(index2);
console.log(util);
```

/src/single/index2.js
```js
var util = require('./util');
console.log(util);
module.exports = "index 2";
```

/src/single/util.js
```js
module.exports = "Hello World";
```

/config/webpack.config.single.js
```js
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    index: [path.resolve(__dirname, '../src/single/index.js')]
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[chunkhash:8].js'
  }
};
```

运行webpack命令
```bash
webpack --config ./config/webpack.config.single.js
```

得到的单个打包文件`/dist/index.35dff1f1.js`
```js
(function(modules) { // webpackBootstrap
     // The module cache已经加载过的模块
    var installedModules = {};

    // The require function模块加载函数
    function __webpack_require__(moduleId) {

        // Check if module is in cache判断模块是否已经加载过，若加载过直接返回加载的模块
        if(installedModules[moduleId]) {
             return installedModules[moduleId].exports;
        }
         // Create a new module (and put it into the cache)
         var module = installedModules[moduleId] = {
             i: moduleId,
             l: false,
            exports: {}
         };

         // Execute the module function执行加载函数
         modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

         // Flag the module as loaded标记该模块已经加载
        module.l = true;

        // Return the exports of the module
         return module.exports;
     }


    // expose the modules object (__webpack_modules__)
     __webpack_require__.m = modules;

     // expose the module cache
    __webpack_require__.c = installedModules;

     // define getter function for harmony exports
     __webpack_require__.d = function(exports, name, getter) {
         if(!__webpack_require__.o(exports, name)) {
             Object.defineProperty(exports, name, {
                 configurable: false,
                 enumerable: true,
                 get: getter
            });
         }
     };

     // getDefaultExport function for compatibility with non-harmony modules
     __webpack_require__.n = function(module) {
         var getter = module && module.__esModule ?
             function getDefault() { return module['default']; } :
             function getModuleExports() { return module; };
         __webpack_require__.d(getter, 'a', getter);
         return getter;
    };

     // Object.prototype.hasOwnProperty.call
     __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

     // __webpack_public_path__
     __webpack_require__.p = "";

     // Load entry module and return exports
     return __webpack_require__(__webpack_require__.s = 1);
 })([
    /* 0 */
    (function(module, exports) {

      module.exports = "Hello World";

    }),
    /* 1 */
    (function(module, exports, __webpack_require__) {

      module.exports = __webpack_require__(2);

    }),
    /* 2 */
    (function(module, exports, __webpack_require__) {

      var index2 = __webpack_require__(3);
      var util = __webpack_require__(0);

      console.log(index2);
      console.log(util);

    }),
    /* 3 */
    (function(module, exports, __webpack_require__) {

      var util = __webpack_require__(0);
      console.log(util);
      module.exports = "index 2";

    }) 
]);
```

过程：
  1. 首先 webpack 将所有模块(可以简单理解成文件)包裹于一个函数中，并传入默认参数，这里有三个文件再加上一个入口模块一共四个模块，将它们放入一个数组中，取名为 modules，并通过数组的下标来作为 moduleId。
  2. 将 modules 传入一个自执行函数中，自执行函数中包含一个 `installedModules` 已经加载过的模块和一个模块加载函数，最后加载入口模块并返回。
  3. `__webpack_require__` 模块加载，先判断 `installedModules` 是否已加载，加载过了就直接返回 exports 数据，没有加载过该模块就通过 `modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)` 执行模块并且将 module.exports 给返回。

上述过程还是比较简单的，但有些点需要注意：
  1. 每个模块只会加载一次，所以重复加载的模块只会执行一次，加载过的模块会放到 installedModules，下次需要需要该模块的值就直接从里面拿了。
  2. 模块的 id 直接通过数组下标去一一对应的，这样能保证简单且唯一，通过其它方式比如文件名或文件路径的方式就比较麻烦，因为文件名可能出现重名，不唯一，文件路径则会增大文件体积，并且将路径暴露给前端，不够安全。
  3. `modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)` 保证了模块加载时 this 的指向 module.exports 并且传入默认参数



## 二、多入口文件如何进行代码切割
我们在开发一些较复杂的应用时，如果没有对代码进行切割，将第三方库(jQuery)或框架(React) 和业务代码全部打包在一起，就会导致用户访问页面速度很慢，不能有效利用缓存。

```js
// /src/multiple/pageA.js
const utilA = require('./js/utilA');
const utilB = require('./js/utilB');
console.log(utilA);
console.log(utilB);

// /src/multiple/pageB.js
const utilB = require('./js/utilB');
console.log(utilB);
// 异步加载文件，类似于 import()
const utilC = () => require.ensure(['./js/utilC'], function(require) {
  console.log(require('./js/utilC'))
});
utilC();

// /src/multiple/js/utilA.js 可类比于公共库，如 jQuery
module.exports = "util A";

// /src/multiple/js/utilB.js
module.exports = 'util B';

// /src/multiple/js/utilC.js
module.exports = "util C";
```

这里我们定义了两个入口 pageA 和 pageB 和三个库 util，我们希望代码切割做到：
  1. 因为两入口都是用到了 utilB，我们希望把它抽离成单独文件，并且当用户访问 pageA 和 pageB 的时候都能去加载 utilB 这个公共模块，而不是存在于各自的入口文件中。
  2. pageB 中 utilC 不是页面一开始加载时候就需要的内容，假如 utilC 很大，我们不希望页面加载时就直接加载 utilC，而是当用户达到某种条件(如：点击按钮)才去异步加载 utilC，这时候我们需要将 utilC 抽离成单独文件，当用户需要的时候再去加载该文件。

那么 webpack 需要怎么配置呢？
```js
// 通过 /config/webpack.config.multiple.js 打包
const webpack = require('webpack');
const path = require('path')

module.exports = {
  entry: {
    pageA: [path.resolve(__dirname, '../src/multiple/pageA.js')],
    pageB: path.resolve(__dirname, '../src/multiple/pageB.js'),
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[chunkhash:8].js',
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: 2,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    })
  ]
}
```

单单配置多 `entry` 是不够的，这样只会生成两个 `bundle` 文件，将 pageA 和 pageB 所需要的内容全部放入，跟单入口文件并没有区别，要做到代码切割，我们需要借助 webpack 内置的插件 `CommonsChunkPlugin`。

首先 webpack 执行存在一部分运行时代码，即一部分初始化的工作，就像之前单文件中的 `__webpack_require__`，这部分代码需要加载于所有文件之前，相当于初始化工作，少了这部分初始化代码，后面加载过来的代码就无法识别并工作了。

```js
new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: 2,
})
```

这段代码的含义是，在这些入口文件中，找到那些引用两次的模块(如：utilB)，帮我抽离成一个叫 `vendor` 文件，此时那部分初始化工作的代码会被抽离到 `vendor` 文件中。

```js
new webpack.optimize.CommonsChunkPlugin({
  name: 'manifest',
  chunks: ['vendor'],
  // minChunks: Infinity  // 可写可不写
})
```

这段代码的含义是在 vendor 文件中帮我把初始化代码抽离到 mainifest 文件中，此时 vendor 文件中就只剩下 utilB 这个模块了。你可能会好奇为什么要这么做？

因为这样可以给 vendor 生成稳定的 hash 值，每次修改业务代码(pageA)，这段初始化时代码就会发生变化，那么如果将这段初始化代码放在 vendor 文件中的话，每次都会生成新的 vendor.xxxx.js，这样不利于持久化缓存

另外 webpack 默认会抽离异步加载的代码，这个不需要你做额外的配置，pageB 中异步加载的 utilC 文件会直接抽离为 chunk.xxxx.js 文件。

所以这时候我们页面加载文件的顺序就会变成：
```js
mainifest.xxxx.js // 初始化代码
vendor.xxxx.js    // pageA 和 pageB 共同用到的模块，抽离
pageX.xxxx.js     // 业务代码 
当 pageB 需要 utilC 时候则异步加载 utilC
```

执行命令:
```bash
webpack --config ./config/webpack.config.multiple.js
```

<img :src="$withBase('/images/engineering/webpack19120301.png')" alt="webpack19120301.png" />

结果生成了5个文件：异步加载文件utilC.js单独打包成了一个文件0.×××.js,入口pageA,pageB分别打包成文件，pageA和pageB共用模块单独打包成vendor, 初始化代码manifest

那么manifest如何做初始化工作呢？
```js
(function(modules) { // webpackBootstrap
     // install a JSONP callback for chunk loading
     var parentJsonpFunction = window["webpackJsonp"];
     window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules, executeModules) {
         // add "moreModules" to the modules object,
         // then flag all "chunkIds" as loaded and fire callback
         var moduleId, chunkId, i = 0, resolves = [], result;
         for(;i < chunkIds.length; i++) {
             chunkId = chunkIds[i];
             if(installedChunks[chunkId]) {
                 resolves.push(installedChunks[chunkId][0]);
             }
             installedChunks[chunkId] = 0;
         }
         for(moduleId in moreModules) {
             if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
                 modules[moduleId] = moreModules[moduleId];
             }
         }
         if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules, executeModules);
         while(resolves.length) {
             resolves.shift()();
         }
         if(executeModules) {
             for(i=0; i < executeModules.length; i++) {
                 result = __webpack_require__(__webpack_require__.s = executeModules[i]);
             }
         }
         return result;
     };

     // The module cache
     var installedModules = {};

     // objects to store loaded and loading chunks
     var installedChunks = {
         4: 0
     };

     // The require function模块加载函数
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

     // This file contains only the entry chunk.
     // The chunk loading function for additional chunks
     __webpack_require__.e = function requireEnsure(chunkId) {
         var installedChunkData = installedChunks[chunkId];
         if(installedChunkData === 0) {
             return new Promise(function(resolve) { resolve(); });
         }

        // a Promise means "currently loading".
        if(installedChunkData) {
             return installedChunkData[2];
         }

         // setup Promise in chunk cache
         var promise = new Promise(function(resolve, reject) {
             installedChunkData = installedChunks[chunkId] = [resolve, reject];
         });
         installedChunkData[2] = promise;

         // start chunk loading
         var head = document.getElementsByTagName('head')[0];
         var script = document.createElement('script');
         script.type = "text/javascript";
        script.charset = 'utf-8';
         script.async = true;
         script.timeout = 120000;

         if (__webpack_require__.nc) {
             script.setAttribute("nonce", __webpack_require__.nc);
        }
         script.src = __webpack_require__.p + "" + chunkId + "." + {"0":"ae9c5f5f"}[chunkId] + ".js";
         var timeout = setTimeout(onScriptComplete, 120000);
         script.onerror = script.onload = onScriptComplete;
         function onScriptComplete() {
             // avoid mem leaks in IE.
             script.onerror = script.onload = null;
             clearTimeout(timeout);
             var chunk = installedChunks[chunkId];
             if(chunk !== 0) {
                 if(chunk) {
                     chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
                 }
                 installedChunks[chunkId] = undefined;
             }
         };
         head.appendChild(script);

         return promise;
     };

     // expose the modules object (__webpack_modules__)
     __webpack_require__.m = modules;

     // expose the module cache
     __webpack_require__.c = installedModules;

     // define getter function for harmony exports
     __webpack_require__.d = function(exports, name, getter) {
         if(!__webpack_require__.o(exports, name)) {
             Object.defineProperty(exports, name, {
                 configurable: false,
                 enumerable: true,
                 get: getter
             });
        }
     };

     // getDefaultExport function for compatibility with non-harmony modules
     __webpack_require__.n = function(module) {
         var getter = module && module.__esModule ?
             function getDefault() { return module['default']; } :
             function getModuleExports() { return module; };
         __webpack_require__.d(getter, 'a', getter);
         return getter;
     };

     // Object.prototype.hasOwnProperty.call
     __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

     // __webpack_public_path__
     __webpack_require__.p = "";

     // on error function for async loading
    __webpack_require__.oe = function(err) { console.error(err); throw err; };
})([]);
```

与单文件内容一致，定义了一个自执行函数，因为它不包含任何模块，所以传入一个空数组。除了定义了 `__webpack_require__`，还另外定义了两个函数用来进行加载模块。

首先讲解代码前需要理解两个概念，分别是 module 和 chunk
  1. chunk 代表生成后 js 文件，一个 chunkId 对应一个打包好的 js 文件(一共五个)，从这段代码可以看出，manifest 的 chunkId 为 4，并且从代码中还可以看到：0-3 分别对应 异步 utilC, pageA, pageB,  vendor 公共模块文件，这也就是我们为什么不能将这段代码放在 vendor 的原因，因为文件的 hash 值会变。内容变了，vendor 生成的 hash 值也就变了。
  2. module 对应着模块，可以简单理解为打包前每个 js 文件对应一个模块，也就是之前 `__webpack_require__` 加载的模块，同样的使用数组下标作为 moduleId 且是唯一不重复的。

那么为什么要区分 chunk 和 module 呢？

首先使用 installedChunks 来保存每个 chunkId 是否被加载过，如果被加载过，则说明该 chunk 中所包含的模块已经被放到了 modules 中，注意是 modules 而不是 installedModules。我们先来简单看一下 vendor chunk 打包出来的内容。

```js
webpackJsonp([3],[
  /* 0 */
  (function(module, exports) {

    module.exports = 'util B';

  })
]);
```

在执行完 manifest 后就会先执行 vendor 文件，结合上面 webpackJsonp 的定义，我们可以知道 [3] 代表 chunkId，当加载到 vendor 文件后，installedChunks[3] 将会被置为 0，这表明 chunk3 已经被加载过了。

webpack如何加载异步脚本：
```js
// 异步加载函数挂载在__webpack_require__.e
// This file contains only the entry chunk.

// The chunk loading function for additional chunks
__webpack_require__.e = function requireEnsure(chunkId) {
    var installedChunkData = installedChunks[chunkId];
    if(installedChunkData === 0) {
        return new Promise(function(resolve) { resolve(); });
    }

  // a Promise means "currently loading".
  if(installedChunkData) {
        return installedChunkData[2];
    }

    // setup Promise in chunk cache
    var promise = new Promise(function(resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
    });
    installedChunkData[2] = promise;

    // start chunk loading
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = "text/javascript";
  script.charset = 'utf-8';
    script.async = true;
    script.timeout = 120000;

    if (__webpack_require__.nc) {
        script.setAttribute("nonce", __webpack_require__.nc);
  }
    script.src = __webpack_require__.p + "" + chunkId + "." + {"0":"ae9c5f5f"}[chunkId] + ".js";
    var timeout = setTimeout(onScriptComplete, 120000);
    script.onerror = script.onload = onScriptComplete;
    function onScriptComplete() {
        // avoid mem leaks in IE.
        script.onerror = script.onload = null;
        clearTimeout(timeout);
        var chunk = installedChunks[chunkId];
        if(chunk !== 0) {
            if(chunk) {
                chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
            }
            installedChunks[chunkId] = undefined;
        }
    };
    head.appendChild(script);

    return promise;
};
```

大致分为三种情况，(已经加载过，正在加载中以及从未加载过)
  1. 已经加载过该 chunk 文件，那就不用再重新加载该 chunk 了，直接执行回调函数即可，可以理解为假如页面有两种操作需要加载加载异步脚本，但是两个脚本都依赖于公共模块，那么第二次加载的时候发现之前第一次操作已经加载过了该 chunk，则不用再去获取异步脚本了，因为该公共模块已经被执行过了。
  2. 从未加载过，则动态地去插入 script 脚本去请求 js 文件，这也就为什么取名 webpackJsonpCallback，因为跟 jsonp 的思想很类似，所以这种异步加载脚本在做脚本错误监控时经常出现 Script error，具体原因可以查看我之前写的文章：前端代码异常监控实战
  3. 正在加载中代表该 chunk 文件已经在加载中了，比如说点击按钮触发异步脚本，用户点太快了，连点两次就可能出现这种情况，此时将回调函数放入 installedChunks。

通过 utilC 生成的 chunk 来进行讲解：

```js
webpackJsonp([0],[
  /* 0 */,
  /* 1 */
  (function(module, exports) {
  module.exports = "util C";
  })
]);
```

pageB需要异步加载这个chunk:

```js
webpackJsonp([2],{
  4: (function(module, exports, __webpack_require__) {
    const utilB = __webpack_require__(0);
    console.log(utilB);
    const utilC = () => __webpack_require__.e/* require.ensure */(0).then((function(require) {
      console.log(__webpack_require__(1))
    }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
    utilC();
  })
},[4]);
```

当 pageB 进行某种操作需要加载 utilC 时就会执行 `__webpack_require__.e(0, callback)`, 0，代表需要加载的模块 chunkId(utilC)，异步加载 utilC 并将 callback 添加到 installedChunks[0] 中，然后当 utilC 的 chunk 文件加载完毕后，chunkIds 包含 1，发现 installedChunks[0] 是个数组，里面还有之前还未执行的 callback 函数

既然这样，那我就将我自己带来的模块先放到 modules 中，然后再统一执行之前未执行完的 callbacks 函数，这里指的是存放于 installedChunks[1] 中的回调函数 (可能存在多个)，这也就是说明这里的先后顺序：

```js
// 先将 moreModules 合并到 modules, 再去执行 callbacks, 
// 不然之前未执行的 callback 依赖于新来的模块，你不放进 module 我岂不是得不到想要的模块
for(moduleId in moreModules) {
  if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
    modules[moduleId] = moreModules[moduleId];
  }
}
while(callbacks.length)
  callbacks.shift().call(null, __webpack_require__);
```

webpack2 中会默认加载 `OccurrenceOrderPlugin` 这个插件，即你不用 plugins 中添加这个配置它也会默认执行，那它有什么用途呢？主要是在 webpack1 中 moduleId 的不确定性导致的，在 webpack1 中 moduleId 取决于引入文件的顺序，这就会导致这个 moduleId 可能会时常发生变化, 而 OccurrenceOrderPlugin 插件会按引入次数最多的模块进行排序，引入次数的模块的 moduleId 越小，比如说上面引用的 utilB 模块引用次数为 2(最多)，所以它的 moduleId 为 0。

最后说下在异步加载模块时， webpack2 是基于 Promise 的，所以说如果你要兼容低版本浏览器，需要引入 Promise-polyfill，另外为引入请求添加了错误处理。

在 webpack1 的时候，如果由于网络原因当你加载脚本失败后，即使网络恢复了，你再次进行某种操作需要同个 chunk 时候都会无效，主要原因是失败之后没把 `installedChunks[chunkId] = undefined;` 导致之后不会再对该 chunk 文件发起异步请求。

而在 webpack2 中，当脚本请求超时了(2min)或者加载失败，会将 `installedChunks[chunkId]` 清空，当下次重新请求该 chunk 文件会重新加载，提高了页面的容错性


## webpack2如何做到tree shaking?
什么是 tree shaking，即 webpack 在打包的过程中会将没用的代码进行清除(dead code)。一般 dead code 具有一下的特征：
  1. 代码不会被执行，不可到达
  2. 代码执行的结果不会被用到
  3. 代码只会影响死变量（只写不读）

是不是很神奇，那么需要怎么做才能使 tree shaking 生效呢？

首先，模块引入要基于 ES6 模块机制，不再使用 commonjs 规范，因为 es6 模块的依赖关系是确定的，和运行时的状态无关，可以进行可靠的静态分析，然后清除没用的代码。而 commonjs 的依赖关系是要到运行时候才能确定下来的。

其次，需要开启 `UglifyJsPlugin` 这个插件对代码进行压缩。

我们先写一个例子来说明：

```js
// src/es6/pageA.js
import {
  utilA,
  funcA,    // 引入 funcA 但未使用, 故 funcA 会被清除
} from './js/utilA';
import utilB from './js/utilB';   // 引入 utilB(函数) 未使用，会被清除
import classC from './js/utilC';   // 引入 classC(类) 未使用，不会被清除
console.log(utilA);

// src/es6/js/utilA.js
export const utilA = 'util A';
export function funcA() {
  console.log('func A');
}

// src/es6/js/utilB.js
export default function() {
  console.log('func B');
}
if(false) {  // 被清除
  console.log('never use');
}
while(true) {}
console.log('never use');

// src/es6/js/utilC.js
const classC = function() {}  // 类方法不会被清除
classC.prototype.saySomething = function() {
  console.log('class C');
}
export default classC;
```

打包的配置也很简单：
```js
const webpack = require('webpack');
const path = require('path')
module.exports = {
  entry: {
    pageA: path.resolve(__dirname, '../src/es6/pageA.js'),
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[chunkhash:8].js'
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
}
```

对压缩的文件进行分析：

```js
// dist/pageA.xxxx.js
webpackJsonp([0],[
  function(o, t, e) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var n = e(1);
    e(2), e(3);
    console.log(n.a);
  },
  function(o, t, e) {
    'use strict';
    t.a = 'util A';
  },
    function(o, t, e) {
    'use strict';
    for (;;);
    console.log('never use');
  },
  function(o, t, e) {
    'use strict';
    const n = function() {};
    n.prototype.saySomething = function() {
      console.log('class C');
    };
  }
],[0]);
```

引入但是没用的变量，函数都会清除，未执行的代码也会被清除。但是类方法是不会被清除的。因为 webpack 不会区分不了是定义在 classC 的 prototype 还是其它 Array 的 prototype 的，比如 classC 写成下面这样：

```js
const classC = function() {}
var a = 'class' + 'C';
var b;
if(a === 'Array') {
  b = a;
}else {
  b = 'classC';
}
b.prototype.saySomething = function() {
  console.log('class C');
}
export default classC;
```

webpack 无法保证 prototype 挂载的对象是 classC，这种代码，静态分析是分析不了的，就算能静态分析代码，想要正确完全的分析也比较困难。所以 webpack 干脆不处理类方法，不对类方法进行 tree shaking

更多的 tree shaking 的副作用可以查阅：[Tree shaking class methods](https://github.com/rollup/rollup/issues/349)


## 四、webpack3如何做到scope hoisting?
scope hoisting，顾名思义就是将模块的作用域提升，在 webpack 中不能将所有所有的模块直接放在同一个作用域下，有以下几个原因：
  1. 按需加载的模块
  2. 使用 commonjs 规范的模块
  3. 被多 entry 共享的模块

在 webpack3 中，这些情况生成的模块不会进行作用域提升，下面我就举个例子来说明：

```js
// src/hoist/utilA.js
export const utilA = 'util A';
export function funcA() {
  console.log('func A');
}

// src/hoist/utilB.js
export const utilB = 'util B';
export function funcB() {
  console.log('func B');
}

// src/hoist/utilC.js
export const utilC = 'util C';

// src/hoist/pageA.js
import { utilA, funcA } from './utilA';
console.log(utilA);
funcA();

// src/hoist/pageB.js
import { utilA } from './utilA';
import { utilB, funcB } from './utilB';

funcB();
import('./utilC').then(function(utilC) {
  console.log(utilC);
})
```

这个例子比较典型，utilA 被 pageA 和 pageB 所共享，utilB 被 pageB 单独加载，utilC 被 pageB 异步加载。

想要 webpack3 生效，则需要在 plugins 中添加 ModuleConcatenationPlugin。

webpack 配置如下：
```js
const webpack = require('webpack');
const path = require('path')
module.exports = {
  entry: {
    pageA: path.resolve(__dirname, '../src/hoist/pageA.js'),
    pageB: path.resolve(__dirname, '../src/hoist/pageB.js'),
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[chunkhash:8].js'
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: 2,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    })
  ]
}
```

运行`webpack --config ./config/webpack.config.hoist.js`进行编译，简单看下生成的 pageB 代码：

```js
webpackJsonp([2],{
  2: (function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    var utilA = __webpack_require__(0);
    // CONCATENATED MODULE: ./src/hoist/utilB.js
    const utilB = 'util B';
    function funcB() {
      console.log('func B');
    }
    // CONCATENATED MODULE: ./src/hoist/pageB.js
    funcB();
    __webpack_require__.e/* import() */(0).then(__webpack_require__.bind(null, 3)).then(function(utilC) {
      console.log(utilC);
    })
  })
},[2]);
```

通过代码分析，可以得出下面的结论：
  1. 因为我们配置了共享模块抽离，所以 utilA 被抽出为单独模块，故这部分内容不会进行作用域提升。
  2. utilB 无牵无挂，被 pageB 单独加载，所以这部分不会生成新的模块，而是直接作用域提升到 pageB 中。
  3. utilC 被异步加载，需要抽离成单独模块，很明显没办法作用域提升。
