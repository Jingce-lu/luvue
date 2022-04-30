# 函数式组件&Teleport 实现原理

[[toc]]

## 函数组件

函数式组件本质就是一个函数，函数的返回值就是虚拟 DOM。 在 Vue 3 中，所有的函数式组件都是用普通函数创建的。换句话说，不需要定义 `{ functional: true }` 组件选项。

```js
export const createVNode = (type, props, children = null) => {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;
  // 创建虚拟节点是
};
```

```js
function initProps(instance, propsOptions, propsData) {
  // ... 属性初始化的时候如果是函数式组件则 attrs就是函数式组件的props
  if (instance.vnode.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
    instance.props = attrs;
  }
}
```

> 产生 `subTree` 时, 要根据类型做不同的处理

```js
export function renderComponentRoot(instance) {
  let { render, proxy, vnode, props } = instance;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    return render.call(proxy, proxy);
  } else {
    return vnode.type(props); // 函数式组件直接调用即可
  }
}
const subTree = renderComponentRoot(instance);
```

## Teleport 组件

### Teleport 组件介绍

Vue3 新增组件，该组件可以将制定内容渲染到制定容器中。默认内容都是渲染到元素 app 内，我们可以将其渲染到任意节点 （传送门）

```ts
const shapeFlag = isString(type)
  ? ShapeFlags.ELEMENT
  : isTeleport(type) // 如果是穿梭框
  ? ShapeFlags.TELEPORT
  : isObject(type)
  ? ShapeFlags.STATEFUL_COMPONENT
  : isFunction(type)
  ? ShapeFlags.FUNCTIONAL_COMPONENT
  : 0; // 函数式组件
```

> 创建虚拟节点的时候标识组件类型。

### 组件挂载

```ts
if (shapeFlag & ShapeFlags.TELEPORT) {
  type.process(n1, n2, container, anchor, {
    mountChildren, // 挂载孩子
    patchChildren, // 更新孩子
    move(vnode, container) {
      // 移动元素
      hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container);
    },
  });
}
```

```ts
export const TeleportImpl = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    let { mountChildren, patchChildren, move } = internals;
    if (!n1) {
      // 创建一个目标
      const target = (n2.target = document.querySelector(n2.props.to));
      if (target) {
        mountChildren(n2.children, target, anchor);
      }
    } else {
      patchChildren(n1, n2, container); // 比对儿子
      if (n2.props.to !== n1.props.to) {
        // 更新并且移动位置
        // 获取下一个元素
        const nextTarget = document.querySelector(n2.props.to);
        n2.children.forEach(child => move(child, nextTarget));
      }
    }
  },
};
export const isTeleport = type => type.__isTeleport;
```
