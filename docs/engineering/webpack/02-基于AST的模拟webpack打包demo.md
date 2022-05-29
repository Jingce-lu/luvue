# 基于AST的模拟webpack打包demo
<!-- TOC -->

- [基于AST的模拟webpack打包demo](#基于ast的模拟webpack打包demo)
  - [问题提出](#问题提出)
  - [思路梳理](#思路梳理)
    - [首先需要写一个获取引用文件的函数，使用的是AST方法，这里给出函数：](#首先需要写一个获取引用文件的函数使用的是ast方法这里给出函数)
    - [如何找到所有的引用文件](#如何找到所有的引用文件)
    - [导出模块，生成es5的可执行js文件](#导出模块生成es5的可执行js文件)
  - [下面完整的代码](#下面完整的代码)
  - [生成的文件代码](#生成的文件代码)

<!-- /TOC -->

## 问题提出
现在有4个文件
```
            --  file1
main.js -- |
            --  file2  -- file2_1
```

main.js
```js
import './file1.js'
import './file2.js'
console.log('I am done!')
```

file1 :
```js
console.log('I am file 1') 
```

file2 :
```js
import'./file2_1.js'
console.log('I am file 2')
```

file2_1 :
```js
console.log('hi ,you get me ')
```

## 思路梳理
AST作为语法结构分析的方法效果很显著，所以这里使用AST来获取每个文件中导入的文件地址，文件内容且为每一个文件编号，这里认为是将每一个文件作为一个模块，然后导出每个模块的内容，这里的导出模块需要以一个递归调用的方式逐个导出，下面的代码里会说到.

### 首先需要写一个获取引用文件的函数，使用的是AST方法，这里给出函数：
```js
function createAsset(filename) {
  console.log(filename)
  //获取文件，返回值是字符串
  const content = fs.readFileSync(filename, "utf-8");
 
  //讲字符串为ast（抽象语法树， 这个是编译原理的知识，说得简单一点就是，可以把js文件里的代码抽象成一个对象，代码的信息会存在对象中）
  //babylon 这个工具是是负责解析字符串并生产ast。
  const ast = babylon.parse(content, {
    sourceType: "module"
  });
  // https://babeljs.io/docs/en/babel-parser#babelparserparsecode-options
  //用来存储 文件所依赖的模块，简单来说就是，当前js文件 import 了哪些文件，都会保存在这个数组里
  const dependencies = [];
 
  //遍历当前ast（抽象语法树）
  traverse(ast, {
    //找到有 import语法 的对应节点
    ImportDeclaration: ({ node }) => {
      //把当前依赖的模块加入到数组中，其实这存的是字符串，
      //例如 如果当前js文件 有一句 import message from './message.js'， 
      //'./message.js' === node.source.value
      dependencies.push(node.source.value);
    }
  });
 
  //模块的id 从0开始， 相当一个js文件 可以看成一个模块
  const id = ID++;
 
  //这边主要把ES6 的代码转成 ES5
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"]
  });
  // https://babeljs.io/docs/en/babel-preset-env#browserslist-integration
  return {
    id,
    filename,
    dependencies,
    code
  };
}
```

babel的每一个解析函数下面标注了链接，可以查看函数参数和使用方法

这个函数就是转换文本为AST,找到import的节点拿到文件路径，将语法树转为ES5，返回id（作为模块的id），dependencies(文件中的依赖)，code（ES5代码）

### 如何找到所有的引用文件
这里提供的是广度搜索的思路，采用队列的方式去遍历所有编译路径上的节点
```js
//从入口开始分析所有依赖项，形成依赖图，采用广度遍历
function createGraph(entry) {
  const mainAsset = createAsset(entry);
  
  //既然要广度遍历肯定要有一个队列，第一个元素肯定是 从 "./example/entry.js" 返回的信息
  const queue = [mainAsset];
  
  
  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
   
    //新增一个属性来保存子依赖项的数据
    //保存类似 这样的数据结构 --->  {"./message.js" : 1}
    asset.mapping = {};
 
    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath);
      // console.log(dirname,relativePath,absolutePath)
      //获得子依赖（子模块）的依赖项、代码、模块id，文件名
      const child = createAsset(absolutePath);
 
      //给子依赖项赋值，
      asset.mapping[relativePath] = child.id;
 
      //将子依赖也加入队列中，广度遍历
      queue.push(child);
    });
  }
  return queue;
}
```

函数有个起始文件，即main.js文件路径，调用前面写的语法分析函数，获取返回的数据结构，遍历数据结构中的依赖数组，将返回的结果继续Push到队列中，这里值得注意的是新增了一个mapping的json数据结构，目的是为了后面的导出模块找到依赖的模块关系


### 导出模块，生成es5的可执行js文件
```js
//根据生成的依赖关系图，生成对应环境能执行的代码，目前是生产浏览器可以执行的
function bundle(graph) {
  let modules = "";
 
  //循环依赖关系，并把每个模块中的代码存在function作用域里
  graph.forEach(mod => {
    modules += `${mod.id}:[
      function (require, module, exports){
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });
  //require, module, exports 是 cjs的标准不能再浏览器中直接使用，所以这里模拟cjs模块加载，执行，导出操作。
  const result = `
    (function(modules){
      //创建require函数， 它接受一个模块ID（这个模块id是数字0，1，2） ，它会在我们上面定义 modules 中找到对应是模块.
      function require(id){
        const [fn, mapping] = modules[id];
        function localRequire(relativePath){
          //根据模块的路径在mapping中找到对应的模块id
          return require(mapping[relativePath]);
        }
        const module = {exports:{}};
        //执行每个模块的代码。
        fn(localRequire,module,module.exports);
        return module.exports;
      }
      //执行入口文件，
      require(0);
    })({${modules}})
  `;
 
  return result;
}
```

result 由两部分组成，一部份是自己定义的函数，另一部分就是参数的传入，在自定义的函数里面会调用mapping中的数据，找到下一个参数的模块，localrequire()函数就是深度去遍历所有的依赖关系，逐个输出。

## 下面完整的代码
```js
const fs = require("fs");
const path = require("path");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require('@babel/core');
 
 
let ID = 0;
//读取文件信息，并获得当前js文件的依赖关系
function createAsset(filename) {
  console.log(filename)
  //获取文件，返回值是字符串
  const content = fs.readFileSync(filename, "utf-8");
 
  //讲字符串为ast（抽象语法树， 这个是编译原理的知识，说得简单一点就是，可以把js文件里的代码抽象成一个对象，代码的信息会存在对象中）
  //babylon 这个工具是是负责解析字符串并生产ast。
  const ast = babylon.parse(content, {
    sourceType: "module"
  });
  // https://babeljs.io/docs/en/babel-parser#babelparserparsecode-options
  //用来存储 文件所依赖的模块，简单来说就是，当前js文件 import 了哪些文件，都会保存在这个数组里
  const dependencies = [];
 
  //遍历当前ast（抽象语法树）
  traverse(ast, {
    //找到有 import语法 的对应节点
    ImportDeclaration: ({ node }) => {
      //把当前依赖的模块加入到数组中，其实这存的是字符串，
      //例如 如果当前js文件 有一句 import message from './message.js'， 
      //'./message.js' === node.source.value
      dependencies.push(node.source.value);
    }
  });
 
  //模块的id 从0开始， 相当一个js文件 可以看成一个模块
  const id = ID++;
 
  //这边主要把ES6 的代码转成 ES5
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"]
  });
  // https://babeljs.io/docs/en/babel-preset-env#browserslist-integration
  return {
    id,
    filename,
    dependencies,
    code
  };
}
 
//从入口开始分析所有依赖项，形成依赖图，采用广度遍历
function createGraph(entry) {
  const mainAsset = createAsset(entry);
  
  //既然要广度遍历肯定要有一个队列，第一个元素肯定是 从 "./example/entry.js" 返回的信息
  const queue = [mainAsset];
  
  
  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
   
    //新增一个属性来保存子依赖项的数据
    //保存类似 这样的数据结构 --->  {"./message.js" : 1}
    asset.mapping = {};
 
    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath);
      // console.log(dirname,relativePath,absolutePath)
      //获得子依赖（子模块）的依赖项、代码、模块id，文件名
      const child = createAsset(absolutePath);
 
      //给子依赖项赋值，
      asset.mapping[relativePath] = child.id;
 
      //将子依赖也加入队列中，广度遍历
      queue.push(child);
    });
  }
  return queue;
}
 
//根据生成的依赖关系图，生成对应环境能执行的代码，目前是生产浏览器可以执行的
function bundle(graph) {
  let modules = "";
 
  //循环依赖关系，并把每个模块中的代码存在function作用域里
  graph.forEach(mod => {
    modules += `${mod.id}:[
      function (require, module, exports){
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });
  //require, module, exports 是 cjs的标准不能再浏览器中直接使用，所以这里模拟cjs模块加载，执行，导出操作。
  const result = `
    (function(modules){
      //创建require函数， 它接受一个模块ID（这个模块id是数字0，1，2） ，它会在我们上面定义 modules 中找到对应是模块.
      function require(id){
        const [fn, mapping] = modules[id];
        function localRequire(relativePath){
          //根据模块的路径在mapping中找到对应的模块id
          return require(mapping[relativePath]);
        }
        const module = {exports:{}};
        //执行每个模块的代码。
        fn(localRequire,module,module.exports);
        return module.exports;
      }
      //执行入口文件，
      require(0);
    })({${modules}})
  `;
 
  return result;
}
 
const graph = createGraph("./main.js");
// console.log(graph)
const ret = bundle(graph);
 
// 打包生成文件
fs.writeFileSync("./bundle.js", ret);
```

## 生成的文件代码
```js
(function (modules) {
  //创建require函数， 它接受一个模块ID（这个模块id是数字0，1，2） ，它会在我们上面定义 modules 中找到对应是模块.
  function require(id) {
    const [fn, mapping] = modules[id];
    // fn是function (require, module, exports)
    // console.log(String(fn))
    function localRequire(relativePath) {
      //这里使用深度查找的方式
      console.log(relativePath)
      //根据模块的路径在mapping中找到对应的模块id
      return require(mapping[relativePath]);
    }
    const module = { exports: {} };
    //执行每个模块的代码。
    fn(localRequire, module, module.exports);
    // console.log(localRequire,module.exports)
    return module.exports;
  }
  //执行入口文件，
  require(0);
})({
  0: [
    function (require, module, exports) {
      "use strict";

      require("./file1.js");

      require("./file2.js");

      console.log('I am ready!');
    },
    { "./file1.js": 1, "./file2.js": 2 },
  ], 1: [
    function (require, module, exports) {
      "use strict";

      console.log('I am file 1');
    },
    {},
  ], 2: [
    function (require, module, exports) {
      "use strict";

      require("./file2_1.js");

      console.log('I am file 2');
    },
    { "./file2_1.js": 3 },
  ], 3: [
    function (require, module, exports) {
      "use strict";

      console.log('hi ,you get me ');
    },
    {},
  ],
})
```