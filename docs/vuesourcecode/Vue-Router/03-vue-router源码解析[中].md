# vue-router 源码解析 | 1.5w 字 | 多图预警 - 【中】

[[toc]]

## 路由跳转

要实现路由的跳转，首先得从路由映射表中找到与地址匹配的路由对象，这个过程称之为路由匹配，找到匹配的路由后，然后再解析跳转

所以实现路由跳转有两个关键步骤：路由匹配、导航解析

VueRouter 将上述两个关键步骤封装到 `transitionTo` 方法中了

接下来，我们先看看 `transitionTo` 的实现

### transitionTo

transitionTo 方法定义在基类 History 上的

```ts
// src/history/base.js

...
// 父类
export class History {
  ...

  // 路由跳转
  transitionTo (
    location: RawLocation, // 原始location，一个url或者是一个Location interface(自定义形状，在types/router.d.ts中定义)
    onComplete?: Function, // 跳转成功回调
    onAbort?: Function// 跳转失败回调
  ) {
    const route = this.router.match(location, this.current) // 传入需要跳转的location和当前路由对象，返回to的Route

    // 确认跳转
    this.confirmTransition(
      route,
      () => { // onComplete，完成
        this.updateRoute(route) // 更新route，会触发afterEach钩子
        onComplete && onComplete(route) // 调用onComplete回调
        this.ensureURL()
        // fire ready cbs once
        // 触发ready回调
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },
      err => { // onAbort，报错（取消）
        if (onAbort) {
          onAbort(err)
        }
        // 触发error回调
        if (err && !this.ready) {
          this.ready = true
          this.readyErrorCbs.forEach(cb => {
            cb(err)
          })
        }
      }
    )
  }
}
```

在 setupListeners 章节也介绍过 transitionTo 的方法签名  
接收三个参数

- `location` 为 `RawLocation` 类型，代表需要解析的地址
- `onComplete` 是跳转成功回调，在路由跳转成功时调用
- `onAbort` 是跳转失败(取消)回调，在路由被取消时调用

看下内部逻辑

- 调用 `router` 实例的 `match` 方法，从路由映射表中取到将要跳转到的路由对象 route；这其实就是`路由匹配`过程；
- 拿到将要跳转的 route 后，调用 `confirmTransition` 完成 route 的解析跳转，并在跳转成功、取消时调用对应回调方法；这是`导航解析`过程
  - 成功时，调用 `updateRoute` 触发重新渲染，然后触发相关回调；关于渲染，我们后面章节会讲
  - 取消(失败)时，触发相关回调

那我们下面先看下路由匹配过程

## 路由匹配

`transitionTo` 中会调用 `router` 实例的 `match` 方法实现路由匹配

```js
// src/index.js

export default class VueRouter {
  ...

  constructor (options: RouterOptions = {}) {

    this.matcher = createMatcher(options.routes || [], this)

    ...
  }

  // 获取匹配的路由对象
  match (
    raw: RawLocation,
    current?: Route,
    redirectedFrom?: Location
  ): Route {
    return this.matcher.match(raw, current, redirectedFrom)
  }
}
```

`router 实例的 match` 方法，又调用的匹配器的 `match` 方法，将参数直接透传过去

我们继续看匹配器的 match 方法

```js
// src/create-matcher.js

...

export function createMatcher (
  routes: Array<RouteConfig>, // 路由配置列表
  router: VueRouter // VueRouter实例
): Matcher {
  ...

  // 传入location,返回匹配的Route对象
  function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
    // 获取格式化后的location，由于闭包特性，所以此处能访问到router实例
    const location = normalizeLocation(raw, currentRoute, false, router)
    const { name } = location

    // 通过name匹配
    if (name) {
      const record = nameMap[name]
      if (process.env.NODE_ENV !== 'production') {
        // 未找到警告
        warn(record, `Route with name '${name}' does not exist`)
      }

      // 未找到路由记录，则创建一个空Route返回
      if (!record) return _createRoute(null, location)

      // 获取动态路由参数名
      const paramNames = record.regex.keys
        .filter(key => !key.optional)
        .map(key => key.name)
      if (typeof location.params !== 'object') {
        location.params = {}
      }

      // 提取当前Route中符合动态路由参数名的值赋值给location
      if (currentRoute && typeof currentRoute.params === 'object') {
        for (const key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key]
          }
        }
      }

      // 填充params
      location.path = fillParams(record.path, location.params, `named route "${name}"`)

      // 创建route
      return _createRoute(record, location, redirectedFrom)
    } else if (location.path) {
      location.params = {}

      // 遍历pathList，找到能匹配到的记录，然后生成Route
      for (let i = 0; i < pathList.length; i++) {
        const path = pathList[i]
        const record = pathMap[path]
        if (matchRoute(record.regex, location.path, location.params)) {

          // 找到匹配的路由记录后，生成对应Route
          return _createRoute(record, location, redirectedFrom)
        }
      }
    }

    // no match
    return _createRoute(null, location)
  }
   
}
```

由于`router.match` 是将参数透传过来的，所以二者的签名一模一样

- `raw` 是 `RawLocation` 类型，是需要进行路由匹配的地址
- `currentRoute` 是当前路由对象
- `redirectedFrom` 代表从哪个地址重定向过来的

我们看下 match 方法逻辑

- 首先它对传入的 raw 地址，进行了格式化(规范化)
- 然后取出格式化地址中的 name
- `name` 存在，判断是否能通过 name 在 nameMap 中找到对应的路由记录 RouteRecord
  - 无法找到，则创建一个新 route 对象返回
  - 可以找到，则填充 `params`，并使用此路由记录创建一个新的 Route 对象返回
- `name` 不存在，则判断 path 是否存在
  - 存在，则利用 `pathList`、`pathMap` 调用 `matchRoute` 判断是否匹配，进而找到匹配的路由记录，然后使用此路由记录创建新 `route` 对象返回
- `name`、`path` 都不存在
  - 则直接创建一个新 `route` 对象返回

活动图如下 match.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router25.awebp')" alt="vuesourcecode/vue-router/vue-router25.awebp">

我们提取一下上述流程的关键词

- `地址格式化normalizeLocation`
- `地址是否匹配判断matchRoute`
- `填充参数fillParams`
- `创建路由对象_createRoute`

### 地址格式化 normalizeLocation

我们看下为何需要对地址做格式化  
我们知道 `VueRoute` 定义的地址是 `RawLocation` 类型的，而它是联合类型的，支持 `string` 和 `Location` 类型

```js
// flow/declarations.js

declare type Location = {
  _normalized?: boolean
  name?: string
  path?: string
  hash?: string
  query?: Dictionary<string>
  params?: Dictionary<string>
  append?: boolean
  replace?: boolean
}

declare type RawLocation = string | Location
```

所以下面的地址都是合法的

`$router.push`方法的参数也是的`RawLocation`类型，所以使用`$router.push`来举例

```ts
// 字符串形式
this.$router.push('home'); // 相对
this.$router.push('/home'); // 绝对

// Location 对象形式
this.$router.push({ path: 'home' });
this.$router.push({ path: '/home' });

this.$router.push({ path: '/home', query: { test: 3 } }); // 携带qs

this.$router.push({ name: 'home' }); // 命名路由
this.$router.push({ name: 'detail', params: { id: 1 } }); // 命名+带参

this.$router.push({ params: { id: 1 } }); // 仅带参，针对仅有参数变化的相对跳转；相对参数跳转
```

可以看到 VueRouter 需要兼容上面所有情况，为了方便处理，需要对地址做格式化,看下实现逻辑

