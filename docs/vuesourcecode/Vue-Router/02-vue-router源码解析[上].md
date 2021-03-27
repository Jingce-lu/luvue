# vue-router 源码解析 | 1.4w 字 | 多图预警 - 【上】

[[toc]]

- 项目地址 [https://github.com/BryanAdamss/vue-router-for-analysis](https://github.com/BryanAdamss/vue-router-for-analysis)
- uml 图源文件 [https://github.com/BryanAdamss/vue-router-for-analysis/blob/dev/vue-router.EAP](https://github.com/BryanAdamss/vue-router-for-analysis/blob/dev/vue-router.EAP)

## 设计思路

- 服务端路由根据 `url` 分配对应处理程序，返回页面、接口返回
- 前端路由是通过 `js` 根据 `url` 返回对对应组件

要实现路由，需要-路由映射表；

- 服务端做路由页面跳转时，映射表的反映的是 `url` 和`页面`的关系
- 现在前端基本走模块化了，所以前端的路由映射表反映的是 `url` 和`组件`的关系

就像下面的伪代码一样

```js
// 使用es6 map
const routeMap = new Map([
  ['/', 首页组件],
  ['/bar', Bar组件],
  ['/bar/foo', Foo组件],
]);

// 你也可以用对象字面量
const routeMap = {
  '/': 首页组件,
  '/bar': Bar组件,
  '/bar/foo': Foo组件,
};
```

- 有了映射表，我们就知道 `url` 和`组件`的映射关系；
- 但是，映射表维护的只是一个关系，并不能帮我们完成，访问`/bar`，返回 `Bar 组件`这样一个流程，所以我们还需要一个匹配器，来帮我们完成从 `url` 到`组件`的匹配工作；
- 是不是有了 `路由映射表` 和 `匹配器` 就可以实现前端路由了呢？
- 我们的 `spa` 是运行在浏览器环境中的，浏览器是有`前进、返回`功能的，需要我们记录访问过的 `url`；
  - 我们知道，要实现这种类似`撤销、恢复`的功能，肯定需要使用到一种数据结构-`栈(stack)`；每访问一个`url`，将`url`，`push`到栈中，返回时，执行 `pop` 即可拿到上一次访问的 `url`
  - 好在浏览器平台，已经给我们提供了这样的栈，无需我们自己实现，我们只需要去调用它的接口 `window.history` 实现功能即可

**总结** 要实现一个前端路由，需要三个部分

1. 路由映射表
   - 一个能表达 `url` 和 `组件` 关系的映射表，可以使用 `Map`、`对象字面量`来实现
2. 匹配器
   - 负责在访问 `url` 时，进行匹配，找出对应的 `组件`
3. 历史记录栈
   - 浏览器平台，已经原生支持，无需实现，直接调用接口

## 术语

在分析 `vue-router` 源码前，我们先了解下 `vue-router` 中常出现的一些概念术语，如果理解起来吃力，可以先跳过，后面遇到，再回来看；

### 路由规则、配置对象(RouteConfig)

- 路由的配置项，用来描述路由
- 下图红框里面标出来的都是路由配置对象
- route-config.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router01.awebp')" alt="vuesourcecode/vue-router/vue-router01.awebp">
- 因为 `vue-router` 是支持`嵌套路由`的，所以配置对象也是可以相互嵌套的
- 完整的形状如下

  ```ts
  interface RouteConfig = {
    path: string,
    component?: Component,// 路由组件
    name?: string, // 命名路由
    components?: { [name: string]: Component }, // 命名视图组件
    redirect?: string | Location | Function,
    props?: boolean | Object | Function,
    alias?: string | Array<string>,
    children?: Array<RouteConfig>, // 嵌套路由
    beforeEnter?: (to: Route, from: Route, next: Function) => void,
    meta?: any,

    // 2.6.0+
    caseSensitive?: boolean, // 匹配规则是否大小写敏感？(默认值：false)
    pathToRegexpOptions?: Object // 编译正则的选项
  }
  ```

### 路由记录(RouteRecord)

每一条路由规则都会生成一条路由记录；嵌套、别名路由也都会生成一条路由记录；是路由映射表的组成部分

```ts
const record: RouteRecord = {
  path: normalizedPath,
  regex: compileRouteRegex(normalizedPath, pathToRegexpOptions), // 利用path-to-regexp包生成用来匹配path的增强正则对象，可以用来匹配动态路由
  components: route.components || { default: route.component }, // 保存路由组件，支持命名视图https://router.vuejs.org/zh/guide/essentials/named-views.html#命名视图
  instances: {}, // 保存每个命名router-view需要渲染的路由组件
  name,
  parent,
  matchAs,
  redirect: route.redirect, // 重定向的路由配置对象
  beforeEnter: route.beforeEnter, // 路由独享的守卫
  meta: route.meta || {}, // 元信息
  // 动态路由传参；https://router.vuejs.org/zh/guide/essentials/passing-props.html#路由组件传参
  props:
    route.props == null
      ? {}
      : route.components // 命名视图的传参规则需要使用route.props指定的规则
      ? route.props
      : { default: route.props },
};
```

### 路由对象(Route)

- `Route` 表示当前激活的路由的状态信息，包含了当前 `URL` 解析得到的信息，还有 `URL` 匹配到的路由记录们 (`route records`)。
- `https://router.vuejs.org/zh/api/#路由对象`
- 注意，这说明一个 `Route` 可以关联多个 `RouteRecord`
- 通过 `this.$route` 访问到的就是 `Route` 对象
- route.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router02.awebp')" alt="vuesourcecode/vue-router/vue-router02.awebp">
- 路由对象是不可变 (`immutable`) 的，每次成功的导航后都会产生一个新的对象

### 位置(Location)

- 它并不是 `window.location` 的引用，`vue-router` 在内部定义了一个 `Location`，是一个用来描述目标位置的对象；
- `$router.push/replace`、`router-link`的 `to` 接收的就是 `Location` 对象
  - `https://router.vuejs.org/zh/api/#to`
- `vue-router` 内部可以将一个`url string` 转换成 `Location` 对象，所以确切的说`$router.push/replace`、`router-link` 的 `to` 接收的都是一个 `RawLocation` 对象
- `RawLocation` 对象是 `String` 和 `Location` 的联合类型

```ts
export type RawLocation = string | Location;

export interface Location {
  name?: string;
  path?: string;
  hash?: string;
  query?: Dictionary<string | (string | null)[] | null | undefined>;
  params?: Dictionary<string>;
  append?: boolean;
  replace?: boolean;
}
```

### 路由组件(RouteComponent)

- 当路由成功匹配时，就需要在 `router-view` 渲染一个组件，这个需要被渲染的组件就是`路由组件`
- `RouteConfig` 中 `component`、`components` 中定义的 `vue 组件`就是路由组件
- 路由组件的特殊性
  - 拥有**只在路由组件中生效**的守卫(`beforeRouteEnter` 、`beforeRouteUpdate`、`beforeRouteLeave`)
  - 你是否跟我一样，曾经在组件中调用 `beforeRouteEnter` 发现没有生效，那是因为这个守卫只能在`路由组件`中被调用，在所有非路由组件中都不会被调用，包括路由组件的后代组件；你如果想在路由组件中实现 `beforeRouteEnter` 类似守卫监听效果，可以通过 `watch $route` 来手动判断
- 红框标记出来的是`路由组件`
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router03.awebp')" alt="vuesourcecode/vue-router/vue-router03.awebp">

## 环境

- vue-router 版本:v3.1.6
- node 版本:v8.17.0
- 分析仓库地址:`https://github.com/BryanAdamss/vue-router-for-analysis`

## 目录结构

<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router04.awebp')" alt="vuesourcecode/vue-router/vue-router04.awebp">

- examples
  - 这里面存放了官方精心准备的案例
  - 不仅告诉你 vue-router 有哪些基础特性，还会告诉你怎么应对一些复杂场景，例如权限控制、动态添加路由等；总之，值得你去一探究竟；
  - examples.png
    <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router05.awebp')" alt="vuesourcecode/vue-router/vue-router05.awebp">
  - 在源码你想调试处添加 debugger 断点标识，然后启动例子 npm run dev，打开 localhost:8080 即可
- src 目录
  - <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router06.awebp')" alt="vuesourcecode/vue-router/vue-router06.awebp">
  - `components` 目录是存放内置组件 `router-link`、`router-view` 的
  - `history` 是存放核心 `history` 类的地方
  - `util` 中存放的是一些辅助函数
  - `index.js` 是 `vue-router` 的入口文件，也是 `vue-router` 类定义的地方
  - `install.js` 是安装逻辑所在文件
- `flow/declarations.js`
  - 它是 vue-router 的 flow 类型声明文件，通过它我们能知道 vue-router 中几个核心类(对象)是长什么样的
  - 它里面，大概长这样
    <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router07.awebp')" alt="vuesourcecode/vue-router/vue-router07.awebp">

## 基础例子

- 我们从最基础的例子开始看

  ```js
  import Vue from 'vue';
  import VueRouter from 'vue-router';
  // 1. Use plugin.
  // 安装插件
  Vue.use(VueRouter);

  // 2. Define route components
  // 定义路由组件
  const Home = { template: '<div>home</div>' };
  const Foo = { template: '<div>foo</div>' };
  const Bar = { template: '<div>bar</div>' };

  // 3. Create the router
  // 实例化vue-router
  const router = new VueRouter({
    mode: 'history',
    routes: [
      { path: '/', component: Home },
      { path: '/foo', component: Foo },
      { path: '/bar', component: Bar },
    ],
  });

  // 4. Create and mount root instance.
  new Vue({
    router, // 注入router实例
    template: `
      <div id="app">
        <h1>Basic</h1>
        
        <ul>
          <li><router-link to="/">/</router-link></li>
          <li><router-link to="/foo">/foo</router-link></li>
          <li><router-link to="/bar">/bar</router-link></li>
        </ul>
        
        <router-view class="view"></router-view>
      </div>
    `,
  }).$mount('#app');
  ```

- 可以看到，首先使用 `vue` 的插件语法安装了 `vue-router`； 然后我们再实例化 `VueRouter`； 最后我们将 `VueRouter` 的实例注入到 `Vue`
- 涉及到三个核心流程：`安装`、`实例化`、`初始化`

## 安装流程

- 只要是 `vue plugin`，肯定都会有一个 `install` 方法
  - [cn.vuejs.org/v2/guide/pl…](https%3A%2F%2Fcn.vuejs.org%2Fv2%2Fguide%2Fplugins.html%23%25E5%25BC%2580%25E5%258F%2591%25E6%258F%2592%25E4%25BB%25B6)
- `vue-router` 的入口文件在 `src/index.js` 中

```js
// src/index.js

/* @flow */
import { install } from './install' // 导入安装方法
...

// VueRouter类
export default class VueRouter {
  ... 
}

...

VueRouter.install = install // 挂载安装方法，Vue.use时，自动调用install方法
VueRouter.version = '__VERSION__'

// 浏览器环境，自动安装VueRouter
if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter)
}
```

- 可以看到，开头导入了 `install` 方法，并将其做为静态方法直接挂载到 `VueRouter` 上，这样，在 `Vue.use(VueRouter)`时，`install` 方法就会被调用；
- 可以看到，如果在浏览器环境，并且通过 `script 标签`的形式引入 `Vue` 时(会在 `window` 上挂载 `Vue` 全局变量)，会尝试自动使用 `VueRouter`

### install.js

```js
// src/index.js

/* @flow */
import { install } from './install' // 导入安装方法
...

// VueRouter类
export default class VueRouter {
  ... 
}

...

VueRouter.install = install // 挂载安装方法，Vue.use时，自动调用install方法
VueRouter.version = '__VERSION__'

// 浏览器环境，自动安装VueRouter
if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter)
}
```

可以看到，install 方法干了下面几件事

1. 避免重复安装
   - 通过添加 `installed` 标识来判断是否重复安装
2. 保留 Vue 引用，避免将 Vue 做为依赖打包
   - `install` 方法被调用时，会将 Vue 做为参数传入，Vue 会被赋值给事先定义好的 `_Vue` 变量
   - 在其它模块中，可以导入这个 `_Vue`，这样既能访问到 Vue，又避免了将 Vue 做为依赖打包
   - 这是一个插件开发实用小技巧
3. 注册了一个全局混入

   - 这个混入将影响注册之后所有创建的每个 Vue 实例，也就是后面每个 Vue 实例都会执行混入中的代码
   - 我们看下混入中的代码

     ```js
     // 注册全局混入
     Vue.mixin({
       beforeCreate() {
         // this === new Vue({router:router}) === Vue根实例

         // 判断是否使用了vue-router插件
         if (isDef(this.$options.router)) {
           // 在Vue根实例上保存一些信息
           this._routerRoot = this; // 保存挂载VueRouter的Vue实例，此处为根实例
           this._router = this.$options.router; // 保存VueRouter实例，this.$options.router仅存在于Vue根实例上，其它Vue组件不包含此属性，所以下面的初始化，只会执行一次 // beforeCreate hook被触发时，调用
           this._router.init(this); // 初始化VueRouter实例，并传入Vue根实例 // 响应式定义_route属性，保证_route发生变化时，组件(router-view)会重新渲染
           Vue.util.defineReactive(
             this,
             '_route',
             this._router.history.current
           );
         } else {
           // 回溯查找_routerRoot
           this._routerRoot =
             (this.$parent && this.$parent._routerRoot) || this;
         } // 为router-view组件关联路由组件

         registerInstance(this, this);
       },
       destroyed() {
         // destroyed hook触发时，取消router-view和路由组件的关联
         registerInstance(this);
       },
     });
     ```

   - 它注册了两个生命周期钩子 `beforeCreate` 和 `destroyed`；
   - 注意
     - 在这两个钩子中，`this` 是指向当时正在调用钩子的 vue 实例；
     - **这两个钩子中的逻辑，在安装流程中是不会被执行的，只有在组件实例化时执行到钩子时才会被调用**
   - 我们先看 `beforeCreate` 钩子
   - 它先判断了 `this.$options.router`是否存在，我们在`new Vue({router})`时，router 已经被保存到到`Vue根实例`的`$options` 上，而其它 `Vue` 实例的 `$options` 上是没有 `router` 的
     - 所以 `if` 中的语句只在 `this === new Vue({router})`时，才会被执行，由于 `Vue 根实例`只有一个，所以这个逻辑只会被执行一次
     - 我们可以在 if 中打印 this 并结合调试工具看看
       - <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router08.awebp')" alt="vuesourcecode/vue-router/vue-router08.awebp">
     - 的确，if 中的逻辑只执行了一次，并且 this 就是指向 Vue 根实例
   - 我们看下 if 中具体干了什么
     - 在根实例上保存了`_routerRoot`，用来标识`router`挂载的`Vue实例`
     - 在根实例上保存了`VueRouter`实例(`router`)
     - 对 router 进行了初始化(`init`)
     - 在根实例上，响应式定义了`_route`属性
       - 保证`_route`变化时，`router-view`会重新渲染，这个我们后面在`router-view`组件中会细讲
   - 我们再看下 else 中具体干了啥
     - 主要是为每个组件定义`_routerRoot`，采用的是逐层向上的回溯查找方式
   - 我们看到还有个`registerInstance`方法，它在`beforeCreate`、`destroyed`都有被调用，只是参数个数不一样
     - 在`beforeCreate`中传入了两个参数，且都是`this`即当前`vue实例`，而在`destroyed`中只传入了一个`vue实例`
     - 我们在讲 router-view 时会细讲，你只需要知道它是用来为 router-view 组件关联或解绑路由组件用的即可
     - 传入两个参数即关联，传入一个参数即解绑

4. 添加实例属性、方法  
   在`Vue`原型上注入`$router`、`$route`属性，方便在`vue实例`中通过`this.$router`、`this.$route`快捷访问
5. 注册`router-view`、`router-link`全局组件  
   通过`Vue.component`语法注册了`router-view`和`router-link`两个全局组件
6. 设置路由组件守卫的合并策略  
   设置路由组件的`beforeRouteEnter`、`beforeRouteLeave`、`beforeRouteUpdate`守卫的合并策略

总结

<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router09.awebp')" alt="vuesourcecode/vue-router/vue-router09.awebp">

## 实例化流程

- 看完安装流程，我们紧接着来看下 `VueRouter` 的实例化过程
- 这一节，重点关注实例化过程，所以我们只看 `constructor` 中的核心逻辑

### VueRouter 的构造函数

我们打开`src/index.js`看下`VueRouter`构造函数

```ts
// src/index.js

export default class VueRouter {
  constructor(options: RouterOptions = {}) {
    this.app = null; // 保存挂载实例
    this.apps = []; // VueRouter支持多实例
    this.options = options;
    this.beforeHooks = []; // 接收 beforeEach hook
    this.resolveHooks = []; // 接收 beforeResolve hook
    this.afterHooks = []; // 接收 afterEach hook
    this.matcher = createMatcher(options.routes || [], this); // 创建路由matcher对象，传入routes路由配置列表及VueRouter实例
    let mode = options.mode || 'hash';
    this.fallback =
      mode === 'history' && !supportsPushState && options.fallback !== false; // 是否回退
    if (this.fallback) {
      mode = 'hash';
    } // 非浏览器环境，强制使用abstract模式

    if (!inBrowser) {
      mode = 'abstract';
    }
    this.mode = mode; // 根据不同mode，实例化不同history实例

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base);
        break;
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback);
        break;
      case 'abstract':
        this.history = new AbstractHistory(this, options.base);
        break;
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`);
        }
    }
  }
}
```

构造函数主要干了下面几件事

1. **接收 RouterOptions**

   - 可以看到，构造函数接收一个 `options 选项对象`，它的类型是 `RouterOptions`，我们来看下 `RouterOptions`
   - 打开 `flow/declarations.js`

     ```js
     // flow/declarations.js

     declare type RouterOptions = {
       routes?: Array<RouteConfig>, // 路由配置规则列表
       mode?: string, // 路由模式
       fallback?: boolean, // 是否启用回退
       base?: string, // base地址
       linkActiveClass?: string, // router-link激活时类名
       linkExactActiveClass?: string, // router-link精准激活时类名
       parseQuery?: (query: string) => Object, // 自定义解析qs的方法
       stringifyQuery?: (query: Object) => string, // 自定义序列化qs的方法
       scrollBehavior?: (
         // 控制滚动行为
         to: Route,
         from: Route,
         savedPosition: ?Position
       ) => PositionResult | Promise<PositionResult>,
     };
     ```

   - `RouterOptions`定义了`VueRouter`所能接收的所有选项；
     [router.vuejs.org/zh/api/#rou…](https%3A%2F%2Frouter.vuejs.org%2Fzh%2Fapi%2F%23router-%25E6%259E%2584%25E5%25BB%25BA%25E9%2580%2589%25E9%25A1%25B9)
   - 我们重点关注一下下面的几个选项值
     - routes 是路由配置规则列表，这个主要用来后续生成路由映射表的；
       它是一个数组，每一项都是一个路由配置规则(`RouteConfig`)，关于 `RouteConfig`，可以回看术语那一节；
     - `mode`、`fallback` 是跟路由模式相关的

2. **属性赋初值**  
   对一些属性赋予了初值，例如，对接收`全局导航守卫(beforeEach、beforeResolve、afterEach)`的数组做了初始化
3. **创建 matcher**
   - 通过 `createMatcher` 生成了 `matcher`
   - 这个 `matcher` 对象就是最初聊的匹配器，负责 url 匹配，它接收了 `routes` 和 `router` 实例；`createMatcher` 里面不光创建了 `matcher`，还创建了`路由映射表 RouteMap`
4. **确定路由模式**

   - VueRouter 会根据 `options.mode`、`options.fallback`、`supportsPushState`、`inBrowser` 来确定最终的路由模式
   - 先确定`fallback`，fallback 只有在用户设置了`mode:history`并且当前环境不支持 `pushState` 且用户主动声明了需要回退，此时 `fallback` 才为 `true`
   - 当 `fallback` 为 `true` 时会使用 `hash` 模式；
   - 如果最后发现处于非浏览器环境，则会强制使用 `abstract` 模式
   - route-mode.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router10.awebp')" alt="vuesourcecode/vue-router/vue-router10.awebp">
   - `inBrowser` 和 `supportsPushState` 的实现都很简单

     ```js
     // src/util/dom.js
     export const inBrowser = typeof window !== 'undefined'; // 直接判断window是否存在，来确定是否在浏览器环境中

     // src/util/push-state.js
     export const supportsPushState =
       inBrowser && // 浏览器环境
       (function () {
         const ua = window.navigator.userAgent;
         if (
           (ua.indexOf('Android 2.') !== -1 ||
             ua.indexOf('Android 4.0') !== -1) &&
           ua.indexOf('Mobile Safari') !== -1 &&
           ua.indexOf('Chrome') === -1 &&
           ua.indexOf('Windows Phone') === -1
         ) {
           return false; // 特殊浏览器直接不支持
         }
         return (
           window.history && typeof window.history.pushState === 'function'
         ); // 判断是否支持pushState
       })();
     ```

5. **根据路由模式生成不同的 History 实例**

**小结**
VueRouter 的构造函数主要干了下面几件事

- 接收一个 `RouterOptions`
- 然后对一些属性赋了初值
- 生成了 matcher 匹配器
- 确定路由模式
- 根据不同路由模式生成不同 `History实例`

### 创建匹配器

我们来细看一下 `createMatcher` 里面的实现  
`createMatcher` 的实现在 `src/create-matcher.js` 中

```ts
 // src/create-matcher.js

