# Vue3 实现 Tree 组件

[[toc]]

## 一.组件初始化操作

### 1.创建树组件

```js
export default {
  name: 'LuTree',
  setup() {
    return () => <h1>hello tree</h1>;
  },
};
```

### 2.注册树组件

```js
import Tree from './tree.jsx';
import '../../style/tree.scss';
Tree.install = (app) => {
  app.component(Tree.name, Tree);
};
export default Tree;
```

> 此时树组件已经变为全局，可以直接被使用了

## 二.通过数据渲染树组件

### 1.组件的递归渲染

```js
const state = reactive({
  treeData: [
    {
      id: '1',
      name: '菜单1',
      children: [
        {
          id: '1-1',
          name: '菜单1-1',
          children: [{ id: '1-1-1', name: '菜单1-1-1' }],
        },
      ],
    },
    {
      id: '2',
      name: '菜单2',
      children: [
        {
          id: '2-1',
          name: '菜单2-1',
          children: [{ id: '2-1-1', name: '菜单2-1-1' }],
        },
        {
          id: '2-2',
          name: '菜单2-2',
          children: [{ id: '2-2-1', name: '菜单2-2-1' }],
        },
      ],
    },
  ],
});
```

```js
export default {
  name: 'AiljcTree',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const data = props.data;
    function renderNode(data) {
      if (data && data.length == 0) {
        // 无节点情况
        return <div>无任何节点</div>;
      }
      function renderChild(item) {
        // 渲染每一个节点
        return (
          <div class='ai-tree-node'>
            <div class='ai-tree-label'>{item.name}</div>
            {item.children && item.children.map((child) => renderChild(child))}
          </div>
        );
      }
      return data.map((item) => renderChild(item));
    }
    return () => <div class='ai-tree'>{renderNode(data)}</div>;
  },
};
```

> 递归渲染树组件，但是我们把逻辑都放在 Tree 组件中，显得过于臃肿。我们可以将子节点渲染单独拿到一个组件中进行!

### 2.组件的分割

```js
import TreeNode from './tree-node';
export default {
  components: {
    [TreeNode.name]: TreeNode,
  },
  setup(props) {
    const data = props.data;
    function renderNode(data) {
      if (data && data.length == 0) {
        // 无节点情况
        return <div>无任何节点</div>;
      }
      // 渲染子节点
      return data.map((item) => <ai-tree-node data={item}></ai-tree-node>);
    }
    return () => <div class='ai-tree'>{renderNode(data)}</div>;
  },
};
```

```js
export default {
  name: 'AiljcTreeNode',
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const data = props.data;
    return () => {
      return (
        <div class='ai-tree-node'>
          <div class='ai-tree-label'>{data.name}</div>
          <div class='ai-tree-list'>
            {data.children &&
              data.children.map((child) => (
                <ai-tree-node data={child}></ai-tree-node>
              ))}
          </div>
        </div>
      );
    };
  },
};
```

### 3.美化树组件样式

```scss
@import './common/_var.scss';
@import './mixins/mixins.scss';

@include blockquote(tree) {
  position: relative;
  .ai-tree-label {
    padding-left: 24px;
  }
  .ai-tree-list {
    padding-left: 34px;
  }
}
```

## 三.组件展开收缩功能

### 1.显示展开图标

```js
const showArrow = computed(() => {
  // 是否显示箭头
  return data.children && data.children.length > 0;
});
const classes = computed(() => [
  'ai-tree-node',
  !showArrow.value && 'ai-tree-no-expand',
]);
<div class={classes.value}></div>;
```

> 通过计算属性的方式绑定样式

```scss
@include blockquote(tree) {
  position: relative;
  .ai-tree-node {
    user-select: none;
    &.ai-tree-no-expand {
      .ai-icon {
        visibility: hidden;
      }
    }
  }
}
```

### 2.增加树的折叠功能

```
const methods = {
    handleExpand(){
   		data.expand = !data.expand;
    }
}
<div class="ai-tree-label" onClick={methods.handleExpand}>
    <ai-icon icon="right"></ai-icon>
    <span>{data.name}</span>
</div>
```

> 实现树的展开折叠功能

## 四.增加选择功能

增加 `checkbox` 切换选择时动态给当前数据增加 checked 属性

