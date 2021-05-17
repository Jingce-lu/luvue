# 进阶 Vue 篇（一）

[[toc]]

## 一.什么是库？什么是框架?

- 库是将代码集合成一个产品,库是我们调用库中的方法实现自己的功能。
- 框架则是为解决一类问题而开发的产品,框架是我们在指定的位置编写好代码，框架帮我们调用。

## 二.MVC 和 MVVM 区别

- 传统的 MVC 指的是,用户操作会请求服务端路由，路由会调用对应的控制器来处理,控制器会获取数 据。将结果返回给前端,页面重新渲染
- MVVM :传统的前端会将数据手动渲染到页面上, MVVM 模式不需要用户收到操作 dom 元素,将数据绑 定到 viewModel 层上，会自动将数据渲染到页面中，视图变化会通知 viewModel 层 更新数据。 ViewModel 就是我们 MVVM 模式中的桥梁.

> Vue 并没有完全遵循 MVVM 模型，严格的 MVVM 模式中,View 层不能直接和 Model 层通信,只能通过 ViewModel 来进行通信。

## 三.Vue 的基本使用

### Vue 中的模板

```html
<script src="node_modules/vue/dist/vue.js"></script>
<!-- 3.外部模板 -->
<div id="app">{{name}}</div>
<script>
  const vm = new Vue({
    el: "#app",
    data: {
      name: "jw",
      age: 22
    },
    // 2.内部模板
    template: "<div>{{age}}</div>",
    // 1.render函数
    render(h) {
      return h("h1", ["hello,", this.name, this.age]);
    }
  });
</script>
```

> 我们默认使用的是 `runtime-with-compiler` 版本的 vue,带 `compiler` 的版本才能使用 `template` 属性，内部会将 `template` 编译成 `render` 函数

- 渲染流程，会先查找用户传入的 render
- 如果没有传入 `render` 则查找 template 属性
- 如果没有传入 `template` 则查找 el 属性，如果有 el，则采用 el 的模板

### 模板语法

> 可以在 vue 中使用表达式语法，表达式会在所属 Vue 实例的数据作用域下作为 JavaScript 被解析。

```html
<div id="app">
  <!-- 可以放入运算的结果 -->
  {{ 1+ 1 }}
  <!-- 当前这个表达式 最后会被编译成函数 _v(msg === 'hello'? true:false) -->
  {{msg === 'hello'? true:false}}
  <!-- 取值操作，函数返回结果 -->
  {{obj.a}} {{fn()}}
</div>
```

### 响应式原则

- Vue 内部会递归的去循环 vue 中的 data 属性,会给每个属性都增加 getter 和 setter，当属性值变化时会更新视图。
- 重写了数组中的方法，当调用数组方法时会触发更新,也会对数组中的数据(对象类型)进行了监控

**通过以上两点可以发现 Vue 中的缺陷**:

- 对象默认只监控自带的属性，新增的属性响应式不生效 (层级过深，性能差)
- 数组通过索引进行修改 或者 修改数组的长度，响应式不生效

Vue 额外提供的 API:

```js
vm.$set(vm.arr, 0, 100); // 修改数组内部使用的是splice方法
vm.$set(vm.address, "number", "6-301"); // 新增属性通过内部会将属性定义成响应式数据
vm.$delete(vm.arr, 0); // 删除索引，属性
```

为了解决以上问题,Vue3.0 使用 Proxy 来解决

```js
let obj = {
  name: { name: "jw" },
  arr: ["吃", "喝", "玩"]
};
let handler = {
  get(target, key) {
    if (typeof target[key] === "object" && target[key] !== null) {
      return new Proxy(target[key], handler);
    }
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    let oldValue = target[key];
    if (!oldValue) {
      console.log("新增属性");
    } else if (oldValue !== value) {
      console.log("修改属性");
    }
    return Reflect.set(target, key, value);
  }
};
let proxy = new Proxy(obj, handler);
```

> 代理 get、set 方法,可以实现懒代理。并且兼容数组索引和长度变化

### 实例方法

- `vm._uid` (每个实例的唯一标识)
- `vm.$data === vm._data` (实例的数据源)
- `vm.$options` (用户传入的属性)
- `vm.$el` (当前组件的真实 dom)
- `vm.$nextTick` (等待同步代码执行完毕)
- `vm.$mount` (手动挂载实例)
- `vm.$watch` (监控数据变化)

## 四.指令的使用

