# Vuex 原理剖析

[[toc]]

## 一.Vuex 基本使用及用法

> vuex 是 vue 的状态管理工具,为了更方便实现多个组件共享状态

```js
import Vuex from "vuex";
Vue.use(Vuex);
export default new Vuex.Store({
  state: {
    age: 28
  },
  getters: {
    getAge(state) {
      return state.age + 10;
    }
  },
  mutations: {
    changeAge(state, payload) {
      state.age += payload;
    }
  },
  actions: {
    changeAge({ commit }, payload) {
      setTimeout(() => {
        commit("changeAge", payload);
      }, 1000);
    }
  }
});
```

> 这里我们可以进行类比： state 类比为组件的状态 ，getters 类比为组件的计算属性 ， mutations 类比为组件中的方法（可以更改组件的状态），actions 用于进行异步操作将结果提交给 mutation

```html
<div id="app">
  我的年龄是: {{this.$store.state.age}}
  <br />
  L的年龄是: {{this.$store.getters.getAge}}
  <br />
  <!-- dispatch对应的action -->
  <button @click="$store.dispatch('changeAge',3)">过一会增加年龄</button>
  <!-- commit 对应的mutation -->
  <button @click="$store.commit('changeAge',5)">立即增加年龄</button>
</div>
```

> 这个`$store`属性是通过根实例传入的

```js
new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
```

> 内部会将 store 属性挂载在每个实例上命名为\$store,这样所有组件都可以操作同一个 store 属性

## 二.自己实现 Vuex 模块

> 实现入口文件，默认导出 Store 类和 install 方法

```js
import { Store, install } from "./store";

export default {
  Store,
  install
};
export { Store, install };
```

### 1.install 方法

```js
import applyMixin from "./mixin";
let Vue;
export class Store {
  constructor(options) {}
}

export const install = _Vue => {
  Vue = _Vue;
  applyMixin(Vue);
};
```

当我们使用插件时默认会执行 install 方法并传入 Vue 的构造函数

### 2.mixin 方法

```js
const applyMixin = Vue => {
  Vue.mixin({
    beforeCreate: vuexInit
  });
};

function vuexInit() {
  const options = this.$options;
  if (options.store) {
    // 给根实例增加$store属性
    this.$store = options.store;
  } else if (options.parent && options.parent.$store) {
    // 给组件增加$store属性
    this.$store = options.parent.$store;
  }
}
export default applyMixin;
```

> 将 store 实例定义在所有的组件实例上

### 3.实现 state

```js
export class Store {
  constructor(options) {
    let state = options.state;
    this._vm = new Vue({
      data: {
        $$state: state
      }
    });
  }
  get state() {
    return this._vm._data.$$state;
  }
}
```

> 将用户传入的数据定义在 vue 的实例上 （这个就是 vuex 核心）产生一个单独的 vue 实例进行通信，这里要注意的是定义\$开头的变量不会被代理到实例上

### 4.实现 getters

```js
this.getters = {};
const computed = {};
forEachValue(options.getters, (fn, key) => {
  computed[key] = () => {
    return fn(this.state);
  };
  Object.defineProperty(this.getters, key, {
    get: () => this._vm[key]
  });
});
this._vm = new Vue({
  data: {
    $$state: state
  },
  computed // 利用计算属性实现缓存
});
```

### 5.实现 mutations

```js
export class Store {
  constructor(options) {
    this.mutations = {};
    forEachValue(options.mutations, (fn, key) => {
      this.mutations[key] = payload => fn.call(this, this.state, payload);
    });
  }
  commit = (type, payload) => {
    this.mutations[type](payload);
  };
}
```

### 6.实现 actions

```js
export class Store {
  constructor(options) {
    this.actions = {};
    forEachValue(options.actions, (fn, key) => {
      this.actions[key] = payload => fn.call(this, this, payload);
    });
  }
  dispatch = (type, payload) => {
    this.actions[type](payload);
  };
}
```

## 三.实现模块机制

### 1.格式化用户数据

```js
import ModuleCollection from "./module/module-collection";
this._modules = new ModuleCollection(options);
```

