# Watch & Computed

[[toc]]

## 一.Watch 实现原理

```js
let vm = new Vue({
  el: "#app",
  data() {
    return { name: "zf" };
  },
  watch: {
    name(newValue, oldValue) {
      console.log(newValue, oldValue);
    }
  }
});
```

> watch 用于监控用户的 data 变化，数据变化后会触发对应的 watch 的回调方法

```js
if (opts.watch) {
  initWatch(vm, opts.watch);
}
```

选项中如果有 watch 则对 watch 进行初始化

```js
function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key];
    // 如果结果值是数组循环创建watcher
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}
function createWatcher(vm, exprOrFn, handler, options) {
  // 如果是对象则提取函数 和配置
  if (isObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  // 如果是字符串就是实例上的函数
  if (typeof handler == "string") {
    handler = vm[handler];
  }
  return vm.$watch(exprOrFn, handler, options);
}
```

这里涉及了 watch 的三种写法

1. 值是对象、
2. 值是数组、
3. 值是字符串 （如果是对象可以传入一些 watch 参数），最终会调用 `vm.$watch` 来实现

扩展 Vue 原型上的方法，都通过 mixin 的方式来进行添加的。

```js
stateMixin(Vue);
export function stateMixin(Vue) {
  Vue.prototype.$watch = function(exprOrFn, cb, options = {}) {
    options.user = true; // 标记为用户watcher
    // 核心就是创建个watcher
    const watcher = new Watcher(this, exprOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
  };
}
```

```js
class Watcher {
  constructor(vm, exprOrFn, callback, options) {
    // ...
    this.user = !!options.user;
    if (typeof exprOrFn === "function") {
      this.getter = exprOrFn;
    } else {
      this.getter = function() {
        // 将表达式转换成函数
        let path = exprOrFn.split(".");
        let obj = vm;
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]];
        }
        return obj;
      };
    }
    this.value = this.get(); // 将初始值记录到value属性上
  }
  get() {
    pushTarget(this); // 把用户定义的watcher存起来
    const value = this.getter.call(this.vm); // 执行函数 （依赖收集）
    popTarget(); // 移除watcher
    return value;
  }
  run() {
    let value = this.get(); // 获取新值
    let oldValue = this.value; // 获取老值
    this.value = value;
    if (this.user) {
      // 如果是用户watcher 则调用用户传入的callback
      this.callback.call(this.vm, value, oldValue);
    }
  }
}
```

> 还是借助 vue 响应式原理，默认在取值时将 watcher 存放到对应属性的 dep 中，当数据发生变化时通知对应的 watcher 重新执行

## 二.Computed 实现原理

```js
if (opts.computed) {
  initComputed(vm, opts.computed);
}
```

```js
function initComputed(vm, computed) {
  // 存放计算属性的watcher
  const watchers = (vm._computedWatchers = {});
  for (const key in computed) {
    const userDef = computed[key];
    // 获取get方法
    const getter = typeof userDef === "function" ? userDef : userDef.get;
    // 创建计算属性watcher
    watchers[key] = new Watcher(vm, userDef, () => {}, { lazy: true });
    defineComputed(vm, key, userDef);
  }
}
```

> 每个计算属性也都是一个 `watcher`,计算属性需要表示 `lazy:true`,这样在初始化 `watcher` 时不会立即调用计算属性方法

```js
class Watcher {
  constructor(vm, exprOrFn, callback, options) {
    this.vm = vm;
    this.dirty = this.lazy;
    // ...
    this.value = this.lazy ? undefined : this.get(); // 调用get方法 会让渲染watcher执行
  }
}
```

默认计算属性需要保存一个 dirty 属性，用来实现缓存功能

```js
function defineComputed(target, key, userDef) {
  if (typeof userDef === "function") {
    sharedPropertyDefinition.get = createComputedGetter(key);
  } else {
    sharedPropertyDefinition.get = createComputedGetter(userDef.get);
    sharedPropertyDefinition.set = userDef.set;
  }
  // 使用defineProperty定义
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
```

创建缓存 getter

```js
function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        // 如果dirty为true
        watcher.evaluate(); // 计算出新值，并将dirty 更新为false
      }
      // 如果依赖的值不发生变化，则返回上次计算的结果
      return watcher.value;
    }
  };
}
```

`watcher.evaluate`

```js
evaluate() {
    this.value = this.get()
    this.dirty = false
}
```

```js
update() {
    if (this.lazy) {
        this.dirty = true;
    } else {
        queueWatcher(this);
    }
}
```

> 当依赖的属性变化时，会通知 `watcher` 调用 upd`ate 方法，此时我们将`dirty`置换为`true`。这样再取值时会重新进行计算。

```js
if (watcher) {
  if (watcher.dirty) {
    watcher.evaluate();
  }
  if (Dep.target) {
    // 计算属性在模板中使用 则存在Dep.target
    watcher.depend();
  }
  return watcher.value;
}
```

```js
depend() {
	let i = this.deps.length
	while (i--) {
		this.deps[i].depend()
	}
}
```

> 如果计算属性在模板中使用，就让计算属性中依赖的数据也记录渲染 watcher,这样依赖的属性发生变化也可以让视图进行刷新
