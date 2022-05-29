# 玩转 webpack

[[toc]]

## Loaders

> webpack 开箱即用只支持 JS 和 JSON 两种文件类型，通过 Loaders 去支持其它文件类型并且把它们转化成有效的模块，并且可以添加到依赖图中。本身是一个函数，接受源文件作为参数，返回转换的结果。

### 1、常见的 Loaders

| 名称          | 描述                           |
| ------------- | ------------------------------ |
| babel-loader  | 转换 ES6，ES7 等 JS 新特性语法 |
| css-loader    | 支持.css 文件的加载和解析      |
| less-loader   | 将 less 文件转换成 css 文件    |
| ts-loader     | 将 TS 转换成 JS                |
| file-loader   | 进行图片，字体等的打包         |
| raw-loader    | 将文件以字符串的形式导入       |
| thread-loader | 多行程打包 JS 和 CSS           |

### 2、Loaders 的用法

- `test`：指定匹配规则
- `use`：指定使用的 loader 名称

```js
const path = require('path');
module.exports = {
  output: { filename: 'bundle.js' },
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
    ],
  },
};
```

## Plugins

**插件用于 `bundle` 文件的优化，资源管理和环境变量注入，作用于整个构建过程**。

### 1、常见的 Plugins

| 名称                     | 描述                                             |
| ------------------------ | ------------------------------------------------ |
| CommonsChunkPlugin       | 将 chunks 相同的模块代码提取成公共 js            |
| CleanWebpackPlugin       | 清理目录结构                                     |
| ExtractTextWebpackPlugin | 将 css 从 bunlde 文件里提取成一个独立的 css 文件 |
| CopyWebpackPlugin        | 将文件或者文件夹拷贝到构建的输出目录             |
| HtmlWebpackPlugin        | 创建 html 文件去承载输出的 bundle                |
| UglifyjsWebpackPlugin    | 压缩 JS                                          |
| ZipWebpackPlugin         | 将打包出的资源生成一个 zip 包                    |

### 2、Plugins 的用法

