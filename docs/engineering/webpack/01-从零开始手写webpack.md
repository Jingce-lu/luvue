# 从零开始手写webpack
<!-- TOC -->

- [从零开始手写webpack](#从零开始手写webpack)
  - [webpack打包js步骤](#webpack打包js步骤)
  - [分析webpack打包出来的文件](#分析webpack打包出来的文件)
  - [着手开发](#着手开发)

<!-- /TOC -->

## webpack打包js步骤
1. 根据设置的`入口文件`,找到对应文件，并分析依赖。
2. 解析抽象语法树(AST)。
3. 获取源码，并做适当修改，使代码能在浏览器端运行。
4. 将入口文件以及依赖文件，通过模板打包到一个文件中。

## 分析webpack打包出来的文件
```js
(function (modules) { // webpackBootstrap
  // The module cache
  var installedModules = {};
  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
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

  // expose the modules object (__webpack_modules__)
  __webpack_require__.m = modules;

  // expose the module cache
  __webpack_require__.c = installedModules;

  // define getter function for harmony exports
  __webpack_require__.d = function (exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, {
        enumerable: true,
        get: getter
      });
    }
  };

  // define __esModule on exports
  __webpack_require__.r = function (exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, {
        value: 'Module'
      });
    }

    Object.defineProperty(exports, '__esModule', {
      value: true
    });

  };

  // create a fake namespace object
  // mode & 1: value is a module id, require it
  // mode & 2: merge all properties of value into the ns
  // mode & 4: return value when already ns object
  // mode & 8|1: behave like require

  __webpack_require__.t = function (value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;

    if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;

    var ns = Object.create(null);

    __webpack_require__.r(ns);

    Object.defineProperty(ns, 'default', {
      enumerable: true,
      value: value
    });

    if (mode & 2 && typeof value != 'string')
      for (var key in value) __webpack_require__.d(ns, key, function (key) {
        return value[key];
      }.bind(null, key));

    return ns;

  };

  // getDefaultExport function for compatibility with non-harmony modules

  __webpack_require__.n = function (module) {

    var getter = module && module.__esModule ?
      function getDefault() {
        return module['default'];
      } :
      function getModuleExports() {
        return module;
      };

    __webpack_require__.d(getter, 'a', getter);

    return getter;

  };

  // Object.prototype.hasOwnProperty.call

  __webpack_require__.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // __webpack_public_path__

  __webpack_require__.p = "";

  // Load entry module and return exports

  return __webpack_require__(__webpack_require__.s = "./src/index.js");

})

/************************************************************************/

({
  /***/
  "./src/index.js":

    /*!**********************!*\
      !*** ./src/index.js ***!
      \**********************/
    /*! no static exports found */

    /***/
    (function (module, exports) {
      eval("console.log('index.js')\n\n//# sourceURL=webpack:///./src/index.js?");
      /***/
    })
});
```

这是webpack打包后的文件，经过简化处理。简单分析一下。

- **整个文件内的代码是一个大的IIFE函数**
    ```js
    (function(modules) { })

    ({});
    ```
- **传入的参数就是入口文件及其依赖文件的代码**
    ```js
    (function(modules) { })

    ({

    /***/ "./src/index.js":

    /*!**********************!*\

    !*** ./src/index.js ***!

    \**********************/

    /*! no exports provided */

    /***/ (function(module, __webpack_exports__, __webpack_require__) {

    "use strict";

    eval("console.log('index.js')\n\n//# sourceURL=webpack:///./src/index.js?");

    /***/ })

    });
    ```
    可以看出传入的参数是一个对象字面量，key 为文件路径， value 是一个函数，函数内部是 我们编写的代码源码。 这就是modules接收到的数据。
- **函数体内所做的事就是加载模块，执行模块，缓存模块。**
    ```js
    (function(modules) { // webpackBootstrap

        // The module cache

        var installedModules = {};

        // The require function

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

        // Load entry module and return exports

        return __webpack_require__(__webpack_require__.s = "./src/index.js");

    })

    /************************************************************************/

    ({});
    ```
    通过注释，可以看出来，函数体内，就是加载传入的模块，并且缓存这个模块。加载函数就是`__webpack_require__`, 在内部实现是加载模块并且执行模块，缓存这个模块，并且将当前模块标记为已经加载过。后续需要这个模块则直接读缓存。这个缓存的 `key` 是文件路径， `value` 是文件源码。 其他的代码暂且可以不用管。这个代码就能在浏览器端运行了。所以我们要做的就是想办法来生成这个文件。

## 着手开发
首先，我们需要获取配置文件，这个就比较简单了。获取webpack.config.js就行了。
```js
// pack.js
const path = require('path');
const config = require(path.resolve('webpack.config.js'));
```

然后我们需要编写一个编译器，这里我单独抽一个文件来写编译器，这个编译器只需要执行run方法，即可执行。

```js
// pack.js
const path = require('path');
const config = require(path.resolve('webpack.config.js'));
const Compiler = require('../lib/Compiler');

const compiler = new Compiler(config);
compiler.run();
```

那么编译器的代码基本结构就有了
```js
// lib/Compiler.js
class Compiler {
    run() {
        console.log('run')
    }
}

module.exports = Compiler
```

我们在编译器里面需要做的是，拿到`webpack.config.js`里面的配置信息，解析入口，解析文件依赖关系，发射文件。

首先解析入口。

```js
// lib/Compiler.js
const path = require('path');
class Compiler {
    constructor(config) {
        this.config = config;
        
        // 需要保存入口文件的路径
        this.entryId;

        // 需要保存所有模块的依赖
        this.modules = {};

        // 入口路径
        this.entry = config.entry;

        // 工作路径
        this.root = process.cwd();
    }

    run() {
        // 执行并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);

        // 发射一个打包后的文件
        this.emitFile()
    }

    getSource(modulePath) {
        const content = fs.readFileSync(modulePath, 'utf8');
        return content;
    }

    /**
    * 构建模块
    */

    buildModule(modulePath, isEntry) {

    }

    /**
    * 发射文件
    */

    emitFile() {

    }

}

module.exports = Compiler
```

构建模块时，我们需要拿到模块的内容（我们编写的源码）。这个通过`getSource`函数拿到即可。我们还需要拿到`模块id`，即上文提到的文件路径。

那么`buildModule`函数可以写成

```js
buildModule(modulePath, isEntry) {
    // 拿到模块的内容
    const source = this.getSource(modulePath);

    // 拿到模块的id modulePath - this.root
    const moduleName = './' + path.relative(this.root, modulePath);

    if (isEntry) {
        this.entryId = moduleName
    }
}
```

通过这一段代码，就能拿到入口文件的`模块id`和`模块内容`了。也就是上文的打包后文件传入的模块列表中的参数了。接下来，我们需要做的就是解析入口文件里面的文件依赖，解析依赖文件的依赖，递归解析出所有文件的依赖。

举个例子:

```js
// 入口文件 index.js
const a = require('./a');
const b = require('./b');

// a.js
console.log('aaaaaa');

// b.js
const c = require('./common/c');
console.log('bbbbb');

// common/c.js
console.log('cccccc');
```

那么我们就得把 `index.js`、`a.js`、`b.js`、`c.js`，通过`require`函数的参数分析出来依赖关系。这个时候，**AST** 抽象语法树便要发挥作用了。

我们并不用去实现一个，使用`babylon.js`这个库就好了。具体请看[babylon](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fbabylon)

我们拿到`语法树`后，还需要遍历语法树，原因是 `require` 这个函数在浏览器端是没有的，直接这么把源码打包进去，在浏览器端是不能运行的。这也是为什么 `webpack` 打包后的文件里面有个 `__webpack_require__` 函数，就是为了在浏览器端能加载模块的，所以我们要做的就是把源码中的`require`函数替换为`__webpack_require__`。另外，我们还需要用到两个库, `@babel/types` 和 `@babel/generator`。

这一步， 我们总共需要用到四个库, [babylon](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fbabylon)、[@babel/traverse](https://babeljs.io/docs/en/next/babel-traverse.html)、[@babel/types](https://links.jianshu.com/go?to=https%3A%2F%2Fbabeljs.io%2Fdocs%2Fen%2Fnext%2Fbabel-types.html)、[@babel/generator](https://babeljs.io/docs/en/next/babel-generator.html)

代码为:

```js
/**
* 解析文件
*/

parse(source, parentPath){
    // AST 解析语法树
    const ast = babylon.parse(source);
    const dependencies = [];

    traverse(ast, {
        CallExpression(p) {
            // 对应的节点
            const {node} = p;

            if (node.callee.name === 'require') {
                node.callee.name = '__webpack_require__';
                // 模块的引用名字
                let moduleName = node.arguments[0].value;
                moduleName = moduleName + (path.extname(moduleName) ? '' : '.js')
                moduleName = './' + path.join(parentPath, moduleName);
                dependencies.push(moduleName);
                node.arguments = [t.stringLiteral(moduleName)]
            }
        }
    });

    const sourceCode = generator(ast).code;

    return {
        sourceCode,
        dependencies
    }
}
```

到了这一步，我们已经实现了获取`模块id`、`模块内容`、`替换require函数`。 接下来我们递归获取即可。

完整代码就是:

```js
const path = require('path');
const fs = require('fs');

// babylon 主要把源码转换成ast
const babylon = require('babylon');

// @babel/traverse
const traverse = require('@babel/traverse').default;

// @babel/types
const t = require('@babel/types');

// @babel/generator
const generator = require('@babel/generator').default;

class Compiler {
    constructor(config) {
        this.config = config;

        // 需要保存入口文件的路径
        this.entryId;

        // 需要保存所有模块的依赖
        this.modules = {};

        // 入口路径
        this.entry = config.entry;

        // 工作路径
        this.root = process.cwd();

    }

    run() {
        // 执行并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);
        // 发射一个打包后的文件
        this.emitFile()
    }

    /**
    * 根据路径来获取文件的内容
    */

    getSource(modulePath) {
        const content = fs.readFileSync(modulePath, 'utf8');
        return content;
    }

    /**
    * 构建模块
    */

    buildModule(modulePath, isEntry) {
        // 拿到模块的内容
        const source = this.getSource(modulePath);

        // 拿到模块的id modulePath - this.root
        const moduleName = './' + path.relative(this.root, modulePath);

        if (isEntry) {
            this.entryId = moduleName
        }

        // 解析，需要把source源码进行改造，返回一个依赖列表
        const { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName));

        this.modules[moduleName] = sourceCode;
        // 把相对路径和模块中的内容 对应起来
        dependencies.forEach(dep => {
            // 附模块的递归加载
            this.buildModule(path.join(this.root, dep), false);
        });
    }

    /**
    * 解析文件
    */

    parse(source, parentPath){
        // AST 解析语法树
        const ast = babylon.parse(source);
        const dependencies = [];

        traverse(ast, {
            CallExpression(p) {
                // 对应的节点
                const {node} = p;
                if (node.callee.name === 'require') {
                    node.callee.name = '__webpack_require__';
                    // 模块的引用名字
                    let moduleName = node.arguments[0].value;
                    moduleName = moduleName + (path.extname(moduleName) ? '' : '.js')
                    moduleName = './' + path.join(parentPath, moduleName);
                    dependencies.push(moduleName);
                    node.arguments = [t.stringLiteral(moduleName)]
                }
            }
        });

        const sourceCode = generator(ast).code;

        return {
            sourceCode,
            dependencies
        }
    }

    /**
    * 发射文件
    */

    emitFile() {

    }
}

module.exports = Compiler
```

接下来，我们需要做的就是发射文件了。首先我们需要准备一个`webpack`打包后的模板，并且增加一个渲染引擎，这里我选择 `ejs`

模板为:

```js
// main.ejs
(function (modules) { // webpackBootstrap
    // The module cache
    var installedModules = {};
    // The require function

    function __webpack_require__(moduleId) {
        // Check if module is in cache
        if (installedModules[moduleId]) {
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

    // Load entry module and return exports
    return __webpack_require__(__webpack_require__.s = "./src\test.js");
})

/************************************************************************/

({
    <% for(let key in modules){ %>
      "<%- key %>":
      (function(module, exports, __webpack_require__) {
        eval(`<%- modules[key] %>`)
      }),
    <% } %>
})
```

然后我们只需要将拿到的`模块id`以及`模块内容`渲染到模板中，在发射到一个文件即可，输出文件为配置项中的`output.filename`.

`emitFile`函数实现为

```js
/**
* 发射文件
*/

emitFile() {
    // 拿到输出的目录
    const main = path.join(this.config.output.path, this.config.output.filename);
    const templatStr = this.getSource(path.join(__dirname, 'main.ejs'));
    const code = ejs.render(templatStr, { entryId: this.entryId, modules: this.modules })

    this.assets = {};
    // 资源中，路径对应的代码
    this.assets[main] = code;
    fs.writeFileSync(main, this.assets[main]);
}
```

整个`Compile.js`的完整代码为:
```js
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// babylon 主要把源码转换成ast
const babylon = require('babylon');

// @babel/traverse
const traverse = require('@babel/traverse').default;

// @babel/types
const t = require('@babel/types');

// @babel/generator
const generator = require('@babel/generator').default;

class Compiler {
    constructor(config) {
        this.config = config;
        // 需要保存入口文件的路径
        this.entryId;
        // 需要保存所有模块的依赖
        this.modules = {};
        // 入口路径
        this.entry = config.entry;
        // 工作路径
        this.root = process.cwd();
    }

    run() {
        // 执行并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);
        // 发射一个打包后的文件
        this.emitFile()
    }

    /**
    * 根据路径来获取文件的内容
    */
    getSource(modulePath) {
        const content = fs.readFileSync(modulePath, 'utf8');
        return content;
    }

    /**
    * 构建模块
    */
    buildModule(modulePath, isEntry) {
        // 拿到模块的内容
        const source = this.getSource(modulePath);
        // 拿到模块的id modulePath - this.root
        const moduleName = './' + path.relative(this.root, modulePath);
        if (isEntry) {
            this.entryId = moduleName
        }

        // 解析，需要把source源码进行改造，返回一个依赖列表
        const { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName));

        this.modules[moduleName] = sourceCode;

        // 把相对路径和模块中的内容 对应起来
        dependencies.forEach(dep => {
            // 附模块的递归加载
            this.buildModule(path.join(this.root, dep), false);
        });
    }

    /**
    * 解析文件
    */
    parse(source, parentPath){
        // AST 解析语法树
        const ast = babylon.parse(source);
        const dependencies = [];

        traverse(ast, {
            CallExpression(p) {
                // 对应的节点
                const {node} = p;
                if (node.callee.name === 'require') {
                    node.callee.name = '__webpack_require__';
                    // 模块的引用名字
                    let moduleName = node.arguments[0].value;
                    moduleName = moduleName + (path.extname(moduleName) ? '' : '.js')
                    moduleName = './' + path.join(parentPath, moduleName);
                    dependencies.push(moduleName);
                    node.arguments = [t.stringLiteral(moduleName)]
                }
            }
        });

        const sourceCode = generator(ast).code;

        return {
            sourceCode,
            dependencies
        }
    }

    /**
    * 发射文件
    */
    emitFile() {
        // 拿到输出的目录
        const main = path.join(this.config.output.path, this.config.output.filename);
        const templatStr = this.getSource(path.join(__dirname, 'main.ejs'));
        const code = ejs.render(templatStr, { entryId: this.entryId, modules: this.modules })
        this.assets = {};

        // 资源中，路径对应的代码
        this.assets[main] = code;
        fs.writeFileSync(main, this.assets[main]);
    }
}

module.exports = Compiler
```

这样我们的打包器，就能打包代码，并且使代码运行在浏览器端了。
