# 未来组件化开发趋势 WebComponent

[[toc]]

## WebComponent

优点：原生组件，不需要框架，性能好代码少。
缺点：兼容性问题

> 组件化好处: 高内聚、可重用、可组合

## 核心三项技术

- **Custom elements**：一组 JavaScript API，允许您定义 custom elements 及其行为，然后可以在您的用户界面中按照需要使用它们
- **Shadow DOM**：一组 JavaScript API，用于将封装的“影子”DOM 树附加到元素（与主文档 DOM 分开呈现）并控制其关联的功能。通过这种方式，您可以保持元素的功能私有，这样它们就可以被脚本化和样式化，而不用担心与文档的其他部分发生冲突。
- **HTML templates**： `<template>` 和 `<slot>` 元素使您可以编写不在呈现页面中显示的标记模板。然后它们可以作为自定义元素结构的基础被多次重用。

## 一.实现自定义 Button 组件

组件的名字必须以中划线分割，避免与 native 标签冲突

### HTML templates

```html
<lu-button type="primary">ailjc架构</lu-button>

<template id="btn">
  <button class="lu-btn">
    <slot>按钮</slot>
  </button>
</template>
```

> `template` 中的内容是我们定义的 `button` 组件的样子。`slot`可以获取自定义组件中的内容，插入到模板对应的位置

### shadowDOM

shadow DOM 可以实现真正的隔离机制

<div align="center"><img :src="$withBase('/images/vuesourcecode/shadow-dom.png')" alt="vuesourcecode/shadow-dom.png"></div>

```js
class zfButton extends HTMLElement {
  constructor() {
    super();
    // 创建影子
    let shadow = this.attachShadow({ mode: "open" });
    let btn = document.getElementById("btn");
    // 拷贝模板
    let cloneTemplate = btn.content.cloneNode(true);
    const style = document.createElement("style");
    const types = {
      primary: {
        backgroundColor: "#409eff",
        color: "#fff"
      },
      default: {
        backgroundColor: "#c8c9cc",
        color: "#fff"
      }
    };
    const btnType = this.getAttribute("type") || "default";
    style.innerHTML = `
            .zf-btn {
                outline:none;
                border:none;
                border-radius:4px;
                display:inline-block;
                cursor:pointer;
                padding:6px 20px;
                background:var(--background-color,${types[btnType].backgroundColor});
                color:var(--text-color,${types[btnType].color});
            }
        `;
    shadow.appendChild(style);
    shadow.appendChild(cloneTemplate);
  }
}
```

### customElement

```js
window.customElements.define("lu-button", luButton);
```

> 定义自定义组件

## 二.Collapse 折叠面板组件

- 定义组件使用方式

  ```html
  <h1>Collapse 组件</h1>
  <lu-collapse>
    <lu-collapse-item title="Node" name="1">
      <div>Node.js® 是一个基于 Chrome V8 引擎 的 JavaScript 运行时。</div>
    </lu-collapse-item>

    <lu-collapse-item title="React" name="2">
      <div>用于构建用户界面的 JavaScript 库</div>
    </lu-collapse-item>

    <lu-collapse-item title="Vue" name="3">
      Vue.js 是一套构建用户界面的渐进式框架。
    </lu-collapse-item>
  </lu-collapse>
  ```

- 定义组件模板

  ```html
  <template id="collapse_tpl">
    <div class="lu-collapse">
      <slot></slot>
    </div>
  </template>

  <template id="collapse_item_tpl">
    <div class="lu-collapse-item">
      <div class="title"></div>
      <div class="content">
        <slot></slot>
      </div>
    </div>
  </template>
  ```

