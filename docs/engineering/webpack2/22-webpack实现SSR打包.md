# webpack 实现 SSR 打包

[[toc]]

## 页面打开过程

<div align="center"><img :src="$withBase('/images/engineering/2021050119.png')" alt="images/engineering/2021050119.png"></div>

## 服务端渲染 (SSR) 是什么？

**渲染**: `HTML + CSS + JS + Data -> 渲染后的 HTML`

**服务端**：

- 所有模板等资源都存储在服务端
- 内⽹机器拉取数据更快
- ⼀个 HTML 返回所有数据

## 浏览器和服务器交互流程

<div align="center"><img :src="$withBase('/images/engineering/2021050120.png')" alt="images/engineering/2021050120.png"></div>

## 客户端渲染 vs 服务端渲染

|          | 客户端渲染                                   | 服务端渲染               |
| -------- | -------------------------------------------- | ------------------------ |
| 请求     | 多个请求(HTML,数据等)                        | 1 个请求                 |
| 加载过程 | HTML & 数据串行加载                          | 1 个请求返回 HTML & 数据 |
| 渲染     | 前端渲染                                     | 服务端渲染               |
| 可交互   | 图片等静态资源加载完成， js 逻辑行完成可加载 |

总结：**服务端渲染 (SSR) 的核⼼是减少请求**

## SSR 的优势

1. 减少⽩屏时间
2. 对于 SEO 友好

## SSR 代码实现思路

服务端

- 使⽤ react-dom/server 的 renderToString ⽅法将 React 组件渲染成字符串
- 服务端路由返回对应的模板

客户端

- 打包出针对服务端的组件

## 实现 SSR

1. 安装依赖 `npm i express -D`
2. 在项目根文件添加文件夹 `server`，在文件夹里再添加 index.js 文件

   ```js
   if (typeof window === 'undefined') {
     global.window = {};
   }

   const fs = require('fs');
   const path = require('path');
   const express = require('express');
   const { renderToString } = require('react-dom/server');

   const SSR = require('../dist/search-server');
   const template = fs.readFileSync(
     path.join(__dirname, '../dist/search.html'),
     'utf-8'
   );

   const renderMarkup = str => {
     return template.replace('<!--HTML_PLACEHOLDER-->', str);
   };

   const server = port => {
     const app = express();

     app.use(express.static('dist'));

     app.get('/search', (req, res) => {
       console.log('SSR-----------》', SSR);
       console.log('renderToString(SSR)------>', renderToString(SSR));
       const html = renderMarkup(renderToString(SSR));
       res.status(200).send(html);
     });

     app.listen(port, () => {
       console.log(`Server is running on port：${port}`);
     });
   };

   server(process.env.PORT || 3000);
   ```

3. 修改文件夹 search 里的 index.html，添加占位符 `<!--HTML_PLACEHOLDER-->`
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
       <div id="root"><!--HTML_PLACEHOLDER--></div>
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
4. 在文件夹 search 里添加 `index-server.js` 文件，用于服务端渲染页面

   ```js
   const React = require('react');
   // 引入大加法
   const kaimoLargeNumber = require('kaimo-large-number');
   // 图片
   const logo = require('./images/logo.png');
   console.log(logo);
   // 样式
   const s = require('./search.less');
   console.log(s);

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
       const { Text } = this.state;
       const kaimoLarge = kaimoLargeNumber('777', '666');
       return (
         <div className="search-text">
           凯小默的博客666
           {Text ? <Text /> : null}
           大加法操作'777'+'666'：{kaimoLarge}
           <img src={logo.default} onClick={this.loadComponent.bind(this)} />
         </div>
       );
     }
   }

   module.exports = <Search />;
   ```

5. 添加 `webpack.ssr.js` 配置文件

   ```js
   const glob = require('glob');
   const path = require('path');
   const webpack = require('webpack');
   const MiniCssExtractPlugin = require('mini-css-extract-plugin');
   const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const { CleanWebpackPlugin } = require('clean-webpack-plugin');
   const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

   const setMPA = () => {
     const entry = {};
     const htmlWebpackPlugins = [];
     const entryFiles = glob.sync(
       path.join(__dirname, './src/*/index-server.js')
     );

     Object.keys(entryFiles).map(index => {
       const entryFile = entryFiles[index];

       const match = entryFile.match(/src\/(.*)\/index-server\.js/);
       const pageName = match && match[1];

       if (pageName) {
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
       }
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
       filename: '[name]-server.js',
       libraryTarget: 'umd',
     },
     mode: 'none',
     module: {
       rules: [
         {
           test: /.js$/,
           use: ['babel-loader', 'eslint-loader'],
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
       new webpack.optimize.ModuleConcatenationPlugin(),
     ].concat(htmlWebpackPlugins),
     optimization: {
       splitChunks: {
         minSize: 0,
         cacheGroups: {
           commons: {
             name: 'commons',
             chunks: 'all',
             minChunks: 2,
           },
         },
       },
     },
   };
   ```

6. 往 package.json 里添加脚本
   ```json
   {
     "scripts": {
       "build:ssr": "webpack --config webpack.ssr.js"
     }
   }
   ```
