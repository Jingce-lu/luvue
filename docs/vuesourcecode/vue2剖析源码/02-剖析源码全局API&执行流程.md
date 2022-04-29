# 剖析源码全局 API & 执行流程

[[toc]]

## 一.剖析全局 Api

### 1.Vue.util

```js
// exposed util methods.
// NOTE: these are not considered part of the public API - avoid relying on
// them unless you are aware of the risk.
Vue.util = {
  warn,
  extend,
  mergeOptions,
  defineReactive
};
```

> 暴露的工具方法。这些方法不被视为公共 API 的一部分，除非你知道里面的风险，否则避免使用。（这个 util 是 Vue 内部的工具方法，可能会发生变动），例如：在 Vue.router 中就使用了这个工具方法

### 2.Vue.set / Vue.delete

set 方法新增响应式数据

```js
export function set(target: Array<any> | Object, key: any, val: any): any {
  // 1.是开发环境 target 没定义或者是基础类型则报错
  if (
    process.env.NODE_ENV !== "production" &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`
    );
  }
  // 2.如果是数组 Vue.set(array,1,100); 调用我们重写的splice方法 (这样可以更新视图)
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val;
  }
  // 3.如果是对象本身的属性，则直接添加即可
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val;
  }
  const ob = (target: any).__ob__;
  // 4.如果是Vue实例 或 根数据data时 报错
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== "production" &&
      warn(
        "Avoid adding reactive properties to a Vue instance or its root $data " +
          "at runtime - declare it upfront in the data option."
      );
    return val;
  }
  // 5.如果不是响应式的也不需要将其定义成响应式属性
  if (!ob) {
    target[key] = val;
    return val;
  }
  // 6.将属性定义成响应式的
  defineReactive(ob.value, key, val);
  ob.dep.notify(); // 7.通知视图更新
  return val;
}
```

```js
export function del(target: Array<any> | Object, key: any) {
  if (
    process.env.NODE_ENV !== "production" &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`
    );
  }
  // 1.如果是数组依旧调用splice方法
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return;
  }
  const ob = (target: any).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== "production" &&
      warn(
        "Avoid deleting properties on a Vue instance or its root $data " +
          "- just set it to null."
      );
    return;
  }
  // 2.如果本身就没有这个属性什么都不做
  if (!hasOwn(target, key)) {
    return;
  }
  // 3.删除这个属性
  delete target[key];
  if (!ob) {
    return;
  }
  // 4.通知更新
  ob.dep.notify();
}
```

> Vue 的缺陷：新增之前不存在的属性不会发生视图更新，修改数组索引不会发生视图更新 (解决方案就是通过\$set 方法,数组通过 splice 进行更新视图，对象则手动通知)

### 3.Vue.nextTick

```js
const callbacks = []; // 存放nextTick回调
let pending = false;
function flushCallbacks() {
  // 清空队列
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}
let timerFunc;
export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve;
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx); // 1.将回调函数存入到callbacks中
      } catch (e) {
        handleError(e, ctx, "nextTick");
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    timerFunc(); // 2.异步刷新队列
  }
  // 3.支持promise写法
  if (!cb && typeof Promise !== "undefined") {
    return new Promise(resolve => {
      _resolve = resolve;
    });
  }
}
```

> 不难看出 nextTick 原理就是将回调函数存入到一个队列中，最后异步的清空这个队列

**timerFunc**

```js
// 1.默认先使用Promise 因为mutationObserver有bug可能不工作
if (typeof Promise !== "undefined" && isNative(Promise)) {
  const p = Promise.resolve();
  timerFunc = () => {
    p.then(flushCallbacks);
    // 解决队列不刷新问题
    if (isIOS) setTimeout(noop);
  };
  isUsingMicroTask = true;
  // 2.使用MutationObserver
} else if (
  !isIE &&
  typeof MutationObserver !== "undefined" &&
  (isNative(MutationObserver) ||
    MutationObserver.toString() === "[object MutationObserverConstructor]")
) {
  let counter = 1;
  const observer = new MutationObserver(flushCallbacks);
  const textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true
  });
  timerFunc = () => {
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
  isUsingMicroTask = true;
  // 3.使用 setImmediate
} else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
  // 4.使用setTimeout
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0);
  };
}
```

> 采用 `EventLoop` 中的`微任务`和`宏任务`，先采用微任务并按照优先级优雅降级的方式实现异步刷新

### 4.Vue.observable

2.6 新增的方法，将对象进行观测，并返回观测后的对象。可以用来做全局变量，实现数据共享

```ts
Vue.observable = <T>(obj: T): T => {
  observe(obj);
  return obj;
};
```

### 5.Vue.options

存放全局的组件、指令、过滤器的一个对象,及拥有`_base`属性保存 Vue 的构造函数

```js
ASSET_TYPES.forEach(type => {
  Vue.options[type + "s"] = Object.create(null);
});
Vue.options._base = Vue;
extend(Vue.options.components, builtInComponents); // 内置了 keep-alive
```

### 6.Vue.use

`Vue.use` 主要的作用就是调用插件的 `install` 方法,并将 `Vue` 作为第一个参数传入，这样做的好处是可以避免我们编写插件时需要依赖 Vue 导致版本问题。

```js
initUse(Vue);

Vue.use = function(plugin: Function | Object) {
  const installedPlugins =
    this._installedPlugins || (this._installedPlugins = []);
  // 1.如果安装过这个插件直接跳出
  if (installedPlugins.indexOf(plugin) > -1) {
    return this;
  }
  // 2.获取参数并在参数中增加Vue的构造函数
  const args = toArray(arguments, 1);
  args.unshift(this);
  // 3.执行install方法
  if (typeof plugin.install === "function") {
    plugin.install.apply(plugin, args);
  } else if (typeof plugin === "function") {
    plugin.apply(null, args);
  }
  // 4.记录安装的插件
  installedPlugins.push(plugin);
  return this;
};
```

### 7.Vue.mixin

全局混合方法,可以用来提取公共方法及状态等.

```js
Vue.mixin = function(mixin: Object) {
  this.options = mergeOptions(this.options, mixin);
  return this;
};
```

Vue 对不同的属性做了不同的合并策略

```js
export function mergeOptions(
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (!child._base) {
    // 1.组件先将自己的extends和mixin与父属性合并
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }
  // 2.再用之前合并后的结果，与自身的属性进行合并
  const options = {};
  let key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    const strat = strats[key] || defaultStrat; // 3.采用不同的合并策略
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options;
}
```

> 你可以通过查看 `strats` 这个对象来了解不同的合并策略。

### 8.Vue.extend

Vue 中非常核心的一个方法，可以通过传入的对象获取这个对象的构造函数，后续在组件初始化过程中会用到此方法

```js
Vue.extend = function(extendOptions: Object): Function {
  // ...
  const Sub = function VueComponent(options) {
    this._init(options);
  };
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.options = mergeOptions(
    // 子组件的选项和Vue.options进行合并
    Super.options,
    extendOptions
  );
  // ...
  return Sub;
};
```

> `extend` 创建的是 `Vue` 构造器,我们可以自己实例化并且将其挂载在任意的元素上

### 9.组件、指令、过滤器

```js
initAssetRegisters(Vue);

ASSET_TYPES.forEach(type => {
  Vue[type] = function(
    id: string,
    definition: Function | Object
  ): Function | Object | void {
    if (!definition) {
      return this.options[type + "s"][id];
    } else {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && type === "component") {
        validateComponentName(id);
      }
      if (type === "component" && isPlainObject(definition)) {
        definition.name = definition.name || id;
        definition = this.options._base.extend(definition);
      }
      if (type === "directive" && typeof definition === "function") {
        definition = { bind: definition, update: definition };
      }
      this.options[type + "s"][id] = definition; // 将指令、过滤器、组件 绑定在Vue.options上

      // 备注：全局组件、指令过滤器其实就是定义在 Vue.options中，这样创建子组件时都会和Vue.options进行合并，所以子组件可以拿到全局的定义

      return definition;
    }
  };
});
```

> 初始化全局的 api，Vue.component、Vue.directive、Vue.filter，这里仅仅是格式化用户传入的内容，将其绑定在 Vue.options 选项上

## 二.剖析 Vue 的初始化过程

在上一节中我们已经查找到了 Vue 的构造函数

```js
function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options); // 当new Vue时会调用 _init方法
}

initMixin(Vue); // 初始化_init方法
stateMixin(Vue); // $set / $delete / $watch
eventsMixin(Vue); // $on $once $off $emit
lifecycleMixin(Vue); // _update
renderMixin(Vue); // _render $nextTick
```

> Vue 的源码结构非常的清晰,就是对原型进行了扩展而已。

### 1.Vue 的初始化

通过 Vue 的 `_init` 方法，我们可以看到内部又包含了很多初始化的过程

```js
export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function(options?: Object) {
    const vm: Component = this;
    // 1.每个vue的实例上都有一个唯一的属性_uid
    vm._uid = uid++;
    // 2.表示是Vue的实例
    vm._isVue = true;

    // 3.选项合并策略
    if (options && options._isComponent) {
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    vm._self = vm;
    // 4.进行初始化操作
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, "beforeCreate");
    initInjections(vm);
    initState(vm);
    initProvide(vm);
    callHook(vm, "created");

    // 5.如果有el就开始进行挂载
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
```

### 2.\_init 方法中的初始化

这个代码写的真是一目了然，我们先看看每个方法"大概"干了什么事，切记不要死追到底!

```js
initLifecycle(vm); // 初始化组件间的父子关系
initEvents(vm); // 更新组件的事件
initRender(vm); // 初始化_c方法
initInjections(vm); // 初始化inject
initState(vm); // 初始化状态
initProvide(vm); // 初始化provide
```

### 3.挂载流程

```js
// 1.如果有el就开始挂载
if (vm.$options.el) {
  vm.$mount(vm.$options.el);
}

// 2.组件的挂载
Vue.prototype.$mount = function(el, hydrating) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating);
};

// 3.创建渲染watcher进行渲染
export function mountComponent(vm, el, hydrating) {
  vm.$el = el;
  let updateComponent;
  updateComponent = () => {
    vm._update(vm._render(), hydrating);
  };
  new Watcher(
    vm,
    updateComponent,
    noop,
    {
      // 创建渲染Watcher
      before() {
        if (vm._isMounted && !vm._isDestroyed) {
          callHook(vm, "beforeUpdate");
        }
      }
    },
    true /* isRenderWatcher */
  );
  return vm;
}
```
