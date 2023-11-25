# React-Router v6 完全解读指南 - react-router 篇

[[toc]]

# 前言

在 React-Router v6 完全解读指南 - `history` 篇 一文中我们说到了 react-router 的依赖库 `history`，介绍了其内部操作浏览器路由的方式和实现原理。它是 `react-router` 内部路由导航的核心库，甚至可以说，react-router 仅仅是围绕该库做了一层基于 React 的封装，如果有不了解的同学可以先看一下上面的文章。

接下来步入本文正题，基于源码层面讲一讲 react-router v6 中的设计理念与实践指南。

> 写此文章时 react-router 最新版为 v6.2.1，所以整片文章会以此时间节点进行分析，如果后续有一些大更新会考虑再加入这些特性的解

> 本文内容只包括 react-router v6 版本的内容，不会与 v5 版本做比较，如果想要了解如何从 v5 迁移到 v6，可以查看官方的迁移指南

实际上 react-router 的仓库中一共有三个包：`react-router`、`react-router-dom`和`react-router-native`，其中 `react-router` 包是整个 react-router 的核心，几乎所有与运行平台无关的方法、组件和 hooks 都是在这里定义的。

# 从 Router 开始讲起

`Router` 在 `react-router` 内部主要用于提供全局的路由导航对象（一般由 `history` 库提供）以及当前的路由导航状态，在项目中使用时一般是必须并且唯一的。  
不过我们一般不会直接使用该组件，更多会使用已经封装好路由导航对象的 `BrowserRouter`（react-router-dom 包引入）、`HashRouter`（react-router-dom 包引入）和 `MemoryRouter`（react-router 包引入）。

```tsx
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  rootElement
);
```

## Router 源码解析

首先我们需要定义两个 `Context`，用于存储全局的路由导航对象以及导航位置的上下文。

```tsx
import React from 'react';
import type { History, Location } from 'history';
import { Action as NavigationType } from 'history';

// 只包含，go、push、replace、createHref 四个方法的 History 对象，用于在 react-router 中进行路由跳转
export type Navigator = Pick<History, 'go' | 'push' | 'replace' | 'createHref'>;

interface NavigationContextObject {
  basename: string;
  navigator: Navigator;
  static: boolean;
}

/**
 * 内部含有 navigator 对象的全局上下文，官方不推荐在外直接使用
 */
const NavigationContext = React.createContext<NavigationContextObject>(null!);

interface LocationContextObject {
  location: Location;
  navigationType: NavigationType;
}
/**
 * 内部含有当前 location 与 action 的 type，一般用于在内部获取当前 location，官方不推荐在外直接使用
 */
const LocationContext = React.createContext<LocationContextObject>(null!);

// 这是官方对于上面两个 context 的导出，可以看到都是被定义为不安全的，并且可能会有着重大更改，强烈不建议使用
/** @internal */
export {
  NavigationContext as UNSAFE_NavigationContext,
  LocationContext as UNSAFE_LocationContext,
};
```

除此之外，react-router 还为我们提供了基于 `LocationContext` 的三个 hooks：`useInRouterContext`、`useNavigationType` 与 `useLocation`。

```tsx
/**
 * 断言方法
 */
function invariant(cond: any, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

/**
 * 判断当前组件是否在一个 Router 中
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext) != null;
}
/**
 * 获取当前的跳转的 action type
 */
export function useNavigationType(): NavigationType {
  return React.useContext(LocationContext).navigationType;
}
/**
 * 获取当前跳转的 location
 */
export function useLocation(): Location {
  // useLocation 必须在 Router 提供的上下文中使用
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useLocation() may be used only in the context of a <Router> component.`
  );

  return React.useContext(LocationContext).location;
}
```

然后再定义 `Router` 组件，并在 `Router` 组件中使用上面的两个 `Context`：

```tsx
// 接上面，这里额外还从 history 中引入了 parsePath 方法
import { parsePath } from 'history';

export interface RouterProps {
  // 路由前缀
  basename?: string;
  children?: React.ReactNode;
  // 必传，当前 location
  /*
      interface Location {
            pathname: string;
            search: string;
            hash: string;
            state: any;
            key: string;
      }
  */
  location: Partial<Location> | string;
  // 当前路由跳转的类型，有 POP，PUSH 与 REPLACE 三种
  navigationType?: NavigationType;
  // 必传，history 中的导航对象，我们可以在这里传入统一外部的 history
  navigator: Navigator;
  // 是否为静态路由（ssr）
  static?: boolean;
}

/**
 * 提供渲染 Route 的上下文，但是一般不直接使用这个组件，会包装在 BrowserRouter 等二次封装的路由中
 * 整个应用程序应该只有一个 Router
 * Router 的作用就是格式化传入的原始 location 并渲染全局上下文 NavigationContext、LocationContext
 */