```js
import { forEachValue } from "../util";
export default class ModuleCollection {
  constructor(options) {
    this.register([], options);
  }
  register(path, rootModule) {
    let newModule = {
      _raw: rootModule,
      _children: {},
      state: rootModule.state
    };
    if (path.length == 0) {
      this.root = newModule;
    } else {
      let parent = path.slice(0, -1).reduce((memo, current) => {
        return memo._children[current];
      }, this.root);
      parent._children[path[path.length - 1]] = newModule;
    }
    if (rootModule.modules) {
      forEachValue(rootModule.modules, (module, moduleName) => {
        this.register(path.concat(moduleName), module);
      });
    }
  }
}
```

### 2.抽离模块类

```js
export default class Module {
  constructor(rawModule) {
    this._children = {};
    this._rawModule = rawModule;
    this.state = rawModule.state;
  }
  getChild(key) {
    return this._children[key];
  }
  addChild(key, module) {
    this._children[key] = module;
  }
}
```

### 3.安装模块

```js
this._actions = {};
this._mutations = {};
this._wrappedGetters = {};
// 安装模块
installModule(this, state, [], this._modules.root);
```

在模块类中提供遍历方法

```js
export default class Module {
  constructor(rawModule) {
    this._children = {};
    this._rawModule = rawModule;
    this.state = rawModule.state;
  }
  getChild(key) {
    return this._children[key];
  }
  addChild(key, module) {
    this._children[key] = module;
  }
  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  }
  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  }
  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  }
  forEachChild(fn) {
    forEachValue(this._children, fn);
  }
}
```

对模块进行安装操作

```js
function installModule(store, rootState, path, module) {
  if (path.length > 0) {
    let parent = path.slice(0, -1).reduce((memo, current) => {
      return memo[current];
    }, rootState);
    Vue.set(parent, path[path.length - 1], module.state);
  }
  module.forEachMutation((mutation, key) => {
    store._mutations[key] = store._mutations[key] || [];
    store._mutations[key].push(payload => {
      mutation.call(store, module.state, payload);
    });
  });
  module.forEachAction((action, key) => {
    store._actions[key] = store._actions[key] || [];
    store._actions[key].push(function(payload) {
      action.call(store, this, payload);
    });
  });
  module.forEachGetter((getter, key) => {
    store._wrappedGetters[key] = function() {
      return getter(module.state);
    };
  });
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child);
  });
}
```

对 `dispatch` 和 `action` 方法进行重写

```js
commit = (type, payload) => {
  this._mutations[type].forEach(fn => fn.call(this, payload));
};
dispatch = (type, payload) => {
  this._actions[type].forEach(fn => fn.call(this, payload));
};
```

### 4.定义状态和计算属性

```js
resetStoreVM(this, state);
```

```js
function resetStoreVM(store, state) {
  const computed = {};
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  forEachValue(wrappedGetters, (fn, key) => {
    computed[key] = () => {
      return fn(store.state);
    };
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key]
    });
  });
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  });
}
```

### 5.实现命名空间

```js
import { forEachValue } from "../util";
import Module from "./module";
export default class ModuleCollection {
  getNamespace(path) {
    let module = this.root;
    return path.reduce((namespace, key) => {
      module = module.getChild(key);
      console.log(module);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  }
}
export default class Module {
  get namespaced() {
    return !!this._rawModule.namespaced;
  }
}
```

在绑定属性是增加命名空间即可

```js
function installModule(store, rootState, path, module) {
  let namespace = store._modules.getNamespace(path);
  if (path.length > 0) {
    let parent = path.slice(0, -1).reduce((memo, current) => {
      return memo[current];
    }, rootState);
    Vue.set(parent, path[path.length - 1], module.state);
  }
  module.forEachMutation((mutation, key) => {
    store._mutations[namespace + key] = store._mutations[namespace + key] || [];
    store._mutations[namespace + key].push(payload => {
      mutation.call(store, module.state, payload);
    });
  });
  module.forEachAction((action, key) => {
    store._actions[namespace + key] = store._actions[namespace + key] || [];
    store._actions[namespace + key].push(function(payload) {
      action.call(store, this, payload);
    });
  });
  module.forEachGetter((getter, key) => {
    store._wrappedGetters[namespace + key] = function() {
      return getter(module.state);
    };
  });
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child);
  });
}
```