```
const methods = {
    handleChange() {
        data.checked = !data.checked; // 切换选中功能
    }
}
<div class={classes.value}>
    <div class="ai-tree-label" onClick={methods.handleExpand}>
        <ai-icon icon="right"></ai-icon>
        <input type="checkbox" checked={data.checked} onClick={withModifiers(methods.handleChange, ['stop'])} />
        <span>{data.name}</span>
    </div>
    <div class="ai-tree-list" vShow={data.expand}>
        {data.children && data.children.map(child => <ai-tree-node data={child}></ai-tree-node>)}
    </div>
</div>
```

### 1.获取选中的节点

先将所有数据拍平获得 checked 值为 true 的节点,并标记父节点。给所有节点增加唯一标识

```js
export const flattenTree = (data) => {
  let key = 0;
  function flat(data, parent) {
    return data.reduce((obj, currentNode) => {
      currentNode.key = key;
      obj[key] = {
        parent,
        node: currentNode,
      };
      key++;
      if (currentNode.children) {
        obj = { ...obj, ...flat(currentNode.children, currentNode) };
      }
      return obj;
    }, {});
  }
  return flat(data);
};
```

### 2.将方法暴露到上下文中

```js
const flatMap = flattenTree(data);
const methods = {
  getCheckNodes() {
    // 获取所有选中的节点
    return Object.values(flatMap).filter((item) => item.node.checked);
  },
};
const instance = getCurrentInstance();
// 将方法暴露在当前实例的上下文中
instance.ctx.getCheckNodes = getCheckNodes;
```

### 3.通过 ref 进行获取

```
<ai-tree :data="treeData" ref="tree"></ai-tree>
export default {
  setup() {

    let tree = ref(null); // 设置ref
    function getCheckedNodes() {
      console.log(tree.value.getCheckNodes()); // 获取所有节点
    }
    return {
      ...toRefs(state),
      tree,
      getCheckedNodes,
    };
  },
};
```

## 五.设置级联选中状态

```js
updateTreeDown(node,checked){
    if(node.children){
        node.children.forEach(child=>{
            child.checked = checked;
            methods.updateTreeDown(child,checked)
        })
    }
}
updateTreeUp(node,checked){
    let parentNode = flatMap[node.key].parent;
    if(!parentNode) return;
    let parentKey = parentNode.key;
    const parent = flatMap[parentKey].node; // 找到爸爸节点
    if(checked){ // 看爸爸里儿子是否有选中的项
        parent.checked = parent.children.every(node=>node.checked);
    }else{
        parent.checked = false;
    }
    methods.updateTreeUp(parent,checked);
}
```

```js
provide('TREE_PROVIDER', {
  treeMethods: methods,
});
```

> 在父组件中将方法暴露出去, 以便子组件调用这些方法

```js
let { treeMethods } = inject('TREE_PROVIDER');
const methods = {
  handleExpand() {
    data.expand = !data.expand;
  },
  handleChange() {
    data.checked = !data.checked;
    treeMethods.updateTreeDown(data, data.checked); // 通知下层元素
    treeMethods.updateTreeUp(data, data.checked); // 通知上层元素
  },
};
```

## 六.异步加载

### 1.传递异步方法

```
<ai-tree :data="treeData" ref="tree" :load="loadFn"></ai-tree>
function loadFn(data, cb) {
    if (data.id == 1) {
    setTimeout(() => {
        cb([
        {
            id: "1-1",
            name: "菜单1-1",
            children: [],
        },
        ]);
    }, 1000);
    } else if (data.id == "1-1") {
    setTimeout(() => {
        cb([{ id: "1-1-1", name: "菜单1-1-1" }]);
    }, 1000);
    }
}
```

```js
provide('TREE_PROVIDER', {
  treeMethods: methods,
  load: props.load,
});
```

```js
let { treeMethods, load } = inject('TREE_PROVIDER');
const methods = {
  handleExpand() {
    if (data.children && data.children.length == 0) {
      // 如果没有儿子是空的
      if (load) {
        // 有加载方法就进行加载
        data.loading = true; // 正在加载
        load(data, (children) => {
          data.children = children;
          data.loading = false; // 加载完毕
        });
      }
    }
    data.expand = !data.expand;
  },
  handleChange() {
    data.checked = !data.checked;
    treeMethods.updateTreeDown(data, data.checked);
    treeMethods.updateTreeUp(data, data.checked);
  },
};
```

```js
const isLoaded = ref(false); // 用来标识加载完毕
const showArrow = computed(() => { // 是否显示箭头  没儿子 而且也加载完了
    return (data.children && data.children.length > 0) || (load && !isLoaded.value)
});

handleExpand() {
    if (data.children && data.children.length == 0) { // 如果没有儿子是空的
        if (load) { // 有加载方法就进行加载
            data.loading = true; // 正在加载
            load(data, (children) => {
                data.children = children;
                data.loading = false; // 加载完毕
                isLoaded.value = true;
            })
        }
    }else{
        isLoaded.value = true;
    }
    data.expand = !data.expand;
}
```