放到 plugins 数组里

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 通过 npm 安装
const webpack = require('webpack'); // 用于访问内置插件
module.exports = {
  output: { filename: 'bundle.js' },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
};
```

### Mode

> Mode 用来指定当前的构建环境是：production、development 还是 none，设置 mode 可以使用 webpack 内置的函数，默认值为 production。

Mode 的内置函数功能

| 名称        | 描述                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| development | 会将 process.env.NODE_ENV 的值设为 development。启用 NamedChunksPlugin 和 NamedModulesPlugin。                                                                                                                            |
| production  | 会将 process.env.NODE_ENV 的值设为 production。启用 FlagDependencyUsagePlugin, FlagIncludedChunksPlugin, ModuleConcatenationPlugin, NoEmitOnErrorsPlugin, OccurrenceOrderPlugin, SideEffectsFlagPlugin 和 UglifyJsPlugin. |
| none        | 不开启任何优化项                                                                                                                                                                                                          |

## 文件监听

> 文件监听是在发现源码发生变化时，自动重新构建出新的输出文件。

webpack 开启监听模式，有两种方式：

- 启动 `webpack` 命令时，带上 `--watch` 参数
- 在配置 `webpack.config.js` 中设置 `watch: true`

原理分析

1. 轮询判断文件的最后编辑时间是否变化
2. 某个文件发生了变化，并不会立刻告诉监听者，而是先缓存起来，等 `aggregateTimeout`

轮询判断文件的最后编辑时间是否发生变化，一开始有个文件的修改时间，先存储起来这个修改时间，下次再有修改就会和上次修改时间比对，发现不一致的时候不会立即告诉监听者，而是把文件修改缓存起来，等待一段时间，等待期间内如果有其他发生变化，会把变化列表一起构建，并生成到 bundle 文件夹

anymatch 模式

```js
module.export = {
  // 默认 false，也就是不开启
  watch: true,
  // 只有开启监听模式时，watchOptions才有意义
  watchOptions: {
    // 默认为空，不监听的文件或者文件夹，支持正则匹配
    // 对于某些系统，监听大量文件系统会导致大量的 CPU 或内存占用。这个选项可以排除一些巨大的文件夹，例如 node_modules
    // 也可以使用 anymatch 模式：ignored: "files/**/*.js"
    ignored: /node_modules/,
    // 监听到变化发生后会等300ms再去执行，默认300ms
    aggregateTimeout: 300,
    // 通过传递 true 开启 polling，或者指定毫秒为单位进行轮询。
    poll: 1000, // 每秒检查一次变动
  },
};
```

## 自动清理构建目录

### 通过 npm scripts 清理构建目录

```
rm -rf ./dist && webpack
rimraf ./dist && webpack
```

以包的形式包装`rm -rf`命令，用来删除文件和文件夹的，不管文件夹是否为空，都可删除。

```js
const rimraf = require('rimraf');
// 删除当前目录下的 test.txt
rimraf('./test.txt', function (err) {
  console.log(err);
});
//删除dist目录
rimraf(path.resolve(__dirname, '../dist'), err => {
  if (err) throw err;
});
```

### 自动清理构建目录 使用 `clean-webpack`

```js{12,13}
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
    search: './src/search.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]_[chunkhash].js',
  },
  mode: 'production',
  plugins: [new CleanWebpackPlugin()],
};
```

## PostCSS 插件 autoprefixer 自动补齐 CSS3 前缀

1. 使用 autoprefixer 插件
   > 安装依赖 npm i postcss-loader autoprefixer -D
2. 根据 `Can I Use` 规则[https://caniuse.com/](https://caniuse.com/)

::: tip 注意
`postcss-loader` 执行顺序必须保证在 `css-loader` 之前，建议还是放在 `less` 或者 `sass` 等预处理器之后更好。即 `loader` 顺序：`less-loader -> postcss-loader -> css-loader -> style-loader` 或者 `MiniCssExtractPlugin.loader`，其实 p`ostcss-loader` 放在 `less-loader` 之前问题也不大，平时使用的 less 里面的语法基本不会和 autoprefixer 处理产生冲突的。
:::

```js
module.exports = {
  entry: {
    index: './src/index.js',
    search: './src/search.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]_[chunkhash].js',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('autoprefixer')({
                  browsers: ['last 2 version', '>1%', 'ios 7'],
                }),
              ],
            },
          },
        ],
      },
    ],
  },
};
```

## 移动端 CSS px 自动转换成 rem

1. 使用 `px2rem-loader`
   ```bash
   npm i px2rem-loader -D
   ```
2. 页面渲染时计算根元素的 font-size 值
   ```bash
   npm i lib-flexible -S
   ```
3. 手动添加 `flexible`
   找到`node_modules\lib-flexible\flexible.js`，复制到 search.html 文件里面

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <meta http-equiv="X-UA-Compatible" content="ie=edge">
       <title>Document</title>
       <script>
           ;(function(win, lib) {
               var doc = win.document;
               var docEl = doc.documentElement;
               var metaEl = doc.querySelector('meta[name="viewport"]');
               var flexibleEl = doc.querySelector('meta[name="flexible"]');
               var dpr = 0;
               var scale = 0;
               var tid;
               var flexible = lib.flexible || (lib.flexible = {});

               if (metaEl) {
                   console.warn('将根据已有的meta标签来设置缩放比例');
                   var match = metaEl.getAttribute('content').match(/initial\-scale=([\d\.]+)/);
                   if (match) {
                       scale = parseFloat(match[1]);
                       dpr = parseInt(1 / scale);
                   }
               } else if (flexibleEl) {
                   var content = flexibleEl.getAttribute('content');
                   if (content) {
                       var initialDpr = content.match(/initial\-dpr=([\d\.]+)/);
                       var maximumDpr = content.match(/maximum\-dpr=([\d\.]+)/);
                       if (initialDpr) {
                           dpr = parseFloat(initialDpr[1]);
                           scale = parseFloat((1 / dpr).toFixed(2));
                       }
                       if (maximumDpr) {
                           dpr = parseFloat(maximumDpr[1]);
                           scale = parseFloat((1 / dpr).toFixed(2));
                       }
                   }
               }

               if (!dpr && !scale) {
                   var isAndroid = win.navigator.appVersion.match(/android/gi);
                   var isIPhone = win.navigator.appVersion.match(/iphone/gi);
                   var devicePixelRatio = win.devicePixelRatio;
                   if (isIPhone) {
                       // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
                       if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
                           dpr = 3;
                       } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
                           dpr = 2;
                       } else {
                           dpr = 1;
                       }
                   } else {
                       // 其他设备下，仍旧使用1倍的方案
                       dpr = 1;
                   }
                   scale = 1 / dpr;
               }

               docEl.setAttribute('data-dpr', dpr);
               if (!metaEl) {
                   metaEl = doc.createElement('meta');
                   metaEl.setAttribute('name', 'viewport');
                   metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
                   if (docEl.firstElementChild) {
                       docEl.firstElementChild.appendChild(metaEl);
                   } else {
                       var wrap = doc.createElement('div');
                       wrap.appendChild(metaEl);
                       doc.write(wrap.innerHTML);
                   }
               }

               function refreshRem(){
                   var width = docEl.getBoundingClientRect().width;
                   if (width / dpr > 540) {
                       width = 540 * dpr;
                   }
                   var rem = width / 10;
                   docEl.style.fontSize = rem + 'px';
                   flexible.rem = win.rem = rem;
               }

               win.addEventListener('resize', function() {
                   clearTimeout(tid);
                   tid = setTimeout(refreshRem, 300);
               }, false);
               win.addEventListener('pageshow', function(e) {
                   if (e.persisted) {
                       clearTimeout(tid);
                       tid = setTimeout(refreshRem, 300);
                   }
               }, false);

               if (doc.readyState === 'complete') {
                   doc.body.style.fontSize = 12 * dpr + 'px';
               } else {
                   doc.addEventListener('DOMContentLoaded', function(e) {
                       doc.body.style.fontSize = 12 * dpr + 'px';
                   }, false);
               }
   ```


                refreshRem();

                flexible.dpr = win.dpr = dpr;
                flexible.refreshRem = refreshRem;
                flexible.rem2px = function(d) {
                    var val = parseFloat(d) * this.rem;
                    if (typeof d === 'string' && d.match(/rem$/)) {
                        val += 'px';
                    }
                    return val;
                }
                flexible.px2rem = function(d) {
                    var val = parseFloat(d) / this.rem;
                    if (typeof d === 'string' && d.match(/px$/)) {
                        val += 'rem';
                    }
                    return val;
                }

            })(window, window['lib'] || (window['lib'] = {}));

        </script>
    </head>
    <body>
        <div id="root"></div>
    </body>
    </html>
    ```

4. 配置  
   `remUnit`: 比如设置成 75，代表 `1rem = 75px`  
   `remPrecision`: 保留位数
   ```js
   module.exports = {
     mode: 'production',
     module: {
       rules: [
         {
           test: /.less$/,
           use: [
             MiniCssExtractPlugin.loader,
             'css-loader',
             'less-loader',
             {
               loader: 'postcss-loader',
               options: {
                 plugins: () => [
                   require('autoprefixer')({
                     browsers: ['last 2 version', '>1%', 'ios 7'],
                   }),
                 ],
               },
             },
             {
               loader: 'px2rem-loader',
               options: {
                 remUnit: 75,
                 remPrecision: 8,
               },
             },
           ],
         },
       ],
     },
   };
   ```
5. 不转化怎么处理

   > 后面有 `/*no*/` 这种注释语法会不进行 rem 的转换

   ```css
   @font-face {
     font-family: 'SourceHanSerifSC-Heavy';
     src: url('./fonts/SourceHanSerifSC-Heavy.otf') format('truetype');
   }

   .search-text {
     font-size: 43px;
     width: 200px; /* no */
     color: green;
     font-family: 'SourceHanSerifSC-Heavy';
     display: flex;
   }
   ```

### vue2.x:

```js
webpack：

