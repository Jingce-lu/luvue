# Vue-Router 源码深度剖析

[[toc]]

## 一.Vue-Router 基本应用

> 通过 Vue 路由的基本配置来探索`Vue-Router`

```js
import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import About from "./views/About.vue";
Vue.use(Router); // 使用Vue-Router插件
export default new Router({
  // 创建Vue-router实例，将实例注入到main.js中
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/about",
      name: "about",
      component: About,
      children: [
        {
          path: "a",
          component: {
            render(h) {
              return <h1>about A</h1>;
            }
          }
        },
        {
          path: "b",
          component: {
            render(h) {
              return <h1>about B</h1>;
            }
          }
        }
      ]
    }
  ]
});

new Vue({
  router, // 在根实例中注入router实例
  render: h => h(App)
}).$mount("#app");
```

这里我们不难发现核心方法就是 `Vue.use(Router)`,在就是 `new Router` 产生 `router` 实例

## 二.编写 Vue-Router

从这里开始我们自己来实现一个 `Vue-router` 插件，这里先来标注一下整体目录结构:

```sh
├─vue-router
│  ├─components # 存放vue-router的两个核心组件
│  │  ├─link.js
│  │  └─view.js
│  ├─history    # 存放浏览器跳转相关逻辑
│  │  ├─base.js
│  │  └─hash.js
│  ├─create-matcher.js # 创建匹配器
│  ├─create-route-map.js # 创建路由映射表
│  ├─index.js # 引用时的入口文件
│  ├─install.js # install方法
```

默认我们引用 Vue-Router 使用的是 index.js 文件,use 方法默认会调用当前返回对象的 install 方法

```js
import install from "./install";
export default class VueRouter {}
VueRouter.install = install; // 提供的install方法
```

### 2.1 编写 install 方法

```js
export let _Vue;
export default function install(Vue) {
  _Vue = Vue;
  Vue.mixin({
    // 给所有组件的生命周期都增加beforeCreate方法
    beforeCreate() {
      if (this.$options.router) {
        // 如果有router属性说明是根实例
        this._routerRoot = this; // 将根实例挂载在_routerRoot属性上
        this._router = this.$options.router; // 将当前router实例挂载在_router上

        this._router.init(this); // 初始化路由,这里的this指向的是根实例
      } else {
        // 父组件渲染后会渲染子组件
        this._routerRoot = this.$parent && this.$parent._routerRoot;
        // 保证所有子组件都拥有_routerRoot 属性，指向根实例
        // 保证所有组件都可以通过 this._routerRoot._router 拿到用户传递进来的路由实例对象
      }
    }
  });
}
```

这里我们应该在 `Vue-Router` 上增加一个 `init` 方法，主要目的就是初始化功能

这里在强调下，什么是路由？ 路由就是**匹配到对应路径显示对应的组件**！

```js
import createMatcher from "./create-matcher";
import install from "./install";
export default class VueRouter {
  constructor(options) {
    // 根据用户传递的routes创建匹配关系,this.matcher需要提供两个方法
    // match：match方法用来匹配规则
    // addRoutes：用来动态添加路由
    this.matcher = createMatcher(options.routes || []);
  }
  init(app) {}
}
VueRouter.install = install;
```

### 2.2 编写 createMatcher 方法

```js
import createRouteMap from "./create-route-map";
export default function createMatcher(routes) {
  // 收集所有的路由路径, 收集路径的对应渲染关系
  // pathList = ['/','/about','/about/a','/about/b']
  // pathMap = {'/':'/的记录','/about':'/about记录'...}
  let { pathList, pathMap } = createRouteMap(routes);

  // 这个方法就是动态加载路由的方法
  function addRoutes(routes) {
    // 将新增的路由追加到pathList和pathMap中
    createRouteMap(routes, pathList, pathMap);
  }
  function match() {} // 稍后根据路径找到对应的记录
  return {
    addRoutes,
    match
  };
}
```

这里需要创建映射关系，需要 `createRouteMap` 方法

### 2.3 编写 createRouteMap 方法

