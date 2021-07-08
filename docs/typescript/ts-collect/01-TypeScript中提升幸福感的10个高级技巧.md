# TypeScript 中提升幸福感的 10 个高级技巧

[[toc]]

## 1. 注释

通过 `/** */` 形式的注释可以给 TS 类型做标记提示，编辑器会有更好的提示：

```ts
/** This is a cool guy. */
interface Person {
  /** This is name. */
  name: string;
}

const p: Person = {
  name: 'cool',
};
```

如果想给某个属性添加注释说明或者友好提示，这种是很好的方式了。

<div align="center"><img :src="$withBase('/images/ts/ts-01.webp')" alt="ts/ts-01.webp"></div>
<div align="center"><img :src="$withBase('/images/ts/ts-02.webp')" alt="ts/ts-02.webp"></div>

## 2. 接口继承

和类一样，接口也可以相互继承。

这让我们能够从一个接口里复制成员到另一个接口里，可以更灵活地将接口分割到可重用的模块里。

```ts
interface Shape {
  color: string;
}

interface Square extends Shape {
  sideLength: number;
}

let square = <Square>{};
square.color = 'blue';
square.sideLength = 10;
```

一个接口可以继承多个接口，创建出多个接口的合成接口。

```ts
interface Shape {
  color: string;
}

interface PenStroke {
  penWidth: number;
}

interface Square extends Shape, PenStroke {
  sideLength: number;
}

let square = <Square>{};
square.color = 'blue';
square.sideLength = 10;
square.penWidth = 5.0;
```

## 3. interface & type

TypeScript 中定义类型的两种方式：接口（interface）和 类型别名（type alias）。

比如下面的 Interface 和 Type alias 的例子中，除了语法，意思是一样的：

### Interface

```ts
interface Point {
  x: number;
  y: number;
}

interface SetPoint {
  (x: number, y: number): void;
}
```

### Type alias

```ts
type Point = {
  x: number;
  y: number;
};

type SetPoint = (x: number, y: number) => void;
```

而且两者都可以扩展，但是语法有所不同。此外，请注意，接口和类型别名不是互斥的。接口可以扩展类型别名，反之亦然。

### Interface extends interface

```ts
interface PartialPointX {
  x: number;
}
interface Point extends PartialPointX {
  y: number;
}
```

### Type alias extends type alias

```ts
type PartialPointX = { x: number };
type Point = PartialPointX & { y: number };
```

### Interface extends type alias

```ts
type PartialPointX = { x: number };
interface Point extends PartialPointX {
  y: number;
}
```

### Type alias extends interface

```ts
interface PartialPointX {
  x: number;
}
type Point = PartialPointX & { y: number };
```

它们的差别可以看下面这图或者看 TypeScript: Interfaces vs Types。

<div align="center"><img :src="$withBase('/images/ts/ts-03.webp')" alt="ts/ts-03.webp"></div>

所以檙想巧用 interface & type 还是不简单的。

如果不知道用什么，记住：能用 interface 实现，就用 interface , 如果不能就用 type 。

## 4. typeof

`typeof` 操作符可以用来获取一个变量或对象的类型。

我们一般先定义类型，再使用：

```ts
interface Opt {
  timeout: number;
}
const defaultOption: Opt = {
  timeout: 500,
};
```

有时候可以反过来：

```ts
const defaultOption = {
  timeout: 500,
};
type Opt = typeof defaultOption;
```

<div align="center"><img :src="$withBase('/images/ts/ts-04.webp')" alt="ts/ts-04.webp"></div>

当一个 interface 总有一个字面量初始值时，可以考虑这种写法以减少重复代码，至少减少了两行代码是吧，哈哈~

## 5. keyof

TypeScript 允许我们遍历某种类型的属性，并通过 keyof 操作符提取其属性的名称。

keyof 操作符是在 TypeScript 2.1 版本引入的，该操作符可以用于获取某种类型的所有键，其返回类型是联合类型。

`keyof` 与 `Object.keys` 略有相似，只不过 `keyof` 取 `interface` 的键。

```ts
const persion = {
  age: 3,
  text: 'hello world',
};

// type keys = "age" | "text"
type keys = keyof Point;
```

写一个方法获取对象里面的属性值时，一般人可能会这么写

```ts
function get1(o: object, name: string) {
  return o[name];
}

const age1 = get1(persion, 'age');
const text1 = get1(persion, 'text');
```

但是会提示报错

<div align="center"><img :src="$withBase('/images/ts/ts-05.webp')" alt="ts/ts-05.webp"></div>

因为 object 里面没有事先声明的 key。

当然如果把 `o: object` 修改为 `o: any` 就不会报错了，但是获取到的值就没有类型了，也变成 any 了。

