# rollup 实践系列之从 0 到 1 手写 rollup

[[toc]]

## 前言

rollup 简易实现简易 tree-shking 并打包


## 前置知识

在梳理整个流程之前，我们先来了解一些前置知识代码工具块基本功能

### 1. magic-string

一个操作字符串和生成 `source-map` 的工具，由 Rollup 作者编写。

一段代码来了解下 `magic-string` 的基本方法使用。

```js
var MagicString = require('magic-string');
var magicString = new MagicString('export var name = "Lynne"');

// 返回magicString的拷贝，删除原始字符串开头和结尾符之前的内容
console.log(magicString.snip(0, 6).toString());

// 从开始到结束删除字符串（原始字符串而不是生成的字符串）
console.log(magicString.remove(0, 7).toString());

// 使用MagicString.Bundle可以联合多个源代码
let bundleString = new MagicString.Bundle();
bundleString.addSource({
  content: 'var name = Lynne1',
  separator: '\n',
});
bundleString.addSource({
  content: 'var name = Lynne2',
  separator: '\n',
});

console.log(bundleString.toString());
```

### 2. AST

通过 JavaScript Parser 可以把代码转化为一棵抽象语法树 AST，这棵树定义了代码的结构，通过操纵这棵树，精准定位到声明语句、赋值语句、运算语句等等，实现对代码的分析、优化和变更等操作。

**AST 工作流**:

- `Parser 解析` - 将源代码转换成抽象语法树，树上有很多的 estree 节点；
- `Transform 转换` - 对抽象语法树进行转换；
- `Generation 代码生成` - 将上一步转换过的抽象语法树生成新的代码。

**`acorn` - rollup 采用了这个库**

