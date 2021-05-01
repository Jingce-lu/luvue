# 玩转 TypeScript 工具类型（上）

[[toc]]

## 前

- 从源码的角度理解每一种工具类型的实现机制
- 通过一两个简单的例子了解每一种工具类型的基本用法
- 于此同时加深对 `TypeScript` 的理解
- 最终实现可以在实际工作中举一反三

## 1. `Partial〈Type〉`：可选

### 源码解读

`Partial<Type>`类型的源码如下所示：

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

这里需要关注四个点：

- `<T>`：这是目标类型，也就是我们要做处理的类型，类型不确定，所以用泛型`T`表示
- `[P in keyof T]：keyof T`返回 `T` 类型的所有键组成的一个类型，`in` 可以按照 js 中的 `for..in` 遍历去理解，后续对 `keyof` 有更详细的说明
- `?`：可选，把返回类型的所有属性都转为可选类型
- 返回的是一个新类型，这个新类型来源于 `T`，并且和 `T` 在属性上有一种**继承关系**，在第 2 小节对 `Required<Type>`的说明中会验证这一点

基于对源码的理解，就可以很好的理解`Partial<Type>`类型的作用就是**返回一个新类型，这个新类型和目标类型 T 拥有相同的属性，但所有属性都是可选的**。

### 实战用法

场景说明：在实际的业务开发中，经常会遇到需要对一个数据对象做整体或者局部更新的需求，这里就可以用到`Partial<Type>`

```ts
interface DataModel {
  name: string;
  age: number;
  address: string;
}

let store: DataModel = {
  name: '',
  age: 0,
  address: '',
};

function updateStore(store: DataModel, payload: Partial<DataModel>): DataModel {
  return {
    ...store,
    ...payload,
  };
}

store = updateStore(store, {
  name: 'lpp',
  age: 18,
});
```

### 补充 增加一个对 keyof 的说明

这里增加一个对 keyof 的说明，通过一段代码来理解一下：

```ts
interface Person {
  name: string;
  age: number;
  location: string;
}

type K1 = keyof Person; // "name" | "age" | "location"
type K2 = keyof Person[]; // "length" | "push" | "pop" | "concat" | ...
type K3 = keyof { [x: string]: Person }; // string

const person: Person = {
  name: '',
  age: 0,
  location: '',
};

type k11 = keyof typeof person; // "name" | "age" | "location"
```

