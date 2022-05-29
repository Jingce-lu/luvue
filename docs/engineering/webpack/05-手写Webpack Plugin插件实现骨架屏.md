# 手写Webpack Plugin插件实现骨架屏
<!-- TOC -->

- [手写Webpack Plugin插件实现骨架屏](#手写webpack-plugin插件实现骨架屏)
  - [前提：](#前提)
  - [1.什么是骨架屏？](#1什么是骨架屏)
  - [2. 编写骨架屏样式](#2-编写骨架屏样式)
  - [3. 编写Plugin](#3-编写plugin)
  - [4.在dev 和 prod 配置文件中引入自己的插件](#4在dev-和-prod-配置文件中引入自己的插件)
  - [5.打包](#5打包)
  - [拓展](#拓展)

<!-- /TOC -->

## 前提：
以vue项目为例，使用官方脚手架初始化一套项目！

## 1.什么是骨架屏？
骨架屏就是页面内容还未加载完成的时候，先让一些图片或者固定结构占位，待内容加载完成后把他替换掉。

![image.png](https://upload-images.jianshu.io/upload_images/5878306-aa95f3ccfa7f82d8.png?imageMogr2/auto-orient/strip|imageView2/2/w/437/format/webp)

![image.png](https://upload-images.jianshu.io/upload_images/5878306-05ceaa52d1ca900f.png?imageMogr2/auto-orient/strip|imageView2/2/format/webp)


## 2. 编写骨架屏样式
首先咱们要写一个骨架屏，可以是ui给你的图，也可以是div css写一个简单点的。

![image.png](https://upload-images.jianshu.io/upload_images/5878306-9f34d7af084af739.png?imageMogr2/auto-orient/strip|imageView2/2/format/webp)

上图代码如下：
```html
<div id="app">
    <div style="width:100%;height:50px;background: rgb(211, 219, 224);"></div>
    <ul class="loading-skeleton" style="">
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
        <li>
            <div class="d1"></div>
            <div class="d2 o"></div>
            <div class="d2 d"></div>
        </li>
    </ul>
    <style>
        .loading-skeleton{
            width:100%;height:auto;list-style: none;overflow: hidden;margin:0;padding:0;
        }
        .loading-skeleton li{
            width: 40%;
            height: 180px;
            float: left;
            margin: 3% 7% 3% 3%;
        }
        .loading-skeleton li .d1{
            width: 100%;
            height: 130px;
            background: rgb(211, 219, 224);
        }
        .loading-skeleton li .d2{
            width: 100%;
            height: 15px;
            background: rgb(211, 219, 224);
            margin-top: 5px;
        }
        .loading-skeleton .o {
            float:left;width:92%;height:100px;margin:3%;
            background: rgb(211, 219, 224);
            animation: skeleton-stripes 1s linear infinite;
            transform-origin: left;
            animation: skeleton-stretch .5s linear infinite alternate;
        }
        .loading-skeleton .d {
            float:left;width:92%;height:100px;margin:3%;
            background: rgb(211, 219, 224);
            animation: skeleton-stripes 1s linear infinite;
            transform-origin: left;
            animation: skeleton-stretch .5s -.5s linear infinite alternate;
        }

        @keyframes skeleton-stretch {
            from {
                transform: scalex(1);
            }
            to {
                transform: scalex(.3);
            }
        }
    </style>
</div>
```

## 3. 编写Plugin
在build目录下新建MyPlugin_skeleton.js（名字随便起），并写入如下代码:
```js
let MyPlugin_skeleton = function (options) {
    this.template = options.template;
};
MyPlugin_skeleton.prototype.apply = function (compiler) {
    console.log('生成骨架中...');
    compiler.plugin('compilation', compilation => {
        compilation.plugin('html-webpack-plugin-before-html-processing', (htmlData, callback) => {
            /**
             * htmlData是打包dist后 index.html 的内容
             * 然后用replace去替换掉
             */
            // console.log(htmlData)
            htmlData.html = htmlData.html.replace(
                `<div id="app"></div>`,
                `<div id="app">
                        ... 这里是写好的骨架屏样式
                 </div>`
            );
            callback(null, htmlData);
        });
    });
};
module.exports = MyPlugin_skeleton;
```

[html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin) 提供了一系列事件：
html-webpack-plugin-before-html-generation
html-webpack-plugin-before-html-processing
html-webpack-plugin-alter-asset-tags
html-webpack-plugin-after-html-processing
html-webpack-plugin-after-emit
html-webpack-plugin-alter-chunks
我们可以注册到它处理 HTML 之前，使用 html-webpack-plugin-before-html-processing 事件把骨架屏动态插入进去；


## 4.在dev 和 prod 配置文件中引入自己的插件
```js
// 引入骨架插件
const MyPlugin_skeleton = require('./MyPlugin_skeleton')
 ...
 new HtmlWebpackPlugin({
   filename: config.build.index,
   template: 'index.html',
   inject: true,
   minify: {
     removeComments: true,
     collapseWhitespace: true,
     removeAttributeQuotes: true
     // more options:
     // https://github.com/kangax/html-minifier#options-quick-reference
    },
    // necessary to consistently work with multiple chunks via CommonsChunkPlugin
    chunksSortMode: 'dependency'
 }),
 new MyPlugin_skeleton({
   template: '骨架屏插件'
 }),
 ...
```
 
## 5.打包
执行cnpm run build,打开dist/index.html 可以看到我们的骨架屏已经插入到root中

![image.png](https://upload-images.jianshu.io/upload_images/5878306-1b92d5f423587b32.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

到此我们实现了在DOM挂载之前，先显示骨架屏，是不是很简单，此插件可以用于任何项目。

## 拓展
其实还可以根据用户访问路径进行打包不同的骨架，无非就加入path判断，塞入不同样式。