[astexplorer](https://astexplorer.net/) 可以将代码转换成语法树，`acorn` 解析结果符合 `The Estree Spec` 规范，和 `Babel` 功能相同，且相对于 babel 更加轻量。

**`acorn` 遍历生成语法树的基本流程如下，其中 `walk` 实现了遍历语法树的方法**。

```js
// let shouldSkip;
// let shouldAbort;

/*
 * @param {*} ast 要遍历的语法树
 * @param {*} param1 配置对象
 */
function walk(ast, { enter, leave }) {
  visit(ast, null, enter, leave);
}
/**
 * 访问此node节点
 * @param {*} node 遍历的节点
 * @param {*} parent 父节点
 * @param {*} enter 进入的方法
 * @param {*} leave 离开的方法
 */

function visit(node, parent, enter, leave) {
  if (!node) return;
  if (enter) {
    // 先执行此节点的enter方法
    enter.call(null, node, parent); // 指定enter中的this
  }
  // 再遍历子节点，找出哪些是对象的子节点
  let keys = Object.keys(node).filter(key => typeof node[key] === 'object');
  keys.forEach(key => {
    let value = node[key];
    if (Array.isArray(value)) {
      value.forEach(val => {
        visit(val, node, enter, leave);
      });
    } else if (value && value.type) {
      // 遍历时只遍历有type属性的对象
      visit(value, node, enter, leave);
    }
  });
  // 再执行离开方法
  if (leave) {
    leave(node, parent);
  }
}

module.exports = walk;
```

### 3. 作用域

在 js 中，作用域规定了变量访问范围的规则，作用域链是由当前执行环境和上层执行环境的一系列变量对象组成的，保证当前执行环境对符合访问权限的变量和函数的有序访问

scope.js

```js
class Scope {
  constructor(options = {}) {
    this.name = options.name;
    this.parent = options.parent; // parent 属性指向它额父作用域
    this.names = options.params || []; // 存放这个作用域内的所有变量
  }
  add(name) {
    this.names.push(name);
  }
  // 查找定义作用域
  findDefiningScope(name) {
    if (this.names.includes(name)) {
      return this;
    }
    if (this.parent) {
      return this.parent.findDefiningScope(name);
    }
    return null;
  }
}

module.exports = Scope;
```

useScope.js - 如何使用、如何遍历 ast

```js
let Scope = require('./scope.js');

var a = 1;
function one() {
  var b = 2;
  function two() {
    var c = 3;
    console.log(a, b, c);
  }
  two();
}

one();

let globalScope = new Scope({ name: 'global', params: ['a'], parent: null });
let oneScope = new Scope({ name: 'one', params: ['b'], parent: globalScope });
let twoScope = new Scope({ name: 'two', params: ['c'], parent: oneScope });

let aScope = twoScope.findDefiningScope('a');
console.log('----1', aScope.name);
let bScope = twoScope.findDefiningScope('b');
console.log('----2', bScope.name);
let cScope = twoScope.findDefiningScope('c');
console.log('----3', cScope.name);
let dScope = twoScope.findDefiningScope('d');
console.log('----4', dScope && dScope.name);
```

## 基本构建流程概述

- 通过一个入口文件 —— 通常是 index.js，Rollup 使用 `Acorn` 读取解析这个入口文件 —— 将返回给我们一种叫抽象语法树（AST）的结构内容。
- 一旦有了 AST，我们就可以通过操纵这棵树，精准定位到声明语句、赋值语句、运算语句等等，实现对代码的分析、优化和变更等操作。  
   在这里，rollup 看这个节点有没有调用函数方法，有没有读到变量，有，就查看是否在当前作用域，如果不在就往上找，直到找到模块顶级作用域为止。如果本模块都没找到，说明这个函数、方法依赖于其他模块，需要从其他模块引入。如果发现其他模块中有方法依赖其他模块，就会递归读取其他模块，如此循环直到没有依赖的模块为止，找到这些变量或着方法是在哪里定义的，把定义语句包含进来，其他无关代码一律不要。  
   将对 AST 完成分析、优化变更后打包压缩输出。
- 将对 AST 完成分析、优化变更后打包压缩输出。

## 基本构建流程实现

接下来从最外层的构建流程一层层深入内部实现，发现其实构建打包也没那么神秘 ~

### 封装 rollup 打包编译

封装 `rollup` 对外调用的方法，暴露了入口文件和输出文件路径。

内部则调用了 `bundle` 并生成 `bundle` 打包对象，最后通过 `bundle.build()` 编译输出文件。

```js
let Bundle = require('./bundle.js');

function rollup(entry, outputFileName) {
  // Bundle为打包对象，包含所有的模块信息
  const bundle = new Bundle({ entry });
  // 调用build方法进行编译
  bundle.build(outputFileName);
}

module.exports = rollup;
```

### bundle 打包对象的内部实现

bundle 对象内部

- 首先分析了入口路径，根据入口路径拿到需要构建的模块信息并读取模块代码 - 通过 `fetchModule()` 方法实现，内部调用了 `Module` 对象；
- 其次将读取的内部模块代码语句展开并返回数组 - 通过 `expandAllStatements()` 方法实现；
- 最后将展开的语句生成代码并通过 `magicString()` 合并代码。 - `generate()`。

```js
const fs = require('fs');
const path = require('path');
const { default: MagicString } = require('magic-string');
const Module = require('./module.js');

class Bundle {
  constructor(options) {
    // 入口文件的绝对路径，包括后缀
    this.entryPath = options.entry.replace(/\.js$/, '') + '.js';
    this.module = {}; // 存放所有模块、入口文件和他依赖的模块
  }
  build(outputFileName) {
    // 从入口文件的绝对路径出发找到它的模块定义
    let entryModule = this.fetchModule(this.entryPath);
    // 把这个入口模块所有的语句进行展开，返回所有的语句组成的数组
    this.statements = entryModule.expandAllStatements();
    const { code } = this.generate();
    fs.writeFileSync(outputFileName, code, 'utf8');
  }

  // 获取模块信息
  fetchModule(import_path, importer) {
    // let route = import_path; // 入口文件的绝对路径
    let route;
    if (!importer) {
      // 若没有模块导入此模块，这就是入口模块
      route = import_path;
    } else {
      if (path.isAbsolute(import_path)) {
        route = import_path; // 绝对路径
      } else if (import_path[0] == '.') {
        // 相对路径
        route = path.resolve(path.dirname(importer), import_path.replace(/\.js$/, '') + '.js');
      }
    }
    if (route) {
      // 读出此模块代码
      let code = fs.readFileSync(route, 'utf8');
      let module = new Module({
        code, // 模块源代码
        path: route, // 模块绝对路径
        bundle: this, // 属于哪个bundle
      });
      return module;
    }
  }

  // 把this.statements生成代码
  generate() {
    let magicString = new MagicString.Bundle();
    this.statements.forEach(statement => {
      const source = statement._source;
      if (statement.type === 'ExportNamedDeclaration') {
        source.remove(statement.start, statement.declaration.start);
      }
      magicString.addSource({
        content: source,
        separator: '\n',
      });
    });
    return { code: magicString.toString() };
  }
}

module.exports = Bundle;
```

### Module 实例

打包文件时，每个文件都是一个模块，每个模块都会有一个 Module 实例。我们对着每一个文件/Module 实都要遍历分析。

```js
let MagicString = require('magic-string');
const { parse } = require('acorn');
const analyse = require('./ast/analyse.js');

// 判断obj对象上是否有prop属性
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/*
 * 每个文件都是一个模块，每个模块都会有一个Module实例
 */

class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code, { filename: path });
    this.path = path; // 模块的路径
    this.bundle = bundle; // 属于哪个bundle的实例
    this.ast = parse(code, {
      // 把源代码转换成抽象语法树
      ecmaVersion: 6,
      sourceType: 'module',
    });
    this.analyse();
  }
  analyse() {
    this.imports = []; // 存放当前模块的所有导入
    this.exports = []; // 存放当前模块的所有导出
    this.ast.body.forEach(node => {
      if (node.type === 'ImportDeclaration') {
        // 这是一个导入声明语句
        let source = node.source.value; // ./test.js 从哪个模块进行的导入
        let specifiers = node.specifiers;
        debugger;
        specifiers.forEach(specifier => {
          let name = specifier.imported ? specifier.imported.name : ''; // name
          let localName = specifier.local ? specifier.local.name : ''; // name

          // 本地的哪个变量，是从哪个模块的哪个变量导出的
          // this.imports.age = {name: 'age', localName: "age", source: './test.js}
          this.imports[localName || name] = { name, localName, source };
        });
      } else if (/^Export/.test(node.type)) {
        let declaration = node.declaration;
        if (!declaration.declarations) return; // 无声明直接返回，引入类等情况未考虑
        let name = declaration.declarations[0].id.name; // age
        // 记录一下当前模块的导出，这个age是通过哪个表达式创建的
        // this.exports['age'] = {node, localName: name, expression}
        this.exports[name] = {
          node,
          localName: name,
          expression: declaration,
        };
      }
    });
    analyse(this.ast, this.code, this); // 找到了依赖和外部依赖
    this.definitions = {}; // 存放所有全局变量的定义语句
    this.ast.body.forEach(statement => {
      Object.keys(statement._defines).forEach(name => {
        this.definitions[name] = statement; // 全局变量语句
      });
    });
  }
  // 展开这个模块的语句，把这些语句中定义的变量的语句都放到结果里
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach(statement => {
      if (statement.type === 'ImportDeclaration') return; // 导入声明不打包
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });
    return allStatements;
  }
  // 展开一个节点：找到当前节点依赖的变量，访问的变量以及这些变量的声明语句
  // 这些语句可能是在当前模块声明的，也可能是在导入的模块声明的
  expandStatement(statement) {
    let result = [];
    const dependencies = Object.keys(statement._dependsOn); // 外部依赖
    dependencies.forEach(name => {
      // 找到定义这个变量的声明节点
      let definition = this.define(name);
      result.push(...definition);
    });
    if (!statement._included) {
      console.log('set --- statement._included');
      // statement._included = true; // 这个节点已被添加入结果，以后不需要重复添加:  TODO：include不允许修改赋值
      // tree-shaking核心在此处
      result.push(statement);
    }

    return result;
  }
  define(name) {
    // 查找导入变量中有无name
    if (hasOwnProperty(this.imports, name)) {
      // this.imports.age = {name: 'age', localName: "age", source: './test.js}
      const importDeclaration = this.imports[name];
      // 获取依赖模块
      const module = this.bundle.fetchModule(importDeclaration.source, this.path);
      // this.exports['age'] = {node, localName: name, expression}
      // const exportData= module.exports[importDeclaration.name]
      // 调用依赖模块方法，返回定义变量的声明语句   exportData.localName
      return module.define(name);
    } else {
      // key是当前模块变量名，value是定义这个变量的语句
      let statement = this.definitions[name];
      // 变量存在且变量未被标记
      console.log('define--log', statement && statement._included);
      if (statement && !statement._included) {
        return this.expandStatement(statement);
      } else {
        return [];
      }
    }
  }
}

module.exports = Module;
```

内部引用了 `magi-string`、`acorn` 等这些细节不再重复，其实主要就是前置知识中讲的那些基础内容。
