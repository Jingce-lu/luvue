# 手写一个简单的webpack的配置

```js
const path = require("path");
const htmlWebpackPlugin = require("html-webpack-plugin");

//定义入库文件和出口文件路径
const PATH = {
    app:path.join(__dirname,"./src/js/main.js"),
    build:path.join(__dirname,"./dist")
}
///https://mapi.eyee.com/api/product/guessWhatYouLike
//以下是webpack的配置项
module.exports = {
    entry:{
        app:PATH.app,
    },
    output:{
        filename:"[name].js",
        path:PATH.build
    },
    module:{
        //loader的配置项
        rules:[
            {   
                //匹配.js文件
                test:/\.js$/,
                use:{
                    //遇到js文件用babell-loader处理
                    loader:"babel-loader",
                    options:{
                        //将ES6的代码转成ES5   遇到jsx语法的解析
                        presets:["@babel/env","@babel/react"]
                    }
                }
            },
            {
                test:/\.(css|scss)$/,
                use:["style-loader","css-loader","sass-loader"]
            },
            {
                test: /\.(le|c)ss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { 
                            loader: 'css-loader', 
                        },
                        'postcss-loader'
                    ]
                }),
            },
            {
               test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
               use: [
                  {
                    loader: ‘url-loader’,
                    options: {
                      limit: 10000,
                      name: utils.assetsPath(‘img/[name].[hash:7].[ext]’)
                    }
                  },
                  {
                    loader: ‘image-webpack-loader’, // 压缩图片
                    options: {
                      bypassOnDebug: true,
                    }
                  }
               ]
            },
            {
　　　　　　　　  test: require.resolve('zepto'),
　　　　　　　　  loader: 'exports-loader?window.Zepto!script-loader'
            }

        ]
    },
    //插件
    plugins:[
        //html模板
        new htmlWebpackPlugin({
            filename:"index.html",
            template:"./index.html",
            title:"斗牛",
            chunks:["app"]
        })
        
    ],
    devServer:{
        //跨域配置
        proxy:{
            "/api":{
                target:"https://mapi.eyee.com",//目标地址
                changeOrigin:true,
                pathRewrite:{
                    "^/api":""
                }
            }
        }
    }
}
```
