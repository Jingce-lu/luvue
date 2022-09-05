# CRA-自定义配置

[[toc]]

## 一、config-overrides.js 配置

1. 需要安装 react-app-rewired customize-cra
   ```js
   yarn add react-app-rewired customize-cra -D
   ```
2. 修改 package.json 文件
   ```js
   "scripts": {
       "start": "react-app-rewired start",
       "build": "react-app-rewired build",
       "test": "react-app-rewired test --env=jsdom",
       "eject": "react-scripts eject"
     },
   ```
3. 在项目根目录新建 config-overrides.js
   ```js
   const { override } = require('customize-cra');
   module.exports = {};
   ```
4. 添加配置，跨域设置、增加 less 支持、px 转 rem、ant-design 按需加载、打包压缩 js 和 css

   ```js
   // 安装less less-loader
   yarn add less less-loader -D
   // 安装compression-webpack-plugin 压缩js为gzip
   yarn add compression-webpack-plugin -D

   const { override, overrideDevServer, addLessLoader, addPostcssPlugins, fixBabelImports } = require('customize-cra');
   const CompressionWebpackPlugin = require('compression-webpack-plugin');
   // 打包配置
   const addCustomize = () => config => {
     if (process.env.NODE_ENV === 'production') {
       // 关闭sourceMap
       config.devtool = false;
       // 配置打包后的文件位置
       config.output.path = __dirname + '../dist/demo/';
       config.output.publicPath = './demo';
       // 添加js打包gzip配置
       config.plugins.push(
         new CompressionWebpackPlugin({
           test: /.js$|.css$/,
           threshold: 1024,
         }),
       )
     }
     return config;
   }
   // 跨域配置
   const devServerConfig = () => config => {
     return {
       ...config,
       // 服务开启gzip
       compress: true,
       proxy: {
         '/api': {
           target: 'xxx',
           changeOrigin: true,
           pathRewrite: {
             '^/api': '/api',
           },
         }
       }
     }
   }
   module.exports = {
     webpack: override(
       fixBabelImports('import', {
         libraryName: 'antd-mobile',
         style: 'css',
       }),
       addLessLoader(),
       addPostcssPlugins([require('postcss-pxtorem')({ rootValue: 75, propList: ['*'], minPixelValue: 2, selectorBlackList: ['am-'] })]),
       addCustomize(),
     ),
     devServer: overrideDevServer(
       devServerConfig()
     )
   }
   ```

5. antd、假设我们要使用 antd，参考 高级配置 文档。
   ```sh
   npm i --save-dev babel-plugin-import
   npm i --save antd
   ```
   ```js
   const {
     override,
     fixBabelImports,
     addLessLoader,
   } = require('customize-cra');
   module.exports = override(
     fixBabelImports('import', {
       libraryName: 'antd',
       libraryDirectory: 'es',
       style: true,
     }),
     addLessLoader({
       javascriptEnabled: true,
       modifyVars: { '@primary-color': '#1DA57A' },
       localIdentName: '[local]--[hash:base64:5]', // 自定义 CSS Modules 的 localIdentName
     })
   );
   ```
6. decorators 在 create-react-app 的 Can I Use Decorators 文档中说，当前它并不是一个文档的规范，默认不推荐使用，如果要使用，需要自己手动开启。
   ```sh
   npm i --save-dev @babel/plugin-proposal-decorators
   ```
   ```js
   const {
     override,
     fixBabelImports,
     addLessLoader,
     addDecoratorsLegacy,
   } = require('customize-cra');
   module.exports = override(
     addDecoratorsLegacy(),
     fixBabelImports('import', {
       libraryName: 'antd',
       libraryDirectory: 'es',
       style: true,
     }),
     addLessLoader({
       javascriptEnabled: true,
       modifyVars: { '@primary-color': '#1DA57A' },
       localIdentName: '[local]--[hash:base64:5]', // 自定义 CSS Modules 的 localIdentName
     })
   );
   ```
7. 添加别名
   ```js
   const {
     override,
     fixBabelImports,
     addLessLoader,
     addDecoratorsLegacy,
     addWebpackAlias,
   } = require('customize-cra');
   module.exports = override(
     addDecoratorsLegacy(),
     addWebpackAlias({
       ['ag-grid-react$']: path.resolve(
         __dirname,
         'src/shared/agGridWrapper.js'
       ),
     }),
     fixBabelImports('import', {
       libraryName: 'antd',
       libraryDirectory: 'es',
       style: true,
     }),
     addLessLoader({
       javascriptEnabled: true,
       modifyVars: { '@primary-color': '#1DA57A' },
       localIdentName: '[local]--[hash:base64:5]', // 自定义 CSS Modules 的 localIdentName
     })
   );
   ```
8. 添加 react-hot-reloader、在根组件处开启 react-hot-reloader

   ```sh
   # https://www.npmjs.com/package/react-hot-loader
   # https://github.com/cdharris/react-app-rewire-hot-loader

   $ npm i react-hot-loader -D

   $ npm i react-app-rewire-hot-loader @hot-loader/react-dom -D
   ```

   随后在 App.js 中做如下设置

   ```js
   import React, { Component } from 'react';
   import { hot } from 'react-hot-loader/root';
   class App extends Component {
     render() {
       return <>测试</>;
     }
   }
   const AppHot = process.env.NODE_ENV === 'development' ? hot(App) : App;

   export default AppHot;
   ```