...

// Matcher类型
export type Matcher = {
  match: (raw: RawLocation, current?: Route, redirectedFrom?: Location) => Route; // 匹配方法
  addRoutes: (routes: Array<RouteConfig>) => void; // 添加Route方法
};

// Matcher工厂函数
export function createMatcher (
  routes: Array<RouteConfig>, // 路由配置列表
  router: VueRouter // VueRouter实例
): Matcher {
  const { pathList, pathMap, nameMap } = createRouteMap(routes) // 创建路由映射表
  // 添加路由
  function addRoutes (routes) {
    // 由于传入pathList, pathMap, nameMap了，所以createRouteMap方法会执行添加逻辑
    createRouteMap(routes, pathList, pathMap, nameMap)
  }
  // 传入location,返回匹配的Route对象
  function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
    ...
  }
  
  // 返回Matcher对象，暴露match、addRoutes方法
  return {
    match,
    addRoutes
  }
}
```

可以看到，`createMatcher` 方法接收一个路由配置规则列表和 `router 实例`，返回一个 `Matcher` 对象

`Matcher` 对象包含一个用于匹配的 `match` 方法和一个动态添加路由的 `addRoutes` 方法；  
 而这两个方法都声明在 `createMatcher` 内部，由于闭包特性，它能访问到 `createMatcher` 作用域的所有变量

**小结**  
总结下 createMatcher 的逻辑  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router11.awebp')" alt="vuesourcecode/vue-router/vue-router11.awebp">

我们可以看到 `createMatcher` 和 `addRoutes` 方法中都调用了 `createRouteMap` 方法，二者只是传递的参数不同，从方法名看，这个方法肯定和 `路由表 RouteMap` 有关

### createRouteMap

createRouteMap 方法位于 `src/create-route-map.js` 中

```ts
// 创建路由映射map、添加路由记录
export function createRouteMap(
  routes: Array<RouteConfig>, // 路由配置列表
  oldPathList?: Array<string>, // 旧pathList
  oldPathMap?: Dictionary<RouteRecord>, // 旧pathMap
  oldNameMap?: Dictionary<RouteRecord> // 旧nameMap
): {
  pathList: Array<string>;
  pathMap: Dictionary<RouteRecord>;
  nameMap: Dictionary<RouteRecord>;
} {
  // 若旧的路由相关映射列表及map存在，则使用旧的初始化（借此实现添加路由功能）
  // the path list is used to control path matching priority
  const pathList: Array<string> = oldPathList || []; // $flow-disable-line
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null); // $flow-disable-line
  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null); // 遍历路由配置对象，生成/添加路由记录

  routes.forEach((route) => {
    addRouteRecord(pathList, pathMap, nameMap, route);
  }); // ensure wildcard routes are always at the end // 确保path:*永远在在最后

  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0]);
      l--;
      i--;
    }
  } // 开发环境，提示非嵌套路由的path必须以/或者*开头

  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList // check for missing leading slash
      .filter(
        (path) => path && path.charAt(0) !== '*' && path.charAt(0) !== '/'
      );
    if (found.length > 0) {
      const pathNames = found.map((path) => `- ${path}`).join('\n');
      warn(
        false,
        `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`
      );
    }
  }

  return {
    pathList,
    pathMap,
    nameMap,
  };
}
```

可以看到 `createRouteMap` 返回一个对象，它包含 `pathList`、`pathMap` 和 `nameMap`

- `pathList` 中存储了 `routes` 中的所有 `path`
- `pathMap` 维护的是 `path` 和 `路由记录 RouteRecord` 的映射
- `nameMap` 维护的是 `name` 和 `路由记录 RouteRecord` 的映射

因为 VueRouter 支持命名路由  
后两者，都是为了快速找到对应的`路由记录`

可以看下使用下面的 routes 调用 createRouteMap 会返回什么

```ts
[
  { path: '/', component: Home },
  {
    path: '/foo',
    component: Foo,
    children: [
      {
        path: 'child',
        component: FooChild,
      },
    ],
  },
  { path: '/bar/:dynamic', component: Bar },
];
```

route-map-obj.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router12.awebp')" alt="vuesourcecode/vue-router/vue-router12.awebp">

- 由于没有命名路由，所以 `nameMap` 为空
- `pathList` 存储了所有 `path`，有个为空，其实是`/`，在 `normalizePath` 时被删除
- `pathMap` 记录了每个 `path` 和对应 `RouteRecord` 的映射关系

**小结**

- VueRouter 的路由映射表由三部分组成:`pathList`、`pathMap`、`nameMap`；后两者是用来快速查找的
- createRouteMap 的逻辑
  - 先判断路由相关映射表是否已经存在，若存在则使用，否则新建；  
     这就实现了 `createRouteMap` 创建/新增的双重功能
  - 然后遍历 `routes`，依次为每个 `route` 调用 `addRouteRecord` 生成一个 `RouteRecord` 并更新 `pathList`、`pathMap` 和 `nameMap`
  - 由于 pathList 在后续逻辑会用来遍历匹配，为了性能，所以需要将 `path:*`放置到 `pathList` 的最后
  - 最后检查非嵌套路由的 `path` 是否是以`/`或者`*`开头
    <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router13.awebp')" alt="vuesourcecode/vue-router/vue-router13.awebp">

### addRouteRecord

这个方法主要是创建路由记录并更新路由映射表  
位于 `src/create-route-map.js`

```ts
// src/create-route-map.js

