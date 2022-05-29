# webpack 4 的 30 个步骤打造优化到极致的 react 开发环境
<!-- TOC -->

- [webpack 4 的 30 个步骤打造优化到极致的 react 开发环境](#webpack-4-的-30-个步骤打造优化到极致的-react-开发环境)
  - [一、基础配置](#一基础配置)
  - [1、init 项目](#1init-项目)
  - [2、安装 webpack](#2安装-webpack)
  - [3、安装 react 并编写代码](#3安装-react-并编写代码)
  - [babel 编译 ES6、 JSX 等](#babel-编译-es6-jsx-等)
  - [5、按需引入polyfill](#5按需引入polyfill)
  - [6、插件 CleanWebpackPlugin](#6插件-cleanwebpackplugin)
  - [7、使用插件 HtmlWebpackPlugin](#7使用插件-htmlwebpackplugin)
  - [8、使用 source-map，对 devtool 进行优化](#8使用-source-map对-devtool-进行优化)
  - [9、使用 WebpackDevServer](#9使用-webpackdevserver)
  - [10、使用 HotModuleReplacement (热模块替换HMR)](#10使用-hotmodulereplacement-热模块替换hmr)
  - [11、react-hot-loader 记录 react 页面留存状态 state](#11react-hot-loader-记录-react-页面留存状态-state)
  - [12、编译css和scss](#12编译css和scss)
  - [13、集成 postcss](#13集成-postcss)
  - [14、处理图片](#14处理图片)
  - [15、处理字体](#15处理字体)
  - [二、webpack优化](#二webpack优化)
  - [1、alias 对文件路径优化](#1alias-对文件路径优化)
  - [2、MiniCssExtractPlugin ，抽取 css 文件](#2minicssextractplugin-抽取-css-文件)
  - [3、代码分割按需加载、提取公共代码](#3代码分割按需加载提取公共代码)
  - [5、文件压缩](#5文件压缩)
  - [6、暴露全局变量](#6暴露全局变量)
  - [8、指定环境,定义环境变量](#8指定环境定义环境变量)
  - [9、css Tree Shaking](#9css-tree-shaking)
  - [10、js Tree Shaking](#10js-tree-shaking)
  - [11、DllPlugin 插件打包第三方类库](#11dllplugin-插件打包第三方类库)
  - [12、使用 happypack 并发执行任务](#12使用-happypack-并发执行任务)
  - [13、PWA 优化策略](#13pwa-优化策略)
  - [14、合并提取 webpack 公共配置](#14合并提取-webpack-公共配置)
  - [15、最终分离配置文件（打完收工）](#15最终分离配置文件打完收工)

<!-- /TOC -->

将 react 和 webpack4 进行结合，集 webpack 的优势于一身，从 0 开始构建一个强大的 react 开发环境。

## 一、基础配置
## 1、init 项目
```bash
mkdir react-webpack4-cook
cd react-webpack4-cook
mkdir src
mkdir dist
npm init -y
```

## 2、安装 webpack
```
yarn add webpack webpack-cli webpack-dev-server -D 

touch webpack.config.js
```

```js
module.exports = {
  mode: "development",
  entry: ["./src/index.js"],
  output: {

    path: path.join(__dirname, "dist"),

    filename: "bundle.js"
  },
  module: {},
  plugins: [],
  devServer: {}
}
```

## 3、安装 react 并编写代码
```
cd src 
cnpm i react react-router-dom -S
```

```
|-src
│      index.js 主文件
├───pages
│      Count.jsx -- 实现了一个计数器的功能，点击按钮，会让数字增加，按钮会实时显示在页面上
│      Home.jsx -- 一个简单的文字展示
└───router
       index.js -- 路由配置文件，两个页面分别对应两个路由 count和 home
```

## babel 编译 ES6、 JSX 等
```
cnpm i babel-loader @babel/core @babel/preset-env  @babel/plugin-transform-runtime   @babel/preset-react -D

cnpm i @babel/polyfill @babel/runtime
```

```js
{
  test: /\.jsx?$/,
  exclude: /node_modules/,
  use: [
    {
      loader: "babel-loader"
    }
  ]
}
```

新建`.babelrc`文件
```json
{
  "presets": ["@babel/preset-env","@babel/preset-react"],
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

## 5、按需引入polyfill
在 `src` 下的 `index.js `中全局引入 `@babel/polyfill` 并写入 ES6 语法 ，但是这样有一个缺点： 全局引入 `@babel/polyfill` 的这种方式可能会导入代码中不需要的 `polyfill`，从而使打包体积更大

更改 `.babelrc`，只转译我们使用到的
```
npm install core-js@2 @babel/runtime-corejs2 -S 
```

```
{
  "presets": ["@babel/preset-env",
              { "useBuiltIns": "usage" },
              "@babel/preset-react"],
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

> 将全局引入这段代码注释掉

这就配置好了按需引入。配置了按需引入 `polyfill` 后，用到 `es6` 以上的函数，`babel` 会自动导入相关的 `polyfill`，这样能大大减少 打包编译后的体积。


## 6、插件 CleanWebpackPlugin
你经过多次打包后会发现，每次打包都会在 dist 目录下边生成一堆文件，但是上一次的打包的文件还在，我们需要每次打包时清除 dist 目录下旧版本文件
```
cnpm install  clean-webpack-plugin -D
```

```
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
 
plugins: [
  new CleanWebpackPlugin() 
]
```

## 7、使用插件 HtmlWebpackPlugin  
经过上一步的操作，`index.html` 也被清除了。因此我们将使用 `HtmlWebpackPlugin` 插件，来生成 `html`， 并将每次打包的 js 自动插入到你的 `index.html` 里面去，而且它还可以基于你的某个 `html` 模板来创建最终的 `index.html`，也就是说可以指定模板哦。
```
cnpm install html-webpack-plugin -D
cd src
touch template.html
```

```html
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>react-webpack4-cook</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```
```js
// webpack.config.js做出更改
const HtmlWebpackPlugin = require('html-webpack-plugin');

plugins: [
  new CleanWebpackPlugin(),
  new HtmlWebpackPlugin({
    filename: 'index.html', // 最终创建的文件名
    template: path.join(__dirname, 'src/template.html') // 指定模板路径
  })
]
```

## 8、使用 source-map，对 devtool 进行优化
webpack 中 devtool 选项用来控制是否生成，以及如何生成 source map。简言之，source map 就是帮助我们定位到错误信息位置的文件。正确的配置source map，能够提高开发效率，更快的定位到错误位置。

在 webpack.config.js 中选项 mode 下加上如下这句话：
```
devtool:"cheap-module-eval-source-map",
devtool:"cheap-module-source-map", 
```

## 9、使用 WebpackDevServer
webpack-dev-server 就是在本地为搭建了一个小型的静态文件服务器，有实时重加载的功能，为将打包生成的资源提供了web服务
```
devServer: {
  hot: true,
  contentBase: path.join(__dirname, "./dist"),
  host: "0.0.0.0", 
  port: 8080,
  historyApiFallback: true, 
  proxy: {
    "/api": "http://localhost:3000"
  }
}
``` 

## 10、使用 HotModuleReplacement (热模块替换HMR)
建立了开发环境本地服务器 后，当修改内容后，网页会同步刷新，我们现在进入 toCount 页面
  1. 点击按钮，将数字加到一个不为 0 的数，比如加到 6
  2. 然后你可以在代码中改变按钮的文字，随便改点东西，会发现，页面刷新后，数字重新变为 0

这显然不是我们想要的，想要的是，能不能把页面的状态保存了，也就是更改了代码后，页面还是保存了数字为 6 的状态，也就是实现局部更改，首先需要用到：`HotModuleReplacementPlugin` 插件

```js
devServer: {
  hot: true
},
plugins: [
  new webpack.HotModuleReplacementPlugin()
],
```

完事之后，继续更上边的操作，点击按钮，数字增加，然后更改内容，发现还是没有保存状态。。。what？怎么办

对@！这还没完呢，接着往下看，我们还需要 `react-hot-loader` 这个插件

## 11、react-hot-loader 记录 react 页面留存状态 state
我们继续接着上边的进行操作，分一下四步
```
cnpm i react-hot-loader -D
```

```js
import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader"; // ---------1、首先引入AppContainre
import { BrowserRouter } from "react-router-dom";
import Router from "./router";
```

```js
renderWithHotReload(Router);//---------2、初始化
```

```js
if (module.hot) {//------------3、热更新操作
  module.hot.accept("./router/index.js", () => {
    const Router = require("./router/index.js").default;
    renderWithHotReload(Router);
  });
} 
function renderWithHotReload(Router) {// -----------4、定义渲染函数
  ReactDOM.render(
    <AppContainer>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </AppContainer>,
    document.getElementById("app")
  );
}
```

## 12、编译css和scss
```
cnpm install css-loader style-loader sass-loader node-sass -D
```

```
{
  test: /\.scss$/,
  use: [
    "style-loader", 
    "css-loader", 
    "sass-loader" 
  ]
}
```

## 13、集成 postcss
最关心的还是这有啥用啊？自动增加前缀， postcss-cssnext 允许你使用未来的 css 特性，并做一些兼容处理。

```
cnpm install  postcss-loader postcss-cssnext -D
```

```
{
  test: /\.scss$/,
  use: [
    "style-loader",
    "css-loader",
    "postcss-loader",
    "sass-loader"
  ]
}
```


## 14、处理图片
```
cnpm i file-loader url-loader -D
```

```js
// file-loader 解决css等文件中引入图片路径的问题
// url-loader 当图片较小的时候会把图片BASE64编码，大于limit参数的时候还是使用file-loader 进行拷贝
{
    test: /\.(png|jpg|jpeg|gif|svg)/,
    use: {
      loader: 'url-loader',
      options: {
        outputPath: 'images/', 
        limit: 10 * 1024
      }
    }
}
```

## 15、处理字体
```js
{
  test: /\.(eot|woff2?|ttf|svg)$/,
  use: [
    {
      loader: 'url-loader',
      options: {
        name: '[name]-[hash:5].min.[ext]',
        limit: 5000, 
        publicPath: 'fonts/',
        outputPath: 'fonts/'
      }
    }
  ]
}
```

## 二、webpack优化
## 1、alias 对文件路径优化
1. extension: 指定 extension 之后可以不用在 require 或是 import 的时候加文件扩展名，会依次尝试添加扩展名进行匹配。
2. alias:  配置别名可以加快webpack查找模块的速度。
    ```js
    resolve: {
      extension: ["", ".js", ".jsx"],
      alias: {
        "@": path.join(__dirname, "src"),
        pages: path.join(__dirname, "src/pages"),
        router: path.join(__dirname, "src/router")
      }

    },
    ```
3. 使用静态资源路径 publicPath (CDN)
    CDN 通过将资源部署到世界各地，使得用户可以就近访问资源，加快访问速度。要接入 CDN，需要把网页的静态资源上传到 CDN 服务上，在访问这些资源时，使用 CDN 服务提供的URL。
    ```
    output:{
      publicPatch: '//【cdn】.com', 
    }
    ```   

## 2、MiniCssExtractPlugin ，抽取 css 文件
如果不做配置，我们的 `css` 是直接打包进 `js` 里面的，我们希望能单独生成 `css` 文件。 因为单独生成 css，css 可以和 js 并行下载，提高页面加载效率。
```
cnpm install mini-css-extract-plugin -D
```

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

{
  test: /\.scss$/,
  use: [

    MiniCssExtractPlugin.loader,
    "css-loader",
    "postcss-loader",
    "sass-loader"
  ]
},
plugins: [
  new MiniCssExtractPlugin({
    filename: "[name].css",
    chunkFilename: "[id].css"
  })
]
```

## 3、代码分割按需加载、提取公共代码
为什么要实现按需加载？

我们现在看到，打包完后，所有页面只生成了一个bundle.js，**当我们首屏加载的时候，就会很慢。因为他也下载了别的页面的 `js`了**,也就是说，执行完毕之前，页面是 **完！全！空！白！的！**。 如果每个页面单独打包自己的 js，就可以在进入页面时候再加载自己的 js，首屏加载就可以快很多。
```
optimization: {
  splitChunks: {
    chunks: "all", 
  },
},
```

## 5、文件压缩
webpack4 只要在生产模式下， 代码就会自动压缩
```
mode:productioin
```

## 6、暴露全局变量
可以直接在全局使用 $ 变量
```js
new webpack.ProvidePlugin({
  $: 'jquery', 
  jQuery: 'jQuery' 
})
```

## 8、指定环境,定义环境变量
```js
plugins: [
  new webpack.DefinePlugin({
    'process.env': {
      VUEP_BASE_URL: JSON.stringify('http://localhost:9000')
    }
  }),
]
```

## 9、css Tree Shaking
```
npm i glob-all purify-css purifycss-webpack --save-dev
```

```js
const PurifyCSS = require('purifycss-webpack')
const glob = require('glob-all')
plugins: [

  new PurifyCSS({
    paths: glob.sync([

      path.resolve(__dirname, './src/*.html'),
      path.resolve(__dirname, './src/*.js')
    ])
  })
]
```


## 10、js Tree Shaking
清除到代码中无用的js代码，只支持 import 方式引入，不支持 commonjs 的方式引入。

**只要 `mode` 是 `production` 就会生效，develpoment 的 tree shaking 是不生效的，因为 webpack 为了方便你的调试**。

```
  optimization: {
    usedExports:true,
  }
```

## 11、DllPlugin 插件打包第三方类库
项目中引入了很多第三方库，这些库在很长的一段时间内，基本不会更新，打包的时候分开打包来提升打包速度，而 DllPlugin 动态链接库插件。

**其原理就是把网页依赖的基础模块抽离出来打包到 dll 文件中，当需要导入的模块存在于某个 dll 中时，这个模块不再被打包，而是去 dll 中获取**。

安装 jquery，并在入口文件引入。新建 webpack.dll.config.js 文件

```js
const path = require('path')
const webpack = require('webpack')
const src = path.resolve(process.cwd(), 'src');
const evn = process.env.NODE_ENV == "production" ? "production" : "development";

module.exports = {
  mode: 'production',
  entry: {
    jquery: ['jquery']
  },
  output: {
    path: path.resolve(__dirname, '..', 'dll'),
    filename: '[name].dll.js',
    library: '[name]_[hash]',
    libraryTarget: 'this'
  },
  plugins: [
    new webpack.DllPlugin({
      context: process.cwd(),
      path: path.resolve(__dirname, '..', 'dll/[name]-manifest.json'),
      name: '[name]_[hash]'
    })
  ]
}
```

在package.json中添加

```
"build:dll": "webpack --config ./build/webpack.dll.config.js",
```

运行
```
npm run build:dll
```

你会发现多了一个 dll 文件夹，里边有 dll.js 文件，这样我们就把我们的 jquery 这些已经单独打包了，接下来怎么使用呢？

需要再安装一个依赖 
```
npm i add-asset-html-webpack-plugin
```

它会将我们打包后的 dll.js 文件注入到我们生成的 index.html 中.在 webpack.base.config.js 文件中进行更改。

```js
new AddAssetHtmlWebpackPlugin({
  filepath: path.resolve(__dirname, '../dll/jquery.dll.js') // 对应的 dll 文件路径
}),
new webpack.DllReferencePlugin({
  manifest: path.resolve(__dirname, '..', 'dll/jquery-manifest.json')
})
```

好了，你可有把 new webpack.DllReferencePlugin 这个插件注释掉，打包试下，在放开打包试一下，我测试结果，注释前 5689，注释后，5302ms，才差了300ms ? 注意，我这里只有一个 jquery 包作为演示，要是你把很多个都抽离了出来呢？？？那岂不是很恐怖了。如果你看的有点迷迷糊糊，那推荐去线上看一下我的代码吧，一看便知。


## 12、使用 happypack 并发执行任务
运行在 Node 之上的 Webpack 是单线程模型的，也就是说 Webpack 需要一个一个地处理任务，不能同时处理多个任务。 `Happy Pack` 就能让 Webpack 做到这一点，它将任务分解给多个子进程去并发执行，子进程处理完后再将结果发送给主进程。

```
cnpm i -D happypack
```

```js
rules: [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: [{

      loader: "happypack/loader?id=busongBabel"
    }]
  }
]
plugins: [
  new HappyPack({
    id: 'busongBabel',
    loaders: ['babel-loader?cacheDirectory'],
    threadPool: HappyPackThreadPool,
  })
]
```

## 13、PWA 优化策略
简言之：在你第一次访问一个网站的时候，如果成功，做一个缓存，当服务器挂了之后，你依然能够访问这个网页 ，这就是 PWA。那相信你也已经知道了，这个只需要在生产环境，才需要做 PWA 的处理，以防不测。

```
cnpm i workbox-webpack-plugin -D
```

```js
const WorkboxPlugin = require('workbox-webpack-plugin') 
const prodConfig = {
  plugins: [
    
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true
    })
  ]
}
```

在入口文件加上
```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('service-worker registed')
      })
      .catch(error => {
        console.log('service-worker registed error')
      })
  })
}
```

配置完后，你可以打包到 dist 目录下，在 dist 目录下启动一个静态服务器，访问首页，然后关闭这个服务器，你会惊讶的发现：网站竟然还能够访问，哈哈，是不是很神奇？

## 14、合并提取 webpack 公共配置
开发环境与生产环境以及webpack配置文件的分离，具体需要用到`webpack-merge`，用来 合并 webpack配置。


## 15、最终分离配置文件（打完收工）
> 愿世间再无 webpack 配置工程师
