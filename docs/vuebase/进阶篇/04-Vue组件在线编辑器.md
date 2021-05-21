# Vue 组件在线编辑器

[[toc]]

## 序

- 通过 `props`、`events` 实现父子组件通信
- 通过 `ref` 属性获取组件实例

<div align="center"><img :src="$withBase('/images/vuebase/btn.png')" alt="vuebase/btn.png"></div>

## 1.掌握组件的基本概念

```js
import Vue from "vue";
import App from "./App.vue";
new Vue({ render: h => h(App) }).$mount("#app");
```

> `h` 我们一般称为 `createElement`，这里我们可以用他来渲染组件，App 其实就是一个组件 （就是一个对象而已）

```html
<template>
  <div id="app"></div>
</template>

<script>
  export default {
    name: "App"
  };
</script>
<style lang="stylus"></style>
```

> 为了编写组件方便，vue 提供了`.vue`文件，最终这个对象会被解析为组件对象。一个组件由三部分组成：`模板`、`逻辑`、`样式`

## 2.划分组件结构

```html
<template>
  <div id="app">
    <!-- 3.使用组件 -->
    <Edit></Edit>
    <Show></Show>
  </div>
</template>
<script>
  // 1.声明组件并引入
  import Edit from "@/components/edit.vue";
  import Show from "@/components/show.vue";
  export default {
    name: "App",
    // 2.组件的注册
    components: {
      Edit,
      Show
    }
  };
</script>
```

> 将在线编辑器划分成左右两部分，左侧用于编辑操作、右侧用于展示操作。
> 组件的使用有三步：声明导入、注册、通过标签形式使用组件

```stylus
<style lang="stylus">
  * {
    margin: 0;
    padding: 0;
  }

  html, body, #app {
    width: 100%;
    height: 100%;
  }
  #app {
    display: flex;
    & > div {
      width: 50%;
      height: 100%;
    }
  }
</style>
```

## 3.编写 Edit 组件

```html
<template>
  <div class="edit">
    <div class="edit-btn">
      <button>代码运行</button>
      <button>清空代码</button>
    </div>
    <div class="edit-box">
      <textarea></textarea>
    </div>
  </div>
</template>

<script>
  export default {};
</script>
<style lang="stylus">
  .edit {
    .edit-btn {
      padding: 10px;
      background: #ccc;
      button {
        width: 80px;
        height: 40px;
        margin-right: 5px;
      }
    }
    .edit-box {
      position: absolute;
      top: 60px;
      left: 0;
      right: 0;
      bottom: 0;
      textarea {
        width: 100%;
        height: 100%;
        outline: none;
        border: none;
        font-size 20px;
      }
    }
  }
</style>
```

## 4.表单元素双向绑定

```html
<textarea @input="handleInput" :value="code"></textarea>
<script>
  export default {
    data() {
      return { code: "" };
    },
    methods: {
      handleInput(e) {
        this.code = e.target.value;
      }
    }
  };
</script>
```

## 5.触发父组件事件

```html
<textarea
  @input="handleInput"
  :value="code"
  @keydown.9.prevent="handleKeydown"
></textarea>
<script>
  export default {
    methods: {
      handleInput(e) {
        this.code = e.target.value;
        this.$emit("input", this.code); //触发自己身上的事件
      },
      handleKeydown(e) {
        if (e.keyCode == 9) {
          this.code = e.target.value + "  ";
        }
      }
    }
  };
</script>
```

在父组件中，给当前组件绑定事件

```html
<Edit @input="handleInput"></Edit>
<script>
  export default {
    data() {
      return { code: "" };
    },
    methods: {
      handleInput(code) {
        this.code = code;
      }
    }
  };
</script>
```

> 这个其实就是典型的发布订阅模式，先在组件自己身上绑定事件（绑定的事件为父组件事件），稍后触发自己身上的事件，将数据传入给父组件的函数中，达到子父通信的效果

## 6.将数据传递给儿子组件

通过属性的方式将数据传递给儿子组件

```html
<Show :code="code"></Show>
```

子组件接受传递过来的数据

```js
export default {
  props: {
    code: {
      type: String,
      code: ""
    }
  }
};
```

## 7.定义 show 组件

```html
<template>
  <div class="show">
    <h2 class="show-title">运行结果</h2>
    <div class="show-box"></div>
  </div>
</template>
<script>
  export default {
    props: {
      code: {
        type: String,
        code: ""
      }
    },
    methods: {
      run() {
        // 运行代码
      }
    }
  };
</script>
<style lang="stylus">
  .show-title{
      line-height: 40px;
      padding-left:20px;
  }
</style>
```

## 8.平级组件通信

最简单的方案可以找共同的父组件

```html
<div class="edit-btn">
  <button @click="$emit('run')">代码运行</button>
  <button @click="code=''">清空代码</button>
</div>
```

```html
<Edit @input="handleInput" @run="handleRun"></Edit>
```

> 这里我们可以在父组件中监控到组件点击事件了。我们需要在父组件中调用 Show 组件中的 run 方法

```html
<Show :code="code" ref="show"></Show> this.$refs.show.run()
```

## 9.解析代码

```html
<div class="show-box" ref="display"></div>
```

```js
getSource(type){
    const reg = new RegExp(`<${type}[^>]*>`);
    let code = this.code;
    let matches = code.match(reg);
    if(matches){
        return code.slice(
            code.indexOf(matches[0]) + matches[0].length,
            code.lastIndexOf(`</${type}`)
        )
    }
    return ''
},
run() {
    // 运行代码
    // 1.获取 js html css逻辑
    const template = this.getSource("template")
    const script = this.getSource("script").replace(/export default/,'return');
    const style = this.getSource('style');

    if(!template){
        return alert('代码无法运行')
    }
    // 2.组合成组件
    let component = new Function(script)();
    component.template = template;


    // 3.构造组件构造器
    let instance = new (Vue.extend(component));
    this.$refs.display.appendChild(instance.$mount().$el);

    // 4.处理样式
    if(style){
        let styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML = style;
        document.getElementsByTagName("head")[0].appendChild(styleElement)
    }
}
```

> 解析出对应的内容，采用 `Vue.extend` 构造 Vue 组件，手动挂载到对应的元素上.当 ref 属性指定在 DOM 身上时，代表的是真实的 DOM 元素
