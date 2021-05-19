# 手写完整的 Promise 原理

[[toc]]

## 关于函数

什么是高阶函数： 把函数作为参数或者返回值的一类函数。

### before 函数

```js
Function.prototype.before = function (beforeFn) {
  return () => {
    beforeFn();
    this();
  };
};
function fn() {
  console.log("source");
}
const newFn = fn.before((say) => {
  console.log("say");
});
newFn();
```

AOP(面向切面编程)的主要作用是把一些跟核心业务逻辑模块无关的功能抽离出来，其实就是给原函数增加一层，不用管原函数内部实现

```sh
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 *
```

### 类型检测

```js
function checkType(content, Type) {
  return Object.prototype.toString.call(content) === `[object ${Type}]`;
}
const flag = checkType("hello", "String");

// -----------------------------------
function checkType(Type) {
  return function (content) {
    return Object.prototype.toString.call(content) === `[object ${Type}]`;
  };
}
const flag = checkType("hello", "String");
const util = {};
const types = ["String", "Number", "Boolean"];
types.forEach((type) => {
  util["is" + type] = checkType(type);
});
```

函数分步传递参数，将函数拆分成功能更具体化的函数

### 柯里化函数

```js
const currying = (fn, args = []) => {
  let len = fn.length;
  return (..._) => {
    let arg = args.concat(_);
    if (arg.length < len) {
      return currying(fn, arg);
    }
    return fn(...arg);
  };
};
const add = (a, b, c, d, e) => {
  return a + b + c + d + e;
};
let r = currying(add)(1)(2, 3)(4, 5);
console.log(r);
```

柯里化类型函数

```js
const types = ["String", "Number", "Boolean"];
let utils = {};
types.forEach((type) => {
  utils[`is${type}`] = currying(isType)(type);
});
```

### after 函数的应用

```js
const after = (times, callback) => () => {
  if (--times === 0) {
    callback();
  }
};
const newFn = after(3, () => {
  console.log("ok");
});
```

### 发布订阅模式 、 观察者模式

一种一对多的关系，发布者和订阅者是否有关联，观察者模式基于发布订阅模式

## promise 面试

### Promise 超时中断如何实现

```js
function wrap(p1) {
  let abort;
  let p2 = new Promise((resolve, reject) => {
    abort = function () {
      reject("失败");
    };
  });
  let p = Promise.race([p1, p2]);
  p.abort = abort;
  return p;
}
let p = wrap(
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 3000);
  })
);
p.then(
  () => {},
  () => {
    console.log("失败");
  }
);
p.abort();
```
