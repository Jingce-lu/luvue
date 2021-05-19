# Node 中的模块

[[toc]]

## 一.commonjs 规范

1. 每个 js 文件都是一个模块
2. 模块的导出 module.exports
3. 模块的导入 require

## 二.node 中的模块的分类

1. 核心模块/内置模块 fs http path 不需要安装 引入的时候不需要增加相对路径、绝对路径
2. 第三方模块需要安装
3. 自定义模块需要通过绝对路径或者相对路径进行引入

## 三.模块实现

实现 node 中的模块化机制

```js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function Module(id) {
  this.id = id;
  this.exports = {};
}
Module.wrapper = [
  `(function(exports,require,module,__filename,__dirname){`,
  `})`,
];
Module._extensions = {
  ".js"(module) {
    let content = fs.readFileSync(module.id, "utf8");
    content = Module.wrapper[0] + content + Module.wrapper[1];
    let fn = vm.runInThisContext(content);
    let exports = module.exports;
    let dirname = path.dirname(module.id);
    fn.call(exports, exports, req, module, module.id, dirname);
  },
  ".json"(module) {
    let content = fs.readFileSync(module.id, "utf8");
    module.exports = JSON.parse(content);
  },
};
Module._resolveFilename = function (filename) {
  let absPath = path.resolve(__dirname, filename);
  let isExists = fs.existsSync(absPath);
  if (isExists) {
    return absPath;
  } else {
    let keys = Object.keys(Module._extensions);
    for (let i = 0; i < keys.length; i++) {
      let newPath = absPath + keys[i];
      let flag = fs.existsSync(newPath);
      if (flag) {
        return newPath;
      }
    }
    throw new Error("module not exists");
  }
};
Module.prototype.load = function () {
  let extName = path.extname(this.id);
  Module._extensions[extName](this);
};
Module._cache = {};

function req(filename) {
  filename = Module._resolveFilename(filename);
  let cacheModule = Module._cache[filename];
  if (cacheModule) {
    return cacheModule.exports;
  }
  let module = new Module(filename);
  Module._cache[filename] = module;
  module.load();
  return module.exports;
}
```

## 四.Events 模块

node 中自己实现的发布订阅模块,订阅是将方法对应成一种一对多的关系，on 方法用来订阅事件

```js
function EventEmitter() {
  this._events = Object.create(null);
}
EventEmitter.prototype.on = function (eventName, callback) {
  if (!this._events) this._events = Object.create(null);

  // 如果用户绑定的不是newListener 让newListener的回调函数执行
  if (eventName !== "newListener") {
    if (this._events["newListener"]) {
      this._events["newListener"].forEach((fn) => fn(eventName));
    }
  }
  if (this._events[eventName]) {
    this._events[eventName].push(callback);
  } else {
    this._events[eventName] = [callback]; // {newListener:[fn1]}
  }
};
```

off 方法可以移除对应的事件监听

```js
// 移除绑定的事件
EventEmitter.prototype.off = function (eventName, callback) {
  if (this._events[eventName]) {
    this._events[eventName] = this._events[eventName].filter((fn) => {
      return fn != callback && fn.l !== callback;
    });
  }
};
```

emit 用来执行订阅的事件

```js
EventEmitter.prototype.emit = function (eventName, ...args) {
  if (this._events[eventName]) {
    this._events[eventName].forEach((fn) => {
      fn.call(this, ...args);
    });
  }
};
```

once 绑定事件当执行后自动删除订阅的事件

```js
EventEmitter.prototype.once = function (eventName, callback) {
  let one = (...args) => {
    callback.call(this, ...args);
    // 删除掉这个函数
    this.off(eventName, one); // 执行完后在删除掉
  };
  one.l = callback; // one.l = fn;
  // 先绑定一个once函数，等待emit触发完后执行one函数 ，执行原有的逻辑，执行后删除once函数
  this.on(eventName, one);
};
```