```js
export default function createRouteMap(routes, oldPathList, oldPathMap) {
  // 当第一次加载的时候没有 pathList 和 pathMap
  let pathList = oldPathList || [];
  let pathMap = oldPathMap || Object.create(null);
  routes.forEach(route => {
    // 添加到路由记录，用户配置可能是无限层级，稍后要递归调用此方法
    addRouteRecord(route, pathList, pathMap);
  });
  return {
    // 导出映射关系
    pathList,
    pathMap
  };
}
// 将当前路由存储到pathList和pathMap中
function addRouteRecord(route, pathList, pathMap, parent) {
  // 如果是子路由记录 需要增加前缀
  let path = parent ? `${parent.path}/${route.path}` : route.path;
  let record = {
    // 提取需要的信息
    path,
    component: route.component,
    parent
  };
  if (!pathMap[path]) {
    pathList.push(path);
    pathMap[path] = record;
  }
  if (route.children) {
    // 递归添加子路由
    route.children.forEach(r => {
      // 这里需要标记父亲是谁
      addRouteRecord(r, pathList, pathMap, route);
    });
  }
}
```

该方法主要是处理路径和不同路径对应的记录

### 2.4 编写浏览器历史相关代码

```js
import HashHistory from './history/hash'
constructor(options){
    this.matcher = createMatcher(options.routes || []);
    // vue路由有三种模式 hash / h5api /abstract ,为了保证调用时方法一致。我们需要提供一个base类，在分别实现子类，不同模式下通过父类调用对应子类的方法
    this.history = new HashHistory(this);
}
```

这里我们以 `hash` 路由为主,创建 `hash` 路由实例

```js
import History from "./base";
// hash路由
export default class HashHistory extends History {
  constructor(router) {
    super(router);
  }
}
// 路由的基类
export default class History {
  constructor(router) {
    this.router = router;
  }
}
```

如果是 `hash` 路由,打开网站如果没有 `hash` 默认应该添加`#/`

```js
import History from "./base";
function ensureSlash() {
  if (window.location.hash) {
    return;
  }
  window.location.hash = "/";
}
export default class HashHistory extends History {
  constructor(router) {
    super(router);
    ensureSlash(); // 确保有hash
  }
}
```

稍后我们在继续扩展路由相关代码，我们先把焦点转向初始化逻辑

```js
init(app){
        const history = this.history;
        // 初始化时，应该先拿到当前路径，进行匹配逻辑

        // 让路由系统过度到某个路径
        const setupHashListener = ()=> {
            history.setupListener(); // 监听路径变化
        }
        history.transitionTo( // 父类提供方法负责跳转
            history.getCurrentLocation(), // 子类获取对应的路径
            // 跳转成功后注册路径监听，为视图更新做准备
            setupHashListener
        )
}
```

这里我们要分别实现 `transitionTo(基类方法)`、 `getCurrentLocation` 、`setupListener`

**getCurrentLocation 实现**

```js
function getHash() {
  return window.location.hash.slice(1);
}
export default class HashHistory extends History {
  // ...
  getCurrentLocation() {
    return getHash();
  }
}
```

**setupListener 实现**

```js
export default class HashHistory extends History {
  // ...
  setupListener() {
    window.addEventListener("hashchange", () => {
      // 根据当前hash值 过度到对应路径
      this.transitionTo(getHash());
    });
  }
}
```

可以看到最核心的还是 `transitionTo` 方法

**TransitionTo 实现**

```js
export function createRoute(record, location) {
  // {path:'/',matched:[record,record]}
  let res = [];
  if (record) {
    // 如果有记录
    while (record) {
      res.unshift(record); // 就将当前记录的父亲放到前面
      record = record.parent;
    }
  }
  return {
    ...location,
    matched: res
  };
}
export default class History {
  constructor(router) {
    this.router = router;
    // 根据记录和路径返回对象,稍后会用于router-view的匹配
    this.current = createRoute(null, {
      path: "/"
    });
  }
  // 核心逻辑
  transitionTo(location, onComplete) {
    // 去匹配路径
    let route = this.router.match(location);
    // 相同路径不必过渡
    if (
      location === route.path &&
      route.matched.length === this.current.matched.length
    ) {
      return;
    }
    this.updateRoute(route); // 更新路由即可
    onComplete && onComplete();
  }
  updateRoute(route) {
    // 跟新current属性
    this.current = route;
  }
}
```

