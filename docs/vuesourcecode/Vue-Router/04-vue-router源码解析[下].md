# vue-router 源码解析 | 6k 字 - 【下】

[[toc]]

## 滚动处理

我们知道`vue-router`可以处理一些滚动行为，例如记录页面滚动位置，然后在切换路由时滚到顶部或保持原先位置；
[router.vuejs.org/zh/guide/ad…](https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html#%E6%BB%9A%E5%8A%A8%E8%A1%8C%E4%B8%BA)

它主要接收一个 scrollBehavior 参数，scrollBehavior 有以下玩法

```ts

const router = new VueRouter({
      routes: [...],
      scrollBehavior (to, from, savedPosition) {
        // return 期望滚动到哪个的位置
      }
})

// 滚动到指定坐标
scrollBehavior (to, from, savedPosition) {
  return { x: 0, y: 0 }
}


// 滚动到指定页面锚点
scrollBehavior (to, from, savedPosition) {
  if (to.hash) {
    return {
      selector: to.hash
    }
  }
}

// v2.8.0+ 异步滚动
scrollBehavior (to, from, savedPosition) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({ x: 0, y: 0 })
        }, 500)
      }
    )
}
```

- 既支持滚动到指定位置，也可以滚动页面某个页面锚点位置和异步滚动
- 那它是如何做到呢?具体的逻辑又是怎样的呢？
- 我们前面都知道 `HTML5History` 在初始化时和 `HashHistory` 在 `setupListener` 时都会调用 `setupScroll` 函数，初始化滚动相关的逻辑
- 并在 `popstate` 或 `hashchange` 事件触发路由跳转时，调用 `handleScroll` 处理滚动行为

```ts
// src/history/hash.js

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

我们先看滚动的初始化

### setupScroll

代码位于 src/util/scroll.js

```ts
// 初始化滚动相关逻辑
export function setupScroll() {
  // Fix for #1585 for Firefox
  // Fix for #2195 Add optional third attribute to workaround a bug in safari https://bugs.webkit.org/show_bug.cgi?id=182678
  // Fix for #2774 Support for apps loaded from Windows file shares not mapped to network drives: replaced location.origin with
  // window.location.protocol + '//' + window.location.host
  // location.host contains the port and location.hostname doesn't
  const protocolAndPath =
    window.location.protocol + '//' + window.location.host;
  const absolutePath = window.location.href.replace(protocolAndPath, ''); // preserve existing history state as it could be overriden by the user // 拷贝一份state，防止用户覆盖

  const stateCopy = extend({}, window.history.state);
  stateCopy.key = getStateKey(); // 语法定义:history.replaceState(stateObj, title[, url]);

  window.history.replaceState(stateCopy, '', absolutePath); // 监听popstate(只能通过浏览器的 前进/后退 按钮触发)，保存滚动位置，更新stateKey

  window.addEventListener('popstate', (e) => {
    saveScrollPosition();
    if (e.state && e.state.key) {
      setStateKey(e.state.key);
    }
  });
}
```

- 可以看到其利用 History API 的来完成位置的保存
  [developer.mozilla.org/zh-CN/docs/…](https://developer.mozilla.org/zh-CN/docs/Web/API/History/replaceState)
- 在 `popstate` 时记录滚动位置并更新状态 obj 的 key
- 这个 key 是用来在 state 中标识每个路由用的
- 可以看下 key 的存取

```ts
// src/util/state-key.js

// use User Timing api (if present) for more accurate key precision
const Time =
  inBrowser && window.performance && window.performance.now
    ? window.performance
    : Date;

// 生成唯一key，用来在state中标识每个路由
export function genStateKey(): string {
  return Time.now().toFixed(3);
}

let _key: string = genStateKey();
export function getStateKey() {
  return _key;
}

export function setStateKey(key: string) {
  return (_key = key);
}
```

- 可以看到声明了一个`_key`，其是一个三位的时间戳，更新和读取都是操作这一个`_key`
- `setupScroll` 时，首先拷贝了当前的 state，并为其生成一个唯一 key
- 通过 `replaceState` 将添加了 key 的 state 保存到当前路由的 absolutePath 上
- 然后监听 `popstate` 事件，其只能通过浏览器的   前进/后退   按钮触发
- 触发后会保存当前位置，并更新`_key`
- 这样就可以在路由发生变化触发 `popstate` 时，保存当前位置并设置唯一`_key`
- 看下其是如何存取位置信息的

```ts
// src/util/scroll.js

const positionStore = Object.create(null); // 保存页面滚动位置
export function saveScrollPosition() {
  const key = getStateKey();
  if (key) {
    positionStore[key] = {
      x: window.pageXOffset,
      y: window.pageYOffset,
    };
  }
}
```

- 其利用 positionStore 对象配合唯一的\_key 来存取位置
- 在 handleScroll 时就可以通过\_key 取出之前保存的位置

### handleScroll

处理滚动的代码位于 src/util/scroll.js

```ts

export function handleScroll (
  router: Router,
  to: Route,
  from: Route,
  isPop: boolean// 是否popstate，只有浏览器的 前进/后退 按钮才会触发，也只有popstate时，才会保存滚动位置
) {

  if (!router.app) {
    return
  }
  const behavior = router.options.scrollBehavior
  if (!behavior) {
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    assert(typeof behavior === 'function', `scrollBehavior must be a function`)
  }

  // wait until re-render finishes before scrolling
  // 重新渲染结束，再处理滚动
  router.app.$nextTick(() => {
    const position = getScrollPosition() // 获取之前保存的滚动位置

    // https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html#%E6%BB%9A%E5%8A%A8%E8%A1%8C%E4%B8%BA
    const shouldScroll = behavior.call(
      router,
      to,
      from,
      isPop ? position : null // 第三个参数 savedPosition 当且仅当 popstate 导航 (通过浏览器的 前进/后退 按钮触发) 时才可用。,所以是popstate时，才有savedPosition
    )
    // 返回一个falsy值时，代表不需要滚动
    if (!shouldScroll) {
      return
    }

    // v.2.8.0支持异步滚动
    // https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html#%E5%BC%82%E6%AD%A5%E6%BB%9A%E5%8A%A8
    if (typeof shouldScroll.then === 'function') {
      shouldScroll
        .then(shouldScroll => {
          scrollToPosition((shouldScroll: any), position)
        })
        .catch(err => {
          if (process.env.NODE_ENV !== 'production') {
            assert(false, err.toString())
          }
        })
    } else {
      scrollToPosition(shouldScroll, position)
    }
  })
}
```

在`$nextTick`中调用 `getScrollPosition` 获取之前保存好的位置  
再调用我们传入的 `scrollBehavior` 查看其返回值来确定是否需要进行滚动  
还判断了一波是否是异步滚动  
若是，则等待其 `resolved` 再调用 `scrollToPosition`  
否则直接调用 `scrollToPosition`  
`getScrollPosition`、`scrollToPosition` 代码如下

```ts
// src/util/scroll.js

// 获取保存的滚动位置
function getScrollPosition(): ?Object {
  const key = getStateKey(); // 取唯一key
  if (key) {
    return positionStore[key]; // 取位置
  }
}

// 滚动到指定位置，支持滚动到特定元素
// https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html#%E6%BB%9A%E5%8A%A8%E8%A1%8C%E4%B8%BA
function scrollToPosition(shouldScroll, position) {
  const isObject = typeof shouldScroll === 'object'; // 滚动到特定dom

  if (isObject && typeof shouldScroll.selector === 'string') {
    // getElementById would still fail if the selector contains a more complicated query like #main[data-attr]
    // but at the same time, it doesn't make much sense to select an element with an id and an extra selector
    const el = hashStartsWithNumberRE.test(shouldScroll.selector) // $flow-disable-line
      ? document.getElementById(shouldScroll.selector.slice(1)) // $flow-disable-line
      : document.querySelector(shouldScroll.selector);
    if (el) {
      let offset =
        shouldScroll.offset && typeof shouldScroll.offset === 'object'
          ? shouldScroll.offset
          : {};
      offset = normalizeOffset(offset);
      position = getElementPosition(el, offset);
    } else if (isValidPosition(shouldScroll)) {
      position = normalizePosition(shouldScroll);
    }
  } else if (isObject && isValidPosition(shouldScroll)) {
    // 直接滚动到指定位置
    position = normalizePosition(shouldScroll);
  }
  if (position) {
    window.scrollTo(position.x, position.y);
  }
}
```

获取滚动位置，是利用`_key`从`positionStore`上读取之前保存的位置信息  
scrollToPosition 的逻辑很清晰，其处理了滚动到指定 dom 和直接滚动到特定位置的场景

### 小结

- vue-router 处理滚动主要利用了 History API 可以保存状态的特性实现
- 在路由进入前保存滚动位置，并在下次路由变化时，尝试取回之前位置，在\$nextTick 中真正的处理滚动
- 其支持滚动到指定位置、指定 DOM、异步滚动等场景

## view 组件

- vue-router 内置了 `router-view`、`router-link` 两个组件
- 前者负责在匹配到路由记录后将对应路由组件渲染出来
- 后者支持用户在具有路由功能的应用中 (点击) 导航
- 我们先来看 `router-view` 组件

### router-view

router-view 的主要职责就是将路由组件渲染出来  
定义位于 src/components/view.js

```ts
// src/components/view.js

export default {
  name: 'RouterView',
  functional: true, // 函数式组件，没有this；https://cn.vuejs.org/v2/guide/render-function.html#函数式组件
  props: {
    name: {
      type: String,
      default: 'default',
    },
  }, // _为h即createElement，但router-view没有使用自身的h，而是使用了父节点的h
  render(/* h*/ _, /* context*/ { props, children, parent, data }) {
    // used by devtools to display a router-view badge
    data.routerView = true; // 标识当前组件为router-view // directly use parent context's createElement() function // so that components rendered by router-view can resolve named slots
    const h = parent.$createElement; // 使用父节点的渲染函数
    const name = props.name; // 命名视图
    const route = parent.$route; // 依赖父节点的$route，而在install.js中我们知道,所有组件访问到的$route其实都是_routerRoot._route，即Vue根实例上的_route；当路由被确认后，调用updateRoute时，会更新_routerRoot._route，进而导致router-view组件重新渲染 // 缓存
    const cache = parent._routerViewCache || (parent._routerViewCache = {}); // determine current view depth, also check to see if the tree // has been toggled inactive but kept-alive.

    let depth = 0; // 当前router-view嵌套深度
    let inactive = false; // 是否被keep-alive包裹并处于非激活状态 // 向上查找，计算depth、inactive // 当parent指向Vue根实例结束循环
    while (parent && parent._routerRoot !== parent) {
      const vnodeData = parent.$vnode ? parent.$vnode.data : {};
      if (vnodeData.routerView) {
        depth++;
      } // 处理keep-alive // keep-alive组件会添加keepAlive=true标识 // https://github.com/vuejs/vue/blob/52719ccab8fccffbdf497b96d3731dc86f04c1ce/src/core/components/keep-alive.js#L120

      if (vnodeData.keepAlive && parent._directInactive && parent._inactive) {
        inactive = true;
      }
      parent = parent.$parent;
    }

    data.routerViewDepth = depth; // render previous view if the tree is inactive and kept-alive // 如果当前组件树被keep-alive包裹，且处于非激活状态，则渲染之前保存的视图

    if (inactive) {
      const cachedData = cache[name];
      const cachedComponent = cachedData && cachedData.component; // 找到缓存的组件
      if (cachedComponent) {
        // #2301
        // pass props
        // 传递缓存的props
        if (cachedData.configProps) {
          fillPropsinData(
            cachedComponent,
            data,
            cachedData.route,
            cachedData.configProps
          );
        }
        return h(cachedComponent, data, children);
      } else {
        // 未找到缓存的组件
        // render previous empty view
        return h();
      }
    } // 通过depth获取匹配的route record // 由于formatMatch是通过unshift添加父route record的 // 所以route.matched[depth]正好能取到匹配的route record

    const matched = route.matched[depth];
    const component = matched && matched.components[name]; // 取出路由组件 // render empty node if no matched route or no config component // 找不到，渲染空组件
    if (!matched || !component) {
      cache[name] = null;
      return h();
    } // cache component // 缓存组件

    cache[name] = { component }; // attach instance registration hook // this will be called in the instance's injected lifecycle hooks // 为路由记录绑定路由组件，在所有组件的beforeCreate、destoryed hook中调用，见install.js中的registerInstance方法 // 此方法只在router-view上定义了 // vm，val都为路由组件实例 // 如下 // matched.instances:{ //   default:VueComp, //   hd:VueComp2, //   bd:VueComp3 // }

    data.registerRouteInstance = (vm, val) => {
      // val could be undefined for unregistration
      const current = matched.instances[name];
      if (
        (val && current !== vm) || // 绑定
        (!val && current === vm)
      ) {
        // 若val不存在，则可视为解绑
        matched.instances[name] = val;
      }
    }; // also register instance in prepatch hook // in case the same component instance is reused across different routes // 当相同组件在不同路由间复用时，也需要为router-view绑定路由组件
    (data.hook || (data.hook = {})).prepatch = (_, vnode) => {
      matched.instances[name] = vnode.componentInstance;
    }; // register instance in init hook // in case kept-alive component be actived when routes changed // keep-alive组件被激活时，需要为router-view注册路由组件

    data.hook.init = (vnode) => {
      if (
        vnode.data.keepAlive &&
        vnode.componentInstance &&
        vnode.componentInstance !== matched.instances[name]
      ) {
        matched.instances[name] = vnode.componentInstance;
      }
    }; // route record设置了路由传参；动态路由传参；https://router.vuejs.org/zh/guide/essentials/passing-props.

    const configProps = matched.props && matched.props[name]; // save route and configProps in cachce // 如果设置了路由传参，则缓存起来，并将填充props

    if (configProps) {
      extend(cache[name], {
        route,
        configProps,
      });
      fillPropsinData(component, data, route, configProps);
    }
    return h(component, data, children);
  },
};
```

其被定义成一个函数式组件，这代表它没有状态和实例(this 上下文)，只接收了 name 来做命名视图  
我们重点看下 `render` 方法
由于其是一个函数式组件，所以很多操作是借助父节点来完成的

- 为了支持解析命名插槽，其没有使用自己的 `createElement` 方法，而是使用父节点的`createElement`方法
- 由于没有 `this` 上下文，无法通过`this.$route`获得当前路由对象，干脆就直接使用父节点的`$route`

可以看到添加了一个标志量 `routerView`，主要用来在 vue-devtools 中标识 view 组件和在查找深度时用  
然后声明了一个缓存对象 `_routerViewCache` 并赋值给 `cache` 变量，用来在 `keep-alive` 激活时快速取出被缓存的路由组件  
开始从当前节点往上查找 Vue 根实例，在查找的过程中计算出 `view` 组件的深度以及是否被 kepp-alive 包裹并处于 `inative` 状态  
`depth` 主要用来获取当前 view 对应的路由记录

- 前面说过，`vue-router`是支持嵌套路由的，对应的 view 也是可以嵌套的
- 而且在匹配路由记录时，有下面的逻辑，当一个路由记录匹配了，如果其还有父路由记录，则父路由记录肯定也是匹配的，其会一直向上查找，找到一个父记录，就通过 `unshift` 塞入 `route.matched` 数组中的，所以父记录肯定在前，子记录在后，当前精准匹配的记录在最后  
   见`src/util/route.js formatMatch方法`
- `depth` 的计算在遇到父 view 组件时，自增 1，通过不断向上查找，不断自增 `depth`，直到找到 Vue 根实例才停止
- 停止时`route.matched[depth]`值就是当前 view 对应的路由记录
- 有了路由记录，我们就可以从上取出对应的路由组件实例，然后渲染即可

我们先看非`inactive`状态是如何渲染路由组件实例的

- 通过`route.matched[depth]`取出当前 view 匹配的路由记录
- 然后再取出对应的路由组件实例
- 如果路由记录和路由组件实例有一个不存在，则渲染空结点，并重置`cache[name]`值
- 如果都能找到，则先把组件实例缓存下来  
  如果有配置动态路由参数，则把路由参数缓存到路由组件实例上，并调用 `fillPropsinData` 填充 `props`
- 调用 `h` 渲染对应的路由组件实例即可

当组件处于 `inactive` 状态时，我们就可以从 `cache` 中取出之前缓存的路由组件实例和路由参数，然后渲染就可以了

主流程如上，但还有一个重要的点没提

- 路由记录和路由组件实例是如何绑定的？
- 相信你已经注意到`data.registerRouteInstance` 方法，没错，他就是用来为路由记录绑定路由组件实例的

### registerInstance

我们先看下调用的地方  
主要在`src/install.js`的全局混入中

```ts
export function install(Vue){
...

// 注册全局混入
  Vue.mixin({
    beforeCreate () {
        ... 

      // 为router-view组件关联路由组件
      registerInstance(this, this)
    },
    destroyed () {
      // destroyed hook触发时，取消router-view和路由组件的关联
      registerInstance(this)
    }
  })
}
```

可以看到其在全局混入的 `beforeCreate`、`destroyed` 钩子中都有被调用  
前者传入了两个 vm 实例，后者只传入了一个 vm 实例  
我们看下实现，代码也位于 src/install.js 中

```ts
// 为路由记录、router-view关联路由组件
const registerInstance = (vm, callVal) => {
  let i = vm.$options._parentVnode; // 调用vm.$options._parentVnode.data.registerRouteInstance方法 // 而这个方法只在router-view组件中存在，router-view组件定义在(../components/view.js @71行) // 所以，如果vm的父节点为router-view，则为router-view关联当前vm，即将当前vm做为router-view的路由组件
  if (isDef(i) && isDef((i = i.data)) && isDef((i = i.registerRouteInstance))) {
    i(vm, callVal);
  }
};
```

可以看到其接收一个 `vm 实例`和 `callVal` 做为入参  
然后取了 `vm` 的父节点做为 i 的初值  
接着一步一步给 `i 赋值`，同时判断 i 是否定义  
到最后，i 的值为`vm.$options._parentVnode.data.registerRouteInstance`  
然后将两个入参传入 i 中调用  
**注意，这时的 i 是 vm 父节点上的方法，并不是 vm 上的方法**  
我们全局检索下 registerRouteInstance 关键字，发现其只被定义在了 view.js 中，也就是 router-view 组件中

- 结合上面一条，i 即 `registerRouteInstance` 是 vm 父节点上的方法，而只有 router-view 组件定义了 `registerRouteInstance`
- 所以，只有当 vm 是 router-view 的子节点时，`registerRouteInstance` 方法才会被调用
- `i(vm, callVal)`可以表达为 `vm._parentVnode.registerRouteInstance(vm,vm)`

看下 registerRouteInstance 的实现

```js
// src/components/view.js
    ...

// 为路由记录绑定路由组件，在所有组件的beforeCreate、destoryed hook中调用，见install.js中的registerInstance方法
    // 此方法只在router-view上定义了
    // vm，val都为路由组件实例
    // 如下
    // matched.instances:{
    //   default:VueComp,
    //   hd:VueComp2,
    //   bd:VueComp3
    // }
    data.registerRouteInstance = (vm, val) => {
      // val could be undefined for unregistration
      const current = matched.instances[name]
      if (
        (val && current !== vm) || // 绑定
        (!val && current === vm) // 若val不存在，则可视为解绑
      ) {
        matched.instances[name] = val
      }
    }
```

`matched` 保存的是当前匹配到的路由记录，`name` 是命名视图名  
如果 val 存在，并且当前路由组件和传入的不同，重新赋值  
如果 val 不存在，且当前路由组件和传入的相同，也重新赋值，但是此时 val 为 `undefined`，相当于解绑  
可以看到参数数量不同，一个函数实现了绑定和解绑的双重操作  
通过这个方法就完成了路由记录和路由组件实例的绑定与解绑操作  
这样就可以在 `view` 组件 `render` 时，通过 `route.matched[depth].components[name]`取到路由组件进行渲染  
还有些场景也需要进行绑定

- 当相同组件在不同路由间复用时，需要为路由记录绑定路由组件
- keep-alive 组件被激活时，需要为路由记录绑定路由组件

**小结**

- `router-view` 是一个函数式组件，有时需要借助父节点的能力，例如使用父节点的渲染函数来解析命名插槽
- 通过 `routerView` 来标识 view 组件，方便 vue-devtools 识别出 `view` 组件和确定 `view` 组件深度
- 通过向上查找，确定当前 `view` 的深度 `depth`，通过 `depth` 取到对应的路由记录
- 再取出通过 `registerInstance` 绑定的路由组件实例
- 如果有动态路由参数，则先填充 `props` 然后再渲染
- 如果 `view` 被 `keep-alive` 包裹并且处于 `inactive` 状态，则从缓存中取出路由组件实例并渲染

### 如何触发重新渲染

在导航解析的章节，我们提过，导航解析成功后 会调用 `updateRoute` 方法，重新为全局的 `_routerRoot._route` 即 `$route` 赋值

```ts
// src/history/base.js

// 更新路由，触发afterEach钩子
  updateRoute (route: Route) {
    const prev = this.current
    this.current = route// 更新current

    this.cb && this.cb(route) // 调用updateRoute回调，回调中会重新为_routerRoot._route赋值，进而触发router-view的重新渲染
    ...
  }
```

在 view 组件中，会使用 `$parent.$route`即全局的 `_routerRoot._route`

```ts
   // src/components/view.js

  ...
  render (/* h*/_, /* context*/{ props, children, parent, data }) {
        ...

        const route = parent.$route // 依赖父节点的$route，而在install.js中我们知道,所有组件访问到的$route其实都是_routerRoot._route，即Vue根实例上的_route；当路由被确认后，调用updateRoute时，会更新_routerRoot._route，进而导致router-view组件重新渲染

        ...
    }
```

而在`install.js`的全局混入中，将`_route`定义为响应式的，依赖了`_route`的地方，在 `_route` 发生变化时，都会重新渲染

```ts
// src/install.js

  // 注册全局混入
  Vue.mixin({
    beforeCreate () {
         ...
        // 响应式定义_route属性，保证_route发生变化时，组件(router-view)会重新渲染
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      }
  })
```

这样就完成了渲染的闭环,`view`依赖`$route`,导航解析成功更新`$route`，触发`view`渲染  
看完了 `view` 组件，我们来看下另外一个组件 `router-link`

## link 组件

- router-link 组件被定义在 src/components/link.js 中
- 主要用来支持用户在具有路由功能的应用中 (点击) 导航

### router-link

```ts
/* @flow */
import { createRoute, isSameRoute, isIncludedRoute } from '../util/route';
import { extend } from '../util/misc';
import { normalizeLocation } from '../util/location';
import { warn } from '../util/warn';

// work around weird flow bug
const toTypes: Array<Function> = [String, Object];
const eventTypes: Array<Function> = [String, Array];
const noop = () => {};

export default {
  name: 'RouterLink',
  props: {
    to: {
      type: toTypes, // string | Location
      required: true,
    },
    tag: {
      type: String,
      default: 'a', // 默认a标签
    },
    exact: Boolean, // 是否精确匹配
    append: Boolean, // 是否追加
    replace: Boolean, // 为true，调用router.replace否则调用router.push
    activeClass: String, // 激活的类名
    exactActiveClass: String, // 精确匹配的类名
    ariaCurrentValue: {
      // 无障碍化
      type: String,
      default: 'page',
    },
    event: {
      type: eventTypes, // 触发导航的事件
      default: 'click',
    },
  },
  render(h: Function) {
    const router = this.$router;
    const current = this.$route;
    const { location, route, href } = router.resolve(
      this.to,
      current,
      this.append
    ); // 解析目标位置
    const classes = {};
    const globalActiveClass = router.options.linkActiveClass;
    const globalExactActiveClass = router.options.linkExactActiveClass; // Support global empty active class

    const activeClassFallback =
      globalActiveClass == null ? 'router-link-active' : globalActiveClass;
    const exactActiveClassFallback =
      globalExactActiveClass == null
        ? 'router-link-exact-active'
        : globalExactActiveClass;
    const activeClass =
      this.activeClass == null ? activeClassFallback : this.activeClass;
    const exactActiveClass =
      this.exactActiveClass == null
        ? exactActiveClassFallback
        : this.exactActiveClass; // 目标route，用来比较是否和当前route是相同route

    const compareTarget = route.redirectedFrom
      ? createRoute(null, normalizeLocation(route.redirectedFrom), null, router)
      : route;
    classes[exactActiveClass] = isSameRoute(current, compareTarget);
    classes[activeClass] = this.exact
      ? classes[exactActiveClass]
      : isIncludedRoute(current, compareTarget); // 非精准匹配时，判断目标route path是否包含当前route path
    const ariaCurrentValue = classes[exactActiveClass]
      ? this.ariaCurrentValue
      : null; // 事件处理

    const handler = (e) => {
      if (guardEvent(e)) {
        if (this.replace) {
          router.replace(location, noop);
        } else {
          router.push(location, noop);
        }
      }
    };

    const on = { click: guardEvent };
    if (Array.isArray(this.event)) {
      this.event.forEach((e) => {
        on[e] = handler;
      });
    } else {
      on[this.event] = handler;
    }
    const data: any = { class: classes }; // 读取作用域插槽

    const scopedSlot =
      !this.$scopedSlots.$hasNormal &&
      this.$scopedSlots.default &&
      this.$scopedSlots.default({
        href,
        route,
        navigate: handler,
        isActive: classes[activeClass],
        isExactActive: classes[exactActiveClass],
      });

    if (scopedSlot) {
      // 作用域插槽仅有一个子元素
      if (scopedSlot.length === 1) {
        return scopedSlot[0];
      } else if (scopedSlot.length > 1 || !scopedSlot.length) {
        // 作用域插槽提供多个后代或未提供后，给予提示
        if (process.env.NODE_ENV !== 'production') {
          warn(
            false,
            `RouterLink with to="${this.to}" is trying to use a scoped slot but it didn't provide exactly one child. Wrapping the content with a span element.`
          );
        } // 有多个后代时，在外层用一个span包裹
        return scopedSlot.length === 0 ? h() : h('span', {}, scopedSlot);
      }
    } // tag为a

    if (this.tag === 'a') {
      data.on = on;
      data.attrs = { href, 'aria-current': ariaCurrentValue };
    } else {
      // tag不为a，则找后代首个a绑定事件
      // find the first <a> child and apply listener and href

      const a = findAnchor(this.$slots.default);
      if (a) {
        // in case the <a> is a static node
        a.isStatic = false;
        const aData = (a.data = extend({}, a.data));
        aData.on = aData.on || {}; // transform existing events in both objects into arrays so we can push later // a上可能还绑定有其他事件，需要兼容
        for (const event in aData.on) {
          const handler = aData.on[event];
          if (event in on) {
            aData.on[event] = Array.isArray(handler) ? handler : [handler];
          }
        } // append new listeners for router-link // 绑定其他事件处理器
        for (const event in on) {
          if (event in aData.on) {
            // on[event] is always a function
            aData.on[event].push(on[event]);
          } else {
            aData.on[event] = handler;
          }
        }
        const aAttrs = (a.data.attrs = extend({}, a.data.attrs));
        aAttrs.href = href;
        aAttrs['aria-current'] = ariaCurrentValue;
      } else {
        // doesn't have <a> child, apply listener to self
        // 没找到，则给当前元素绑定事件
        data.on = on;
      }
    }

    return h(this.tag, data, this.$slots.default);
  },
};

// 特殊场景，点击不做跳转响应
function guardEvent(e) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return; // don't redirect when preventDefault called
  if (e.defaultPrevented) return; // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return; // don't redirect if `target="_blank"`
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute('target');
    if (/\b_blank\b/i.test(target)) return;
  } // this may be a Weex event which doesn't have this method
  if (e.preventDefault) {
    e.preventDefault();
  }
  return true;
}

