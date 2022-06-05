# 手写一个简易的 Webpack

<!-- TOC -->

- [手写一个简易的 Webpack](#手写一个简易的webpack)
  - [1. 准备工作](#1-准备工作)
  - [2. 编写 xydpack.js](#2-编写-xydpackjs)
  - [3. 编写 compiler.js](#3-编写-compilerjs)
    - [1. Compiler](#1-compiler)
    - [2. buildModule](#2-buildmodule)
    - [3. parse](#3-parse)
    - [4. emit](#4-emit)
  - [加上 loader](#加上-loader)
    - [1. 样式的 loader](#1-样式的loader)
    - [2. 脚本的 loader](#2-脚本的loader)
  - [总结](#总结)

<!-- /TOC -->

## 1. 准备工作

创建两个项目, 一个为项目 juejin-webpack, 一个为我们自己写的打包工具, 名字为 xydpack

1、juejin-webpack 项目主入口文件内容和打包配置内容为 :

```js
// webpack.config.js

const path = require('path');
const root = path.join(__dirname, './');

const config = {
  mode: 'development',
  entry: path.join(root, 'src/app.js'),
  output: {
    path: path.join(root, 'dist'),
    filename: 'bundle.js',
  },
};

module.exports = config;
```

```js
// app.js

/* 
    // moduleA.js
        let name = 'xuyede'
        module.exports = name
*/

const name = require('./js/moduleA.js');

const oH1 = document.createElement('h1');
oH1.innerHTML = 'Hello ' + name;
document.body.appendChild(oH1);
```

2、为了方便调试，我们需要把自己的 xydpack 包 link 到本地, 然后引入到 juejin-webpack 中, 具体操作如下

```js
// 1. 在xydpack项目的 package.json文件中加上 bin属性, 并配置对应的命令和执行文件
{
  "name": "xydpack",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "bin": {
    "xydpack" : "./bin/xydpack.js"
  }
}

// 2. 在xydpack项目中添加相应路径的xydpack.js文件, 并在顶部加上该文件的运行方式
#! /usr/bin/env node
console.log('this is xydpack')

// 3. 在 xydpack项目的命令行上输入 npm link

// 4. 在 juejin-webpack项目的命令行上输入 npm link xydpack

// 5. 在 juejin-webpack项目的命令行上输入 npx xydpack后, 会输出 this is xydpack 就成功了
```

## 2. 编写 xydpack.js

从第一步的流程图中我们可以看出, webpack 打包文件的第一步是获取打包配置文件的内容, 然后去实例化一个 Compiler 类, 再通过 run 去开启编译, 所以我可以把 xydpack.js 修改为

```js
#! /usr/bin/env node

const path = require('path');
const Compiler = require('../lib/compiler.js');
const config = require(path.resolve('webpack.config.js'));

const compiler = new Compiler(config);
compiler.run();
```

然后去编写 compiler.js 的内容

ps : 编写 xydpack 可以通过在 juejin-webpack 项目中使用 npx xydpack 去调试

## 3. 编写 compiler.js

### 1. Compiler

根据上面的调用我们可以知道, Compiler 为一个类, 并且有 run 方法去开启编译

```js
class Compiler {
  constructor(config) {
    this.config = config;
  }
  run() {}
}

module.exports = Compiler;
```

### 2. buildModule

在流程图中有一个 buildModule 的方法去实现构建模块的依赖和获取主入口的路径, 所以我们也加上这个方法

```js
const path = require('path');

class Compiler {
  constructor(config) {
    this.config = config;
    this.modules = {};
    this.entryPath = '';
    this.root = process.cwd();
  }
  buildModule(modulePath, isEntry) {
    // modulePath : 模块路径 (绝对路径)
    // isEntry : 是否是主入口
  }
  run() {
    const { entry } = this.config;
    this.buildModule(path.resolve(this.root, entry), true);
  }
}

module.exports = Compiler;
```

在 buildModule 方法中, 我们需要从主入口出发, 分别获取模块的路径以及对应的代码块, 并把代码块中的`require`方法改为`__webpack_require__`方法

```js
const path = require('path')
const fs = require('fs')

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) {
        const content = fs.readFileSync(modulePath, 'utf-8')
        return content
    }
    buildModule (modulePath, isEntry) {
        // 模块的源代码
        let source = this.getSource(modulePath)
        // 模块的路径
        let moduleName = './' + path.relative(this.root, modulePath).replace(/\\/g, '/')

        if (isEntry) this.entryPath = moduleName
    }
    run () {
        const { entry } = this.config
        this.buildModule(path.resolve(this.root, entry), true)
    }
}

module.exports = Compiler
```

### 3. parse

得到模块的源码后, 需要去解析,替换源码和获取模块的依赖项, 所以添加一个 parse 方法去操作, 而解析代码需要以下两个步骤 :

1. 使用 AST 抽象语法树去解析源码
2. 需要几个包辅助
   - @babel/parser -> 把源码生成 AST
   - @babel/traverse -> 遍历 AST 的结点
   - @babel/types -> 替换 AST 的内容
   - @babel/generator -> 根据 AST 生成新的源码

注意 : @babel/traverse 和@babel/generator 是 ES6 的包, 需要使用 default 导出

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) { //... }
    parse (source, dirname) {
        // 生成AST
        let ast = parser.parse(source)
        // 遍历AST结点
        traverse(ast, {

        })
        // 生成新的代码
        let sourceCode = generator(ast).code
    }
    buildModule (modulePath, isEntry) {
        let source = this.getSource(modulePath)
        let moduleName = './' + path.relative(this.root, modulePath).replace(/\\/g, '/')

        if (isEntry) this.entryPath = moduleName

        this.parse(source, path.dirname(moduleName))
    }
    run () {
        const { entry } = this.config
        this.buildModule(path.resolve(this.root, entry), true)
    }
}

module.exports = Compiler
```

那么得到的 ast 是什么呢, 大家可以去 [AST Explorer](https://link.juejin.im/?target=https%3A%2F%2Fastexplorer.net%2F) 查看代码解析成 ast 后是什么样子。

当有函数调用的语句类似`require()/ document.createElement()/ document.body.appendChild()`, 会有一个`CallExpression`的属性保存这些信息, 所以接下来要干的事为 :

- 代码中需要改的函数调用是 require, 所以要做一层判断
- 引用的模块路径加上主模块 path 的目录名

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) { //... }
    parse (source, dirname) {
        // 生成AST
        let ast = parser.parse(source)
        // 模块依赖项列表
        let dependencies = []
        // 遍历AST结点
        traverse(ast, {
            CallExpression (p) {
                const node = p.node
                if (node.callee.name === 'require') {
                    // 函数名替换
                    node.callee.name = '__webpack_require__'
                    // 路径替换
                    let modulePath = node.arguments[0].value
                    if (!path.extname(modulePath)) {
                        // require('./js/moduleA')
                        throw new Error(`没有找到文件 : ${modulePath} , 检查是否加上正确的文件后缀`)
                    }
                    modulePath = './' + path.join(dirname, modulePath).replace(/\\/g, '/')
                    node.arguments = [t.stringLiteral(modulePath)]
                    // 保存模块依赖项
                    dependencies.push(modulePath)
                }
            }
        })
        // 生成新的代码
        let sourceCode = generator(ast).code

        return {
            sourceCode,
            dependencies
        }
    }
    buildModule (modulePath, isEntry) {
        let source = this.getSource(modulePath)
        let moduleName = './' + path.relative(this.root, modulePath).replace(/\\/g, '/')

        if (isEntry) this.entryPath = moduleName

        let { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName))
    }
    run () {
        const { entry } = this.config
        this.buildModule(path.resolve(this.root, entry), true)
    }
}

module.exports = Compiler
```

递归获取所有的模块依赖, 并保存所有的路径与依赖的模块

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) { //... }
    parse (source, dirname) { //... }
    buildModule (modulePath, isEntry) {
        let source = this.getSource(modulePath)
        let moduleName = './' + path.relative(this.root, modulePath).replace(/\\/g, '/')

        if (isEntry) this.entryPath = moduleName

        let { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName))

        this.modules[moduleName] = JSON.stringify(sourceCode)

        dependencies.forEach(d => this.buildModule(path.join(this.root, d)), false)
    }
    run () {
        const { entry } = this.config
        this.buildModule(path.resolve(this.root, entry), true)
    }
}

module.exports = Compiler
```

### 4. emit

在获取了所有的模块依赖关系和主入口后, 接下来要把数据插入模板并写入配置项中的 output.path

因为需要一个模板, 所以借用一下 webpack 的模板, 使用 EJS 去生成模板, 不了解 EJS 的点这里, 模板的内容为 :

```js
// lib/template.ejs

(function (modules) {
    var installedModules = {};

    function __webpack_require__(moduleId) {
      if (installedModules[moduleId]) {
        return installedModules[moduleId].exports;
      }

      var module = installedModules[moduleId] = {
        i: moduleId,
        l: false,
        exports: {}
      };

      modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
      module.l = true;
      return module.exports;
    }

    return __webpack_require__(__webpack_require__.s = "<%-entryPath%>");
})
({
    <%for (const key in modules) {%>
        "<%-key%>":
        (function (module, exports, __webpack_require__) {
            eval(<%-modules[key]%>);
        }),
    <%}%>
});
```

下面我们编写 emit 函数

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) { //... }
    parse (source, dirname) { //... }
    buildModule (modulePath, isEntry) { //... }
    emit () {
        const { modules, entryPath } = this
        const outputPath = path.resolve(this.root, this.config.output.path)
        const filePath = path.resolve(outputPath, this.config.output.filename)
        if (!fs.readdirSync(outputPath)) {
            fs.mkdirSync(outputPath)
        }
        ejs.renderFile(path.join(__dirname, 'template.ejs'), { modules, entryPath })
            .then(code => {
                fs.writeFileSync(filePath, code)
            })
    }
    run () {
        const { entry } = this.config
        this.buildModule(path.resolve(this.root, entry), true)
        this.emit()
    }
}

module.exports = Compiler
```

如果写到这, 在 juejin-webpack 项目里输入 npx xydpack 就会生成一个 dist 目录, 里面有一个 bundle.js 文件, 可运行在浏览器中, 演示

## 加上 loader

注意 : 因为这个东西相当简易, 所以只能玩一下样式的 loader, 其他的玩不了, 所以只演示写一下样式的 loader

### 1. 样式的 loader

我个人习惯使用 stylus 去编写样式, 所以样式就写 stylus-loader 和 style-loader

首先, 在配置项上加上 loader, 然后在 app.js 中引入 init.styl

```js
// webpack.config.js
const path = require('path');
const root = path.join(__dirname, './');

const config = {
  mode: 'development',
  entry: path.join(root, 'src/app.js'),
  output: {
    path: path.join(root, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.styl(us)?$/,
        use: [
          path.join(root, 'loaders', 'style-loader.js'),
          path.join(root, 'loaders', 'stylus-loader.js'),
        ],
      },
    ],
  },
};

module.exports = config;
// -----------------------------------------------------------------------------------------
// app.js

const name = require('./js/moduleA.js');
require('./style/init.styl');

const oH1 = document.createElement('h1');
oH1.innerHTML = 'Hello ' + name;
document.body.appendChild(oH1);
```

在根目录创建一个 loaders 目录去编写我们的 loader

```js
// stylus-loader
const stylus = require('stylus');
function loader(source) {
  let css = '';
  stylus.render(source, (err, data) => {
    if (!err) {
      css = data;
    } else {
      throw new Error(error);
    }
  });
  return css;
}
module.exports = loader;

// -----------------------------------------------------------------------------------------

// style-loader
function loader(source) {
  let script = `
        let style = document.createElement('style')
        style.innerHTML = ${JSON.stringify(source)}
        document.body.appendChild(style)
    `;
  return script;
}

module.exports = loader;
```

loader 是在读取文件的时候进行操作的, 因此修改 compiler.js, 在 getSource 函数加上对应的操作

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')

class Compiler {
    constructor (config) { //... }
    getSource (modulePath) {
        try {
            let rules = this.config.module.rules
            let content = fs.readFileSync(modulePath, 'utf-8')

            for (let i = 0; i < rules.length; i ++) {
                let { test, use } = rules[i]
                let len = use.length - 1

                if (test.test(modulePath)) {
                    // 递归处理所有loader
                    function loopLoader () {
                        let loader = require(use[len--])
                        content = loader(content)
                        if (len >= 0) {
                            loopLoader()
                        }
                    }
                    loopLoader()
                }
            }

            return content
        } catch (error) {
            throw new Error(`获取数据错误 : ${modulePath}`)
        }
    }
    parse (source, dirname) { //... }
    buildModule (modulePath, isEntry) { //... }
    emit () { //... }
    run () { //... }
}

module.exports = Compiler
```

然后运行 npx xydpack 打包, 会添加一段这样的代码

```js

"./src/style/init.styl":
(function (module, exports, __webpack_require__) {
    eval("let style = document.createElement('style');\nstyle.innerHTML = \"* {\\n  padding: 0;\\n  margin: 0;\\n}\\nbody {\\n  color: #f40;\\n}\\n\";\ndocument.head.appendChild(style);");
}),
```

### 2. 脚本的 loader

脚本的 loader, 第一个想到的就是 babel-loader, 我们自己写一个 babel-loader, 但是需要使用 webpack 去打包, 修改配置文件为

```js
// webpack.config.js

resolveLoader : {
    modules : ['node_modules', path.join(root, 'loaders')]
},
module : {
    rules : [
        {
            test : /\.js$/,
            use : {
                loader : 'babel-loader',
                options : {
                    presets : [
                        '@babel/preset-env'
                    ]
                }
            }
        }
    ]
}
```

使用 babel 需要三个包: @babel/core | @babel/preset-env | loader-utils 安装后, 然后编写 babel-loader

```js
const babel = require('@babel/core');
const loaderUtils = require('loader-utils');

function loader(source) {
  let options = loaderUtils.getOptions(this);
  let cb = this.async();
  babel.transform(
    source,
    {
      ...options,
      sourceMap: true,
      filename: this.resourcePath.split('/').pop(),
    },
    (err, result) => {
      // 错误, 返回的值, sourceMap的内容
      cb(err, result.code, result.map);
    }
  );
}

module.exports = loader;
```

然后使用 webpack 打包就行了

## 总结

到这里, 我们就可以大概猜一下 webpack 的运作流程是这样的 :

1. 获取配置参数
2. 实例化 Compiler, 通过 run 方法开启编译
3. 根据入口文件, 创建依赖项, 并递归获取所有模块的依赖模块
4. 通过 loader 去解析匹配到的模块
5. 获取模板, 把解析好的数据套进不同的模板
6. 输出文件到指定路径
