# Vue 面试题 1

[[toc]]

## 1.请说一下响应式数据的理解？

数组和对象类型当值变化时如何劫持到。对象内部通过 defineReactive 方法，使用 Object.defineProperty 将属性进行劫持（只会劫持已经存在的属性），数组则是通过重写数组方法来实现。

每个属性都拥有自己的 dep 属性，存放他所依赖的 watcher，当属性变化后会通知自己对应的 watcher 去更新 （其实后面会讲到每个对象类型自己本身也拥有一个 dep 属性，这个在\$set 面试题中在进行讲解）

## 快速 Mock:

```js
let state = { count: 0 };
// app.innerHTML = state.count;

// 1.将数据变成响应式数据
let active;
function defineReactive(obj) {
  for (let key in obj) {
    let value = obj[key];
    let dep = [];
    Object.defineProperty(obj, key, {
      get() {
        if (active) {
          dep.push(active);
        }
        return value;
      },
      set(newValue) {
        value = newValue;
        dep.forEach((fn) => fn());
      },
    });
  }
}
defineReactive(state);
const watcher = (fn) => {
  active = fn;
  fn();
  active = null;
};
watcher(() => {
  app.innerHTML = state.count;
});
watcher(() => {
  console.log(state.count);
});
```

## 2.Vue 如何检测数组变化？

数组考虑性能原因没有用 defineProperty 对数组的每一项进行拦截，而是选择重写数组（push,shift,pop,splice,unshift,sort,reverse）方法进行重写

在 Vue 中修改数组的索引和长度是无法监控到的。需要通过以上 7 种变异方法修改数组才会触发数组对应的 watcher 进行更新。数组中如果是对象数据类型也会进行递归劫持。

## 3.Vue 中模板编译原理？

如何将 template 转换成 render 函数(这里要注意的是我们在开发时尽量不要使用 template，因为将 template 转化成 render 方法需要在运行时进行编译操作会有性能损耗，同时引用带有 compiler 包的 vue 体积也会变大。默认.vue 文件中的 template 处理是通过 vue-loader 来进行处理的并不是通过运行时的编译 - 后面我们会说到默认 vue 项目中引入的 vue.js 是不带有 compiler 模块的)。

1. 将 template 模板转换成 `ast` 语法树 - `parserHTML`
2. 对静态语法做静态标记 - `markUp`
3. 重新生成代码 - `codeGen`

模板引擎的实现原理就是`new Function + with`来进行实现的

> vue-loader 中处理 template 属性主要靠的是 vue-template-compiler 模块

快速 Mock:

```html
<script src="./node_modules/vue-template-compiler/browser.js"></script>
<script>
  let { ast, render } = VueTemplateCompiler.compile("<div>hello world</div>");
  console.log(ast, render);
  const fn = new Function(render);
  console.log(fn.toString());
</script>
```

> 源码位置: `src/compiler/index.js:11`

## 4.生命周期钩子是如何实现

Vue 的生命周期钩子就是回调函数而已，当创建组件实例的过程中会调用对应的钩子方法

内部主要是使用 callHook 方法来调用对应的方法。核心是一个发布订阅模式，将钩子订阅好（内部采用数组的方式存储），在对应的阶段进行发布！

```js
function mergeHook(parentVal, childValue) {
  if (childValue) {
    if (parentVal) {
      return parentVal.concat(childValue);
    } else {
      return [childValue];
    }
  } else {
    return parentVal;
  }
}
function mergeOptions(parent, child) {
  let opts = {};
  for (let key in child) {
    opts[key] = mergeHook(parent[key], child[key]);
  }
  return opts;
}
function callHook(vm, key) {
  vm.options[key].forEach((hook) => hook());
}
function Vue(options) {
  this.options = mergeOptions(this.constructor.options, options);

  callHook(this, "beforeCreate");
}
Vue.options = {};
new Vue({
  beforeCreate() {
    console.log("before create");
  },
});
```

> 源码位置:src/core/util/options.js:146、core/instance/lifecycle.js:336

## 5.Vue.mixin 的使用场景和原理？

`Vue.mixin` 的作用就是抽离公共的业务逻辑，原理类似“对象的继承”，当组件初始化时会调用 `mergeOptions` 方法进行合并，采用策略模式针对不同的属性进行合并。如果混入的数据和本身组件中的数据冲突，会采用“就近原则”以组件的数据为准