npm install postcss-loader
var px2rem = require('postcss-px2rem');

module.exports = {
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader!postcss-loader"
      }
    ]
  },
  postcss: function() {
    return [px2rem({remUnit: 75})]; //设置基准值，75是以iphone6的标准
  }
}
```

### vue3.x：

```js
// vue.config.js：

module.exports = {
  lintOnSave: true,
  css: {
    loaderOptions: {
      postcss: {
        plugins: [
          require('postcss-pxtorem')({
            rootValue: 75, // 换算的基数
            // 忽略转换正则匹配项。插件会转化所有的样式的px。比如引入了三方UI，也会被转化。目前我使用 selectorBlackList字段，来过滤
            //如果个别地方不想转化px。可以简单的使用大写的 PX 或 Px 。
            selectorBlackList: ['weui', 'mu'],
            propList: ['*'],
          }),
        ],
      },
    },
  },
};

// 如果是使用 postcss-px2rem：
module.exports = {
  lintOnSave: true,
  css: {
    loaderOptions: {
      postcss: {
        plugins: [
          require('postcss-px2rem')({ remUnit: 30 }), // 换算的基数
        ],
      },
    },
  },
};
```

### gulp

```js
npm install gulp-postcss

var gulp = require('gulp');
var postcss = require('gulp-postcss');
var px2rem = require('postcss-px2rem');