export function Router({
  basename: basenameProp = '/',
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
  static: staticProp = false,
}: RouterProps): React.ReactElement | null {
  // 断言，Router 不能在其余 Router 内部，否则抛出错误
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You should never have more than one in your app.`
  );
  // 格式化 basename，去掉 url 中多余的 /，比如 /a//b 改为 /a/b
  let basename = normalizePathname(basenameProp);
  // 全局的导航上下文信息，包括路由前缀，导航对象等
  let navigationContext = React.useMemo(
    () => ({ basename, navigator, static: staticProp }),
    [basename, navigator, staticProp]
  );

  // 转换 location，传入 string 将转换为对象
  if (typeof locationProp === 'string') {
    // parsePath 用于将 locationProp 转换为 Path 对象，都是 history 库引入的
    /*
        interface Path {
              pathname: string;
              search: string;
              hash: string;
        }
    */
    locationProp = parsePath(locationProp);
  }

  let {
    pathname = '/',
    search = '',
    hash = '',
    state = null,
    key = 'default',
  } = locationProp;

  // 经过抽离 base 后的真正的 location，如果抽离 base 失败返回 null
  let location = React.useMemo(() => {
    // stripBasename 用于去除 pathname 前面 basename 部分
    let trailingPathname = stripBasename(pathname, basename);

    if (trailingPathname == null) {
      return null;
    }

    return {
      pathname: trailingPathname,
      search,
      hash,
      state,
      key,
    };
  }, [basename, pathname, search, hash, state, key]);

  if (location == null) {
    return null;
  }

  return (
    // 唯一传入 location 的地方
    <NavigationContext.Provider value={navigationContext}>
      <LocationContext.Provider
        children={children}
        value={{ location, navigationType }}
      />
    </NavigationContext.Provider>
  );
}
```

可以看到，**`Router` 组件内部并没有什么复杂的逻辑，仅仅只是提供 `Context` 与格式化外部传入的 `location` 对象（而实际上这个 `location` 对象一般也不用我们传入）**。

同时，在上面，除了使用了 `history` 提供的 `parsePath` 方法，还使用了 `normalizePathname` 与 `stripBasename` 两个 react-router 内部定义的方法。
下面它们的源码：

```tsx
/**
 * 格式化 pathname
 * @param pathname
 * @returns
 */
const normalizePathname = (pathname: string): string =>
  pathname.replace(/\/+$/, '').replace(/^\/*/, '/');

/**
 *
 * 抽离 basename，获取纯粹的 path，如果没有匹配到则返回 null
 * @param pathname
 * @param basename
 * @returns
 */
function stripBasename(pathname: string, basename: string): string | null {
  if (basename === '/') return pathname;

  // 如果 basename 与 pathname 不匹配，返回 null
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }

  // 上面只验证了是否 pathname 包含 basename，这里还需要验证包含 basename 后第一个字母是否为 /，不为 / 证明并不是该 basename 下的路径，返回 null
  let nextChar = pathname.charAt(basename.length);
  if (nextChar && nextChar !== '/') {
    return null;
  }

  // 返回去除掉 basename 的 path
  return pathname.slice(basename.length) || '/';
}
```

## MemoryRouter 源码解析

刚刚说完了 `Router` 组件是怎么封装的，还没说到它是怎么在其余高阶路由组件中使用的，趁热打铁，下面再来看看 `MemoryRouter` 的源码（只有 `MemoryRouter` 是被定义在 react-router 包中的，所以这里就先讲 `MemoryRouter` 了，`BrowserRouter` 与 `HashRouter` 跟它原理类似）。

```tsx
import type { InitialEntry, MemoryHistory } from 'history';
import { createMemoryHistory } from 'history';

export interface MemoryRouterProps {
  // 路由前缀
  basename?: string;
  children?: React.ReactNode;
  // 与 createMemoryHistory 返回的 history 对象参数相对应，代表的是自定义的页面栈与索引
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}

/**
 * react-router 里面只有 MemoryRouter，其余的 router 在 react-router-dom 里
 */
export function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
}: MemoryRouterProps): React.ReactElement {
  // history 对象的引用
  let historyRef = React.useRef<MemoryHistory>();
  if (historyRef.current == null) {
    // 创建 memoryHistory
    historyRef.current = createMemoryHistory({ initialEntries, initialIndex });
  }

  let history = historyRef.current;
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  // 监听 history 改变，改变后重新 setState
  React.useLayoutEffect(() => history.listen(setState), [history]);

  // 简单的初始化并将相应状态与 React 绑定
  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}
```

可以看到，所谓的高阶路由其实就是将 `history` 库与我们声明的 `Router` 组件绑定起来，当`history.listen` 监听到路由改变后重新设置当前的 `location` 与 `action`。

## 结论

- `Router` 组件是 `react-router` 应用中必不可少的，一般直接写在应用最外层，它提供了一系列关于路由跳转和状态的上下文属性和方法。
- 一般不会直接使用 `Router` 组件，而是使用 `react-router` 内部提供的高阶 `Router` 组件，而这些高阶组件实际上就是将 `history` 库中提供的导航对象与 `Router` 组件连接起来，进而控制应用的导航状态。

# Router 准备完毕，开始配置 Route

我们再来看看官方的例子：

```tsx
import { render } from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// 这几个页面不用管它
import App from './App';
import Expenses from './routes/expenses';
import Invoices from './routes/invoices';

const rootElement = document.getElementById('root');
render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/expenses' element={<Expenses />} />
      <Route path='/invoices' element={<Invoices />} />
    </Routes>
  </BrowserRouter>,
  rootElement
);
```

在例子中，我们引入了两个新的组件：`Routes` 与 `Route`。我们将每个路由 url 与页面相对应，写在了 `Route` 的 `props` 中，然后使用 `Routes` 将这些 `Route` 包裹起来作为 `children` 传入。这样，我们就得到定义好路由的应用了。

下面我们来看看嵌套路由的例子：

```tsx
<Routes>
  <Route path='/' element={<App />}>
    {/* 子路由为父路由 chilren，注意子路由 path 开头要能与父路由匹配 */}
    <Route path='/expenses' element={<Expenses />} />
    <Route path='/invoices' element={<Invoices />} />
  </Route>
</Routes>
```

在 App 组件内部：

```tsx
import { Outlet } from 'react-router';
export function App() {
  return (
    <>
      App
      <Outlet />
    </>
  );
}
```

上面的例子中我们又引入一个新的组件 `Outlet`，该组件用于在父路由元素中呈现它们的子路由元素。

也就是说，**后续子路由匹配到的内容都会放到 `Outlet` 组件中，当父路由元素在内部渲染它时，就会展示匹配到的子路由元素**。 也许你会觉得很神奇，它内部到底是如何工作的呢？先别急，我们现在先只讲如何在页面中渲染子路由，至于它的渲染原理后面再细说。

## Route 源码解析

我们先来看看 `Route` 组件的源码：

```tsx
// Route 有三种 props 类型，这里先了解内部参数的含义，下面会细讲
export interface PathRouteProps {
  caseSensitive?: boolean;
  // children 代表子路由
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  index?: false;
  path: string;
}

export interface LayoutRouteProps {
  children?: React.ReactNode;
  element?: React.ReactNode | null;
}

export interface IndexRouteProps {
  element?: React.ReactNode | null;
  index: true;
}

/**
 * Route 组件内部没有进行任何操作，仅仅只是定义 props，而我们就是为了使用它的 props
 */
export function Route(
  _props: PathRouteProps | LayoutRouteProps | IndexRouteProps
): React.ReactElement | null {
  // 这里可以看出 Route 不能够被渲染出来，渲染会直接抛出错误，证明 Router 拿到 Route 后也不会在内部操作
  invariant(
    false,
    `A <Route> is only ever to be used as the child of <Routes> element, ` +
      `never rendered directly. Please wrap your <Route> in a <Routes>.`
  );
}
```

该组件的定义可能会改变大多数人对于组件的认知，该组件竟然不是为了渲染界面而存在的，它在 **`react-router` 内仅仅只是个传递参数的工具人（后续讲 `Routes` 会细说）**，对用户的唯一作用就是提供命令式的路由配置方式。

`Route` 组件提供了三种 `props` 类型，这也是 react-router 官方规定的三种路由类型：`路径路由`、`布局路由`和`索引路由`。

- 路径路由：最普遍的路由定义方式，可以定义要匹配的 path 以及是否允许大小写不同等配置。
  ```tsx
  <Routes>
    <Route path='/' element={<App />} />
    <Route path='/teams' element={<Teams />} caseSensitive>
      <Route path='/teams/:teamId' element={<Team />} />
      <Route path='/teams/new' element={<NewTeamForm />} />
    </Route>
  </Routes>
  ```
- 布局路由：用于处理有共同布局时的路由定义方式，使用这种方式可以减少重复性的组件渲染，比如下面这样：
  ```tsx
  <Routes>
    <Route path='/' element={<App />} />
    {/* 布局路由 */}
    <Route element={<PageLayout />}>
      <Route path='/privacy' element={<Privacy />} />
      <Route path='/tos' element={<Tos />} />
    </Route>
    <Route path='/contact-us' element={<Contact />} />
  </Routes>
  ```
  否则你很可能会写成这样：
  ```tsx
  <Routes>
    <Route path='/' element={<App />} />
    {/* 包裹布局组件 */}
    <Route
      path='/privacy'
      element={
        <PageLayout>
          <Privacy />
        </PageLayout>
      }
    />
    {/* 重复包裹布局组件 */}
    <Route
      path='/tos'
      element={
        <PageLayout>
          <Tos />
        </PageLayout>
      }
    />
    <Route path='/contact-us' element={<Contact />} />
  </Routes>
  ```
  也许你看到了，布局组件是没有 `path` 属性的（或者你可以看做 `path` 为空字符串），它是否能匹配上当前的 `pathname` 实际取决于其内部的子路由，在路由匹配时 react-router 会跳过此路由，直接匹配其子路由，当子路由匹配上时会从匹配到的子路由开始由内到外查找对应父路由提供的 `element` 再进行渲染。
  更详细的理解可以看[官方文档](https://reactrouter.com/docs/en/v6/getting-started/concepts#layout-routes)。
- 索引路由：最特殊的路由定义方式，当设置 `index` 为 `true` 时会启用该路由，该路由内部不能有子路由，并且它能匹配到的 `path` 永远与父路由非`*`路径（这是 react-router v6 中的路径匹配规则，_代表所有的路径，比如`/foo/_`在这里索引路由可以匹配/foo 或者/foo/）一致。换种方法来说，它相当于目录里面的 index.js 文件，当我们引入目录时，默认会引用到它。
  ```tsx
  <Routes>
    <Route path='/teams' element={<Teams />}>
      <Route path='/teams/:teamId' element={<Team />} />
      <Route path='/teams/new' element={<NewTeamForm />} />
      <Route index element={<LeagueStandings />} />
    </Route>
  </Routes>
  ```
  当 `pathname` 为`/teams` 是会渲染`<LeagueStandings />`组件。

下面是一个比较完整的路由配置：

```tsx
<Routes>
  <Route path='/' element={<App />}>
    {/* pathname 为 / 默认为 <Home /> */}
    <Route index element={<Home />} />
    <Route path='/teams' element={<Teams />}>
      <Route path='/teams/:teamId' element={<Team />} />
      <Route path='/teams/:teamId/edit' element={<EditTeam />} />
      <Route path='/teams/new' element={<NewTeamForm />} />
      {/* pathname 为 /teams 默认为 <LeagueStandings /> */}
      <Route index element={<LeagueStandings />} />
    </Route>
  </Route>
  {/* pathname 为 /privacy 或 /tos 才能匹配到 <PageLayout /> */}
  <Route element={<PageLayout />}>
    <Route path='/privacy' element={<Privacy />} />
    <Route path='/tos' element={<Tos />} />
  </Route>
  <Route path='/contact-us' element={<Contact />} />
</Routes>
```

## Routes 源码解析

看了 `Route` 组件的源码，你会想 `Routes` 肯定也没有这么简单。没错，它其实也是个工具人，用于在内部解析传入 `Route` 的 `props`，下面再来看看源码：

```tsx
export interface RoutesProps {
  children?: React.ReactNode;
  // 用户传入的 location 对象，一般不传，默认用当前浏览器的 location
  location?: Partial<Location> | string;
}

/**
 * 所有的 Route 都需要 Routes 包裹，用于渲染 Route（拿到 Route 的 props 的值，不渲染真实的 DOM 节点）
 */
export function Routes({
  children,
  location,
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children), location);
}
```

它调用了 `useRoutes` 这个 `hook`，并且使用了 `createRoutesFromChildren` 这个方法将 `children` 转换为了 `useRoutes` 的配置参数，从而得到最后的路由元素。

至于 `useRoutes` 是什么，在这里先不细说，下面马上就会讲到，现在只是简单介绍一下：它是一种声明式的路由生成方式（使用 `Routes` 与 `Route` 是命令式的方式），通过传入一个配置对象数组来自动生成对应的渲染路由元素，同时此 API 也向用户开放。

下面详细解释下 `createRoutesFromChildren`：

```tsx
// 路由配置对象
export interface RouteObject {
  // 路由 path 是否匹配大小写
  caseSensitive?: boolean;
  // 子路由
  children?: RouteObject[];
  // 要渲染的组件
  element?: React.ReactNode;
  // 是否是索引路由
  index?: boolean;
  path?: string;
}

/**
 * 将 Route 组件转换为 route 对象，提供给 useRoutes 使用
 */
export function createRoutesFromChildren(
  children: React.ReactNode
): RouteObject[] {
  let routes: RouteObject[] = [];

  // 内部逻辑很简单，就是递归遍历 children，获取 <Route /> props 上的所有信息，然后格式化后推入 routes 数组中
  React.Children.forEach(children, (element) => {
    if (!React.isValidElement(element)) {
      // Ignore non-elements. This allows people to more easily inline
      // conditionals in their route config.
      return;
    }

    // 空节点，忽略掉继续往下遍历
    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children)
      );
      return;
    }

    // 不要传入其它组件，只能传 Route
    invariant(
      element.type === Route,
      `[${
        typeof element.type === 'string' ? element.type : element.type.name
      }] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`
    );

    let route: RouteObject = {
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      index: element.props.index,
      path: element.props.path,
    };

    // 递归
    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children);
    }

    routes.push(route);
  });

  return routes;
}
```

## 结论

- `react-router` 在路由定义时同时提供了两种方式：命令式与声明式，而这两者本质上都是调用的同一种路由生成的方法。
- `Route` 可以被看做一个挂载用户传入参数的对象，它不会在页面中渲染，而是会被 `Routes` 接受并解析，我们也不能单独使用它。
- `Routes` 与 Route 强绑定，有 Routes 则必定要传入且只能传入 Route。

# 另一种路由配置方式 - useRoutes（核心概念）

> `useRoutes` 是整个 `react-router v6` 的核心所在，内部包含了大量的解析与匹配逻辑。

在前面我们使用了命令式的方式配置路由，发现它们在内部也会被 `react-router` 转换为声明式的路由配置方式，也就是使用 `useRoutes` 来创建路由。实际上 react-router 对外暴露了 `useRoutes` 方法，用户一样可以直接使用类似 `vue-router` 的声明式写法定义路由。

直接上示例：

```tsx
import { useRoutes } from 'react-router-dom';

// 此时 App 返回的就是已经渲染好的路由元素了
function App() {
  let element = useRoutes([
    {
      path: '/',
      element: <Dashboard />,
      children: [
        {
          path: '/messages',
          element: <DashboardMessages />,
        },
        { path: '/tasks', element: <DashboardTasks /> },
      ],
    },
    { path: '/team', element: <AboutPage /> },
  ]);

  return element;
}
```

可以看到，写法和之前还是大同小异的。

## useRoutes 源码解析

### RouteContext

在这里，我们又需要引入一个新的 `Context` - `RouteContext`，它存储了两个属性：`outlet` 与 `matches`。

```tsx
/**
 * 动态参数的定义
 */
export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};

export interface RouteMatch<ParamKey extends string = string> {
  // params 参数，比如 :id 等
  params: Params<ParamKey>;
  // 匹配到的 pathname
  pathname: string;
  /**
   * 子路由匹配之前的路径 url，这里可以把它看做是只要以 /* 结尾路径（这是父路由的路径）中 /* 之前的部分
   */
  pathnameBase: string;
  // 定义的路由对象
  route: RouteObject;
}

interface RouteContextObject {
  // 一个 ReactElement，内部包含有所有子路由组成的聚合组件，其实 Outlet 组件内部就是它
  outlet: React.ReactElement | null;
  // 一个成功匹配到的路由数组，索引从小到大层级依次变深
  matches: RouteMatch[];
}
/**
 * 包含全部匹配到的路由，官方不推荐在外直接使用
 */
const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  matches: [],
});

/** @internal */
export { RouteContext as UNSAFE_RouteContext };
```

> `RouteContext` 官方也是不建议我们在外部使用的，可能你会想它提供的 `matches` 数组是否能用来完成某些功能，比如面包屑导航。请不要这样做，你应该使用 react-router 提供的 `matchRoutes` 方法来手动匹配，而不是使用它。 因为该 matches 数组的值会根据你的路由匹配层级而动态改变，你可能无法获得你想要的效果。

`RouteContext` 也是路由渲染的关键之一，从它的 `outlet` 属性和之前使用的 `Outlet` 组件你也许能想到：**它的 `Context.Provider` 调用次数不止一次，而是和子路由的嵌套层数息息相关的**。

### 拆分 useRoutes

说完了 `RouteContext`，下面进入正题。

`useRoutes` 内部逻辑十分复杂，我们先来看看最外层的代码，将其逻辑拆分出来：

```tsx
/**
 * 1.该 hooks 不是只调用一次，每次重新匹配到路由时就会重新调用渲染新的 element
 * 2.当多次调用 useRoutes 时需要解决内置的 route 上下文问题，继承外层的匹配结果
 * 3.内部通过计算所有的 routes 与当前的 location 关系，经过路径权重计算，得到 matches 数组，然后将 matches 数组重新渲染为嵌套结构的组件
 */
export function useRoutes(
  routes: RouteObject[],
  locationArg?: Partial<Location> | string
): React.ReactElement | null {
  // useRoutes 必须最外层有 Router 包裹，不然报错
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  // 1.当此 useRoutes 为第一层级的路由定义时，matches 为空数组（默认值）
  // 2.当该 hooks 在一个已经调用了 useRoutes 的渲染环境中渲染时，matches 含有值（也就是有 Routes 的上下文环境嵌套）
  let { matches: parentMatches } = React.useContext(RouteContext);
  // 最后 match 到的 route（深度最深），该 route 将作为父 route，我们后续的 routes 都是其子级
  let routeMatch = parentMatches[parentMatches.length - 1];
  // 下面是父级 route 的参数，我们会基于以下参数操作，如果项目中只在一个地方调用了 useRoutes，一般都会是默认值
  let parentParams = routeMatch ? routeMatch.params : {};
  // 父路由的完整 pathname，比如路由设置为 /foo/*，当前导航是 /foo/1，那么 parentPathname 就是 /foo/1
  let parentPathname = routeMatch ? routeMatch.pathname : '/';
  // 同上面的 parentPathname，不过是 /* 前的部分，也就是 /foo
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : '/';
  let parentRoute = routeMatch && routeMatch.route;
  // 获取上下文环境中的 location
  let locationFromContext = useLocation();

  // 判断是否手动传入了 location，否则用默认上下文的 location
  let location;
  if (locationArg) {
    // 格式化为 Path 对象
    let parsedLocationArg =
      typeof locationArg === 'string' ? parsePath(locationArg) : locationArg;
    // 如果传入了 location，判断是否与父级路由匹配（作为子路由存在）
    invariant(
      parentPathnameBase === '/' ||
        parsedLocationArg.pathname?.startsWith(parentPathnameBase),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, ` +
        `the location pathname must begin with the portion of the URL pathname that was ` +
        `matched by all parent routes. The current pathname base is "${parentPathnameBase}" ` +
        `but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`
    );

    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }

  let pathname = location.pathname || '/';
  // 剩余的 pathname，整体 pathname 减掉父级已经匹配的 pathname，才是本次 routes 要匹配的 pathname（适用于 parentMatches 匹配不为空的情况）
  let remainingPathname =
    parentPathnameBase === '/'
      ? pathname
      : pathname.slice(parentPathnameBase.length) || '/';
  // 匹配当前路径，注意是移除了 parentPathname 的相关路径后的匹配

  // 通过传入的 routes 配置项与当前的路径，匹配对应渲染的路由
  let matches = matchRoutes(routes, { pathname: remainingPathname });

  // 参数为当前匹配到的 matches 路由数组和外层 useRoutes 的 matches 路由数组
  // 返回的是 React.Element，渲染所有的 matches 对象
  return _renderMatches(
    // 没有 matches 会返回 null
    matches &&
      matches.map((match) =>
        // 合并外层调用 useRoutes 得到的参数，内部的 Route 会有外层 Route（其实这也叫父 Route） 的所有匹配属性。
        Object.assign({}, match, {
          params: Object.assign({}, parentParams, match.params),
          // joinPaths 函数用于合并字符串
          pathname: joinPaths([parentPathnameBase, match.pathname]),
          pathnameBase:
            match.pathnameBase === '/'
              ? parentPathnameBase
              : joinPaths([parentPathnameBase, match.pathnameBase]),
        })
      ),
    // 外层 parentMatches 部分，最后会一起加入最终 matches 参数中
    parentMatches
  );
}