// 添加路由记录，更新pathList、pathMap、nameMap
function addRouteRecord(
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord, // 父路由时记录
  matchAs?: string // 处理别名路由时使用
) {
  const { path, name } = route;

  if (process.env.NODE_ENV !== 'production') {
    // route.path不能为空
    assert(path != null, `"path" is required in a route configuration.`); // route.component不能为string

    assert(
      typeof route.component !== 'string',
      `route config "component" for path: ${String(
        path || name
      )} cannot be a ` + `string id. Use an actual component instead.`
    );
  }
  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}; // 生成格式化后的path(子路由会拼接上父路由的path)

  const normalizedPath = normalizePath(
    path,
    parent,
    pathToRegexpOptions.strict
  );
  // 匹配规则是否大小写敏感？(默认值：false)
  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive;
  } // 生成一条路由记录

  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions), // 利用path-to-regexp包生成用来匹配path的增强正则对象，可以用来匹配动态路由
    components: route.components || { default: route.component }, // 保存路由组件，支持命名视图https://router.vuejs.org/zh/guide/essentials/named-views.html#命名视图
    instances: {}, // 保存router-view实例
    name,
    parent,
    matchAs,
    redirect: route.redirect, // 重定向的路由配置对象
    beforeEnter: route.beforeEnter, // 路由独享的守卫
    meta: route.meta || {}, // 元信息
    // 动态路由传参；https://router.vuejs.org/zh/guide/essentials/passing-props.html#路由组件传参
    props:
      route.props == null
        ? {}
        : route.components // 命名视图的传参规则需要使用route.props指定的规则
        ? route.props
        : { default: route.props },
  }; // 处理有子路由情况

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    // https://github.com/vuejs/vue-router/issues/629
    // 命名路由 && 未使用重定向 && 子路由配置对象path为''或/时，使用父路由的name跳转时，子路由将不会被渲染
    if (process.env.NODE_ENV !== 'production') {
      if (
        route.name &&
        !route.redirect &&
        route.children.some((child) => /^\/?$/.test(child.path))
      ) {
        warn(
          false,
          `Named Route '${route.name}' has a default child route. ` +
            `When navigating to this named route (:to="{name: '${route.name}'"), ` +
            `the default child route will not be rendered. Remove the name from ` +
            `this route and use the name of the default child route for named ` +
            `links instead.`
        );
      }
    } // 遍历生成子路由记录

    route.children.forEach((child) => {
      const childMatchAs = matchAs // matchAs若有值，代表当前路由是别名路由，则需要单独生成别名路由的子路由，路径前缀需使用matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined;
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
    });
  } // 若pathMap中不存在当前路径，则更新pathList和pathMap

  if (!pathMap[record.path]) {
    pathList.push(record.path);
    pathMap[record.path] = record;
  } // 处理别名；https://router.vuejs.org/zh/guide/essentials/redirect-and-alias.html#%E5%88%AB%E5%90%8D

  if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]; // alias支持string，和Array<String>
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i];
      if (process.env.NODE_ENV !== 'production' && alias === path) {
        // alias的值和path重复，需要给提示
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        ); // skip in dev to make it work
        continue;
      } // 生成别名路由配置对象

      const aliasRoute = {
        path: alias,
        children: route.children,
      }; // 添加别名路由记录

      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute, // 别名路由
        parent, // 当前路由的父路由，因为是给当前路由取了个别名，所以二者其实是有同个父路由的
        record.path || '/' // matchAs，用来生成别名路由的子路由；
      ); // ! 总结：当前路由设置了alias后，会单独为当前路由及其所有子路由生成路由记录，且子路由的path前缀为matchAs(即别名路由的path)
    }
  } // 处理命名路由

  if (name) {
    // 更新nameMap
    if (!nameMap[name]) {
      nameMap[name] = record;
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      // 路由重名警告
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      );
    }
  }
}
```

看下逻辑

- 检查了路由规则中的 `path` 和 `component`
- 生成 `path-to-regexp` 的选项 `pathToRegexpOptions`
- 格式化 `path`，如果是嵌套路由，则会追加上父路由的 `path`
- 生成路由记录
- 处理嵌套路由，递归生成子路由记录
- 更新 `pathList`、`pathMap`
- 处理别名路由，生成别名路由记录
- 处理命名路由，更新 `nameMap`

我们来看下几个核心逻辑

1. **路由记录**

   - 路由记录记录了路由的核心信息
     ```ts
     const record: RouteRecord = {
       path: normalizedPath, // 规范化后的路径
       regex: compileRouteRegex(normalizedPath, pathToRegexpOptions), // 利用path-to-regexp包生成用来匹配path的增强正则对象，可以用来匹配动态路由
       components: route.components || { default: route.component }, // 保存路由组件，支持命名视图https://router.vuejs.org/zh/guide/essentials/named-views.html#命名视图
       instances: {}, // 保存router-view实例
       name,
       parent, // 父路由记录
       matchAs, // 别名路由需要使用
       redirect: route.redirect, // 重定向的路由配置对象
       beforeEnter: route.beforeEnter, // 路由独享的守卫
       meta: route.meta || {}, // 元信息
       // 动态路由传参；https://router.vuejs.org/zh/guide/essentials/passing-props.html#路由组件传参
       props:
         route.props == null
           ? {}
           : route.components // 命名视图的传参规则需要使用route.props指定的规则
           ? route.props
           : { default: route.props },
     };
     ```
   - 路由记录有个 `regex` 字段，它是一个增强的正则表达式，它是实现动态路由匹配的关键
   - `regex` 是通过 `compileRouteRegex` 方法返回的，它里面调用了 `path-to-regexp`

     ```ts
     import Regexp from 'path-to-regexp'

     ...

     // 使用path-to-regexp包，生成route对应的正则，可以用来生成动态路由需要的正则表达式
     function compileRouteRegex (
       path: string,
       pathToRegexpOptions: PathToRegexpOptions
     ): RouteRegExp {

       const regex = Regexp(path, [], pathToRegexpOptions)
       if (process.env.NODE_ENV !== 'production') {
         const keys: any = Object.create(null)
         regex.keys.forEach(key => {
           // 重复key浸膏
           warn(
             !keys[key.name],
             `Duplicate param keys in route with path: "${path}"`
           )
           keys[key.name] = true
         })
       }
       return regex
     }
     ```

   - 我们看下 path-to-regexp 是如何使用的
     [官网是:www.npmjs.com/package/pat…](https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fpath-to-regexp)
   - `Regexp` 接收三个参数 `path`，`keys`，`options`；

     - `path` 为需要转换为正则的路径，
     - `keys` 是用来接收在 path 中找到的 key，可以传入，也可以直接使用返回值上的 keys 属性，
     - `options` 为选项

       ```ts
       const pathToRegexp = require('path-to-regexp');

       const regexp = pathToRegexp('/foo/:bar'); // regexp = /^\/foo\/([^\/]+?)\/?$/i
       // :bar被处理成正则的一个组了，当正则被执行时，就可以通过组取到bar对应的值
       console.log(regexp.keys); // keys = [{ name: 'bar', prefix: '/', suffix: '', pattern: '[^\\/#\\?]+?', modifier: '' }]
       ```

   - 通过下面的例子，就可以知道动态路由获取参数值是如何实现的

     ```ts
     // test.js

     const pathToRegexp = require('path-to-regexp');
     const regexp = pathToRegexp('/foo/:bar');
     console.log(regexp.keys); // 记录了key信息

     const m = '/foo/test'.match(regexp); // 正则的组记录了value信息

     console.log('key:', regexp.keys[0].name, ',value:', m[1]);
     ```

   - path-to-regex-demo.png  
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router14.awebp')" alt="vuesourcecode/vue-router/vue-router14.awebp">

2. **生成嵌套路由记录**
   我们知道 `vue-router` 是支持嵌套路由的，我们来看看是如何生成嵌套路由记录的

   ```ts
   // src/create-route-map

   // 处理有子路由情况
   if (route.children) {
     // Warn if route is named, does not redirect and has a default child route.
     // If users navigate to this route by name, the default child will
     // not be rendered (GH Issue #629)
     // https://github.com/vuejs/vue-router/issues/629
     // 命名路由 && 未使用重定向 && 子路由配置对象path为''或/时，使用父路由的name跳转时，子路由将不会被渲染
     if (process.env.NODE_ENV !== 'production') {
       if (
         route.name &&
         !route.redirect &&
         route.children.some((child) => /^\/?$/.test(child.path))
       ) {
         warn(
           false,
           `Named Route '${route.name}' has a default child route. ` +
             `When navigating to this named route (:to="{name: '${route.name}'"), ` +
             `the default child route will not be rendered. Remove the name from ` +
             `this route and use the name of the default child route for named ` +
             `links instead.`
         );
       }
     } // 遍历生成子路由记录
     route.children.forEach((child) => {
       const childMatchAs = matchAs // matchAs若有值，代表当前路由是别名路由，则需要单独生成别名路由的子路由，路径前缀需使用matchAs
         ? cleanPath(`${matchAs}/${child.path}`)
         : undefined;
       addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
     });
   }
   ```

   - 首先针对 `#629` 问题做出了警告提示  
      #629 问题主要是 当一个路由是 `命名路由 && 未使用重定向 && 子路由配置对象path为''或/`时，使用父路由的 `name` 跳转时，子路由将不会被渲染
   - 然后遍历子路由规则列表，生成子路由记录  
      这里面还处理了别名路由的子路由情况: 遍历时如果发现父路由被标记为别名路由，则子路由的 path 前面需要加上父路由的 path，然后再生成记录

   - 我们可以看下下面的嵌套路由，生成的路由映射表长什么样
     ```ts
     [
       {
         path: '/parent',
         component: Parent,
         children: [{ path: 'foo', component: Foo }],
       },
     ];
     ```
   - nested-route.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router15.awebp')" alt="vuesourcecode/vue-router/vue-router15.awebp">
   - 可以看到，子路由的 `path` 会前追加上父路由的 `path`

