# Webpack 的插件机制 - Tapable

[[toc]]

<img :src="$withBase('/images/webpack/webpack6.awebp')" alt="webpack/webpack6.awebp">

## 1、tapable

::: tip
Webpack 就像一条生产线，要经过一系列处理流程后才能将源文件转换成输出结果。 这条生产线上的每个处理流程的职责都是单一的，多个流程之间有存在依赖关系，只有完成当前处理后才能交给下一个流程去处理。
插件就像是一个插入到生产线中的一个功能，在特定的时机对生产线上的资源做处理。Webpack 通过 Tapable 来组织这条复杂的生产线。 Webpack 在运行过程中会广播事件，插件只需要监听它所关心的事件，就能加入到这条生产线中，去改变生产线的运作。
Webpack 的事件流机制保证了插件的有序性，使得整个系统扩展性很好。
——「深入浅出 Webpack」
:::

作为 Webpack 的核心库，`tabpable` 承包了 `Webpack` 最重要的事件工作机制，包括 Webpack 源码中高频的两大对象（`compiler`、`compilation`）都是继承自 `Tapable` 类的对象，这些对象都拥有 `Tapable` 的注册和调用插件的功能，并向外暴露出各自的执行顺序以及 `hook` 类型，详情可见[文档 https://www.Webpackjs.com/api/compiler-hooks](https://www.Webpackjs.com/api/compiler-hooks/)

## 2、tapable 的钩子

```js
const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} = require('tapable');
```

上面是官方文档给出的 9 种钩子的类型，我们看命名就能大致推测他们的类型和区别，分成同步、异步，瀑布流、串行、并行类型、循环类型等等，钩子的目的是为了显式地声明，触发监听事件时（call）传入的参数，以及订阅该钩子的 callback 函数所接受到的参数，举个最简单的 

```js
const sync = new SyncHook(['arg']); // 'arg' 为参数占位符
sync.tap('Test', (arg1, arg2) => {
  console.log(arg1, arg2); // a，undefined
});
sync.call('a', '2');
```

上述代码定义了一个同步串行钩子，并声明了接收的参数的个数，可以通过 `hook` 实例对象（`SyncHook` 本身也是继承自 `Hook` 类的）的 `tap` 方法订阅事件，然后利用 `call` 函数触发订阅事件，执行 `callback` 函数，值得注意的是 call 传入参数的数量需要与实例化时传递给钩子类构造函数的数组长度保持一致，否则，即使传入了多个，也只能接收到实例化时定义的参数个数。

| 序号 | 钩子名称                 | 执行方式 | 使用要点    |
| ---- | ------------------------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| 1    | SyncHook                 | 同步串行 | 不关心监听函数的返回值                                                |
| 2    | SyncBailHook             | 同步串行 | 只要监听函数中有一个函数的返回值不为 null,则跳过剩余逻辑                   |
| 3    | SyncWaterfallHook        | 同步串行 | 上一个监听函数的返回值将作为参数传递给下一个监听函数                        |
| 4    | SyncLoopHook             | 同步串行 | 当监听函数被触发的时候，如果该监听函数返回 true 时则这个监听函数会反复执行，如果返回 undefined 则表示退出循环                          |
| 5    | AsyncParallelHook        | 异步并行 | 不关心监听函数的返回值                                                                                                                 |
| 6    | AsyncParallelBailHook    | 异步并行 | 只要监听函数的返回值不为 null，就会忽略后面的监听函数执行，直接跳跃到 callAsync 等触发函数绑定的回调函数，然后执行这个被绑定的回调函数 |
| 7    | AsyncSeriesHook          | 异步串行 | 不关心 callback()的参数                                                                                                                |
| 8    | AsyncSeriesBailHook      | 异步串行 | callback()的参数不为 null，就会直接执行 callAsync 等触发函数绑定的回调函数                                                             |
| 9    | AsyncSeriesWaterfallHook | 异步串行 | 上一个监听函数的中的 callback(err, data)的第二个参数,可以作为下一个监听函数的参数                                                      |

上述表格罗列了所有 hook 的使用方式和要点。

## 3、注册事件回调

注册事件回调有三个方法： `tap`、`tapAsync` 和 `tapPromise`，其中 `tapAsync` 和 `tapPromise` 不能用于 `Sync` 开头的钩子类，强行使用会报错。`tap` 的使用方式在上文已经展示过了，就用官方文档的例子展示下 `tapAsync` 的使用方式，相比于 `tap`，`tapAsync` 需要执行 `callback` 函数才能确保流程会走到下一个插件中去。

```js
myCar.hooks.calculateRoutes.tapAsync(
  'BingMapsPlugin',
  (source, target, routesList, callback) => {
    bing.findRoute(source, target, (err, route) => {
      if (err) return callback(err);
      routesList.add(route);
      // call the callback
      callback();
    });
  }
);
```

## 4、触发事件

触发事件的三个方法是与注册事件回调的方法一一对应的，这点从方法的名字上也能看出来：`call` 对应 `tap`、`callAsync` 对应 `tapAsync` 和 `promise` 对应 `tapPromise`。一般来说，我们注册事件回调时用了什么方法，触发时最好也使用对应的方法。同样需要注意的是 `callAsync` 有个 `callback` 函数，在逻辑完毕时需要执行，一些具体用法类似于上面的注册事件类似，就不一一展开了。

## 5、了解机制

### 那么在 Webpack 中到底如何使用 tapable 调用这些 plugin 呢？

我们首先来看官网给出的编写一个 plugin 的示例

```js
class HelloWorldPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('Hello World Plugin', (
      compilation /* compilation is passed as an argument when done hook is tapped.  */
    ) => {
      console.log('Hello World!');
    });
  }
}

module.exports = HelloWorldPlugin;
```

上述代码块编写了一个叫 HelloWorldPlugin 的类，它提供了一个叫 `apply` 的方法，在该方法中我们可以从外部获取到 Webpack 执行全过程中单一的 `compiler` 实例，通过 `compiler` 实例，我们可以在 Webpack 的生命周期的 `done` 节点（也就是上面我们提到的 hook）`tap` 一个监听事件，也就是说当 Webpack 全部流程执行完毕时，监听事件将会被触发，同时 `stat` 统计信息会被传入到监听事件中，在事件中，我们就可以通过 `stat` 做一系列我们想要做的数据分析。

一般来说，使用一个 Webpack 插件，需要在 Webpack 配置文件中导入（`import`）插件的类，`new` 一个实例，like this:

```js
// Webpack.config.js
var HelloWorldPlugin = require('hello-world');

module.exports = {
  // ... configuration settings here ...
  plugins: [new HelloWorldPlugin({ options: true })],
};
```

这里聪明的你一定想到了 Webpack 应该是读取了这份配置文件后获得了 `HelloWorldPlugin` 实例，并调用了实例的 `apply` 方法，在 `done` 节点上添加了监听事件！没错，让我们来追溯下 Webpack 的源码部分，在 Webpack 项目的 `lib/Webpack.js` 文件中，我们可以看到

```js
if (options.plugins && Array.isArray(options.plugins)) {
  for (const plugin of options.plugins) {
    if (typeof plugin === 'function') {
      plugin.call(compiler, compiler);
    } else {
      plugin.apply(compiler);
    }
  }
}
```

这段代码中 `options` 就是指配置文件导出的整个对象，这里可以看到 Webpack 循环遍历了一遍 `plugins`，并分别调用了他们的 `apply` 方法，当然如果 `plugin` 是 `function` 类型，就直接用 `call` 来执行，这也就是我上文提到的一般来说的例外，如果你的插件逻辑很简单，你可以直接在配置文件里写一个 `function`，去执行你的逻辑，而不必啰嗦的写一个类或者用更纯粹的 `prototype` 去定义类的方法。

到这里为止，我们已经了解了插件中的监听事件是如何注册到 Webpack 的 `compile`、`compilation`（tapable 类）上去的，那监听事件是如何、何时被触发的呢，理论上应该是先注册完毕，后触发，这样监听事件才有意义，我们接着发现，在 `lib/Compiler.js` 中的 `Compiler` 类的 `run` 函数里有这样一段代码

```js
const onCompiled = (err, compilation) => {
	if (err) return finalCallback(err);

	if (this.hooks.shouldEmit.call(compilation) === false) {
		...
		this.hooks.done.callAsync(stats, err => {
			if (err) return finalCallback(err);
			return finalCallback(null, stats);
		});
		return;
	}

	this.emitAssets(compilation, err => {
		if (err) return finalCallback(err);

		if (compilation.hooks.needAdditionalPass.call()) {
			...
			this.hooks.done.callAsync(stats, err => {
				...
			});
			return;
		}

		this.emitRecords(err => {
			if (err) return finalCallback(err);

			...
			this.hooks.done.callAsync(stats, err => {
				if (err) return finalCallback(err);
				return finalCallback(null, stats);
			});
		});
	});
};
...
	this.compile(onCompiled);
```

回调函数 `onCompiled` 会在 `compile` 过程结束时被调用，无论走到哪个 if 逻辑中，`this.hooks.done.callAsync` 都会被执行，也就是说在 `done` 节点上注册的监听事件会按照顺序依次被触发执行。接着我们再向上追溯，包裹了 `onCompiled` 函数的 `run` 函数是在 `lib/Webpack.js` 中被执行的

```js
if (Array.isArray(options)) {
    ...
} else if (typeof options === "object") {
    ...
	compiler = new Compiler(options.context);
	compiler.options = options;
	if (options.plugins && Array.isArray(options.plugins)) {
		for (const plugin of options.plugins) {
			if (typeof plugin === "function") {
				plugin.call(compiler, compiler);
			} else {
				plugin.apply(compiler);
			}
		}
	}
} else {
	...
}
if (callback) {
	...
	compiler.run(callback);
}
```

刚好在 `plugin.apply()` 的后面，所以是符合先注册监听事件，再触发的逻辑顺序的。

### 插件的注册执行流程图示

<img :src="$withBase('/images/webpack/webpack7.awebp')" alt="webpack/webpack7.awebp">

## 6、总结

`tapable` 作为 Webpack 的核心库，承接了 Webpack 最重要的事件流的运转，它巧妙的钩子设计很好的将实现与流程解耦开来，真正实现了插拔式的功能模块，在 Webpack 中最核心的负责编译的 `Compiler` 和负责创建的 `bundles` 的 `Compilation` 都是 `Tapable` 的实例，可以说想要真正读懂 Webpack，tapable 的知识储备是必不可少的，它的一些设计思想也是很值得我们借鉴的，本文只是对 `tapable` 的一些 api 以及 Webpack 如何使用 tapable 串起了整个插件流工作机制做了介绍，假如对 tapable 的实现原理和源码有兴趣的朋友，可以移驾 [tapable 的 github 仓库](https://github.com/Webpack/tapable)学习
