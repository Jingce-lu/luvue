# 玩转 TypeScript 工具类型（下）

[[toc]]

本文是《玩转 TypeScript 工具类型》系列的最后一篇，包含了如下几部分内容：

- `ThisParameterType<Type>`
- `OmitThisParameter<Type>`
- `ThisType<Type>`

## 14. `ThisParameterType〈Type〉`

提取一个函数类型显式定义的 `this 参数`，如果没有显式定义的 `this 参数`，则返回 `unknown`。
这里有如下几个需要注意的点：

- `this 参数`只能叫 `this`，且必须在参数列表的第一个位置
- `this` 必须是显式定义的
- 这个 `this` 参数在函数实际被调用的时候不存在，不需要显式作为参数传入，而是通过 `call`、`apply` 或者是 `bind` 等方法指定

### >> 源码解析

```ts
type ThisParameterType<T> = T extends (this: infer U, ...args: any[]) => any
  ? U
  : unknown;
```

从源码可以看出对于类型参数 `T` 是要严格匹配`(this: infer U, ...args: any[]) => any` 格式的，所以对于 `this` 参数的名称和位置都是固定的。剩下的逻辑就是对 `this` 参数的类型定义一个类型参数 `U`，在 `extends` 判断走 `true` 分支时返回 `this` 类型参数 `U`，`false` 分支就返回 `unknown`。

### >> 实战用法

显式的定义 `this` 类型有助于我们在函数内部安全的使用 `this`。

```ts
function toHex(this: Number) {
  return this.toString(16);
}

function numberToString(n: ThisParameterType<typeof toHex>) {
  return toHex.apply(n);
}
```

注：定义了一个函数，要使用这个函数的类型，可以直接使用 `typeof [funcName]`，可以省去额外再定义一个类型声明。

## 15. `OmitThisParameter〈Type〉`

有了 `ThisParameterType` 获取 `this` 的类型，那么如何将一个定义了 `this` 参数类型的函数类型中的 this 参数类型去掉呢？
这就是 `OmitThisParameter` 做的事情。一句话概括，就是**对于没有定义 `this` 参数类型的函数类型，直接返回这个函数类型，如果定义了 `this` 参数类型，就返回一个仅是去掉了 `this` 参数类型的新函数类型**。

### >> 源码解析

```ts
type OmitThisParameter<T> = unknown extends ThisParameterType<T>
  ? T
  : T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T;
```

似乎有点长，其实就是两个嵌套的 `extends` 条件判断，分成两部分就很好理解了，首先是：

```ts
unknown extends ThisParameterType<T> ? T : ...
```

对于传入的函数类型 `T`，首先使用 `ThisParameterType` 获取 `this` 参数的类型，可能有两种结果一种是**成功拿到 `this` 参数类型并返回**，另一种是 `unknown`。
所以如果返回的是 unknown，那么就是走 true 分支，直接返回 T。如果不是返回的 unknown，那么就走 false 分支，即：

```ts
T extends (...args: infer A) => infer R ? (...args: A) => R : T
```

又是一个条件判断，即只要 `T` 是一个合法的函数类型，就一定满足`(...args: infer A) => infer R`，剩下的就是对参数定义一个类型参数 `A`，对返回值定义一个类型参数 `R`，返回`(...args: A) => R`，这个新的函数类型已经不包含 `this` 了。

### >> 实战用法

```ts
function toHex(this: Number) {
  return this.toString(16);
}

const fiveToHex: OmitThisParameter<typeof toHex> = toHex.bind(5);

console.log(fiveToHex());
```

## 16. `ThisType〈Type〉`

这个工具类型非常特殊，第一个特殊之处就是它的源码定义，是一个空接口：

```ts
/**
 * Marker for contextual 'this' type
 */
interface ThisType<T> {}
```

那么 `ThisType` 的作用是什么呢？正如官方注释所写的：**作为上下文 `this` 类型的标记**。

