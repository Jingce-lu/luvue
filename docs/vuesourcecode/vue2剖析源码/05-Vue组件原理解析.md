# Vue 组件原理解析

[[toc]]

## 一.全局组件的解析

```html
<div id="app">
  <my-component></my-component>
  <my-component></my-component>
</div>
<script>
  Vue.component("my-component", {
    template: "<button>点我</button>"
  });
  let vm = new Vue({
    el: "#app"
  });
</script>
```

> 我们可以通过 `Vue.component` 注册全局组件，之后可以在模板中进行使用

```js
export function initGlobalAPI(Vue) {
  // 整合了所有的全局相关的内容
  Vue.options = {};
  initMixin(Vue);

  // _base 就是Vue的构造函数
  Vue.options._base = Vue;
  Vue.options.components = {};

  // 注册API方法
  initAssetRegisters(Vue);
}
```

### 1.Vue.component 方法

```js
export default function initAssetRegisters(Vue) {
  Vue.component = function(id, definition) {
    definition.name = definition.name || id;
    definition = this.options._base.extend(definition);
    this.options["components"][id] = definition;
  };
}
```

> `Vue.component` 内部会调用 `Vue.extend` 方法，将定义挂载到 `Vue.options.components` 上。这也说明所有的全局组件最终都会挂载到这个变量上

```js
export function initGlobalAPI(Vue) {
  // 整合了所有的全局相关的内容
  Vue.options = {};
  initMixin(Vue);
  // _base 就是Vue的构造函数
  Vue.options._base = Vue;
  Vue.options.components = {};

  // initExtend
  initExtend(Vue);

  // 注册API方法
  initAssetRegisters(Vue);
}
```

### 2.Vue.extend 方法

```js
import { mergeOptions } from "../util/index";
export default function initExtend(Vue) {
  let cid = 0;
  Vue.extend = function(extendOptions) {
    const Super = this;
    const Sub = function VueComponent(options) {
      this._init(options);
    };
    Sub.cid = cid++;
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.options = mergeOptions(Super.options, extendOptions);
    return Sub;
  };
}
```

> `extend` 方法就是创建出一个子类，继承于 `Vue`,并返回这个类

### 3.属性合并

```js
function mergeAssets(parentVal, childVal) {
  const res = Object.create(parentVal);
  if (childVal) {
    for (let key in childVal) {
      res[key] = childVal[key];
    }
  }
  return res;
}
strats.components = mergeAssets;
```

### 4.初始化合并

```js
vm.$options = mergeOptions(vm.constructor.options, options);
```

## 二.组件的渲染

```js
function makeMap(str) {
  const map = {};
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return key => map[key];
}

export const isReservedTag = makeMap(
  "a,div,img,image,text,span,input,p,button"
);
```

> 在创建虚拟节点时我们要判断当前这个标签是否是组件，普通标签的虚拟节点和组件的虚拟节点有所不同

### 1.创建组件虚拟节点

```js
export function createElement(vm, tag, data = {}, ...children) {
  let key = data.key;
  if (key) {
    delete data.key;
  }
  if (typeof tag === "string") {
    if (isReservedTag(tag)) {
      return vnode(tag, data, key, children, undefined);
    } else {
      // 如果是组件需要拿到组件的定义,通过组件的定义创造虚拟节点
      let Ctor = vm.$options.components[tag];
      return createComponent(vm, tag, data, key, children, Ctor);
    }
  }
}
function createComponent(vm, tag, data, key, children, Ctor) {
  // 获取父类构造函数t
  const baseCtor = vm.$options._base;
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }
  data.hook = {
    // 组件的生命周期钩子
    init() {}
  };
  return vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, undefined, {
    Ctor,
    children
  });
}
function vnode(tag, data, key, children, text, componentOptions) {
  return { tag, data, key, children, text, componentOptions };
}
```

### 2.创建组件的真实节点

```js
export function patch(oldVnode, vnode) {
  // 1.判断是更新还是要渲染
  if (!oldVnode) {
    return createElm(vnode);
  } else {
    // ...
  }
}
function createElm(vnode) {
  // 根据虚拟节点创建真实的节点
  let { tag, children, key, data, text } = vnode;
  // 是标签就创建标签
  if (typeof tag === "string") {
    // createElm需要返回真实节点
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el;
    }
    vnode.el = document.createElement(tag);
    updateProperties(vnode);
    children.forEach(child => {
      // 递归创建儿子节点，将儿子节点扔到父节点中
      return vnode.el.appendChild(createElm(child));
    });
  } else {
    // 虚拟dom上映射着真实dom  方便后续更新操作
    vnode.el = document.createTextNode(text);
  }
  // 如果不是标签就是文本
  return vnode.el;
}
```

```js
function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode);
  }
  if (vnode.componentInstance) {
    return true;
  }
}
```

> 调用 `init` 方法,进行组件的初始化

```js
data.hook = {
  init(vnode) {
    let child = (vnode.componentInstance = new Ctor({}));
    child.$mount(); // 组件的挂载
  }
};
```