3. **生成别名路由记录**

   - `VueRouter`支持给路由设置别名；`/a` 的别名是 `/b`，意味着，当用户访问 `/b` 时，`URL` 会保持为 `/b`，但是路由匹配则为 `/a`，就像用户访问 `/a` 一样
   - 我们来看看椒如何生成别名路由记录的

     ```ts
     // src/create-route-map.js

     if (route.alias !== undefined) {
       const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]; // alias支持string，和Array<String>
       for (let i = 0; i < aliases.length; ++i) {
         const alias = aliases[i];
         if (process.env.NODE_ENV !== 'production' && alias === path) {
           // alias的值和path重复，需要给提示
           warn(
             false,
             `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
           ); // skip in dev to make it work
           continue;
         } // 生成别名路由配置对象

         const aliasRoute = {
           path: alias,
           children: route.children,
         }; // 添加别名路由记录

         addRouteRecord(
           pathList,
           pathMap,
           nameMap,
           aliasRoute, // 别名路由
           parent, // 当前路由的父路由，因为是给当前路由取了个别名，所以二者其实是有同个父路由的
           record.path || '/' // matchAs，用来生成别名路由的子路由；
         ); // ! 总结：当前路由设置了alias后，会单独为当前路由及其所有子路由生成路由记录，且子路由的path前缀为matchAs(即别名路由的path)
       }
     }
     ```

   - 别名是支持单别名和多别名的，即`route.alias`支持传入`/foo`或`['/foo','/bar']`，所以先对这两种情况做了归一处理，统一处理成数组
   - 然后遍历这个数组，先检查别名和`path`是否重复，然后单独为别名路由生成一份配置传入，最后调用`addRouteRecord`生成别名路由记录
     注意此处还通过`matchAs`处理了别名路由生成子路由的场景，主要通过设置`matchAs`为`record.path || '/'`，然后在生成子路由记录时，会根据`matchAs`生成别名路由记录的子记录，具体可看上面的嵌套路由章节
   - 我们看看，别名路由生成的的路由映射表长什么样
     ```ts
     [
       { path: '/root', component: Root, alias: '/root-alias' },
       {
         path: '/home',
         component: Home,
         children: [
           { path: 'bar', component: Bar, alias: 'bar-alias' },
           { path: 'baz', component: Baz, alias: ['/baz', 'baz-alias'] },
         ],
       },
     ];
     ```
   - alias-route.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router16.awebp')" alt="vuesourcecode/vue-router/vue-router16.awebp">
   - 可以看到为别名路由和别名路由的子路由都单独生成了一条路由记录

4. **小结**
   - 路由记录是`路由映射表`的重要组成部分
     路由记录中的`regex`是处理动态路由传参的关键字段，主要是借助`path-to-regexp`实现的
   - 生成路由记录主要考虑了下面几种路由记录的生成
     - 嵌套路由
       子路由单独生成一条路由记录
     - 别名路由及别名路由子路由
       别名路由及其子路由分别会生成一条路由记录
     - 命名路由
   - 生成路由记录的整个流程如下图所示
   - add-route-record.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router17.awebp')" alt="vuesourcecode/vue-router/vue-router17.awebp">

### 路由模式

前端路由一个很重要的特性是要实现无刷新切换页面, 即 url 改变，页面不刷新实现页面的跳转

要实现这一点，有两种方案  
一种`hash+hashChange`，另一种利用`History API`的`pushState+popState`

前者主要利用 `hash` 改变时页面不会刷新并会触发 `hashChange` 这个特性来实现前端路由  
后者充分利用了 `HTML5 History API` 的 `pushState` 方法和 `popState` 事件来实现前端路由

二者比较

- hash
  - 兼容性好，`hashChange`支持到`IE8`
  - `url`中会携带`/#/`，不美观
  - 不需要服务端改造