> [参考一：官方文档说明](https://www.tslang.cn/docs/release-notes/typescript-2.1.html)

> [参考二：What does “keyof typeof” mean in TypeScript?](https://stackoverflow.com/questions/55377365/what-does-keyof-typeof-mean-in-typescript)

## 2.`Required〈Type〉`

### 源码解读

```ts
type Required<T> = {
  [P in keyof T]-?: T[P];
};
```

这个类型的作用就是把类型 `T` 中的所有属性都转为必填属性。
这里源码中使用了一个`-?`来标注属性为必填的属性，那么这个`-?`是否是必须的呢？因为我们理解的可选属性是用?明确标识的才是可选的，如果我们把`-?`去掉，为什么就无法实现 `Required` 的效果了呢？我们先写一个 `MyRequired<T>`，如下所示：

```ts
type MyRequired<T> = {
  [P in keyof T]: T[P];
};

interface Props {
  a?: number;
  b?: string;
}

const obj: MyRequired<Props> = {
  a: 5,
};
```

> [亲手试一试](https://www.typescriptlang.org/play?ts=4.2.3#code/C4TwDgpgBAsiBKECOBXAlgJwgEwDwBUA+KAXigG8AoKKAbQAUo0A7KAawhAHsAzKfALoAufgwEBuSgF9JlFs)

上面的代码是没有类型错误的，为什么呢？因为如果只是`[P in keyof T]`，`P`中的属性会**保留它自身在`T`中的可选性**。即之前如果是必填的，在新类型中还是必填的，如果是选填的同理。有点类似一种`“继承关系”`。
所以使用`-?`来清除可选性实现`Required`。**当然，`+?`也是有效的，所以参考`Partial<T>`，可知`+?`的`+`是可以省略的**。

### 实战用法

`Required<T>`会将传入的 T 类型的所有属性都转为必要的。所以最常见的用法就是做诸如此类的转换，但是如果只是想把 `T` 类型的**某些属性转为必填并把这些属性返回成一个新类型**：

```ts
interface Props {
  a?: string;
  b?: string;
  c?: string;
}

// 仅保留b,c属性并转为必填
type NewProps1 = Required<Pick<Props, 'b' | 'c'>>;

// 需要保留Props的所有属性，但是b，c需要必填
type NewProps2 = Partial<Props> & Required<Pick<Props, 'b' | 'c'>>;

const obj: NewProps2 = {
  b: '1',
  c: '2',
};
```

> [亲手试一试](https://www.typescriptlang.org/play/?ts=4.2.3#code/JYOwLgpgTgZghgYwgAgApQPYAcDOyDeAUMsnAPwBcyOYUoA5scgEaXW0NMJs10iMBfQoQD0I5IFG5QLvygTVdmAGgSA9HUDkBoDc9QDbxgLjlAo-qBrDUJgAnlhQA5CAHd02HAEZkAXmQAlCAEcArsCgQAJgA8qMAIANZBmLjyyADkzDHIAD6xCDEAfGnCYsiAAOmAgZGyNriAIW6AAkaAkOaqgDD-gGLygPRmzFUI+fqGJuZWRTgATE5ocFBgwHAANhG2acgAZK4e3r6BwWHjUbHxSSnpmYQIGCA0yBjMAFZUFtaRPX1EJMxUMXYx8lz33TGEAkA)

## 3.`ReadOnly〈Type〉`：只读

### 源码解读

```ts
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

将类型 `T` 中包含的属性设置为 `readonly`，并返回一个新类型。
`readonly`，顾名思义表示只读，初始化后就不能再修改值。这个类型可以配合 javascript 的 `const` 关键字实现引用类型属性值为常量的目的。

这个类型有一个局限性，就是只能设置子属性为只读，如果子属性还是一个引用类型，那对孙属性是不起作用的，那么有没有什么办法可以实现递归把所有引用都设置成只读的呢？如果有这种办法请给我留言，拜谢 🧎‍♂️

### 实战用法

```ts
interface Person {
  name: string;
  age: number;
}

const person: Readonly<Person> = {
  name: 'lpp',
  age: 18,
};

person.age = 20; // 无法分配到 "age" ，因为它是只读属性。ts(2540)
```

如果没有 `readonly`，在 javascript 中，如果给 `const` 变量赋值唯一个引用类型，比如一个对象，是可以修改属性值的，不能修改的是变量中存储的引用，如果要实现对象属性值的不可变，在 javascript 中可以使用 `Object.freeze`。

```ts
function freeze<Type>(obj: Type): Readonly<Type>;
```

## 4. `Record〈Keys, Type〉`：记录

该工具类型会构造一个类型，这个类型的键的类型是 `Keys`，值的类型是 `Type`。

### 源码解读

```ts
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

这里我们看到对于 `K` 的类型定义使用的是 `keyof any`。这里 `keyof any` 等价于 `string | number | symbol`，如下所示：

```ts
type a = keyof any;
// 等价于
type a = string | number | symbol;
```

### >> 实战用法

```ts
// 简单的限定键和值的类型
type Obj1 = Record<string, string>;

// 基于其他类型生成新的类型
type FruitTypes = 'apple' | 'banana' | 'pear';

interface FruitInfo {
  name: FruitTypes;
  price: number;
}

type Fruits = Partial<Record<FruitTypes, FruitInfo>>;

const fruits: Fruits = {
  apple: {
    name: 'apple',
    price: 10,
  },
};
```

> [亲手一试](https://www.typescriptlang.org/play?#code/PTAEgDvRVZUELdAU0ws7UHSpgYlUDwK1DePoaPUBQAXATwAcBTUAeQCMArARlAF5QAlEgYwHsAnAEwB4Azni4BLAHYBzADSghoyQD4cOEKEBf6oDi5QG6KgNblsgfFdACEaAG00y5CpUADEuAVxF4AKsRIDGoAOQBDIkQA2JB6gAD6elF5iEV5BoR6kXlweyuJ4JFwAZl5sZDb2eACSYukcoADeOKCgkQC2JABc1nYOzqQCFaBEotkNYrbVlGk4AL7KFjlNeG5MAAoJeCJefnysnLx8uc0uAjIbBUUcCko4nGJCoOkTAg27U2XtPv71d5WVNU-evgEeUu2VnSLdUC0AAM7RGQyAA)

## 5. `Pick〈Type, Keys〉`：挑取

从类型 `Type` 中，挑选一组属性组成一个新的类型返回。这组属性由 `Keys` 限定，`Keys` 是字符串或者字符串并集。

### >> 源码解读

```ts
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

`K extends keyof T`，表示 `K` 需要是 `keyof T` 的子集。返回的类型的键需要满足`[P in K]`，值类型满足 `T[P]`。

### >> 实战用法

```ts
interface Person {
  name: string;
  age: number;
  id: string;
}

// 幼儿没有id
type Toddler = Pick<Person, 'name' | 'age'>;
```

## 6. `Omit〈Type, Keys〉`：忽略

构造一个类型，这个类型包含类型 `Type` 中除了 `Keys` 之外的其余属性。`Keys` 是一个字符串或者字符串并集。

### >> 源码解读

```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type Exclude<T, U> = T extends U ? never : T;
```

因为 `Omit` 依赖了 `Exclude`，所以这里把 `Exclude` 的类型源码一起贴在这里。
**`Exclude<T, U>`的作用是从 `T` 中排除那些可以分配给 `U` 的类型**。这里先不讲 是如何实现的，只需要知道功能即可。
所以可以把 `Exclude<keyof T, K>`看作是一个反选，选出了 `T` 中那些不包含在 `K` 中的属性，然后在用 `Pick`，就实现了 `Omit`

### >> 实战用法

```ts
interface Person {
  name: string;
  age: number;
  id: string;
  work: string;
  address: string;
  girlFriend: number;
}

// 没工作的人
type PersonNoWork = Omit<Person, 'work'>;

// 没住址的人
type PersonNoAddress = Omit<Person, 'address'>;

// 没女朋友的人
type PersonNoGirlFriend = Omit<Person, 'girlFriend'>;
```

## >> 练习题

如何实现一个工具类型`SelectRequired<T, K in keyof T>`，实现如下效果：

```ts
interface Props {
  a?: string;
  b?: string;
  c?: string;
  d: string;
}

type NewProps = SelectRequired<Props, 'b' | 'c'>; // { a?: string, b: string, c: string, d: string }
```

> [答案点这里](https://www.typescriptlang.org/play/?#code/JYOwLgpgTgZghgYwgAgApQPYAcDOyDeAUMsnAPwBcyOYUoA5scgEaXW0NMJs10iMkAJlV6cAvoUJgAnlhQBlCABsICMACUIARwCuwKBEEAeACoAaZAGlkEAB6QQgvAGsI0jDGQmAfMgC8yJq6+oZGqMAIzqYWlt6+AGTIAPIAtsBg0VbekjJyyAByEADu6Nh4AYoqakF6BsaluBYA5MxNyAA+yE0ITd4A3CQkAPRDBKQ8HPwWzCKT9BYIs3zzyMLsy8gShAgYIDSkVIUlmLj+BEwzXQCMTWZcVE0ATLdMa003hGJAA)
