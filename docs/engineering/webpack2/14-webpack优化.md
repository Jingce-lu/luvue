# webpack优化
<!-- TOC -->

- [webpack优化](#webpack优化)
  - [1.noParse 不去解析属性值代表的库的依赖](#1noparse-不去解析属性值代表的库的依赖)
  - [2.解析时指定和排除查找目录](#2解析时指定和排除查找目录)
  - [3.IgnorePlugin](#3ignoreplugin)
    - [举例：](#举例)
    - [IgnorePlugin的使用](#ignoreplugin的使用)
  - [4.DllPlugin动态链接库](#4dllplugin动态链接库)
  - [5.happyPack多线程打包](#5happypack多线程打包)
  - [6.生产环境下webpack的2个内置优化：tree-shaking、scope-hosting](#6生产环境下webpack的2个内置优化tree-shakingscope-hosting)
    - [优化一：Tree-Shaking](#优化一tree-shaking)
    - [优化二：Scope-Hosting](#优化二scope-hosting)
  - [7.抽取公共代码](#7抽取公共代码)
    - [如何抽取公共代码](#如何抽取公共代码)
    - [如何抽离第三方库](#如何抽离第三方库)
  - [8.懒加载(动态加载)](#8懒加载动态加载)
  - [9.热更新](#9热更新)

<!-- /TOC -->

## 1.noParse 不去解析属性值代表的库的依赖
:::tip
noParse: 这是module中的一个属性，作用 `不去解析属性值代表的库的依赖`
:::

举例：
1. 我们一般引用jquery，可以如下引用：
    ```js
    import jq from 'jquery'
    ```
2. 对于上面的解析规则：
    > 当解析jq的时候，会去解析jq这个库是否有依赖其他的包
3. 我们对类似jq这类依赖库，一般会认为不会引用其他的包(特殊除外,自行判断)。所以，对于这类不引用其他的包的库，我们在打包的时候就没有必要去解析，这样能够增加打包速率。
4. 所以，可以在webpack的配置中增加noParse属性（以下代码只需要看module的noParse属性）

```js {11}
let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
	mode:'development',
	entry:'./src/index.js',
	output:{
		filename:'bundle.js',
		path:path.resolve(__dirname,'dist')
	},
	module:{
		noParse:/jquery/,//不去解析jquery中的依赖库
		rules:[
			{
				test:/\.js$/,
				use:{
					loader:'babel-loader',
					options:{
						presets:[
							'@babel/preset-env',
							'@babel/preset-react'
						]
					}
				}
			}
		]
	},
	plugins:[
		new HtmlWebpackPlugin({
			template:'./public/index.html'	
		})
	]
}
```

## 2.解析时指定和排除查找目录
**loader解析时指定和排除查找目录**

> 这个很简单，就是指定loader解析的规则，哪些不需要解析，哪些需要解析。一般两者写其一就行。 

> 指定了目录，缩小了解析范围，自然能提升效率，这也算优化方法之一小小小点吧。

```js {2,6,7}
module:{
  noParse:/jquery/,//不去解析jquery中的依赖库
  rules:[
    {
      test:/\.js$/,
      exclude:/node_modules/,//解析不包含的目录,两者写其一即可
      include:path.resolve('src'),//即系包含的目录,两者写其一即可
      use:{
        loader:'babel-loader',
        options:{
          presets:[
            '@babel/preset-env',
            '@babel/preset-react'
          ]
        }
      }
    }
  ]
}
```

## 3.IgnorePlugin
**IgnorePlugin**
  1. 这是webpack内置插件
  2. 这个插件的作用是：`忽略第三方包指定目录，让这些指定目录不要被打包进去`

### 举例：

moment包
> 比如我们要使用moment这个第三方依赖库，该库主要是对时间进行格式化，并且支持多个国家语言。

moment包打包的问题

> 假设我们的代码值引入了以下一个API

```js
import moment from 'moment'

//设置语言
moment.locale('zh-cn');
let r = moment().endOf('day').fromNow();
console.log(r);
```

这样打印出来的就是中文的时间，因为我在使用这个API的时候，前面设置了语言类型`moment.locale`为中文`zh-cn`。<br>
但是，虽然我设置了语言为中文，但是在打包的时候，是会将所有语言都打包进去的。这样就导致包很大，打包速度又慢 <br>
所以，最好能够少打包一些没用的依赖目录进去 <br>
而moment的包含`'./locale/'`该字段路径的文件目录就是各国语言的目录，比如`'./locale/zh-cn'`就是中文语言

### IgnorePlugin的使用
1. 该插件能够使得指定目录被忽略，从而使得打包变快，文件变小
2. 使用方法：
    ```js {3}
    let Webpack = require('webpack');
    plugins:[
      new Webpack.IgnorePlugin(/\.\/locale/,/moment/),//moment这个库中，如果引用了./locale/目录的内容，就忽略掉，不会打包进去
    ]
    ```
3. 问题存在与解决
    > 我们虽然按照上面的方法忽略了包含’./locale/'该字段路径的文件目录,但是也使得我们使用的时候不能显示中文语言了，所以这个时候可以手动引入中文语言的目录

```js
import moment from 'moment'

//设置语言

//手动引入所需要的语言包
import 'moment/locale/zh-cn';

moment.locale('zh-cn');

let r = moment().endOf('day').fromNow();
console.log(r);
```

> 这样就OK了。既能够显示中文，又把不必要的语言包都忽略打包了


## 4.DllPlugin动态链接库
场景需求举例:

我们在打包一个react的项目的时候，会把react和react-dom这两个库打包起来。而这两个库很大且基本不会变，所以如果每次打包都要打包这两个第三方包的话，浪费时间，消耗性能。所以，我们一般会采取如下操作：

**将react和react-dom单独打包好，然后动态链接引入即可。如果第二次打包，那么发现react和react-dom已经被打包好了，那么就不需要再打包了，这样就大大提升了性能**。

实现：
1. 在src下新建test.js
    ```js
    module.exports = 'yh';
    ```
2. 新建`webpack.config.react.js`用于单独打包react和react-dom
    ```js
    let path = require('path');

    module.exports = {
      mode: 'development',
      entry: {
        test: './src/test.js'
      },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
      }
    }
    ```
3. 执行`npx webpack --config webpack.config.react.js`，得到dist/test.js。
    ```js
    /******/ (function(modules) { // webpackBootstrap
    /******/  var installedModules = {};
    /******/
    /******/  function __webpack_require__(moduleId) {
    /******/
    /******/   if(installedModules[moduleId]) {
    /******/    return installedModules[moduleId].exports;
    /******/   }
    /******/   var module = installedModules[moduleId] = {
    /******/    i: moduleId,
    /******/    l: false,
    /******/    exports: {}
    /******/   };
    /******/
    /******/   modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/   module.l = true;

    /******/   return module.exports;
    /******/  }
    /******/
    /******/  __webpack_require__.m = modules;
    /******/
    /******/  __webpack_require__.c = installedModules;
    /******/
    /******/  __webpack_require__.d = function(exports, name, getter) {
    /******/   if(!__webpack_require__.o(exports, name)) {
    /******/    Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/   }
    /******/  };
    /******/
    /******/  __webpack_require__.r = function(exports) {
    /******/   if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/   }
    /******/   Object.defineProperty(exports, '__esModule', { value: true });
    /******/  };
    /******/
    /******/  __webpack_require__.t = function(value, mode) {
    /******/   if(mode & 1) value = __webpack_require__(value);
    /******/   if(mode & 8) return value;
    /******/   if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/   var ns = Object.create(null);
    /******/   __webpack_require__.r(ns);
    /******/   Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/   if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/   return ns;
    /******/  };
    /******/
    /******/  __webpack_require__.n = function(module) {
    /******/   var getter = module && module.__esModule ?
    /******/    function getDefault() { return module['default']; } :
    /******/    function getModuleExports() { return module; };
    /******/   __webpack_require__.d(getter, 'a', getter);
    /******/   return getter;
    /******/  };
    /******/
    /******/  __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/  __webpack_require__.p = "";
    /******/
    /******/  return __webpack_require__(__webpack_require__.s = "./src/test.js");
    /******/ })
    /******/ ({

    /***/ "./src/test.js":
    /***/ (function(module, exports) {

    eval("module.exports = 'yh';\n\n//# sourceURL=webpack:///./src/test.js?");

    /***/ })

    /******/ });
    ```
4. 我们原本打包这个test.js是为了得到module.exports的内容’yh’，但是事实上，打包后的test.js并没有把这个值返回出来让一个变量去接收，所以我们也就无法去使用这个值。这时候，如果我们var一个a去接收，那么就可以把这个结果打印出来，如下(下面的代码只需要看第一行跟最后一行)：
    ```js {1,75}
    var a = (function(modules) { // webpackBootstrap
    /******/  var installedModules = {};
    /******/
    /******/  function __webpack_require__(moduleId) {
    /******/
    /******/   if(installedModules[moduleId]) {
    /******/    return installedModules[moduleId].exports;
    /******/   }
    /******/   var module = installedModules[moduleId] = {
    /******/    i: moduleId,
    /******/    l: false,
    /******/    exports: {}
    /******/   };
    /******/
    /******/   modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/   module.l = true;

    /******/   return module.exports;
    /******/  }
    /******/
    /******/  __webpack_require__.m = modules;
    /******/
    /******/  __webpack_require__.c = installedModules;
    /******/
    /******/  __webpack_require__.d = function(exports, name, getter) {
    /******/   if(!__webpack_require__.o(exports, name)) {
    /******/    Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/   }
    /******/  };
    /******/
    /******/  __webpack_require__.r = function(exports) {
    /******/   if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/   }
    /******/   Object.defineProperty(exports, '__esModule', { value: true });
    /******/  };
    /******/
    /******/  __webpack_require__.t = function(value, mode) {
    /******/   if(mode & 1) value = __webpack_require__(value);
    /******/   if(mode & 8) return value;
    /******/   if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/   var ns = Object.create(null);
    /******/   __webpack_require__.r(ns);
    /******/   Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/   if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/   return ns;
    /******/  };
    /******/
    /******/  __webpack_require__.n = function(module) {
    /******/   var getter = module && module.__esModule ?
    /******/    function getDefault() { return module['default']; } :
    /******/    function getModuleExports() { return module; };
    /******/   __webpack_require__.d(getter, 'a', getter);
    /******/   return getter;
    /******/  };
    /******/
    /******/  __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/  __webpack_require__.p = "";
    /******/
    /******/  return __webpack_require__(__webpack_require__.s = "./src/test.js");
    /******/ })
    /******/ ({

    /***/ "./src/test.js":
    /***/ (function(module, exports) {

    eval("module.exports = 'yh';\n\n//# sourceURL=webpack:///./src/test.js?");

    /***/ })

    /******/ });

    console.log(a);
    ```
5. 如果我们每次都这么做的话，那就太麻烦了，所以我们可以给每次输出的时候添加下配置：
    ```js {11}
    let path = require('path');

    module.exports = {
      mode: 'development',
      entry: {
        test: './src/test.js'
      },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: 'ab', //这样打包后的结果就被变量ab接收
        libraryTarget: 'var', //commonjs、umd、var、this等等，默认var，这样就相当于var ab = 打包后的结果
      }
    }
    ```
6. 上面是以test.js为例来打包，那么如果我们打包的是react，就应该写成如下：
    ```js
    let path = require('path');
    module.exports = {
      mode: 'development',
      entry: {
        react: ['react', 'react-dom']
      },
      output: {
        filename: '_dll_[name].js', //产生的文件名_dll_react.js 
        path: path.resolve(__dirname, 'dist'),
        library: '_dll_[name]', //_dll_react
        // libraryTarget:'var',
      }
    }
    ```
7. 这时候我们还需要利用一个插件去生成一个清单，每次打包的时候，先去查找下清单里是否已经存在这个依赖，如果已经存在，则不打包，如果还没存在，则需要打包。
    生成清单需要使用webpack的内置插件`webpack.DllPlugin()`
    ```js {11,15,16,17,18}
    let path = require('path');
    let webpack = require('webpack');
    module.exports = {
      mode: 'development',
      entry: {
        react: ['react', 'react-dom']
      },
      output: {
        filename: '_dll_[name].js', //产生的文件名_dll_react.js 
        path: path.resolve(__dirname, 'dist'),
        library: '_dll_[name]', //_dll_react
        // libraryTarget:'var',
      },
      plugins: [
        new webpack.DllPlugin({
          name: '_dll_[name]', //这个name要与output中的library同名
          path: path.resolve(__dirname, 'dist', 'manifest.json')
        })
      ]
    }
    ```
8. 这样打包出来的话，会在dist生成两个文件，一个是`_dll_react.js`，一个是清单`manifest.json`
9. 然后在index.html去引用这个打包后的文件
    ```html
    <!DOCTYPE html>
    <html>
    <head>
      <title></title>
    </head>
    <body>
      <div id="root"></div>
      <script type="text/javascript" src="/_dll_react.js"></script>
    </body>
    </html>
    ```
10. 但是现在，我们引用react或react-dom的时候，我们需要判断是否在清单里，这时候，我们就需要在我们正式的`webpack.config.js`里进行配置
    > 需要使用到webpack内置插件`new webpack.DllReferencePlugin`
    ```js {31,32,33}
    let path = require('path');
    let webpack = require('webpack');
    let HtmlWebpackPlugin = require('html-webpack-plugin');
    module.exports = {
      devServer: {
        port: 3000,
        open: true,
        contentBase: './dist'
      },
      mode: 'development',
      entry: './src/index.js',
      output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist')
      },
      module: {
        rules: [{
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ]
            }
          }
        }]
      },
      plugins: [
        new webpack.DllReferencePlugin({
          manifest: path.resolve(__dirname, 'dist', 'manifest.json')
        }),
        new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html'
        })
      ]
    }
    ```
11. 这时候再打包，就会发现react和react-dom不打包了，自然打包出的文件就小很多了
12. **注意**：如果第一次打包，那么要先打包下react和react-dom，即：
    ```js
    npx webpack --config webpack.config.react.js
    ```


## 5.happyPack多线程打包
1. 安装happypack
    ```bash
    npm i happypack
    ```
2. 改造webpack.config.js，实现多线程打包js
    ```js {8,13,14}
    let HappyPack = require('happypack');

    module.exports = {
      ...
      module: {
        rules: [{
          test: /\.js$/,
          use: 'HappyPack/loader?id=js' //这个id=js就代表这是打包js的
        }]
      },
      plugins: [
        new HappyPack({
          id: 'js', // 这个id: js就代表这是打包js的
          use: [{ //use是一个数组，这里写原先在rules的use里的loader配置
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/presets-env',
                '@babel/presets-react'
              ]
            }
          }]
        })
      ]
    }
    ```
3. 实现js和css的多线程打包
    ```js {8,12,18,22}
    let HappyPack = require('happypack');

    module.exports = {
      ...
      module: {
        rules: [{
            test: /\.js$/,
            use: 'HappyPack/loader?id=js' //这个id=js就代表这是打包js的
          },
          {
            test: /\.css$/,
            use: 'HappyPack/loader?id=css' //这个id=css就代表这是打包css的
          }
        ]
      },
      plugins: [
        new HappyPack({
          id: 'css', // 这个id: js就代表这是打包js的
          use: ['style-loader', 'css-loader']
        }),
        new HappyPack({
          id: 'js', // 这个id: js就代表这是打包js的
          use: [{ //use是一个数组，这里写原先在rules的use里的loader配置
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/presets-env',
                '@babel/presets-react'
              ]
            }
          }]
        })
      ]
    }
    ```


## 6.生产环境下webpack的2个内置优化：tree-shaking、scope-hosting
webpack自带的优化
### 优化一：Tree-Shaking
1. 在`生产环境`下
2. 使用`import`引入(不是require)
3. 会自动去除没用的代码
4. 举例：
    ```js
    //a.js
    let add = (a,b) => {
      return a + b + 'add';
    }

    let minus = (a,b) => {
      return a - b + 'minus';
    }

    exports default {add,minus}

    //index.js
    import calc from './a.js'

    console.log(calc.add(1,2));
    ```

这时候，在生产环境下打包：只会打包add方法，不会打包minus方法。<br>
这时候，在开发环境下打包：不仅会打包add方法，还会打包minus方法。

1. 加入使用require引入
    ```js
    //a.js
    let add = (a,b) => {
        return a + b + 'add';
    }

    let minus = (a,b) => {
        return a - b + 'minus';
    }

    exports default {add,minus}

    //index.js
    let calc = require('./a.js');

    console.log(calc.add(1,2));//这是报错的，因为es6模块会把皆果放到default上

    console.log(calc.default.add(1,2);//'3add'
    ```
2. 用require，打包，不管在生产还是在开发环境，都会打包add和minus方法


**总结**：import在生产环境下，支持tree-shaking，require不支持tree-shaking

| 语法 |	生产环境 |	开发环境 |
| ----- | --------- | --------- |
| import |	支持tree-shaking	| 不支持 |
| require |	不支持 |	不支持 |


### 优化二：Scope-Hosting
> 作用域提升

1. 在`生产环境`下，
2. 提升作用域
3. 举例：
    ```js
    let a = 1;
    let b = 2;
    let c = 3;
    let d = a + b + c;
    console.log(d);
    ```

    webpack在生产环境下打包的时候，会直接将d打包成a+b+c的结果，即d直接打包成6.这样就无需声明多个变量再去相加。 <br>
    webpack在生产环境下会自动省略不必要的代码。


## 7.抽取公共代码
多页应用一般会重复多次使用部分公共代码，这样每次加载单页的时候，就会重复去加载这些公共代码，会造成以下问题：
1. 相同资源重复被加载，浪费用户流量，增加服务器成本。
2. 每个页面需要加载的资源太大，导致网页首屏加载缓慢，影响用户体验。

> 那么，如果将这些公共代码抽取出来，并让浏览器缓存起来，用户在请求资源的时候，可以直接读取缓存中的这些代码，这样就能解决以上问题。

### 如何抽取公共代码
1. 现在存在如下文件结构：
    ```
        other.js
            ↑
      -------------
      ↑           ↑
    a.js        b.js
      ↓           ↓
      -------------
            ↓
        index.js
    ```

    > 如上图，index.js和other.js都依赖了a.js和b.js，那么只需要将a.js和b.js抽离出来并打包成common.js，然后让index.js和other.js直接引用common.js即可.

2. webpack.config.js配置
    使用`optimization`的`splitChunks`属性，具体看代码注释
    ```js {2,3}
    module.exports = {
      optimization: {
        splitChunks: { //分割代码块，如果只有一个入口，就不需要分割了，只有多页，才需要把公共的抽离出来
          cacheGroups: { //缓存组
            common: { //公共的模块
              chunks: 'initial', //刚开始就要抽离
              minSize: 0, //大小大于0字节的时候需要抽离出来
              minChunks: 2, //重复2次使用的时候需要抽离出来
            }
          }
        }
      },
      ...
    }
    ```

    > 这样就能够在一开始就将大小大于0字节的，并且使用2次以上的代码抽离出来，npm run build得到的文件为：

    ```
    dist
      |
      ----- common~index~other.js
      |
      ----- index.js
      |
      ----- other.js
      |
      ----- index.html

    ```

    这样，index.js和other.js都引用了抽离出来的公共代码`commonindexother.js`

### 如何抽离第三方库
假设在上面的基础上，index.js和other.js都引用了jquery库，那么这样来配置抽离第三方库
1. vendor属性的配置，是用于抽取第三方库的(详看代码和注释)
    ```js
    module.exports = {
      optimization: {
        splitChunks: { //分割代码块，如果只有一个入口，就不需要分割了，只有多页，才需要把公共的抽离出来
          cacheGroups: { //缓存组
            common: { //公共的模块
              chunks: 'initial',
              minSize: 0,
              minChunks: 2,
            },
            vendor: {
              test: /node_modules/, //把这个目录下符合下面几个条件的库抽离出来
              chunks: 'initial', //刚开始就要抽离
              minSize: 0, //大小大于0字节的时候需要抽离出来
              minChunks: 2, //重复2次使用的时候需要抽离出来
            }
          }
        }
      },
      ...
    }
    ```
2. 但是这样会`存在问题`——代码从上到下执行，会先执行common，然后执行vendor，而在执行common的时候，就把jquery抽离出来打包到跟a.js和b.js里面去了，后面的vendor就没有什么效果了。这并不是个好方案，我们最好是能够将库单独抽离出来，于是，可以这么操作：

    在vendor添加权重属性：priority，将权重提高，使得先去抽离第三方库，再去抽离a.js和b.js

    ```js {11}
    module.exports = {
      optimization: {
        splitChunks: { //分割代码块，如果只有一个入口，就不需要分割了，只有多页，才需要把公共的抽离出来
          cacheGroups: { //缓存组
            common: { //公共的模块
              chunks: 'initial',
              minSize: 0,
              minChunks: 2,
            },
            vendor: {
              priority: 1, //添加权重
              test: /node_modules/, //把这个目录下符合下面几个条件的库抽离出来
              chunks: 'initial', //刚开始就要抽离
              minSize: 0, //大小大于0字节的时候需要抽离出来
              minChunks: 2, //重复2次使用的时候需要抽离出来
            }
          }
        }
      },
      ...
    }
    ```

    这样得到的结果为：
    
    ```
    common~index~other.js  579 bytes  
              index.html  388 bytes
                index.js   7.38 KiB 
                other.js   7.38 KiB 
    vendor~index~other.js    306 KiB 
    ```

`备注`:其实以前有一个叫做`commonChunkPlugins`插件用于抽取公共代码的，现在webpack4.0有了自己的配置


## 8.懒加载(动态加载)
> 在这里的懒加载，其实就是按需加载（动态加载）。需要对webpack进行相关配置。

1. 案例情景：
    > 当我点击按钮的时候，需要动态去加载resource.js，并读取该文件导出的内容

    ```js
    //index.js
    /*在页面上有一个按钮，点击按钮去加载资源resource.js*/
    let button = document.createElement('button');

    button.innerHTML = "点击";

    button.addEventListener('click',function(){
    console.log('click');
    //es6草案中的语法,利用jsonp实现动态加载文件
    //直接使用不支持，需要利用语法动态导入的插件@babel/plugin-syntax-dynamic-import
    //vue的懒加载  react的懒加载都是这个原理，打包的时候会打包好resource.js文件，然后按需去动态加载
    import('./resource.js').then(data => {
      console.log(data.default);//数据是放在data的default属性里的
    })
    });

    document.body.appendChild(button);

    //resource.js
    export default 'youhuaResource';
    ```

2. 在上述代码中，直接使用`import()`去动态加载资源，是es6草案中语法，并不是正式语法，所以直接使用会报错，需要配置相关的语法动态导入的插件`@babel/plugin-syntax-dynamic-import`，并在webpack中做简单配置:
    ```js {13,14,15}
    module.exports = {
      ...
      module: {
        rules: [{
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import'
              ]
            }
          }
        }]
      },
      ...
    }
    ```

3. 配置完后，`import()`动态加载返回的是一个`promise`，得到的数据是存在`.then`的回调函数的`data.default`属性中的。


## 9.热更新
> 所谓的热更新指的是对数据变化的局部进行更新，而不进行页面刷新。

热更新配置
1. 在devServer中开启hot配置为true
2. 添加两个webpack的内置插件，分别为`new webpack.NamedModulesPlugin()`和`new webpack.HotModuleReplacementPlugin()`,前者用于打印更新的模块路径，告诉我们哪个模块热更新了；后者是热更新插件。
    ```js
    let path = require('path');
    let webpack = require('webpack');
    let HtmlWebpackPlugin = require('html-webpack-plugin');
    module.exports = {
      devServer: {
        port: 3001,
        open: true,
        contentBase: './dist',
        hot: true, //启用热更新
      },
      ...
      plugins: [
        new webpack.NamedModulesPlugin(), //打印更新的模块路径，告诉我们哪个模块热更新了
        new webpack.HotModuleReplacementPlugin(), //热更新插件
        new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html'
        })
      ]
    }
    ```

3. 这个时候，其实`还不会`热更新。需要在index.js里做一个是否进行热更新的判断
    ```js
    import str from './resource.js'
    console.log(str);


    if (module.hot) { //是否热更新
      module.hot.accept('./resource.js', () => { //如果'./resource.js'热更新了，那么在热更新完成之后可以在回调函数里做一些事情
        console.log('文件更新了');
        let str = require('./resource.js'); //不能使用import，因为import只能写在页面顶端
        console.log(str.default);
      })
    }
    ```
