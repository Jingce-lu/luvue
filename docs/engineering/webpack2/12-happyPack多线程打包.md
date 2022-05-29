# happyPack多线程打包

## 1.安装happypack
```bash
npm i happypack
```

## 2.改造webpack.config.js，实现多线程打包js
```js
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

## 3.实现js和css的多线程打包
```js
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