```js
// src/util/location.js

// 格式化location
export function normalizeLocation(
  raw: RawLocation, // 原始location，一个string，或者是一个已经格式化后的location
  current: ?Route, // 当前路由对象
  append: ?boolean, // 是否是追加模式
  router: ?VueRouter // VueRouter实例
): Location {
  let next: Location = typeof raw === 'string' ? { path: raw } : raw; // named target // 已经格式化过，直接返回

  if (next._normalized) {
    return next;
  } else if (next.name) {
    // 处理命名形式，例如{name:'Home',params:{id:3}}
    next = extend({}, raw);
    const params = next.params;
    if (params && typeof params === 'object') {
      next.params = extend({}, params);
    }
    return next;
  } // relative params // 处理{params:{id:1}}相对参数形式跳转

  if (!next.path && next.params && current) {
    next = extend({}, next);
    next._normalized = true;
    const params: any = extend(extend({}, current.params), next.params); // 提取当前route的字段做为next的字段，因为相对参数形式，只有params，必须借助current提取一些字段

    if (current.name) {
      // 命名形式
      next.name = current.name;
      next.params = params;
    } else if (current.matched.length) {
      // path形式，从匹配记录中提取出当前path并填充参数
      const rawPath = current.matched[current.matched.length - 1].path;
      next.path = fillParams(rawPath, params, `path ${current.path}`);
    } else if (process.env.NODE_ENV !== 'production') {
      warn(false, `relative params navigation requires a current route.`);
    }
    return next;
  } // 处理path形式跳转，例如{path:'/test',query:{test:3}} // 解析path

  const parsedPath = parsePath(next.path || '');
  const basePath = (current && current.path) || '/';
  const path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath; // 解析query

  const query = resolveQuery(
    parsedPath.query,
    next.query, // 额外需要追加的qs
    router && router.options.parseQuery // 支持传入自定义解析query的方法
  ); // 解析hash

  let hash = next.hash || parsedPath.hash;
  if (hash && hash.charAt(0) !== '#') {
    hash = `#${hash}`;
  }

  return {
    _normalized: true, // 标识已经格式化过
    path,
    query,
    hash,
  };
}
```

首先将 `string` 类型的转换为对象形式，方便后面统一处理  
如果发现地址已经做过格式化处理，则直接返回  
再判断是否是命名路由, 若是，则拷贝原始地址`raw`，拷贝`params`，直接返回  
处理了仅携带参数的相对路由(相对参数)跳转，就是`this.$router.push({params:{id:1}})`形式

- 对这种地址的定义是`没有path`、`仅有params`并且`当前路由对象存在`
- 主要处理逻辑是
  - 先合并`params`
  - 若是命名路由，则使用`current.name`做为`next.name`，并赋值`params`
  - 非命名路由，从当前路由对象中找到匹配的路由记录，并取出路由记录上的 path 做为`next.path`，然后填充 params
  - 返回处理好的地址
- 由于这中跳转方式，仅有 `params`，所以必须从当前路由对象 `current` 上获取可用字段(`path`、`name`)，做为自身值，然后跳转

处理通过 path 跳转的方

- 调用 `parsePath` 从 `path` 中解析出 `path`、`query`、`hash`
- 然后以 `current.path` 为 `basePath`，解析(`resolve`)出`最终 path`
- 对 `query` 进行合并操作
- 对 `hash` 进行前追加#操作
- 返回带有 `_normalized:true` 标识的 `Location` 对象

经过上面一番处理，无论传入何种地址，都返回一个带有`_normalized:true`标识的`Location类型`的对象

normalize-location.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router26.awebp')" alt="vuesourcecode/vue-router/vue-router26.awebp">

### 地址是否匹配判断 matchRoute

我们知道 VueRouter 是支持动态路由匹配的，如下图所示 dynamic-route.png
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router27.awebp')" alt="vuesourcecode/vue-router/vue-router27.awebp">

我们在上篇的`生成路由记录`章节也介绍过，`VueRouter` 在生成路由记录时，会通过 `path-to-regexp` 包生成一个正则扩展对象并赋值到路由记录的 regex 字段上，用于后续的动态路由参数的获取

- 主要的逻辑是提供一个动态路由`user/:id`和一个地址`/user/345`，通过`path-to-regexp`就能生成一个对象`{id:345}`来表达参数的映射关系
- 是一个借助动态路由，从 url 上提取参数的过程；`/user/345` -> `{id:345}`

上述提取参数的逻辑是在 `matchRoute` 实现的

```ts
// matchRoute位于src/create-matcher.js
// src/create-matcher.js

// 检查path是否能通过regex的匹配，并对params对象正确赋值
function matchRoute(regex: RouteRegExp, path: string, params: Object): boolean {
  const m = path.match(regex);

  if (!m) {
    // 无法匹配上
    return false;
  } else if (!params) {
    // 符合正则 && params不存在，则表示可以匹配
    return true;
  } // 符合正则 && params存在，需要对params进行正确赋值 // path-to-regexp会将每个动态路由标记处处理成正则的一个组，所以i从1开始 // 参考https://www.npmjs.com/package/path-to-regexp // const keys = []; // const regexp = pathToRegexp("/foo/:bar", keys); // regexp = /^\/foo\/([^\/]+?)\/?$/i // :bar就被处理成正则的一个组了 // keys = [{ name: 'bar', prefix: '/', suffix: '', pattern: '[^\\/#\\?]+?', modifier: '' }]

  for (let i = 1, len = m.length; i < len; ++i) {
    const key = regex.keys[i - 1]; // regex.keys返回匹配到的
    const val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i];
    if (key) {
      // Fix #1994: using * with props: true generates a param named 0
      params[key.name || 'pathMatch'] = val;
    }
  }

  return truee;
}
```

通过方法签名，可以知道它返回一个 `boolean` 值，这个值代表传入的 `path` 是否能通过 `regex` 的匹配；虽然返回一个 `boolean` 值，但是其内部还做了件很重要的事，从 `path` 上提取动态路由参数值，我们看下完整逻辑

- 首先调用 path.match(regex)
- 不能匹配直接返回 false
- 可以匹配且无 params，返回 true
- 剩下的就只有一种情况，可以匹配且 params 存在，此时需要对 params 进行正确赋值
  - 整个赋值，主要是遍历 path.match(regex)返回值并取出 regex 中存储的 key，然后依次赋值，关于细节可以参考上面的注释；
  - 关于 regex、path-to-regexp，可以参考生成路由记录章节和https://www.npmjs.com/package/path-to-regexp
- 还有一个点，赋值时的 pathMatch 是什么？
  - 这其实是跟通配符即\*有关的
  - VueRouter 关于通配符的特殊处理可以看[router.vuejs.org/zh/guide/es…](https%3A%2F%2Frouter.vuejs.org%2Fzh%2Fguide%2Fessentials%2Fdynamic-matching.html%23%25E6%258D%2595%25E8%258E%25B7%25E6%2589%2580%25E6%259C%2589%25E8%25B7%25AF%25E7%2594%25B1%25E6%2588%2596-404-not-found-%25E8%25B7%25AF%25E7%2594%25B1)  
    即 pathMatch 会代表通配符匹配到的路径

官方例子如下

```js
{
  // 会匹配所有路径
  path: '*';
}
{
  // 会匹配以 `/user-` 开头的任意路径
  path: '/user-*';
}

// 给出一个路由 { path: '/user-*' }
this.$router.push('/user-admin');
this.$route.params.pathMatch; // 'admin'
// 给出一个路由 { path: '*' }
this.$router.push('/non-existing');
this.$route.params.pathMatch; // '/non-existing'
```

match-route.png  
 <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router28.awebp')" alt="vuesourcecode/vue-router/vue-router28.awebp">

### 填充参数 fillParams

`fillParams` 可以看做是 `matchRoute` 的逆操作，是一个借助动态路径，使用参数生成 url 的过程；即`/user/:id+{id:345}`-> `/user/345`

可以看下它的实现

```js
// src/util/params.js

// 缓存
const regexpCompileCache: {
  [key: string]: Function,
} = Object.create(null);

// 填充动态路由参数
export function fillParams(
  path: string,
  params: ?Object,
  routeMsg: string
): string {
  params = params || {};
  try {
    // compile主要用来逆解析，https://www.npmjs.com/package/path-to-regexp#compile-reverse-path-to-regexp
    const filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = Regexp.compile(path)); // 修复https://github.com/vuejs/vue-router/issues/2505#issuecomment-442353151 // Fix #2505 resolving asterisk routes { name: 'not-found', params: { pathMatch: '/not-found' }} // and fix #3106 so that you can work with location descriptor object having params.pathMatch equal to empty string
    if (typeof params.pathMatch === 'string') params[0] = params.pathMatch; // 返回逆解析后的路径

    return filler(params, { pretty: true });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // Fix #3072 no warn if `pathMatch` is string
      warn(
        typeof params.pathMatch === 'string',
        `missing param for ${routeMsg}: ${e.message}`
      );
    }
    return '';
  } finally {
    // delete the 0 if it was added
    delete params[0];
  }
}
```

- 可以看到整个逆解析逻辑是借助 `Regexp.compile` 结合 `regexpCompileCache` 实现的
- `Regexp.compile`接收一个动态路由 path，返回一个函数，可用这个函数做逆解析；

Regexp.compile 例子如下

```js
// https://www.npmjs.com/package/path-to-regexp#compile-reverse-path-to-regexp

const toPath = compile('/user/:id');
toPath({ id: 123 }); //=> "/user/123"
```

- 可以看到首先对 `Regexp.compile` 返回的函数做了缓存
- 然后将 `matchRoute` 中添加的`pathMatch`赋值给`params[0]`
- 调用 `Regexp.compile` 返回函数，以 `params` 为入参，逆解析 `url` 并返回
- 删除添加的 `params[0]`

fill-params.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router29.awebp')" alt="vuesourcecode/vue-router/vue-router29.awebp">

### 创建路由对象`_createRoute`

上面无论是 `normalizeLocation`、`matchRoute`、`fillParams` 都是针对传入的地址做一些操作；

而 `match` 方法的作用是找到与地址匹配的路由对象，而这个主要是由`_createRoute` 方法实现

从命名上可以看出，这是个内部方法

```js
//src/create-matcher.js createMatcher方法内

function _createRoute(
  record: ?RouteRecord,
  location: Location,
  redirectedFrom?: Location
): Route {
  // 路由记录被标记为重定向
  if (record && record.redirect) {
    return redirect(record, redirectedFrom || location);
  } // 路由记录被标记为别名路由，见create-route-map.js

  if (record && record.matchAs) {
    return alias(record, location, record.matchAs);
  } // 正常路由记录

  return createRoute(record, location, redirectedFrom, router);
}
```

可以看到它接收三个参数

- `record` 用来生成 `Route 对象`的目标路由记录
- `location` 目标地址
- `redirectedFrom` 重定向的来源地址，这个参数只在发生重定向时才会有值

我们知道，在新增路由记录时，会对不同类型的记录添加上不同的标记字段

- 如为重定向路有记录添加 `redirect` 字段
- 为别名路由添加 `matchAs` 字段

可以看到针对不同的路由记录类型调用了不同方法

- 重定向路由调用 `redirect` 方法
- 别名路由调用 `alias` 方法
- 其余的调用 `createRoute` 方法

活动图如下 create-route-inner.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router30.awebp')" alt="vuesourcecode/vue-router/vue-router30.awebp">

其实 `redirect`、`alias` 方法内部也调用了 `createRoute` 方法

所以我们先看 `createRoute` 方法实现

### createRoute

createRoute 位于 src/util/route.js

```ts
// src/util/route.js

