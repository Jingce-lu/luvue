# TypeScript 条件类型

[[toc]]

条件类型或许并不是每天都会用到，但是你可能一直都在间接的使用它们。因为它们非常适合“管道(plumbing)”或者是“框架”代码，用来处理 **API 边界(API boundaries)和底层的一些东西(behind-the-scenes kinda stuff)**。

## 从一个条件类型开始

这里有一段 JavaScript 代码：

```ts
function process(text) {
  return text && text.replace(/f/g, 'p');
}

process('foo').toUpperCase();
```

在这段代码中，很明显`.toUpperCase()`的调用是安全的。每次给 `process` 传入一个字符串，函数返回一个字符串。

但是需要注意的是，我们也可以给这个函数传入一些别的参数，比如 `null`，这时候函数会返回 `null`。而这时候对返回结果调用 `toUpperCase()`将会报错。

当然我们可以给这个函数添加一些基础的类型，让 `TypeScript` 来检查我们是否在安全的使用这个函数：

```ts
function process(text: string | null): string | null {
  return text && text.replace(/f/g, 'p');
}
```

这么做看起来是安全的。如果像之前那样使用会发生什么？

```ts
//    ⌄ Type Error! :(

process('foo').toUpperCase();
```

`TypeScript` 提示了类型错误，因为它认为 `process("foo")`可能会返回 `null`，即使我们很清楚的知道实际上运行结果返回的不是 null。但是 `TypeScript` 并没有办法对运行时的状态进行预测。
有一种方法能够帮助 TypeScript 更好的理解这个函数，就是使用`重载(overloading)`，重载可以为一个函数提供多个类型签名，来让 TypeScript 根据给定的上下文来决定使用哪一个。

```ts

function process(text: null): null;

function process(text: string): string;

function process(text: any): any {

  ...

}
```

这样如果我们传入一个 `string`，它就会返回一个 `string`。如果我们传入一个 `null`，它就会返回一个 `null`。

现在这个函数可以像我们所希望的那样工作了：

```ts
// All clear!

process('foo').toUpperCase();

//           ⌄ Type Error! :)

process(null).toUpperCase();
```

但是这里有另外一个用例没有生效：

```ts
declare const maybeFoo: string | null;

//      ⌄ Type Error! :(

process(maybeFoo);
```

[亲手试一试](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABABwE5wgUwM7YBRSYAeUAXImCADZUCU5lNA3AFCiSwIrpa4HFlE2KKhhgA5vSEix41gHp5idtHhI0GHPkIlyw0RMQAfCtTp6Zhk4yqsVndTy39diAIZgAnlI+fEAbxZERBYAXxYWABNMCCo3VExECARhREJhCwNxY1MaFg1ebRwoWiA)

`TypeScript` 不允许我们传入一个类型 `string | null` 的参数，因为它无法合并重载声明。这时候我们既可以选择新增一种重载类型，(╯°□°)╯︵ ┻━┻ 亦或者选择使用条件类型。

```ts

function process<T extends string | null>(

  text: T

): T extends string ? string : null {

  ...

}
```

如上所示，我们引入一个类型变量 `T` 来做 `text` 参数的类型。然后我们可以使用 T 作为条件返回类型的一部分：`T extends string ? string : null`。你或许已经注意到了这看起来像是一个三元表达式。事实上，它确实做着相似的事情，但是是在类型系统进行编译时完成的。
这样做就兼顾到了我们所有的使用用例：

```ts
typeof process('foo'); // => string

typeof process(null); // => null

typeof process(maybeFoo); // => string | null
```

这就是条件类型，一种三元表达式，它看起来总是长这样：

```ts
A extends B ? C : D
```

`A、B、C、D` 可以是任何我们已知的类型表达式，重点是在左边，`A extends B` 条件。

## 可分配性

`extends` 关键字是条件类型的核心，`A extends B` 就意味着**任何满足类型为 A 的值都可以安全的分配(assign)给类型为 B 的变量**。用类型系统的话讲叫：**A 能够分配给 B（A is assignable to B）**。从如下这段代码中理解一下**可分配**：

