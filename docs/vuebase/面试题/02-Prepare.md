# Vue 面试题 2

[[toc]]

## 1.Vue.use 是干什么的?原理是什么?

- Vue.use 是用来使用插件的，我们可以在插件中扩展全局组件、指令、原型方法等。
- 会调用插件的 `install` 方法，将 Vue 的构造函数默认传入，这样在插件中可以使用 Vue 无需依赖 Vue 库

```js
Vue.use = function (plugin: Function | Object) {
    // 插件不能重复的加载 插件缓存
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {  // 如果已经有插件 直接返回
        return this
    }
    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)  // install方法的第一个参数是Vue的构造函数，其他参数是Vue.use中除了第一个参数的其他参数 // 将Vue 放入到数组中
    if (typeof plugin.install === 'function') { // 调用插件的install方法
        plugin.install.apply(plugin, args)  Vue.install = function(Vue,args){}
    } else if (typeof plugin === 'function') { // 插件本身是一个函数，直接让函数执行
        plugin.apply(null, args)
    }
    installedPlugins.push(plugin) // 缓存插件
    return this
}
```

> 源码位置: src/core/global-api/use.js:5

## 2.vue-router 有几种钩子函数?具体是什么及执行流程是怎样的?

路由钩子的执行流程, 钩子函数种类有:全局守卫、路由守卫、组件守卫

#完整的导航解析流程:

1. ① 导航被触发。
2. ② 在失活的组件里调用 `beforeRouteLeave` 守卫。
3. ③ 调用全局的 `beforeEach` 守卫。
4. ④ 在重用的组件里调用 `beforeRouteUpdate` 守卫 (2.2+)。
5. ⑤ 在路由配置里调用 `beforeEnter`。
6. ⑥ 解析异步路由组件。
7. ⑦ 在被激活的组件里调用 `beforeRouteEnter`。
8. ⑧ 调用全局的 `beforeResolve` 守卫 (2.5+)。
9. ⑨ 导航被确认。
10. ⑩ 调用全局的 `afterEach` 钩子。
11. ⑪ 触发 DOM 更新。
12. ⑫ 调用 `beforeRouteEnter` 守卫中传给 `next` 的回调函数，创建好的组件实例会作为回调函数的参数传入。

## 3.vue-router 两种模式的区别？

hash 模式、history 模式

- `hash` 模式：`hash + hashChange` 兼容性好但是不美观
- `history` 模式 : `historyApi+popState` 虽然美观，但是刷新会出现 404 需要后端进行配置

## 4.函数式组件的优势及原理

函数式组件的特性,无状态、无生命周期、无 this。但是性能高 正常组件是一个类继承了 Vue， 函数式组件就是普通的函数，没有 `new` 的过程，也没有 `init`、`prepatch`

```js
if (isTrue(Ctor.options.functional)) {
  // 函数式组件
  // 带有 functional 的属性的就是函数式组件
  return createFunctionalComponent(Ctor, propsData, data, context, children);
}

// extract listeners, since these needs to be treated as
// child component listeners instead of DOM listeners
const listeners = data.on; // 处理事件
// replace with listeners with .native modifier
// so it gets processed during parent component patch.
data.on = data.nativeOn; // 处理原生事件

// install component management hooks onto the placeholder node
installComponentHooks(data); // 初始化组件钩子方法, 安装组件相关钩子 （函数式组件没有调用此方法，从而性能高于普通组件）
```

> 源码位置: src/core/vdom/create-component.js:164、src/core/vdom/create-functional-component.js:5

## 5.v-if 与 v-for 的优先级

v-for 和 v-if 不要在同一个标签中使用,因为解析时先解析 v-for 在解析 v-if。如果遇到需要同时使用时可以考虑写成计算属性的方式。

```js
if (el.staticRoot && !el.staticProcessed) {
  return genStatic(el, state);
} else if (el.once && !el.onceProcessed) {
  return genOnce(el, state);
} else if (el.for && !el.forProcessed) {
  return genFor(el, state); // v-for
} else if (el.if && !el.ifProcessed) {
  return genIf(el, state); // v-if
}
```