```js
export default class VueRouter {
  // ...
  match(location) {
    return this.matcher.match(location);
  }
}
```

终于这回可以完善一下刚才没有写完的 `match` 方法

```js
function match(location) {
  // 稍后根据路径找到对应的记录
  let record = pathMap[location];
  if (record) {
    // 根据记录创建对应的路由
    return createRoute(record, {
      path: location
    });
  }
  // 找不到则返回空匹配
  return createRoute(null, {
    path: location
  });
}
```

我们不难发现路径变化时都会更改 `current` 属性，我们可以把 `current` 属性变成响应式的，每次 `current` 变化刷新视图即可

```js
export let _Vue;
export default function install(Vue) {
  _Vue = Vue;
  Vue.mixin({
    // 给所有组件的生命周期都增加beforeCreate方法
    beforeCreate() {
      if (this.$options.router) {
        // 如果有router属性说明是根实例
        // ...
        Vue.util.defineReactive(this, "_route", this._router.history.current);
      }
      // ...
    }
  });
  // 仅仅是为了更加方便
  Object.defineProperty(Vue.prototype, "$route", {
    // 每个实例都可以获取到$route属性
    get() {
      return this._routerRoot._route;
    }
  });
  Object.defineProperty(Vue.prototype, "$router", {
    // 每个实例都可以获取router实例
    get() {
      return this._routerRoot._router;
    }
  });
}
```

`Vue.util.defineReactive` 这个方法是 vue 中响应式数据变化的核心

当路径变化时需要执行此回调更新 `_route` 属性， 在 `init` 方法中增加监听函数

```js
history.listen(route => {
  // 需要更新_route属性
  app._route = route;
});
```

```js
export default class History {
  constructor(router) {
    // ...
    this.cb = null;
  }
  listen(cb) {
    this.cb = cb; // 注册函数
  }
  updateRoute(route) {
    this.current = route;
    this.cb && this.cb(route); // 更新current后 更新_route属性
  }
}
```

## 三.编写 Router-Link 及 Router-View 组件

### 3.1 router-view 组件

```js
export default {
  functional: true,
  render(h, { parent, data }) {
    let route = parent.$route;
    let depth = 0;
    data.routerView = true;
    while (parent) {
      // 根据matched 渲染对应的router-view
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++;
      }
      parent = parent.$parent;
    }
    let record = route.matched[depth];
    if (!record) {
      return h();
    }
    return h(record.component, data);
  }
};
```

### 3.2 router-link 组件

```js
export default {
  props: {
    to: {
      type: String,
      required: true
    },
    tag: {
      type: String
    }
  },
  render(h) {
    let tag = this.tag || "a";
    let handler = () => {
      this.$router.push(this.to);
    };
    return <tag onClick={handler}>{this.$slots.default}</tag>;
  }
};
```

## 四.beforeEach 实现

```js
this.beforeHooks = [];
beforeEach(fn){ // 将fn注册到队列中
    this.beforeHooks.push(fn);
}
```

将用户函数注册到数组中

```js
function runQueue(queue, iterator, cb) {
  // 迭代queue
  function step(index) {
    if (index >= queue.length) {
      cb();
    } else {
      let hook = queue[index];
      iterator(hook, () => {
        // 将本次迭代到的hook 传递给iterator函数中,将下次的权限也一并传入
        step(index + 1);
      });
    }
  }
  step(0);
}
export default class History {
  transitionTo(location, onComplete) {
    // 跳转到这个路径
    let route = this.router.match(location);
    if (
      location === this.current.path &&
      route.matched.length === this.current.matched.length
    ) {
      return;
    }
    let queue = [].concat(this.router.beforeHooks);
    const iterator = (hook, next) => {
      hook(route, this.current, () => {
        // 分别对应用户 from，to，next参数
        next();
      });
    };
    runQueue(queue, iterator, () => {
      // 依次执行队列 ,执行完毕后更新路由
      this.updateRoute(route);
      onComplete && onComplete();
    });
  }
  updateRoute(route) {
    this.current = route;
    this.cb && this.cb(route);
  }
  listen(cb) {
    this.cb = cb;
  }
}
```
