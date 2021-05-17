# 手写 Vue3 中 Reactivity 模块实现

[[toc]]

## 一.配置 Webpack 开发环境

安装依赖 `yarn add webpack webpack-dev-server webpack-cli html-webpack-plugin @babel/core babel-loader @babel/preset-env -D`

**webpack.config.js 文件编写**

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js"
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js/,
        use: "babel-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html"
    })
  ]
};
```

配置.babelrc 文件

```json
{
  "presets": ["@babel/preset-env"]
}
```

执行脚本配置

```json
"scripts": {
    "build:dev": "webpack --mode development",
    "serve": "webpack-dev-server"
}
```

使用 Vue3 响应式模块

```js
import { reactive, effect } from "@vue/reactivity";
let state = reactive({
  name: "zf",
  age: 11
});
effect(() => {
  console.log(state.name);
});
```

## 二.目录结构搭建

```
computed.js
effect.js
index.js
reactive.js
ref.js
```

> 这里我们要实现的方法分别用 `reactive` 、`effect` 、`ref` 、 `computed`方法。在 index 文件中统一整合这些方法进行导出

```js
export { computed } from "./computed";
export { effect } from "./effect";
export { reactive } from "./reactive";
export { ref } from "./ref";
```

## 三.reactive 实现

```js
import { mutableHandlers } from "./baseHandlers"; // 代理相关逻辑
import { isObject } from "./util"; // 工具方法

export function reactive(target) {
  // 根据不同参数创建不同响应式对象
  return createReactiveObject(target, mutableHandlers);
}
function createReactiveObject(target, baseHandler) {
  if (!isObject(target)) {
    return target;
  }
  const observed = new Proxy(target, baseHandler);
  return observed;
}
```

baseHandlers

```js
import { isObject, hasOwn, hasChanged } from "./util";
import { reactive } from "./reactive";
const get = createGetter();
const set = createSetter();