- history
  - 兼容到 IE10
  - url 跟正常 url 一样
  - 由于其 url 跟正常 url 一样，所以在刷新时，会以此 url 为链接请求服务端页面，而服务端是没有这个页面的，会 404，因此需要服务端配合将所有请求重定向到首页，将整个路由的控制交给前端路由

VueRouter 支持三种路由模式，分别为 `hash`、`history`、`abstract`

- `hash` 模式就是第一种方案的实现
- `history` 模式是第二种方案的实现
- `abstract` 模式是用在非浏览器环境的，主要用于 `SSR`

1. **核心类**
   - VueRouter 的三种路由模式，主要由下面的三个核心类实现
   - History
     - 基础类
     - 位于`src/history/base.js`
   - HTML5History
     - 用于支持 pushState 的浏览器
     - `src/history/html5.js`
   - HashHistory
     - 用于不支持 pushState 的浏览器
     - `src/history/hash.js`
   - AbstractHistory
     - 用于非浏览器环境(服务端渲染)
     - `src/history/abstract.js`
   - 通过下面这张图，可以了解到他们之间的关系 route-mode-class.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router18.awebp')" alt="vuesourcecode/vue-router/vue-router18.awebp">
   - `HTML5History`、`HashHistory`、`AbstractHistory` 三者都是继承于基础类 `History`；
   - 三者不光能访问 `History` 类的所有属性和方法，他们还都实现了基础类中声明的需要子类实现的 5 个接口(`go`、`push`、`replace`、`ensureURL`、`getCurrentLocation`)
   - 由于 `HashHistory` 监听 `hashChange` 的特殊性，所以会单独多一个 `setupListeners` 方法
   - `AbstractHistory` 由于需要在非浏览器环境使用，没有历史记录栈，所以只能通过 `index`、`stack` 来模拟
   - 前面我们分析 VueRouter 实例化过程时，知道 VueRouter 会在确定完路由模式后，会实例化不同的 History 实例
   - 那我们来看看不同 History 的实例化过程