// 递归查找后代a标签
function findAnchor(children) {
  if (children) {
    let child;
    for (let i = 0; i < children.length; i++) {
      child = children[i];
      if (child.tag === 'a') {
        return child;
      }
      if (child.children && (child = findAnchor(child.children))) {
        return child;
      }
    }
  }
}
```

- 其实现就是一个普通的组件，实现了点击时跳转到 `to` 对应的路由功能
- 由于支持点击时需要标识样式类、精准匹配 `exact` 场景，所以通过 `sameRoute`、`isIncludedRoute` 来实现样式类的标识和精准匹配标识
- 在点击时，屏蔽了部分特殊场景，如点击时同时按下 `ctrl`、`alt`、`shift` 等 `control keys` 时，不做跳转
- 看完组件后，我们再来看看 `router` 还给我们提供哪些实例方法

## 实例属性、方法

- router 对外暴露了很多属性和方法
- 这些属性和方法在前面的源码部分也都有用过

### 实例属性

- `router.app`
  - 配置了 `router` 的 Vue 根实例
- `router.mode`
  - 路由使用的模式
- `router.currentRoute`
  - 当前路由对象，等同于 `this.$route`

### 实例方法

用注册全局导航守卫

- `router.beforeEach`
- `router.beforeResolve`
- `router.afterEach`

编程式导航相关

- `router.push`
- `router.replace`
- `router.go`
- `router.back`
- `router.forward`

服务端渲染相关

- `router.getMatchedComponents`  
   返回目标位置或是当前路由匹配的组件数组 (是数组的定义/构造类，不是实例)
- `router.onReady`
  该方法把一个回调排队，在路由完成初始导航时调用，这意味着它可以解析所有的异步进入钩子和路由初始化相关联的异步组件
- `router.onError`
  注册一个回调，该回调会在路由导航过程中出错时被调用

动态路由

- router.addRoutes
  动态添加路由规则

解析

- `router.resolve` - 传入一个对象，尝试解析并返回一个目标位置