/**
 * 将多个 path 合并为一个
 * @param paths path 数组
 * @returns
 */
const joinPaths = (paths: string[]): string =>
  paths.join('/').replace(/\/\/+/g, '/');
```

接上面关于在 `useRoutes` 中调用 `RouteContext` 的解释，`useRoutes` 在开头就用到了 `RouteContext`，而它内部有值的情况是这样的：

```tsx
<Routes>
  <Route path='/' element={<App />}>
    {/* 注意，这里父级后面必须加上 /* 用于匹配后续的任意子路由，否则按照 react-router 的路由匹配方式是无法匹配上内部嵌套的子路由的 */}
    <Route path='/teams/*' element={<Teams />} />
  </Route>
</Routes>
```

在 `Teams` 组件内部

```tsx
import { Routes, Route } from 'react-router';
import Team from './Team';
import NewTeamForm from './NewTeamForm';
export function Teams() {
  // 组件内部继续使用 useRoutes（之前说过了，使用 Routes 组件就是调用 useRoutes）
  return (
    <Routes>
      {/* 这里会在内部处理父路由已经匹配到的路径前缀，所以不要写成 /teams/:teamId，直接写后面的部分 */}
      <Route path='/:teamId' element={<Team />} />
      <Route path='/new' element={<NewTeamForm />} />
    </Routes>
  );
}
```

**这证明我们不一定要全部将路由定义在最外层，可以适当拆解出子路由，做一些比较特殊的功能，比如路由的条件渲染，鉴权等**。

这里整体概括一下 useRoutes 做的事情：

1. 获取上下文中调用 `useRoutes` 后的信息，如果有信息证明此次调用时作为子路由使用的，需要合并父路由的匹配信息。
2. 移除父路由已经匹配完毕的 `pathname` 前缀后，调用 `matchRoutes` 与当前传入的 `routes` 配置相匹配，返回匹配到的 `matches` 数组。
3. 调用 `_renderMatches` 方法，渲染上一步得到的 matches 数组。

整个流程对应三个阶段：**路由上下文解析阶段，路由匹配阶段，路由渲染阶段**。

路由上下文解析阶段不用多说，下面详细说说后面两个阶段。

### 路由匹配阶段

路由匹配阶段其实就是调用 `matchRoutes` 方法的过程，我们来看看这个方法：

```tsx
/**
 * 通过 routes 与 location 得到 matches 数组
 */
