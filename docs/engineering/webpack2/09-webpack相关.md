webpack相关
===

<!-- TOC -->

- [打包体积 优化思路](#打包体积-优化思路)
- [打包效率](#打包效率)
- [Loader 编写一个loader](#loader-编写一个loader)
- [plugins](#plugins)
- [定义环境变量](#定义环境变量)
- [区分不同环境(生产与开发环境)](#区分不同环境生产与开发环境)
- [打包多页应用](#打包多页应用)
- [打包文件分类](#打包文件分类)
  - [归类](#归类)
  - [加域名前缀](#加域名前缀)

<!-- /TOC -->

## 打包体积 优化思路
1. 提取第三方库或通过引用外部文件的方式引入第三方库
2. 代码压缩插件UglifyJsPlugin
3. 服务器启用gzip压缩
4. 按需加载资源文件 require.ensure
5. 优化devtool中的source-map
6. 剥离css文件，单独打包
7. 去除不必要插件，通常就是开发环境与生产环境用同一套配置文件导致


## 打包效率
1. 开发环境采用增量构建，启用热更新
2. 开发环境不做无意义的工作如提取css计算文件hash等
3. 配置devtool
4. 选择合适的loader
5. 个别loader开启cache 如babel-loader
6. 第三方库采用引入方式
7. 提取公共代码
8. 优化构建时的搜索路径 指明需要构建目录及不需要构建目录
9. 模块化引入需要的部分

## Loader 编写一个loader
loader就是一个node模块，它输出了一个函数。当某种资源需要用这个loader转换时，这个函数会被调用。并且，这个函数可以通过提供给它的this上下文访问Loader API。

reverse-txt-loader
```js
// reverse-txt-loader
// 定义
module.exports = function(src) {
  //src是原文件内容（abcde），下面对内容进行处理，这里是反转
  var result = src.split('').reverse().join(''); 
  //返回JavaScript源码，必须是String或者Buffer
  return `module.exports = '${result}'`;
}

// 使用
{
  test: /\.txt$/,
  use: [
    {
      './path/reverse-txt-loader'
     }
  ]
},
```

## plugins
使用范围更广，通常只需要require()然后添加到plugins数组中，且需要new一个


## 定义环境变量
当我们在配置的时候，需要区分所配置的属性参数是属于生产环境还是开发环境。每个环境对应的配置都不同。这就是环境变量最重要的意义

当然，要实现上面所说的效果，就需要用到webpack内置插件`webpack.DefinePlugin`

环境变量配置
```js
//webpack.config.js
let webpack = require('webpack');
plugins:[
    new webpack.DefinePlugin({
        //DEV:'dev'//这样独到的DEV是dev，但是dev是变量，而不是字符串，如果要是字符串，那就应该写成“’dev‘”
		//上面的写法比较恶心，要用两个引号，那么可以换下面这种方式
		DEV:JSON.stringify('dev'),//解析出来的就是“’dev‘”
		EXPRESSION:'1+1',//这样解析出来就是2，而不是'1+1'，如果要解析出来是'1+1',那就应该写成JSON.stringify('1+1')
		FLAG：'true',//解析出来就是true
		//注意，这个大写的变量名称，是随你定义的
    })
]
```

## 区分不同环境(生产与开发环境)
> 对webpack.config.js分成两个文件，一个用于开发，一个用于生产

```
项目根目录
    |
    --------webpack.base.js  //基本配置 公共配置 （原先我们写的webpack.config.js）
    |
    --------webpack.dev.js     //开发环境
    |
    --------weboack.prod.js    //生产环境
```

安装插件 `webpack-merge`: `npm i webpack-merge -D`

> 这个插件内部有个`smart`函数，其作用：`合并两个配置文件`

写开发环境和生产环境的配置文件

```js
//webpack.dev.js开发环境
let { smart } = require('webpack-merge');
let base = require('./webpack.base.js');

modules.exports = smart(base,{//这样就能够让后面的对象的属性覆盖到base对象的属性
	mode: 'development',
	devServer:{

	},
	devtool:'source-map'
});
```

```js
//webpack.prod.js
let { smart } = require('webpack-merge');
let base = require('./webpack.base.js');

modules.exports = smart(base,{
	mode: 'production',
	optioization:{
		minimizer:[

		]
	},
	plugins:[

	]
});
```


## 打包多页应用
1. 首先，多页应用应该有多个js文件，那么新建如下：
    ```js
    src------index.js
          |
          ----other.js
              
    //index.js
    console.log('home');

    //other.js
    console.log('other');
    ```

2. 初始化这个项目
    ```bash
    npm init
    npm i webpack webpack-cli -D
    ```
3. 新建并配置webpack.config.js
    1. 多入口文件，那么entry就不能写成字符串形式，应该是一个对象
    2. 出口，因为是多入口，所以出口也是多个，要配置成动态名字

    ```js
    let path = require('path');
    module.exports = {
      entry: {
        home: './index.js',
        other: './other.js'
      },
      output: {
        filename: '[name]:[hash:8].js',
        path: path.resolve(__dirname, './dist')
      }

    }
    ```

4. 创建html文件
    ```
    node_modules
      |
    package.json
      |
    src------index.js
      |     |
      |      ----other.js
      |
    webpack.config.js
      |
    index.html
    ```

    > 虽然是多个入口js，但是html创建只需要一个就可以了，然后更具多个入口js，打包生成多个html


由于是多个入口，根据插件要求，2个入口就要new两次`HtmlWebpackPlugin`，然后分别配置

```js {3,6,7,14,19}
//webpack.config.js
let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: {
    home: './index.js',
    other: './other.js'
  },
  output: {
    filename: '[name]:[hash:8].js',
    path: path.resolve(__dirname, './dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'home.html',
      chunks: ['home'] //chunks代表代码块，也就是说，home.html中引入的对应js是entry为home的js，如果要引入other.js，那么这里就写['other']；如果两个都要，那么就写成['home','other']
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'other.html',
      chunks: ['other']
    })
  ]

}
```


## 打包文件分类
> 我们在打包时，可能要将css文件归类到css目录下，将img归类到img下，当然，我们也可能会在引用资源的时候加上域名前缀，这时候就用到了我们的打包文件分类。

### 归类
1. 给图片归类到img目录下 <br>
    在`url-loader`下配置`outputPath`，大于limit的图片就会生成到dist下的img文件夹下，同时所有路径都会加上这个/img/

    ```js
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 2, //200k，小于200k使用base64来转换
            outputPath: '/img/' //大于上面的limit的图片就会生成到dist下的img文件夹下，同时所有路径都会加上这个img/
          }
        }
      }
    ]
    ```
2. 给css归类到css目录下
    ```js
    plugins: [
      new MiniCssExtractPlugin({
        filename: '/css/[name].[chunkhash:8].css', //抽离出来的css的文件名称，并在dist下生成css文件夹，将该文件放到该css目录下，引入的时候会自动加上/css/
      })
    ],
    ```

### 加域名前缀
1. 对所有输出资源加域名前缀 <br>
    在output配置下家属性publicPath <br>
    在引用的资源前，统一加上这个`publicPath`，比如打包后的css路径是`/css/main.css`，那么引用的时候就会成为`publicPath值+’/css/main.css’`
    ```js
    output: {
      filename: 'bundle.[hash:8].js',
      path: path.resolve(__dirname, './dist'),
      publicPath: 'http://www.yuhua.com', //在引用的资源前，统一加上这个额publicPath，比如打包后的css路径是css/main.css，那么引用的时候就会成为publicPath值+'css/main.css'
    },
    ```
2. 如果有些资源使用了CDN分发，有些没有使用，那么只需要对使用了的资源统一加上域名就可以了
    > 比如图片使用CDN分发，那么在图片的loader加上publicPath配置

    ```js
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 2, //200k，小于200k使用base64来转换
            outputPath: '/img/', //大于上面的limit的图片就会生成到dist下的img文件夹下，同时所有路径都会加上这个/img/
            publicPath: 'http://www.yuhua.com'
          }
        }
      }
    ]    
    ```

e.g. 本身是引用线上资源的，是不会添加域名前缀的