> 实现 tree 组件数据的异步加载。这里要注意数据新增后要重新构建父子关系

```js
watch(data, () => {
  flatMap = flattenTree(data);
});
```

> 监控数据变化重新格式化数据。

## 七.定制化节点插槽实现

```html
<ai-tree :data="treeData" ref="tree" :load="loadFn">
  <template v-slot="{name}">
    <b>{{name}}</b>
  </template>
</ai-tree>
```

```js
provide('TREE_PROVIDER', {
  treeMethods: methods,
  load: props.load,
  slot: context.slots.default,
});
```

```js
let { treeMethods, load, slot } = inject('TREE_PROVIDER');
{
  slot ? slot(data) : <span>{data.name}</span>;
}
```

> 通过作用域插槽将组件内的数据传递给父组件

## 八.拖拽实现

```js
const classes = computed(() => [
    'ai-tree-node',
    !showArrow.value && 'ai-tree-no-expand',
    draggable && 'ai-tree-draggable'
]);
const instance = getCurrentInstance()
const dragEvent = {
    ...(draggable ? {
        onDragstart(e) {
            e.stopPropagation();
            treeMethods.treeNodeDragStart(e,instance, data);
        },
        onDragover(e) {
            e.stopPropagation();
            treeMethods.treeNodeDragOver(e,instance, data);
        },
        onDragend(e) {
            e.stopPropagation();
            treeMethods.treeNodeDragEnd(e,instance, data);
        }
    } : {})
}
<div class={classes.value} {...dragEvent}>
```

> 根据 `draggable` 属性决定是否添加拖拽事件

```scss
.ai-tree-node {
  &.ai-tree-draggable {
    user-select: none;
    -webkit-user-drag: element;
  }
}
```

> 设置文字不能选择，元素可以拖动

### 1.拖动线设置

```html
<div
  class="ai-tree-indicator"
  ref="indicator"
  vShow="{state.showDropIndicator}"
></div>
```

```scss
.ai-tree-indicator {
  position: absolute;
  height: 1px;
  right: 0;
  left: 0;
  background-color: #409eff;
}
```

### 2.拖动事件处理逻辑

```js
const state = reactive({
    dropPosition: '', // 拖拽的位置
    dragNode: null, // 拖的是谁数据
    showDropIndicator: false, // 推拽标尺
    draggingNode: null // 拖拽的节点
})
treeNodeDragStart(e,nodeInstance, data) {
    state.draggingNode = nodeInstance; // 拖拽的实例
    state.dragNode = data; // 拖拽的数据
},
treeNodeDragOver(e,nodeInstance, data) {
    // 在自己身上滑来滑去
    if(state.dragNode.key == data.key){
        return;
    }
    let overEl= nodeInstance.ctx.$el; // 经过的el，是当前拖住的儿子
    if(state.draggingNode.ctx.$el.contains(overEl)){
        return
    }
    // 获取目标节点label的位置
    let targetPosition = overEl.firstElementChild.getBoundingClientRect();
    // 树的位置
    let treePosition = instance.ctx.$el.getBoundingClientRect();
    let distance = e.clientY - targetPosition.top; // 鼠标相对于 文本的位置

    if(distance < targetPosition.height * 0.2){
        state.dropPosition = 1;
    }else if(distance > targetPosition.height* 0.8){
        state.dropPosition = -1; // 后面
    }else{
        state.dropPosition = 0;
    }
    let iconPosition = overEl.querySelector('.ai-icon').getBoundingClientRect();
    let indicatorTop = -9999;
    if(state.dropPosition == 1){
        indicatorTop = iconPosition.top - treePosition.top; // 获取线相对于树的位置
    }else if(state.dropPosition == -1){
        indicatorTop = iconPosition.bottom - treePosition.top;
    }
    state.showDropIndicator = (state.dropPosition == 1) || (state.dropPosition == -1);
    const indicator = instance.ctx.$refs.indicator;
    indicator.style.top = indicatorTop + 'px';
    indicator.style.left = iconPosition.right - treePosition.left + 'px';
},
treeNodeDragEnd(e,nodeInstance, data) {
    state.showDropIndicator = false;
    state.dropPosition = '';
    state.dragNode = null;
    state.draggingNode = null;
}
```