vue 中的指令,vue 中都是以 `v-`开头 (一般用来操作 `dom`)

### 常见指令

- v-once 渲染一次 (可用作优化，但是使用频率极少)
- v-html 将字符串转化成 dom 插入到标签中 (会导致 xss 攻击问题,并且覆盖子元素)
- v-if/v-else/v-else-if 不满足时 dom 不存在(可以使用 template 标签)
- v-show 不满足时 dom 隐藏 (不能使用 template 标签)
- v-for 循环字符串、对象、数字、数组 (循环时必须加 key，尽量不采用索引)
- v-bind 可以简写成: 属性(style、class...)绑定
- v-on 可以简写成@ 给元素绑定事件 (常用修饰符 .stop、.prevent、.self、.once、.passive)
- v-model 双向绑定 (支持.trim、.number 修饰符)

### v-show 和 v-if 区别

- v-if 如果条件不成立不会渲染当前指令所在节点的 dom 元素
- v-show 只是切换当前 dom 的显示或者隐藏

```js
const VueTemplateCompiler = require("vue-template-compiler");
let r1 = VueTemplateCompiler.compile(`
    <div v-if="true"><span v-for="i in 3">hello</span></div>`);
/** with(this) {
 *   return (true) ? _c('div', _l((3), function (i) { return _c('span', [_v("hello")]) }), 0) : _e()
 * }
 **/
```

### v-for 和 v-if 连用问题

v-for 会比 v-if 的优先级高一些,如果连用的话会把 v-if 给每个元素都添加一下,会造成性能问题 (使用计算属性优化)

```js
const VueTemplateCompiler = require("vue-template-compiler");
let r1 = VueTemplateCompiler.compile(
  `<div v-if="false" v-for="i in 3">hello</div>`
);
/** with(this) {
 *    return _l((3), function (i) { return (false) ? _c('div', [_v("hello")]) : _e() })
 *  }
 **/
```

### v-model 原理

内部会根据标签的不同解析出，不同的语法

- 例如 文本框会被解析成 value + input 事件
- 例如 复选框会被解析成 checked + change 事件

## 五.自定义指令

可以自定义 Vue 中的指令来实现功能的封装 (全局指令、局部指令)

### 钩子函数

指令定义对象可以提供如下几个钩子函数:

- `bind`：只调用一次，指令第一次绑定到元素时调用
- `inserted`：被绑定元素插入父节点时调用
- `update`：所在组件的 VNode 更新时调用,组件更新前状态
- `componentUpdated`：所在组件的 VNode 更新时调用,组件更新后的状态
- `unbind`：只调用一次，指令与元素解绑时调用。

```js
// 1.el 指令所绑定的元素，可以用来直接操作 DOM
// 2.bindings 绑定的属性
// 3.Vue编译生成的虚拟节点  (context)当前指令所在的上下文
bind(el,bindings,vnode,oldVnode){ // 无法拿到父元素 父元素为null
    console.log(el.parentNode,oldVnode)
},
inserted(el){ // 父元素已经存在
    console.log(el.parentNode)
},
update(el){ // 组件更新前
    console.log(el.innerHTML)
},
componentUpdated(el){ // 组件更新后
    console.log(el.innerHTML)
},
unbind(el){ // 可用于解除事件绑定
    console.log(el)
}
```

### 1.clickOutSide

```html
<div v-click-outside="hide">
  <input type="text" @focus="show" />
  <div v-if="isShow">显示面板</div>
</div>
```

```js
Vue.directive(clickOutside, {
  bind(el, bindings, vnode) {
    el.handler = function(e) {
      if (!el.contains(e.target)) {
        let method = bindings.expression;
        vnode.context[method]();
      }
    };
    document.addEventListener("click", el.handler);
  },
  unbind(el) {
    document.removeEventListener("click", el.handler);
  }
});
```

### v-lazy

> server.js

```js
const express = require("express");
const app = express();
app.use(express.static(__dirname + "\\images"));
app.listen(3000);
const arr = [];
for (let i = 10; i <= 20; i++) {
  arr.push(`${i}.jpeg`);
}
app.get("/api/img", (req, res) => {
  res.json(arr);
});
```

插件使用

