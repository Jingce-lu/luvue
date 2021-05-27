# 进阶 Vue 篇（三）

[[toc]]

## 一.render 函数的应用

### 1.模板缺陷

模板的最大特点是扩展难度大，不易扩展。可能会造成逻辑冗余

```html
<Level :type="1">哈哈</Level>
<Level :type="2">哈哈</Level>
<Level :type="3">哈哈</Level>
```

Level 组件需要对不同的 type 产生不同的标签

```html
<template>
  <h1 v-if="type==1">
    <slot></slot>
  </h1>
  <h2 v-else-if="type==2">
    <slot></slot>
  </h2>
  <h3 v-else-if="type==3">
    <slot></slot>
  </h3>
</template>
<script>
  export default {
    props: {
      type: {
        type: Number
      }
    }
  };
</script>
```

### 2.使用 Render 函数

```js
export default {
  render(h) {
    return h("h" + this.type, {}, this.$slots.default);
  },
  props: {
    type: {
      type: Number
    }
  }
};
```

> 复杂的逻辑变得非常简单

### 3.函数式组件

如果只是接受一些 prop 的话可以标记为 `functional`

```js
Vue.component("my-component", {
  functional: true,
  props: {},
  render: function(createElement, context) {
    // ...
  }
});
```

> 函数式组件只是函数，所以渲染开销也低很多。 （没有 this、没有状态、没有生命周期）

## 二.作用域插槽

### 1.render 函数的应用

如果我们想定制化一个列表的展现结构，我们可以使用 render 函数来实现

```html
<List :data="data"></List>
<script>
  import List from "./components/List";
  export default {
    data() {
      return { data: ["苹果", "香蕉", "橘子"] };
    },
    components: {
      List
    }
  };
</script>

<!-- List组件渲染列表 -->
<template>
  <div class="list">
    <div v-for="(item,index) in data" :key="index">
      <li>{{item}}</li>
    </div>
  </div>
</template>
<script>
  export default {
    props: {
      data: Array,
      default: () => []
    }
  };
</script>
```

通过 render 方法来订制组件,在父组件中传入 render 方法

```html
<List :data="data" :render="render"></List>
<script>
  render(h, name) {
     return <span>{name}</span>;
  }
</script>
```

> 我们需要 createElement 方法，就会想到可以编写个 render 函数，将 createElement 方法传递出来

```html
<template>
  <div class="list">
    <div v-for="(item,index) in data" :key="index">
      <li v-if="!render">{{item}}</li>
      <!-- 将render方法传到函数组件中，将渲染项传入到组件中，在内部回调这个render方法 -->
      <ListItem v-else :item="item" :render="render"></ListItem>
    </div>
  </div>
</template>
<script>
  import ListItem from "./ListItem";
  export default {
    components: {
      ListItem
    },
    props: {
      render: {
        type: Function
      },
      data: Array,
      default: () => []
    }
  };
</script>
```

ListItem.vue 调用最外层的 render 方法，将 createElement 和当前项传递出来

```html
<script>
  export default {
    props: {
      render: {
        type: Function
      },
      item: {}
    },
    render(h) {
      return this.render(h, this.item);
    }
  };
</script>
```

### 2.使用 scope-slot

我们不难发现使用 render 函数确实可以大大提高灵活度，但是代码量偏多，这样我们可以使用作用域插槽来简化逻辑

```html
<List :arr="arr">
  <template v-slot="{item}">
    {{item}}
  </template>
</List>

<div v-for="(item,key) in arr" :key="key">
  <slot :item="item"></slot>
</div>
```

> 目前像 iview 已经支持`render函数`和`作用域插槽`两种写法

## 三.递归组件的应用

### 1.案例:实现无限极菜单组件

1. 使用模板来实现

   ```html
   <el-menu>
     <template v-for="d in data">
       <resub :data="d" :key="d.id"></resub>
     </template>
   </el-menu>
   ```

   ```html
   <el-submenu :key="data.id" v-if="data.children">
     <template slot="title">{{data.title}}</template>
     <template v-for="d in data.children">
       <resub :key="d.id" :data="d"></resub>
     </template>
   </el-submenu>
   <el-menu-item :key="data.id" v-else>{{data.title}}</el-menu-item>
   ```

2. 使用 render 函数来实现
   ```js
   import elMenu from "./components/el-menu.vue";
   import elMenuItem from "./components/el-menu-item.vue";
   import elSubmenu from "./components/el-submenu.vue";
   export default {
     props: {
       data: {
         type: Array,
         default: () => []
       }
     },
     render() {
       // react语法
       let renderChildren = data => {
         return data.map(child => {
           return child.children ? (
             <elSubmenu>
               <div slot="title">{child.title}</div>
               {renderChildren(child.children)}
             </elSubmenu>
           ) : (
             <elMenuItem
               nativeOnClick={() => {
                 alert(1);
               }}
             >
               {child.title}
             </elMenuItem>
           );
         });
       };
       return <elMenu>{renderChildren(this.data)}</elMenu>;
     }
   };
   ```
