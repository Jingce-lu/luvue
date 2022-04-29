# Vue 中 Diff 算法解析

[[toc]]

## 序

```js
import { compileToFunction } from "./compiler/index.js";
import { patch, createElm } from "./vdom/patch";
// 1.创建第一个虚拟节点
let vm1 = new Vue({ data: { name: "zf" } });
let render1 = compileToFunction("<div>{{name}}</div>");
let oldVnode = render1.call(vm1);
// 2.创建第二个虚拟节点
let vm2 = new Vue({ data: { name: "jw" } });
let render2 = compileToFunction("<p>{{name}}</p>");
let newVnode = render2.call(vm2);
// 3.通过第一个虚拟节点做首次渲染
let el = createElm(oldVnode);
document.body.appendChild(el);
// 4.调用patch方法进行对比操作
patch(oldVnode, newVnode);
```

我们想掌握 vue 中的 diff 算法就先构建出两个虚拟 `dom` 之后做 `patch`

<div align="center"><img :src="$withBase('/images/vuesourcecode/vue-diff.jpg')" alt="vuesourcecode/vue-diff.jpg"></div>

## 一.基本 Diff 算法

### 1.比对标签

```js
// 如果标签不一致说明是两个不同元素
if (oldVnode.tag !== vnode.tag) {
  oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
}
```

> 在 diff 过程中会先比较标签是否一致，如果标签不一致用新的标签替换掉老的标签

```js
// 如果标签一致但是不存在则是文本节点
if (!oldVnode.tag) {
  if (oldVnode.text !== vnode.text) {
    oldVnode.el.textContent = vnode.text;
  }
}
```

> 如果标签一致，有可能都是文本节点，那就比较文本的内容即可

### 2.比对属性

```js
// 复用标签,并且更新属性
let el = (vnode.el = oldVnode.el);
updateProperties(vnode, oldVnode.data);
function updateProperties(vnode, oldProps = {}) {
  let newProps = vnode.data || {};
  let el = vnode.el;
  // 比对样式
  let newStyle = newProps.style || {};
  let oldStyle = oldProps.style || {};
  for (let key in oldStyle) {
    if (!newStyle[key]) {
      el.style[key] = "";
    }
  }
  // 删除多余属性
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key);
    }
  }
  for (let key in newProps) {
    if (key === "style") {
      for (let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName];
      }
    } else if (key === "class") {
      el.className = newProps.class;
    } else {
      el.setAttribute(key, newProps[key]);
    }
  }
}
```

> 当标签相同时，我们可以复用老的标签元素，并且进行属性的比对。

### 3.比对子元素

```js
// 比较孩子节点
let oldChildren = oldVnode.children || [];
let newChildren = vnode.children || [];
// 新老都有需要比对儿子
if (oldChildren.length > 0 && newChildren.length > 0) {
  // 老的有儿子新的没有清空即可
} else if (oldChildren.length > 0) {
  el.innerHTML = "";
  // 新的有儿子
} else if (newChildren.length > 0) {
  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    el.appendChild(createElm(child));
  }
}
```

这里要判断新老节点儿子的状况

```js
if (oldChildren.length > 0 && newChildren.length > 0) {
  updateChildren(el, oldChildren, newChildren);
  // 老的有儿子新的没有清空即可
}
```

## 二.Diff 中的优化策略

### 1.在开头和结尾新增元素

```js
function isSameVnode(oldVnode, newVnode) {
  // 如果两个人的标签和key 一样我认为是同一个节点 虚拟节点一样我就可以复用真实节点了
  return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
}
function updateChildren(parent, oldChildren, newChildren) {
  let oldStartIndex = 0;
  let oldStartVnode = oldChildren[0];
  let oldEndIndex = oldChildren.length - 1;
  let oldEndVnode = oldChildren[oldEndIndex];

  let newStartIndex = 0;
  let newStartVnode = newChildren[0];
  let newEndIndex = newChildren.length - 1;
  let newEndVnode = newChildren[newEndIndex];

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 优化向后追加逻辑
    if (isSameVnode(oldStartVnode, newStartVnode)) {
      patch(oldStartVnode, newStartVnode);
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
      // 优化向前追加逻辑
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patch(oldEndVnode, newEndVnode); // 比较孩子
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    }
  }
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let ele =
        newChildren[newEndIndex + 1] == null
          ? null
          : newChildren[newEndIndex + 1].el;
      parent.insertBefore(createElm(newChildren[i]), ele);
    }
  }
}
```

### 2.头移尾、尾移头

```js
// 头移动到尾部
else if(isSameVnode(oldStartVnode,newEndVnode)){
    patch(oldStartVnode,newEndVnode);
    parent.insertBefore(oldStartVnode.el,oldEndVnode.el.nextSibling);
    oldStartVnode = oldChildren[++oldStartIndex];
    newEndVnode = newChildren[--newEndIndex]
// 尾部移动到头部
}else if(isSameVnode(oldEndVnode,newStartVnode)){
    patch(oldEndVnode,newStartVnode);
    parent.insertBefore(oldEndVnode.el,oldStartVnode.el);
    oldEndVnode = oldChildren[--oldEndIndex];
    newStartVnode = newChildren[++newStartIndex]
}
```

> 以上四个条件对常见的 dom 操作进行了优化。

### 3.暴力比对

```js
function makeIndexByKey(children) {
  let map = {};
  children.forEach((item, index) => {
    map[item.key] = index;
  });
  return map;
}
let map = makeIndexByKey(oldChildren);
```

> 对所有的孩子元素进行编号

```js
let moveIndex = map[newStartVnode.key];
if (moveIndex == undefined) {
  // 老的中没有将新元素插入
  parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
} else {
  // 有的话做移动操作
  let moveVnode = oldChildren[moveIndex];
  oldChildren[moveIndex] = undefined;
  parent.insertBefore(moveVnode.el, oldStartVnode.el);
  patch(moveVnode, newStartVnode);
}
newStartVnode = newChildren[++newStartIndex];
```

> 用新的元素去老的中进行查找，如果找到则移动，找不到则直接插入

```js
if (oldStartIndex <= oldEndIndex) {
  for (let i = oldStartIndex; i <= oldEndIndex; i++) {
    let child = oldChildren[i];
    if (child != undefined) {
      parent.removeChild(child.el);
    }
  }
}
```

> 如果有剩余则直接删除

```js
if (!oldStartVnode) {
  oldStartVnode = oldChildren[++oldStartIndex];
} else if (!oldEndVnode) {
  oldEndVnode = oldChildren[--oldEndIndex];
}
```

在比对过程中，可能出现空值情况则直接跳过

## 三.更新操作

```js
Vue.prototype._update = function(vnode) {
  const vm = this;
  const prevVnode = vm._vnode; // 保留上一次的vnode
  vm._vnode = vnode;
  if (!prevVnode) {
    vm.$el = patch(vm.$el, vnode); // 需要用虚拟节点创建出真实节点 替换掉 真实的$el
    // 我要通过虚拟节点 渲染出真实的dom
  } else {
    vm.$el = patch(prevVnode, vnode); // 更新时做diff操作
  }
};
```