```ts
declare const a: A;

const b: B = a;

// type check succeeds only if A is assignable to B
```

TypeScript 使用的是一种被称为结构类型的方法来决定哪些类型可以相互分配。这种类型系统在大约十年前开始出现在主流语言中，如果你有 `C#`或者 `Java` 经验可能会觉得这种类型系统有点反直觉。
你或许听说过和动态类型语言息息相关的鸭子类型（ducking type），ducking type 的短语出自一个谚语：

> If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.

在鸭子类型中，我们通过事物的行为来判断一个事物，而不是通过看它是谁或者追溯它来自何处。可以把它理解为“任人唯贤”。结构类型就是将这种思想应用于静态编译时类型系统的产物。

所以 TypeScript 只关心一个类型能够做什么，而不关心它叫什么以及它在类型层次结构中处于什么位置。
来看一个简单的例子：

```ts
class A {}

class B {}

const b: B = new A(); // ✔ all good

const a: A = new B(); // ✔ all good

new A() instanceof B; // => false
```

在上面代码中，TypeScript 将两个完全不相关的类型视为相等的，因为它们具有相同的结构和能力。但是在运行时，这两个类并不是等价的。
这是 TypeScript 和 JavaScript 在语义上存在显著差别的一个典型例子。这看起来似乎是一个问题，其实是因为结构类型要比 Java 风格的名义（nominal）类型要更加的灵活多变，后者更加关注名称（names）和层次结构（hierarchy）。但是这两者并不是互相排斥的，在某些语言中，例如 Scala 和 Flow，允许你混用它们来解决特定问题。
除此之外，可分配性和结构类型这两者在实际的代码中是非常直观的：

```ts
interface Shape {
  color: string;
}

class Circle {
  color: string;

  radius: number;
}

// ✔ All good! Circles have a color

const shape: Shape = new Circle();

// ✘ Type error! Not all shapes have a radius!

const circle: Circle = shape;
```

所以从结构上来看，`A extends B` 很像是 **A 是 B 的超集**。说的更明白点，就是**类型 A 包含类型 B 的所有属性，并且可能还有更多**。

有一个需要注意的点，就是**字面（literal）类型**。在 `TypeScript` 中你可以使用字面量本身作为类型。

```ts
let fruit: 'banana' = 'banana';

// Type Error! "apple" is not assignable to "banana"

fruit = 'apple';
```

"banana"作为字符串并没有比其他的字符串多出来什么属性，但是"banana"作为一个类型，却要比 string 类型具体的多，它只允许赋值为"banana"。

所以也可以从另一个角度理解 `A extends B`：**那就是 A 是 B 的一个更具体的版本**。这里的“具体”的含义可以理解为有更多的属性或者是更加的明确，也就是有更多的限制。与之前的提到的 A 是 B 的超集一个含义。

这就引出了**顶层类型（Top）和底层类型（Bottom）**，也就是不那么具体的类型和最具体的类型。

在类型理论中，顶层类型是所有其他的类型都可以分配的类型，如果我们对一个类型没有任何具体的信息，那么就可以把这个类型设置为顶层类型，顶层类型被视为所有可能类型的联合：

```ts
type Top = string | number | {foo: Bar} | Baz[] | ... | ∞
```

TypeScript 包含两个顶层类型：`any` 和 `unknown`。

- 使用 `any` 就意味着：你无法确定值的类型，所以 `TypeScript` 会假定你使用的是正确的，并且不会有任何的告警
- 使用 `unknown` 就意味着：同样是无法确定值的类型，但是 `TypeScript` 会要求你在运行时检查值的类型

底层（bottom）类型是其他类型不可分配的类型，也没有值可以赋值给这个类型的变量。可以将其视为空联合类型：

```ts
type Bottom = ∅
```

`TypeScript` 中有一个底层类型：`never`。这个类型很能见名知意，也就是啥也不是。

在使用条件类型时，了解顶层类型和底层类型很有用。`never` 在使用条件类型细化联合类型的时候尤其有用。