2. **History 类**

   - 它是父类(基类)，其它类都是继承它的
   - 代码位于`src/history/base.js`

     ```js
     // src/history/base.js
     // 父类
     export class History {
       router: Router
       base: string
       current: Route
       pending: ?Route
       cb: (r: Route) => void
       ready: boolean
       readyCbs: Array<Function>
       readyErrorCbs: Array<Function>
       errorCbs: Array<Function>

       // implemented by sub-classes
       // 需要子类(HTML5History、HashHistory)实现的方法
       +go: (n: number) => void
       +push: (loc: RawLocation) => void
       +replace: (loc: RawLocation) => void
       +ensureURL: (push?: boolean) => void
       +getCurrentLocation: () => string

       constructor (router: Router, base: ?string) {
         this.router = router
         // 格式化base，保证base是以/开头
         this.base = normalizeBase(base)
         // start with a route object that stands for "nowhere"
         this.current = START // 当前指向的route对象，默认为START；即from
         this.pending = null // 记录将要跳转的route；即to
         this.ready = false
         this.readyCbs = []
         this.readyErrorCbs = []
         this.errorCbs = []
       }
       
       ...

     }
     ```

   - 可以看到，构造函数中主要干了下面几件事
     - 保存了`router`实例
     - 规范化了`base`，确保`base`是以`/`开头
     - 初始化了当前路由指向，默认只想`START`初始路由；在路由跳转时，`this.current`代表的是`from`
     - 初始化了路由跳转时的下个路由，默认为`null`；在路由跳转时，`this.pending`代表的是`to`
     - 初始化了一些回调相关的属性
   - `START`定义在`src/utils/route.js`中
     ```ts
     // src/utils/route.js
     // 初始路由
     export const START = createRoute(null, {
       path: '/',
     });
     ```
   - History 类的实例化过程如下 history.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router19.awebp')" alt="vuesourcecode/vue-router/vue-router19.awebp">