gulp.task('default', function() {
  var processors = [px2rem({remUnit: 75})];
  return gulp.src('./src/*.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest('./dest'));
});
```

## 静态资源内联

资源内联（inline resource），就是将一个资源以内联的方式嵌入进另一个资源里面.

### 资源内联的意义

1. 代码层面
   - 页面框架的初始化脚本
   - 上报相关打点
   - css 内联避免页面闪动
2. 请求层面
   - 减少 HTTP ⽹网络请求数
   - 小图片或者字体内联 (url-loader)

### HTML 和 JS 内联

> 安装 `0.5.1` 的版本 `npm i raw-loader@0.5.1 -D`

0.5.1 版本的 raw-loader 的代码：

```js
module.exports = function (content) {
  this.cacheable && this.cacheable();
  this.value = content;
  return 'module.exports = ' + JSON.stringify(content);
};
```

**注意**：需要使用 `raw-loader` 的 `0.5.1` 版本，最新的版本的 `raw-loader` 使用了导出模块的时候使用了 `export default` 语法， `html` 里面用的话有问题.

1. raw-loader 内联 html
   ```
   <%= require('raw-loader!./meta.html') %>
   ```
2. raw-loader 内联 JS
   ```
   <script><%= require('raw-loader!babel-loader!../node_modules/lib-flexible/flexible.js') %></script>
   ```
3. 添加 meta.html
   ```html
   <meta charset="UTF-8" />
   <meta
     name="viewport"
     content="viewport-fit=cover,width=device-width,initial-scale=1,user-scalable=no"
   />
   <meta name="format-detection" content="telephone=no" />
   <meta
     name="keywords"
     content="now,now直播,直播,腾讯直播,QQ直播,美女直播,附近直播,才艺直播,小视频,个人直播,美女视频,在线直播,手机直播"
   />
   <meta
     name="name"
     itemprop="name"
     content="NOW直播—腾讯旗下全民视频社交直播平台"
   /><meta
     name="description"
     itemprop="description"
     content="NOW直播，腾讯旗下全民高清视频直播平台，汇集中外大咖，最in网红，草根偶像，明星艺人，校花，小鲜肉，逗逼段子手，各类美食、音乐、旅游、时尚、健身达人与你24小时不间断互动直播，各种奇葩刺激的直播玩法，让你跃跃欲试，你会发现，原来人人都可以当主播赚钱！"
   />
   <meta
     name="image"
     itemprop="image"
     content="https://pub.idqqimg.com/pc/misc/files/20170831/60b60446e34b40b98fa26afcc62a5f74.jpg"
   /><meta name="baidu-site-verification" content="G4ovcyX25V" />
   <meta name="apple-mobile-web-app-capable" content="no" />
   <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
   <link rel="dns-prefetch" href="//11.url.cn/" />
   <link rel="dns-prefetch" href="//open.mobile.qq.com/" />
   ```
4. 修改 search.html
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <%= require('raw-loader!./meta.html') %>
       <title>Document</title>
       <script>
         <%= require('raw-loader!babel-loader!../node_modules/lib-flexible/flexible.js') %>
       </script>
     </head>
     <body>
       <div id="root"></div>
     </body>
   </html>
   ```

### HTML 内联增强版

1. 实现一个 `loader` 去解析 HTML 里面的?\_\_inline 语法，[inline-html-loader](https://github.com/cpselvis/inline-html-loader)

   ```js
   const fs = require('fs');
   const path = require('path');

   const getContent = (matched, reg, resourcePath) => {
     const result = matched.match(reg);
     const relativePath = result && result[1];
     const absolutePath = path.join(path.dirname(resourcePath), relativePath);
     return fs.readFileSync(absolutePath, 'utf-8');
   };

   module.exports = function (content) {
     const htmlReg = /<link.*?href=".*?\__inline">/gim;
     const jsReg = /<script.*?src=".*?\?__inline".*?>.*?<\/script>/gim;

     content = content
       .replace(jsReg, matched => {
         const jsContent = getContent(
           matched,
           /src="(.*)\?__inline/,
           this.resourcePath
         );
         return `<script type="text/javascript">${jsContent}</script>`;
       })
       .replace(htmlReg, matched => {
         const htmlContent = getContent(
           matched,
           /href="(.*)\?__inline/,
           this.resourcePath
         );
         return htmlContent;
       });

     return `module.exports = ${JSON.stringify(content)}`;
   };
   ```

2. 使用：
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <link href="./meta.html?__inline" />
       <title>Document</title>
       <script
         type="text/javascript"
         src="../node_modules/lib-flexible/flexible.js?__inline"
       ></script>
     </head>
     <body>
       <div id="root"></div>
     </body>
   </html>
   ```
3. 效果
<div align="center"><img :src="$withBase('/images/engineering/20210501.png')" alt="images/engineering/20210501.png"></div>

### CSS 内联

1. 方案一：借助 style-loader
   ```js
   module.exports = {
     module: {
       rules: [
         {
           test: /\.scss$/,
           use: [
             {
               loader: 'style-loader',
               options: {
                 insertAt: 'top', // 样式插入到<head>
                 singleton: true, //将所有的style标签合并成一个
               },
             },
             'css-loader',
             'sass-loader',
           ],
         },
       ],
     },
   };
   ```
2. 方案二：html-inline-css-webpack-plugin

   > npm i html-inline-css-webpack-plugin -D

   将`<link rel="stylesheet" />` => `<style>...<style/>`

   **注意**：`html-inline-css-webpack-plugin` 需要放在 `html-webpack-plugin` 后面。

   ```js
   const MiniCssExtractPlugin = require('mini-css-extract-plugin');
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin')
     .default;

   module.exports = {
     plugins: [
       new MiniCssExtractPlugin({
         filename: '[name]_[contenthash:8].css',
       }),
       new HtmlWebpackPlugin(),
       new HTMLInlineCSSWebpackPlugin(),
     ],
   };
   ```

3. 效果
<div align="center"><img :src="$withBase('/images/engineering/2021050102.png')" alt="images/engineering/2021050102.png"></div>

### CSS 内联的思路

1. `style-loader` 插入样式是一个动态的过程，查看打包后的 html 源码并不会看到 html 有 style 样式的。`style-loader` 是代码运行时动态的创建 style 标签，然后将 css style 插入到 style 标签里面去。
2. `css-loader` 的作用是将 css 转换成 `commonjs` 对象，也就是样式代码会被放到 js 里面去了。
3. 对应的源码：[https://github.com/webpack-contrib/style-loader/blob/master/src/runtime/injectStylesIntoStyleTag.js#L260](https://github.com/webpack-contrib/style-loader/blob/master/src/runtime/injectStylesIntoStyleTag.js#L260)
4. CSS 内联的思路是：

   > 将页面打包过程的产生的所有 CSS 提取成一个独立的文件，然后将这个 CSS 文件内联进 HTML head 里面。这里需要借助 `mini-css-extract-plugin` 和 `html-inline-css-webpack-plugin` 来实现 CSS 的内联功能。

   - 先将 css 提取打包成一个独立的 css 文件（使用 MiniCssExtractPlugin.loader）
   - 然后读取提取出的 css 内容注入到页面的 style 里面去。这个过程在构建阶段完成。

### 图片、字体内联

1. 图片和字体的内联可以借助 `url-loader`，通过修改 webpack 配置让小于 10k 的图片或者字体文件在构建阶段自动 base64。
2. 增强版

   > url-loader 做资源内联最大的缺陷就是：不能个性化的去设置某张图片自动编码。

   借鉴下 `FIS` 的语法糖，实现 `?__inline` 的语法糖，引用某个图片的时候看到这个后缀则自动的将这张图片进行 `base64 编码`

3. 实现[inline-file-loader](https://github.com/cpselvis/inline-file-loader)

   ```js
   export default function loader(content) {
     const options = loaderUtils.getOptions(this) || {};

     validateOptions(schema, options, {
       name: 'File Loader',
       baseDataPath: 'options',
     });

     const hasInlineFlag = /\?__inline$/.test(this.resource);

     if (hasInlineFlag) {
       const file = this.resourcePath;
       // Get MIME type
       const mimetype = options.mimetype || mime.getType(file);

       if (typeof content === 'string') {
         content = Buffer.from(content);
       }

       return `module.exports = ${JSON.stringify(
         `data:${mimetype || ''};base64,${content.toString('base64')}`
       )}`;
     }
   }
   ```

4. 使用
   ```css
   .search {
     background: url(./search-icon.png?__inline) no-repeat;
   }
   ```

### 代码查看

- [inline-resource demo 演示](https://github.com/cpselvis/geektime-webpack-course/tree/master/code/chapter03/inline-resource)
- [inline-html-loader 源码](https://github.com/cpselvis/inline-html-loader)
- [inline-file-loader 源码](https://github.com/cpselvis/inline-file-loader)

## 多页面打包

### 多页面打包基本思路

1. 每个⻚⾯对应⼀个 `entry`，⼀个 `html-webpack-plugin`
2. 缺点：每次新增或删除⻚⾯需要改 `webpack` 配置

```js
module.exports = {
  entry: {
    index: './src/index.js',
    search: './src/search.js',
  },
};
```

### 多页面打包通用方案

1. 动态获取 `entry` 和设置 `html-webpack-plugin` 数量
2. 利用 `glob.sync`
   - > 安装依赖 `npm i glob -D`
   - entry: `glob.sync(path.join(__dirname, './src/*/index.js'))`

### 例子

1. 先将对应的文件放到单独的文件夹里面，并修改里面的文件资源的引用
2. 修改 webpack 的配置

```js
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const setMPA = () => {
  const entry = {};
  const htmlWebpackPlugins = [];
  const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));

  Object.keys(entryFiles).map(index => {
    const entryFile = entryFiles[index];

    const match = entryFile.match(/src\/(.*)\/index\.js/);
    const pageName = match && match[1];

    entry[pageName] = entryFile;
    htmlWebpackPlugins.push(
      new HtmlWebpackPlugin({
        inlineSource: '.css$',
        template: path.join(__dirname, `src/${pageName}/index.html`),
        filename: `${pageName}.html`,
        chunks: ['vendors', pageName],
        inject: true,
        minify: {
          html5: true,
          collapseWhitespace: true,
          preserveLineBreaks: false,
          minifyCSS: true,
          minifyJS: true,
          removeComments: false,
        },
      })
    );
  });

  return {
    entry,
    htmlWebpackPlugins,
  };
};