- 定制 `lu-collapse` 组件

  ```js
  class LuCollapse extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      const tmpl = document.getElementById("collapse_tpl");
      let cloneTemplate = tmpl.content.cloneNode(true);
      const style = document.createElement("style");
      style.innerHTML = `
              :host{
                  display:flex;
                  width:400px;
                  border:2px solid #f1f1f1;
                  padding:20px 15px;
                  border-radius:5px;
              }
              .zf-collapse{
                  width:100%;
              }
              .title{
                  font-size:30px;
              }
          `;
      shadow.appendChild(style);
      shadow.appendChild(cloneTemplate);

      // 获取插槽
      const slot = shadow.querySelector("slot");
      // 拿到插槽中所有内容
      slot.addEventListener("slotchange", e => {
        this.slotList = e.target.assignedElements(); // 获取插槽中的内容
        this.render();
      });
    }
    static get observedAttributes() {
      return ["active"];
    }
    attributeChangedCallback(name, oldVal, newVal) {
      // 获取属性列表
      if (name === "active") {
        this.activeList = newVal;
        this.render();
      }
    }
    render() {
      if (this.slotList && this.activeList) {
        [...this.slotList].forEach(child => {
          child.setAttribute("active", this.activeList);
        });
      }
    }
  }
  export default LuCollapse;
  ```

- 定制 `lu-collapse-item` 组件

  ```js
  class LuCollapseItem extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      const tmpl = document.getElementById("collapse_item_tpl");
      let cloneTemplate = tmpl.content.cloneNode(true);
      const style = document.createElement("style");

      style.innerHTML = `
              :host{
                  width:100%;
                  display:block
              }
              .title{
                  background:#f1f1f1;
                  line-height:35px;
                  cursor:pointer;
                  width:100%;
                  user-select:none
              }
              .title, .content{
                  padding-left:5px
              }
              .content{
                  line-height:30px;
              }
          `;
      shadow.appendChild(style);
      shadow.appendChild(cloneTemplate);

      this.header = this.shadowRoot.querySelector(".title");

      this.show = true;
      this.header.addEventListener("click", () => {
        let nameVal = this.getAttribute("name");
        this.show = !this.show;
        document.querySelector("lu-collapse").dispatchEvent(
          new CustomEvent("change", {
            detail: {
              name: nameVal,
              show: this.show
            }
          })
        );
      });
    }
    static get observedAttributes() {
      return ["active", "name", "title"];
    }
    attributeChangedCallback(name, oldVal, newVal) {
      switch (name) {
        case "active":
          this.active = JSON.parse(newVal);
          break;
        case "name":
          this.name = newVal;
          break;
        case "title":
          this.header.innerHTML = newVal;
          break;
      }
      if (this.active && this.name) {
        let isShow = this.active.includes(this.name);
        this.shadowRoot.querySelector(".content").style.display = isShow
          ? "block"
          : "none";
        this.show = isShow;
      }
    }
  }

  export default LuCollapseItem;
  ```

- 引用组件

  ```js
  import ZfCollapse from "./zf-collapse";
  import ZfCollapseItem from "./zf-collapse-item";

  let currentActive = ["1", "2", "3"];

  // 定制组件
  customElements.define("zf-collapse", ZfCollapse);
  customElements.define("zf-collapse-item", ZfCollapseItem);

  // 设置数据
  document
    .querySelector("zf-collapse")
    .setAttribute("active", JSON.stringify(currentActive));

  document.querySelector("zf-collapse").addEventListener("change", e => {
    let { name, show } = e.detail;
    if (show) {
      currentActive.push(name);
    } else {
      let index = currentActive.indexOf(name);
      currentActive.splice(index, 1);
    }
    document
      .querySelector("zf-collapse")
      .setAttribute("active", JSON.stringify(currentActive));
  });
  ```

## 三.WebComponent 生命周期

- `connectedCallback`：当 custom element 首次被插入文档 DOM 时，被调用
- `disconnectedCallback`：当 custom element 从文档 DOM 中删除时，被调用
- `adoptedCallback`：当 custom element 被移动到新的文档时，被调用 (移动到 iframe 中)
- `attributeChangedCallback`:当 custom element 增加、删除、修改自身属性时，被调用