3. **HTML5History 类**

   - 我们再看看`HTML5History`类,它是继承自 History 类, 位于`src/history/html5.js`

     ```js
     export class HTML5History extends History {
       constructor(router: Router, base: ?string) {
         // 初始化父类History
         super(router, base); // 检测是否需要支持scroll

         const expectScroll = router.options.scrollBehavior;
         const supportsScroll = supportsPushState && expectScroll; // 若支持scroll,初始化scroll相关逻辑

         if (supportsScroll) {
           setupScroll();
         } // 获取初始location

         const initLocation = getLocation(this.base); // 监听popstate事件

         window.addEventListener('popstate', (e) => {
           const current = this.current; // Avoiding first `popstate` event dispatched in some browsers but first // history route not updated since async guard at the same time. // 某些浏览器，会在打开页面时触发一次popstate

           // 此时如果初始路由是异步路由,就会出现`popstate`先触发,初始路由后解析完成，进而导致route未更新
           // 所以需要避免
           const location = getLocation(this.base);
           if (this.current === START && location === initLocation) {
             return;
           } // 路由地址发生变化，则跳转，并在跳转后处理滚动

           this.transitionTo(location, (route) => {
             if (supportsScroll) {
               handleScroll(router, route, current, true);
             }
           });
         });
       }
     }
     ```

   - 可以看到其是继承于`History类`，所以在构造函数中调用了父类构造函数(`super(router,base)`)
   - 检查了是否需要支持滚动行为，如果支持，则初始化滚动相关逻辑
   - 监听了`popstate`事件，并在`popstate`触发时，调用`transitionTo`方法实现跳转
   - 注意这里处理了一个异常场景
     - 某些浏览器下，打开页面会触发一次`popstate`，此时如果路由组件是异步的，就会出现`popstate`事件触发了，但异步组件还没解析完成，最后导致`route`没有更新
     - 所以对这种情况做了屏蔽
   - 关于滚动和路由跳转后面有专门章节会讲
   - HTML5History 类的实例化过程如下 h5history.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router20.awebp')" alt="vuesourcecode/vue-router/vue-router20.awebp">

4. **HashHistory 类**

   - 位于 src/history/hash.js

     ```js
     // src/history/hash.js

     export class HashHistory extends History {
       constructor(router: Router, base: ?string, fallback: boolean) {
         // 实例化父类
         super(router, base); // check history fallback deeplinking // fallback只有在指明了mode为history，但是浏览器又不支持popstate，用户手动指明了fallback为true时，才为true，其它情况为false // 如果需要回退，则将url换为hash模式(/#开头) // this.base来自父类
         if (fallback && checkFallback(this.base)) {
           return;
         }
         ensureSlash();
       }
     }
     ```

   - 它继承于`History`，所以也调用了`super(router,base)`
   - 检查了`fallback`，看是否需要回退，前面说过，传入的`fallback`只有在用户设置了`history`且又不支持`pushState`并且启用了回退时才为`true`
   - 所以，此时，需要将`history`模式的 url 替换成`hash`模式，即添加上`#`，这个逻辑是由`checkFallback`实现的
   - 如果不是`fallback`，则直接调用`ensureSlash`，确保`url`是以`/`开头的
   - 我们看下`checkFallback`、`ensureSlash`实现

     ```js
     // src/history/hash.js

     /**
      * 检查回退，将url转换为hash模式(添加/#)
      */
     function checkFallback(base) {
       const location = getLocation(base); // 地址不以/#开头，则添加之
       if (!/^\/#/.test(location)) {
         window.location.replace(cleanPath(base + '/#' + location)); // 这一步实现了url替换
         return true;
       }
     }

     /**
      * 确保url是以/开头
      */
     function ensureSlash(): boolean {
       const path = getHash();
       if (path.charAt(0) === '/') {
         return true;
       }
       replaceHash('/' + path);
       return false;
     }

     // 替换hash记录
     function replaceHash(path) {
       // 支持pushState，则优先使用replaceState
       if (supportsPushState) {
         replaceState(getUrl(path));
       } else {
         window.location.replace(getUrl(path));
       }
     }
     ```

   - 是不是发现`HashHistory`少了滚动支持和监听`hashChange`相关逻辑，这是因为`hashChange`存在一些特殊场景，需要等到`mounts`后才能监听
     这一块的逻辑全放在了`setupListeners`方法中，`setupListeners`会在`VueRouter`调用`init`时被调用，这个我们在初始化章节再看
   - `HashHistory类`的实例化过程如下 hash-history.png
     <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router21.awebp')" alt="vuesourcecode/vue-router/vue-router21.awebp">

5. **AbstractHistory 类**

   - AbstractHistory 是用于非浏览器环境的, 位于 src/history/abstract.js

     ```js
     // src/history/abstract.js

     /**
      * 支持所有 JavaScript 运行环境，如 Node.js 服务器端。如果发现没有浏览器的 API，路由会自动强制进入这个模式
      *
      * @export
      * @class AbstractHistory
      * @extends {History}
      */
     export class AbstractHistory extends History {
       constructor(router: Router, base: ?string) {
         // 初始化父类
         super(router, base);
         this.stack = [];
         this.index = -1;
       }
     }
     ```

   - 可以看到它的实例化是最简单的，只初始化了父类，并对`index`、`stack`做了初始化
   - 前面说过，非浏览器环境，是没有历史记录栈的，所以使用 index、stack 来模拟历史记录栈
   - `AbstractHistory`类的实例化过程如下 abstract-history.png  
      <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router22.awebp')" alt="vuesourcecode/vue-router/vue-router22.awebp">

6. **小结**
   - 这一小节我们对三种路由模式做了简单分析，并且还一起看了实现这三种路由模式所需要的 History 类是如何实例化的
   - 通过一个图来简单总结下 VueRouter 实例化过程 vue-router-instance.png  
      <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router23.awebp')" alt="vuesourcecode/vue-router/vue-router23.awebp">

## 初始化流程

### 调用 init 时机

在分析安装流程时，我们知道 VueRouter 注册了一个全局混入，混入了`beforeCreate`钩子  
代码如下

```js
// src/install.js

// 注册全局混入
Vue.mixin({
  beforeCreate () {
    
    // 判断是否使用了vue-router插件
    if (isDef(this.$options.router)) {
     ...
      this._router = this.$options.router // 保存VueRouter实例，this.$options.router仅存在于Vue根实例上，其它Vue组件不包含此属性，所以下面的初始化，只会执行一次
      // beforeCreate hook被触发时，调用
      this._router.init(this) // 初始化VueRouter实例，并传入Vue根实例
    } else {
      ...
    }
    ...
  },
  destroyed () {
   ...
  }
})
```

我们知道全局混入，会影响后续创建的所有 Vue 实例，所以`beforeCreate`首次触发是在 Vue 根实例实例化的时候即`new Vue({router})`时

触发后调用`router`实例的`init`方法并传入`Vue根实例`，完成初始化流程；  
由于`router`仅存在于`Vue根实例`的`$options`上，所以，整个初始化只会被调用一次

### init 方法

VueRouter 的 init 方法位于`src/index.js`

