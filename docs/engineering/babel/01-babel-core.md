# babel-core的作用是什么
如果你需要以编程的方式来使用 Babel，可以使用 babel-core 这个包。

**babel-core 的作用是把 js 代码分析成 ast ，方便各个插件分析语法进行相应的处理**。有些新语法在低版本 js 中是不存在的，如箭头函数，rest 参数，函数默认值等，这种语言层面的不兼容只能通过将代码转为 ast，分析其语法后再转为低版本 js。首先安装 babel-core。

```bash
$ npm install babel-core
```

```js
var babel = require("babel-core");
```

字符串形式的 JavaScript 代码可以直接使用 `babel.transform` 来编译。

```js
babel.transform("code();", options);
// => { code, map, ast }
```

如果是文件的话，可以使用异步 api：
```js
babel.transformFile("filename.js", options, function(err, result) {
  result; // => { code, map, ast }
});
```

或者是同步 api：
```js
babel.transformFileSync("filename.js", options);
// => { code, map, ast }
```


## @babel/core
```js
var babel = require("@babel/core");
import { transform } from "@babel/core";
import * as babel from "@babel/core";
```

### transform
```js
babel.transform(code: string, options?: Object, callback: Function)
```

ransforms the passed in `code`. Calling a callback with an object with the generated code, source map, and AST.
```js
babel.transform(code, options, function(err, result) {
  result; // => { code, map, ast }
});
```

Example
```js
babel.transform("code();", options, function(err, result) {
  result.code;
  result.map;
  result.ast;
});
```

### transformSync
```js
babel.transformSync(code: string, options?: Object)
```

Transforms the passed in code. Returning an object with the generated code, source map, and AST.
```js
babel.transformSync(code, options) // => { code, map, ast }
```

Example
```js
var result = babel.transformSync("code();", options);
result.code;
result.map;
result.ast;
```

### transformAsync
```js
babel.transformAsync(code: string, options?: Object)
```

Transforms the passed in `code`. Returning an promise for an object with the generated code, source map, and AST.

```js
babel.transformAsync(code, options) // => Promise<{ code, map, ast }>
```

Example
```js
babel.transformAsync("code();", options).then(result => {
  result.code;
  result.map;
  result.ast;
});
```

### ...见官网
[@bable/core](https://babeljs.io/docs/en/next/babel-core.html)