## 基于“分发条件类型”来细化联合类型

条件类型可以用来过滤掉联合类型的特定成员。用一个例子来说明，首先我们定义一个联合类型 Animal：

```ts
type Animal = Lion | Zebra | Tiger | Shark;
```

如果我们需要一个函数来过滤出哪些是猫科动物，我们可以写一个工具类型 `ExtractCat` 来实现：

```ts
type ExtractCat<A> = A extends { meow(): void } ? A : never;

type Cat = ExtractCat<Animal>;

// => Lion | Tiger
```

I know lions and tigers don't meow, but how cute would it be if they did ^\_^
起初，这种方式让我觉得有点迷糊又神奇。接下来我们深入了解一下 `TypeScript` 在处理 `ExtractCat<Animal>`时做了什么：

首先，它将 `ExtractCat` 递归的应用于 `Animal` 的所有成员：

```ts
type Cat =
  | ExtractCat<Lion>
  | ExtractCat<Zebra>
  | ExtractCat<Tiger>
  | ExtractCat<Shark>;
```

然后它判断这些条件类型：

```ts
type Cat = Lion | never | Tiger | never;
```

接下来一些有趣的事情发生了，还记得没有值可以是 never 类型么？所以在联合类型中包含 never 是没有任何意义的，所以 TypeScript 抛弃了它：

```ts
type Cat = Lion | Tiger;
```

在 TypeScript 中，这种条件类型的用法被称为分发条件类型（distributive conditional type）。

这种“分发”，也就是联合类型以递归方式展开，但是这是有限制的：只发生在 extends 关键字左侧是普通类型变量的时候。我们将在下一节看到这意味着什么以及如何突破这种限制。

## 分发条件类型的一个真实使用场景

前段时间我正在写一个 Chrome 插件，它有一个 `background` 脚本和一个 `view` 脚本，这两者运行在不同的执行上下文中。它们之间需要共享状态，唯一的途径就是通过可序列化消息传递机制。受 `Redux` 启发我定义了一个全局联合类型 `Action` 来作为可以在不同上下文中传递的消息的模型。

```ts
type Action =
  | {
      type: 'INIT';
    }
  | {
      type: 'SYNC';
    }
  | {
      type: 'LOG_IN';

      emailAddress: string;
    }
  | {
      type: 'LOG_IN_SUCCESS';

      accessToken: string;
    };

// ...
```

还有一个全局的 `dispatch` 函数，通过这个函数就可以在不同的上下文广播消息。

```ts
declare function dispatch(action: Action): void;

// ...

dispatch({
  type: 'INIT',
});

// ...

dispatch({
  type: 'LOG_IN',

  emailAddress: 'david.sheldrick@artsy.net',
});

// ...

dispatch({
  type: 'LOG_IN_SUCCESS',

  accessToken: '038fh239h923908h',
});
```

这个 API 是类型安全的，并且与我的 IDE 的自动补全功能配合的也很好，我完全可以到这里就结束了，然后去做别的事情。
但是总有个想法在我的脑海里挥之不去，我相信大多数开发者可能都会有这种想法。

我希望可以像这样调用 `dispatch` 函数：

```ts
// first argument is the 'type'

// second is any extra parameters

dispatch('LOG_IN_SUCCESS', {
  accessToken: '038fh239h923908h',
});
```

派生第一个参数的类型很简单：

```ts
type ActionType = Action['type'];

// => "INIT" | "SYNC" | "LOG_IN" | "LOG_IN_SUCCESS"
```

但是第二个参数的类型是由第一个参数决定的，我们可以使用一个类型变量来对依赖进行建模：

```ts
declare function dispatch<T extends ActionType>(
  type: T,

  args: ExtractActionParameters<Action, T>
): void;
```

那么这里的 `ExtractActionParameters` 是什么东西呢？

显然是一个条件类型！如下所示是第一次尝试实现 `ExtractActionParameters`：

```ts
type ExtractActionParameters<A, T> = A extends { type: T } ? A : never;
```