### 6.注册模块

```js
registerModule(path,rawModule){
    if(typeof path == 'string') path = [path];
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, rawModule.rawModule);
    // 重新设置state, 更新getters
    resetStoreVM(this,this.state);
}
```

> 实现模块的注册，就是将当前模块注册到\_modules 中

```js
function resetStoreVM(store, state) {
  let oldVm = store._vm;
  const computed = {};
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  forEachValue(wrappedGetters, (fn, key) => {
    computed[key] = () => {
      return fn(store.state);
    };
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key]
    });
  });
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  });
  if (oldVm) {
    Vue.nextTick(() => oldVm.$destroy());
  }
}
```

> 销毁上次创建的实例

## 四.插件机制

### 1.使用方式

```js
function persists(store) {
  // 每次去服务器上拉去最新的 session、local
  let local = localStorage.getItem("VUEX:state");
  if (local) {
    store.replaceState(JSON.parse(local)); // 会用local替换掉所有的状态
  }
  store.subscribe((mutation, state) => {
    // 这里需要做一个节流  throttle lodash
    localStorage.setItem("VUEX:state", JSON.stringify(state));
  });
}
plugins: [persists];
```

> 这里我们要实现 `subscribe`、`replaceState` 方法

```js
// 执行插件
options.plugins.forEach(plugin => plugin(this));
subscribe(fn){
	this._subscribers.push(fn);
}
replaceState(state){
	this._vm._data.$$state = state;
}
```

### 2.获取最新状态

```js
function getState(store, path) {
  let local = path.reduce((newState, current) => {
    return newState[current];
  }, store.state);
  return local;
}
module.forEachMutation((mutation, key) => {
  store._mutations[namespace + key] = store._mutations[namespace + key] || [];
  store._mutations[namespace + key].push(payload => {
    mutation.call(store, getState(store, path), payload);
  });
});
```

> 调用 mutation 时传入最新状态

## 五.辅助函数

### 1.mapState 实现

```js
const mapState = arrList => {
  let obj = {};
  for (let i = 0; i < arrList.length; i++) {
    let stateName = arrList[i];
    obj[stateName] = function() {
      return this.$store.state[stateName];
    };
  }
  return obj;
};
```

### 2.mapGetters 实现

```js
const mapGetters = arrList => {
  let obj = {};
  for (let i = 0; i < arrList.length; i++) {
    let getterName = arrList[i];
    obj[getterName] = function() {
      return this.$store.getters[getterName];
    };
  }
  return obj;
};
```

### 3.mapMutations 实现

```js
const mapMutations = mutationList => {
  let obj = {};
  for (let i = 0; i < mutationList.length; i++) {
    let type = mutationList[i];
    obj[type] = function(payload) {
      this.$store.commit(type, payload);
    };
  }
  return obj;
};
```

### 4.mapActions 实现

```js
const mapActions = actionList => {
  let obj = {};
  for (let i = 0; i < actionList.length; i++) {
    let type = actionList[i];
    obj[type] = function(payload) {
      this.$store.dispatch(type, payload);
    };
  }
  return obj;
};
```

## 六.区分 mutation 和 action

```js
this._committing = false;
 _withCommitting(fn) {
    let committing = this._committing;
    this._committing = true; // 在函数调用前 表示_committing为true
    fn();
    this._committing = committing;
}
```

```js
if (store.strict) {
  // 只要状态一变化会立即执行,在状态变化后同步执行
  store._vm.$watch(
    () => store._vm._data.$$state,
    () => {
      console.assert(store._committing, "在mutation之外更改了状态");
    },
    { deep: true, sync: true }
  );
}
```

> 严格模式下增加同步 watcher，监控状态变化

```js
store._withCommitting(() => {
  mutation.call(store, getState(store, path), payload); // 这里更改状态
});
```

> 只有通过 mutation 更改状态，断言才能通过

```js
replaceState(newState) { // 用最新的状态替换掉
    this._withCommitting(() => {
        this._vm._data.$$state = newState;
    })
}
```

```js
store._withCommitting(() => {
  Vue.set(parent, path[path.length - 1], module.state);
});
```

> 内部更改状态属于正常更新,所以也需要用\_withCommitting 进行包裹
