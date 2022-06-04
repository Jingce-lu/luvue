# 手写一个 mvp 版本的 webpack

```js
let fs = require('fs');
let path = require('path');

let babylon = require('babylon'); // Babylon 把源码转换为AST
let t = require('@babel/types'); // @babel-types 替换节点
let traverse = require('@babel/traverse').default; // @babel-traverse 遍历节点
let generator = require('@babel/generator').default; // @babel/generator 生成

let ejs = require('ejs'); // js模版

class Compiler {
  // 构造函数
  constructor(config) {
    // entry out
    this.config = config;
    // 1、保存入口文件的路径
    this.entryId;
    // 2、保存所有的模块依赖
    this.modules = {};
    // 入口路径
    this.entry = config.entry;
    // 工作路径
    this.root = process.cwd();
  }
  // 获取文件源码
  getSource(modulePath) {
    let content = fs.readFileSync(modulePath, 'utf8');
    return content;
  }
  // 解析源码
  parse(source, parentPath) {
    // AST解析语法树
    let ast = babylon.parse(source);
    let dependencies = [];
    traverse(ast, {
      CallExpression(p) {
        let node = p.node; // 对应的节点
        if (node.callee.name === 'require') {
          node.callee.name = '__webpack_require__';
          let moduleName = node.arguments[0].value; // 取到的就是模块的引用名字
          moduleName = moduleName + (path.extname(moduleName) ? '' : '.js');
          moduleName = './' + path.join(parentPath, moduleName);
          dependencies.push(moduleName);
          node.arguments = [t.stringLiteral(moduleName)];
        }
      },
    });
    let sourceCode = generator(ast).code;
    return { sourceCode, dependencies };
  }
  // 建立模块
  buildModule(modulePath, isEntry) {
    // 拿到模块的内容
    let source = this.getSource(modulePath);
    // 模块id modulePath modulePath-this.root  =  src/index.js
    let moduleName = './' + path.relative(this.root, modulePath);
    if (isEntry) {
      // 保存入口的名字
      this.entryId = moduleName;
    }
    // 解析需要把source源码进行改造，返回一个依赖列表
    let { sourceCode, dependencies } = this.parse(
      source,
      path.dirname(moduleName)
    );
    this.modules[moduleName] = sourceCode;
    dependencies.forEach(
      // 父模块的加载，递归加载
      dep => {
        this.buildModule(path.join(this.root, dep), false);
      }
    );
  }
  emitFile() {
    // 发射文件
    // 用数据渲染
    // 输出路径
    let main = path.join(this.config.output.path, this.config.output.filename);
    // 模板的路径
    let tempateStr = this.getSource(path.join(__dirname, 'main.ejs'));
    let code = ejs.render(tempateStr, {
      entryId: this.entryId,
      modules: this.modules,
    });

    // this.assets = {};
    // // 路径对应的代码
    // this.assets[main] = code;
    // fs.writeFileSync(main,this.assets[main]);

    fs.writeFileSync(main, code);
  }
  run() {
    // 执行并创建模块依赖关系
    this.buildModule(path.resolve(this.root, this.entry), true);
    // 发射一个打包后的文件
    this.emitFile();
  }
}

module.exports = Compiler;
```
