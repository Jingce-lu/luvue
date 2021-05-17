# 从零手写 Vue3 中 diff 算法

[[toc]]

## 一.组件更新

当依赖的属性变化时，会重新执行 effect 函数，我们再次调用 render 方法生成新的虚拟 DOM，进行 diff 操作

```js
instance.update = effect(function componentEffect() {
  if (!instance.isMounted) {
    // ...
  } else {
    const prevTree = instance.subTree;
    const proxyToUse = instance.proxy;
    const nextTree = instance.render.call(proxyToUse, proxyToUse); // 在来一次
    instance.subTree = nextTree;
    patch(prevTree, nextTree, container);
  }
});
```

## 二.前后元素不一致

两个不同虚拟节点不需要进行比较，直接移除老节点，将新的虚拟节点渲染成真实 DOM 进行挂载即可

```js
const { createApp, h, reactive } = VueRuntimeDOM;
const App = {
  setup() {
    let state = reactive({ flag: true });
    return {
      state
    };
  },
  render: r => {
    return r.state.flag
      ? h(
          "div",
          {
            onClick: () => {
              r.state.flag = false;
            }
          },
          "hello"
        )
      : h("p", {}, "world");
  }
};
createApp(App).mount("#app");
```

> 切换显示不同的节点

```js
const isSameVNodeType = (n1, n2) => {
  return n1.type == n2.type && n1.key === n2.key;
};
const unmount = vnode => {
  hostRemove(vnode.el); // 未考虑组件情况
};
const patch = (n1, n2, container, anchor = null) => {
  const { shapeFlag, type } = n2;
  if (n1 && !isSameVNodeType(n1, n2)) {
    anchor = hostNextSibling(n1.el); // 获取老元素下一个元素
    unmount(n1);
    n1 = null;
  }
};
```

## 三.前后元素一致

```js
const App = {
  setup() {
    let state = reactive({ flag: true });
    return {
      state
    };
  },
  render: r => {
    return r.state.flag
      ? h(
          "div",
          {
            style: { color: "red" },
            onClick: () => {
              r.state.flag = false;
            }
          },
          "hello"
        )
      : h("div", { style: { color: "blue" } }, "world");
  }
};
createApp(App).mount("#app");
```

> 前后虚拟节点一样，则复用 DOM 元素，并且更新属性和子节点

```js
const patchElement = (n1, n2, anchor) => {
  // 两个元素相同  1.比较属性 2.比较儿子
  let el = (n2.el = n1.el);
  const oldProps = n1.props || {};
  const newProps = n2.props || {};
  patchProps(oldProps, newProps, el);
  patchChildren(n1, n2, el, anchor);
};
```

### 1.属性更新

```js
const patchProps = (oldProps, newProps, el) => {
  if (oldProps !== newProps) {
    // 新的属性 需要覆盖掉老的
    for (let key in newProps) {
      const prev = oldProps[key];
      const next = newProps[key];
      if (prev !== next) {
        hostPatchProp(el, key, prev, next);
      }
    }
    // 老的有的属性 新的没有 将老的删除掉
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }
};
```

### 2.比较儿子节点

> 针对子节点类型做基本 `diff` 操作，最复杂的情况莫过于双方都有儿子的情况

```js
const unmountChildren = children => {
  for (let i = 0; i < children.length; i++) {
    unmount(children[i]);
  }
};
const patchChildren = (n1, n2, container, anchor = null) => {
  const c1 = n1.children; // 获取所有老的节点
  const c2 = n2.children; // 获取新的所有的节
  const prevShapeFlag = n1.shapeFlag; // 上一次元素的类型
  const shapeFlag = n2.shapeFlag; // 这一次的元素类型

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 目前是文本元素
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 老的是数组
      unmountChildren(c1); // 可能有组件 调用组件的卸载方法
    }
    if (c2 !== c1) {
      hostSetElementText(container, c2);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 新老都是数组
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeydChildren(c1, c2, container, anchor); // core
      } else {
        // 没有新孩子
        unmountChildren(c1);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 移除老的文本
        hostSetElementText(container, "");
      }
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 去把新的元素进行挂在 生成新的节点塞进去
        mountChildren(c2[i], container, anchor);
      }
    }
  }
};
```

## 四.核心 Diff 算法

> 针对双方儿子都是数组形式

```js
const App = {
  render: r => {
    return r.state.flag
      ? h("div", [h("li", { key: "A" }, "A"), h("li", { key: "B" }, "B")])
      : h("div", [h("li", { key: "A" }, "A"), h("li", { key: "B" }, "B")]);
  }
};
createApp(App).mount("#app");
```

### 1.sync from start

<div align="center"><img :src="$withBase('/images/vue3/diff-1.png')" alt="vue3/diff-1.png"></div>

```js
const patchKeydChildren = (c1, c2, container, anchor) => {
  let i = 0;
  const l2 = c2.length;
  let e1 = c1.length - 1;
  let e2 = l2 - 1;
  // 1. sync from start
  // (a b) c
  // (a b) d e
  while (i <= e1 && i <= e2) {
    const n1 = c1[i];
    const n2 = c2[i];
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container, null);
    } else {
      break;
    }
    i++;
  }
};
```

### 2.sync from end

<div align="center"><img :src="$withBase('/images/vue3/diff-2.png')" alt="vue3/diff-2.png"></div>

```js
// 2. sync from end
// a (b c)
// d e (b c)
while (i <= e1 && i <= e2) {
  const n1 = c1[e1];
  const n2 = c2[e2];
  if (isSameVNodeType(n1, n2)) {
    patch(n1, n2, container, null);
  } else {
    break;
  }
  e1--;
  e2--;
}
```