9. 关闭 sourceMap
   方案一：修改 package 中 scripts 里的 build

   ```sh
   "build": "GENERATE_SOURCEMAP=false react-app-rewired build"
   ```

   方案二：

   ```js
   const rewiredMap = () => config => {
     config.devtool =
       config.mode === 'development' ? 'cheap-module-source-map' : false;

     return config;
   };
   ```

## 整体配置文件如下

```js
const {
  override,
  fixBabelImports,
  addLessLoader,
  addWebpackAlias,
  addBabelPlugins,
  addWebpackPlugin,
  useBabelRc,
  disableChunk,
  adjustWorkbox,
  setWebpackPublicPath,
  addBundleVisualizer,
  disableEsLint,
  addWebpackExternals,
  // addBundleVisualizer
} = require('customize-cra');

const path = require('path');
const paths = require('react-scripts/config/paths');
const rewireReactHotLoader = require('react-app-rewire-hot-loader');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
// const rewireCompressionPlugin = require('react-app-rewire-compression-plugin')
const rewireUglifyjs = require('react-app-rewire-uglifyjs');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 补充：对开发友好，打包完成桌面提醒
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

const webpackConfig = require('./webpack.config.js');
// const ProgressBarPlugin = require('progress-bar-webpack-plugin')

// const Dashboard = require('webpack-dashboard')
// const DashboardPlugin = require('webpack-dashboard/plugin')
// const dashboard = new Dashboard()

const theme = require('./theme');
// SKIP_PREFLIGHT_CHECK = true

/**
 * 生产环境是否打包 Source Map 两种方法
 *
 */
const rewiredMap = () => config => {
  config.devtool =
    config.mode === 'development' ? 'cheap-module-source-map' : false;

  return config;
};
process.env.PORT = 3006;

process.env.GENERATE_SOURCEMAP !== 'false';

console.log(process.env.NODE_ENV);

// const addWebpackModules = () => config => {
//   const loaders = config.module.rules.find(rule => Array.isArray(rule.oneOf)).oneOf
//   loaders[loaders.length - 4] = Object.assign(
//     loaders[loaders.length - 4],
//     webpackConfig.module.rules[0]
//   )
//   return config
// }

// path
const resolveAlias = dir => path.join(__dirname, '.', dir);
// 热跟新
const hotLoader = () => (config, env) => {
  config = rewireReactHotLoader(config, env);
  return config;
};
// build--->prod --->文件设置
const appBuildPathFile = () => config => {
  if (config.mode === 'development') {
    console.log('evn is development, skip build path change...');
  } else if (config.mode === 'production') {
    console.log('evn is production, change build path...');
    // 关闭sourceMap
    config.devtool = false;
    //  // 配置打包后的文件位置修改path目录
    paths.appBuild = path.join(path.dirname(paths.appBuild), 'dist');
    config.output.path = path.join(path.dirname(config.output.path), 'dist');
    // 添加js打包gzip配置
    // config.plugins.push(
    //   new CompressionWebpackPlugin({
    //     test: /.js$|.css$/,
    //     threshold: 1024
    //   })
    // )
    // 更改生产模式输出的文件名
    // config.output.filename = 'static/js/[name].js?_v=[chunkhash:8]'
    // config.output.chunkFilename = 'static/js/[name].chunk.js?_v=[chunkhash:8]'
  }
  return config;
};
//生产环境去除console.* functions
const dropConsole = () => {
  return config => {
    if (config.optimization.minimizer) {
      config.optimization.minimizer.forEach(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }
    return config;
  };
};
/**
 *
 * @description 解决打包的时候如下报错
 * @url{https://github.com/ant-design/ant-design/issues/15696}
 * https://blog.csdn.net/peade/article/details/84890399
chunk 3 [mini-css-extract-plugin]
Conflicting order between:
 * css ./node_modules/css-loader/dist/cjs.js??ref--6-oneOf-7-1!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js??ref--6-oneOf-7-3!./node_modules/antd/es/input/style/index.less
 * css ./node_modules/css-loader/dist/cjs.js??ref--6-oneOf-7-1!./node_modules/postcss-loader/src??postcss!./node_modules/less-loader/dist/cjs.js??ref--6-oneOf-7-3!./node_modules/antd/es/message/style/index.less
 */
const delConflictingOrder = () => {
  return config => {
    for (let i = 0; i < config.plugins.length; i++) {
      const p = config.plugins[i];
      if (!!p.constructor && p.constructor.name === MiniCssExtractPlugin.name) {
        const miniCssExtractOptions = { ...p.options, ignoreOrder: true };
        config.plugins[i] = new MiniCssExtractPlugin(miniCssExtractOptions);
        break;
      }
    }
  };
};

const addMiniCssExtractPlugin = () => {
  return config => {
    config.plugins.unshift(
      new FilterWarningsPlugin({
        // exclude: /any-warnings-matching-this-will-be-hidden/
        // exclude: /mini-css-extract-plugin[^]*Conflicting order between:/
        exclude: /[mini-css-extract-plugin][^]*Conflicting order between:/,
      })
    );
  };
};

const proxyApi = {
  '/api': {
    // target: '', // prod
    changeOrigin: true,
    secure: false,
    xfwd: false,
    pathRewrite: {
      '^/api': '/',
    },
  },
  '/store': {
    // target: '', // staging
    changeOrigin: true,
    secure: false,
    xfwd: false,
    pathRewrite: {
      '^/store': '/',
    },
  },
};

module.exports = {
  webpack: override(
    fixBabelImports('import', {
      libraryName: 'antd',
      libraryDirectory: 'es',
      style: true,
    }),
    addLessLoader({
      // strictMath: true,
      noIeCompat: true,
      javascriptEnabled: true,
      modifyVars: { ...theme },
      // localIdentName: '[local]--[hash:base64:5]', // 自定义 CSS Modules 的 localIdentName
    }),
    setWebpackPublicPath('/hostsec'), // 修改 publicPath
    addWebpackExternals({
      React: 'React',
      lodash: 'Lodash',
    }),
    // addWebpackModules(),
    addWebpackAlias({
      '@': resolveAlias('src'),
      lib: resolveAlias('src/lib'),
      components: resolveAlias('src/components'),
      images: resolveAlias('src/assets/images'),
      styled: resolveAlias('src/assets/styled'),
      views: resolveAlias('src/views'),
      store: resolveAlias('src/store'),
      router: resolveAlias('src/router'),
      locale: resolveAlias('src/locale'),
      // 处理警告  React-Hot-Loader: react-??-dom patch is not detected. React 16.6+ features may not work.
      'react-dom': '@hot-loader/react-dom',
      // 解决antd 的icon图标打包体积大
      // '@ant-design/icons': 'purched-antd-icons'
    }),

    disableEsLint(),
    appBuildPathFile(),
    disableChunk(),
    dropConsole(),
    // 关闭mapSource
    rewiredMap(),
    // 热跟新
    hotLoader(),
    // 配置babel解析器
    addBabelPlugins(['@babel/plugin-proposal-decorators', { legacy: true }]),
    //启用ES7的修改器语法（babel 7）
    // ['@babel/plugin-proposal-decorators', {legacy: true}],
    // ['@babel/plugin-proposal-class-properties', {loose: true}],
    // 打包编译完成提醒
    addWebpackPlugin(
      new WebpackBuildNotifierPlugin({
        title: '',
        logo: path.resolve('./public/logo.svg'),
        suppressSuccess: true,
      }),
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash].css',
        chunkFilename: 'static/css/[id].[contenthash].css',
        ignoreOrder: false,
        // moduleFilename: ({ name }) => `${name.replace('/js/', '/css/')}.css`
      }),
      // 美化控制台
      // new DashboardPlugin(dashboard.setData),
      // 进度条
      // new ProgressBarPlugin(),
      delConflictingOrder(),
      addMiniCssExtractPlugin()
    ),
    rewireUglifyjs,
    // rewireCompressionPlugin,
    // 允许使用.babelrc文件进行Babel配置。
    useBabelRc(),
    // add webpack bundle visualizer if BUNDLE_VISUALIZE flag is enabled
    process.env.BUNDLE_VISUALIZE == 1 && addBundleVisualizer(),

    adjustWorkbox(wb =>
      Object.assign(wb, {
        skipWaiting: true,
        exclude: (wb.exclude || []).concat('index.html'),
      })
    )
    // addDecoratorsLegacy() // 解析器,
  ),
  // 配置devServer
  // devServer: overrideDevServer(
  //   // dev server plugin
  //   watchAll(),
  // ),
  // 配置devServer
  devServer: configFunction => (proxy, allowedHost) => {
    proxy = process.env.NODE_ENV === 'development' ? proxyApi : null;
    // allowedHost： 添加额外的地址
    const config = configFunction(proxy, allowedHost);
    return config;
  },
};
```

## 三、其他 API

- customizers
  - addTslintLoader
  - addExternalBabelPlugin
  - addExternalBabelPlugins
  - addBabelPlugin
  - addBabelPlugins
  - addBabelPreset
  - addBabelPresets
  - babelInclude
  - babelExclude
  - removeInternalBabelPlugin
  - fixBabelImports
  - addDecoratorsLegacy
  - useBabelRc
  - disableEsLint
  - useEslintRc
  - enableEslintTypescript
  - addWebpackAlias
  - addWebpackResolve
  - addWebpackPlugin
  - addWebpackExternals
  - addWebpackModuleRule
  - setWebpackTarget
  - setWebpackStats
  - addBundleVisualizer
  - setWebpackOptimizationSplitChunks
  - adjustWorkbox
  - addLessLoader
  - addPostcssPlugins
  - disableChunk
  - removeModuleScopePlugin
  - watchAll
  - adjustStyleLoaders
- utilities
  - getBabelLoader
  - tap