这很像之前的 `ExtractCat` 那个例子，在那个例子里我们通过搜索是否具有 `meow()`来过滤 `Animals 联合类型`。在这里我们通过 `type` 属性来过滤 `Action 联合类型`。我们来看一下实际效果：

```ts
type Test = ExtractActionParameters<Action, 'LOG_IN'>;

// => { type: "LOG_IN", emailAddress: string }
```

到这里已经差不多了，但是目前提取的结果还保留着 `type`，这就导致在调用 `dispatch` 还是需要再写一次 `type`，这和我们的初衷并不一致。

我们可以通过组合使用条件类型和 `keyof` 操作符来实现一个`映射类型（mapped type）`，达到排除 `type` 属性的目的。

映射类型允许你在一个键的联合类型上通过映射来创建一个新的类型

- 首先，可以使用 keyof 操作符获取一个已经存在的类型的所有键作为一个联合类型返回
- 然后，可以使用条件类型来筛选这个键的联合类型返回一个筛选后的类型

接下来通过一个具体的例子演示一下如何实现：

```ts
type ExcludeTypeKey<K> = K extends 'type' ? never : K;

type Test = ExcludeTypeKey<'emailAddress' | 'type' | 'foo'>;

// => "emailAddress" | "foo"

type ExcludeTypeField<A> = { [K in ExcludeTypeKey<A>]: A[K] };

type Test = ExcludeTypeField<{ type: 'LOG_IN'; emailAddress: string }>;

// => { emailAddress: string }
```

然后，我们就可以使用 `ExcludeTypeField` 来重新定义 `ExtractActionParameters`：

```ts
type ExtractActionParameters<A, T> = A extends { type: T }
  ? ExcludeTypeField<A>
  : never;
```

现在，这个新版本的 `dispatch` 函数是类型安全的了：

```ts
// All clear! :)

dispatch('LOG_IN_SUCCESS', {
  accessToken: '038fh239h923908h',
});

dispatch('LOG_IN_SUCCESS', {
  // Type Error! :)

  badKey: '038fh239h923908h',
});

// Type Error! :)

dispatch('BAD_TYPE', {
  accessToken: '038fh239h923908h',
});
```

还剩一个严重的问题需要处理，那就是如果一个 action 没有参数需要传递，但我还是需要写一个空对象作为 dispatch 函数的第二个参数。

```ts
dispatch('INIT', {});
```

这是一种可耻的浪费行为，告诉拜登今天晚上别等我打麻将了，我要修复这个问题，立刻！马上！！🤪

可能我们会立即想到的一个做法是把第二个参数设置为可选的，但这会导致一个新的问题就是有参数的 action 如果不传递参数也会被允许，这就不满足类型安全了。

更好的做法是定义一个 dispatch 函数的重载：

```ts
// And let's say that any actions that don't require

// extra parameters are 'simple' actions.

declare function dispatch(type: SimpleActionType): void;

// this signature is just like before

declare function dispatch<T extends ActionType>(
  type: T,

  args: ExtractActionParameters<Action, T>
): void;

type SimpleActionType = ExtractSimpleAction<Action>['type'];
```

那么我们应该如何定义条件类型 `ExtractSimpleAction` 呢？我们知道如果把一个 `action` 类型的 `type` 字段去掉，返回的是一个空对象的话，那么这个 `action` 就是一个 `SimpleActionType`。按照这个思路我们似乎可以这么实现

```ts
type ExtractSimpleAction<A> = ExcludeTypeField<A> extends {} ? A : never;
```

但是这样是达不到我们期望的效果的。因为 `ExcludeTypeField<A> extends {}`总是会返回 `true`。这是因为 `ExcludeTypeField<A>`的返回值不存在无法分配给`{}`的情况。

既然这样，我们就交换两个参数的位置：

```ts
type ExtractSimpleAction<A> = {} extends ExcludeTypeField<A> ? A : never;
```

现在看起来如果 `ExcludeTypeField<A>`是空对象，那么就会走 `true` 分支，否则就会走 `false` 分支。

你以为这就解决了？并没有。这个条件类型是不起作用的。也许有的读者还记得之前说过这段话：