### 3.common sequence + mount

<div align="center"><img :src="$withBase('/images/vue3/diff-3.png')" alt="vue3/diff-3.png"></div>

<div align="center"><img :src="$withBase('/images/vue3/diff-4.png')" alt="vue3/diff-4.png"></div>

```js
// 3. common sequence + mount
// (a b)
// (a b) c
// i = 2, e1 = 1, e2 = 2
// (a b)
// c (a b)
// i = 0, e1 = -1, e2 = 0
if (i > e1) {
  // 说明有新增
  if (i <= e2) {
    // 表示有新增的部分
    // 先根据e2 取他的下一个元素  和 数组长度进行比较
    const nextPos = e2 + 1;
    const anchor = nextPos < c2.length ? c2[nextPos].el : null;
    while (i <= e2) {
      patch(null, c2[i], container, anchor);
      i++;
    }
  }
}
```

### 4.common sequence + unmount

<div align="center"><img :src="$withBase('/images/vue3/diff-5.png')" alt="vue3/diff-5.png"></div>

<div align="center"><img :src="$withBase('/images/vue3/diff-6.png')" alt="vue3/diff-6.png"></div>

```js
// 4. common sequence + unmount
// (a b) c
// (a b)
// i = 2, e1 = 2, e2 = 1
// a (b c)
// (b c)
// i = 0, e1 = 0, e2 = -1
else if (i > e2) {
    while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true)
        i++
    }
}
```

### 5.unknown sequence

**1).`build key:index map for newChildren`**

<div align="center"><img :src="$withBase('/images/vue3/diff-7.png')" alt="vue3/diff-7.png"></div>

```js
// 5. unknown sequence
// a b [c d e] f g
// a b [e c d h] f g
// i = 2, e1 = 4, e2 = 5
const s1 = i;
const s2 = i;
const keyToNewIndexMap = new Map();
for (let i = s2; i <= e2; i++) {
  const nextChild = c2[i];
  keyToNewIndexMap.set(nextChild.key, i);
}
```

**2).`loop through old children left to be patched and try to patch`**

```js
const toBePatched = e2 - s2 + 1;
const newIndexToOldMapIndex = new Array(toBePatched).fill(0);
for (let i = s1; i <= e1; i++) {
  const prevChild = c1[i];
  let newIndex = keyToNewIndexMap.get(prevChild.key); // 获取新的索引
  if (newIndex == undefined) {
    unmount(prevChild); // 老的有 新的没有直接删除
  } else {
    newIndexToOldMapIndex[newIndex - s2] = i + 1;
    patch(prevChild, c2[newIndex], container);
  }
}
```

**3).move and mount**

<div align="center"><img :src="$withBase('/images/vue3/diff-8.png')" alt="vue3/diff-8.png"></div>

```js
for (let i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = s2 + i; // [ecdh]   找到h的索引
  const nextChild = c2[nextIndex]; // 找到 h
  let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null; // 找到当前元素的下一个元素
  if (newIndexToOldMapIndex[i] == 0) {
    // 这是一个新元素 直接创建插入到 当前元素的下一个即可
    patch(null, nextChild, container, anchor);
  } else {
    // 根据参照物 将节点直接移动过去  所有节点都要移动 （但是有些节点可以不动）
    hostInsert(nextChild.el, container, anchor);
  }
}
```

## 五. 最长递增子序列

> Vue3 采用最长递增子序列，求解不需要移动的元素有哪些

```js
function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 保存最长递增子序列的索引
  let resultLastIndex;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i]; // 获取数组中的每一项，但是0 没有意义我们需要忽略掉
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i); // 记录索引
        continue;
      }
    }
  }
  return result;
}
// 针对默认递增的序列进行优化
console.log(getSequence([2, 6, 7, 8, 9, 11]));
```

```js
function getSequence1(arr) {
  const len = arr.length;
  const result = [0]; // 保存最长递增子序列的索引
  const p = arr.slice(); // p 用来追溯的数组
  let resultLastIndex;
  let start;
  let end;
  let middle = 0;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]; // 获取数组中的每一项，但是0 没有意义我们需要忽略掉
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i); // 记录索引
        continue;
      }
      start = 0;
      end = result.length - 1; // 二分查找 前后索引
      while (start < end) {
        // 最终start = end
        middle = ((start + end) / 2) | 0;
        // 拿result中间值合  最后一项比较
        if (arr[result[middle]] < arrI) {
          // 找比arrI大的值 或者等于arrI
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        result[start] = i; // 用更有潜力的来替换
      }
    }
  }
  return result;
}
// 针对默认递增的序列进行优化
console.log(getSequence1([1, 5, 8, 2]), "my"); //  [0,3,2]
```

这里我们仅仅知道最长递增子序列的最小末尾

假设有：[2,3,1,5,6,8,7,9,4] 为最新序列 -> 按照上述结果得出的结论为：[ 2, 1, 8, 4, 6, 7 ]

<div align="center"><img :src="$withBase('/images/vue3/sequence.png')" alt="vue3/sequence.png"></div>

```js
function getSequence2(arr) {
  const len = arr.length;
  const result = [0];
  const p = arr.slice();
  let resultLastIndex;
  let start;
  let end;
  let middle = 0;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex; // 记录上一次
        result.push(i);
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1]; // 记录上一次
        }
        result[start] = i;
      }
    }
    let len = result.length;
    let last = result[len - 1];
    while (start-- > 0) {
      // 倒序追溯
      result[start] = last;
      last = p[last];
    }
  }
  return result;
}
console.log(getSequence2([2, 3, 1, 5, 6, 8, 7, 9, 4]));
```