// 生成Route
export function createRoute(
  record: ?RouteRecord,
  location: Location,
  redirectedFrom?: ?Location,
  router?: VueRouter
): Route {
  const stringifyQuery = router && router.options.stringifyQuery; // 支持传入自定义序列化qs方法
  let query: any = location.query || {};

  try {
    query = clone(query); // location.query为引用值，避免相互影响，进行深拷贝
  } catch (e) {} // 生成Route

  const route: Route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery), // 完整path
    matched: record ? formatMatch(record) : [], // 获取所有匹配的路由记录
  }; // 如果是从其它路由对重定向过来的，则需要记录重定向之前的地址

  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery);
  } // 防止篡改

  return Object.freeze(route);
}
```

由于 `VueRouter` 支持传入自定义`序列化 queryString` 方法，所以第一步先获取序列化 `queryString` 的方法  
然后对 `query` 做了一个深拷贝，避免相互影响  
接下来就是生成新 `Route` 对象  
如果是从其他路由重定向过来的，则生成完整的重定向来源地址，并赋值给新生成的 `Route` 对象  
最后调用 `Object.freeze` 冻结新 `Route` 对象，因为 `Route` 对象是 `immutable` 的

整个流程如下 create-route.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router31.awebp')" alt="vuesourcecode/vue-router/vue-router31.awebp">

可以看到生成 `Route` 时，会调用 `getFullPath` 生成完整 `fullPath`

```js
// src/util/route.js

// 获取完整path
function getFullPath({ path, query = {}, hash = '' }, _stringifyQuery): string {
  const stringify = _stringifyQuery || stringifyQuery;
  return (path || '/') + stringify(query) + hash;
}
```

- 可以看到 `getFullPath` 是在 `path` 后面追加了 `qs` 和 `hash`
- 另外生成 `Route` 时，还会调用 `formatMatch` 来获取所有关联的路由记录
- 主要通过向上查找的形式找到所有关联的路由记录

```ts
// src/util/route.js

// 格式化匹配的路由记录，当一个路由记录匹配了，如果其还有父路由记录，则父路由记录肯定也是匹配的
// /foo/bar 匹配了，则其父路由对象 /foo 肯定也匹配了
function formatMatch(record: ?RouteRecord): Array<RouteRecord> {
  const res = [];
  while (record) {
    res.unshift(record); // 队列头添加，所以父record永远在前面，当前record永远在最后；在router-view组件中获取匹配的route record时会用到
    record = record.parent;
  }
  return res;
}
```

难道一条 `Route` 不是对应(关联)一个`路由对象`吗？  
其实在术语表介绍 `Route` 路由对象时，也有所提及，一个`Route 路由对象`可能会关联多个 `RouteRecord 路由记录对象`  
这是因为存在嵌套路由的情况，当子路由记录被匹配到时，其实代表着父路由记录也一定被匹配到了，看下面例子

```ts
// 当有下面的路由规则
routes: [
  {
    path: '/parent',
    component: Parent,
    children: [{ path: 'foo', component: Foo }],
  },
];
```

访问`/parent/foo` 时，匹配到的路由记录有两个  
match-demo-record.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router32.awebp')" alt="vuesourcecode/vue-router/vue-router32.awebp">

而且精准匹配到路由记录一定是最后一个，所以后面会看到用 `route.matched[route.matched.length - 1]`来获取当前 `route` 对应的精准匹配的 `RouteRecord`

看完 createRoute 的实现，我们再来看看 alias 的实现

### 创建别名路由对象 alias

alias 位于 src/create-matcher.js

```ts
// src/create-matcher.js

// 创建别名Route
function alias(
  record: RouteRecord,
  location: Location,
  matchAs: string
): Route {
  // 获取别名的完整路径
  const aliasedPath = fillParams(
    matchAs,
    location.params,
    `aliased route with path "${matchAs}"`
  ); // 获取别名匹配的原始Route

  const aliasedMatch = match({
    _normalized: true,
    path: aliasedPath,
  });
  if (aliasedMatch) {
    const matched = aliasedMatch.matched;
    const aliasedRecord = matched[matched.length - 1]; // 找到所有匹配的路由记录的最后一个，即当前匹配的路由记录，逻辑见route.js formatMatch方法
    location.params = aliasedMatch.params;
    return _createRoute(aliasedRecord, location);
  }

  return _createRoute(null, location);
}
```

逻辑如下

- 先拿 `matchAs` 得到 `aliasedPath`，
- 然后拿 `aliasedPath` 走一遍 `match` 得到 `aliasedMatch` 路由对象
- `aliasedMatch` 如果存在，拿 `aliasedMatch` 精准匹配的路由记录对象和 `location`，生成`路由对象`返回
- 不存在，则创建一个新的`路由对象`返回

可能有点绕，我们举个例

- 前面我们知道，`/a`设置了别名`/b`时，会生成两条路由记录，且`/b`的路由记录上的`matchAs`为`/a`
- 此处传入的 `alias` 的 `matchAs` 就相当于`/a`，先拿 `matchAs` 即`/a` 得到填充过 `params` 的路径
- 再以此路径调用 match 找到匹配的路由对象，记为 `routeA`
- 前面也提过，路由对象会关联路由记录，所以从 routeA 中可以得到精准匹配的路由记录 `routeRecordA`
- 拿此路由记录和`/b` 的 `location` 去生成路由对象并返回
- 这样就实现了官网上说的`/a 的别名是 /b，意味着，当用户访问 /b 时，URL 会保持为 /b，但是路由匹配则为 /a，就像用户访问 /a 一样`。效果

活动图如下 alias.png
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router33.awebp')" alt="vuesourcecode/vue-router/vue-router33.awebp">

我们再来看看 redirect 的实现

### 创建重定向路由对象 redirect

我们先看下 record.redirect 可能的几种情况；
`https://router.vuejs.org/zh/guide/essentials/redirect-and-alias.html#重定向`

- 字符串`{redirect:'/'}`
- 对象`{redirect:{path:'/test'}}`、`{redirect:{name:'Test'}}`
- 也支持传入函数`{redirect:to=>{ return {name:'Test'}}}`

我们先看这个 redirect 方法的入口

```ts
// src/create-matcher.js _createRoute方法内部

if (record && record.redirect) {
  return redirect(record, redirectedFrom || location);
}
```

由于存在多次重定向的场景，所以需要保留首次触发重定向的地址即 `redirectedFrom`

- `/a` -> `/b` -> `/c`，在`/c`中需要保留首次触发重定向的地址即`/a`

多次重定向，如何保留首次触发重定向的地址呢？

- 在第一次重定向时，`redirectedFrom` 没有值
- 在 `redirect` 方法内部会将 `location` 做为 `redirectedFrom` 参数调用 `match` 方法，match 如果发现仍然需要重定向，则会继续调用 `redirect`，此时 `redirectedFrom` 是有值的，就是首次传入的 location，依次循环，这样就完成了初始地址的传递

可以看下下面的例子

```ts
[
  { path: '/foo', component: Foo },
  { path: '/baz', component: Baz, redirect: '/foo' }, // named redirect
  { path: '/named-redirect', redirect: '/baz' },
];

// src/create-matcher.js _createRoute方法内部
if (record && record.redirect) {
  console.count('redirect count:'); // 统计调用次数
  console.log('record:', record, 'redirectedFrom:', redirectedFrom); // 打印重定向初始来源地址
  return redirect(record, redirectedFrom || location);
}
```

当我们访问`/named-redirect` 路由时(触发路由跳转)，会重定向到`/baz`，`/baz` 又会重定向`到/foo`，最终展示 Foo 组件；所以，redirect 方法应该会被调用两次；

我们可以看下上面例子的输出 redirect-demo.png
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router34.awebp')" alt="vuesourcecode/vue-router/vue-router34.awebp">

会发现 `redirect` 方法被调用了四次，前两次是路由跳转导致的 `redirect` 调用，后两次则是组件渲染时，需要解析路由从而触发的 `redirect` 调用；

可以对比下调用栈

- redirect-stack-1.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router35.awebp')" alt="vuesourcecode/vue-router/vue-router35.awebp">
- redirect-stack-2.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router36.awebp')" alt="vuesourcecode/vue-router/vue-router36.awebp">
- 可以看到第一、第二次的 redirect 是由 transitionTo 触发的
- redirect-stack-3.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router37.awebp')" alt="vuesourcecode/vue-router/vue-router37.awebp">
- redirect-stack-4.png
  <img :src="$withBase('/images/vuesourcecode/vue-router/vue-router38.awebp')" alt="vuesourcecode/vue-router/vue-router38.awebp">
- 而第三、第四次都是组件渲染 render 调用 resolve 触发的

可以看到第一次调用`redirect`是从`/named-redirect`重定向到`/baz`，此时`redirectFrom`是没有值的  
而第二次调用是从`/baz`重定向到`/foo`，此时`redirectFrom`就是触发第一次重定向的地址`/named-redirect`  
而且最终的`$route`上也会有个`redirectFrom`保留了触发第一次重定向的地址