export function matchRoutes(
  // 用户传入的 routes 对象
  routes: RouteObject[],
  // 当前匹配到的 location，注意这在 useRoutes 内部是先有过处理的
  locationArg: Partial<Location> | string,
  // 这个参数在 useRoutes 内部是没有用到的，但是该方法是对外暴露的，用户可以使用这个参数来添加统一的路径前缀
  basename = '/'
): RouteMatch[] | null {
  // 先格式化为 Path 对象
  let location =
    typeof locationArg === 'string' ? parsePath(locationArg) : locationArg;

  // 之前提到过，抽离 basename，获取纯粹的 pathname
  let pathname = stripBasename(location.pathname || '/', basename);

  // basename 匹配失败，返回 null
  if (pathname == null) {
    return null;
  }

  // 1.扁平化 routes，将树状的 routes 对象根据 path 扁平为一维数组，同时包含当前路由的权重值
  let branches = flattenRoutes(routes);
  // 2.传入扁平化后的数组，根据内部匹配到的权重排序
  rankRouteBranches(branches);

  let matches = null;
  // 3.这里就是权重比较完成后的解析顺序，权重高的在前面，先进行匹配，然后是权重低的匹配
  // branches 中有一个匹配到了就终止循环，或者全都没有匹配到
  for (let i = 0; matches == null && i < branches.length; ++i) {
    // 遍历扁平化的 routes，查看每个 branch 的路径匹配规则是否能匹配到 pathname
    matches = matchRouteBranch(branches[i], pathname);
  }

  return matches;
}
```

仔细看完上面的代码，我们发现 `matchRoutes` 又在内部将路由的匹配分为了三个阶段：**路由扁平化、路由权值计算与排序、路由匹配与合并**。

### 路由扁平化

将路由扁平化处理是为了更好的进行权值排序，我们先看看处理前后的对比

处理前：

<div align="center"><img :src="$withBase('/images/react/06-react-router/react-router-090601.jpg')" alt="react/06-react-router/react-router-090601.jpg"></div>

处理后：

<div align="center"><img :src="$withBase('/images/react/06-react-router/react-router-090602.jpg')" alt="react/06-react-router/react-router-090602.jpg"></div>

可以看到，嵌套树形的数据结构被我们拍平为了一维数组，更加适合比较排序。

路由扁平化是在 `flattenRoutes` 方法中处理的：

```tsx
// 保存在 branch 中的路由信息，后续路由匹配时会用到
interface RouteMeta {
  /**
   * 路由的相对路径（刨除与父路由重复部分）
   */
  relativePath: string;
  caseSensitive: boolean;
  /**
   * 用户在 routes 数组中定义的索引位置（相对其兄弟 route 而言）
   */
  childrenIndex: number;
  route: RouteObject;
}

// 扁平化的路由对象，包含当前路由对象对应的完整 path，权重得分与用于匹配的路由信息
interface RouteBranch {
  /**
   * 完整的 path（合并了父路由的，下面会引入相对路由的概念）
   */
  path: string;
  /**
   * 权重，用于排序
   */
  score: number;
  /**
   * 路径 meta，依次为从父级到子级的路径规则，最后一个是路由自己
   */
  routesMeta: RouteMeta[];
}

/**
 * 扁平化路由，会将所有路由扁平为一个数组，用于比较权重
 * @param routes 第一次在外部调用只需要传入该值，用于转换的 routes 数组
 * @param branches
 * @param parentsMeta
 * @param parentPath
 * @returns
 */