<div align="center"><img :src="$withBase('/images/ts/ts-06.webp')" alt="ts/ts-06.webp"></div>

这时可以使用 `keyof` 来加强 `get` 函数的类型功能，有兴趣的同学可以看看 `_.get` 的 `type` 标记以及实现

```ts
function get<T extends object, K extends keyof T>(o: T, name: K): T[K] {
  return o[name];
}
```

<div align="center"><img :src="$withBase('/images/ts/ts-07.webp')" alt="ts/ts-07.webp"></div>

## 6. 查找类型

```ts
interface Person {
  addr: {
    city: string;
    street: string;
    num: number;
  };
}
```

当需要使用 addr 的类型时，除了把类型提出来

```ts
interface Address {
  city: string;
  street: string;
  num: number;
}

interface Person {
  addr: Address;
}
```

还可以

```ts
Person['addr']; // This is Address.
```

比如：

```ts
const addr: Person['addr'] = {
  city: 'string',
  street: 'string',
  num: 2,
};
```

<div align="center"><img :src="$withBase('/images/ts/ts-08.webp')" alt="ts/ts-08.webp"></div>

有些场合后者会让代码更整洁、易读。

## 7. 查找类型 + 泛型 + keyof

泛型（Generics）是指在定义函数、接口或类的时候，不预先指定具体的类型，而在使用的时候再指定类型的一种特性。

```ts
interface API {
  '/user': { name: string };
  '/menu': { foods: string[] };
}
const get = <URL extends keyof API>(url: URL): Promise<API[URL]> => {
  return fetch(url).then((res) => res.json());
};

get('');
get('/menu').then((user) => user.foods);
```

<div align="center"><img :src="$withBase('/images/ts/ts-09.webp')" alt="ts/ts-09.webp"></div>
<div align="center"><img :src="$withBase('/images/ts/ts-10.webp')" alt="ts/ts-10.webp"></div>

## 8. 类型断言

Vue 组件里面经常会用到 ref 来获取子组件的属性或者方法，但是往往都推断不出来有啥属性与方法，还会报错。

子组件：

```ts
<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    msg: String,
  },
})
export default class HelloWorld extends Vue {
  msg!: string;
}
</script>
```

父组件：

```ts
<template>
  <div class="home">
    <HelloWorld
      ref="helloRef"
      msg="Welcome to Your Vue.js + TypeScript App"
    />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

@Options({
  components: {
    HelloWorld,
  },
})
export default class Home extends Vue {
  print() {
    const helloRef = this.$refs.helloRef;
    console.log("helloRef.msg: ", helloRef.msg);
  }

  mounted() {
    this.print();
  }
}
</script>
```

因为 `this.$refs.helloRef` 是未知的类型，会报错误提示：

<div align="center"><img :src="$withBase('/images/ts/ts-11.webp')" alt="ts/ts-11.webp"></div>

做个类型断言即可：

```ts
print() {
    // const helloRef = this.$refs.helloRef;
    const helloRef = this.$refs.helloRef as any;
    console.log("helloRef.msg: ", helloRef.msg); // helloRef.msg:  Welcome to Your Vue.js + TypeScript App
  }
```

但是类型断言为 `any` 时是不好的，如果知道具体的类型，写具体的类型才好，不然引入 TypeScript 冒似没什么意义了。

## 9. 显式泛型

`$('button')` 是个 DOM 元素选择器，可是返回值的类型是运行时才能确定的，除了返回 any ，还可以

```ts
function $<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// 不确定 input 的类型
// const input = $('input');

// Tell me what element it is.
const input = $<HTMLInputElement>('input');
console.log('input.value: ', input.value);
```

<div align="center"><img :src="$withBase('/images/ts/ts-12.webp')" alt="ts/ts-12.webp"></div>
<div align="center"><img :src="$withBase('/images/ts/ts-13.webp')" alt="ts/ts-13.webp"></div>

函数泛型不一定非得自动推导出类型，有时候显式指定类型就好。

## 10. DeepReadonly

被 `readonly` 标记的属性只能在声明时或类的构造函数中赋值。

之后将不可改（即只读属性），否则会抛出 TS2540 错误。

与 ES6 中的 `const` 很相似，但 `readonly` 只能用在类（TS 里也可以是接口）中的属性上，相当于一个只有 `getter` 没有 `setter` 的属性的语法糖。

下面实现一个深度声明 `readonly` 的类型：

```ts
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

const a = { foo: { bar: 22 } };
const b = a as DeepReadonly<typeof a>;
b.foo.bar = 33; // Cannot assign to 'bar' because it is a read-only property.ts(2540)
```

<div align="center"><img :src="$withBase('/images/ts/ts-14.webp')" alt="ts/ts-14.webp"></div>