> 源码位置: src/compiler/codegen/index.js:55

## 6.组件中写 name 选项又哪些好处及作用?

- 可以通过名字找到对应的组件 (递归组件)
- 可用通过 name 属性实现缓存功能 (keep-alive)
- 可以通过 name 来识别组件 (跨级组件通信时非常重要)

```js
Vue.extend = function () {
  if (name) {
    Sub.options.components[name] = Sub;
  }
};
```

> 源码位置: src/core/vdom/create-element.js:111

## 7.Vue 事件修饰符有哪些？其实现原理是什么?

事件修饰符有：`.capture`、`.once`、`.passive` 、`.stop`、`.self`、`.prevent`、

```js
//① 生成 ast 时处理
export function addHandler(
  el: ASTElement,
  name: string,
  value: string,
  modifiers: ?ASTModifiers,
  important?: boolean,
  warn?: ?Function,
  range?: Range,
  dynamic?: boolean
) {
  modifiers = modifiers || emptyObject;
  // check capture modifier
  if (modifiers.capture) {
    // 如果是 capture 加!
    delete modifiers.capture;
    name = prependModifierMarker('!', name, dynamic);
  }
  if (modifiers.once) {
    // 如果是 once 加~
    delete modifiers.once;
    name = prependModifierMarker('~', name, dynamic);
  }
  /_ istanbul ignore if _/;
  if (modifiers.passive) {
    // 如果是 passive 加&
    delete modifiers.passive;
    name = prependModifierMarker('&', name, dynamic);
  }
}
```

> 源码位置: src/compiler/helpers.js:69

```js
//②codegen 时处理
const genGuard = (condition) => `if(${condition})return null;`;
const modifierCode: { [key: string]: string } = {
  stop: '$event.stopPropagation();', // 增加阻止默认事件
  prevent: '$event.preventDefault();', // 阻止默认行为
  self: genGuard(`$event.target !== $event.currentTarget`), // 点击是否是自己
};
for (const key in handler.modifiers) {
  if (modifierCode[key]) {
    genModifierCode += modifierCode[key];
  }
  if (genModifierCode) {
    code += genModifierCode;
  }
  const handlerCode = isMethodPath
    ? `return ${handler.value}($event)`
    : isFunctionExpression
    ? `return (${handler.value})($event)`
    : isFunctionInvocation
    ? `return ${handler.value}`
    : handler.value;
  return `function($event){${code}${handlerCode}}`;
}

//③ 处理 on 事件
for (name in on) {
  def = cur = on[name];
  old = oldOn[name];
  event = normalizeEvent(name); // 处理& ! ~
  if (isTrue(event.once)) {
    cur = on[name] = createOnceHandler(event.name, cur, event.capture);
  }
  add(event.name, cur, event.capture, event.passive, event.params); // 调用 addEventListener 绑定事件
}
```

> 源码位置: src/compiler/codegen/events.js:42  
> 源码位置: src/core/vdom/helpers/update-listeners.js:65

## 8.Vue.directive 源码实现?

把定义的内容进行格式化挂载到 `Vue.options` 属性上

```js
ASSET_TYPES.forEach((type) => {
  Vue[type] = function (
    id: string,
    definition: Function | Object
  ): Function | Object | void {
    if (!definition) {
      return this.options[type + 's'][id];
    } else {
      // 如果是指令 将指令的定义包装成对象
      if (type === 'directive' && typeof definition === 'function') {
        definition = { bind: definition, update: definition };
      }
      this.options[type + 's'][id] = definition; // 将指令的定义绑定在 Vue.options 上
      return definition;
    }
  };
});
```

> 源码位置: core/global-api/assets.js

## 9.如何理解自定义指令?

指令的实现原理，可以从编译原理=>代码生成=>指令钩子实现进行概述

1. 在生成 `ast` 语法树时，遇到指令会给当前元素添加 `directives` 属性
2. 通过 `genDirectives` 生成指令代码
3. 在 `patch` 前将指令的钩子提取到 `cbs` 中,在 `patch` 过程中调用对应的钩子
4. 当执行指令对应钩子函数时，调用对应指令定义的方法

