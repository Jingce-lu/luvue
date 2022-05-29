# Babel 常见配置及插件

[[toc]]

## 常用配置

### @babel/preset-typescript

ts 预设插件，使用 ts 必装

```json
// 配置
{
  "presets": ["@babel/preset-typescript"]
}
```

### @babel/preset-env

js 预设插件，可以使用高版本 js 语法而不需要单独转换，根据 babel 和 corejs polyfill 语法映射进行转换

```js
// 配置
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": ['last 2 versions', 'IE 10'], // browser使用
          "node": 6, // node环境使用
          "modules": "auto", // 转换js语法为目标版本，如cjs、umd、esm（如果esm格式则需要设置为false），auto情况下根据调用方设置（如babel-loader，@rollup/plugin-babel等）
        }
        // entry--自动将导入的模块根据设置的浏览器版本替换成补丁集
        // usage--按需导入，但实际问题更多，比如script标签引入的第三方脚本无法转换
        "useBuiltIns": "entry", // 定义babel如何处理polyfill，@babel/polyfill已弃用下，还需要安装core-js模块， usage 或 entry 时，也是直接使用core-js模块进行导入
        "corejs": { // useBuiltIns是usage或entry时有用，
          "version": "2.8", //
          "proposals": true,
        }
      }
    ]
  ]
}
```

### @babel/preset-react

react 预设插件，包括对 jsx 预发解析等

```js
// 配置
{
  "presets": [
    "@babel/preset-typescript"
  ]
}
```

## 常用插件

### @babel/register

利用 @babel/register 实现即时编译（在 Node 环境下使用 import/export ES6 语法）

@babel/register 只有一个功能，就是重写 node 的 require 方法。

```js
// 通过@babel/register使用node运行时进行即时编译
require('@babel/register')({
  ...babelConfig,
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
  // 编译的文件路径
  only: only.map(file => slash(isAbsolute(file) ? file : join(cwd, file))),
  // 不使用.babelrc文件配置
  babelrc: false,
  // 不使用缓存
  cache: false,
});
```

### @babel/runtime、@babel/plugin-transform-runtime

```js
// 可以对promise等特性进行转换，不支持实例化的方法如 Array.includes(x) **前提是安装@babel/runtime插件
// 在.babelrc配置中
{
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

### @babel/plugin-transform-modules-commonjs

将 es6 语法转换为 commonjs

```js
{
  "plugins": ["@babel/plugin-transform-modules-commonjs"]
}
```

### babel-plugin-react-require

文件中有 jsx 标签时，添加 react 导入声明

```js
{
  "plugins": ["babel-plugin-react-require"]
}
```

### @babel/plugin-syntax-dynamic-import

import 语法动态导入

```js
{
  "plugins": ["@babel/plugin-syntax-dynamic-import"]
}

import('./a.js').then(()=>{
  console.log('a.js is loaded dynamically');
});
```

### @babel/plugin-proposal-export-default-from

编译 export default from 语法

```js
{
  "plugins": ["@babel/plugin-proposal-export-default-from"]
}

export v from "mod";
```

### @babel/plugin-proposal-export-namespace-from

编译 export {} from 'xxx’语法

```js
{
  "plugins": ["@babel/plugin-proposal-export-namespace-from"]
}

export * as ns from "mod";
```

### @babel/plugin-proposal-do-expressions

do{}语句编译

```js
{
  "plugins": ["@babel/plugin-proposal-do-expressions"]
}

const Component = props => (
  <div className="myComponent">
    {do {
      if (color === "blue") {
        <BlueComponent />;
      } else if (color === "red") {
        <RedComponent />;
      } else if (color === "green") {
        <GreenComponent />;
      }
    }}
  </div>
);

let a = do {
  if (x > 10) {
    ("big");
  } else {
    ("small");
  }
};
// is equivalent to:
let a = x > 10 ? "big" : "small";
```

### @babel/plugin-proposal-nullish-coalescing-operator

编译??语法

```js
{
  "plugins": ["@babel/plugin-proposal-nullish-coalescing-operator"]
}

var foo = object.foo ?? "default";
```

### @babel/plugin-proposal-optional-chaining

编译可选链?.语法

```js
{
  "plugins": ["@babel/plugin-proposal-optional-chaining"]
}

var foo = a?.b?.c
```

### @babel/plugin-proposal-decorators

编译 class 装饰器

```js
{
  "plugins": ["@babel/plugin-proposal-decorators"]
}

@isTestable(true)
class MyClass {}

function isTestable(value) {
  return function decorator(target) {
    target.isTestable = value;
  };
}
```

### @babel/plugin-proposal-class-properties

编译类属性和静态属性（@babel/preset-env 的 ES2022 中已包含）

```js
{
  "plugins": ["@babel/plugin-proposal-class-properties"]
}
```

### babel-plugin-istanbul

istanbul 添加到编译后的代码

```js
{
  "plugins": ["babel-plugin-istanbul"]
}
```
