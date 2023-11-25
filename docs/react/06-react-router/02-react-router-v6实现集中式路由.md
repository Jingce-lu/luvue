# react-router v6 实现集中式路由

[[toc]]
升级到 `react-router-dom` v6 之后，然后使用 `react-router-config` 去配置集中式路由，会发现工程报这个错了：

`'Switch' is not exported from 'react-router-dom'....`

原来 react-router-dom v6 这个版本更新了大部分 api，已经不兼容 `react-router-config` 了，但是 v6 版本 react-router-dom 本身就增加了配置集中式路由的支持，下面来看下怎么修改。

先简单介绍一下 v6 版本发生了哪些改变

## 一、v6 的改变

### 0、`〈Route>`路径的变化

- 占位符 `*` 和 `:id`可以用，正则不能用了
- v6 中的所有路径匹配都将忽略 URL 上的尾部 "`/`"

```
// v6
/user/*
/detail/:id
```

### 1、`〈Switch〉`重命名为`〈Routes〉`

只是变了个名称

```jsx
// 原
<Switch>
    <Route path="/index1"><Index1/></Route>
    <Route path="/index2"><Index1/></Route>
</Switch>

// v6
<Routes>
    <Route path="/index1"><Index1/></Route>
    <Route path="/index2"><Index1/></Route>
</Routes>
```

与 Switch 相比，Routes 的主要优点是:

- Routes 内的所有 `<Route>` 和 `<Link>` 是相对的。这使得 `<Route path>` 和 `<Link to>` 中的代码更精简、更可预测
- 路由是根据最佳匹配而不是按顺序选择的
- 路由可以嵌套在一个地方，而不是分散在不同的组件中（当然也可以写在子组件中），而且嵌套的 parent route 的 path 不用加 `*`

```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {* 上面的优点一:path是相对的 *}
        {* 上面的优点三:path 不用加'*' *}
        <Route path="users" element={<Users />}>
          {* 上面的优点二: 无需按顺序 *}
          {* 上面的优点三: 路由可以嵌套在一个地方 *}
          <Route path="me" element={<OwnUserProfile />} />
          <Route path=":id" element={<UserProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Users() {
  return (
    <div>
      <nav>
        {* 上面的优点一: <Link to>是相对的 *}
        <Link to="me">My Profile</Link>
      </nav>
      {* Outlet后面会讲 *}
      <Outlet />
    </div>
  );
}
```

注意上面的第三点，嵌套的 parent route 的 path 不用加`*`。但如果不是嵌套，而是分散在子组件中，就需要尾部加上`*`

```jsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {* 不是嵌套就需要尾部加上* *}
        <Route path="users/*" element={<Users />} />
      </Routes>
    </BrowserRouter>
  );
}
function Users() {
  return (
    <Routes>
      <Route element={<UsserLayout />}>
        <Route path="me" element={<OwnUserProfile />} />
        <Route path=":id" element={<UserProfile />} />
      </Route>
    </div>
  );
}
function UsersLayout() {
  return (
    <div>
      <nav>
        <Link to="me">My Profile</Link>
        <Link to="2">User Profile</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

### 2、`〈Route〉`的 component 变成了 element

Route 的 `render` 或 `component` 改为 `element`

```jsx
// 原
<Route path="/index1" component={Index1} />

