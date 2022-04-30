# 10 分钟搞懂 Vite devServer

[[toc]]

分析 Vite version：2.2.3

## 一、初始 cli 启动服务做了什么？

pacakge.json 的 bin 指定可执行文件：

```json
"bin": {
    "vite": "bin/vite.js"
  }
```

在安装带有 bin 字段的 vite 包，那可执行文件会被链接到当前项目的./node_modules/.bin 中，所以,npm 会从 vite.js 文件创建一个到/usr/local/bin/vite 的符号链接(这使你可以直接在命令行执行 vite)如下证明：

目中，也可以很方便地利用 npm 执行脚本（package.json 文件中 scripts 可以直接执行：'node node_modules/.bin/vite'）

那 vite.js 做了什么？

<div align="center"><img :src="$withBase('/images/vite/vite3.awebp')" alt="vite/vite3.awebp"></div>

cli.ts 才算真正的启动服务，做 cli 命令的相关配置：

```ts
import { cac } from 'cac' // 是一个用于构建 CLI 应用程序的 JavaScript 库
const cli = cac('vite')

cli
  .option('-c, --config <file>', `[string] use specified config file`) // 明确的 config 文件名称,默认 vite.config.js .ts .mjs
  .option('-r, --root <path>', `[string] use specified root directory`) // 根路径,默认是当前路径 process.cwd()
  .option('--base <path>', `[string] public base path (default: /)`) // 在开发或生产中使用的基本公共路径，默认'/'
  .option('-l, --logLevel <level>', `[string] silent | error | warn | all`) // 日志级别
  .option('--clearScreen', `[boolean] allow/disable clear screen when logging`) // 打日志的时候是否允许清屏
  .option('-d, --debug [feat]', `[string | boolean] show debug logs`) // 配置展示 debug 的日志
  .option('-f, --filter <filter>', `[string] filter debug logs`) // 筛选 debug 日志

// dev 的命令[这是我们的讨论重点 -- devServer]
cli
  .command('[root]') // default command
  .alias('serve') // 别名，即为 `vite serve`命令 = `vite`命令
  .option('--host [host]', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`) // --host 指定 port (默认值：3000)
  .option('--https', `[boolean] use TLS + HTTP/2`) // --https 使用 https (默认值：false)

  .option('--open [path]', `[boolean | string] open browser on startup`) // --open 在服务器启动时打开浏览器
  .option('--cors', `[boolean] enable CORS`) // --cors 启动跨域
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('-m, --mode <mode>', `[string] set env mode`) // --mode 指定环境模式
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle` // 优化器有缓存，--force true 强制忽略缓存，重新打包
  )
  .action(async (root: string, options: ServerOptions & GlobalCLIOptions) => {
    const { createServer } = await import('./server')
    try {
      const server = await createServer({ // 创建了 server，接下来我们重点讨论 server 做了什么
        root,
        base: options.base,
        mode: options.mode,
        configFile: options.config,
        logLevel: options.logLevel,
        clearScreen: options.clearScreen,
        server: cleanOptions(options) as ServerOptions
      })
      await server.listen()
    } catch (e) {
      .......
    }
  })

// build 的命令：生产环境构建
cli
  .command('build [root]')
	。。。。。。。

// preview 的命令：预览构建效果
cli
  .command('preview [root]')

// optimize 的命令：预优化
cli
  .command('optimize [root]')
	。。。。。。。
```

简单来讲，我们从敲下 `npm run dev` 执行 cli 命令的时候，会执行`/node_modules/vite/dist/node/cli.js`，调用 `createServer` 方法，传递 `vite.config.js` 或 cli 命令上的自定义 config，创建一个 `viteDevServer` 实例。

接下来我们康康打造一个 `viteDevServer` 的生产流是什么~

## 二、devServer 的构成

5 个主要模块+15 个中间件：

<div align="center"><img :src="$withBase('/images/vite/vite4.awebp')" alt="vite/vite4.awebp"></div>

<div align="center"><img :src="$withBase('/images/vite/vite5.awebp')" alt="vite/vite5.awebp"></div>