const { entry, htmlWebpackPlugins } = setMPA();

module.exports = {
  entry: entry,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]_[chunkhash].js',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /.js$/,
        use: 'babel-loader',
      },
      {
        test: /.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('autoprefixer')({
                  overrideBrowserslist: ['last 2 version', '>1%', 'ios 7'],
                }),
              ],
            },
          },
          {
            loader: 'px2rem-loader',
            options: {
              remUnit: 75,
              remPrecision: 8,
            },
          },
        ],
      },
      {
        test: /.(png|jpg|gif|jpeg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name]_[hash:8].[ext]',
            },
          },
        ],
      },
      {
        test: /.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name]_[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name]_[contenthash:8].css',
    }),
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
    }),
    new CleanWebpackPlugin(),
  ].concat(htmlWebpackPlugins),
};
```

3. 如图
<div align="center"><img :src="$withBase('/images/engineering/2021050103.png')" alt="images/engineering/2021050103.png"></div>

## 使⽤ source map

推荐阅读[阮一峰的网络日志-JavaScript Source Map 详解](http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html)

`Source map`就是一个信息文件，里面储存着位置信息。也就是说，转换后的代码的每一个位置，所对应的转换前的位置。

### 使⽤ source map

1. **作⽤**：通过 source map 定位到源代码
2. 开发环境开启，线上环境关闭
   - 线上排查问题的时候可以将 `sourcemap` 上传到错误监控系统

### source map 关键字

- `source map`: 产⽣ `.map` ⽂件
- `eval`: 使⽤ `eval` 包裹模块代码
- `cheap`: 不包含列信息
- `inline`: 将 `.map` 作为 `DataURI` 嵌⼊，不单独⽣成 `.map` ⽂件
- `module`: 包含 `loader` 的 `sourcemap`

### source map 类型

<div align="center"><img :src="$withBase('/images/engineering/2021050104.png')" alt="images/engineering/2021050104.png"></div>

### 例子

1. 在 `search` 文件夹里的 `index.js` 添加 `debugger`

   ```js
   import React from 'react';
   import ReactDOM from 'react-dom';
   import './search.less';
   import logo from './images/logo.png';
   console.log(logo);

   class Search extends React.Component {
     render() {
       debugger;
       return (
         <div className="search-text">
           凯小默的博客666
           <img src={logo} />
         </div>
       );
     }
   }

   ReactDOM.render(<Search />, document.getElementById('root'));
   ```

2. 配置开发配置

   ```js
   const glob = require('glob');
   const path = require('path');
   const webpack = require('webpack');
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const { CleanWebpackPlugin } = require('clean-webpack-plugin');

   const setMPA = () => {
     const entry = {};
     const htmlWebpackPlugins = [];
     const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));

     Object.keys(entryFiles).map(index => {
       const entryFile = entryFiles[index];

       const match = entryFile.match(/src\/(.*)\/index\.js/);
       const pageName = match && match[1];

       entry[pageName] = entryFile;
       htmlWebpackPlugins.push(
         new HtmlWebpackPlugin({
           inlineSource: '.css$',
           template: path.join(__dirname, `src/${pageName}/index.html`),
           filename: `${pageName}.html`,
           chunks: ['vendors', pageName],
           inject: true,
           minify: {
             html5: true,
             collapseWhitespace: true,
             preserveLineBreaks: false,
             minifyCSS: true,
             minifyJS: true,
             removeComments: false,
           },
         })
       );
     });

     return {
       entry,
       htmlWebpackPlugins,
     };
   };

   const { entry, htmlWebpackPlugins } = setMPA();

   module.exports = {
     entry: entry,
     output: {
       path: path.join(__dirname, 'dist'),
       filename: '[name].js',
     },
     mode: 'development',
     module: {
       rules: [
         {
           test: /.js$/,
           use: 'babel-loader',
         },
         {
           test: /.css$/,
           use: ['style-loader', 'css-loader'],
         },
         {
           test: /.less$/,
           use: ['style-loader', 'css-loader', 'less-loader'],
         },
         {
           test: /.(png|jpg|gif|jpeg)$/,
           use: [
             {
               loader: 'url-loader',
               options: {
                 limit: 10240,
               },
             },
           ],
         },
         {
           test: /.(woff|woff2|eot|ttf|otf)$/,
           use: 'file-loader',
         },
       ],
     },
     plugins: [
       new webpack.HotModuleReplacementPlugin(),
       new CleanWebpackPlugin(),
     ].concat(htmlWebpackPlugins),
     devServer: {
       contentBase: './dist',
       hot: true,
     },
     devtool: 'source-map',
   };
   ```

## 提取页面公共资源

### 基础库分离

- 思路：将 `react`、`react-dom` 基础包通过 `cdn` 引⼊，不打⼊ `bundle` 中
- ⽅法：使⽤ `html-webpack-externals-plugin`

> 安装插件 `npm i html-webpack-externals-plugin -D`

1. 配置
   ```js
   const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
   module.exports = {
     plugins: [
       new HtmlWebpackExternalsPlugin({
         externals: [
           {
             module: 'react',
             entry: 'https://11.url.cn/now/lib/16.2.0/react.min.js',
             global: 'React',
           },
           {
             module: 'react-dom',
             entry: 'https://11.url.cn/now/lib/16.2.0/react-dom.min.js',
             global: 'ReactDom',
           },
         ],
       }),
     ],
   };
   ```
2. 引入脚本
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <%= require('raw-loader!./meta.html') %>
       <title>Document</title>
       <script>
         <%= require('raw-loader!babel-loader!../../node_modules/lib-flexible/flexible.js') %>
       </script>
     </head>
     <body>
       <div id="root"></div>
       <script
         type="text/javascript"
         src="https://11.url.cn/now/lib/16.2.0/react.min.js"
       ></script>
       <script
         type="text/javascript"
         src="https://11.url.cn/now/lib/16.2.0/react-dom.min.js"
       ></script>
     </body>
   </html>
   ```