上面我们只是看了 redirectFrom 的意义，下面我们看看 redirect 的具体实现

```ts
// src/create-matcher.js createMatcher方法内
// 创建重定向Route
function redirect(
  record: RouteRecord, // 触发重定向的路由记录(需要进行重定向的路由记录，包含redirect)
  location: Location // 触发重定向的初始地址()
): Route {
  const originalRedirect = record.redirect;
  let redirect =
    typeof originalRedirect === 'function' // redirect支持传入函数;https://router.vuejs.org/zh/guide/essentials/redirect-and-alias.html#重定向
      ? originalRedirect(createRoute(record, location, null, router))
      : originalRedirect; // redirect返回的是一个路径path，如'/bar'

  if (typeof redirect === 'string') {
    redirect = { path: redirect };
  } // originalRedirect函数返回一个非string、非object的值时，给予警告，并创建一个空Route

  if (!redirect || typeof redirect !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`);
    }
    return _createRoute(null, location);
  } // 到这一步，redirect一定是个object

  const re: Object = redirect;
  const { name, path } = re;
  let { query, hash, params } = location;

  query = re.hasOwnProperty('query') ? re.query : query;
  hash = re.hasOwnProperty('hash') ? re.hash : hash;
  params = re.hasOwnProperty('params') ? re.params : params; // 重定向是命名路由形式

  if (name) {
    // resolved named direct
    const targetRecord = nameMap[name]; // 未找到命名路由警告

    if (process.env.NODE_ENV !== 'production') {
      assert(targetRecord, `redirect failed: named route "${name}" not found.`);
    }

    return match(
      {
        _normalized: true,
        name,
        query,
        hash,
        params,
      },
      undefined,
      location
    );
  } else if (path) {
    // 重定向是path形式
    // 1. resolve relative redirect，解析出完整路径
    const rawPath = resolveRecordPath(path, record); // 2. resolve params，填充params
    const resolvedPath = fillParams(
      rawPath,
      params,
      `redirect route with path "${rawPath}"`
    ); // 3. rematch with existing query and hash，重新匹配
    return match(
      {
        _normalized: true,
        path: resolvedPath,
        query,
        hash,
      },
      undefined,
      location
    );
  } else {
    if (process.env.NODE_ENV !== 'production') {
      warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`);
    }
    return _createRoute(null, location);
  }
}
```

可以看到首先对 record.redirect 进行规范化，统一生成一个 redirect 对象(重定向目标)

为什么要进行规范化，前面也提过，redirect 支持字符串、对象、函数类型，所以需要规范化，方便后面统一处理

接下来会优先取 redirect 的 query hash params 值来做 match，不存在时才会取初始地址 location 的 query hash params
接下来会判断重定向目标是命名形式还是 path 形式
命名形式

先判断 nameMap 中有没有目标路由记录，没有则中断，并给予提示；
再重走 match 流程，并将 location 做为 redirectedFrom 传入，这样就完成了 redirectedFrom 的传递闭环
match 里面会继续判断是否有重定向，这样就覆盖了多重重定向的场景

path 形式

拿 path 匹配，需要获取完整路径，所以先从 record 拿出原始路径 rawPath 并填充前面解析出的 params 得出完整地址
再拿完整地址重走 match 流程，同时也将 location 做为 redirectedFrom 传入，完成 redirectedFrom 的传递闭环
match 里面会继续判断是否有重定向，这样就覆盖了多重重定向的场景

如果既不是命名形式也不是 path 形式，则直接创建一个新路由对象返回
流程如下

redirect-full.png
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router39.awebp')" alt="vuesourcecode/vue-router/vue-router39.awebp">

### 小结

- 路由匹配的过程，其实就是拿`地址 RawLocation` 生成`路由对象 Route` 的过程，这中间`路由记录 RouteRecord` 起中间桥梁的作用，因为路由记录上保存了生成路由对象的重要信息；所以流程应该是拿地址从路由映射表中找到对应的`路由记录`，然后拿`路由记录`生成`路由对象`
- 上述匹配逻辑主要由 match 函数实现的，关键逻辑包含地址格式化 `normalizeLocation`、地址是否匹配判断 matchRoute、填充参数 fillParams、创建路由对象`_createRoute`
- 在 `normalizeLocation` 时，会对 rawLocation 进行规范化，方便后续处理
- 在 `matchRoute` 时，会借助 `path-to-regexp` 检测地址是否匹配并提取出 params
- `fillParams` 可以看做是提取 params 的逆向操作，主要用来对地址中的动态部分进行填充
- 在`_createRoute` 时，会分别处理别名、重定向、多重重定向等场景
- 经过上述流程，就可以拿到 `RawLocation` 对应的 Route
- 拿到 Route，我们就可以进行导航的解析

## 导航解析(确认)流程

前面提过在 transitionTo 方法中，调用完 match 方法得到目标 Route 后，就会调用 confirmTransition 方法来做导航解析  
我们知道 vue-router 在路由跳转时，会按顺序触发各种钩子、守卫函数，例如 beforeRouteLeave、beforeRouteEnter 等等；  
首先这些钩子、守卫有的是定义在 vue-router 实例上的，有的是路由独享的，有的是位于.vue 组件中的，所以第一步必须抽出这些钩子、守卫函数统一处理  
其次这些钩子、守卫是按顺序依次执行的，所以需要设计一个队列和迭代器来保证顺序执行  
最后还有一些特殊场景需要处理，例如异步路由组件如何保证顺序执行  
上述的相关逻辑封装在 confirmTransition 中  
confirmTransition 方法被定义在 src/base.js 中

```ts
// src/base.js History类中

// 确认路由跳转
confirmTransition (/* to*/route: Route, onComplete: Function, onAbort?: Function) {
  const current = this.current /* from */

  // 取消
  const abort = err => {
    // after merging https://github.com/vuejs/vue-router/pull/2771 we
    // When the user navigates through history through back/forward buttons
    // we do not want to throw the error. We only throw it if directly calling
    // push/replace. That's why it's not included in isError
    if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
      if (this.errorCbs.length) {
        this.errorCbs.forEach(cb => {
          cb(err)
        })
      } else {
        warn(false, 'uncaught error during route navigation:')
        console.error(err)
      }
    }
    onAbort && onAbort(err)
  }

  // 相同Route，报重复错误
  if (
    isSameRoute(route, current) &&
    // in the case the route map has been dynamically appended to
    // 防止route map 被动态改变了
    route.matched.length === current.matched.length
  ) {
    // ensureURL由子类实现，主要根据传参确定是添加还是替换一个记录
    this.ensureURL() // 替换当前历史记录
    return abort(new NavigationDuplicated(route))
  }

  // 对比前后route的RouteRecord，找出需要更新、失活、激活的的路由记录
  const { updated, deactivated, activated } = resolveQueue(
    this.current.matched,
    route.matched
  )

  // 生成需要执行的守卫、钩子队列
  const queue: Array<?NavigationGuard> = [].concat(
    // in-component leave guards
    extractLeaveGuards(deactivated), // 提取路由组件中所有beforeRouteLeave守卫
    // global before hooks
    this.router.beforeHooks, // 全局的beforeEach守卫
    // in-component update hooks
    extractUpdateHooks(updated), // 提取路由组件中所有beforeRouteUpdate守卫
    // in-config enter guards
    activated.map(m => m.beforeEnter), // 路由独享的beforeEnter守卫
    // async components
    resolveAsyncComponents(activated)// 解析异步组件
  )

  this.pending = route // 记录将要跳转的route，方便取消对比用

  // 迭代函数
  const iterator = (hook: NavigationGuard, next) => {
    if (this.pending !== route) { // 当发现to发生变化，则代表需要取消
      return abort()
    }
    try {
      hook(/* to*/route, /* from*/current, /* next*/(to: any) => {
        if (to === false || isError(to)) {
          // next(false) -> abort navigation, ensure current URL
          // next(false) -> 取消跳转，添加一个新历史记录(但由于url地址未发生变化，所以并未添加记录)
          this.ensureURL(true)
          abort(to)
        } else if (
          typeof to === 'string' || // next('/')
          (typeof to === 'object' &&
            (typeof to.path === 'string' || typeof to.name === 'string')) // next({path:'/'})或next({name:'Home'})
        ) {
          // next('/') or next({ path: '/' }) -> redirect
          abort() // 取消当前
          if (typeof to === 'object' && to.replace) {
            // 调用子类方法的替换记录
            this.replace(to)
          } else {
            // 调用子类方法的添加记录
            this.push(to)
          }
        } else {
          // confirm transition and pass on the value
          // next()
          next(to)
        }
      })
    } catch (e) {
      abort(e)
    }
  }

  // 执行队列
  runQueue(queue, iterator, /* 执行结束回调*/() => {
    const postEnterCbs = [] // 保存beforeRouteEnter中传给next的回调函数
    const isValid = () => this.current === route // 表示跳转结束

    // wait until async components are resolved before
    // extracting in-component enter guards
    const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid) // 等待异步组件解析完，再抽取组件内的beforeRouteEnter守卫
    const queue = enterGuards.concat(this.router.resolveHooks)// beforeResolve hooks
    runQueue(queue, iterator, /* 执行结束回调*/() => {
      if (this.pending !== route) {
        return abort()
      }

      this.pending = null

      onComplete(route) // 执行onComplete回调，onComplete中会调用updateRoute方法，内部会触发afterEach钩子

      if (this.router.app) {
        this.router.app.$nextTick(() => {
          // 调用 beforeRouteEnter 守卫中传给 next 的回调函数
          // next(vm=>xxx)
          postEnterCbs.forEach(cb => {
            cb()
          })
        })
      }
    })
  })
}
```

我们可以先看下方法签名

- `route` 目标路由对象，需要解析的目标，可以理解为路由跳转时的 to 对象，而 current 则可以理解为 from 对象。
- `onComplete` 跳转完成的回调
- `onAbort` 取消、错误的回调

看下主要逻辑

- 首先处理了重复跳转的问题
- 然后通过对比找出需要更新、失活、激活的路由记录
- 从上述三种路由记录中抽取出对应钩子、守卫函数
- 将钩子及守卫函数放入队列中并执行

### 判断重复跳转

在判断重复跳转前定义了 `abort` 方法，它主要对 `onAbort` 方法做了一层包装；这个方法在导航发生取消时会被调用到

它接收一个 `err` 参数，如果有注册错误回调并且 err 为非 `NavigationDuplicated` 错误则遍历 errorCbs 列表执行其中的错误回调  
最后调用 `onAbort` 回调并传入 err 参数交给外部处理

接下来判断了是否重复跳转，主要利用 `isSameRoute` 检测了当前路由对象和目标路由对象是否相同，若相同且二者匹配到路由记录数量相同，则视为重复跳转，此时调用 abort 方法并传入 `NavigationDuplicated` 错误并终止流程  
`isSameRoute` 主要判断了 `path、name、hash、query、params` 等关键信息是否相同，若相同则视为相同路由对象

```ts
// src/util/route.js

// 是否相同route
export function isSameRoute(a: Route, b: ?Route): boolean {
  if (b === START) {
    return a === b;
  } else if (!b) {
    return false;
  } else if (a.path && b.path) {
    // path都存在，比较path、hash、query是否相同
    return (
      a.path.replace(trailingSlashRE, '') ===
        b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    );
  } else if (a.name && b.name) {
    // name都存在，比较name、hash、query、params是否相同
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    );
  } else {
    return false;
  }
}
```

注意，在确定是重复跳转后，仍然会调用子类的 ensureURL 方法来更新 url

### 对比找出需要更新、失活、激活的路由记录

判断完重复跳转后，就需要对比 `from`、`to` 路由对象，找出哪些路由记录需要更新，哪些失活、哪些需要激活，用来后续抽取钩子、守卫函数

```ts
// src/history/base.js confirmTransition方法中
// 对比前后route的RouteRecord，找出需要更新、失活、激活的的路由记录
const { updated, deactivated, activated } = resolveQueue(
  this.current.matched,
  route.matched
);
```

- 可以看到逻辑封装在了 `resolveQueue` 方法中，传入了当前和目标路由对象的记录列表，从返回值中解构出了 `updated`, `deactivated`, `activated`
- 看下 `resolveQueue` 实现

```ts
// 对比curren、next的路由记录列表，找出需要更新、失活、激活的路由记录
function resolveQueue(
  current: Array<RouteRecord>,
  next: Array<RouteRecord>
): {
  updated: Array<RouteRecord>;
  activated: Array<RouteRecord>;
  deactivated: Array<RouteRecord>;
} {
  let i;
  const max = Math.max(current.length, next.length); // 找到首个不相等的路由记录索引
  for (i = 0; i < max; i++) {
    if (current[i] !== next[i]) {
      break;
    }
  } // eg // current:[1,2,3] // next:[1,2,3,4,5] // i为3 // 需要更新的为[1,2,3] // 需要激活的为[4,5] // 需要失活的为[]

  return {
    updated: next.slice(0, i), // 索引左侧是需要更新的
    activated: next.slice(i), // 索引右侧是需要激活的
    deactivated: current.slice(i), // 当前索引右侧是需要失活的
  };
}
```

逻辑很简单

- 首先找出 `current` 和 `next` 列表长度的最大值，
- 然后以此为循环最大次数循环找出首个不相等的路由记录索引
- 以此索引为分界线，`next 列表`当前索引左侧为需要更新的路由记录、索引及索引右侧的为需要激活的路由记录
- `current` 列表索引及右侧是需要失活的路由记录

举例

- current 为:[1,2,3]、next 为[1,2,3,4,5]，当前路由对象包含 1、2、3 三个路由记录，目标路由对象包含 1、2、3、4、5 五个路由记录
- 计算后 max 为 5
- 循环，发现首个不相等的索引为 3
- 所以需要更新的为 next.slice(0,3)即 1、2、3
- 需要激活的为 next.slice(3)即 4、5
- 需要失活的为 current.slice(3)，没有需要失活的
- 找出了需要更新、激活、失活的路由记录，我们就可以从中抽取出对应的钩子、守卫函数

### 抽取钩子、守卫函数、解析异步组件

抽取钩子、守卫函数、解析异步组件

- `router.beforeEach`全局前置守卫
- `router.beforeResolve`全局解析守卫(v2.5.0 新增)
- `router.afterEach`全局后置钩子
- `RouteConfig.beforeEnter`路由独享的守卫
- `vm.beforeRouteEntervue` 组件内路由进入守卫
- `vm.beforeRouteUpdatevue` 组件内路由更新守卫(v2.2 新增)
- `vm.beforeRouteLeavevue` 组件内路由离开守卫

可以看到有些是定义 `VueRouter` 实例上的，有些是定义在配置规则 `RouteConfig` 上的，有些是定义在 `RouteComponent` 路由组件上的

- 前两者的钩子、守卫是很容易获取到的，因为我们在 `History` 类中持有了 `VueRouter` 实例，很容易访问到这些守卫、钩子并且几乎不需要做额外处理就可以直接执行；
- 唯一不好处理的是定义在 `RouteComponent 路由组件`中的守卫函数，需要借助 `RouteRecord` 拿到所有 `RouteComponent` 路由组件并从中抽取出对应守卫，最后还要为其绑定上下文，保证执行结果正确；

上节，我们已经拿到需要更新、激活、失活的 RouteRecord 路由记录，我们看下分别要从中抽取出哪些守卫

- `deactivated` 中抽取 `beforeRouteLeave`
- `updated` 中抽取 `beforeRouteUpdate`
- `activated` 中抽取 `beforeRouteEnter`，这里存在一个特殊场景，就是异步路由组件，需要等待异步路由组件解析完成后，才能抽取 `beforeRouteEnter` 守卫，这个后面会讲

我们先看下抽取的入口代码

```ts
// src/history/base.js confirmTransition方法内
// 生成需要执行的守卫、钩子队列
const queue: Array<?NavigationGuard> = [].concat(
  // in-component leave guards
  extractLeaveGuards(deactivated), // 提取路由组件中所有beforeRouteLeave守卫 // global before hooks
  this.router.beforeHooks, // 全局的beforeEach守卫 // in-component update hooks
  extractUpdateHooks(updated), // 提取路由组件中所有beforeRouteUpdate守卫 // in-config enter guards
  activated.map((m) => m.beforeEnter), // 路由独享的beforeEnter守卫 // async components
  resolveAsyncComponents(activated) // 解析异步组件
);
```

可以看到定义了一个队列 queue  
依次做了下面的事

- 抽取了 deactivated 中的 beforeRouteLeave 守卫
- 获取了 VueRouter 实例上定义的 beforeEach 守卫
  beforeEach 守卫是直接定义在 VueRouter 实例上的
- 从 updated 中抽取了 beforeRouteUpdate 守卫
- 从 activated 中获取了路由独享的 beforeEnter 守卫
  beforeEnter 守卫最初是定义在 RouteConfig 上的，后面又传递给路由记录，所以在路由记录上能直接获取到
- 解析 activated 中的异步路由组件
  路由组件支持 import()动态导入，所以这里要处理

我们先看方法名很类似的 extractLeaveGuards 和 extractUpdateHooks

### extractLeaveGuards、extractUpdateHooks

二者都位于 src/base.js

```ts
// src/base.js

// 传入路由记录列表，提取出beforeRouteLeave守卫并逆序输出
function extractLeaveGuards(deactivated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true);
}
// 传入路由记录列表，提取出beforeRouteUpdate钩子
function extractUpdateHooks(updated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard);
}
```

可以看到二者内部都调用了 `extractGuards`，前者多传了一个参数 `true`

我们再看下 `extractGuards`

```ts
// src/base.js

// 提取守卫
function extractGuards(
  records: Array<RouteRecord>,
  name: string, // 要提取的守卫名
  bind: Function, // 绑定守卫上下文函数
  reverse?: boolean // 是否需要逆序
): Array<?Function> {
  const guards = flatMapComponents(records, (
    def /*路由组件定义*/,
    instance /*router-view实例*/,
    match /*路由记录*/,
    key /*视图名*/
  ) => {
    const guard = extractGuard(def, name); // 提取出路由组件中的守卫函数 // 为守卫绑定上下文
    if (guard) {
      return Array.isArray(guard)
        ? guard.map((guard) => bind(guard, instance, match, key))
        : bind(guard, instance, match, key);
    }
  }); // 扁平化 + 逆序
  return flatten(reverse ? guards.reverse() : guards);
}
```

看下方法签名

- 接收一个路由记录数组 `records`
  - 即 `extractLeaveGuards` 中传入的 `deactivated` `路由记录数组；extractUpdateHooks` 中传入的 `updated` 路由记录数组
- 接收一个需要提取的守卫名 `name`
  - `beforeRouteLeave` 和 `beforeRouteUpdate` 字符串
- 一个绑定守卫上下的函数 `bind`
  - `extractLeaveGuards、extractUpdateHooks` 传递的都是 `bindGuard` 方法，这个方法我们在下面解析
- 以及一个是否需要逆序输出的 `reverse` 布尔值；可选参数；
  - `extractLeaveGuards` 传递的是 `true`，代表返回的数组(守卫函数数组)需要逆序输出；
- 返回一个 item 是 Function 的数组

看下内部逻辑

- 调用 `flatMapComponents` 传入 `records` 和一个接收 `def, instance, match, key` 参数的箭头函数，返回一个 `guards` 守卫数组
- 然后根据 `reverse` 来决定是否对 `guards` 数组做逆序处理
  - 为何需要逆序?
  - 在 `createRoute` 章节也提过，在保存路由记录时是逆序的，精准匹配的路由记录在数组最后(length - 1 位置)，父记录在前
  - 部分守卫函数需要逆序逆序执行，例如 `beforeRouteLeave`，它需要先在精准匹配的路由组件上调用，再在父组件上调用
- 最后调用 `flatten` 将 `guards` 扁平化

先看下 flatMapComponents 实现

```ts
// src/util/resolve-components.js

// 扁平化路由记录中的路由组件
export function flatMapComponents(
  matched: Array<RouteRecord>, // 路由记录数组
  fn: Function // 回调函数
): Array<?Function> {
  return flatten(
    matched.map((m) => {
      return Object.keys(m.components).map((key) =>
        fn(
          m.components[key], // 命名视图对应的路由组件定义；一般对应fn的入参def
          m.instances[key], // router-view实例；一般对应fn的入参_或instance
          m, // 匹配的路由记录；一般对应fn的入参match
          key // 命名视图的key；一般对应fn的入参key
        )
      );
    })
  );
}
```

可以看到其接收一个路由记录数组 `matched` 和一个函数 `fn`，返回一个经过 `flatten` 处理的数组

- `matched` 就是我们传入的 `records`
- `fn` 就是接收 `def, instance, match, key` 参数的箭头函数

这个方法主要是遍历路由记录中的每个路由组件并用其做入参依次调用外部函数 fn，返回结果由 fn 函数决定，最后将结果数组扁平化输出

- 在解析异步组件时也会用到此方法

其会对传入的 `records` 调用 `map` 方法，并遍历每个 `record` 上定义的 `components` 字段，并对 `components` 再次进行 `map` 遍历，然后调用传入的 `fn，map` 结果就是 `fn` 返回的结果

`components` 字段是定义命名视图用的，长下面这样，`key` 为视图名，`value` 为对应路由组件

```ts
components: {
    default: Foo,
    a: Bar,
    b: Baz
}
```

所以传入的 fn，即接收 `def, instance, match, key` 参数的箭头函数的四个参数分别为

- `def` 对应 `m.components[key]`即路由组件定义(Foo、Bar、Baz)
- `instance` 对应 `m.instances[key]`是 router-view 组件实例，关于路由记录和 route-view 是如何关联的，会在介绍 view 组件时解析
- m 对应的就是当前遍历到的路由记录
- key 是当前遍历到的视图名

大体逻辑如下 flat-map-components.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router40.awebp')" alt="vuesourcecode/vue-router/vue-router40.awebp">

我们看下箭头函数内部的逻辑

```ts
const guards = flatMapComponents(records, (
  def /*路由组件定义*/,
  instance /*router-view实例*/,
  match /*路由记录*/,
  key /*视图名*/
) => {
  const guard = extractGuard(def, name); // 提取出路由组件中的守卫函数 // 为守卫绑定上下文
  if (guard) {
    return Array.isArray(guard)
      ? guard.map((guard) => bind(guard, instance, match, key))
      : bind(guard, instance, match, key);
  }
});
```

首先调用 `extractGuard` 从路由组件定义中直接抽取出对应 `name` 的守卫函数  
接下来调用传入 `extractGuards` 的 bind 方法为守卫绑定上下文

我们看下 extractGuard 实现

```ts
// src/base.js

// 提取单个守卫
function extractGuard(
  def: Object | Function,
  key: string
): NavigationGuard | Array<NavigationGuard> {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    def = _Vue.extend(def);
  }
  return def.options[key];
}
```

主要有两个逻辑

- 调用 extend 以应用全局 mixins
- 返回对应守卫函数

提取完单个守卫后，就需要调用传入的 bind 方法对其绑定上下文；  
`bind` 方法其实是 `bindGuard`

```ts
// src/history/base.js

// 将守卫的上下文绑定到vue实例(路由组件)
function bindGuard(guard: NavigationGuard, instance: ?_Vue): ?NavigationGuard {
  if (instance) {
    return function /*已经绑定过上下文的守卫函数*/ boundRouteGuard() {
      return guard.apply(instance, arguments);
    };
  }
}
```

经过上面的上下文绑定，从路由组件中抽取出的守卫函数就又回来到路由组件上下文中执行了，这样就保证了守卫函数无论在何处被调用，都能返回正确的结果

extractGuards 主要完成了从路由组件中抽取守卫函数并为其绑定上下文的工作

extract-guards.png  
<img :src="$withBase('/images/vuesourcecode/vue-router/vue-router41.awebp')" alt="vuesourcecode/vue-router/vue-router41.awebp">

接下来我们要对激活的路由记录进行异步组件的解析  
主要通过 `resolveAsyncComponents` 方法实现的

### resolveAsyncComponents

在看如何解析异步组件前，我们先看下 vue 中的异步组件长什么样？

```ts
// https://cn.vuejs.org/v2/guide/components-dynamic-async.html#异步组件

// 接收resolve,reject
Vue.component('async-example', function (resolve, reject) {
  setTimeout(function () {
    // 向 `resolve` 回调传递组件定义
    resolve({
      template: '<div>I am async!</div>',
    });
  }, 1000);
});

// 结合require使用
Vue.component('async-webpack-example', function (resolve) {
  // 这个特殊的 `require` 语法将会告诉 webpack
  // 自动将你的构建代码切割成多个包，这些包
  // 会通过 Ajax 请求加载
  require(['./my-async-component'], resolve);
});

// 结合import()使用
Vue.component(
  'async-webpack-example', // 这个动态导入会返回一个 `Promise` 对象。
  () => import('./my-async-component')
);

// 局部注册
new Vue({
  // ...
  components: {
    'my-component': () => import('./my-async-component'),
  },
});

// 带有加载状态
const AsyncComponent = () => ({
  // 需要加载的组件 (应该是一个 `Promise` 对象)
  component: import('./MyComponent.vue'), // 异步组件加载时使用的组件
  loading: LoadingComponent, // 加载失败时使用的组件
  error: ErrorComponent, // 展示加载时组件的延时时间。默认值是 200 (毫秒)
  delay: 200, // 如果提供了超时时间且组件加载也超时了， // 则使用加载失败时使用的组件。默认值是：`Infinity`
  timeout: 3000,
});
```

文档对异步组件的描述`是Vue 允许你以一个工厂函数的方式定义你的组件，这个工厂函数会异步解析你的组件定义`  
可以理解为：异步组件是一个工厂函数，函数内`resolve、reject`组件的定义、返回一个`Promise`、返回一个带有特定标识字段的对象  
解析路由记录中的异步组件代码位于`src/util/resolve-components.js`

```ts
// src/util/resolve-components.js

// 解析异步组件，返回一个接收to, from, next参数的函数
export function resolveAsyncComponents(matched: Array<RouteRecord>): Function {
  return (to, from, next) => {
    let hasAsync = false;
    let pending = 0;
    let error = null;
    flatMapComponents(matched, (
      /*路由组件定义*/ def,
      /*router-view实例*/ _,
      /*路由记录*/ match,
      /*视图名*/ key
    ) => {
      // if it's a function and doesn't have cid attached,
      // assume it's an async component resolve function.
      // we are not using Vue's default async resolving mechanism because
      // we want to halt the navigation until the incoming component has been
      // resolved.
      // def.cid为实例构造函数标识；https://github.com/vuejs/vue/search?q=cid&unscoped_q=cid
      // 组件的定义是函数且组件cid还未设置，则认为其是一个异步组件
      if (typeof def === 'function' && def.cid === undefined) {
        hasAsync = true;
        pending++; // 解析

        const resolve = once((resolvedDef) => {
          // 加载后的组件定义是一个esm
          if (isESModule(resolvedDef)) {
            resolvedDef = resolvedDef.default;
          } // save resolved on async factory in case it's used elsewhere // 保留异步组件工厂函数，方便后续使用
          def.resolved =
            typeof resolvedDef === 'function'
              ? resolvedDef
              : _Vue.extend(resolvedDef);
          match.components[key] = resolvedDef; // 替换路由记录的命名视图中的组件
          pending--;
          if (pending <= 0) {
            // 所有异步组件加载完
            next();
          }
        }); // 报错
        const reject = once((reason) => {
          const msg = `Failed to resolve async component ${key}: ${reason}`;
          process.env.NODE_ENV !== 'production' && warn(false, msg);
          if (!error) {
            error = isError(reason) ? reason : new Error(msg);
            next(error);
          }
        }); // 异步组件，https://cn.vuejs.org/v2/guide/components-dynamic-async.html#异步组件

        let res;
        try {
          res = def(resolve, reject); // 返回promise
        } catch (e) {
          reject(e);
        }
        if (res) {
          if (typeof res.then === 'function') {
            res.then(resolve, reject);
          } else {
            // new syntax in Vue 2.3
            // 处理加载状态，返回一个包对象；https://cn.vuejs.org/v2/guide/components-dynamic-async.html#处理加载状态
            const comp = res.component; // 是通过import()加载，返回的是一个promise
            if (comp && typeof comp.then === 'function') {
              comp.then(resolve, reject);
            }
          }
        }
      }
    }); // 没有异步组件，直接next

    if (!hasAsync) next();
  };
}
```

可以看到其接收一个路由记录数组 matched，返回一个接收 from、to、next 的函数，内部是异步组件的解析逻辑  
`resolveAsyncComponents` 被调用时并不会执行解析异步组件的逻辑，因为其只会返回一个函数，返回的函数会在运行队列时才会被调用，这时才会解析异步组件  
队列的运行，我们后面再看，我们先看下返回的函数内部是什么逻辑

- 定义了一个是否有异步组件的标识字段 `hasAsync`、以及当前待解析的异步组件数量 `pending`
- 然后调用了 `flatMapComponents` 拿到 `records` 中的所有路由组件，并依次调用传入的回调方法
- 回调方法会接收到被遍历的路由组件，此时需要判断这个路由组件是否是异步组件，如果是，则开始异步组件的解析，否则跳过
- 如果遍历结束发现 `hasAsync` 仍然为 `false`，代表没有异步组件直接 `next()`进行下一步即可

如何确定某个组件是否是异步组件呢？

- 前面我们说过，在 vue 中异步组件一定是个工厂函数，内部会调用 resove、reject 或返回 Promise 或返回特定格式对象，总之他肯定是个函数
- 其次 vue 中每个实例都会有个唯一标识 cid，如果有 cid 就代表已经生成相应实例，所以异步组件的 cid 一定为 undefined
- 所以判断是否是异步组件的依据就是 `函数 && cid === 'undefined'`

如果判断是异步组件，则将 `hasAsync` 置为 `true` 并让 `pending` 自增，代表有发现异步组件，在解析完组件后 `pending` 自减，当 `pending<=0` 则代表异步组件解析结束，可以调用 next 进行下一步  
前面提过，vue 的异步组件工厂函数会接收 `resolve、reject` 两个方法并在从服务器得到组件定义后被调用；
在接收到服务器返回异步组件的定义时，这两个方法会被传入异步组件工厂函数  
由于异步组件工厂函数会返回一个 `Promise` 函数或特定格式的对象，所以会有下面情况

- 如果是返回 Promise，则将这两方法再传入返回的 `Promise.then` 中
- 如果返回特定格式对象，则找到 `component` 字段，并将这两方法再传入 `component.then` 中

由于 resolve、reject 已经被 once 包装，即使传入多次，也只会被执行一次  
我们看下 resolve、reject 方法  
他们都被一个 once 方法包裹以保证只会被执行一次

reject

- 直接抛出一个错误并调用 next 传递到下一流程
  resolve
- 先判断下是否是 esm，若是，则取其.default 字段来获取组件定义
- 拿到组件定义后，会先保留异步组件工厂函数，方便后续使用
- 然后替换路由记录的命名视图中的对应组件，这就完成了组件的解析并绑定到路由记录上

再次重申上面提到的逻辑都是 resolveAsyncComponents 返回的函数逻辑，这个函数逻辑会等到队列被执行时才实际调用  
至此，我们的队列 queue 已经包含了抽取出来的守卫、钩子、包含解析异步组件逻辑的函数  
队列已经构建完成，下面我们来看看它是如何执行的

### 守卫队列的执行

队列的执行是通过 runQueue、iterator 相互配合来实现的

### runQueue

runQueue 方法位于 src/util/async.js

```ts
// src/util/async.js

/* @flow */
// 队列执行函数
// queue 需要执行的队列
// fn 迭代函数
// cb 回调函数
export function runQueue(
  queue: Array<?NavigationGuard>,
  fn: Function,
  cb: Function
) {
  const step = (index) => {
    // 全部执行完，执行回调
    if (index >= queue.length) {
      cb();
    } else {
      // 存在，执行迭代函数
      if (queue[index]) {
        fn(
          queue[index],
          /* next*/ () => {
            step(index + 1);
          }
        );
      } else {
        // 否则，跳到下个执行
        step(index + 1);
      }
    }
  };
  step(0);
}
```

可以看到它接收一个队列 queue、一个迭代函数 fn、一个执行完毕的回调函数 cb  
内部是一个递归的实现  
定义了一个 step 函数并接收 一个标识队列执行步骤的 index  
必须通过手动调用 step 才能跳到下一个队列项的执行

在解析组件时会用到

当 index 大于等于队列的长度时(递归的结束条件)，代表队列项全执行完毕，可以调用 cb  
否则，若还有队列项，则继续调用迭代函数 fn 并传入队列项和跳转下个队列项的 step(index + 1)函数  
若无队列项了，则直接跳到下个队列项的执行  
递归通过 step(0)来激活

### iterator

迭代器相关代码好下

```ts
// src/history/base.js

// 迭代函数
const iterator = (hook: NavigationGuard, next) => {
  if (this.pending !== route) {
    // 当发现to发生变化，则代表需要取消
    return abort();
  }
  try {
    hook(
      /* to*/ route,
      /* from*/ current,
      /* next*/ (to: any) => {
        if (to === false || isError(to)) {
          // next(false) -> abort navigation, ensure current URL
          // next(false) -> 取消跳转，添加一个新历史记录(但由于url地址未发生变化，所以并未添加记录)
          this.ensureURL(true);
          abort(to);
        } else if (
          typeof to === 'string' || // next('/')
          (typeof to === 'object' &&
            (typeof to.path === 'string' || typeof to.name === 'string'))
        ) {
          // next({path:'/'})或next({name:'Home'})
          // next('/') or next({ path: '/' }) -> redirect
          abort(); // 取消当前
          if (typeof to === 'object' && to.replace) {
            // 调用子类方法的替换记录
            this.replace(to);
          } else {
            // 调用子类方法的添加记录
            this.push(to);
          }
        } else {
          // confirm transition and pass on the value
          // next()
          next(to);
        }
      }
    );
  } catch (e) {
    abort(e);
  }
};
```

可以看到其接收一个 hook 也就是守卫队列中的守卫、钩子函数和 next 函数(runQueue 传递过来的 step 函数)  
当在执行的过程中，路由发生变化，会立即取消  
然后尝试调用 hook，并传入目标路由对象、当前路由对象、以及一个接收 to 的箭头函数  
其实这三个参数就对应守卫会接收到的 from、to、next 三个参数

```ts
router.beforeEach((to, from, next) => {
  // ...
});
```

我们知道守卫的 next 是一个 function，并能接收下面几种参数以满足不同的路由跳转需求

- `next()`: 进行管道中的下一个钩子。
- `next(false)`: 中断当前的导航。
- `next('/')`  或者  `next({ path: '/' })`: 跳转到一个不同的地址。当前的导航被中断，然后进行一个新的导航。你可以向  next  传递任意位置对象，且允许设置诸如  replace: true、name: 'home'  之类的选项以及任何用在  router-link  的  to prop  或  router.push  中的选项。
- `next(error)`: (2.4.0+) 如果传入  next  的参数是一个  Error  实例，则导航会被终止且该错误会被传递给  router.onError()  注册过的回调。

上面接收 to 的箭头函数就处理了上述几种场景  
队列中的每一项都会在 iterator 中被调用一次并通过 next()到跳转到下一个队列项的执行  
了解了 runQueue、iterator 后，我们再来看看队列实际执行的代码是什么样的

### 队列执行

队列执行的完整代码如下

```ts
// src/history/base.js

// 执行队列
runQueue(
  queue,
  iterator,
  /* 执行结束回调*/ () => {
    const postEnterCbs = []; // 保存beforeRouteEnter中传给next的回调函数
    const isValid = () => this.current === route; // 表示跳转结束 // wait until async components are resolved before // extracting in-component enter guards
    const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid); // 等待异步组件解析完，再抽取组件内的beforeRouteEnter守卫
    const queue = enterGuards.concat(this.router.resolveHooks); // beforeResolve hooks
    runQueue(
      queue,
      iterator,
      /* 执行结束回调*/ () => {
        if (this.pending !== route) {
          return abort();
        }
        this.pending = null;
        onComplete(route); // 执行onComplete回调，onComplete中会调用updateRoute方法，内部会触发afterEach钩子
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            // 调用 beforeRouteEnter 守卫中传给 next 的回调函数
            // next(vm=>xxx)
            postEnterCbs.forEach((cb) => {
              cb();
            });
          });
        }
      }
    );
  }
);
```

可以看到，传入了队列 `queue`、迭代器 `iterator` 以及一个全部执行结束的回调函数  
先回顾下 `queue` 队列中有哪些元素

- beforeRouteLeave 守卫
- 全局的 beforeEach 守卫
- beforeRouteUpdate 守卫
- beforeEnter 守卫
- 以及一个高阶函数，执行后会返回解析异步组件的函数

队列中的函数会在队列执行时依次在 iterator 中被调用  
前面几个都是已经提取出来的守卫函数，可以同步执行  
但是最后一个高阶函数执行后，会返回一个解析异步组件的函数  
其借助闭包的特性，能访问从 iterator 中传入的 from、to、next  
然后在解析完异步组件后调用 next，进入队列下一项的执行  
这样就能保证，即使队列中有异步函数，也能顺序地将队列执行完  
在整个守卫队列执行完后，就会执行结束回调  
执行结束回调时，此时异步组件已经全部解析完毕，就可以抽取 beforeRouteEnter 了

### 抽取 beforeRouteEnter

抽取 `beforeRouteEnter` 和其它守卫稍微有点不同

1. 因为 `beforeRouteEnter` 所在的组件可能是异步的，所以 `beforeRouteEnter` 必须等到异步组件解析完毕才能开始抽取
2. 还有一个不同，就是在路由过渡动画为 `out-in` 时，异步组件可能已经解析完毕了，但是 router-view 实例可能还未注册，此时是不能调用 beforeRouteEnter 的；具体见[issue #750](https%3A%2F%2Fgithub.com%2Fvuejs%2Fvue-router%2Fissues%2F750)

因为 `beforeRouteEnter` 支持传一个回调给 `next` 来访问组件实例，就像下面这样

```ts
beforeRouteEnter (to, from, next) {
  next(/*postEnterCb*/vm => {
    // 通过 `vm` 访问组件实例
  })}
```

而这个 vm 是保存在 router-view 实例上的，所以需要等到 router-view 实例存在时，才能调用回调  
我们看下代码实现

```ts
//src/history/base.js

...
const postEnterCbs = [] // 保存beforeRouteEnter中传给next的回调函数
const isValid = () => this.current === route // 表示跳转结束
// wait until async components are resolved before
// extracting in-component enter guards
const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid) // 等待异步组件解析完，再抽取组件内的beforeRouteEnter守卫
...


// 提取组件的beforeRouteEnter守卫
function extractEnterGuards (
  activated: Array<RouteRecord>,
  cbs: Array<Function>, // postEnterCbs
  isValid: () => boolean
): Array<?Function> {
  return extractGuards(
    activated,
    'beforeRouteEnter',
    (guard, _, match, key) => { /* 绑定beforeRouteEnter的执行上下文 */
      return bindEnterGuard(guard, match, key, cbs, isValid)
    }
  )
}

// 绑定beforeRouteEnter的执行上下文
function bindEnterGuard (
  guard: NavigationGuard,
  match: RouteRecord,
  key: string,
  cbs: Array<Function>, // postEnterCbs
  isValid: () => boolean
): NavigationGuard {
  // 对组件内的beforeRouteEnter进行了包装
  return function routeEnterGuard (to, from, next) {
    // 调用组件内beforeRouteEnter守卫
    return guard(to, from, /* beforeRouteEnter next函数；cb为next中回调*/cb => {
      if (typeof cb === 'function') {
        cbs.push(() => {
          // #750
          // if a router-view is wrapped with an out-in transition,
          // the instance may not have been registered at this time.
          // we will need to poll for registration until current route
          // is no longer valid.
          // 如果router-view被out-in transition包裹
          // 在确认路由，准备调用beforeRouteEnter守卫时，router-view实例可能还不存在
          // 但是此时this.current已经为to
          // 所以必须轮询调用cb直到instance存在
          poll(cb, match.instances, key, isValid)
        })
      }
      // 迭代器下步
      next(cb)
    })
  }
}

// 轮询调用cb
function poll (
  cb: any, /* cb为beforeRouteEnter next中回调*/ // somehow flow cannot infer this is a function
  instances: Object,
  key: string,
  isValid: () => boolean
) {
  if (
    instances[key] &&
    !instances[key]._isBeingDestroyed // do not reuse being destroyed instance
  ) {
    cb(instances[key])
  } else if (isValid()) {
    setTimeout(() => {
      poll(cb, instances, key, isValid)
    }, 16)
  }
}
```

可以看到在调用 `extractEnterGuards` 前 在外层声明了一个 `postEnterCbs` 数组

用来保存 `beforeRouteEnter` 中传给 `next` 的回调函数，我们称为 `postEnterCb`，也就是进入后的回调

以及一个判断跳转是否结束的 `isValid` 函数  
`isValid` 函数会被传入 `extractEnterGuards` 中  
`extractEnterGuards` 中通过高阶函数形式返回一个包装了 `beforeRouteEnter` 的具名函数 `routeEnterGuard`，其会在执行队列时被调用，并执行真正的 `beforeRouteEnter` 守卫 guard  
`guard` 在被执行时，会接收 `from、to` 以及一个被'改造'过的`next`，其接收一个 `postEnterCb`  
这个 `postEnterCb` 可能在将来需要访问 `vm`
所以将 `postEnterCb` 用 `poll` 方法包裹塞入在外面定义好的 `postEnterCbs` 数组中  
poll 方法主要是用来解决前面提到的 issue #750 的，它会一直轮询，直到 router-view 实例存在时，再调用 postEnterCb 并传入挂载到 router-view 上的组件实例  
这样就实现了 next 中能访问到组件实例的逻辑  
抽取完 beforeRouteEnter 守卫和其中的 postEnterCbs 后，又在 queue 后拼接了 beforeResolve 守卫

```ts
const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid); // 等待异步组件解析完，再抽取组件内的beforeRouteEnter守卫
const queue = enterGuards.concat(this.router.resolveHooks); // beforeResolve hooks
```

此时 `queue` 中是 `routeEnterGuard` 函数及 `resolveHook`  
然后执行此队列，队列中的 `routerEnterGuard` 和 `resolveHook` 会执行

```ts
runQueue(
  queue,
  iterator,
  /* 执行结束回调*/ () => {
    if (this.pending !== route) {
      return abort();
    }
    this.pending = null;
    onComplete(route); // 执行onComplete回调，onComplete中会调用updateRoute方法，内部会触发afterEach钩子
    if (this.router.app) {
      this.router.app.$nextTick(() => {
        // 调用 beforeRouteEnter 守卫中传给 next 的回调函数
        // next(vm=>xxx)
        postEnterCbs.forEach((cb) => {
          cb();
        });
      });
    }
  }
);
```

执行的逻辑和之前类似，beforeRouteEnter 和 beforeResolve 会被依次调用，然后执行队列结束回调  
队列结束回调中会调用 onComplete 并传入目标 Route 并在\$nextTick 中遍历之前保存的 postEnterCbs，即传入 next 的回调  
此处的 onComplete 是确认路由时(confirmTransition)传入的

```ts
// src/history/base.js transitionTo方法中

   this.confirmTransition(
      route,
      () => { // onComplete，完成
        this.updateRoute(route) // 更新route，会触发afterEach钩子
        onComplete && onComplete(route) // 调用onComplete回调
        this.ensureURL()

        // fire ready cbs once
        // 触发ready回调
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },
      // onAbort回调
      err=>{...}
    )
```

可以看到其调用 `updateRoute` 来更新 route，这会触发 `afterEach` 钩子  
调用 ensureURL 更新 url  
并调用传入 `transitionTo` 的 `onComplete` 函数，主要用来在 vue-router 初始化时为 `hash` 模式做初始化绑定(`setupHashListener`)  
最后触发通过 `onReady` 注册的 `readyCbs` 回调

```ts
// src/history/base.js

  // 更新路由，触发afterEach钩子
  updateRoute (route: Route) {
    const prev = this.current
    this.current = route// 更新current
    this.cb && this.cb(route) // 调用updateRoute回调，回调中会重新为_routerRoot._route赋值，进而触发router-view的重新渲染
    this.router.afterHooks.forEach(hook => { // 触发afterEach狗子
      hook && hook(/* to*/route, /* from*/prev)
    })
  }
```

`updateRoute` 会调用 `History` 上通过 `listen` 方法注册的更新回调，触发 roter-view 的重新渲染  
这些更新回调是在 vue-router 初始化时注册的

```ts
// src/index.js init
history.listen((route) => {
  this.apps.forEach((app) => {
    app._route = route; // 更新route
  });
});
```

然后执行所有 `afterEach` 钩子  
至此一次完整的路由跳转完成，相应的守卫及钩子也触发完成

## 总结

- 整个导航的解析(确认)，其实就是从不同状态的路由记录中抽取出对应的守卫及钩子
- 然后组成队列，使用 `runQueue`、`iterator` 巧妙的完成守卫的执行
- 并在其中处理了异步组件的解析、`postEnterCb` 中实例获取的问题
- 整个守卫、钩子的执行流程如下
  - 导航被触发。
  - 在失活的组件里调用 `beforeRouteLeave` 守卫。
  - 调用全局的 `beforeEach` 守卫。
  - 在重用的组件里调用 `beforeRouteUpdate` 守卫 (2.2+)。
  - 在路由配置里调用  `beforeEnter`。
  - 解析异步路由组件。
  - 在被激活的组件里调用  `beforeRouteEnter`。
  - 调用全局的 `beforeResolve` 守卫 (2.5+)。
  - 导航被确认。
  - 调用全局的 `afterEach` 钩子。
  - 触发 `DOM` 更新。
  - 用创建好的实例调用 `beforeRouteEnter` 守卫中传给 `next` 的回调函数。
