# 进阶 Vue 篇（二）

[[toc]]

## 一.vue-cli 项目创建

### 1.安装

```sh
npm install -g @vue/cli
npm install -g @vue/cli-service-global
vue create vue-online-edit
```

### 2.初始化

```sh
? Check the features needed for your project:
 (*) Babel
 ( ) TypeScript
 ( ) Progressive Web App (PWA) Support
 ( ) Router
 ( ) Vuex
>(*) CSS Pre-processors
 ( ) Linter / Formatter
 ( ) Unit Testing
 ( ) E2E Testing
```

```sh
? Pick a CSS pre-processor (PostCSS, Autoprefixer and CSS Modules are supported by default)
  Sass/SCSS (with dart-sass)
  Sass/SCSS (with node-sass)
  Less
> Stylus
```

## 二.Vue 组件通信

### 1.常见组件通信方式

- `props`和`$emit` 父组件向子组件传递数据是通过`prop`传递的，子组件传递数据给父组件是通过`$emit`触发事件来做到的
- `$attrs`和`$listeners` A->B->C。Vue 2.4 开始提供了`$attrs`和`$listeners`来解决这个问题
- `$parent`,`$children`
- `$refs` 获取实例
- 父组件中通过`provider`来提供变量，然后在子组件中通过`inject`来注入变量。
- `envetBus` 平级组件数据传递 这种情况下可以使用中央事件总线的方式
- `vuex`状态管理