## 利⽤ SplitChunksPlugin 进⾏公共脚本分离

`Webpack4` 内置的，替代 `CommonsChunkPlugin` 插件

chunks 参数说明：

- `async` 异步引⼊的库进⾏分离(默认)
- `initial` 同步引⼊的库进⾏分离
- `all` 所有引⼊的库进⾏分离(推荐)

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 30000, // 抽离的公共包最小的大小，单位字节
      maxSize: 0, // 最大的大小
      minChunks: 1, // 资源使用的次数(在多个页面使用到)， 大于1， 最小使用次数
      maxAsyncRequests: 5, // 并发请求的数量
      maxInitialRequests: 3, // 入口文件做代码分割最多能分成3个js文件
      automaticNameMaxLength: 30, // 自动自动命名最大长度
      automaticNameDelimiter: '~', // 文件生成时的连接符
      name: true, //让cacheGroups里设置的名字有效
      cacheGroups: {
        //当打包同步代码时,上面的参数生效
        vendors: {
          test: /[\\/]node_modules[\\/]/, //检测引入的库是否在node_modlues目录下的
          priority: -10, //值越大,优先级越高.模块先打包到优先级高的组里
          filename: 'vendors.js', //把所有的库都打包到一个叫vendors.js的文件里
        },
        default: {
          minChunks: 2, // 上面有
          priority: -20, // 上面有
          reuseExistingChunk: true, //如果一个模块已经被打包过了,那么再打包时就忽略这个上模块
        },
      },
    },
  },
};
```

利⽤ SplitChunksPlugin 分离基础包

- `test`: 匹配出需要分离的包
- 配置  
  去掉 `html-webpack-externals-plugin` 的配置以及 index.html 里面脚本的引用

```js
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /(react|react-dom)/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

