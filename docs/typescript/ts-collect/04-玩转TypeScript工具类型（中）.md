# 玩转 TypeScript 工具类型（中）

[[toc]]

本文是《玩转 TypeScript 工具类型》系列的第二篇，包含了如下几部分内容：

- 必读：extends 条件运算符
- `Exclude<Type, ExcludeUnion>`
- `Extract<Type, Union>`
- `NonNullable<Type>`
- 必读：tuple type 元组类型
- `Parameters<Type>`
- `ConstructorParameters<Type>`
- `ReturnType<Type>`
- `InstanceType<Type>`

## 必读：extends 条件运算符

因为后续的源码中涉及到了 `extends` 关键字，所以需要先提前掌握这部分内容才能更好更容易的理解源码。可以参考[[译]TypeScript 条件类型](https://juejin.cn/post/6985463429502877726)，英语好的同学推荐直接看原文。

## 7. `Exclude〈Type, ExcludeUnion〉`：排除

将 `ExcludeUnion` 联合类型的所有成员从 `Type` 中排除，可以理解为取差集。剩余的部分返回作为一个新类型

### >> 源码解读

```ts
type Exclude<T, U> = T extends U ? never : T;
```

如何理解 `T extends U ? never : T` 呢？ **判断 `T` 中的每一项是否可以赋值给类型 `U`，如果可以，就返回 `never`，如果不可以，就返回当前这项**。

接下来我们结合一个具体的例子来理解一下这句话。

### >> 实战用法

```ts
// 排除一个具体的值
type T0 = Exclude<'a' | 'b' | 'c', 'a'>; // "a"

// 排除一种类型
type T1 = Exclude<string | number | (() => void), Function>;
```

以 `T0` 为例，`extends` 关键字是如何发挥作用的呢？

```ts
type T0 = Exclude<'a' | 'b' | 'c', 'a'>; // "b" | "c"

// 等价于
type T0 = 'a' extends 'a'
  ? never
  : 'a' | 'b' extends 'a'
  ? never
  : 'b' | 'c' extends 'a'
  ? never
  : 'c';

// 等价于
type T0 = never | 'b' | 'c';

// 等价于
type T0 = 'b' | 'c';
```

如果无法理解这里的等价逻辑，建议阅读开头推荐的[译]TypeScript 条件类型

## 8. `Extract〈Type, Union〉`：提取

选取 `Type` 类型和 `Union` 类型两者的公共部分并返回为一个新类型，可以理解为取交集。

### >> 源码解析

```ts
/**
 * Extract from T those types that are assignable to U
 */

type Extract<T, U> = T extends U ? T : never;
```

提取出类型 `T` 中那些能赋值给类型 `U` 的类型。所以**这里源码上和 `Exclude` 的区别就在于 `never` 放在了条件运算结果为 `false` 的分支上**。

所以如果理解了 `Exclude`，再理解 `Extract` 就不复杂了。

### >> 实战用法

```ts
// 提取一个具体的值
type T0 = Extract<'a' | 'b' | 'c', 'a'>; // "b" | "c"

// 提取一种类型
type T1 = Extract<string | number | (() => void), Function>;
```

## 9. `NonNullable〈Type〉`

过滤掉 `Type` 中的 `null` 和 `undefined`，剩余的类型作为一个新类型返回。其实就是 `Exclude` 的一种特殊情况。

### >> 源码解析

```ts
type NonNullable<T> = T extends null | undefined ? never : T;
```

可以发现和 `Exclude<T, U>`的源码非常像，只是把 `U` 换成了 `null | undefined`。所以结合 `Exclude<T, U>`还是很好理解的。

### >> 实战用法

```ts
type T0 = NonNullable<string | number | undefined>;

//  type T0 = string | number

type T1 = NonNullable<string[] | null | undefined>;

//  type T1 = string[]
```

## 必读：tuple type 元组类型

元组类型就是一个具有`固定数量元素`和`元素类型都确定`的数组类型。

> Tuple types allow you to express an array with a fixed number of elements whose types are known, but need not be the same.

例如这就是一个元组类型：

```ts
let x: [string, number];
```

当我们访问已声明类型的元素时，可以获得正确的类型检查：

```ts
// OK
console.log(x[0].substring(1));

// Property 'substring' does not exist on type 'number'.
console.log(x[1].substring(1));
```

当我们访问超出数组长度的下标时，获得的类型都是 `undefined`，并且会获得一个访问下标无可访问元素的错误提示：

```ts
let x: [string, number];

x = ['hello', 10]; // OK

// Type '"world"' is not assignable to type 'undefined'.

// Tuple type '[string, number]' of length '2' has no element at index '3'.

x[3] = 'world';

// Object is possibly 'undefined'.

// Tuple type '[string, number]' of length '2' has no element at index '5'.

console.log(x[5].toString());
```

## 10. `Parameters〈Type〉`

基于一个函数参数的类型构造一个元组类型（tuple type）。所以这个工具类型的作用就是**获取函数参数的类型**

### >> 源码解析

```ts
/**
 * Obtain the parameters of a function type in a tuple
 */

type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

源码中重点有两部分：

- `T extends (...args: any) => any`，规定了 `T` 必须是一个函数（`any` 和 `never` 除外），参数是 `any` 类型，所以参数可以是任意类型。
- `T extends (...args: infer P) => any ? P : never`，如果 `T` 是函数类型，那么这个 `extends` 走的就是 `true` 分支，也就是返回一个 `P` 类型，而这个 `P` 类型就是参数 `args` 的类型

### >> 实战用法

```ts
declare function f1(arg: { a: number; b: string }): void;

type T0 = Parameters<() => string>;

//  type T0 = []

type T1 = Parameters<(s: string) => void>;

//  type T1 = [s: string]

type T2 = Parameters<<T>(arg: T) => T>;

//  type T2 = [arg: unknown]

type T3 = Parameters<typeof f1>;

//  type T3 = [arg: { a: number; b: string; }]

type T4 = Parameters<any>;

//  type T4 = unknown[]

type T5 = Parameters<never>;

//  type T5 = never

type T6 = Parameters<string>;

//  Type 'string' does not satisfy the constraint '(...args: any) => any'.

type T7 = Parameters<Function>;

//  Type 'Function' does not satisfy the constraint '(...args: any) => any'.

//     Type 'Function' provides no match for the signature '(...args: any): any'.
```

这里需要关注一下 `Parameters` 传入 `never` 和 `any` 的情况，知道即可。

## 11. `ConstructorParameters〈Type〉`

把构造函数的参数类型作为一个元组类型返回。我们已经知道如何获取一个函数的参数类型，即[Parameters](# 9. )。那么如果我们要获取构造函数的参数类型，那么首先先要判断出哪一个是构造函数，然后获取参数类型即可，思路是这么个思路，那么应该怎么实现呢？

### >> 源码解析

```ts
/**
 * Obtain the parameters of a constructor function type in a tuple
 */

type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never;
```

这里有两个需要关注的点：

- `abstract` 关键字修饰的函数叫抽象方法，而**抽象方法只能出现在抽象类中**
- `new (...args: any) => any`，这就是对构造函数的定义

所以，`ConstructorParameters` 工具类型只是针对抽象类来发挥效果的，`never` 和 `any` 我们不需要关心。

### >> 实战用法

这里结合一个具体的例子，深入了解一下，就以 `ErrorConstructor` 为例：

```ts
interface ErrorConstructor {
  new (message?: string): Error;

  (message?: string): Error;

  readonly prototype: Error;
}

type T0 = ConstructorParameters<ErrorConstructor>;
```

这里 `ConstructorParameters` 是如何处理的呢？**其实就是对 `ErrorConstructor` 的三条属性逐一代入 `T extends abstract new (...args: infer P) => any ? P : never;`，满足条件的就返回参数类型 `P`**。

```ts
type T0 = string;
```

## 12. `ReturnType〈Type〉`

获取函数的返回值类型。结合我们在[Parameters](# 10. )获取函数参数类型的实现，可以很容易的自己实现出这个工具类型。

### >> 源码解析

```ts
/**
 * Obtain the return type of a function type
 */

type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

和 `Parameters<Type>`实现的唯一的区别就是 `infer` 的位置从参数位置跑到了返回值位置。这还是很好理解的。

**注意返回值类型不是元组类型，因为在 `Parameters<Type>`中，`args` 是一个数组，所以返回的是一个元组类型，而函数的返回值可以是任意类型的**。

### >> 实战用法

```ts
declare function f1(): { a: number; b: string };

type T0 = ReturnType<() => string>;

//  type T0 = string

type T1 = ReturnType<(s: string) => void>;

//  type T1 = void

type T2 = ReturnType<<T>() => T>;

//  type T2 = unknown

type T3 = ReturnType<<T extends U, U extends number[]>() => T>;

//  type T3 = number[]

type T4 = ReturnType<typeof f1>;

//  type T4 = {a: number;b: string;}

type T5 = ReturnType<any>;

//  type T5 = any

type T6 = ReturnType<never>;

//  type T6 = never

type T7 = ReturnType<string>;

//  类型“string”不满足约束“(...args: any) => any”。ts(2344)

type T8 = ReturnType<Function>;

//  类型“Function”不满足约束“(...args: any) => any”。

//   类型“Function”提供的内容与签名“(...args: any): any”不匹配。ts(2344)
```

## 13. `InstanceType〈Type〉`

获取构造函数实例的返回类型。也就是对构造函数调用 new 操作符后的返回值类型。我们已经知道了如何获取构造函数参数的类型，所以很方便的就可以推导出如何获取实例的类型。

### >> 源码解析

```ts
/**
 * Obtain the return type of a constructor function type
 */

type InstanceType<T extends abstract new (...args: any) => any> = T extends abstract new (...args: any) => infer R ? R : any;
```

也是把 `infer` 的位置从参数位置移到了返回值位置。

### >> 实战用法

这里我们继续以 `FunctionConstructor` 为例：

```ts
interface FunctionConstructor {
  /**

   * Creates a new function.

   * @param args A list of arguments the function accepts.

   */

  new (...args: string[]): Function;

  (...args: string[]): Function;

  readonly prototype: Function;
}

type T0 = InstanceType<FunctionConstructor>;
```

结合 `new(...args: string[]): Function;`可知：

```ts
type T0 = Function;
```

更多情况可以在 `typescript playground` 中自己尝试一下。
