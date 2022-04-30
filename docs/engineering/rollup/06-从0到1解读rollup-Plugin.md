# 从 0 到 1 解读 rollup Plugin

[[toc]]

## rollup 为什么需要 Plugin

### rollup -c 打包流程

在 rollup 的打包流程中，通过相对路径，将一个入口文件和一个模块创建成了一个简单的 `bundle`。随着构建更复杂的 bundle，通常需要更大的灵活性——引入 npm 安装的模块、通过 `Babel` 编译代码、和 JSON 文件打交道等。通过 rollup -c 打包的实现流程可以参考下面的流程图理解。

<div align="center"><img :src="$withBase('/images/rollup/rollup7.awebp')" alt="rollup/rollup7.awebp"></div>

为此，我们可以通过 `插件(plugins)` 在打包的关键过程([不同阶段调用的钩子函数](https://rollupjs.org/guide/en/#build-hooks))中更改 `Rollup` 的行为。

这其实和 webpack 的插件相类似，不同的是，webpack 区分 `loader` 和 `plugin`，而 rollup 的 plugin 既可以担任 loader 的角色，也可以胜任传统 plugin 的角色。
​

### 理解 rollup plugin

引用官网的解释：

> Rollup 插件是一个具有下面描述的一个或多个属性、构建钩子和输出生成钩子的对象，它遵循我们的约定。  
> 一个插件应该作为一个包来分发，该包导出一个可以用插件特定选项调用的函数，并返回这样一个对象。  
> 插件允许你定制 Rollup 的行为，例如，在捆绑之前编译代码，或者在你的 node_modules 文件夹中找到第三方模块。

简单来说，rollup 的插件是一个普通的函数，函数返回一个对象，该对象包含一些属性(如 name)，和不同阶段的钩子函数（构建 build 和输出 output 阶段），此处应该回顾下上面的流程图。​

关于约定

- 插件应该有一个带有 rollup-plugin-前缀的明确名称。
- 在 package.json 中包含 rollup-plugin 关键字。
- 插件应该支持测试，推荐 mocha 或者 ava 这类开箱支持 promises 的库。
- 尽可能使用异步方法。
- 用英语记录你的插件。
- 确保你的插件输出正确的  sourcemap。
- 如果你的插件使用 'virtual modules'（比如帮助函数），给模块名加上  \0  前缀。这可以阻止其他插件执行它。

## 分分钟写个 rollup 插件

### 插件其实很简单

可以打开[rollup  插件列表](https://github.com/rollup/plugins)，随便找个你感兴趣的插件，看下源代码。
​
有不少插件都是几十行，不超过 100 行的。比如图片文件多格式支持插件`@rollup/plugin-image` 的代码甚至不超过 50 行，而将 json 文件转换为 ES6 模块的插件 `@rollup/plugin-json` 源代码更少。

### 一个例子

```js
// 官网的一个例子
export default function myExample() {
  return {
    name: 'my-example', // 名字用来展示在警告和报错中
    resolveId(source) {
      if (source === 'virtual-module') {
        return source; // rollup 不应该查询其他插件或文件系统
      }
      return null; // other ids 正常处理
    },
    load(id) {
      if (id === 'virtual-module') {
        return 'export default "This is virtual!"'; // source code for "virtual-module"
      }
      return null; // other ids
    },
  };
}

// rollup.config.js
import myExample from './rollup-plugin-my-example.js';
export default {
  input: 'virtual-module', // 配置 virtual-module 作为入口文件满足条件通过上述插件处理
  plugins: [myExample()],
  output: [
    {
      file: 'bundle.js',
      format: 'es',
    },
  ],
};
```

光看不练假把式，模仿写一个：

```ts
// 自己编的一个例子 QAQ
export default function bundleReplace() {
  return {
    name: 'bundle-replace', // 名字用来展示在警告和报错中
    transform(bundle) {
      return bundle.replace('key_word', 'replace_word').replace(/正则/, '替换内容');
    },
  };
}

// rollup.config.js
import bundleReplace from './rollup-plugin-bundle-replace.js';
export default {
  input: 'src/main.js', // 通用入口文件
  plugins: [bundleReplace()],
  output: [
    {
      file: 'bundle.js',
      format: 'es',
    },
  ],
};
```

## rollup plugin 功能的实现

我们要讲的 rollup plugin 也不可能就这么简单啦~~~  
接下来当然是结合例子分析实现原理~~

再次解释一下：  
官方给出的例子中，插件函数导出模块中的 resolveId()和 load()是 rollup 中的两个钩子函数，笔者所写的正则转换插件中导出的 transform()也是 rollup 提供的钩子函数，下面将会介绍，根据钩子函数的三类调用时机划分众多钩子函数，而具体详细的钩子函数，和执行阶段可以参考官方文档。

其实不难发现，rollup 的插件配置与 webpack 等框架中的插件使用大同小异，都是提供配置选项，注入当前构建结果相关的属性与方法，供开发者进行增删改查操作。

那么插件写好了，rollup 是如何在打包过程中调用它并实现它的功能的呢？

**相关概念**

首先还是要了解必备的前置知识，大致浏览下 `rollup` 中处理 `plugin` 的方法，基本可以定位到 `PluginContext.ts`（上下文相关）、`PluginDriver.ts`（驱动相关）、`PluginCache.ts`（缓存相关）和 `PluginUtils.ts`（警告错误异常处理）等文件，其中最关键的就在 `PluginDriver.ts` 中了。

首先要清楚插件驱动的概念，它是实现插件提供功能的的核心 -- `PluginDriver`，插件驱动器，调用插件和提供插件环境上下文等。

### 钩子函数的调用时机

大家在研究 rollup 插件的时候，最关注的莫过于钩子函数部分了，钩子函数的调用时机有三类:

- const chunks = rollup.rollup 执行期间的构建钩子函数 - [Build Hooks](https%3A%2F%2Frollupjs.org%2Fguide%2Fen%2F%23build-hooks)
- chunks.generator(write)执行期间的输出钩子函数 - [Output Generation Hooks](https%3A%2F%2Frollupjs.org%2Fguide%2Fen%2F%23output-generation-hooks)
- 监听文件变化并重新执行构建的 rollup.watch 执行期间的 watchChange 钩子函数

### 钩子函数处理方式分类

除了以调用时机来划分钩子函数以外，我们还可以以钩子函数处理方式来划分，这样来看钩子函数就主要有以下四种版本：

- async: 处理 promise 的异步钩子，即这类 hook 可以返回一个解析为相同类型值的 promise，同步版本 hook 将被标记为  sync。
- first: 如果多个插件实现了相同的钩子函数，那么会串式执行，从头到尾，但是，如果其中某个的返回值不是 null 也不是 undefined 的话，会直接终止掉后续插件。
- sequential: 如果多个插件实现了相同的钩子函数，那么会串式执行，按照使用插件的顺序从头到尾执行，如果是异步的，会等待之前处理完毕，在执行下一个插件。
- parallel: 同上，不过如果某个插件是异步的，其后的插件不会等待，而是并行执行，这个也就是我们在 rollup.rollup() 阶段看到的处理方式。

### 构建钩子函数

为了与构建过程交互，你的插件对象需要包含一些构建钩子函数。构建钩子是构建的各个阶段调用的函数。构建钩子函数可以影响构建执行方式、提供构建的信息或者在构建完成后修改构建。rollup 中有不同的构建钩子函数，在构建阶段执行时，它们被 [rollup.rollup(inputOptions)](https://github.com/rollup/rollup/blob/07b3a02069594147665daa95d3fa3e041a82b2d0/cli/run/build.ts#L34) 触发。
​
构建钩子函数主要关注在 Rollup 处理输入文件之前定位、提供和转换输入文件。构建阶段的第一个钩子是 options，最后一个钩子总是 buildEnd，除非有一个构建错误，在这种情况下 closeBundle 将在这之后被调用。

顺便提一下，在观察模式下，`watchChange` 钩子可以在任何时候被触发，以通知新的运行将在当前运行产生其输出后被触发。当 `watcher` 关闭时，`closeWatcher` 钩子函数将被触发。

### 输出钩子函数

输出生成钩子函数可以提供关于生成的包的信息并在构建完成后立马执行。它们和构建钩子函数拥有一样的工作原理和相同的类型，但是不同的是它们分别被 ·[bundle.generate(output)](https://github.com/rollup/rollup/blob/07b3a02069594147665daa95d3fa3e041a82b2d0/cli/run/build.ts#L44) 或 [bundle.write(outputOptions)](https://github.com/rollup/rollup/blob/07b3a02069594147665daa95d3fa3e041a82b2d0/cli/run/build.ts#L64) 调用。只使用输出生成钩子的插件也可以通过输出选项传入，因为只对某些输出运行。

输出生成阶段的第一个钩子函数是 [outputOptions](https%3A%2F%2Fgithub.com%2Frollup%2Frollup%2Fblob%2F07b3a02069594147665daa95d3fa3e041a82b2d0%2Fsrc%2FBundle.ts%23L50)，如果输出通过 [bundle.generate(...)](https%3A%2F%2Fgithub.com%2Frollup%2Frollup%2Fblob%2Fmaster%2Fcli%2Frun%2Fbuild.ts%23L44) 成功生成则第一个钩子函数是 [generateBundle](https%3A%2F%2Fgithub.com%2Frollup%2Frollup%2Fblob%2Fmaster%2Fsrc%2FBundle.ts%23L73)，如果输出通过 [bundle.write(...)](https://github.com/rollup/rollup/blob/07b3a02069594147665daa95d3fa3e041a82b2d0/src/watch/watch.ts#L200) 生成则最后一个钩子函数是 [writeBundle](https://github.com/rollup/rollup/blob/master/src/rollup/rollup.ts#L176)，另外如果输出生成阶段发生了错误的话，最后一个钩子函数则是 [renderError](https%3A%2F%2Fgithub.com%2Frollup%2Frollup%2Fblob%2Fmaster%2Fsrc%2FBundle.ts%23L70)。

另外，[closeBundle](https%3A%2F%2Fgithub.com%2Frollup%2Frollup%2Fblob%2Fmaster%2Fsrc%2Frollup%2Frollup.ts%23L59) 可以作为最后一个钩子被调用，但用户有责任手动调用 `bundle.close()` 来触发它。CLI 将始终确保这种情况发生。

以上就是必须要知道的概念了，读到这里好像还是看不明白这些钩子函数到底是干啥的！那么接下来进入正题！
​

## 钩子函数加载实现

[PluginDriver](https://github.com/rollup/rollup/blob/07b3a02069594147665daa95d3fa3e041a82b2d0/src/utils/PluginDriver.ts#L124)  中有 9 个 hook 加载函数。主要是因为每种类别的 hook 都有同步和异步的版本。
​
接下来先看看 9 个 hook 加载函数及其应用场景（看完第一遍不知所以然，但是别人看了咱也得看，先看了再说，看不懂就多看几遍 QAQ ～）
​
排名不分先后，仅参考它们在 PluginDriver.ts 中出现的顺序 🌠。
​

<div align="center"><img :src="$withBase('/images/rollup/rollup8.awebp')" alt="rollup/rollup8.awebp"></div>

### 1. hookFirst

加载 `first` 类型的钩子函数，场景有  `resolveId`、`resolveAssetUrl`  等，在实例化 Graph 的时候，初始化初始化 promise 和 this.plugins，并通过覆盖之前的 promise，实现串行执行钩子函数。当多个插件实现了相同的钩子函数时从头到尾串式执行，如果其中某个的返回值不是 null 也不是 undefined 的话，就会直接终止掉后续插件。

```ts
function hookFirst<H extends keyof PluginHooks, R = ReturnType<PluginHooks[H]>>(
  hookName: H,
  args: Args<PluginHooks[H]>,
  replaceContext?: ReplaceContext | null,
  skip?: number | null
): EnsurePromise<R> {
  // 初始化 promise
  let promise: Promise<any> = Promise.resolve();
  // 实例化 Graph 的时候，初始化 this.plugins
  for (let i = 0; i < this.plugins.length; i++) {
    if (skip === i) continue;
    // 覆盖之前的 promise，即串行执行钩子函数
    promise = promise.then((result: any) => {
      // 返回非 null 或 undefined 的时候，停止运行，返回结果
      if (result != null) return result;
      // 执行钩子函数
      return this.runHook(hookName, args as any[], i, false, replaceContext);
    });
  }
  // 返回 hook 过的 promise
  return promise;
}
```

### 2. hookFirstSync

`hookFirst` 的同步版本，使用场景有 `resolveFileUrl`、`resolveImportMeta` 等。

```ts
function hookFirstSync<H extends keyof PluginHooks, R = ReturnType<PluginHooks[H]>>(
  hookName: H,
  args: Args<PluginHooks[H]>,
  replaceContext?: ReplaceContext
): R {
  for (let i = 0; i < this.plugins.length; i++) {
    // runHook 的同步版本
    const result = this.runHookSync(hookName, args, i, replaceContext);
    // 返回非 null 或 undefined 的时候，停止运行，返回结果
    if (result != null) return result as any;
  }
  // 否则返回 null
  return null as any;
}
```

### 3. hookParallel

并行执行 hook，不会等待当前 hook 完成。也就是说如果某个插件是异步的，其后的插件不会等待，而是并行执行。使用场景 `buildEnd`、`buildStart`、`moduleParsed` 等。

```ts
hookParallel<H extends AsyncPluginHooks & ParallelPluginHooks>(
  hookName: H,
  args: Parameters<PluginHooks[H]>,
  replaceContext?: ReplaceContext
): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const plugin of this.plugins) {
    const hookPromise = this.runHook(hookName, args, plugin, false, replaceContext);
    if (!hookPromise) continue;
    promises.push(hookPromise);
  }
  return Promise.all(promises).then(() => {});
}
```

### 4.hookReduceArg0

对 arg 第一项进行 reduce 操作。使用场景: `options`、`renderChunk` 等。

```ts
function hookReduceArg0<H extends keyof PluginHooks, V, R = ReturnType<PluginHooks[H]>>(
  hookName: H,
  [arg0, ...args]: any[], // 取出传入的数组的第一个参数，将剩余的置于一个数组中
  reduce: Reduce<V, R>,
  replaceContext?: ReplaceContext // 替换当前 plugin 调用时候的上下文环境
) {
  let promise = Promise.resolve(arg0); // 默认返回 source.code
  for (let i = 0; i < this.plugins.length; i++) {
    // 第一个 promise 的时候只会接收到上面传递的 arg0
    // 之后每一次 promise 接受的都是上一个插件处理过后的 source.code 值
    promise = promise.then(arg0 => {
      const hookPromise = this.runHook(hookName, [arg0, ...args], i, false, replaceContext);
      // 如果没有返回 promise，那么直接返回 arg0
      if (!hookPromise) return arg0;
      // result 代表插件执行完成的返回值
      return hookPromise.then((result: any) =>
        reduce.call(this.pluginContexts[i], arg0, result, this.plugins[i])
      );
    });
  }
  return promise;
}
```

### 5.hookReduceArg0Sync

`hookReduceArg0` 同步版本，使用场景 `transform`、`generateBundle` 等，不做赘述。

### 6. hookReduceValue

将返回值减少到类型 T，分别处理减少的值。允许钩子作为值。

```ts
hookReduceValue<H extends PluginValueHooks, T>(
		hookName: H,
		initialValue: T | Promise<T>,
		args: Parameters<AddonHookFunction>,
		reduce: (
			reduction: T,
			result: ResolveValue<ReturnType<AddonHookFunction>>,
			plugin: Plugin
		) => T,
		replaceContext?: ReplaceContext
	): Promise<T> {
		let promise = Promise.resolve(initialValue);
		for (const plugin of this.plugins) {
			promise = promise.then(value => {
				const hookPromise = this.runHook(hookName, args, plugin, true, replaceContext);
				if (!hookPromise) return value;
				return hookPromise.then(result =>
					reduce.call(this.pluginContexts.get(plugin), value, result, plugin)
				);
			});
		}
		return promise;
	}
```

### 7. hookReduceValueSync

hookReduceValue 的同步版本。

### 8. hookSeq

加载  `sequential`  类型的钩子函数，和 `hookFirst` 的区别就是不能中断，使用场景有  `onwrite`、`generateBundle`  等。

```ts
async function hookSeq<H extends keyof PluginHooks>(
  hookName: H,
  args: Args<PluginHooks[H]>,
  replaceContext?: ReplaceContext
  // hookFirst 通过 skip 参数决定是否跳过某个钩子函数
): Promise<void> {
  let promise: Promise<void> = Promise.resolve();
  for (let i = 0; i < this.plugins.length; i++)
    promise = promise.then(() =>
      this.runHook<void>(hookName, args as any[], i, false, replaceContext)
    );
  return promise;
}
```

### 9.hookSeqSync

`hookSeq` 同步版本，不需要构造 promise，而是直接使用 `runHookSync` 执行钩子函数。使用场景有 `closeWatcher`、`watchChange` 等。

```ts
hookSeqSync<H extends SyncPluginHooks & SequentialPluginHooks>(
  hookName: H,
  args: Parameters<PluginHooks[H]>,
  replaceContext?: ReplaceContext
): void {
  for (const plugin of this.plugins) {
    this.runHookSync(hookName, args, plugin, replaceContext);
  }
}
```

通过观察上面几种钩子函数的调用方式，我们可以发现，其内部有一个调用钩子函数的方法: runHook(Sync)(当然也分同步和异步版本)，该函数真正执行插件中提供的钩子函数。​

`也就是说，之前介绍了那么多的钩子函数，仅仅决定了我们插件的调用时机和调用方式(比如同步/异步)，而真正调用并执行插件函数(前面提到插件本身是个「函数」)的钩子其实是 runHook` 。

## runHook(Sync)

真正执行插件的钩子函数，同步版本和异步版本的区别是有无 permitValues 许可标识允许返回值而不是只允许返回函数。

```ts
function runHook<T>(
  hookName: string,
  args: any[],
  pluginIndex: number,
  permitValues: boolean,
  hookContext?: ReplaceContext | null
): Promise<T> {
  this.previousHooks.add(hookName);
  // 找到当前 plugin
  const plugin = this.plugins[pluginIndex];
  // 找到当前执行的在 plugin 中定义的 hooks 钩子函数
  const hook = (plugin as any)[hookName];
  if (!hook) return undefined as any;

  // pluginContexts 在初始化 plugin 驱动器类的时候定义，是个数组，数组保存对应着每个插件的上下文环境
  let context = this.pluginContexts[pluginIndex];
  // 用于区分对待不同钩子函数的插件上下文
  if (hookContext) {
    context = hookContext(context, plugin);
  }
  return Promise.resolve()
    .then(() => {
      // 允许返回值，而不是一个函数钩子，使用 hookReduceValue 或 hookReduceValueSync 加载。
      // 在 sync 同步版本钩子函数中，则没有 permitValues 许可标识允许返回值
      if (typeof hook !== 'function') {
        if (permitValues) return hook;
        return error({
          code: 'INVALID_PLUGIN_HOOK',
          message: `Error running plugin hook ${hookName} for ${plugin.name}, expected a function hook.`,
        });
      }
      // 传入插件上下文和参数，返回插件执行结果
      return hook.apply(context, args);
    })
    .catch(err => throwPluginError(err, plugin.name, { hook: hookName }));
}
```

看完这些钩子函数介绍，我们清楚了插件的调用时机、调用方式以及执行输出钩子函数。 但你以为这就结束了？？当然没有结束我们还要把这些钩子再带回 rollup 打包流程康康一下调用时机和调用方式的实例~~

## rollup.rollup()

又回到最初的起点~~~

前面提到过，构建钩子函数在 Rollup 处理输入文件之前定位、提供和转换输入文件。那么当然要先从输入开始看起咯~

### build 阶段

####

处理 inputOptions

```ts
// 从处理 inputOptions 开始,你的插件钩子函数已到达！
const { options: inputOptions, unsetOptions: unsetInputOptions } = await getInputOptions(
  rawInputOptions,
  watcher !== null
);
```

朋友们，把 async、first、sequential 和 parallel 以及 9 个钩子函数带上开搞！

```ts
// 处理 inputOptions 的应用场景下调用了 options 钩子
function applyOptionHook(watchMode: boolean) {
  return async (
    // 异步串行执行
    inputOptions: Promise<GenericConfigObject>,
    plugin: Plugin
  ): Promise<GenericConfigObject> => {
    if (plugin.options) {
      // plugin 配置存在
      return (
        ((await plugin.options.call(
          { meta: { rollupVersion, watchMode } }, // 上下文
          await inputOptions
        )) as GenericConfigObject) || inputOptions
      );
    }

    return inputOptions;
  };
}
```

接着标准化插件

```ts
// 标准化插件
function normalizePlugins(plugins: Plugin[], anonymousPrefix: string): void {
  for (let pluginIndex = 0; pluginIndex < plugins.length; pluginIndex++) {
    const plugin = plugins[pluginIndex];
    if (!plugin.name) {
      plugin.name = `${anonymousPrefix}${pluginIndex + 1}`;
    }
  }
}
```

#### 生成 graph 对象处理

重点来了！const graph = new Graph(inputOptions, watcher);里面就调用了我们上面介绍的一些关键钩子函数了～

```ts
// 不止处理缓存
this.pluginCache = options.cache?.plugins || Object.create(null);

// 还有 WatchChangeHook 钩子
if (watcher) {
  this.watchMode = true;
  const handleChange: WatchChangeHook = (...args) => this.pluginDriver.hookSeqSync('watchChange', args); // hookSeq 同步版本,watchChange 使用场景下
  const handleClose = () => this.pluginDriver.hookSeqSync('closeWatcher', []); // hookSeq 同步版本, closeWatcher 使用场景下
  watcher.on('change', handleChange);
  watcher.on('close', handleClose);
  watcher.once('restart', () => {
    watcher.removeListener('change', handleChange);
    watcher.removeListener('close', handleClose);
  });
}

this.pluginDriver = new PluginDriver(this, options, options.plugins, this.pluginCache); // 生成一个插件驱动对象
...
this.moduleLoader = new ModuleLoader(this, this.modulesById, this.options, this.pluginDriver); // 初始化模块加载对象
```

到目前为止，处理 inputOptions 生成了 graph 对象，还记不记得！我们前面讲过\_ graph 包含入口以及各种依赖的相互关系，操作方法，缓存等，在实例内部实现 AST 转换，是 rollup 的核心。

我们还讲过！在*解析入口文件路径阶段，*为了\_从入口文件的绝对路径出发找到它的模块定义，并获取这个入口模块所有的依赖语句，我们要先通过 resolveId()方法解析文件地址，拿到文件绝对路径。这个过程就是通过在 ModuleLoader 中调用 resolveId 完成的。resolveId() 我们在 tree-shaking 时讲到基本构建流程时已经介绍过的，下面看调用了钩子函数的具体方法~

```ts
export function resolveIdViaPlugins(
  source: string,
  importer: string | undefined,
  pluginDriver: PluginDriver,
  moduleLoaderResolveId: (
    source: string,
    importer: string | undefined,
    customOptions: CustomPluginOptions | undefined,
    skip: { importer: string | undefined; plugin: Plugin; source: string }[] | null
  ) => Promise<ResolvedId | null>,
  skip: { importer: string | undefined; plugin: Plugin; source: string }[] | null,
  customOptions: CustomPluginOptions | undefined
) {
  let skipped: Set<Plugin> | null = null;
  let replaceContext: ReplaceContext | null = null;
  if (skip) {
    skipped = new Set();
    for (const skippedCall of skip) {
      if (source === skippedCall.source && importer === skippedCall.importer) {
        skipped.add(skippedCall.plugin);
      }
    }
    replaceContext = (pluginContext, plugin): PluginContext => ({
      ...pluginContext,
      resolve: (source, importer, { custom, skipSelf } = BLANK) => {
        return moduleLoaderResolveId(
          source,
          importer,
          custom,
          skipSelf ? [...skip, { importer, plugin, source }] : skip
        );
      },
    });
  }
  return pluginDriver.hookFirst(
    // hookFirst 被调用，通过插件处理获取就绝对路径，first 类型，如果有插件返回了值，那么后续所有插件的 resolveId 都不会被执行。
    'resolveId',
    [source, importer, { custom: customOptions }],
    replaceContext,
    skipped
  );
}
```

拿到 resolveId hook 处理过返回的绝对路径后，就要从入口文件的绝对路径出发找到它的模块定义，并获取这个入口模块所有的依赖语句并返回所有内容。在这里，我们收集配置并标准化、分析文件并编译源码生成 AST、生成模块并解析依赖，最后生成 chunks，总而言之就是读取并修改文件！要注意的是，每个文件只会被一个插件的 load Hook 处理，因为它是以 hookFirst 来执行的。另外，如果你没有返回值，rollup 会自动读取文件。接下来进入 fetchModule 阶段~

```ts
const module: Module = new Module(...)
...
await this.pluginDriver.hookParallel('moduleParsed', [module.info]); // 并行执行 hook,moduleParsed 场景
...
await this.addModuleSource(id, importer, module);
...// addModuleSource
source = (await this.pluginDriver.hookFirst('load', [id])) ?? (await readFile(id)); // 在 load 阶段对代码进行转换、生成等操作
...// resolveDynamicImport
const resolution = await this.pluginDriver.hookFirst('resolveDynamicImport', [
  specifier,
  importer
]);
```

#### bundle 处理代码

生成的 graph 对象准备进入 build 阶段~~build 开始与结束中的插件函数钩子

```ts
await graph.pluginDriver.hookParallel('buildStart', [inputOptions]); // 并行执行 hook,buildStart 场景
...
await graph.build();
...
await graph.pluginDriver.hookParallel('buildEnd', []); // 并行执行 hook,buildEnd 场景
```

如果在 buildStart 和 build 阶段出现异常，就会提前触发处理 closeBundle 的 hookParallel 函数：

```ts
await graph.pluginDriver.hookParallel('closeBundle', []);
```

### generate 阶段

#### outputOptions

在 handleGenerateWrite() 阶段，获取处理后的 outputOptions。

```ts
outputPluginDriver.hookReduceArg0Sync(
  'outputOptions',
  [rawOutputOptions.output || rawOutputOptions] as [OutputOptions],
  (outputOptions, result) => result || outputOptions,
  pluginContext => {
    const emitError = () => pluginContext.error(errCannotEmitFromOptionsHook());
    return {
      ...pluginContext,
      emitFile: emitError,
      setAssetSource: emitError,
    };
  }
);
```

将处理后的 outputOptions 作为传参生成 bundle 对象：

#### 生成代码

在 `const generated = await bundle.generate(isWrite);` bundle 生成代码阶段，

```ts
... // render 开始
await this.pluginDriver.hookParallel('renderStart', [this.outputOptions, this.inputOptions]);
... // 该钩子函数执行过程中不能中断
await this.pluginDriver.hookSeq('generateBundle', [
  this.outputOptions,
  outputBundle as OutputBundle,
  isWrite
]);
```

最后并行执行处理生成的代码~

```ts
await outputPluginDriver.hookParallel('writeBundle', [outputOptions, generated]);
```

### 小结

不难看出插件函数钩子贯穿了整个 rollup 的打包过程，并扮演了不同角色，支撑起了相应功能实现。

我们目前做的就是梳理并理解这个过程，再回过头来看这张图，是不是发现一些问题：比如调用钩子函数的方式不止 hookParallel 一种，而图中展示触发的钩子函数也只有几个并不全面等，这张图只是为了串一遍主流程，方便大家理解 rollup 打包流程及调用钩子函数的方式及时机。

关于十几个钩子函数的使用不一一介绍，具体你的插件怎么写以及作用在哪些钩子函数中需要分析具体场景根据以上工作原理查阅文档自行编写。
​

<div align="center"><img :src="$withBase('/images/rollup/rollup9.awebp')" alt="rollup/rollup9.awebp"></div>

最后再来讲讲 rollup 插件的两个周边叭～

## 插件上下文

rollup 给钩子函数注入了 `context`，也就是上下文环境，用来方便对 `chunks` 和其他构建信息进行增删改查。也就是说，在插件中，可以在各个 hook 中直接通过 this.xxx 来调用上面的方法。

```ts
const context: PluginContext = {
    addWatchFile(id) {},
    cache: cacheInstance,
    emitAsset: getDeprecatedContextHandler(...),
    emitChunk: getDeprecatedContextHandler(...),
    emitFile: fileEmitter.emitFile,
    error(err)
    getAssetFileName: getDeprecatedContextHandler(...),
    getChunkFileName: getDeprecatedContextHandler(),
    getFileName: fileEmitter.getFileName,
    getModuleIds: () => graph.modulesById.keys(),
    getModuleInfo: graph.getModuleInfo,
    getWatchFiles: () => Object.keys(graph.watchFiles),
    isExternal: getDeprecatedContextHandler(...),
    meta: { // 绑定 graph.watchMode
        rollupVersion,
        watchMode: graph.watchMode
    },
    get moduleIds() { // 绑定 graph.modulesById.keys();
        const moduleIds = graph.modulesById.keys();
        return wrappedModuleIds();
    },
    parse: graph.contextParse, // 绑定 graph.contextParse
    resolve(source, importer, { custom, skipSelf } = BLANK) { // 绑定 graph.moduleLoader 上方法
        return graph.moduleLoader.resolveId(source, importer, custom, skipSelf ? pidx : null);
    },
    resolveId: getDeprecatedContextHandler(...),
    setAssetSource: fileEmitter.setAssetSource,
    warn(warning) {}
};
```

## 插件的缓存

插件还提供缓存的能力，利用了闭包实现的非常巧妙。

```ts
export function createPluginCache(cache: SerializablePluginCache): PluginCache {
  // 利用闭包将 cache 缓存
  return {
    has(id: string) {
      const item = cache[id];
      if (!item) return false;
      item[0] = 0; // 如果访问了，那么重置访问过期次数，猜测：就是说明用户有意向主动去使用
      return true;
    },
    get(id: string) {
      const item = cache[id];
      if (!item) return undefined;
      item[0] = 0; // 如果访问了，那么重置访问过期次数
      return item[1];
    },
    set(id: string, value: any) {
      // 存储单位是数组，第一项用来标记访问次数
      cache[id] = [0, value];
    },
    delete(id: string) {
      return delete cache[id];
    },
  };
}
```

然后创建缓存后，会添加在插件上下文中:

```ts
import createPluginCache from 'createPluginCache';

const cacheInstance = createPluginCache(
  pluginCache[cacheKey] || (pluginCache[cacheKey] = Object.create(null))
);

const context = {
  // ...
  cache: cacheInstance,
  // ...
};
```

之后我们就可以在插件中就可以使用 cache 进行插件环境下的缓存，进一步提升打包效率:

```ts
function testPlugin() {
  return {
    name: 'test-plugin',
    buildStart() {
      if (!this.cache.has('prev')) {
        this.cache.set('prev', '上一次插件执行的结果');
      } else {
        // 第二次执行 rollup 的时候会执行
        console.log(this.cache.get('prev'));
      }
    },
  };
}
let cache;
async function build() {
  const chunks = await rollup.rollup({
    input: 'src/main.js',
    plugins: [testPlugin()],
    // 需要传递上次的打包结果
    cache,
  });
  cache = chunks.cache;
}

build().then(() => {
  build();
});
```

## 总结

1. rollup 的插件本质是一个处理函数，返回一个对象。返回的对象包含一些属性(如 name)，和不同阶段的钩子函数（构建 build 和输出 output 阶段），以实现插件内部的功能；
2. 关于返回的对象，在插件返回对象中的钩子函数中，大多数的钩子函数定义了 插件的调用时机和调用方式，只有 runHook(Sync)钩子真正执行了插件；
3. 关于插件调用时机和调用方法的触发取决于打包流程，在此我们通过图 1 流程图也梳理了一遍 rollup.rollup() 打包流程；
4. 插件原理都讲完了，插件调用当然 so easy，一个函数谁还不会用呢？而对于简单插件函数的开发页也不仅仅是单纯模仿，也可以做到心中有数了！