// v6
<Route path="/index1" element={<Index1 />} />
```

```jsx
<Route path=":userId" element={<Profile animate={true} /> />

function Profile({ animate }) {
  const params = useParams();
  const location = useLocation();
}
```

通过这种形式：

- 可以向组件传 `props`，如上面的 `animate={true}`
- 因为有了 `hook` 的出现，所以不必再通过 `renderProps` 向组件传递路由的一些 props，我们可以通过 `useParams`、`useLocation` 就可以拿到这些信息

### 2.1 `〈Route path〉`

v6 简化了 path 的格式，只支持两种动态占位符：

- `:id` 样式参数
- `*` 通配符，只能在 `path` 的末尾使用，如 `users/*`

举个 🌰

以下的 path 是正确的：

```jsx
path = '/groups';
path = '/groups/admin';
path = '/users/:id';
path = '/users/:id/messages';
path = '/files/*'; // 通配符放在末尾
path = '/files/:id/*';
path = '/files-*';
```

以下的 path 是错误的

```jsx
path = '/users/:id?'; // ? 不满足上面两种格式
path = '/tweets/:id(d+)'; // 有正则，不满足上面两种格式
path = '/files/*/cat.jpg'; // 通配符不能放中间
```

### 2.2 `〈Route index〉`

`index` 即表示是否是主路由，如果设置为 `true` 的话`不能有 children`，如下面的`<Route index element={<Home />} />`

```jsx
function App() {
  return (
    <Routes>
      <Route path='/' element={<Layout />}>
        <Route path='auth/*' element={<Auth />} />
        <Route path='basic/*' element={<Basic />} />
      </Route>
    </Routes>
  );
}
function Home() {
  return <h2> Home </h2>;
}
function Basic() {
  return (
    <div>
      <h1>Welcome to the app!</h1>
      <h2>下面()中的就是真实的Link组件</h2>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='about' element={<About />} />
          ...
        </Route>
      </Routes>
    </div>
  );
}
```

那么`/basic`会自动显示`<Home />`

<img :src="$withBase('/images/react/06-react-router/react-router-v6-092501.awebp')" alt="react/06-react-router/react-router-v6-092501.awebp">

### 3、`〈Outlet〉`渲染子路由

用来渲染子路由，我理解类似于 `props.children` 和 `react-router-config` 的 `renderRoutes`，或者 vue 的`<router-view>`

```jsx
<BrowserRouter>
  <Routes>
    <Route path='/' element={<Home />} />
    <Route path='/content' element={<Content />}>
      <Route path='index1' element={<Index1 />} />
      <Route path='index2' element={<Index2 />} />
    </Route>
  </Routes>
</BrowserRouter>;

// Content
import { Outlet } from 'react-router-dom';

function Content() {
  return (
    <div>
      <title>这是Content</title>

      {/* 这里渲染子路由！！ */}
      <Outlet />
      {/* 这里渲染子路由！！ end */}
    </div>
  );
}
```

### 4. `useHistory` 没了，用 `useNavigate` 作为替代，页面跳转写法改变

```jsx
// 原
import { useHistory } from 'react-router-dom';
...
const history = useHistory()
history.push('/index1')
history.replace('/index2')
...


// v6
import { useNavigate } from 'react-router-dom';
...
const navigate = useNavigate();
navigate('/index1')
navigate('/index2', {replace: true})
...
```

### 5、`〈Redirect/〉`没了，新增`〈Navigate/〉`替代

用法感觉没什么区别。。。

```jsx
<Redirect to='index1' />
<Navigate to='index1' />
```

### 6、重头戏来了，新增了 `useRoutes`，可以替代 `react-router-config`

通过 `useRoutes` 渲染路由，传入我们已经集中配置好的 `routes`

```jsx
const routes = {
  path: '/',
  element: <SecurityLayout />,
  children: [
    { path: '', element: <Navigate to='/user/login' /> }, // Redirect 重定向！
    {
      path: '',
      element: <BasicLayout />,
      children: [
        // BasicLayout 业务页面
        {
          path: 'index1',
          element: <Index1 />,
        },
        {
          path: 'index2',
          element: <Index2 />,
        },
      ],
    },
  ],
};
function RenderRoutes() {
  const element = useRoutes(routes);
  return element;
}
```

## 二、使用 useRoutes 实现 react-router-config 需要做的修改

### 1、修改 routes

- 父级的路由后面要加上 `*`，进行匹配
- `子路由不必带着父级路由的 path`，例：只需要写'login'就行，不用写成'user/login'
- `component` 改成 `element`
- 子路由的 key 从'routes'改成'children'
- 如果有重定向的，使用 element: `<Navigate />`

```js
import Login from '@/pages/login';

const routes = [
  // UserLayout
  {
    path: 'user/*',
    element: <UserLayout />,
    children: [
      { path: '', element: <Navigate to='login' /> }, // Redirect
      {
        path: 'login',
        element: <Login />,
      },
      route404,
    ],
  },
];
```

### 2、App.jsx 中， `useRoutes` 要放在 function App 的外面

其实准确的说是，`useRoutes` 所在的组件，要在`<Router>`的内部

看到 useRoutes 的介绍之后，我一开始是这么写的：

```js
import { HashRouter, useRoutes } from 'react-router-dom';
import routes from '@/router';

function App() {
  const element = useRoutes(routes);
  return (
    <HashRouter>
      <ContextProvider>{element}</ContextProvider>
    </HashRouter>
  );
}
```

结果报错了！

所以，其实是 `useRoutes` 所在的组件，必须在`<Router>`中，所以改成这样就好了：

```jsx
import { HashRouter, useRoutes } from 'react-router-dom';
import routes from '@/router';
// 渲染路由
function RouteElement() {
  const element = useRoutes(routes);
  return element;
}
function App() {
  return (
    <HashRouter>
      <ContextProvider>
        <RouteElement />
      </ContextProvider>
    </HashRouter>
  );
}
```

### 3、父级组件中渲染子路由使用`〈Outlet〉`

```jsx
// 原v5
import { renderRoutes } from 'react-router-config';
import routes from './router.config';

function renderChildren(o) {
  // 可能是props或者routes。props:props.route.routes
  let routes = [];
  if (Object.prototype.toString.call(o) === '[object Array]') {
    routes = o;
  } else if (Object.prototype.toString.call(o) === '[object Object]') {
    routes = o.route?.routes || [];
  }

  return renderRoutes(routes);
}

// UserLayout 使用react-router-config的renderRoutes去渲染
function Index(props) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {renderChildren(props.route.routes)} // 这里渲染子路由
      </div>
      <Footer />
    </div>
  );
}
```

```jsx
// v6 直接使用Outlet就行了
// UserLayout
import React from 'react';
import Footer from '@/components/layout/Footer';
import styles from './index.less';
import { Outlet } from 'react-router-dom'; // Outlet用于渲染children
function Index() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Outlet /> // 这里渲染子路由
      </div>
      <Footer />
    </div>
  );
}
```

### 4、组件中用到 `useHistory` 的地方都要替换成 `useNavigate`

### 5、v6 中 React.lazy 的实现

这些修改之后，各自对应的功能都没问题了，但是发现原来的 React.lazy 不好用了，先看下原来的写法：

```jsx
// 原v5