```ts
// src/install.js
export default class VueRouter {
  // 初始化,app为Vue根实例
  init(app: any /* Vue component instance */) {
    // 开发环境，确保已经安装VueRouter
    process.env.NODE_ENV !== 'production' &&
      assert(
        install.installed,
        `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
          `before creating root instance.`
      );

    this.apps.push(app); // 保存实例 // set up app destroyed handler // https://github.com/vuejs/vue-router/issues/2639 // 绑定destroyed hook，避免内存泄露
    app.$once('hook:destroyed', () => {
      // clean out app from this.apps array once destroyed
      const index = this.apps.indexOf(app);
      if (index > -1) this.apps.splice(index, 1); // ensure we still have a main app or null if no apps // we do not release the router so it can be reused // 需要确保始终有个主应用
      if (this.app === app) this.app = this.apps[0] || null;
    }); // main app previously initialized // return as we don't need to set up new history listener // main app已经存在，则不需要重复初始化history 的事件监听

    if (this.app) {
      return;
    }

    this.app = app;

    const history = this.history;

    if (history instanceof HTML5History) {
      // 若是HTML5History类，则直接调用父类的transitionTo方法，跳转到当前location
      history.transitionTo(history.getCurrentLocation());
    } else if (history instanceof HashHistory) {
      // 若是HashHistory，在调用父类的transitionTo方法后，并传入onComplete、onAbort回调
      const setupHashListener = () => {
        // 调用HashHistory.setupListeners方法，设置hashchange监听
        // 在 route 切换完成之后再设置 hashchange 的监听,
        // 修复https://github.com/vuejs/vue-router/issues/725
        // 因为如果钩子函数 beforeEnter 是异步的话, beforeEnter 钩子就会被触发两次. 因为在初始化时, 如果此时的 hash 值不是以 / 开头的话就会补上 #/, 这个过程会触发 hashchange 事件, 就会再走一次生命周期钩子, 也就意味着会再次调用 beforeEnter 钩子函数.
        history.setupListeners();
      };
      history.transitionTo(
        history.getCurrentLocation(),
        setupHashListener, // transitionTo的onComplete回调
        setupHashListener // transitionTo的onAbort回调
      );
    } // 调用父类的listen方法，添加回调； // 回调会在父类的updateRoute方法被调用时触发，重新为app._route赋值 // 由于app._route被定义为响应式，所以app._route发生变化，依赖app._route的组件(route-view组件)都会被重新渲染

    history.listen((route) => {
      this.apps.forEach((app) => {
        app._route = route;
      });
    });
  }
}
```

可以看到，主要做了下面几件事

- 检查了`VueRouter`是否已经安装
- 保存了挂载`router实例`的`vue实例`
  VueRouter 支持多实例嵌套，所以存在`this.apps`来保存持有`router实例`的`vue实例`
- 注册了一个一次性钩子`destroyed`，在`destroyed`时，卸载`this.app`，避免内存泄露
- 检查了`this.app`，避免重复事件监听
- 根据`history`类型，调用`transitionTo`跳转到不同的初始页面
- 注册`updateRoute`回调，在`router`更新时，更新`app._route`完成页面重新渲染

### setupListeners

上面说到，在初始化时，会根据`history类型`，调用`transitionTo`跳转到不同的初始页面

为什么要跳转初始页面？  
因为在初始化时，url 可能指向其它页面，此时需要调用`getCurrentLocation`方法，从当前 url 上解析出路由，然后跳转之

可以看到`HTML5History类`和`HashHistory类`调用`transitionTo`方法的参数不太一样

- 前者只传入了一个参数
- 后者传入了三个参数

我们看下 transitionTo 方法的方法签名

```ts

// src/history/base.js
...
// 父类
export class History {
  ...
  
  // 路由跳转
  transitionTo (
    location: RawLocation, // 原始location，一个url或者是一个Location interface(自定义形状，在types/router.d.ts中定义)
    onComplete?: Function, // 跳转成功回调
    onAbort?: Function// 跳转失败回调
  ) {
    ...   
  }
}
```

首个参数是需要解析的地址，第二是跳转成功回调，第三个是跳转失败回调

我们来看下 `HashHistory` 类为何需要传入回调

可以看到传入的成功、失败回调都是 `setupHashListener` 函数,`setupHashListener` 函数内部调用了 `history.setupListeners` 方法，而这个方法是 `HashHistory` 类独有的

打开`src/history/hash.js`

```ts
// src/history/hash.js

  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  // 修复#725;https://github.com/vuejs/vue-router/issues/725
  // 因为如果钩子函数 beforeEnter 是异步的话, beforeEnter 钩子就会被触发两次. 因为在初始化时, 如果此时的 hash 值不是以 / 开头的话就会补上 #/, 这个过程会触发 hashchange 事件, 就会再走一次生命周期钩子, 也就意味着会再次调用 beforeEnter 钩子函数.
  setupListeners () {
    const router = this.router
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll
    // 若支持scroll,初始化scroll相关逻辑
    if (supportsScroll) {
      setupScroll()
    }
    // 添加事件监听
    window.addEventListener(
      supportsPushState ? 'popstate' : 'hashchange', // 优先使用popstate
      () => {
        const current = this.current
        if (!ensureSlash()) {
          return
        }
        this.transitionTo(getHash(), route => {
          if (supportsScroll) {
            handleScroll(this.router, /* to*/route, /* from*/current, true)
          }
          // 不支持pushState，直接替换记录
          if (!supportsPushState) {
            replaceHash(route.fullPath)
          }
        })
      }
    )
  }
```

主要逻辑如下

- `setupListeners`主要判断了是否需要支持滚动行为，如果支持，则初始化相关逻辑
- 然后添加 url 变化事件监听，之前说过实现路由有两种方案`pushState+popState`、`hash+hashChange`
- 可以看到这里即使是`HashHistory`也会优先使用`popstate`事件来监听 url 的变化
- 当 url 发生变化时，会调用 transitionTo 跳转新路由
- 可以看到这一块的逻辑和 HTML5History 类在实例化时处理的逻辑很类似

```ts
// src/history/html5.js

export class HTML5History extends History {
  constructor (router: Router, base: ?string) {
    ...

    // 检测是否需要支持scroll
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    // 若支持scroll,初始化scroll相关逻辑
    if (supportsScroll) {
      setupScroll()
    }

    // 获取初始location
    const initLocation = getLocation(this.base)
    // 监听popstate事件
    window.addEventListener('popstate', e => {
     ...

      // 路由地址发生变化，则跳转，并在跳转后处理滚动
      this.transitionTo(location, route => {
        if (supportsScroll) {
          handleScroll(router, route, current, true)
        }
      })
    })
  }
}
```

那为何二者处理的时机不同呢？

- `HTML5Histroy`在实例化时监听事件
- `HashHistory`在初次路由跳转结束后监听事件

这是为了修复[#725 问题](https%3A%2F%2Fgithub.com%2Fvuejs%2Fvue-router%2Fissues%2F725)

- 如果 `beforeEnter` 是异步的话，`beforeEnter` 就会触发两次，这是因为在初始化时，`hash`  值不是  `/`  开头的话就会补上`#/`，这个过程会触发  `hashchange`  事件，所以会再走一次生命周期钩子，导致再次调用 `beforeEnter` 钩子函数。所以只能将 `hashChange` 事件的监听延迟到初始路由跳转完成后；

### 小结

针对 init 流程，总结了下面的活动图 init.png

<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router24.awebp')" alt="vuesourcecode/vue-router/vue-router24.awebp">