7. 运行 `npm run build:ssr`，打包成功之后，然后再 `node server/index.js`
8. 打开浏览器访问 `http://localhost:3000/search`， 就可以看到下面效果

## webpack ssr 打包存在的问题

1. 浏览器的全局变量 (Node.js 中没有 document, window)
   - 组件适配：将不兼容的组件根据打包环境进⾏适配
   - 请求适配：将 fetch 或者 ajax 发送请求的写法改成 `isomorphic-fetch` 或者 axios
2. 样式问题 (Node.js ⽆法解析 css)
   - ⽅案⼀：服务端打包通过 ignore-loader 忽略掉 CSS 的解析
   - ⽅案⼆：将 style-loader 替换成 isomorphic-style-loader

## 如何解决样式不显示的问题？

使⽤打包出来的浏览器端 html 为模板设置占位符，动态插⼊组件

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>
  <body>
    <div id="root"><!--HTML_PLACEHOLDER--></div>
  </body>
</html>
```

## 首屏数据如何处理？

服务端获取数据 替换占位符

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>
  <body>
    <div id="root"><!--HTML_PLACEHOLDER--></div>

    <!--INITIAL_DATA_PLACEHOLDER-->
  </body>
</html>
```

实现 首屏数据如何处理？

1. 在上一节的基础上添加`<!--INITIAL_DATA_PLACEHOLDER-->`占位符
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
       <div id="root"><!--HTML_PLACEHOLDER--></div>
       <script
         type="text/javascript"
         src="https://11.url.cn/now/lib/16.2.0/react.min.js"
       ></script>
       <script
         type="text/javascript"
         src="https://11.url.cn/now/lib/16.2.0/react-dom.min.js"
       ></script>
       <!--INITIAL_DATA_PLACEHOLDER-->
     </body>
   </html>
   ```
2. 在 server 文件夹里添加 data.json 文件，然后在 server 文件夹的 index.js 里引入  
    data.json

   ```json
   {
     "error": [],
     "extra": [],
     "data": {
       "list": [
         [
           {
             "sub_count": 5556,
             "column_type": 1,
             "id": 192,
             "column_price_market": 9900,
             "column_bgcolor": "#F6F7FB",
             "column_title": "SQL必知必会",
             "column_cover_small": "https://static001.geekbang.org/resource/image/1c/38/1c5a5b154b543af952312eef33217438.jpg",
             "column_cover": "https://static001.geekbang.org/resource/image/c7/0d/c7ee0aabbcb6d2da09a1b4a56c1a730d.jpg",
             "had_sub": false,
             "price_type": 2,
             "column_unit": "45讲",
             "is_experience": false,
             "column_ctime": 1559640855,
             "update_frequency": "每周一 / 三 / 五更新",
             "is_onboard": true,
             "author_intro": "清华大学计算机博士",
             "column_sku": 100029501,
             "column_cover_wxlite": "https://static001.geekbang.org/resource/image/cd/f0/cd26b744d388dbd4387dcfaa66dd8bf0.jpg",
             "column_price": 6800,
             "column_price_sale": 6800,
             "author_name": "陈旸",
             "column_subtitle": "从入门到数据实战"
           }
         ]
       ],
       "nav": [
         {
           "id": 1,
           "name": "专栏",
           "color": "#5ba6ff",
           "icon": "https://static001.geekbang.org/resource/image/dd/9e/dd8cbc79f017d1b01f643c7ea929d79e.png"
         },
         {
           "id": 3,
           "name": "视频课程",
           "color": "#79c109",
           "icon": "https://static001.geekbang.org/resource/image/4a/c3/4aebe8fb752fa21a0fd989a45d9847c3.png"
         },
         {
           "id": 2,
           "name": "微课",
           "color": "#5ba6ff",
           "icon": "https://static001.geekbang.org/resource/image/9c/f1/9c223ccae33c5245a3009857582f1df1.png"
         }
       ]
     },
     "code": 0
   }
   ```

   index.js

   ```js
   if (typeof window === 'undefined') {
     global.window = {};
   }

   const fs = require('fs');
   const path = require('path');
   const express = require('express');
   const { renderToString } = require('react-dom/server');

   const SSR = require('../dist/search-server');
   const template = fs.readFileSync(
     path.join(__dirname, '../dist/search.html'),
     'utf-8'
   );
   const data = require('./data.json'); // 引入数据

   const renderMarkup = str => {
     const dataStr = JSON.stringify(data);
     return template
       .replace('<!--HTML_PLACEHOLDER-->', str)
       .replace(
         '<!--INITIAL_DATA_PLACEHOLDER-->',
         `<script>window.__initial_data=${dataStr}</script>`
       );
   };

   const server = port => {
     const app = express();

     app.use(express.static('dist'));

     app.get('/search', (req, res) => {
       console.log('SSR-----------》', SSR);
       console.log('renderToString(SSR)------>', renderToString(SSR));
       const html = renderMarkup(renderToString(SSR));
       res.status(200).send(html);
     });

     app.listen(port, () => {
       console.log(`Server is running on port：${port}`);
     });
   };

   server(process.env.PORT || 3000);
   ```