// routes里
const routes = [
  ...
  {
    path: '/user/login',
    component: React.lazy(() => import('../pages/login')) // 路由懒加载
  },
  ...
]

// Suspense放在了App.jsx里，相当于是路由的最外层
function App() {
    return (
        <HashRouter>
            <Suspense fallback={<LazyLoading />}>
                <ContextProvider>{renderChildren(routes)}</ContextProvider>
            </Suspense>
        </HashRouter>
    );
}
```

v6 中，`Suspense` 要放在路由的 `element` 上：

```jsx
// v6

// routes里
const Login_lazy = lazy(() => import('@/pages/login'))  // 路由懒加载

const routes = [
  ...
  {
    path: 'login',
    element: (
        <Suspense fallback={<LazyLoading />}>  // 这里包裹Suspense
          <Login_lazy />
        </Suspense>
    )
  },
  ...
]

// 删除App.jsx里的Suspense
function App() {
    return (
        <HashRouter>
            <ContextProvider>
                <RouteElement />
            </ContextProvider>
        </HashRouter>
    );
}
```

这样 react-router v6 的路由懒加载就可以用了

routes 这样写的话，每个 element 都要写一个 Suspense，我们可以简化一下：

```jsx
const routes = [
  ...
  // BasicLayout 业务页面
  {
    path: 'index1',
    element: () => import('@/pages/index1')
  },
  {
    path: 'index2',
    element: () => import('@/pages/index2')
  },
  ...
]

function LazyElement(props) {
  const { importFunc } = props
  const LazyComponent = lazy(importFunc)
  return (
    <Suspense fallback={<div>路由懒加载...</div>}>
      <LazyComponent />
    </Suspense>
  )
}

// 处理routes 如果element是懒加载，要包裹Suspense
function dealRoutes(routesArr) {
  if (routesArr && Array.isArray(routesArr) && routesArr.length > 0) {
    routesArr.forEach((route) => {
      if (route.element && typeof route.element == 'function') {
        const importFunc = route.element
        route.element = <LazyElement importFunc={importFunc} />
      }
      if (route.children) {
        dealRoutes(route.children)
      }
    })
  }
}
dealRoutes(routes)

export default routes
```