```js
config.optimization = {
  nodeEnv: 'production',
  splitChunks: {
    chunks: 'async',
    minSize: 30000,
    minChunks: 2,
    automaticNameDelimiter: '.',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name(module) {
          const packageName = module.context.match(
            /[\\/]node_modules[\\/](.*?)([\\/]|$)/
          )[1];
          return `ailjc.${packageName.replace('@', '')}`;
        },
        minChunks: 1,
      },
    },
  },
};
```

## Tree Shaking 的使用和原理分析

### tree shaking(摇树优化)

**概念**：1 个模块可能有多个⽅法，只要其中的某个⽅法使⽤到了，则整个⽂件都会被打到 bundle ⾥⾯去，tree shaking 就是只把⽤到的⽅法打⼊ bundle ，没⽤到的⽅法会在 uglify 阶段被擦除掉。

使⽤：

- `webpack` 默认⽀持，在 `.babelrc` ⾥设置 `modules: false` 即可
- `production mode` 的情况下默认开启

**要求**：必须是 ES6 的语法，CJS 的⽅式不⽀持

### DCE (Dead code elimination)

- 代码不会被执⾏，不可到达
- 代码执⾏的结果不会被⽤到
- 代码只会影响死变量（只写不读）

```js
if (false) {
  console.log('这段代码永远不会执行');
}
```

### Tree-shaking 原理

利⽤ ES6 模块的特点:

- 只能作为模块顶层的语句出现
- import 的模块名只能是字符串常量
- import binding 是 immutable(不可改变的) 的

代码擦除： uglify 阶段删除⽆⽤代码

## Scope Hoisting 使用和原理分析

**现象：构建后的代码存在大量闭包代码**

<div align="center"><img :src="$withBase('/images/engineering/2021050105.png')" alt="images/engineering/2021050105.png"></div>

**会导致什么问题**

- ⼤量作用域包裹代码，导致体积增大（模块越多越明显）
- 运行代码时创建的函数作⽤域变多，内存开销变大

**模块转换分析**

<div align="center"><img :src="$withBase('/images/engineering/2021050106.png')" alt="images/engineering/2021050106.png"></div>

结论：

- 被 `webpack` 转换后的模块会带上一层包裹
- `import` 会被转换成 `__webpack_require`

**进⼀步分析 webpack 的模块机制**

<div align="center"><img :src="$withBase('/images/engineering/2021050107.png')" alt="images/engineering/2021050107.png"></div>

分析：

- 打包出来的是⼀个 `IIFE` (匿名闭包)
- `modules` 是⼀个数组，每⼀项是⼀个模块初始化函数
- `__webpack_require` ⽤来加载模块，返回 `module.exports`
- 通过 `WEBPACK_REQUIRE_METHOD(0)` 启动程序

### scope hoisting 原理

**原理**：将所有模块的代码按照引用顺序放在⼀个函数作用域里，然后适当的重命名⼀些变量以防止变量名冲突。

对比: 通过 `scope hoisting` 可以减少函数声明代码和内存开销

### scope hoisting 使用

`webpack mode` 为 `production` 默认开启

必须是 ES6 语法（静态分析），CJS 不⽀持（动态）

```js
module.exports = {
  entry: {
    app: './src/app.js',
    search: './src/search.js',
  },
  output: {
    filename: '[name][chunkhash:8].js',
    path: __dirname + '/dist',
  },
  plugins: [
    // webpack3需要添加这个
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};
```

### 例子

1. 先将 mode 设置成 none，在打包看看 index.js

```java
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		0: 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([0,2]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _helloWebpack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _common_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);


document.write(Object(_helloWebpack__WEBPACK_IMPORTED_MODULE_0__["helloWebpck"])());

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "helloWebpck", function() { return helloWebpck; });
function helloWebpck() {
  return 'Hello Webpack!';
}

/***/ })
/******/ ]);
```

2、在 mode 设置为 none 下，添加配置

```js
module.exports = {
  mode: 'none',
  plugins: [
    // webpack3需要添加这个
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};
```

```java
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		2: 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([14,0]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 14:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// CONCATENATED MODULE: ./src/index/helloWebpack.js
function helloWebpck() {
  return 'Hello Webpack!';
}
// EXTERNAL MODULE: ./common/index.js
var common = __webpack_require__(0);

// CONCATENATED MODULE: ./src/index/index.js


document.write(helloWebpck());

/***/ })

/******/ });
```

## 代码分割和动态 import

### 代码分割的意义

对于⼤的 Web 应⽤来讲，将所有的代码都放在⼀个⽂件中显然是不够有效的，特别是当你的
某些代码块是在某些特殊的时候才会被使⽤到。

webpack 有⼀个功能就是将你的代码库分割成 chunks（语块），当代码运⾏到需要它们的时候再进⾏加载。

适⽤的场景：

- 抽离相同代码到⼀个共享块
- 脚本懒加载，使得初始下载的代码更⼩