function createGetter() {
  return function get(target, key, receiver) {
    // 对获取的值进行放射
    const res = Reflect.get(target, key, receiver);
    console.log("属性获取", key);
    if (isObject(res)) {
      // 如果获取的值是对象类型，则返回当前对象的代理对象
      return reactive(res);
    }
    return res;
  };
}
function createSetter() {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];
    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (!hadKey) {
      console.log("属性新增", key, value);
    } else if (hasChanged(value, oldValue)) {
      console.log("属性值被修改", key, value);
    }
    return result;
  };
}
export const mutableHandlers = {
  get, // 当获取属性时调用此方法
  set // 当修改属性时调用此方法
};
```

> 这里我只对最常用到的 get 和 set 方法进行处理，还应该处理 has、deleteProperty、ownKeys。这里为了快速掌握核心流程就先暂且跳过这些实现

使用 reactive 方法

```js
let { computed, ref, reactive, effect } = Vue;
const proxy = reactive({ name: "zf", age: 11, lessons: ["架构", "高级"] });
proxy.name = "jw";
proxy.lessons[0] = "Lu架构";
```

> 这里当我们获取属性和更改属性值时就可以触发对应的 set 和 get 方法

## 四.effect 实现

我们再来看 effect 的实现，默认 effect 会立即执行，当依赖的值发生变化时 effect 会重新执行

```js
// 创建effect时可以传递参数，computed也是基于effect来实现的，只是增加了一些参数条件而已
export function effect(fn, options = {}) {
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect(); // 默认effect应该立即被执行
  }
  return effect;
}
let uid = 0;
const effectStack = []; // 存放effect的队列
let activeEffect; // 当前正在执行的effect
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect); // 将当前effect放到栈中
        activeEffect = effect; // 标记当前运行的effect
        return fn(); // 执行用户定义的方法
      } finally {
        effectStack.pop(); // 执行完毕后出栈
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.options = options; // effect所有属性
  effect.id = uid++; // effect的标号
  effect.deps = []; // effect函数对应的属性
  return effect;
}
```

## 五.依赖收集实现

在 effect 方法调用时会对属性进行取值，此时可以进行依赖收集。

<div align="center"><img :src="$withBase('/images/vuesourcecode/jiagou.png')" alt="vuesourcecode/jiagou.png"></div>

```js
// 收集属性对应的effect
export function track(target, type, key) {}
// 触发属性对应effect执行
export function trigger(target, type, key) {}
```

operations.js

```js
export const TrackOpTypes = {
  GET: "get"
};
export const TriggerOpTypes = {
  SET: "set",
  ADD: "add"
};
```

> 定义收集类型和触发类型

```js
function createGetter() {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    // 取值时依赖收集
    track(target, TrackOpTypes.GET, key);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  };
}
```

```js
function createSetter() {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];
    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (!hadKey) {
      // 设置值时触发更新 - ADD
      trigger(target, TriggerOpTypes.ADD, key);
    } else if (hasChanged(value, oldValue)) {
      // 设置值时触发更新 - SET
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
    }
    return result;
  };
}
```

track 的实现

```js
export function track(target, type, key) {
  if (activeEffect == undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 如果没有map，增加map
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key); // 取对应属性的依赖表
  if (!dep) {
    // 如果没有则构建set
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
```

trigger 实现

```js
export function trigger(target, type, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const run = (effects) => {
        if (effects) {effects.forEach(effect => effect());}
    }
    // 有key 就找到对应的key的依赖执行
    if (key !== void 0) {
        run(depsMap.get(key));
    }
    // 数组新增属性
    if (type == TriggerOpTypes.ADD) {
        run(depsMap.get(isArray(target) ? 'length' : '');
    }
}
```

## 六.computed 实现原理

```js
import { isFunction } from "./util";
import { effect, track, trigger } from "./effect";
import { TriggerOpTypes, TrackOpTypes } from "./operations";
export function computed(getterOrOptions) {
  let getter;
  let setter;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  let dirty = true;
  let computed;
  let value;
  let runner = effect(getter, {
    lazy: true, // 默认不执行
    computed: true, // 计算属性
    scheduler: () => {
      if (!dirty) {
        dirty = true;
        trigger(computed, TriggerOpTypes.SET, "value");
      }
    }
  });
  computed = {
    __v_isRef: true,
    get value() {
      if (dirty) {
        value = runner(); // 取值时运行effect
        dirty = false;
      }
      track(computed, TrackOpTypes.GET, "value");
      return value;
    },
    set value(newValue) {
      setter(newValue);
    }
  };
  return computed;
}
```

> 计算属性也是一个 `effect`，标记 `effect lazy:true` 和 `computed:true`,提供 `scheduler` 方法。在依赖数据更新时会调用 `schedular` 方法  
> 计算属性需要标记`__v_isRef` 说明计算属性取值时，会自动获取 value 属性,

> 计算属性会根据 dirty 值进行缓存。

```js
export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = new Set();
  const computedRunners = new Set();
  const add = effectsToAdd => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect.options.computed) {
          computedRunners.add(effect);
        } else {
          effects.add(effect);
        }
      });
    }
  };
  if (key !== void 0) {
    add(depsMap.get(key));
  }
  if (TriggerOpTypes.ADD) {
    add(depsMap.get(isArray(target) ? "length" : ""));
  }
  const run = effect => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };
  computedRunners.forEach(run);
  effects.forEach(run);
}
```

> 当触发更新时需要分开执行计算属性和 effect，计算属性的优先级高于 effect，确保 effect 在执行时可以获得正确计算属性对应的结果

## 七.Ref 实现原理

```js
import { isObject } from "lodash";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";
import { hasChanged } from "./util";
import { TriggerOpTypes, TrackOpTypes } from "./operations";
export function ref(value) {
  return createRef(value);
}
function convert(rawValue) {
  return isObject(rawValue) ? reactive(rawValue) : rawValue;
}
function createRef(rawValue) {
  let value = convert(rawValue);
  let r = {
    __v_isRef: true,
    get value() {
      // 取值依赖收集
      track(r, TrackOpTypes.GET, "value");
      return value;
    },
    set value(newVal) {
      // 设置时触发更新
      if (hasChanged(newVal, rawValue)) {
        rawValue = newVal;
        value = newVal;
        trigger(r, TriggerOpTypes.SET, "value");
      }
    }
  };
  return r;
}
```

> ref 的原理就是将一个普通值，转化成对象，并且在获取和设置值时可以增加依赖收集和触发更新的功能