mixin 中有很多缺陷 "命名冲突问题"、"依赖问题"、"数据来源问题",这里强调一下 mixin 的数据是不会被共享的！

```js
Vue.mixin = function (obj) {
  this.options = mergeOptions(this.options, obj);
};
Vue.mixin({
  beforeCreate() {
    console.log("before create ok");
  },
});
```

> 源码位置:src/global-api/mixin:5

## 6.nextTick 在哪里使用?原理是?

nextTick 中的回调是在下次 DOM 更新循环结束之后执行的延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM。原理就是异步方法(promise,mutationObserver,setImmediate,setTimeout)经常与事件环一起来问(宏任务和微任务)

vue 多次更新数据，最终会进行批处理更新。内部调用的就是 nextTick 实现了延迟更新，用户自定义的 nextTick 中的回调会被延迟到更新完成后调用，从而可以获取更新后的 DOM。

```js
let cbs = [];
let pending = false;
function flushCallbacks() {
  cbs.forEach((fn) => fn());
}
function nextTick(fn) {
  cbs.push(fn);
  if (!pending) {
    pending = true;
    setTimeout(() => {
      flushCallbacks();
    }, 0);
  }
}
function render() {
  console.log("rerender");
}
nextTick(render);
nextTick(render);
nextTick(render);
console.log("sync...");
```

> 源码位置:src/core/global-api/mixin:5、src/core/util/next-tick.js:87

## 7.Vue 为什么需要虚拟 DOM？

Virtual DOM 就是用 js 对象来描述真实 DOM，是对真实 DOM 的抽象，由于直接操作 DOM 性能低但是 js 层的操作效率高，可以将 DOM 操作转化成对象操作，最终通过 diff 算法比对差异进行更新 DOM（减少了对真实 DOM 的操作）。虚拟 DOM 不依赖真实平台环境从而也可以实现跨平台。

虚拟 DOM 的实现就是普通对象包含 tag、data、children 等属性对真实节点的描述。（本质上就是在 JS 和 DOM 之间的一个缓存）

> 源码位置:src/core/vdom/vnode:3

## 8.Vue 中的 diff 原理

Vue 的 diff 算法是平级比较，不考虑跨级比较的情况。内部采用`深度递归的方式 + 双指针`的方式进行比较

<div align="center"><img :src="$withBase('/images/vuebase/vue-diff.jpg')" alt="vuebase/vue-diff.jpg"></div>

1. 先比较是否是相同节点
2. 相同节点比较属性,并复用老节点
3. 比较儿子节点，考虑老节点和新节点儿子的情况
4. 优化比较：头头、尾尾、头尾、尾头
5. 比对查找进行复用

> Vue3 中采用最长递增子序列实现 diff 算法

> 源码位置:src/core/vdom/patch:501

## 9.Vue.set 方法是如何实现的?

为什么`$set`可以触发更新,我们给对象和数组本身都增加了 dep 属性。当给对象新增不存在的属性则触发对象依赖的 watcher 去更新，当修改数组索引时我们调用数组本身的 splice 方法去更新数组

```js
export function set(target: Array | Object, key: any, val: any): any {
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
  // 7.通知视图更新
  ob.dep.notify();
  return val;
}
```

> 源码位置:src/core/observer/index:202

## 10.Vue 的生命周期方法有哪些？一般在哪一步发起请求及原因

- `beforeCreate` 在实例初始化之后，数据观测(data observer) 和 event/watcher 事件配置之前被调用。
- `created` 实例已经创建完成之后被调用。在这一步，实例已完成以下的配置：数据观测(data observer)，属性和方法的运算， watch/event 事件回调。这里没有`$el`, 实例已经创建完成，因为它是最早触发的原因可以进行一些数据，资源的请求。(服务端渲染支持 created 方法)
- `beforeMount` 在挂载开始之前被调用：相关的 render 函数首次被调用。
- `mounted` el 被新创建的 `vm.$el` 替换，并挂载到实例上去之后调用该钩子。实例已经挂载完成，可以进行一些 DOM 操作
- `beforeUpdate` 数据更新时调用，发生在虚拟 DOM 重新渲染和打补丁之前。可以在这个钩子中进一步地更改状态，这不会触发附加的重渲染过程
- `updated` 由于数据更改导致的虚拟 DOM 重新渲染和打补丁，在这之后会调用该钩子。可以执行依赖于 DOM 的操作。然而在大多数情况下，你应该避免在此期间更改状态，因为这可能会导致更新无限循环。 该钩子在服务器端渲染期间不被调用。
- `beforeDestroy` 实例销毁之前调用。在这一步，实例仍然完全可用。
- `destroyed` Vue 实例销毁后调用。调用后，Vue 实例指示的所有东西都会解绑定，所有的事件监听器会被移.可以执行一些优化操作,清空定时器，解除绑定事件