<div align="center"><img :src="$withBase('/images/engineering/2021050108.png')" alt="images/engineering/2021050108.png"></div>

### 懒加载 JS 脚本的⽅式

- `CommonJS`：`require.ensure`
- `ES6`：动态 `import`（⽬前还没有原⽣⽀持，需要 babel 转换）

### 如何使⽤动态 import

1. 安装 babel 插件 `npm install @babel/plugin-syntax-dynamic-import --save-dev`
2. ES6：动态 import（⽬前还没有原⽣⽀持，需要 babel 转换）
   ```js
   {
     "plugins": ["@babel/plugin-syntax-dynamic-import"],
     ...
   }
   ```

## 在 webpack 中使用 ESLint

⾏业⾥⾯优秀的 ESLint 规范实践

- `Airbnb`：eslint-config-airbnb、 eslint-config-airbnb-base [https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb)
- `alloyteam团队`：eslint-config-alloy [https://github.com/AlloyTeam/eslint-config-alloy](https://github.com/AlloyTeam/eslint-config-alloy)
- `ivweb 团队`：eslint-config-ivweb [https://github.com/feflow/eslint-config-ivweb](https://github.com/feflow/eslint-config-ivweb)

### ESLint 如何执⾏落地

**⽅案⼀：webpack 与 CI/CD 集成**

本地开发阶段增加 precommit 钩⼦

1. 安装 husky `npm install husky --save-dev`
2. 增加 `npm script`，通过 `lint-staged` 增量检查修改的⽂件

```json
"scripts": {
  "precommit": "lint-staged"
},
"lint-staged": {
  "linters": {
    "*.{js,scss}": ["eslint --fix", "git add"]
  }
},
```

**⽅案⼆：webpack 与 ESLint 集成**
使⽤ `eslint-loader`，构建时检查 JS 规范

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader'],
      },
    ],
  },
};
```

### 例子

1. 打开[https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb)，可以看到下面这个

   eslint-config-airbnb：

   > Our default export contains all of our ESLint rules, including ECMAScript 6+ and React. It requires `eslint`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y`. If you don’t need React, see eslint-config-airbnb-base.

2. 安装依赖

   1. `npm i eslint eslint-plugin-import eslint-plugin-react eslint-plugin-react-hooks and eslint-plugin-jsx-a11y -D`
   2. `npm i eslint-loade`
   3. `npm i babel-eslint -D`
   4. `npm i eslint-config-airbnb -D`

   我使用的是这个版本，版本太高会报一些错误。

   ```js
   "eslint-config-airbnb": "^17.1.0",
   "eslint-config-airbnb-base": "^13.1.0",
   "eslint-loader": "^2.1.2",
   "eslint-plugin-import": "^2.17.3",
   "eslint-plugin-jsx-a11y": "^6.2.1",
   "eslint-plugin-react": "^7.13.0",
   ```

3. 修改 webapck.prod.js 配置  
   添加`eslint-loader`

   ```js
   rules: [
     {
       test: /.js$/,
       use: ['babel-loader', 'eslint-loader'],
     },
   ];
   ```

4. 添加`.eslintrc.js`文件  
   配置官网请参考：[https://eslint.bootcss.com/docs/user-guide/configuring](https://eslint.bootcss.com/docs/user-guide/configuring)
   ```js
   module.exports = {
     parser: 'babel-eslint',
     extends: 'airbnb',
     env: {
       browser: true,
       node: true,
     },
     rules: {
       indent: ['error', 4],
     },
   };
   ```

## 构建异常和中断处理

Node.js 中的 `process.exit` 规范

- 0 表示成功完成，回调函数中，err 为 null
- ⾮ 0 表示执⾏失败，回调函数中，err 不为 null，err.code 就是传给 exit 的数字

如何主动捕获并处理构建错误？

- `compiler` 在每次构建结束后会触发 `done` 这个 `hook`
- `process.exit` 主动处理构建报错

```js
plugins: [
  function () {
    this.hooks.done.tap('done', stats => {
      if (
        stats.compilation.errors &&
        stats.compilation.errors.length &&
        process.argv.indexOf('--watch') == -1
      ) {
        console.log('build error');
        process.exit(1);
      }
    });
  },
];
```

实例

1. 先把`my-project\src\index\index.js`里的文件里引入一个不存在的模块，然后运行 `npm run build`
   ```js
   import { helloWebpck } from './helloWebpack';
   import '../../common/index.js';
   import '../../common/index/index.js'; // 不存在的模块
   document.write(helloWebpck());
   ```
2. 然后在配置 `webpack.config.prod.js`
   ```js
   module.exports = {
     plugins: [
       new FriendlyErrorsWebpackPlugin(),
       function () {
         this.hooks.done.tap('done', stats => {
           if (
             stats.compilation.errors &&
             stats.compilation.errors.length &&
             process.argv.indexOf('--watch') == -1
           ) {
             console.log('凯小默测试一下：build error');
             process.exit(1);
           }
         });
       },
     ].concat(htmlWebpackPlugins),
     stats: 'errors-only',
   };
   ```

可以看到这里打印的东西已经出来了，状态也变成 1 了。

<div align="center"><img :src="$withBase('/images/engineering/2021050109.png')" alt="images/engineering/2021050109.png"></div>
