# webpack 打包组件和基础库

[[toc]]

## webpack 打包库和组件

webpack 除了可以⽤来打包应⽤，也可以⽤来打包 js 库。

接下来我们实现⼀个⼤整数加法库的打包

- 需要打包压缩版和⾮压缩版本
- ⽀持 AMD/CJS/ESM 模块引⼊

## 库的录结构和打包要求

打包输出的库名称:

- 未压缩版 `large-number.js`
- 压缩版 `large-number.min.js`

```js
+ |- /dist
+   |- large-number.js
+   |- large-number.min.js
+ |- webpack.config.js
+ |- package.json
+ |- index.js
+ |- /src
+   |- index.js
```

## 支持的使用方式

1. ⽀持 ES module
   ```js
   import * as largeNumber from 'large-number';
   // ...
   largeNumber.add('999', '1');
   ```
2. ⽀持 CJS
   ```js
   const largeNumbers = require('large-number');
   // ...
   largeNumber.add('999', '1');
   ```
3. ⽀持 AMD
   ```js
   require(['large-number'], function (large-number) {
   // ...
   largeNumber.add('999', '1');
   });
   ```
4. 可以直接通过 script 引⼊
   ```html
   <!DOCTYPE html>
   <html>
     ...
     <script src="https://unpkg.com/large-number"></script>
     <script>
       // ...
       // Global variable
       largeNumber.add('999', '1');
       // Property in the window object
       window.largeNumber.add('999', '1');
       // ...
     </script>
   </html>
   ```

## 如何将库暴露出去？

- `library`: 指定库的全局变量
- `libraryTarget`: ⽀持库引⼊的⽅式

```js
module.exports = {
  mode: 'production',
  entry: {
    'large-number': './src/index.js',
    'large-number.min': './src/index.js',
  },
  output: {
    filename: '[name].js',
    library: 'largeNumber',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
};
```

## 如何指对 .min 压缩

通过 `include` 设置只压缩 `min.js` 结尾的⽂件

```js
module.exports = {
  mode: 'none',
  entry: {
    'large-number': './src/index.js',
    'large-number.min': './src/index.js',
  },
  output: {
    filename: '[name].js',
    library: 'largeNumber',
    libraryTarget: 'umd',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/,
      }),
    ],
  },
};
```

## 设置入口文件

package.json 的 main 字段为 index.js，根目录新增 index.js 文件

```js
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/large-number.min.js');
} else {
  module.exports = require('./dist/large-number.js');
}
```

## 实战开发

1. 初始化项目

   ```bash
   mkdir large-number

   cd large-number

   npm init -y

   npm i webpack webpack-cli -D
   ```

2. 创建`src/index.js`，在里面实现大整数加法功能

   ```js
   export default function add(a, b) {
     let i = a.length - 1;
     let j = b.length - 1;

     let carry = 0;
     let ret = '';
     while (i >= 0 || j >= 0) {
       let x = 0;
       let y = 0;
       let sum;

       if (i >= 0) {
         x = a[i] - '0';
         i--;
       }

       if (j >= 0) {
         y = b[j] - '0';
         j--;
       }

       sum = x + y + carry;

       if (sum >= 10) {
         carry = 1;
         sum -= 10;
       } else {
         carry = 0;
       }
       // 0 + ''
       ret = sum + ret;
     }

     if (carry) {
       ret = carry + ret;
     }

     return ret;
   }

   // add('999', '1');
   // add('1', '999');
   // add('123', '321');
   // console.log(add('999999999999999999999999999', '1'))
   ```

3. 创建 `webpack.config.js`
   需要安装插件：`npm i terser-webpack-plugin -D`

   “terser-webpack-plugin”: “^1.3.0”，4.0 会报错

   ```js
   const TerserPlugin = require('terser-webpack-plugin');

   module.exports = {
     entry: {
       'large-number': './src/index.js',
       'large-number.min': './src/index.js',
     },
     output: {
       filename: '[name].js',
       library: 'largeNumber',
       libraryTarget: 'umd',
       libraryExport: 'default',
     },
     mode: 'none',
     optimization: {
       minimize: true,
       minimizer: [
         new TerserPlugin({
           include: /\.min\.js$/,
         }),
       ],
     },
   };
   ```

4. 设置入口文件
   根目录新增 index.js 文件
   ```js
   if (process.env.NODE_ENV === 'production') {
     module.exports = require('./dist/large-number.min.js');
   } else {
     module.exports = require('./dist/large-number.js');
   }
   ```
   `package.json` 的配置，里面添加了 `prepublish` 的处理
   ```json
   {
     "name": "large-number",
     "version": "1.0.0",
     "description": "大整数加法打包",
     "main": "index.js",
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1",
       "build": "webpack",
       "prepublish": "webpack"
     },
     "keywords": [],
     "author": "",
     "license": "ISC",
     "devDependencies": {
       "terser-webpack-plugin": "^1.3.0",
       "webpack": "^4.44.1",
       "webpack-cli": "^3.3.12"
     }
   }
   ```

然后在业务代码里面使用’large-number’

```js
import React from 'react';
import ReactDOM from 'react-dom';
import './search.less';
import logo from './images/logo.png';
console.log(logo);
import '../../common/index.js';
import { kaimo666 } from './tree-shaking.js';
// 引入大加法
import kaimoLargeNumber from 'kaimo-large-number';

class Search extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      Text: null,
    };
  }

  loadComponent() {
    // 动态加在text.js，返回一个promise
    import('./text.js').then(Text => {
      console.log(Text);
      this.setState({
        Text: Text.default,
      });
    });
  }

  render() {
    const kaimo = kaimo666();
    const { Text } = this.state;
    const kaimoLarge = kaimoLargeNumber('777', '666');
    return (
      <div className="search-text">
        {kaimo}
        凯小默的博客666
        {Text ? <Text /> : null}
        大加法操作'777'+'666'：{kaimoLarge}
        <img src={logo} onClick={this.loadComponent.bind(this)} />
      </div>
    );
  }
}

ReactDOM.render(<Search />, document.getElementById('root'));
```
