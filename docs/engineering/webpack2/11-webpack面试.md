# webpack面试题
<!-- TOC -->

- [webpack面试题](#webpack面试题)
  - [webpack与grunt、gulp的不同？](#webpack与gruntgulp的不同)
  - [webpack、rollup、parcel优劣？](#webpackrollupparcel优劣)
  - [有哪些常见的Loader？](#有哪些常见的loader)
  - [有哪些常见的Plugin？](#有哪些常见的plugin)
  - [分别介绍bundle，chunk，module是什么](#分别介绍bundlechunkmodule是什么)
  - [Loader和Plugin的不同？](#loader和plugin的不同)
  - [webpack的构建流程是什么?](#webpack的构建流程是什么)
  - [是否写过Loader和Plugin？描述一下编写loader或plugin的思路？](#是否写过loader和plugin描述一下编写loader或plugin的思路)
  - [webpack的热更新是如何做到的？说明其原理？](#webpack的热更新是如何做到的说明其原理)
  - [如何用webpack来优化前端性能？](#如何用webpack来优化前端性能)
  - [如何提高webpack的打包速度?](#如何提高webpack的打包速度)
  - [如何提高webpack的构建速度？](#如何提高webpack的构建速度)
  - [怎么配置单页应用？怎么配置多页应用？](#怎么配置单页应用怎么配置多页应用)
  - [webpack 热更新原理](#webpack-热更新原理)
  - [code split 介绍](#code-split-介绍)
  - [webpack优化](#webpack优化)
  - [打包原理](#打包原理)

<!-- /TOC -->

## webpack与grunt、gulp的不同？
Grunt、Gulp是基于任务运行的工具：

它们会自动执行指定的任务，就像流水线，把资源放上去然后通过不同插件进行加工，它们包含活跃的社区，丰富的插件，能方便的打造各种工作流。

Webpack是基于模块化打包的工具:

自动化处理模块,webpack把一切当成模块，当 webpack 处理应用程序时，它会递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 bundle。

因此这是完全不同的两类工具,而现在主流的方式是用npm script代替Grunt、Gulp,npm script同样可以打造任务流.

## webpack、rollup、parcel优劣？
**webpack**适用于大型复杂的前端站点构建: webpack有强大的loader和插件生态,打包后的文件实际上就是一个立即执行函数，这个立即执行函数接收一个参数，这个参数是模块对象，键为各个模块的路径，值为模块内容。立即执行函数内部则处理模块之间的引用，执行模块等,这种情况更适合文件依赖复杂的应用开发.

**rollup**适用于基础库的打包，如vue、d3等: Rollup 就是将各个模块打包进一个文件中，并且通过 Tree-shaking 来删除无用的代码,可以最大程度上降低代码体积,但是rollup没有webpack如此多的的如代码分割、按需加载等高级功能，其更聚焦于库的打包，因此更适合库的开发.

**parcel**适用于简单的实验性项目: 他可以满足低门槛的快速看到效果,但是生态差、报错信息不够全面都是他的硬伤，除了一些玩具项目或者实验项目不建议使用

## 有哪些常见的Loader？
- file-loader：把文件输出到一个文件夹中，在代码中通过相对 URL 去引用输出的文件
- url-loader：和 file-loader 类似，但是能在文件很小的情况下以 base64 的方式把文件内容注入到代码中去
- source-map-loader：加载额外的 Source Map 文件，以方便断点调试
- image-loader：加载并且压缩图片文件
- babel-loader：把 ES6 转换成 ES5
- css-loader：加载 CSS，支持模块化、压缩、文件导入等特性
- style-loader：把 CSS 代码注入到 JavaScript 中，通过 DOM 操作去加载 CSS。
- eslint-loader：通过 ESLint 检查 JavaScript 代码


## 有哪些常见的Plugin？
- define-plugin：定义环境变量
- html-webpack-plugin：简化html文件创建
- uglifyjs-webpack-plugin：通过UglifyES压缩ES6代码
- webpack-parallel-uglify-plugin: 多核压缩,提高压缩速度
- webpack-bundle-analyzer: 可视化webpack输出文件的体积
- mini-css-extract-plugin: CSS提取到单独的文件中,支持按需加载

## 分别介绍bundle，chunk，module是什么
- bundle：是由webpack打包出来的文件
- chunk：代码块，一个chunk由多个模块组合而成，用于代码的合并和分割
- module：是开发中的单个模块，在webpack的世界，一切皆模块，一个模块对应一个文件，webpack会从配置的entry中递归开始找出所有依赖的模块


## Loader和Plugin的不同？
**不同的作用**:
- **Loader**直译为"加载器"。Webpack将一切文件视为模块，但是webpack原生是只能解析js文件，如果想将其他文件也打包的话，就会用到`loader`。 所以Loader的作用是让webpack拥有了加载和解析_非JavaScript文件_的能力。
- **Plugin**直译为"插件"。Plugin可以扩展webpack的功能，让webpack具有更多的灵活性。 在 Webpack 运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果。

**不同的用法**:
- **Loader**在`module.rules`中配置，也就是说他作为模块的解析规则而存在。 类型为数组，每一项都是一个`Object`，里面描述了对于什么类型的文件（`test`），使用什么加载(`loader`)和使用的参数（`options`）
- **Plugin**在`plugins`中单独配置。 类型为数组，每一项是一个`plugin`的实例，参数都通过构造函数传入。


## webpack的构建流程是什么?
Webpack 的运行流程是一个串行的过程，从启动到结束会依次执行以下流程：
1. 初始化参数：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数；
2. 开始编译：用上一步得到的参数初始化 Compiler 对象，加载所有配置的插件，执行对象的 run 方法开始执行编译；
3. 确定入口：根据配置中的 entry 找出所有的入口文件；
4. 编译模块：从入口文件出发，调用所有配置的 Loader 对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；
5. 完成模块编译：在经过第4步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；
6. 输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；
7. 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

在以上过程中，Webpack 会在特定的时间点广播出特定的事件，插件在监听到感兴趣的事件后会执行特定的逻辑，并且插件可以调用 Webpack 提供的 API 改变 Webpack 的运行结果。


## 是否写过Loader和Plugin？描述一下编写loader或plugin的思路？
Loader像一个"翻译官"把读到的源文件内容转义成新的文件内容，并且每个Loader通过链式操作，将源文件一步步翻译成想要的样子。

编写Loader时要遵循单一原则，每个Loader只做一种"转义"工作。 每个Loader的拿到的是源文件内容（`source`），可以通过返回值的方式将处理后的内容输出，也可以调用`this.callback()`方法，将内容返回给webpack。 还可以通过 `this.async()`生成一个`callback`函数，再用这个callback将处理后的内容输出出去。 此外webpack还为开发者准备了开发loader的工具函数集——`loader-utils`。

相对于Loader而言，Plugin的编写就灵活了许多。 webpack在运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果。

## webpack的热更新是如何做到的？说明其原理？
webpack的热更新又称热替换（Hot Module Replacement），缩写为HMR。 这个机制可以做到不用刷新浏览器而将新变更的模块替换掉旧的模块。

原理：

<img :src="$withBase('/images/engineering/hmr.png')" alt="images/engineering/hmr.png">

首先要知道server端和client端都做了处理工作
1. 第一步，在 webpack 的 watch 模式下，文件系统中某一个文件发生修改，webpack 监听到文件变化，根据配置文件对模块重新编译打包，并将打包后的代码通过简单的 JavaScript 对象保存在内存中。
2. 第二步是 webpack-dev-server 和 webpack 之间的接口交互，而在这一步，主要是 dev-server 的中间件 webpack-dev-middleware 和 webpack 之间的交互，webpack-dev-middleware 调用 webpack 暴露的 API对代码变化进行监控，并且告诉 webpack，将代码打包到内存中。
3. 第三步是 webpack-dev-server 对文件变化的一个监控，这一步不同于第一步，并不是监控代码变化重新打包。当我们在配置文件中配置了devServer.watchContentBase 为 true 的时候，Server 会监听这些配置文件夹中静态文件的变化，变化后会通知浏览器端对应用进行 live reload。注意，这儿是浏览器刷新，和 HMR 是两个概念。
4. 第四步也是 webpack-dev-server 代码的工作，该步骤主要是通过 sockjs（webpack-dev-server 的依赖）在浏览器端和服务端之间建立一个 websocket 长连接，将 webpack 编译打包的各个阶段的状态信息告知浏览器端，同时也包括第三步中 Server 监听静态文件变化的信息。浏览器端根据这些 socket 消息进行不同的操作。当然服务端传递的最主要信息还是新模块的 hash 值，后面的步骤根据这一 hash 值来进行模块热替换。
5. webpack-dev-server/client 端并不能够请求更新的代码，也不会执行热更模块操作，而把这些工作又交回给了 webpack，webpack/hot/dev-server 的工作就是根据 webpack-dev-server/client 传给它的信息以及 dev-server 的配置决定是刷新浏览器呢还是进行模块热更新。当然如果仅仅是刷新浏览器，也就没有后面那些步骤了。
6. HotModuleReplacement.runtime 是客户端 HMR 的中枢，它接收到上一步传递给他的新模块的 hash 值，它通过 JsonpMainTemplate.runtime 向 server 端发送 Ajax 请求，服务端返回一个 json，该 json 包含了所有要更新的模块的 hash 值，获取到更新列表后，该模块再次通过 jsonp 请求，获取到最新的模块代码。这就是上图中 7、8、9 步骤。
7. 而第 10 步是决定 HMR 成功与否的关键步骤，在该步骤中，HotModulePlugin 将会对新旧模块进行对比，决定是否更新模块，在决定更新模块后，检查模块之间的依赖关系，更新模块的同时更新模块间的依赖引用。
8. 最后一步，当 HMR 失败后，回退到 live reload 操作，也就是进行浏览器刷新来获取最新打包代码。


## 如何用webpack来优化前端性能？
用webpack优化前端性能是指优化webpack的输出结果，让打包的最终结果在浏览器运行快速高效。
- 压缩代码:删除多余的代码、注释、简化代码的写法等等方式。可以利用webpack的`UglifyJsPlugin`和`ParallelUglifyPlugin`来压缩JS文件， 利用`cssnano`（css-loader?minimize）来压缩css
- 利用CDN加速: 在构建过程中，将引用的静态资源路径修改为CDN上对应的路径。可以利用webpack对于`output`参数和各loader的`publicPath`参数来修改资源路径
- Tree Shaking: 将代码中永远不会走到的片段删除掉。可以通过在启动webpack时追加参数`--optimize-minimize`来实现
- Code Splitting: 将代码按路由维度或者组件分块(chunk),这样做到按需加载,同时可以充分利用浏览器缓存
- 提取公共第三方库:  SplitChunksPlugin插件来进行公共模块抽取,利用浏览器缓存可以长期缓存这些无需频繁变动的公共代码

## 如何提高webpack的打包速度?
- happypack: 利用进程并行编译loader,利用缓存来使得 rebuild 更快,遗憾的是作者表示已经不会继续开发此项目,类似的替代者是[thread-loader](https://github.com/webpack-contrib/thread-loader)
- [外部扩展(externals)](https://webpack.docschina.org/configuration/externals/): 将不怎么需要更新的第三方库脱离webpack打包，不被打入bundle中，从而减少打包时间,比如jQuery用script标签引入
- dll: 采用webpack的 DllPlugin 和 DllReferencePlugin 引入dll，让一些基本不会改动的代码先打包成静态资源,避免反复编译浪费时间
- 利用缓存: `webpack.cache`、babel-loader.cacheDirectory、HappyPack.cache都可以利用缓存提高rebuild效率
- 缩小文件搜索范围: 比如babel-loader插件,如果你的文件仅存在于src中,那么可以`include: path.resolve(__dirname, 'src')`,当然绝大多数情况下这种操作的提升有限,除非不小心build了node_modules文件


## 如何提高webpack的构建速度？
1. 多入口情况下，使用`CommonsChunkPlugin`来提取公共代码
2. 通过`externals`配置来提取常用库
3. 利用`DllPlugin`和`DllReferencePlugin`预编译资源模块 通过`DllPlugin`来对那些我们引用但是绝对不会修改的npm包来进行预编译，再通过`DllReferencePlugin`将预编译的模块加载进来。
4. 使用`Happypack` 实现多线程加速编译
5. 使用`webpack-uglify-parallel`来提升`uglifyPlugin`的压缩速度。 原理上`webpack-uglify-parallel`采用了多核并行压缩来提升压缩速度
6. 使用`Tree-shaking`和`Scope Hoisting`来剔除多余代码


## 怎么配置单页应用？怎么配置多页应用？
单页应用可以理解为webpack的标准模式，直接在`entry`中指定单页应用的入口即可，这里不再赘述

多页应用的话，可以使用webpack的 `AutoWebPlugin`来完成简单自动化的构建，但是前提是项目的目录结构必须遵守他预设的规范。 多页应用中要注意的是：
- 每个页面都有公共的代码，可以将这些代码抽离出来，避免重复的加载。比如，每个页面都引用了同一套css样式表
- 随着业务的不断扩展，页面可能会不断的追加，所以一定要让入口的配置足够灵活，避免每次添加新页面还需要修改构建配置


## webpack 热更新原理
1. 当修改了一个或多个文件；
2. 文件系统接收更改并通知webpack；
3. webpack重新编译构建一个或多个模块，并通知HMR服务器进行更新；
4. HMR Server 使用webSocket通知HMR runtime 需要更新，HMR运行时通过HTTP请求更新jsonp；
5. HMR运行时替换更新中的模块，如果确定这些模块无法更新，则触发整个页面刷新。

## code split 介绍
为了减少HTTP请求，通常我们会讲所有代码打包到一个文件中，但是如果文件过大，也会影响页面的加载速度，尤其是会增加白屏时间，所以我们不妨将代码分成一块一块的；并且只在需要的时候去加载它；还可以利用浏览器将这些模块缓存起来；一般情况下分离有两种
  - 将第三方代码从业务代码中抽离（verdor）
  - 根据不同入口的业务代码按需加载（利用 import()语法）


## webpack优化
* loader处理结果缓存
    1. babel-loader缓存,通过`cacheDirectory`开启缓存
        ```js
        webpack.module.rules:{
          test: /\.js$/,
          use: [
            {
              loader: resolve('babel-loader'),
              options: {
                babelrc: false,
                // 将 babel 编译过的模块缓存在 webpack_cache 目录下，下次优先复用
                cacheDirectory: true,
              },
            },
          ]
        }
        ```
    2. eslint-loader缓存,通过`cache`选项指定缓存路径；注：配置更后如果不起作用则需要将`cache`文件删除
        ```js
        webpack.module.rules:{
          test: /\.(js|vue)$/,
          enforce: 'pre',
          use: [
            {
              options: {
                // 启动缓存
                cache: true,
              },
              loader: require.resolve('eslint-loader'),
            },
          ]
        }
        ```
    3. css/scss缓存通过cache-loader辅助构建结果缓存

* 缩小编译范围，减少不必要的编译工作
    1. 指定模块解析路径，加速模块查找
        ```js
        webpack.resolve: {  // 指定以下目录寻找第三方模块，避免webpack往父级目录递归搜索
          modules: {
            'node_modules', 
            path.resolve(projectDir, 'src'), 
            path.resolve(projectDir, 'node_modules')
          }
        }
        ```
    2. 忽略未用模块化的库，不去解析它们以提升编译速度
        ```js
        webpack.module: {
          noParse: /node_modules\/(jQuery|chart\.js)/,
        }
        ```
    3. 为loader添加`include/exclude`缩小babel的编译范围
        ```js
        webpack.module.rules: {
          test: /\.js$/,
            use: [{
              loader: 'babel-loader',
              query: {
                // 将 babel 编译过的模块缓存在 webpack_cache 目录下，下次优先复用
                cacheDirectory: './webpack_cache/',
              },
            }],
            // 减少 babel 编译范围，忘记设置会让 webpack 编译慢上好几倍
            include: path.resolve(__dirname, 'src'),
        }
        ```

* 通过`webpack-parallel-uglify-plugin`插件开启多个子线程压缩代码
* 通过`Happypack`开启多线程加速loader对文件的转换速度
    ```js
    module.exports = {
      module: {
        rules: [
          {
            test: /\.js?$/,
            use: ['happypack/loader?id=babel'],
            include: path.resolve(__dirname, 'src'),
          },
        ]
      },
      plugins: [
        new HappyPack({
          id: 'babel',
          loaders: [{
            loader: 'babel-loader',
            query: {  
              cacheDirectory: './webpack_cache/',
            },
          }],
        })
      ],
    };
    ```
* 用`DllPlugin`和`DllReferencePlugin`提前打包公共模块；注：不建议将所有公共模块放在dll中，否则无法用webpack的`代码分割`和`按需加载`功能
* 使用`ModuleConcatenationPlugin`插件开启`scope-hoisting(作用域提升)`功能，尽可能的把打包出来的模块合并到一个函数中去（代码需要符合es6的module规范）
    > 注意： webpack4中，去掉了这个插件改为`optimization.concatenateModules`配置，默认`在生产环境是开启的`
* 使用 ES6 模块来开启 `tree shaking`
* 按照路由拆分代码，实现按需加载
* 使用`webpack-bundle-analyzer对`打包文件进行分析，将大文件模块提取出来在html中单独加载
    webpack配置：
    ```js
    // ...
    externals: {
        'element-ui': 'Element',
        'v-charts': 'VCharts'
    }
    ```
    html:
    ```html
    <script src="https://unpkg.com/element-ui@2.10.0/lib/index.js"></script>
    ```
    webpack持久化缓存


## 打包原理
- 识别入口文件, 分析代码, 获取模块依赖, 并且将代码打包为浏览器可以识别的代码
- 递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 bundle

webpack打包原理
- 识别入口文件
- 通过逐层识别模块依赖。（`Commonjs`、`amd`或者es6的`import`，webpack都会对其进行分析。来获取代码的依赖）
- `webpack`做的就是分析代码。转换代码，编译代码，输出代码
- 最终形成打包后的代码
