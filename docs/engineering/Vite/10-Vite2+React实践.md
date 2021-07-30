# Vite 2 + React 实践

[[toc]]

本文源码地址在 [vite-playgrounds](https://github.com/Ivocin/vite-playgrounds/tree/main/vite-react) 中

## 初始化项目

```sh
$ npm init @vitejs/app
```

选择项目名和模板：

<div align="center"><img :src="$withBase('/images/vite/vite38.awebp')" alt="vite/vite38.awebp"></div>

<div align="center"><img :src="$withBase('/images/vite/vite39.awebp')" alt="vite/vite39.awebp"></div>

安装依赖并启动：

```sh
$ cd vite-react
$ npm install
$ npm run dev
```

<div align="center"><img :src="$withBase('/images/vite/vite40.awebp')" alt="vite/vite40.awebp"></div>

对比使用 `webpack` 搭建 `React` 环境可以看出，使用 `Vite` 后，添加 `Babel、React、webpack-dev-server` 的工作都可以省略了：

<div align="center"><img :src="$withBase('/images/vite/vite41.awebp')" alt="vite/vite41.awebp"></div>

## 添加 Antd 爬坑记

### 样式爬坑记

```sh
$ npm install antd
```

在 `App.jsx` 中引入 `antd` ：

```js
import { DatePicker } from ‘antd’;
```

保存后，页面 `reload`，注意不是 `HMR`，此时 `Antd` 已经被引入：

<div align="center"><img :src="$withBase('/images/vite/vite42.awebp')" alt="vite/vite42.awebp"></div>

然后我们来添加 `DatePicker`，发现没有样式：

<div align="center"><img :src="$withBase('/images/vite/vite43.awebp')" alt="vite/vite43.awebp"></div>

按照 antd 官网文档指引，引入 `CSS` 样式，稍微好了一些，但是仍然不正常：

<div align="center"><img :src="$withBase('/images/vite/vite44.awebp')" alt="vite/vite44.awebp"></div>

尝试引入 `Less`，直接报错：

<div align="center"><img :src="$withBase('/images/vite/vite45.awebp')" alt="vite/vite45.awebp"></div>

`Vite` 内置支持 `Less`，但是使用需要用户手动安装 `Less`，详见官网文档：[Features # CSS Pre-processors](https://vitejs.dev/guide/features.html#css-pre-processors)

```sh
$ npm install -D less
```

安装完重新启动，又出现了新的错误：

<div align="center"><img :src="$withBase('/images/vite/vite46.awebp')" alt="vite/vite46.awebp"></div>

熟悉的味道，是 `Antd` 的报错没错了。错误信息里提示可以看这个 [Issue](https://github.com/ant-design/ant-motion/issues/44)，没看这个 Issue 有两年了，发现这个 Issue 越来越大了，因为期间 `less-loader` 升级又带来了新坑。解决方案总结起来就是在 `webpack` 的 `less-loader` 中开启 `javascriptEnabled`，详见这个 [Commit](https://github.com/Ivocin/webpack-playgrounds/commit/3fb70ba9c857ca7cd7e356a5f2c4166b3f37c3c3#diff-cb5bbe1acca2b85cc0de0a2408425020a4770aa1e949f26fea00e4581570a9c8)

那么在 `Vite` 中怎么做呢，`Vite` 也开放了 `CSS` 预处理器的配置，详见官网文档 ，在 `vite.config.js` 文件中添加如下配置：

```js
// vite.config.js
...
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    }
  }
...
```

终于，样式正常了：

<div align="center"><img :src="$withBase('/images/vite/vite47.awebp')" alt="vite/vite47.awebp"></div>

### 有关使用全量 Antd 包的警告分析

另外需要注意的一点是，打开调试窗口，又一个熟悉的警告又出现了，相信早期使用 `Antd` 开发的同学都不陌生：

<div align="center"><img :src="$withBase('/images/vite/vite48.awebp')" alt="vite/vite48.awebp"></div>

原来的项目使用的是 `webpack`，在 `webpack@2` 之后，就支持 `ES` 模块的`tree shaking` 了，这个警告不会出现。

而在 `Vite` 中，我们可以查看[官方文档](https://vitejs.dev/guide/features.html#npm-dependency-resolving-and-pre-bundling)，Vite 会对 `npm` 依赖进行预构建并重写为合法的 `url`。在本项目中，`Vite` 将 `Antd` 预构建到 `/node_moduls/.vite` 文件夹，并且将 `url` 重写为 `/node_modules/.vite/antd.js?v=d2a18218`，因此会出现这个警告。

<div align="center"><img :src="$withBase('/images/vite/vite49.awebp')" alt="vite/vite49.awebp"></div>

不过不用担心，在生产包仍然会进行 `tree shaking`。而开发环境即使引入全量的 `Antd` 包，`Vite` 基于 `esbuild` 的预编译速度超快，而且之后浏览器会缓存住这个包，开发体验不降反升，这个警告就可以忽略了。

### 更换主题

按照官网的指引，使用 `less` 的 `modifyVar` 来覆盖 `less` 变量，从而达到改变主题的目的，[定制主题 - Ant Design](https://ant.design/docs/react/customize-theme-cn)
和 `webpack` 配置在 `less-loader` 里不同， 在 `Vite` 中则简单很多，仍然在 `less` 的 `option` 里配置就可以了：

```js
// vite.config.js
...
      less: {
        javascriptEnabled: true,
        modifyVars: {
          "primary-color": "#1DA57A",
          "link-color": "#1DA57A",
          "border-radius-base": "2px",
        },
      },
...
```

可以看到样式生效了：

<div align="center"><img :src="$withBase('/images/vite/vite50.awebp')" alt="vite/vite50.awebp"></div>

按照这个思路，我们修改为暗黑主题也比较简单了：

```js
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { getThemeVariables } from 'antd/dist/theme';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          ...getThemeVariables({
            dark: true,
          }),
          ...{
            'primary-color': '#1DA57A',
            'link-color': '#1DA57A',
            'border-radius-base': '2px',
          },
        },
      },
    },
  },
});
```

没问题，暗黑主题生效：

<div align="center"><img :src="$withBase('/images/vite/vite51.awebp')" alt="vite/vite51.awebp"></div>

## 配置代理，能通过 RESTFul 的方式访问

参考官网的 `server.proxy` 配置，这里需要特别注意 `proxy` 的写法和我们之前使用的 `webpack-dev-server` 里面的 `proxy` 配置稍有不同，如下：

```js
// vite.config.js
  server: {
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
```

此时我们访问 http://localhost:3000/api/users ，就能访问到 jsonplaceholder.typicode.com/users 的数据了

<div align="center"><img :src="$withBase('/images/vite/vite52.awebp')" alt="vite/vite52.awebp"></div>

## 集成 React Router

下面我们来添加菜单和路由，首先引入 React Router：

```sh
$ npm i react-router-dom
```

新建 `index.jsx` 文件：

```jsx
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import App from './App';

export default function Index() {
  return (
    <Router>
      <Switch>
        <Route path="/app">
          <App />
        </Route>
      </Switch>
    </Router>
  );
}
```

修改 `main.jsx` 文件，将 `App` 替换为 `Index`：

```diff
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
- import App from './App'
+ import Index from './index'

ReactDOM.render(
  <React.StrictMode>
-   <App />
+   <Index />
  </React.StrictMode>,
  document.getElementById('root')
)
```

此时访问 http://localhost:3000/app 可以访问到 App 页面，路由生效。

我们再来增加一个菜单，新建 Layout.jsx 文件：

```js
import React from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';

export default function Layout() {
  return (
    <Menu selectedKeys="App" mode="horizontal">
      <Menu.Item key="App">
        <Link to="/app">App</Link>
      </Menu.Item>
    </Menu>
  );
}
```

最后在 index.jsx 引入 Layout 文件，以上过程详见 这个 [Commit](https://github.com/Ivocin/vite-playgrounds/commit/728acc2133e1a542e37b1b4bf09f0bd18323c46c)

## 注意别名的用法 —— breaking change

注意 `Vite@2` 的 `UserConfig.alias` 已经过时，改为使用 `resolve.alias` 替代，写法也和 Vite@1 不一样，详见 [官网文档 - resolve-alias](https://vitejs.dev/config/#resolve-alias) 和 [rollup plugins 文档](https://github.com/rollup/plugins/tree/master/packages/alias#regular-expression-aliases)

```js
// vite.config.js
...
import path from "path";
...
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: path.resolve(__dirname, "src"),
      },
    ],
  },

...
```

然后我们调整文件结构，然后使用别名代替相对路径，详见 这个 [Commit](https://github.com/Ivocin/vite-playgrounds/commit/279e144ce9a26988989791f2616d3d9098f164b7)

## 用户列表页面

接下来我们开发一个模拟真实接口的用户列表 ，参考 [umi@2 + dva，完成用户管理的 CURD 应用](https://juejin.cn/post/6844903672665604104) 的步骤

### 新建 User 页面

添加 User 路由和页面，详见这个 [Commit](https://github.com/Ivocin/vite-playgrounds/commit/7dc0b05bb2f16eb6046af1dd0b54e95fb4d30363)。

此时访问 http://localhost:3000/user 就能看到新增的 `User` 页面了：

<div align="center"><img :src="$withBase('/images/vite/vite53.awebp')" alt="vite/vite53.awebp"></div>

### 请求接口爬坑记

请求接口数据，这里使用 [ahooks](https://ahooks.js.org/zh-CN) 的 `use-request`

这里使用 `npm 7` 安装 会报错：

<div align="center"><img :src="$withBase('/images/vite/vite54.awebp')" alt="vite/vite54.awebp"></div>

因为 `npm 7` 会自动安装 `peerDependency`，而 `ahooks` 的 `peerDependency` 是 `react@^16.8.6` ，导致与本项目的 `react@17` 版本冲突报错，这个问题已经在 [这个 pr](https://github.com/alibaba/hooks/pull/871) 里修复了，但是目前还没有发包，暂时使用 `yarn` 绕过这个问题：

```sh
$ yarn add @ahooksjs/use-request
```

现在就可以使用 `use-request` 请求 `/api/users` 获取用户信息了：

```js
const { data, error, loading } = useRequest('/api/users');
```

### 展示数据

接口请求的坑填好后，就可以展示用户信息了。我们来添加一个表格展示用户信息，详见 这个 [Commit](https://github.com/Ivocin/vite-playgrounds/commit/6979cbc55f818baccc01eb2842913f1e7cca0804)。

`use-request` 返回了 `loading`，再结合 `antd table` 组件的 `loading`，处理 `loading` 就很方便了：

<div align="center"><img :src="$withBase('/images/vite/vite55.awebp')" alt="vite/vite55.awebp"></div>

至此，模拟接口请求数据的页面就完成了。

### 关于分页的坑

由于我们接口采用模拟接口，分页信息在 `Response Headers` 里面，请求 [jsonplaceholder.typicode.com/users?\_page…](http://jsonplaceholder.typicode.com/users?_page=1&_limit=5) 可以看到：

<div align="center"><img :src="$withBase('/images/vite/vite56.awebp')" alt="vite/vite56.awebp"></div>

查看了 `ahooks` 的 `API`，发现并没有对 `Response Headers` 的处理功能，查看 [源码](https://github.com/alibaba/hooks/blob/3a7b7d550f388c4fd0d07f975c812b626d96d27a/packages/use-request/src/index.ts) 发现确实目前没有办法拿到 `Headers` 里的值：

<div align="center"><img :src="$withBase('/images/vite/vite57.awebp')" alt="vite/vite57.awebp"></div>

真实接口一般分页信息都会在 `Response Body` 中，分页数据就很容易处理了，这个坑就不费时间填了。

## What Else

当然没有结束，不过剩下的过程就比较常规了，罗列如下：

- 集成 Redux，或者使用封装过的 dva.js
- 约定式路由
- 还记得 `babel-plugin-import` 吗，在 Vite 中，如果想样式按需加载，可以尝试使用这个插件：`vite-plugin-style-import`，现在已经支持 Vite 2 了
- 想使用 `TypeScript`，可以使用 `@vitejs/create-app` 的 `react-ts` 模板，然后按照本文的步骤配置即可
- `Production Mode、SSR`，参照官网配置即可