function flattenRoutes(
  routes: RouteObject[],
  // 除了 routes，下面三个都是递归的时候使用的
  branches: RouteBranch[] = [],
  parentsMeta: RouteMeta[] = [],
  parentPath = ''
): RouteBranch[] {
  routes.forEach((route, index) => {
    // 当前 branch 管理的 route meta
    let meta: RouteMeta = {
      // 只保存相对路径，这里的值下面会进行处理
      relativePath: route.path || '',
      caseSensitive: route.caseSensitive === true,
      // index 是用户给出的 routes 顺序，会一定程度影响 branch 的排序（当为同一层级 route 时）
      childrenIndex: index,
      // 当前 route 对象
      route,
    };

    // 如果 route 以 / 开头，那么它应该完全包含父 route 的 path，否则报错
    if (meta.relativePath.startsWith('/')) {
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`
      );

      // 把父路由前缀去除，只要相对路径
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    // 完整的 path，合并了父路由的 path
    let path = joinPaths([parentPath, meta.relativePath]);
    // 第一次使用 parentsMeta 为空数组，从外到内依次推入 meta 到该数组中
    let routesMeta = parentsMeta.concat(meta);

    // 开始递归
    if (route.children && route.children.length > 0) {
      // 如果是 index route，报错，因为 index route 不能有 children
      invariant(
        route.index !== true,
        `Index routes must not have child routes. Please remove ` +
          `all child routes from route path "${path}".`
      );

      flattenRoutes(route.children, branches, routesMeta, path);
    }

    // 没有路径的路由（之前提到过的布局路由）不参与路由匹配，除非它是索引路由
    /* 
      注意：递归是在前面进行的，也就是说布局路由的子路由是会参与匹配的
      而子路由会有布局路由的路由信息，这也是布局路由能正常渲染的原因。
    */
    if (route.path == null && !route.index) {
      return;
    }

    // routesMeta，包含父 route 到自己的全部 meta 信息
    // computeScore 是计算权值的方法，我们后面再说
    branches.push({ path, score: computeScore(path, route.index), routesMeta });
  });

  return branches;
}
```

**我们除了关心是如何将路由扁平化之外，这里还要额外讲到一点 - 相对路由**。

在前面的例子中我一直使用的绝对路径赋值给 `Route` 的 `path` 属性，但从上面的代码中我们可以看到，path 属性是可以接收相对路径的，只要不以/开头都会被看做是相对路径，最终的匹配结果都会和父路由的 path 相结合（详细的匹配代码在后面的路由匹配与合并阶段）。

```jsx
<Routes>
  <Route path='/teams' element={<Teams />}>
    {/* 不加 / 是相对路径，继承父路由的路径，效果与 /teams/:teamId 等同 */}
    <Route path=':teamId' element={<Team />} />
    <Route path='new' element={<NewTeamForm />} />
  </Route>
</Routes>
```

### 路由权值计算与排序

讲到权值计算，我们要先说说权值的基本单位，react-router 中定义了五种不同的权值单位：

```tsx
// 动态路由权重，比如 /foo/:id
const dynamicSegmentValue = 3;
// 索引路由权重，也就是加了 index 为 true 属性的路由
const indexRouteValue = 2;
// 空路由权重，当一段路径值为空时匹配，只有最后的路径以 / 结尾才会用到它
const emptySegmentValue = 1;
// 静态路由权重
const staticSegmentValue = 10;
// 路由通配符权重，为负的，代表当我们写 * 时实际会降低权重
const splatPenalty = -2;
```

当我们进行路径匹配时，会按照`/`分割每一段 `path`，然后依次匹配上面的五种权值单位，最后将所有匹配结果合并，就是最终的 path 总权值。

我们再来看看之前提到的 `computeScore` 函数：

```tsx
// 判断是否有动态参数，比如 :id 等
const paramRe = /^:\w+$/;
// 判断是否为 *
const isSplat = (s: string) => s === '*';

/**
 * 计算路由权值，根据权值大小匹配路由
 * 静态值 > params 动态参数
 * @param path 完整的路由路径，不是相对路径
 * @param index
 * @returns
 */
function computeScore(path: string, index: boolean | undefined): number {
  let segments = path.split('/');
  // 初始化权重值，有几段路径就是几，路径多的初始权值高
  let initialScore = segments.length;
  // 有一个 * 权重减 2
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }

  // 用户传了 index，index 是布尔值，代表 IndexRouter，权重 +2
  if (index) {
    initialScore += indexRouteValue;
  }

  // 在过滤出非 * 的部分
  return segments
    .filter((s) => !isSplat(s))
    .reduce(
      (score, segment) =>
        score +
        // 如果有动态参数
        (paramRe.test(segment)
          ? // 动态参数权重 3
            dynamicSegmentValue
          : segment === ''
          ? // 空值权重为 1，这个其实只有一种情况，path 最后面多一个 /，比如 /foo 与 /foo/ 的区别
            emptySegmentValue
          : // 静态值权重最高为 10
            staticSegmentValue),
      initialScore
    );
}
```

可以看到，`computeScore` 内部就是按照我们上面说的规则计算出一段 path 的总权值。

你之前是否想过，**同时设置了 index 为 true 的索引路由与一个 path 与父路由完全相同的子路由谁会被匹配**。

```tsx
<Routes>
  <Route path='/teams' element={<Teams />}>
    {/* 这里 path='' 和下面是等同的，但是不能不写 path，否则会被认为是布局路由，不会参与匹配, '' == null => false */}
    <Route path='/teams' element={<Team />} />
    <Route index element={<LeagueStandings />} />
  </Route>
</Routes>
```

而从这里你就能知道，索引路由会被匹配，因为它们传入 `computeScore` 的 `path` 是一致的（之前有过处理，最后传入的都是父路由的 path），但是索引路由会多一个 indexRouteValue，权值会+2。

再次回顾之前的代码：

```tsx
// 1.扁平化 routes，将树状的 routes 对象根据 path 扁平为一维数组，同时包含当前路由的权重值
let branches = flattenRoutes(routes);
// 2.传入扁平化后的数组，根据内部匹配到的权重排序
rankRouteBranches(branches);
```

我们已经讲完了 `flattenRoutes` 与内部的权值计算，生成了一个扁平化的路由数组，下一步则是调用 `rankRouteBranches` 方法进行路由排序：

```tsx
/**
 * 排序，比较权重值
 * @param branches
 */
function rankRouteBranches(branches: RouteBranch[]): void {
  branches.sort((a, b) =>
    a.score !== b.score
      ? // 排序，权值大的在前面
        b.score - a.score
      : // 如果 a.score === b.score
        compareIndexes(
          // routesMeta 是一个从最外层路由到子路由的数组
          // childrenIndex 是按照 routes 中 route 传入的顺序传值的，写在后面的 index 更大（注意是同级）
          a.routesMeta.map((meta) => meta.childrenIndex),
          b.routesMeta.map((meta) => meta.childrenIndex)
        )
  );
}

/**
 * 比较子 route 的 index，判断是否为兄弟 route，如果不是则返回 0，比较没有意义，不做任何操作
 * @param a
 * @param b
 * @returns
 */
function compareIndexes(a: number[], b: number[]): number {
  // 是否为兄弟 route
  let siblings =
    // 这里是比较除了最后一个 route 的 path，需要全部一致才是兄弟 route
    a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);

  return siblings
    ? // 如果是兄弟节点，按照传入的顺序排序 a.length - 1 和 b.length - 1 是相等的，只是内部的值不同
      a[a.length - 1] - b[b.length - 1]
    : // 只比较兄弟节点，如果不是兄弟节点，则权重相同
      0;
}
```

最后，我们得到的就是已经排好序的扁平化数组

### 路由匹配与合并

排序完毕后，下一步就是路由匹配了，根据排序好的顺序，我们按照索引从低到高依次匹配路径，也就是之前 `matchRoutes` 中的这部分代码：

```tsx
let matches = null;
// 3.这里就是权重比较完成后的解析顺序，权重高的在前面，先进行匹配，然后是权重低的匹配
// branches 中有一个匹配到了就终止循环，或者全都没有匹配到
for (let i = 0; matches == null && i < branches.length; ++i) {
  // 遍历扁平化的 routes，查看每个 branch 的路径匹配规则是否能匹配到 pathname
  matches = matchRouteBranch(branches[i], pathname);
}
```

在这里，我们调用了 `matchRouteBranch` 方法：

```jsx
/**
 * 通过 branch 和当前的 pathname 得到真正的 matches 数组
 * @param branch
 * @param routesArg
 * @param pathname
 * @returns
 */
function matchRouteBranch<ParamKey extends string = string>(
  branch: RouteBranch,
  pathname: string
): RouteMatch<ParamKey>[] | null {
  let { routesMeta } = branch;

  // 初始化匹配到的值
  let matchedParams = {};
  let matchedPathname = "/";
  // 最终的 matches 数组
  let matches: RouteMatch[] = [];
  // 遍历 routesMeta 数组，最后一项是自己的 route，前面是 parentRoute
  for (let i = 0; i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    // 是否为最后一个 route
    let end = i === routesMeta.length - 1;
    // pathname 匹配过父 route 后的剩余的路径名
    let remainingPathname =
      matchedPathname === "/"
        ? pathname
        : pathname.slice(matchedPathname.length) || "/";
    // 使用的相对路径规则匹配剩余的值
    // matchPath 方法用于单个路径的匹配，下面细讲
    let match = matchPath(
      // 在匹配时只有最后一个 route 的 end 才会是 true，其余都是 false，这里的 end 意味路径最末尾的 /
      { path: meta.relativePath, caseSensitive: meta.caseSensitive, end },
      remainingPathname
    );

    // 没匹配上，直接返回 null，整个 route 都匹配失败
    if (!match) return null;

    // 匹配上了合并 params，注意这里是改变的 matchedParams，所以所有 route 的 params 都是同一个
    Object.assign(matchedParams, match.params);

    let route = meta.route;

    // 匹配上了就把路径再补全
    matches.push({
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: joinPaths([matchedPathname, match.pathnameBase]),
      route
    });

    // 更改 matchedPathname，已经匹配上的 pathname 前缀，用作后续子 route 的循环
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }

  return matches;
}
```

从传入的 `branch` 中我们拿到了 `routesMeta` 这个包含了所有路由层级的数组，又开始了一层层的路由匹配，然后把每一次匹配上的完整路径与参数都推入 `matches` 数组中，最后返回。

下面是 `matchPath` 方法具体的匹配流程：

> 整个流程比较晦涩，几乎全是正则表达式，同时伴随着比较复杂的类型体操，笔者会尽量写清楚每一阶段的注释，如果暂时还是无法理解可以跳过，只需要知道 `matchPath` 方法的作用就行了。

```tsx
/**
 * 如果 ts 解析参数失败的状态，和下面一起看
 */
type ParamParseFailed = { failed: true };

/**
 * 这里就是类型体操了，主要是解析 params 中的具体参数，比如解析出 /:a 中的 a，拿到后单独提出来
 * ParamParseSegment<'/:a/:b'> => 'a' | 'b'
 */
type ParamParseSegment<Segment extends string> =
  // 递归查左右是否有 :id 这样的路径存在
  // Check here if there exists a forward slash in the string.
  Segment extends `${infer LeftSegment}/${infer RightSegment}`
    ? // 如果有 /，代表是一个 url，开始解析
      // 递归解析左边
      ParamParseSegment<LeftSegment> extends infer LeftResult
      // 递归解析右边
      ? ParamParseSegment<RightSegment> extends infer RightResult
        ? LeftResult extends string
          ? // 左边解析成功，再解析右边，取二者的交集，比如 "foo" | "bar"
            RightResult extends string
            ? LeftResult | RightResult
            : LeftResult
          : // 如果左边解析失败，则看右边是否能成功，都失败返回 ParamParseFailed
          RightResult extends string
          ? RightResult
          : ParamParseFailed
        : ParamParseFailed
      : // 如果左边不能被解析，那么直接解析右边
      ParamParseSegment<RightSegment> extends infer RightResult
      ? RightResult extends string
        ? RightResult
        : ParamParseFailed
      : ParamParseFailed
    : // 如果没有 /，则判断是否本事符合 :id 这样的形式，如果符合返回动态参数名，否则返回 ParamParseFailed
    Segment extends `:${infer Remaining}`
    ? Remaining
    : ParamParseFailed;

/**
 * 解析给定的字符串类型，失败就返回 string 类型，否则返回在字符串中动态引用部分的联合类型
 */
type ParamParseKey<Segment extends string> =
  ParamParseSegment<Segment> extends string
    ? ParamParseSegment<Segment>
    : string;


/**
 * 一个 match 路径的模式，匹配时会将下面三个属性结合起来生成一个正则表达式用于匹配路径
 */
export interface PathPattern<Path extends string = string> {
  /**
   * 模式要构造的路径
   * 这里的 Path 可以不直接写 string 类型，可以是具体的路径，因为 ts 可以直接解析出对应参数
   */
  path: Path;
  caseSensitive?: boolean;
  /**
   * 为 true 时忽略尾部斜杠，否则会至少匹配到完整的单词边界
   */
  end?: boolean;
}

/**
 * PathPattern 匹配后的信息
 */
export interface PathMatch<ParamKey extends string = string> {
  /**
   * 路径中的动态参数
   */
  params: Params<ParamKey>;
  /**
   * 匹配到的路径部分
   */
  pathname: string;
  /**
   * 在子路由之前匹配的路径部分。
   */
  pathnameBase: string;
  /**
   * 用来 match 路径的 pattern
   */
  pattern: PathPattern;
}

// 消除 readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * 判断 pathname 是否匹配传入的 pattern，如果不匹配返回 null，如果匹配就返回进过解析后的值
 */
export function matchPath<
  ParamKey extends ParamParseKey<Path>,
  Path extends string
>(
  pattern: PathPattern<Path> | Path,
  pathname: string
): PathMatch<ParamKey> | null {
  // 格式化
  if (typeof pattern === "string") {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }

  // 将 pattern 的参数共同编译为一个正则表达式 matcher，用于路径匹配，该正则会将动态路径作为 group 依次捕获
  // 同时还会返回一个 params 参数名组成的数组，paramNames 内为动态参数名，比如 *、id
  let [matcher, paramNames] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end
  );

  // 开始匹配
  let match = pathname.match(matcher);
  if (!match) return null;

  // 匹配到的 pathname
  let matchedPathname = match[0];
  // $1 代表第 n 个括号内的内容，这里其实就是去除最后一层路径后面的所有 /
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  // 捕获到的动态路由数组，从数组的第二个元素开始就是 () 中匹配到的内容，比如 /about/*，传入 /about/1，就会匹配到 1（*也被看做是动态路由）
  let captureGroups = match.slice(1);
  // 匹配到所有的动态参数，包括 * 和 :id 等
  let params: Params = paramNames.reduce<Mutable<Params>>(
    (memo, paramName, index) => {
      // 这里是使用原始字符串计算，因为后续在 params 中已经解码了，pathnameBase 获取会有问题
      if (paramName === "*") {
        // 对应匹配到的值
        let splatValue = captureGroups[index] || "";
        /**
         * 这个匹配在这里其实就是把例如 /home/* 这样的路径变为 /home。
         * 比如在 Route 中设置为 /home/*，实际路径匹配为 /home/2，这里 matchedPathname 就为 /home/2，而 pathnameBase 为 /home
         */
        pathnameBase = matchedPathname
          .slice(0, matchedPathname.length - splatValue.length)
          // 去除末尾的 /
          .replace(/(.)\/+$/, "$1");
      }

      // 解码
      memo[paramName] = safelyDecodeURIComponent(
        captureGroups[index] || "",
        paramName
      );
      return memo;
    },
    {}
  );

  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}


/**
 * 解码 url，做了层封装，失败返回传入的 value
 * @param value
 * @param paramName
 * @returns
 */
function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`
    );

    return value;
  }
}

/**
 * 解析 path，会将 path => 对应的 RegExp，同时解析出 path 的所有 params
 * @param path
 * @param caseSensitive 是否兼容大小写不一致
 * @param end 是否匹配末尾的 /，否则应匹配到单词边界
 * @returns
 */
function compilePath(
  path: string,
  caseSensitive = false,
  end = true
): [RegExp, string[]] {
  // path 不能是 /home* 这样的，否则打印警告
  warning(
    path === "*" || !path.endsWith("*") || path.endsWith("/*"),
    `Route path "${path}" will be treated as if it were ` +
      `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
      `always follow a \`/\` in the pattern. To get rid of this warning, ` +
      `please change the route path to "${path.replace(/\*$/, "/*")}".`
  );

  // 动态路径名数组
  let paramNames: string[] = [];
  let regexpSource =
    "^" +
    path
      // 先忽略尾部的 / 和 /*
      .replace(/\/*\*?$/, "")
      // 确保开头有一个 /
      .replace(/^\/*/, "/")
      // 转义特殊与正则表达式有关的字符
      .replace(/[\\.*+^$?{}|()[\]]/g, "\\$&")
      // 转义以:开头的路径块，也就是 params，比如 :id
      .replace(/:(\w+)/g, (_: string, paramName: string) => {
        paramNames.push(paramName);
        return "([^\\/]+)";
      });

  // 在这里处理尾部的 /* 和 *
  if (path.endsWith("*")) {
    // 尾部有 * 才代表 params 中有 *
    paramNames.push("*");
    regexpSource +=
      path === "*" || path === "/*"
        ? // 如果为 * 或 /* 则处理任意值
          "(.*)$"
        : // 这里 (?:x) 是非捕获匹配，捕获通过 match 将 () 中的值返回，也就不会放入 params 中
          // 下面是匹配 /xxx 和 /*（/出现 0 次或多次），下面两者有相互重叠的地方，后续官方应该会改吧，感觉怪怪的
          "(?:\\/(.+)|\\/*)$";
  } else {
    // 如果最后没有以 * 结尾，则只是忽略末尾的 /，否则我们应该至少匹配到一个单次边界（兼容 end 为 true 的情况，还有更多其他的情况，比如 /home/ /home@，也就是匹配到的单词后的字符不能是 a-z、A-Z、0-9）
    regexpSource += end
      ? "\\/*$"
      :
        // 限制了父 routes 只能匹配到自己的单词，如果为 false，那么 /home 可以匹配 /home/home2，但是不能匹配 /home2，也就是说必须要只有 /home，或者有 /home/ 作为前缀
        // 匹配到单词边界
        "(?:\\b|\\/|$)";
  }

  // path => pattern
  let matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");

  return [matcher, paramNames];
}
```

至此，我们就完成了路由匹配阶段的所有操作。

### 路由渲染阶段

路由渲染阶段相对于路由匹配阶段代码会少很多，但是可能比较难以理解，`useRoutes` 在内部是调用 `_renderMatches` 方法来实现的，这里先看源码：

```tsx
/**
 * 其实就是渲染 RouteContext.Provider 组件（包括多个嵌套的 Provider）
 */
function _renderMatches(
  matches: RouteMatch[] | null,
  // 如果在已有 match 的 route 内部调用，会合并父 context 的 match
  parentMatches: RouteMatch[] = []
): React.ReactElement | null {
  if (matches == null) return null;

  // 生成 outlet 组件，注意这里是从后往前 reduce，所以索引在前的 match 是最外层，也就是父路由对应的 match 是最外层
  /**
   *  可以看到 outlet 是通过不断递归生成的组件，最外层的 outlet 递归层数最多，包含有所有的内层组件，
   *  所以我们在外层使用的 <Outlet /> 是包含有所有子组件的聚合组件
   * */
  return matches.reduceRight((outlet, match, index) => {
    return (
      <RouteContext.Provider
        // 如果有 element 就渲染 element，如果没有填写 element，则默认是 <Outlet />，继续渲染内嵌的 <Route />
        children={
          match.route.element !== undefined ? match.route.element : <Outlet />
        }
        // 代表当前 RouteContext 匹配到的值，matches 并不是全局状态一致的，会根据层级不同展示不同的值，最后一个层级是完全的 matches，这也是之前提到过的不要在外部使用 RouteContext 的原因
        value={{
          outlet,
          matches: parentMatches.concat(matches.slice(0, index + 1)),
        }}
      />
    );
    // 最内层的 outlet 为 null，也就是最后的子路由
  }, null as React.ReactElement | null);
}
```

实际上，上面 方法生成的 Element 是一个多个`RouteContext.Provider`组成的聚合体，大致的图解是这样的：

<div align="center"><img :src="$withBase('/images/react/06-react-router/react-router-090603.jpg')" alt="react/06-react-router/react-router-090603.jpg"></div>

路由渲染阶段要做的事很少，就是将之前得到的 matches 数组渲染为 React 元素。

## 结论

- `useRoutes` 是 react-router 中核心，用户不管是直接使用 `useRoutes` 还是用 `Routes` 与 `Route` 组件结合最终都会转换为它。该 hook 拥有三个阶段：**路由上下文解析阶段、路由匹配阶段、路由渲染阶段**
- `useRoutes` 在上下文解析阶段会解析在外层是否已经调用过 `useRoutes`，如果调用过会先获取外层的上下文数据，最后将外层数据与用户传入的 routes 数组结合，生成最终结果。
- `useRoutes` 在匹配阶段会将传入的 `routes` 与当前的 `location`（可手动传入，但内部会做校验）做一层匹配，通过对 route 中声明的 path 的权重计算，拿到当前 pathname 所能匹配到的最佳 matches 数组，索引从小到大层数关系从外到内。
- `useRoutes` 在渲染阶段会将 matches 数组渲染为一个聚合的 React Element，该元素整体是许多 `RouteContext.Provider` 的嵌套，从外到内依次是【`父 => 子 => 孙子`】这样的关系，每个 Provider 包含两个值，与该级别对应的 matches 数组（最后的元素时该级别的 route 自身）与 outlet 元素，`outlet` 元素就是嵌套 `RouteContext.Provider` 存放的地方，每个 RouteContext.Provider 的 children 就是 route 的 element 属性。
- 每次使用 `outlet` 实际上都是渲染的内置的路由关系（如果当前 `route` 没有 `element` 属性，则默认渲染 outlet，这也是为什么可以直接写不带 `element` 的`<Route/>`组件嵌套的原因），我们可以在当前级别 route 的 element 中任意地方使用 outlet 来渲染子路由。

# 子路由是如何渲染的 - Outlet & useOutlet

如果你看懂了之前的内容，应该很容易就能猜到，子路由的渲染就是使用的 `useContext` 获取 `RouteContext.Provider` 中的 `outlet` 属性。同样的，react-router 为我们提供了两种调用方式：`<Outlet />`与 `useOutlet`：

```tsx
import { Outlet, useOutlet } from 'react-router';

function Dashboard() {
  const outlet = useOutlet();
  return (
    <div>
      <h1>Dashboard</h1>
      {outlet}
      {/* 或者下面这样 */}
      {/* <Outlet /> */}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<Dashboard />}>
        <Route path='messages' element={<DashboardMessages />} />
        <Route path='tasks' element={<DashboardTasks />} />
      </Route>
    </Routes>
  );
}
```

同时，react-router 还允许我们在 outlet 中传递上下文信息：

```tsx
import { Outlet, useOutlet, useOutletContext } from 'react-router';