> 这种“分发”，也就是联合类型以递归方式展开，只发生在 `extends` 关键字左侧是普通类型变量的时候

类型变量常常被定义在泛型参数列表中，被`<`和`>`包裹。例如：

```ts

type Blah<These, Are, Type, Variables> = ...


function blah<And, So, Are, These>() {

  ...

}
```

如果你希望联合类型递归展开应用条件类型，那么这个联合类型需要：

- 绑定在一个类型变量上
- 这个类型变量需要出现在 `extends` 关键字的左侧

如下所示是可以展开应用条件类型的例子：

```ts
type Blah<Var> = Var extends Whatever ? A : B;
```

这些就不可以：

```ts
type Blah<Var> = Foo<Var> extends Whatever ? A : B;

type Blah<Var> = Whatever extends Var ? A : B;
```

当我发现这个限制的时候，我认为我发现了一个分发条件类型在底层工作方式上的一个根本缺陷。我觉得这可能是对算法复杂度做的某种让步。我觉得可能是我的用例太高级了以至于 TypeScript 显得有些无能为力。
但事实证明我错了，这只是一个实用的语言设计来避免额外的语法，要解决也很简单：

```ts
type ExtractSimpleAction<A> = A extends any
  ? {} extends ExcludeTypeField<A>
    ? A
    : never
  : never;
```

如上所示，我们只是把我们的逻辑包裹在了一个额外的条件判断中，这个外层的条件类型会永远执行 true。

最终，我们可以删除无用的多余代码了：

```ts
dispatch('INIT');
```

TypeScript 提供了一些我们可以在本节使用的内置类型：

```ts
// Exclude from U those types that are assignable to T

type Exclude<U, T> = U extends T ? never : U;

// Extract from U those types that are assignable to T

type Extract<U, T> = U extends T ? U : never;
```

之前我们是这样实现 `ExcludeTypeField` 的：

```ts
type ExcludeTypeField<A> = { [K in ExcludeTypeKey<keyof A>]: A[K] };
```

现在我们可以这样做：

```ts
type ExcludeTypeField<A> = { [K in Exclude<keyof A, 'type'>]: A[K] };
```

之前我们这样实现 `ExtractActionParameters`：

```ts
type ExtractActionParameters<A, T> = A extends { type: T }
  ? ExcludeTypeField<A>
  : never;
```

现在我们可以这样实现：

```ts
type ExtractActionParameters<A, T> = ExcludeTypeField<Extract<A, { type: T }>>;
```

## 使用 infer 解构类型

条件类型还有另外一个关键字：`infer`。它可以在 `extends` 关键字右侧的类型表达式中的任何位置使用。使用它可以为出现在该位置的任何类型命名。例如：

```ts
type Unpack<A> = A extends Array<infer E> ? E : A;

type Test = Unpack<Apple[]>;

// => Apple

type Test = Unpack<Apple>;

// => Apple
```

它可以优雅的处理歧义：

```ts
type Stairs = Unpack<Apple[] | Pear[]>;

// => Apple | Pear
```

你甚至可以多次使用 `infer`：

```ts
type Flip<T> = T extends [infer A, infer B] ? [B, A] : never;

type Stairs = Flip<[Pear, Apple]>;

// => [Apple, Pear]

type Union<T> = T extends [infer A, infer A] ? A : never;

type Stairs = Union<[Apple, Pear]>;

// => Apple | Pear
```

## 其他的内置条件类型

我们已经看到了 Exclude 和 Extract，并且 TypeScript 提供了其他一些开箱即用的条件类型。

```ts
// Exclude null and undefined from T

type NonNullable<T> = T extends null | undefined ? never : T;

// Obtain the parameters of a function type in a tuple

type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Obtain the parameters of a constructor function type in a tuple

type ConstructorParameters<T> = T extends new (...args: infer P) => any
  ? P
  : never;

// Obtain the return type of a function type

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

// Obtain the return type of a constructor function type

type InstanceType<T> = T extends new (...args: any[]) => infer R ? R : any;
```
