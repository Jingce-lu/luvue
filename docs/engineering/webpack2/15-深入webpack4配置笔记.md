# 深入webpack4配置笔记(必备/可选配置 单页/多页配置)

<!-- TOC -->

- [深入webpack4配置笔记(必备/可选配置 单页/多页配置)](#深入webpack4配置笔记必备可选配置-单页多页配置)
  - [必备配置](#必备配置)
  - [可选配置](#可选配置)
  - [webpack打包性能优化](#webpack打包性能优化)
  - [多页面打包配置](#多页面打包配置)

<!-- /TOC -->

## 必备配置
1. 自动生成html文件，使用 `html-webpack-plugin` 插件
2. 重新打包时前删除dist目录，然后再执行打包，使用`clean-webpack-plugin`插件
3. `entry`与`output`配置，占位符`[name]`、`publicPath`(比如配置js文件等资源的cdn地址，使得打包后的html中引入的js地址为cdn地址)
4. 三种提升开发效率的即时打包：`watch`(使用file协议)、`devServer`开启本地服务器(使用http协议，需安装`webpack-dev-server`，本地代码修改后实时打包自动更新刷新页面)、自己用node写服务器(使用http协议，不足是本地代码修改后虽然实时打包但页面仍需手动刷新才能看见最新显示)。除此还可以安装`http-server`包，然后打包项目到dist目录后，再运行`scripts`命令`"start": "htt-server dist"`，这样的操作和将项目打包后dist目录丢到服务器上访问类似。
5. 打包静态文件：
    - 图片 png/jpg/gif等静态图片资源 使用 `file-loader` 或者 `url-loader`，推荐使用 `url-loader`，因为后者可通过 options 进行额外配置
    - css/scss   按顺序使用`postcss-loader`(配合`autoprefixer`插件) / `sass-loader`(依赖`node-sass`) / `css-loader` / `style-loader` 来进行 css3代码前缀自动添加、scss代码转成css代码、插入html页面head的style中
    - css模块化打包  开启css文件模块化打包，可以在某个js文件中 通过 `import xxx from "./yyy.scss"` 文件来进行模块化打包scss文件，在js中可以通过 `xxx.classSelecter`来引用某个具体的样式选择器进行样式class的添加
    - 字体文件打包  就是使用`file-loader`把eot/svg等从src目录移到dist目录
6. 将ES6/7语法转换为ES5语法，安装`babel-loader`、`@babel/core`(babel V7开始为@babel)、配置文件`.babelrc`中配置`presets`，它使用`@babel/preset-env`来将ES6/7语法转译成兼容低版本浏览器的兼容代码。如果要编译Promise、部分原型方法可以使用`@babel/polyfill`，然后通过入口js文件中`import @babel/polyfill`即可(这种方法会把所有转译ES6/7高级API的兼容代码一口气全打包出来)，或者可以在`.babelrc`的`presets`的`@babel/preset-env`配置属性对象里添加`useBuiltIns: "usage"`(这种办法就是按需打包出兼容代码，注意在我当前使用的babelV7版本中此时还需配置corejs版本)。使用`@babel/polyfill`有个问题，它的兼容代码会污染全局变量，在写普通业务代码项目中没问题，但如果babel用于写组件类库，就需要换个方法来避免污染全局环境：可以使用`@babel/plugin-transform-runtime`(安装于devDepend)和`@babel/runtime-corejs2`(安装于depend)，然后在`.babelrc`中配置`plugins`，它的原理是通过闭包的形式挂载兼容代码，从而不会污染全局变量。babel是JavaScript的编译器。
7. 代码分割(CodeSplitting)/异步引入模块。通过同步引入的模块进行代码分割时需配置`optimization.splitChunks`对象配置(配置参数看这里，也可以看`webpack.common.js`中这部分的配置注释)；通过异步引入的模块(仅`import("xxx module"))`则只需在添加`@babel/plugin-syntax-dynamic-import`这个官方插件并在`.babelrc`文件中的`plugins`里配置引入该插件就行，这里要注意异步引入`import("xxx module")`是一个Promise，可以通过调用then方法执行后续逻辑。
8. css文件的代码分割：安装插件`mini-css-extract-plugin`，在生产环境对应的配置文件中`const MiniCssExtractPlugin = require("mini-css-extract-plugin");`引入该插件后，在`plugins`中启用该插件，同时设置样式文件`loader`的最后一步由`style-loader`替换为`MiniCssExtractPlugin.loader`。这里有个地方要注意，由于该插件尚未支持`HMR`功能，所以webpack4建议在生产环境中使用该插件，开发环境开启`HMR`后就无需配置css代码分割了。
9. css代码的压缩：安装插件`optimize-css-assets-webpack-plugin`，引入该插件并配置，可以查看官方文档`DOCUMENTATION -> PLUGINS -> MiniCssExtractPlugin -> Minimizing For Production Analysis`。
10. 设置webpack打包的环境变量，可以安装`cross-env`模块并在`scripts`配置项中设置`cross-env NODE_ENV=production`，如此可在webpack配置文件中获取当前打包环境变量值。
11. 开启Hot Module Replacement 热模块更新(HMR), 需配置webpack.config.js文件中两个地方：`devServer`中配置`hot`和`hotOnly`、`HotModuleReplacementPlugin`插件
12. `devtool`配置`sourceMap`，它是一种映射关系，用于指出源代码中具体出错位置，弄明白`source-map`、`inline-source-map`、`cheap-source-map`等关系，并给出开发环境与生产环境的devtool的sourceMap配置最佳实践(开发环境为`cheap-module-eval-source-map`，生产环境为`cheap-module-source-map`)
13. `development`和`production`模式打包区别，安装第三方模块`webpack-merge`进行配置文件合并。
14. 懒加载：通过`import`异步加载模块就是属于一种懒加载，但是到底什么时候加载这个模块，则取决于什么时候真正执行`import`语句。借助这种方法，可以更快加载页面。异步加载模块采用`ES Module`的动态加载ES模块的方法：`import()`。
15. `PreLoading`优化：`webpack`推荐前端js更多使用异步加载来提高页面首次加载速度，这从它的`optimization.splitChunks.chunks`值默认是`async`就可以看出，即默认配置只分割异步模块代码，这样打包出来的页面首次加载js只会加载同步代码，异步模块代码会等到满足异步触发条件时再另外加载对应的异步js文件，这样能明显提高页面首次加载的速度和所加载js代码的使用率。分割同步模块代码只能是优化缓存提高页面二次加载时的速度，对页面首次加载速度提升并无帮助。所以优化页面首次、多次加载速度需要分割打包异步和同步模块，分别对应优化页面js代码使用率和缓存。查看js代码使用率可以打开chrome浏览器的`控制台 -> Coverage`，快捷键是`Ctrl + Shift + P`。写高性能页面时，重点考虑的应是页面代码的使用率，而不是缓存。
16. `PreFetching`优化：当通过`Preloading`优化的页面加载完毕后，此时带宽释放，可以利用这段空闲的带宽来预先加载异步模块文件，如此当用户交互触发异步加载条件时就会有与一次性加载所有模块一样的响应体验，因为此时浏览器中已经有异步模块文件的缓存。比较典型的案例就是页面加载后点击登录展示登录模态框，当页面首次加载时不会加载登录模态框的模块代码，页面加载完毕后利用带宽释放空档提前加载登录模态框的模块代码文件，如此当用户点击登录按钮时，可以直接调用相应的登录模态模块代码。实现方法是使用到魔法注释 `/* webpackPrefetch: true */`，使用详情可以访问`webpack`官方文档的`DOCUMENTATION -> GUIDES -> Code Splitting -> Prefetching/Preloading modules`。所以如果要提高页面加载性能，可以使用`ES Modules`异步模块加载来进行懒加载，同时添加`Prefetching`优化，利用页面主逻辑加载完毕后带宽释放空档提前加载异步模块文件，来达到明显提升页面加载速度的目的。
17. webpack帮浏览器做合理缓存：在`output.filename`和`output.chunkFilename`值中添加占位符`contenthash`，它的意思是当文件内容没变时打包生成文件的hash值不变，如果文件内容变了那么打包生成文件的hash值就会改变。
18. Shimming预置依赖，指的就是预先配置第三方库垫片，比如`jQuery`，可以在配置文件`plugins`数组中添加`new webpack.ProvidePlugin({ $: "jQuery" })`插件，这样当项目js中用到关键字`$`时程序就能理解为`jQuery`对象。
19. `Tree shaking` 作用：在模块引入打包中，引入什么就打包什么，未引入的模块代码就会被忽略掉；或者当一个模块文件中会export多个模块，但只被引入某些个模块，另有部分模块可能未被引用时，Tree Shaking 也会把这个模块文件中的未被引用的模块给摇掉，也就是不打包它们，而只打包该模块文件中被引用的那些模块。注意 Tree Shaking只支持ES Module这种模块引入方法，对其他模块引入方式(如CommonJS/AMD等)不起作用。在开发环境中默认不开启，如需开启需配置`optimization中的usedExports: true`，同时在package.json中配置`"sideEffects": false,`，意思是Tree Shaking 对所有模块都进行treeShaking操作，这里也可以将值改为数组，数组项即被用来配置需要忽略treeShaking操作的模块，例如在js页面中引入`import "@babel/polyfill"`时就可以配置`"sideEffects": [ "@babel/polyfill" ],`。但现在一般不用这样配置，因为已经在`.babelrc`中配置了`"useBuiltIns": "usage"`这样表示默认所有js都已添加`import "@babel/polyfill"`。所以既然页面js中无需做这样的引入，就不需要添加treeShaking默认忽略列表项。当然如果引入的模块是scss或css之类的样式文件模块，则为防止部分样式代码未被引用导致被treeShaking误忽略打包造成不可控错误，可以进行类似`sideEffects: [*.css]`的配置。(这样在开发环境中就算是配置好Tree Shaking，但是打包后其实仍会将未引入的模块打包进dist里，只是相比未配置，会多加一句注释表明使用的模块是哪些，其原因是为了开发环境下的调试方便，避免因删除未引入模块代码导致的行数错乱从而误导错误提示行数。)在生产环境中Tree Shaking 默认就已经开启了，所以无需配置optimization中的`usedExports: true`，但还是需要在package.json中配置`sideEffects`的忽略列表，这里要注意。

## 可选配置
1. 打包分析，可以查看打包模块之间的关系，官方提供的可以访问webpack-analyse这个地址，它提供用于生成打包分析的JSON文件的命令，还可在该页面获取可视化分析该JSON文件的入口地址。可将`--profile --json > stats.json`这个命令片段添加至package.json文件的script脚本命令中，例如`"dev-build": "webpack --profile --json > stats.json --config ./build/webpack.dev.js"`，配置好后运行`npm run dev-build`命令完成后会在项目根目录生成stats.json文件，这个json文件中会有打包过程的各项信息。可以将这个`json`文件上传至`http://webpack.github.com/analyse`查看打包过程信息的可视化展示(注意这个地址说是需要科学上网才能访问，不过我即使科学上网也不能访问？)。如果上面的官方分析工具始终无法访问，也可以使用其他方法，可以访问`webpack`官方文档的`DOCUMENTATION -> GUIDES -> Code Splitting -> Bundle Analysis`查看其他分析工具，推荐使用`Webpack Bundle Analyzer`。
2. webpack构建项目的js模块文件中的`this`默认指向模块本身，而不是指向`window`对象，如果要想将`this`指向`window`对象，需要通过`imports-loader`来解决。
3. 用webpack打包库代码，方法与打包业务代码差不多，只是在`output`配置中添加`libraryTarget: "umd"`和`library: library`，前者作用是为打包后的库添加支持`ES Module`、`AMD`、`CMD`模块引入方式，后者作用是当库代码直接被页面用`<script />`引入时提供一个名为`library`的全局变量，可以用于访问库代码中的方法。另外当自身库代码依赖其他第三方库代码时，比如依赖`lodash`库时，可以在配置文件中添加`externals: [ "lodash" ]`，这样可以在打包自身库代码时忽略打包`lodash`的代码，这样就能通过不打包进第三方库代码来减小自身库代码体积，而当他人引用自身库代码时，也只需在其代码中引入lodash库依赖就可以使用我们发布的库了。发布npm库：`npm adduser`和`npm publish`，注意要修改包管理文件`package.json`中的`main`属性值为打包生成的目标文件。
4. PWA打包配置。webpack打包生成的dist文件通常最后是丢到服务器上供访问，如想在本地体验这种丢服务器上测试可以本地安装`http-server`，然后当打包完成后再运行`scripts`命令`"start": "htt-server dist"`，这样的操作和将项目打包后dist目录丢到服务器上访问类似。PWA指实现当服务器挂掉/断网时浏览器本地可利用缓存继续访问该服务器中的原网页，有更好的用户体验。首先安装`workbox-webpack-plugin`，在生产环境配置文件中引入(无须用于开发环境)并在`plugins`中配置该插件。除此以外，还要在入口js中写些业务代码来实现PWA，看下面
    ```js
    if ("serviceWorker" in navigator) { // 如果浏览器支持serviceWorker     
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").then(registration => {
          console.log("service-wroker registed");
        }).catch(err => {
          console.log("service-worker register error");
        })
      })
    }
    ```
5. webpack打包配置TypeScript，首先安装`npm i -D ts-loader typescript`，然后配置文件中添加`ts-loader`配置，其次在根目录添加`tsconfig.json`配置文件进行相应ts配置，了解ts配置可以查看这里。如果在`.tsx`文件中引入`lodash`或者`jquery`这样的第三方库使用，为了仍能使用ts的错误检查警告这个优势(例如ts中对方法参数的校验)，需要安装第三方库对应的typescript类型文件检查包，例如使用`lodash`需要安装`@types/lodash`，使用jquery需要安装`@types/jquery，`如果对于要安装对应类型检查文件包不清楚，可以点击这里进行搜索。


## webpack打包性能优化
提高webpack打包速度：
1. 升级新的webpack版本、Node和npm版本；
2. 在尽可能少的模块上应用`loader`(通过`include`或者`exclude`去约定只有某些文件夹下的模块被引入时才使用对应loader，从而降低该loader被执行频率，以此更少量执行该loader的转化或编译执行过程)；
3. 尽可能少使用`plugin`，同时确保`plugin`的可靠性；
4. `resolve`参数合理配置，例如`resolve: { extensions: [ ".js", ".jsx" ] }`，它作用是当引入文件不写后缀时通过该配置从左到右依次查找对应后缀的文件。不过注意这里需要合理配置，不要滥用，如果添加项太多，会导致打包查找文件时增加性能损耗。约定资源性文件如图片要写后缀`.png`，而逻辑性的如`jsx`则加下。
5. 使用`DllPlugin`提高打包速度：由于第三方模块通常长期不变，所以只在首次打包第三方模块时分析该模块代码，其他时候打包不会分析该第三方模块代码，以此加快打包速度。可以点击这里查看`DllPlugin`官方配置文档；
6. 控制包文件大小，对于未使用到的包可以通过Tree Shaking或者不引用等方法降低包大小；
7. 多进程打包；
8. 合理使用sourceMap，通常越详细的sourceMap打包的越慢；
9. 结合stats分析打包结果；
10. 开发环境内存编译；
11. 开发环境无用插件剔除；



## 多页面打包配置
使用webpack4打包多Html页面的配置是在上面基础上，特别的利用`Html-webpack-plugin`，这里给出一个配置方案仅供参考：
```js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin"); // 用于生成html文件的插件  

// 配置入口对象与html-webpack-plugin实例集合，约定对应html的js与html同名以便自动化生成入口对象
const entries = {}; // 保存文件入口
const pages = []; // 存放html-webpack-plugin实例
(function () {
  let pagePath = path.join(__dirname, "src/views"); // 定义存放html页面的文件夹路径，此处值为 F:\modules\webapck4\w4-2\src\views
  let paths = fs.readdirSync(pagePath); // 获取pagePath路径下的所有文件，此处值为 [ 'about.html', 'index.html', 'list.html', 'main.html' ]
  paths.forEach(page => {
    page = page.split(".")[0]; // 获取文件名（不带后缀），例： [ 'about', 'html' ]，当前page值就为字符串about
    pages.push(new HtmlWebpackPlugin({
      filename: `views/${page}.html`, // 生成的html文件的路径（基于出口配置里的path）
      template: path.resolve(__dirname, `src/views/${page}.html`), // 参考的html模板文件
      chunks: [page, "common", "vendors", "manifest"], // 配置生成的html引入的公共代码块 引入顺序从右至左
      // favicon: path.resolve(__dirname, 'src/img/favicon.ico'),            // 配置每个html页面的favicon
    }));
    entries[page] = path.resolve(__dirname, `src/js/${page}.js`); // 入口js文件对象
  })
})();

module.exports = {
  entry: entries,
  /*... 其他配置略 */
  plugin: [
    // 展开所有 new HmtlWebpackPlugin 生成页面的配置对象
    ...pages,
  ]
}
```

目录结构如下：

<img :src="$withBase('/images/enengineering/webpack19121301.png')" alt="enengineering/webpack19121301.png">