```js
export function addDirective(
  el: ASTElement,
  name: string,
  rawName: string,
  value: string,
  arg: ?string,
  isDynamicArg: boolean,
  modifiers: ?ASTModifiers,
  range?: Range
) {
  (el.directives || (el.directives = [])).push(
    rangeSetItem(
      {
        // 给元素添加directives属性
        name,
        rawName,
        value,
        arg,
        isDynamicArg,
        modifiers,
      },
      range
    )
  );
  el.plain = false;
}
function genDirectives(el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives;
  if (!dirs) return;
  let res = 'directives:[';
  let hasRuntime = false;
  let i, l, dir, needRuntime;
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i];
    needRuntime = true;
    if (needRuntime) {
      hasRuntime = true;
      // 将指令生成字符串directives:[{name:'def',rawName:'v-def'}]...
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value
          ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}`
          : ''
      }${dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''}${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`;
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']';
  }
}
```

```js
const hooks = ['create', 'activate', 'update', 'remove', 'destroy'];
const { modules, nodeOps } = backend; // // modules包含指令对应的hook
for (i = 0; i < hooks.length; ++i) {
  cbs[hooks[i]] = [];
  for (j = 0; j < modules.length; ++j) {
    // 格式化的结果{create:[hook],update:[hook],destroy:[hook]}
    if (isDef(modules[j][hooks[i]])) {
      cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }
}
```

```js
export default {
  // 无论更新创建销毁调用的都是 updateDirectives方法
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives(vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode);
  },
};

function updateDirectives(oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (oldVnode.data.directives || vnode.data.directives) {
    // 创建更新都调用此方法
    _update(oldVnode, vnode); // 指令的核心方法
  }
}

function _update(oldVnode, vnode) {
  const isCreate = oldVnode === emptyNode;
  const isDestroy = vnode === emptyNode;
  // 获取指令名称
  const oldDirs = normalizeDirectives(
    oldVnode.data.directives,
    oldVnode.context
  );
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context);

  const dirsWithInsert = [];
  const dirsWithPostpatch = [];

  let key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // 没有旧的 说明是绑定 调用bind钩子
      // new directive, bind
      callHook(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // 存在指令则是更新操作
      // existing directive, update
      dir.oldValue = oldDir.value;
      dir.oldArg = oldDir.arg;
      callHook(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        // 如果有componentUpdated方法
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    // 如果有insert钩子
    const callInsert = () => {
      // 生成回调方法
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      // 是创建增加insert钩子
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    // 如果有componentUpdated在次合并钩子
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    // 否则就是调用卸载钩子
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}
```

> 源码位置: src/compiler/helpers.js:42  
> 源码位置: src/compiler/codegen/index.js:309  
> 源码位置:src/core/vdom/patch:70  
> 源码位置:src/core/vdom/modules/directives:7

## 10.谈一下你对 vuex 的个人理解

vuex 是专门为 vue 提供的全局状态管理系统，用于多个组件中数据共享、数据缓存等。（无法持久化、内部核心原理是通过创造一个全局实例 new Vue）

衍生的问题 action 和 mutation 的区别
核心方法: replaceState、subscribe、registerModule、namespace(modules)

## 11.Vue 中 slot 是如何实现的？什么时候用它?

普通插槽（模板传入到组件中，数据采用父组件数据）和作用域插槽（在父组件中访问子组件数据）

<div align="center"><img :src="$withBase('/images/vuebase/n-slot.png')" alt="vuebase/n-slot.png"></div>

```js
const templateCompiler = require('vue-template-compiler');
let r = templateCompiler.compile(`
<div>
    <slot name="title"></slot>
    <slot name="content"></slot>
</div>`);
// with(this){return _c('div',[_t("title"),_v(" "),_t("content")],2)}
console.log(r.render);

let r1 = templateCompiler.compile(`
<my>
    <h1 slot="title">标题</h1>
    <div slot="content">内容</div>
</my>`);
/**
with(this){ 
    return _c('my',[
        _c('h1',{attrs:{"slot":"title"},slot:"title"},[_v("标题")]),_v(" "),
        _c('div',{attrs:{"slot":"content"},slot:"content"},[_v("内容")])
    ])
}
**/
console.log(r1.render);
```

<div align="center"><img :src="$withBase('/images/vuebase/slot-scope.png')" alt="vuebase/slot-scope.png"></div>

```js
let r3 = templateCompiler.compile(`
<div>
    <slot :article="{title:'标题',content:'内容'}"></slot>
</div>`);
// with(this){return _c('div',[_t("default",null,{"article":{title:'标题',content:'内容'}})],2)}
console.log(r3.render);

let r4 = templateCompiler.compile(`
<my>
    <template slot-scope="{article}">
        <h1 slot="article.title">标题</h1>
        <div slot="article.content">内容</div>
    </template>
</my>`);
/**
with(this){return _c('my',
    {scopedSlots:_u([
        {key:"default",fn:function({article}){
                return [
                    _c('h1',{attrs:{"slot":"article.title"},slot:"article.title"},[_v("标题")]),
                    _v(" "),
                    _c('div',{attrs:{"slot":"article.content"},slot:"article.content"},[_v("内容")])
                ]
            }
        }
    ])
})}
 */
console.log(r4.render);
```

> 普通插槽，渲染在父级， 作用域插槽在组件内部渲染！

## 12.keep-alive 平时在哪使用？原理是?

- keep-alive 主要是缓存，采用的是 LRU 算法。 最近最久未使用法。
- 使用 keep-alive 包裹动态组件时, 会对组件进行缓存。避免组件的重新创建

```vue
<keep-alive :include="whiteList" :exclude="blackList" :max="count">
     <component :is="component"></component>
</keep-alive>
```

```vue
<keep-alive :include="whiteList" :exclude="blackList" :max="count">
    <router-view></router-view>
</keep-alive>
```

> 原理地址：src/core/components/keep-alive.js

### 实现原理

```js
export default {
  name: 'keep-alive',
  abstract: true, // 不会放到对应的lifecycle

  props: {
    include: patternTypes, // 白名单
    exclude: patternTypes, // 黑名单
    max: [String, Number] // 缓存的最大个数
  },

  created () {
    this.cache = Object.create(null) // 缓存列表
    this.keys = []  // 缓存的key列表
  },

  destroyed () {
    for (const key in this.cache) { // keep-alive销毁时 删除所有缓存
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () { // 监控缓存列表
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render () {
    const slot = this.$slots.default
    const vnode: VNode = getFirstComponentChild(slot) 、// 获得第一个组件
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      if ( // 获取组件名 看是否需要缓存，不需要缓存则直接返回
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key // 生成缓存的key
      if (cache[key]) { // 如果有key 将组件实例直接复用
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key) // lru算法
      } else {
        cache[key] = vnode // 缓存组件
        keys.push(key)
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode) // 超过最大限制删除第一个
        }
      }

      vnode.data.keepAlive = true // 在firstComponent的vnode中增加keep-alive属性
    }
    return vnode || (slot && slot[0])
  }
}
```

- keep-alive 第一次渲染的时候，会将其第一个子组件，缓存起来。
- 当组件后续在次被激活时，会复用上一次缓存的实例进行渲染。

> src\core\vdom\patch.js:210

```js
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data;
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
    if (isDef((i = i.hook)) && isDef((i = i.init))) {
      i(vnode, false /* hydrating */);
    }
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue);
      insert(parentElm, vnode.elm, refElm); // 将原来的elm，插入到页面中
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
      }
      return true;
    }
  }
}
```

> src\core\vdom\create-component.js:36

```js
const componentVNodeHooks = {
  init(vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive // 有keepAlive, 不在执行组件的初始化流程
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      const child = (vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      ));
      //  组件挂载 当前组件实例中 包含$el属性
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },
};
```

## 13.\$refs 是如何实现的?

将真实 DOM 或者组件实例挂载在当前实例的`$refs` 属性上

```js
export function registerRef(vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref; // 获取 ref
  if (!isDef(key)) return;

  const vm = vnode.context;
  const ref = vnode.componentInstance || vnode.elm; // 如果是组件则采用实例 否则真是 dom
  const refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      // 在v-for中是数组
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}
```

## 14.vue 中使用了哪些设计模式?

- 工厂模式 - 传入参数即可创建实例 (createElement)  
   根据传入的参数不同返回不同的实例
  ```js
  export function _createElement(
    context: Component,
    tag?: string | Class<Component> | Function | Object,
    data?: VNodeData,
    children?: any,
    normalizationType?: number
  ): VNode | Array<VNode> {
    // ...
    if (typeof tag === 'string') {
      let Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        vnode = new VNode(
          config.parsePlatformTagName(tag),
          data,
          children,
          undefined,
          undefined,
          context
        );
      } else if (
        (!data || !data.pre) &&
        isDef((Ctor = resolveAsset(context.$options, 'components', tag)))
      ) {
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        vnode = new VNode(tag, data, children, undefined, undefined, context);
      }
    } else {
      vnode = createComponent(tag, data, context, children);
    }
    // ....
  }
  ```
- 单例模式  
   单例模式就是整个程序有且仅有一个实例。
  ```js
  export function install(_Vue) {
    if (Vue && _Vue === Vue) {
      if (__DEV__) {
        console.error(
          '[vuex] already installed. Vue.use(Vuex) should be called only once.'
        );
      }
      return;
    }
    Vue = _Vue;
    applyMixin(Vue);
  }
  ```
- 发布-订阅模式  
   订阅者把自己想订阅的事件注册到调度中心，当该事件触发时候，发布者发布该事件到调度中心，由调度中心统一调度订阅者注册到调度中心的处理代码。
  ```js
  Vue.prototype.$on = function (
    event: string | Array<string>,
    fn: Function
  ): Component {
    const vm: Component = this;
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm;
  };
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this;
    let cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      const args = toArray(arguments, 1);
      const info = `event handler for "${event}"`;
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm;
  };
  ```
- 观察者模式 :watcher&dep 的关系
- 代理模式 (防抖和节流) => 返回替代 （例如：Vue3 中的 proxy）  
   代理模式给某一个对象提供一个代理对象,并由代理对象控制对原对象的引用。
- 装饰模式: @装饰器的用法
- 中介者模式 => vuex  
   中介者是一个行为设计模式,通过提供一个统一的接口让系统的不同部分进行通信
- 策略模式 策略模式指对象有某个行为,但是在不同的场景中,该行为有不同的实现方案
  ```js
  function mergeField(key) {
    const strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  ```
- 外观模式、适配器模式、迭代器模式、模板方法模式 .....

## 15.谈谈 Vue3 和 Vue2 的区别?

- 对 `TypeScript` 支持不友好（所有属性都放在了 this 对象上，难以推倒组件的数据类型）
- 大量的 `API` 挂载在 Vue 对象的原型上，难以实现 `TreeShaking`。
- 架构层面对跨平台 dom 渲染开发支持不友好
- `CompositionAPI`。受 `ReactHook` 启发
- 对虚拟 DOM 进行了重写、对模板的编译进行了优化操作...

## 16. Vue 组件间传值的方式及之间区别

- `props` 和 `$emit` 父组件向子组件传递数据是通过`prop`传递的，子组件传递数据给父组件是通过`$emit`触发事件来做到的
- `$parent`,`$children` 获取当前组件的父组件和当前组件的子组件
- `$attrs`和`$listeners` A->B->C。Vue 2.4 开始提供了`$attrs`和`$listeners`来解决这个问题
- 父组件中通过`provide`来提供变量，然后在子组件中通过`inject`来注入变量。
- `$refs` 获取实例
- `envetBus` 平级组件数据传递 这种情况下可以使用中央事件总线的方式
- `vuex` 状态管理
- ...

### 1).props 实现原理

```vue
<my-component a="1" b="2" c="3" @xxx @qqq @click.native></my-component>
```

> src\core\vdom\create-component.js:192

```js
const vnode = new VNode( // 创建组件虚拟节点
  `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
  data,
  undefined,
  undefined,
  undefined,
  context,
  { Ctor, propsData, listeners, tag, children }, // 包含组件的属性及事件
  asyncFactory
);
```

> src\core\instance\init.js:36

```js
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData; // 将属性添加到$options中
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
```

> src\core\instance\state.js 属性的初始化

```js
function initProps(vm: Component, propsOptions: Object) {
  // propsOptions 校验属性
  const propsData = vm.$options.propsData || {}; // 获取用户的数据
  const props = (vm._props = {});
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = (vm.$options._propKeys = []);
  const isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    // 如果时根元素，属性需要定义成响应式的
    toggleObserving(false);
  }
  for (const key in propsOptions) {
    // 用户用户的 props:{}
    keys.push(key);
    const value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key);
      if (
        isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)
      ) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        );
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
              `overwritten whenever the parent component re-renders. ` +
              `Instead, use a data or computed property based on the prop's ` +
              `value. Prop being mutated: "${key}"`,
            vm
          );
        }
      });
    } else {
      defineReactive(props, key, value); // 定义到_props中
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key); // 将_props代理到实例上
    }
  }
  toggleObserving(true);
}
```

### 2).$on , $emit

```vue
<my-component @change="fn" @change="fn" @change="fn"></my-component>
// this.$on('change')