```html
<script src="node_modules/vue/dist/vue.js"></script>
<script src="node_modules/axios/dist/axios.js"></script>
<script src="./vue-lazyload.js"></script>
<div id="app">
  <div class="box">
    <li v-for="img in imgs" :key="img">
      <img v-lazy="img" />
    </li>
  </div>
</div>
<script>
  const loading = "http://localhost:3000/images/1.gif";
  Vue.use(VueLazyload, {
    preLoad: 1.3, // 可见区域的1.3倍
    loading // loading图
  });
  const vm = new Vue({
    el: "#app",
    data() {
      return {
        imgs: []
      };
    },
    created() {
      axios.get("http://localhost:3000/api/img").then(({ data }) => {
        this.imgs = data;
      });
    }
  });
</script>
<style>
  .box {
    height: 300px;
    overflow: scroll;
    width: 200px;
  }
  img {
    width: 100px;
    height: 100px;
  }
</style>
```

- **定义插件**

```js
const Lazy = Vue => {
  return class LazyClass {
    constructor(options) {
      this.options = options;
    }
    add(el, bindings, vnode) {}
  };
};
const VueLazyload = {
  install(Vue) {
    const LazyClass = Lazy(Vue);
    const lazy = new LazyClass(options);
    Vue.directive("lazy", {
      bind: lazy.add.bind(lazy)
    });
  }
};
```

- **获取滚动元素**

```js
const scrollParent = el => {
  let parent = el.parentNode;
  while (parent) {
    if (/scroll/.test(getComputedStyle(parent)["overflow"])) {
      return parent;
    }
    parent = parent.parentNode;
  }
  return parent;
};
const Lazy = Vue => {
  return class LazyClass {
    constructor(options) {
      this.options = options;
    }
    add(el, bindings, vnode) {
      Vue.nextTick(() => {
        // 获取滚动元素
        let parent = scrollParent(el);
        // 获取链接
        let src = bindings.value;
      });
    }
  };
};
```

- **触发事件**

```js
const Lazy = Vue => {
  class ReactiveListener {
    constructor({ el, src, elRenderer, options }) {
      this.el = el;
      this.src = src;
      this.elRenderer = elRenderer;
      this.options = options;
      // 定义状态
      this.state = { loading: false };
    }
  }
  return class LazyClass {
    constructor(options) {
      this.options = options;
      this.listenerQueue = [];
      this.bindHandler = false;
    }
    lazyLoadHandler() {
      console.log("绑定");
    }
    add(el, bindings, vnode) {
      Vue.nextTick(() => {
        // 获取滚动元素
        let parent = scrollParent(el);
        // 获取链接
        let src = bindings.value;

        // 绑定事件
        if (!this.bindHandler) {
          this.bindHandler = true;
          parent.addEventListener("scroll", this.lazyLoadHandler.bind(this));
        }
        // 给每个元素创建个实例，放到数组中
        const listener = new ReactiveListener({
          el, // 当前元素
          src, // 真实路径
          elRenderer: this.elRenderer.bind(this), // 传入渲染器
          options: this.options
        });
        this.listenerQueue.push(listener);
        // 检测需要默认加载哪些数据
        this.lazyLoadHandler();
      });
    }
    elRenderer(listener, state) {
      let el = listener.el;
      let src = "";
      switch (state) {
        case "loading":
          src = listener.options.loading || "";
          break;
        case "error":
          src = listener.options.error || "";
        default:
          src = listener.src;
          break;
      }
      el.setAttribute("src", src);
    }
  };
};
```

- **加载图片**

```js
const loadImageAsync = (src, resolve, reject) => {
  let image = new Image();
  image.src = src;
  image.onload = resolve;
  image.onerror = reject;
};
class ReactiveListener {
  constructor({ el, src, elRenderer, options }) {
    this.el = el;
    this.src = src;
    this.elRenderer = elRenderer;
    this.options = options;
    // 定义状态
    this.state = { loading: false };
  }
  checkInView() {
    let { top } = this.el.getBoundingClientRect();
    return top < window.innerHeight * this.options.preLoad;
  }
  load() {
    this.elRenderer(this, "loading");
    loadImageAsync(
      this.src,
      () => {
        this.state.loading = true; // 加载完毕了
        this.elRenderer(this, "loaded");
      },
      () => {
        this.elRenderer(this, "error");
      }
    );
  }
}
```

- **增加滚动节流**

```js
const throttle = (cb, delay) => {
  let prev = Date.now();
  return () => {
    let now = Date.now();
    if (now - prev >= delay) {
      cb();
      prev = Date.now();
    }
  };
};
this.lazyHandler = throttle(this.lazyLoadHandler.bind(this), 500);
parent.addEventListener("scroll", this.lazyHandler.bind(this));
```