function Parent() {
  const [count, setCount] = React.useState(0);
  // 下面两种方式等同
  // const outlet = useOutlet([count, setCount])
  return <Outlet context={[count, setCount]} />;
}

// 在子路由中获取传入的上下文信息
function Child() {
  const [count, setCount] = useOutletContext();
  const increment = () => setCount((c) => c + 1);
  return <button onClick={increment}>{count}</button>;
}
```

## Outlet 与 useOutlet 源码解析

```tsx
// 在 outlet 中传入的上下文信息
const OutletContext = React.createContext<unknown>(null);

/**
 * 可以在嵌套的 routes 中使用，这里的上下文信息是用户在使用 <Outlet /> 或者 useOutlet 时传入的
 */
export function useOutletContext<Context = unknown>(): Context {
  return React.useContext(OutletContext) as Context;
}

/**
 * 拿到当前的 outlet，这里可以直接传入 outlet 的上下文信息
 */
export function useOutlet(context?: unknown): React.ReactElement | null {
  let outlet = React.useContext(RouteContext).outlet;
  // 可以看到，当 context 有值时才使用 OutletContext.Provider，如果没有值会继续沿用父路由的 OutletContext.Provider 中的值
  if (outlet) {
    return (
      <OutletContext.Provider value={context}>{outlet}</OutletContext.Provider>
    );
  }
  return outlet;
}