<script>
this.$emit('change');
</script>
```

```js
opts._parentListeners = vnodeComponentOptions.listeners; // 用户在组件上定义的事件
```

> src\core\instance\events.js:12

```js
export function initEvents(vm: Component) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners); // 更新组件的事件
  }
}
```

```js
export function updateComponentListeners(
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm; // 更新事件,采用add 、 remove方法
  updateListeners(
    listeners,
    oldListeners || {},
    add,
    remove,
    createOnceHandler,
    vm
  );
  target = undefined;
}
```

```js
function add(event, fn) {
  target.$on(event, fn);
}
function remove(event, fn) {
  target.$off(event, fn);
}
```

> 内部采用的就是发布订阅模式来进行实现

### 3).$parent,$children

> src\core\instance\lifecycle.js:32

```js
export function initLifecycle(vm: Component) {
  const options = vm.$options;
  // locate first non-abstract parent
  let parent = options.parent;
  if (parent && !options.abstract) {
    // 排除抽象组件
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm); // 让父实例记住当前组件实例
  }

  vm.$parent = parent; // 增加$parent属性 指向父实例
  vm.$root = parent ? parent.$root : vm;
  // ...
}
```

### 4).$attrs, $listeners

```vue
<my-component a="1" b="2"></my-component> => $vnode.data.attrs = {a:1,b:2}
```

```js
export function initRender(vm: Component) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  const options = vm.$options;
  const parentVnode = (vm.$vnode = options._parentVnode); // the placeholder node in parent tree 获取占位符节点
  // ...

  const parentData = parentVnode && parentVnode.data; // 占位符节点上的数据
  defineReactive(
    vm,
    '$attrs',
    (parentData && parentData.attrs) || emptyObject,
    null,
    true
  );
  defineReactive(
    vm,
    '$listeners',
    options._parentListeners || emptyObject,
    null,
    true
  );
}
```

### 5).provide & inject

> src\core\instance\inject.js:7

```js
export function initProvide(vm: Component) {
  const provide = vm.$options.provide;
  if (provide) {
    // 将用户定义的provide 挂载到_provided
    vm._provided = typeof provide === 'function' ? provide.call(vm) : provide;
  }
}
export function initInjections(vm: Component) {
  // inject:[a,b,c]
  const result = resolveInject(vm.$options.inject, vm); // 不停的向上查找 inject的属性
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach((key) => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
              `overwritten whenever the provided component re-renders. ` +
              `injection being mutated: "${key}"`,
            vm
          );
        });
      } else {
        defineReactive(vm, key, result[key]);
      }
    });
    toggleObserving(true);
  }
}
```

### 6).\$ref

> src\core\vdom\modules\ref.js:20

```js
export function registerRef(vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref; // 获取ref
  if (!isDef(key)) return;

  const vm = vnode.context;
  const ref = vnode.componentInstance || vnode.elm; // 当前组件的实例 或者 组件的真实节点
  const refs = vm.$refs;
  if (isRemoval) {
    // 删除ref
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        // 在v-for中是数组
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}
```

## 17. $attrs是为了解决什么问题出现的，provide和inject不能解决它能解决的问题吗？ v-bind="$attrs" v-on="\$listeners"

`$attrs` 主要的作用就是实现批量传递数据。`provide/inject` 更适合应用在插件中，主要是实现跨级数据传递

## 18.Vue 中.sync 修饰符的作用，用法及实现原理

> src\compiler\parser\index.js:798

```js
if (modifiers.sync) {
     syncGen = genAssignmentCode(value, `$event`) // 转.async 改成 ${value} = xxx
     if (!isDynamic) {
         addHandler( // 添加update事件
             el,
             `update:${camelize(name)}`,
             syncGen,
             null,
             false,
             warn,
             list[i]
         )
         if (hyphenate(name) !== camelize(name)) {
             addHandler(
                 el,
                 `update:${hyphenate(name)}`,
                 syncGen,
                 null,
                 false,
                 warn,
                 list[i]
             )
         }
     } else {
         // handler w/ dynamic event name
         addHandler(
             el,
             `"update:"+(${name})`,
             syncGen,
             null,
             false,
             warn,
             list[i],
             true // dynamic
         )
     }
 }
}
```

```js
let r5 = templateCompiler.compile(`
    <my :value.sync="xxxx"></my>
`);

