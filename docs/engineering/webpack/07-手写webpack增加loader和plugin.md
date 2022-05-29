# 手写webpack——增加loader和plugin

## loader
首先，我们先写两个简化版loader——style-loader和less-loader
首先在项目“webpackSimple”中安装插件less（为将less文件转化为css），然后根目录下新建文件夹loader，在其中新建style-loader.js和less-loader.js两个文件

```js
// less-loader.js
let less = require("less")
function loader(source) {
  let css = "";
  less.render(source, function(err, c) {  // 这是less插件提供的解析方法
    css = c.css;
  })
  css = css.replace(/\n/g, "\\n");  // 这里\n是换行，但转换成字符串后，不能正确解析
  return css;
}
module.exports = loader;
```

```js
//style-loader.js
function loader(source) {
  let style = `
    let style = document.createElement('style');
    style.innerHTML = ${JSON.stringify(source)}; // 将css文件的内容字符串化
    document.head.appendChild(style)
  `;
  return style;
}
module.exports = loader;
```

以上，我们新建了两个loader。webpack.config.js新增对less文件的处理

```js
 module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          path.resolve(__dirname, "loader", "style-loader"), //这里，使用自己创建的loader
          path.resolve(__dirname, "loader", "less-loader")
        ]
      }
    ]
  }
```

接下来，我们就需要在哪个手写的webpack中添加对loader的处理了，处理loader，其实就是解析文件的方式与之前纯js不同。js就只是得到文件内容。而别的文件需要loader先处理一遍。所以，此处修改Compiler.js中的getSource方法

```js
getSource(modulePath) {
    // 拿到匹配规则
    let rules = this.config.module.rules;
    // 拿到文件内容
    let content = fs.readFileSync(modulePath, "utf8");
    // 分别处理不同规则
    rules.forEach((rule, index) => {
      let { test, use } = rule;
      let len = use.length - 1;
      if (test.test(modulePath)) {
        // 如果匹配到了，也就是说这个模块需要用loader来转换
        function normalLoader() {
          let loader = require(use[len--]); // 因为loader规则是从下至上，从右至左的
          // 递归调用loader,实现转化功能
          // loader获取对应的loader函数
          content = loader(content);
          if (len >= 0) {
            normalLoader(); // 如果还有loader，继续执行
          }
        }
        normalLoader();
      }
    });
    return content;
  }
```

好了，接下来，我们测试下结果。首先，在webpackSimple项目的新建一个index.less文件并且在index.js中引入。然后在dist目录下新建index.html,并且引入bundle.js，文件目录如下：

![menu.png](https://upload-images.jianshu.io/upload_images/1967135-c5420306b9e047cf.png?imageMogr2/auto-orient/strip|imageView2/2/w/308/format/webp)

```js
//index.less
body {
  background: red;
}
```

然后再项目中运行`npx demo-start`

在浏览器中打开index.html

![image.png](https://upload-images.jianshu.io/upload_images/1967135-a271f1e0a93d454b.png)

可以看到，less文件被成功的解析并导入了。

## 添加plugin
首先在我们的“webpack”插件中安装“tapable”（方便使用钩子函数）。这里我们只用[SyncHook](https://links.jianshu.com/go?to=%255Bhttps%3A%2F%2Fwww.jianshu.com%2Fp%2F88671fa85746%255D%28https%3A%2F%2Fwww.jianshu.com%2Fp%2F88671fa85746%29)举例,首先在Compiler.js中引入SyncHook

**在编译文件时，先拿到webpack.config.js文件，看其中是否有plugins字段，有的话，就挨个执行，插件的内部其实就是注册一个个钩子函数**

```js
//Compiler.js
let { SyncHook } = require("tapable");
class Compiler {
  constructor(config) {
    ...
    this.hooks = {
      entryOption: new SyncHook(),
      compile: new SyncHook(),
      afterCompile: new SyncHook(),
      afterPlugins: new SyncHook(),
      run: new SyncHook(),
      emit: new SyncHook(),
      done: new SyncHook()
    };
    // 如果传递了plugins参数
    let plugins = this.config.plugins;
    if (Array.isArray(plugins)) {
      plugins.forEach(plugin => {
        plugin.apply(this);  //插件内部都由apply方法
      });
    }
    // 插件装载完成
    this.hooks.afterPlugins.call();  //调用钩子
  }
  ...
```

项目代码：
```js
//webpack.config.js

class P {   // 模拟一个plugin
  apply(complier) {
    complier.hooks.emit.tap("emit", function() { // 注册钩子“emit”
      console.log("emit");
    });
  }
}
module.exports = {
  entry: './src/index.js',
  ...
  plugins: [new P()]
}
```