## 11.Vue 组件间传值的方式及之间的区别？

- `props`和`$emit` 父组件向子组件传递数据是通过 `prop` 传递的，子组件传递数据给父组件是通过`$emit`触发事件来做到的
- `$parent`,`$children` 获取当前组件的父组件和当前组件的子组件
- `$attrs`和`$listeners` A->B->C。Vue 2.4 开始提供了`$attrs`和`$listeners`来解决这个问题
- 父组件中通过 `provide` 来提供变量，然后在子组件中通过 `inject` 来注入变量。
- `$refs` 获取实例
- `envetBus` 平级组件数据传递 这种情况下可以使用中央事件总线的方式
- `vuex` 状态管理

(1) props 实现:src/core/vdom/create-component.js:101、 src/core/instance/init.js:74、scr/core/instance/state:64

(2) 事件机制实现: src/core/vdom/create-component.js:101、 src/core/instance/init.js:74、src/core/instance/events.js:12

(3) parent&children 实现:src/core/vdom/create-component.js:47、src/core/instance/lifecycle.js:32

(4)provide&inject 实现: src/core/instance/inject.js:7

(5)$attrs&$listener 实现: src/core/instance/render.js:49、src/core/instance/lifecycle.js:215

(6)\$refs 实现:src/core/vdom/modules/reg.js:20

## 12.\$attrs 是为了解决什么问题出现的？应用场景有哪些？provide/inject 不能解决它能解决的问题吗？ #核心答案:

\$attrs 主要的作用就是实现批量传递数据。provide/inject 更适合应用在插件中，主要是实现跨级数据传递

## 13.Vue 的组件渲染流程?

1. 父子组件渲染的先后顺序
2. 组件是如何渲染到页面上的

① 在渲染父组件时会创建父组件的虚拟节点,其中可能包含子组件的标签 ② 在创建虚拟节点时,获取组件的定义使用 Vue.extend 生成组件的构造函数。 ③ 将虚拟节点转化成真实节点时，会创建组件的实例并且调用组件的\$mount 方法。 ④ 所以组件的创建过程是先父后子

> 源码位置:src/core/vdom/patch:125

## 14.Vue 中组件的 data 为什么是一个函数?

每次使用组件时都会对组件进行实例化操作，并且调用 data 函数返回一个对象作为组件的数据源。这样可以保证多个组件间数据互不影响

```js
class Vue {
  constructor(options) {
    this.data = options.data();
  }
}
let data = () => ({ a: 1 });
let d1 = new Vue({ data });
let d2 = new Vue({ data });
d1.data.a = 100;
console.log(d2); // 1
```

> 源码位置:src/core/util/options:121

## 15.请说下 v-if 和 v-show 的区别

v-if 在编译过程中会被转化成三元表达式,条件不满足时不渲染此节点。v-show 会被编译成指令，条件不满足时控制样式将对应节点隐藏 （内部其他指令依旧会继续执行）

### v-if 源码剖析:

```js
function genIfConditions(
  conditions: ASTIfConditions,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  if (!conditions.length) {
    return altEmpty || "_e()";
  }
  const condition = conditions.shift();
  if (condition.exp) {
    // 如果有表达式
    return `(${condition.exp})?${
      // 将表达式作为条件拼接成元素
      genTernaryExp(condition.block)
    }:${genIfConditions(conditions, state, altGen, altEmpty)}`;
  } else {
    return `${genTernaryExp(condition.block)}`; // 没有表达式直接生成元素 像v-else
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp(el) {
    return altGen
      ? altGen(el, state)
      : el.once
      ? genOnce(el, state)
      : genElement(el, state);
  }
}
```

> 源码位置:src/compiler/codegen/index.js:155

### v-show 源码剖析:

```js
{
    bind (el: any, { value }: VNodeDirective, vnode: VNodeWithData) {
    const originalDisplay = el.__vOriginalDisplay =
        el.style.display === 'none' ? '' : el.style.display // 获取原始显示值
        el.style.display = value ? originalDisplay : 'none' // 根据属性控制显示或者隐藏
    }
}
```

- 源码位置:src/platforms/web/runtime/directives/show.js:155