> 要使用 `ThisType` 必须保证 `noImplicitThis` 配置开启，后续我们只讨论开启的情况

那么如何理解这句话呢？我们需要从实际效果来理解，先看如下这段代码：

```ts
let demo1 = {
  a: 'lipengpeng',
  test(msg: string) {
    this;
  },
};
```

它的 this 类型是什么呢？

```ts
this: {
    a: string;
    test(msg: string): void;
}
```

也可以手动指定 `this` 类型，比如：

```ts
let demo2 = {
  a: 'lipengpeng',
  test(this: { a: string }, msg: string) {
    this;
  },
};
```

这时的 this 类型就是

```ts
this: {
    a: string
}
```

其实这只是**理想情况下的 `this` 类型分析**，因为 `TypeScript` 是通过静态代码分析推断出的类型，在实际运行阶段的 this 是可能发生变化的，那么我们**如何指定运行阶段的 `this` 类型呢？**。

如果只看如上两种情况，可能觉得不用 `ThisType` 也足够了，因为 `TypeScript` 会推断 `this` 类型，但是这只是简单情况，就如我们之前提到的，运行阶段的 `this` 是可以改变的，所以仅是依赖代码分析是无法预测到未来的 `this` 类型的，这时候就需要借助我们的主角——`ThisType` 了。
我们继续从实际的使用场景入手，实际开发中我们定义一个对象有时候会给一个数据结构，就类似于 `Vue2.x Options API`：

```ts
let options = {
  data: {
    x: 0,
    y: 0,
  },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx;
      this.y += dy;
    },
  },
};
```

我们希望在 `moveBy` 的 `this` 对象上可以直接获取到 `data` 对象中的`x 和 y`。为了实现这个功能，我们需要对定义的数据结构做一些处理，让 `methods` 和 `data` 中的属性共享同一个 `this` 对象，因此我们需要一个工具方法 `makeObject`

```ts
function makeObject(config) {
  let data = config?.data || {};
  let methods = config?.methods || {};
  return {
    ...data,
    ...methods,
  };
}

let options = makeObject({
  data: {
    x: 0,
    y: 0,
  },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx;
      this.y += dy;
    },
  },
});
```

方法也很简单，就是把 `data` 和 `methods` 展开，放在同一个对象 `options` 中，当我们通过`options.moveBy()`的方式调用 `moveBy` 的时候，`moveBy` 的 `this` 就是这个对象。
功能实现了，那么如何实现类型安全呢？接下来就需要在 `makeObject` 方法上做一些改动了，重点就是定义**参数类型和返回值类型**：

```ts
// 只考虑传入makeObject的config参数只包含data和methods两个参数
// 定义两个泛型参数D & M来代表它们的类型
type ObjectConfigDesc<D, M> = {
  data: D;
  methods: M;
};

function makeObject<D, M>(config: ObjectConfigDesc<D, M>): D & M {
  let data = config?.data || {};
  let methods = config?.methods || {};
  return {
    ...data,
    ...methods,
  } as D & M;
}
```

此时 `options` 对象的类型已经是类型安全的了。但是我们最关心的 `moveBy` 中的 `this` 对象却仍然会报类型警告，但我们知道在实际的运行过程中，`moveBy` 中的 `this` 对象已经可以取到 `x` 和 `y` 了，最后一步就是**明确告诉 `TypeScript` 这个 `this` 对象的真实类型了**，非常简单，利用 `ThisType`：

```ts
type ObjectConfigDesc<D, M> = {
  data: D;
  methods: M & ThisType<D & M>;
};
```

这时候再看 `options` 的类型提示已经是正确的了：

```ts
let options: {
  x: number;
  y: number;
} & {
  moveBy(dx: number, dy: number): void;
};
```

大家可以在 `TypeScript Playground` 中亲手试一试，感受会更深刻一些。 **注意：`ThisType` 仅支持在对象字面量的上下文中使用，在其他地方使用作用等同于空接口**。