export interface OutletProps {
  // 可以传入要提供给 outlet 内部元素的上下文信息
  context?: unknown;
}

/**
 * 就是获取 context 上当前的 outlet
 */
export function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}
```

这几个方法本身还是很简单的，这里就不细说了

## 结论

- react-router 中使用`<Outlet />`或 `useOutlet` 渲染子路由，而它们内部实际就是渲染 `RouteContext` 中的 outlet 属性。
- `<Outlet />`和 `useOutlet` 中可以传入上下文信息，在子路由中使用 `useOutletContext` 获取。传入该参数会覆盖掉父路由的上下文信息，如果不传，则会由内向外获取上下文信息。

# 如何让路由跳转 - Navigate & useNavigate

和子路由的渲染一样，react-router 同样提供了两种路由跳转的方式：`<Navigate />`与 `useNavigate`。

```tsx
import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router';

function App() {
  let navigate = useNavigate();
  // 下面两种写法等同
  useEffect(() => {
    navigate('/foo', { replace: true });
  }, []);

  return <Navigate to='/foo' relplace />;
}
```

我们还可以像磁盘路径一样传入相对路径，此时路由会根据当前的 location 跳转。

```tsx
import { useNavigate } from 'react-router';

function SignupForm() {
  let navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    await submitForm(event.target);
    // 跳转到当前路由父路由下面的 success 路径， /auth/signup => /auth/success
    navigate('../success', { replace: true });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

其中，useNavigate 会返回一个 `navigator` 函数，该函数可以用于编程式导航。

## Navigate 与 useNavigate 源码解析

```tsx
// useNavigate 返回的 navigate 函数定义，可以传入 to 或者传入数字控制浏览器页面栈的显示
export interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

export interface NavigateOptions {
  // 是否替换当前栈
  replace?: boolean;
  // 当前导航的 state
  state?: any;
}

/**
 * 返回的 navigate 函数可以传和文件夹相同的路径规则
 */
export function useNavigate(): NavigateFunction {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`
  );

  // Router 提供的 navigator，本质是 history 对象
  let { basename, navigator } = React.useContext(NavigationContext);
  // 当前路由层级的 matches 对象（我们在前面说了，不同的 RouteContext.Provider 层级不同该值不同）
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

  // 依次匹配到的子路由之前的路径（/* 之前）
  let routePathnamesJson = JSON.stringify(
    matches.map((match) => match.pathnameBase)
  );

  // 是否已经初始化完毕（useEffect），这里是要让页面不要在一渲染的时候就跳转，应该在 useEffect 后才能跳转，也就是说如果一渲染就要跳转页面应该写在 useEffect 中
  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  // 返回的跳转函数
  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      if (!activeRef.current) return;

      // 如果是数字
      if (typeof to === 'number') {
        navigator.go(to);
        return;
      }

      // 实际路径的获取，这个方法比较复杂，我们下面单独说
      let path = resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname
      );

      // 有 basename，加上 basename
      if (basename !== '/') {
        path.pathname = joinPaths([basename, path.pathname]);
      }

      (!!options.replace ? navigator.replace : navigator.push)(
        path,
        options.state
      );
    },
    [basename, navigator, routePathnamesJson, locationPathname]
  );

  return navigate;
}

import type { To } from 'history';

export interface NavigateProps {
  // To 从 history 中引入
  /*
    export declare type To = string | PartialPath;
  */
  to: To;
  replace?: boolean;
  state?: any;
}

/**
 * 组件式导航，当页面渲染后立刻调用 navigate 方法，很简单的封装
 */
export function Navigate({ to, replace, state }: NavigateProps): null {
  // 必须在 Router 上下文中
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    `<Navigate> may be used only in the context of a <Router> component.`
  );

  let navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace, state });
  });

  return null;
}
```

可以看到，Navigate 内部还是调用的 useNavigate，而 useNavigate 内部则是对用户传入的路径做处理，获取到最终的路径值，再传递给 NavigationContext 提供 navigator 对象。

### 路径解析

下面是 resolveTo 内部处理路径的详细代码：

```tsx
// Path 对象是定义在 history 中的
import type { Path } from 'history';
/**
 * 将 to 解析为实际要跳转的路径，因为 to 可以是相对路径等，不是完全传入的 /xxx 开头的绝对路径
 * @param toArg 要跳转的路径
 * @param routePathnames 当前的所有父 Route 匹配到的路径
 * @param locationPathname 当前的 location 中的 pathname
 * @returns
 */
function resolveTo(
  toArg: To,
  routePathnames: string[],
  locationPathname: string
  // 返回 Path 对象
): Path {
  let to = typeof toArg === 'string' ? parsePath(toArg) : toArg;
  // 如果 to 没有提供路径名，比如仅仅是改变 search 字符串，返回 /
  let toPathname = toArg === '' || to.pathname === '' ? '/' : to.pathname;

  // 从哪个路由导航，主要是为了处理相对路径关系
  let from: string;
  // 没有提供 to，from 就是当前路径，不会改变 pathname
  if (toPathname == null) {
    from = locationPathname;
  } else {
    // 提供了 to，要去除掉 .. 找到 from，然后把 to 的 .. 消
    // 注意这里的 routePathnames 在外部是通过 matches 映射来的，它的最后一段路由是调用 useNavigate 的路由，而不是 pathname 的最后一段路由
    /**
     * eg: 比如当前 pathname 为 /auth/login，我们在 path = /auth 对应的路由下使用了 useNavigate，然后 navigate('..')，此时回到的页面是 /，而不是 /auth
     */
    let routePathnameIndex = routePathnames.length - 1;

    if (toPathname.startsWith('..')) {
      let toSegments = toPathname.split('/');

      // to 和 a 标签的 href 是不同的，a 标签的 href 不会解析相对路径
      while (toSegments[0] === '..') {
        toSegments.shift();
        // 根据 toPathname 的 .. 数量往前回退
        routePathnameIndex -= 1;
      }

      to.pathname = toSegments.join('/');
    }

    // 如果 .. 的数量超过了父路由的匹配数量，则默认回到根路径 /
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : '/';
  }

  // 注意，此时的 to 只处理了以 .. 开头的情况，还没处理中间有 .. 的情况，包括只有单个 . 的情况
  // 下面进一步根据 to 和 from 转换为 Path 对象
  let path = resolvePath(to, from);

  // 如果 toPathname 以 / 结尾，我们这里也要加上
  if (
    toPathname &&
    toPathname !== '/' &&
    toPathname.endsWith('/') &&
    !path.pathname.endsWith('/')
  ) {
    path.pathname += '/';
  }

  return path;
}
```

上面是用了 `resolvePath` 方法做了进一步的转换，下面是这部分的源码：

```tsx
/**
 * 把传入的路径解析为 Path 对象，并会在这里处理相对路径之间的关系
 */