敲重点！！！在分析这些源码零件之前，为了方便理解，兄弟们 debug 搞起来~

- [yarn link 本地代码](https://cn.vitejs.dev/guide/#command-line-interface)
- node --inspect-brk 打断点来 debug 我们 server 端的逻辑, 或者脚本处 debugger，--inspect，然后 yarn inspect 起服务
  ```ts
  "inspect": "node --inspect-brk ./node_modules/.bin/vite --debug lxyDebug"
  ```
- 浏览器打开 chrome://inspect 进行 debug：[具体操作](http://www.ruanyifeng.com/blog/2018/03/node-debugger.html?spm=a2c6h.12873639.0.0.58f832acIcEUUh)

## 三、五大模块

首先我们会简单的梳理 5 个模块的功能，和各个模块之间的协作联系，深入了解请期待后续文章~

### 1. WebSocketServer

主要就是使用 [ws](https://www.npmjs.com/package/ws) 包,新建了一个 websocket 服务 `new WebSocket.Server()` 用来发送信息，监听连接。它主要在 HRM 热更新里起到发送各类消息的作用，之后 HRM 文章会着重叙述~

### 2. watcher--FSWatcher

vite 使用 [chokidar](https://www.npmjs.com/package/chokidar) 这个跨平台文件监听库，里面用到的方法也很容易理解，感兴趣的去康康~ 它主要是监听 `add` `unlink` `change`，即监听文件新增，删除，更新，从而更新模块图 moduleGraph，同步热更新。

### 3. ModuleGraph

跟踪导入关系的模块图，url 到文件的映射和 hmr 状态。 说人话就是这个 class 是一个仓库,可以实现增删改查。根据依赖关系新增数据，进行更新，可根据 resolveId，url,file 名称进行查找等等。目的就是给你处理模块的依赖~

### 4. pluginContainer

基于 Rollup plugin container，提供了一些 hooks：比如下面

- `pluginContainer.watchChange`: 每当受监控的文件发生更改时，都会通知插件, 执行对应处理
- `pluginContainer.resolveId`: 处理 ES6 的 import 语句，最后需要返回一个模块的 id
- `pluginContainer.load`: 执行每个 rollup plugin 的 load 方法，产出 ast 数据等，用于 pluginContainer.transform 后续转换
- `pluginContainer.transform`: 每个 rollup plugin 提供 transform 方法，在这个钩子里执行是为了对不同文件代码进行转换操作，比如 plugin-vue，经过执行就将 vue 文件转换成新的格式代码。

总结一下，抛出这些钩子都是为了转化 【我们的代码 =>vite 制定规则下的新代码】 ，为其他模块作为基础服务。

### 5. httpServer

原生 `node http` 服务器的实例，根据 `http https http2` 做了不同情况的处理。使用了 `selfsigned` 包生成自签名的 `x509` 证书，提供 `CA` 认证保障 `https` 安全传输。​

## 四、15 个中间件

每个中间件结合下面的注释看源码 😄，数量有点多，重点中间件如 transformMiddleware，大家可以挑选一些重点来看~

### 1. timeMiddleware

--debug 命令下，启动打印，时间中间件能打印出我们整体的启动时间。

```ts
// 文件： /server/index.ts
if (process.env.DEBUG) {
  middlewares.use(timeMiddleware(root));
}
```

```ts
// 文件：/middleware/time.ts:
const logTime = createDebugger('vite:time');

export function timeMiddleware(root: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const start = Date.now();
    const end = res.end;
    res.end = (...args: any[]) => {
      // 打印【时间 相对路径】 -- e.g.: 1ms  /src/App.vue?vue&type=style&index=0&lang.css
      logTime(`${timeFrom(start)} ${prettifyUrl(req.url!, root)}`);
      // @ts-ignore
      return end.call(res, ...args);
    };
    next();
  };
}
```

### 2. corsMiddleware

跨域处理的中间件。 vite.config.js 传入 cors 参数作为 corsOptions 给到 cors 包，实现各种配置化的跨域场景。

```ts
// 文件： /server/index.ts
// CORS 用于提供可用于通过各种选项启用 CORS 的 Connect / Express 中间件。
import corsMiddleware from 'cors';

// cors (默认启用)
const { cors } = serverConfig;
if (cors !== false) {
  middlewares.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors));
}
```

### 3. proxyMiddleware

代理处理。 vite.config.js 传入 proxy 参数，底层用的 http-proxy 包实现代理功能。

```ts
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    host: 'liang.web.com',
    open: true, // 自动打开浏览器
    cors: true,
    base: '/mybase',
    proxy: {
      // 字符串简写写法
      '/foo1': 'http://liang.web.com:3001/foo2',
      // 选项写法
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      // 正则表达式写法
      '^/fallback/.*': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fallback/, ''),
      },
      '/sunny': {
        bypass: (req, res, options) => {
          console.log(options);
          res.end('sunny hhhhhh');
        },
      },
      '^/404/.*': {
        forward: 'http://localhost:3001/',
        bypass: (req, res, options) => {
          return false; // 默认服务器返回是 res.end(404)
        },
      },
    },
  },
});
```

```ts
// 文件： /server/index.ts
const { proxy } = serverConfig;
if (proxy) {
  // 启用代理配置
  middlewares.use(proxyMiddleware(httpServer, config));
}
```

```ts
// 文件：/middleware/proxy.ts:
// node-http-proxy 是一个支持 websocket 的 HTTP 可编程代理库。它适用于实现诸如反向代理和负载平衡器之类的组件。
import httpProxy from 'http-proxy'
export function proxyMiddleware(
  httpServer: http.Server | null,
  config: ResolvedConfig
): Connect.NextHandleFunction {
  const options = config.server.proxy!
  ...
  const proxy = httpProxy.createProxyServer(opts) as HttpProxy.Server // 创建代理服务器
  proxy.on('error', (err) => {...})
  if (opts.configure) { // 执行传递的 config 方法
    opts.configure(proxy, opts)
  }
  if (httpServer) {
    // 监听 `upgrade` 事件并且代理 WebSocket 请求
    httpServer.on('upgrade', (req, socket, head) => {
      const url = req.url!
      for (const context in proxies) {
        if (url.startsWith(context)) { // 如果当前 URL 匹配上要代理的 url
          const [proxy, opts] = proxies[context]
          if (
            (opts.ws || opts.target?.toString().startsWith('ws:')) &&
            req.headers['sec-websocket-protocol'] !== HMR_HEADER // 不是 HRM 的 websocket 请求
          ) {
            if (opts.rewrite) {
              req.url = opts.rewrite(url)
            }
            proxy.ws(req, socket, head) // 代理 websocket 方法
          }
        }
      }
    })
  }
  return (req, res, next) => {
    const url = req.url!
    for (const context in proxies) { // 循环处理传递来的 proxy 对象配置，context 如【'^/fallback/.*'】
      if (
        (context.startsWith('^') && new RegExp(context).test(url)) ||
        url.startsWith(context)
        ) { // 正则匹配上的 URL 或 字符匹配上的 URL
        const [proxy, opts] = proxies[context]
        const options: HttpProxy.ServerOptions = {}

        if (opts.bypass) { // 执行配置传递的 bypass 方法 - 记录 debug
          const bypassResult = opts.bypass(req, res, opts)
          ......
        }
        if (opts.rewrite) { // 执行传递的 rewrite 方法
          req.url = opts.rewrite(req.url!)
        }
        proxy.web(req, res, options) // 代理 web 请求
        return
      }
    }
    next()
  }
}
```

### 4. baseMiddleware

路径的 base 处理

```ts
// 文件： /server/index.ts
if (config.base !== '/') {
  middlewares.use(baseMiddleware(server));
}
```

```ts
// 文件 /middlewares/base.ts
import { parse as parseUrl } from 'url';
export function baseMiddleware({ config }: ViteDevServer): Connect.NextHandleFunction {
  const base = config.base;
  return (req, res, next) => {
    const url = req.url!;
    const parsed = parseUrl(url);
    const path = parsed.pathname || '/';

    if (path.startsWith(base)) {
      req.url = url.replace(base, '/'); // 删除 base..这确保其他中间件不需要考虑是否在 base 上加了前缀
    } else if (path === '/' || path === '/index.html') {
      res.writeHead(302, {
        // 302 重定向到 base 路径
        Location: base,
      });
      res.end();
      return;
    } else if (req.headers.accept?.includes('text/html')) {
      // non-based page visit
      res.statusCode = 404;
      res.end(xxx);
      return;
    }

    next();
  };
}
```

### 5. launchEditorMiddleware

在 Node.js 的编辑器中打开带有行号的某文件。

```ts
import launchEditorMiddleware from 'launch-editor-middleware';
middlewares.use('/__open-in-editor', launchEditorMiddleware());
```

### 6. pingPongMiddleware

hmr 重新连接的心跳检测

```ts
middlewares.use('/__vite_ping', (_, res) => res.end('pong'));
```

### 7. decodeURIMiddleware

sirv 中间件找文件需要解码的 URL，所以要提前将 parsedUrl 对象的 key 对应 value 进行解码

```ts
// decode 请求 URL
middlewares.use(decodeURIMiddleware());
```

### 8. servePublicMiddleware

```ts
// 在/ public 下提供静态文件
// 这在转换中间件之前应用，以便提供这些文件就像没有变换一样。
middlewares.use(servePublicMiddleware(config.publicDir));
```

```ts
// 文件 /server/middleware/static.ts
import sirv from 'sirv';

export function servePublicMiddleware(dir: string): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions); // 这个插件可以处理静态服务

  return (req, res, next) => {
    // 跳过 import 的请求，如 /src/components/HelloWorld.vue?import&t=1620397982037
    if (isImportRequest(req.url!)) {
      return next();
    }
    serve(req, res, next);
  };
}
```

### 9. transformMiddleware

cacheDir: 默认为项目路径下的/node_modules/.vite

```ts
// 核心转换器 middleware
middlewares.use(transformMiddleware(server));
```

核心逻辑：将当前请求 url 添加到维护的 moduleGraph 中，返回处理后的新代码；
主要方法 -- [transformRequest](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/transformRequest.ts)：
该方法进行了缓存，请求资源解析，加载，转换操作。命中缓存的直接返回 transform result，否则进行以下操作：

- pluginContainer.resolveId(url)?.id： 获取新增 resolveId
- pluginContainer.load(id) ：根据上面获取的 id，经过该 hook 产出 map【sourceMap 信息】和 code【返回客户端的代码】
- 把新增的 module 放入 moduleGraph，并且用 watcher 监听 module.file
- 处理 map 内的 sourceMap 相关信息，比如注入源代码内容：`injectSourceContent`
- 拼接信息成对象返回

```ts
mod.transformResult = {
  code, // plugin.transform 后返回给客户端的代码
  map, // 处理后的 sourceMap 信息
  etag: getEtag(code, { weak: true }), // etag 插件生成
};
```

[源码有点多，自己搞~](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/middlewares/transform.ts) 1）处理 js 请求：/src/main.js：

<div align="center"><img :src="$withBase('/images/vite/vite6.awebp')" alt="vite/vite6.awebp"></div>

transform 后的 code 返回结果查看：

<div align="center"><img :src="$withBase('/images/vite/vite7.awebp')" alt="vite/vite7.awebp"></div>

2）处理?import 请求： 场景：更新一行 helloworld.vue 代码，热更新打进来的请求

<div align="center"><img :src="$withBase('/images/vite/vite8.awebp')" alt="vite/vite8.awebp"></div>

3）处理 css 请求

<div align="center"><img :src="$withBase('/images/vite/vite9.awebp')" alt="vite/vite9.awebp"></div>

### 10. serveRawFsMiddleware

处理`/@fs/`的 URL，获取原有的路径

```ts
// 文件 /server/middleware/static.ts
export function serveRawFsMiddleware(): Connect.NextHandleFunction {
  const isWin = os.platform() === 'win32';
  const serveFromRoot = sirv('/', sirvOptions);

  return (req, res, next) => {
    let url = req.url!;
    if (url.startsWith(FS_PREFIX)) {
      // 以`/@fs/`开头的 URL
      url = url.slice(FS_PREFIX.length); // 取原有的路径
      if (isWin) url = url.replace(/^[A-Z]:/i, '');

      req.url = url;
      serveFromRoot(req, res, next);
    } else {
      next();
    }
  };
}
```

### 11. serveStaticMiddleware

```ts
// 文件 /server/middleware/static.ts
export function serveStaticMiddleware(
  dir: string,
  config: ResolvedConfig
): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions); // 传递 dir=root, 根路径下的静态服务

  return (req, res, next) => {
    const url = req.url!;

    // 仅在不是 html 请求的情况下处理文件，以便 html 请求可以进入我们的 html 中间件特殊处理
    if (path.extname(cleanUrl(url)) === '.html') {
      return next();
    }

    // 也将别名应用于静态请求
    let redirected: string | undefined;
    for (const { find, replacement } of config.resolve.alias) {
      const matches = typeof find === 'string' ? url.startsWith(find) : find.test(url);
      if (matches) {
        redirected = url.replace(find, replacement);
        break;
      }
    }
    if (redirected) {
      // dir 已预先标准化为 posix 样式
      if (redirected.startsWith(dir)) {
        redirected = redirected.slice(dir.length);
      }
      req.url = redirected;
    }

    serve(req, res, next);
  };
}
```

### 12. spaMiddleware

SPA 处理：提供 URL 对应 path 下的 index.html，默认为/index.html 文件

```ts
// 该中间件通过指定的索引页代理请求，对于使用 HTML5 history API 的单页应用程序非常有用。
import history from 'connect-history-api-fallback';
if (!middlewareMode) {
  middlewares.use(
    history({
      logger: createDebugger('vite:spa-fallback'),
      // 支持/ dir /，没有明确的 index.html
      rewrites: [
        {
          from: /\/$/,
          to({ parsedUrl }: any) {
            const rewritten = parsedUrl.pathname + 'index.html';
            if (fs.existsSync(path.join(root, rewritten))) {
              return rewritten;
            } else {
              return `/index.html`;
            }
          },
        },
      ],
    })
  );
}
```

### 13. indexHtmlMiddleware

```ts
if (!middlewareMode) {
  // 转换入口文件 index.html
  middlewares.use(indexHtmlMiddleware(server));
}
```

### 14. 404Middleware

```ts
if (!middlewareMode) {
  // 处理 404
  middlewares.use((_, res) => {
    res.statusCode = 404;
    res.end();
  });
}
```

### 15. errorMiddleware

```ts
// error handler
middlewares.use(errorMiddleware(server, middlewareMode));
```

```ts
// 文件 /server/middleware/error.ts
export function errorMiddleware(
  server: ViteDevServer,
  allowNext = false // 是否允许程序进行，否则返回错误状态码 500
): Connect.ErrorHandleFunction {
  // 请注意，必须保留 4 个 arg 才能进行 connect，以将其视为错误中间件
  return (err: RollupError, _req, res, next) => {
    const msg = buildErrorMessage(err, [chalk.red(`Internal server error: ${err.message}`)]);

    server.config.logger.error(msg, {
      // 日志记录错误
      clear: true,
      timestamp: true,
    });

    server.ws.send({
      // websocket 发送错误
      type: 'error',
      err: prepareError(err),
    });

    if (allowNext) {
      next();
    } else {
      res.statusCode = 500; // 返回 500 服务错误
      res.end();
    }
  };
}
```

## 五、createServer 总结

这就有了 cli 里的[创建 server](https://cn.vitejs.dev/guide/api-javascript.html#createserver) 方法啦~ 总结一下：