// with(this){return _c('my',{attrs:{"value":xxxx},on:{"update:value":function($event){xxxx=$event}}})}
console.log(r5.render);
```

## 19. Vue 中使用了哪些设计模式?

- **单例模式** - 单例模式就是整个程序有且仅有一个实例
  ```js
  export function install(_Vue) {
    if (Vue && _Vue === Vue) {
      if (__DEV__) {
        console.error(
          '[vuex] already installed. Vue.use(Vuex) should be called only once.'
        );
      }
      return;
    }
    Vue = _Vue;
    applyMixin(Vue);
  }
  ```
- **工厂模式** - 传入参数即可创建实例 (createElement)
  ```js
  export function _createElement(
    context: Component,
    tag?: string | Class<Component> | Function | Object,
    data?: VNodeData,
    children?: any,
    normalizationType?: number
  ): VNode | Array<VNode> {
    // ...
    if (typeof tag === 'string') {
      let Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        vnode = new VNode(
          config.parsePlatformTagName(tag),
          data,
          children,
          undefined,
          undefined,
          context
        );
      } else if (
        (!data || !data.pre) &&
        isDef((Ctor = resolveAsset(context.$options, 'components', tag)))
      ) {
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        vnode = new VNode(tag, data, children, undefined, undefined, context);
      }
    } else {
      vnode = createComponent(tag, data, context, children);
    }
    // ....
  }
  ```
- **发布订阅模式** - 订阅者把自己想订阅的事件注册到调度中心，当该事件触发时候，发布者发布该事件到调度中心，由调度中心统一调度订阅者注册到调度中心的处理代码。
  ```js
  Vue.prototype.$on = function (
    event: string | Array<string>,
    fn: Function
  ): Component {
    const vm: Component = this;
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm;
  };
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this;
    let cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      const args = toArray(arguments, 1);
      const info = `event handler for "${event}"`;
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm;
  };
  ```
- **观察者模式** - watcher&dep 的关系
- **代理模式** - 代理模式给某一个对象提供一个代理对象,并由代理对象控制对原对象的引用。
  \_data 属性、proxy、防抖、节流 let p = new Proxy
- **装饰模式** - Vue2 装饰器的用法 （对功能进行增强 @）
- **中介者模式** - 中介者是一个行为设计模式,通过提供一个统一的接口让系统的不同部分进行通信。 Vuex
- **策略模式** - 策略模式指对象有某个行为,但是在不同的场景中,该行为有不同的实现方案。 mergeOptions
- **外观模式** - 提供了统一的接口，用来访问子系统中的一群接口。
- ...