export function resolvePath(to: To, fromPathname = '/'): Path {
  let { pathname: toPathname, search = '', hash = '' } =
    typeof to === 'string' ? parsePath(to) : to;

  // 通过 to 不是相对路径，直接使用，如果是相对路径，处理相对路径
  let pathname = toPathname
    ? toPathname.startsWith('/')
      ? toPathname
      : // 处理相对路径
        resolvePathname(toPathname, fromPathname)
    : fromPathname;

  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash),
  };
}

/**
 *
 * 处理相对路径
 * @param relativePath 相对路径
 * @param fromPathname 上下文路径
 * @returns
 */
function resolvePathname(relativePath: string, fromPathname: string): string {
  // 去除末尾的 /，然后用 / 分割。如果传入的 fromPathname 为 / 则返回 [""]，注意 [""] 是默认值。最小就是 [""]
  let segments = fromPathname.replace(/\/+$/, '').split('/');
  // 这时的 relativePath 并不是以 / 开头的
  let relativeSegments = relativePath.split('/');

  // 这段代码就是解析路径，将 .. 和 . 这些与父级目录相比较，然后解析成绝对路径
  relativeSegments.forEach((segment) => {
    if (segment === '..') {
      // Keep the root "" segment so the pathname starts at /
      // 注意这里是大于 1。证明这里会保证相对路径最后转换为以 / 开头的绝对路径
      if (segments.length > 1) segments.pop();
    } else if (segment !== '.') {
      // 如果不是 .，添加新的路径，. 代表当前路径，没有作用
      segments.push(segment);
    }
  });

  // 聚合上面的路径数组
  return segments.length > 1 ? segments.join('/') : '/';
}

/**
 * 格式化 search 字符串
 * @param search
 * @returns
 */
const normalizeSearch = (search: string): string =>
  !search || search === '?'
    ? ''
    : search.startsWith('?')
    ? search
    : '?' + search;

/**
 * 格式化 hash 字符串
 * @param hash
 * @returns
 */
const normalizeHash = (hash: string): string =>
  !hash || hash === '#' ? '' : hash.startsWith('#') ? hash : '#' + hash;
```

总的来说，路径解析主要就是将相对路径转换为浏览器能认识的绝对路径。

### 结论

- react-router 中使用`<Navigate />`或 `useNavigate` 跳转路由，但实际内部是使用的 `NavigationContext` 提供的 `navigator` 对象（也就是 history 库提供的路由跳转对象）。
- `<Navigate />`内可以传类似磁盘路径`.`与`..`的相对路径，在内部会依次将每一段路由拆分，最终生成要跳转的绝对路径。

# 核心功能完结，额外的辅助 API

## 方法

### createRoutesFromChildren

将 `Routes` 组件内部的 `Route` 组件转换为符合 `useRoutes` 规范的 `routes` 数组，在 `Routes` 源码解析中讲过。

### generatePath

`generatePath(path , params)`根据传入的 `params` 对象将 path 的动态参数补并返回。

```tsx
/**
 * 将 params 放入 path 对应的动态参数中，比如 /:id/* 与 {id:'foo','*':'bar'} => /foo/bar
 */
export function generatePath(path: string, params: Params = {}): string {
  return path
    .replace(/:(\w+)/g, (_, key) => {
      // 如果 params 中没有完全包含 path 中的动态参数，则报错
      invariant(params[key] != null, `Missing ":${key}" param`);
      return params[key]!;
    })
    .replace(/\/*\*$/, (_) =>
      // 判断路径为 * 的情况
      params['*'] == null ? '' : params['*'].replace(/^\/*/, '/')
    );
}
```

### matchRoutes

`matchRoutes(routes, locationArg, basename)`通过传入的 `routes` 配置项和当前 `location` 得到 `routes` 中能与 `location` 匹配的 `matches` 数组，在 `useRoutes` 源码解析 - 路由匹配阶段中讲过。

### matchPath

`matchPath(pattern, pathname)`通过判断 pathname 是否匹配传入的 pattern，如果不匹配返回 null，如果匹配经过解析后的 match 对象，在 useRoutes 源码解析 - 路由匹配阶段中讲过。

### renderMatches

用于渲染 `matchRoutes` 方法的返回值为 React Element，其实内部就是调用了之前 useRoutes 路由渲染阶段的\_renderMatches 方法。

以下是源码：

```tsx
export function renderMatches(
  matches: RouteMatch[] | null
): React.ReactElement | null {
  return _renderMatches(matches);
}
```

### resolvePath

`resolvePath(to, from)`将 `to` 与 `from` 两个路径相结合生成一个最终要跳转的路径，在 `Navigate` 与 `useNavigate` 源码解析中讲过。

## hooks

### useInRouterContext

判断当前组件是否在 `Router` 上下文中，在 `Router` 源码解析中讲过。

### useLocation

获取当前浏览器的 `location`，在 Router 源码解析中讲过。

### useNavigationType

获取当前浏览器跳转时的 `action type`，在 Router 源码解析中讲过。

### useResolvedPath

`useResolvedPath(to)`根据当前 location 获取解析传入 to 的路径，返回 Path 对象。

```tsx
/**
 * 转换路径的钩子，将 to 格式化为 Path 对象
 * type To = string | PartialPath;
 */
export function useResolvedPath(to: To): Path {
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

  // JSON.stringify 是为了不每次 map 时生成新的地址依赖
  let routePathnamesJson = JSON.stringify(
    matches.map((match) => match.pathnameBase)
  );

  return React.useMemo(
    // resolveTo 在讲 useNavigate 的时候说过，就是处理当前路径与 to 的关系，还有相对路径的转换
    () => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname),
    [to, routePathnamesJson, locationPathname]
  );
}
```

### useHref

`useHref(to)`用自动给传入的 to 路径添加 basename，返回一个新的 url。

```tsx
/**
 * 主要为了通过当前的 pathname，基于上下文的 basename 合并为完整的 url，官方这边建议是用于自定义的 link 组件，这样可以自动添加 basename
 */
export function useHref(to: To): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  );

  let { basename, navigator } = React.useContext(NavigationContext);
  let { hash, pathname, search } = useResolvedPath(to);

  let joinedPathname = pathname;
  // 拿到带 basename 的 href
  if (basename !== '/') {
    // 格式化 to 参数，获取 pathname
    let toPathname = getToPathname(to);
    // 是否结尾带有 /
    let endsWithSlash = toPathname != null && toPathname.endsWith('/');
    joinedPathname =
      pathname === '/'
        ? // 如果是 /，在前面添加 basename
          basename + (endsWithSlash ? '/' : '')
        : // 合并 path
          joinPaths([basename, pathname]);
  }

  // 把 To 对象转换为 string
  return navigator.createHref({ pathname: joinedPathname, search, hash });
}

/**
 * 获取 to 的 pathname
 * @param to
 * @returns
 */
function getToPathname(to: To): string | undefined {
  // Empty strings should be treated the same as / paths
  return to === '' || (to as Path).pathname === ''
    ? '/'
    : typeof to === 'string'
    ? parsePath(to).pathname
    : to.pathname;
}
```

### useMatch

`useMatch(pattern)`一般用于需要根据 pathname 判断组件自身状态时使用。比如 NavLink，当传入的 pattern 能与当前 pathname 匹配则显示 active 状态。

```tsx
/**
 * 查询指定路由是否能匹配上当前的 pathname
 */
export function useMatch<
  ParamKey extends ParamParseKey<Path>,
  Path extends string
>(pattern: PathPattern<Path> | Path): PathMatch<ParamKey> | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  let { pathname } = useLocation();
  return React.useMemo(() => matchPath<ParamKey, Path>(pattern, pathname), [
    pathname,
    pattern,
  ]);
}
```

### useParams

`useParams` 用于获取当前 url 匹配到的所有 params。

```tsx
/**
 * 拿到当前 url 匹配到的所有 params
 */
export function useParams<
  // 可以传入泛型参数手动修改返回类型
  ParamsOrKey extends string | Record<string, string | undefined> = string
>(): Readonly<
  // 如果传入的是 string 的联合类型，代表是必选项，一定会有对应的参数，如果传入对象类型就是可选项
  [ParamsOrKey] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>
> {
  let { matches } = React.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? (routeMatch.params as any) : {};
}
```

## 总结

本文算是一篇对 `react-router v6` 核心原理深度剖析的文章。从最开始的 `Router` 上下文讲起，**讲到了两种路由的配置方式以及实现原理，路由如何计算权重，如何匹配以及如何渲染（这是最核心的地方）**，进而推进到子路由的渲染原理，最后又讲到了两种路由的跳转方式以及对相对路由的解析结果。

除此之外，我们还拓展了 react-router 额外对外暴露的辅助 API，用于辅助用户进行路由相关操作。

react-router v6 是一次全面升级的版本，它带来了更少的代码量与更强大的功能，同时它的核心实现思路也是非常值得借鉴的。如果你想要开发一款独立路由库，或许能够从中得到启发。
