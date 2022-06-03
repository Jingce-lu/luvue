# 使用 vue3 + pnpm 从 0 搭建 monorepo 项目

[[toc]]

## 前言

下面演示的项目，我放在了 [vue3-pnpm-monorepo](https://github.com/Tyh2001/vue3-pnpm-monorepo) 仓库中。

## 初始化项目

首先新建一个文件夹，名为 `vue3-pnpm-monorepo`

进入 `vue3-pnpm-monorepo` 文件夹，初始化一个默认的 package.json 文件，执行命令：

```sh
pnpm init -y
```

生成 package.json 并调整为：

````json
{
  "name": "vue3-pnpm-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {},
  "license": "ISC"
}
这样配置之后，就可以根据不同的命令，来启动不同的项目了。
接下来就是需要安装依赖进行测试了，不过安装前还需要配置一个特殊的文件 pnpm-workspace.yaml，这个文件可以帮助我们在安装公共依赖的情况下，也将 packages 下的项目所需要的依赖也同时进行安装。
在根目录创建 pnpm-workspace.yaml 文件，内容为：

作者：田同学2001
链接：https://juejin.cn/post/7077168840806760478
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。```

接下来再新建 `packages` 文件夹，来存放项目。进入 `packages` 目录，我直接初始化三个 `vue3 + ts` 的项目进行演示：

为了保持大家和我的代码同步，创建命令如下：

```sh
npm init vite vue-demo1
npm init vite vue-demo2
npm init vite vue-demo3
````

目前项目结构如下

```
├── packages
|  ├── vue-demo1
|  ├── vue-demo2
|  └── vue-demo3
├── package.json
```

接下来进入到刚才创建的项目中，项目内部结构应该是这样的：

```
├── packages
|  ├── vue-demo1
|  |  ├── .vscode
|  |  ├── public
|  |  ├── src
|  |  ├── .gitignore
|  |  ├── index.html
|  |  ├── package.json
|  |  ├── README.md
|  |  ├── tsconfig.json
|  |  ├── tsconfig.node.json
|  |  └── vite.config.ts
|  ├── vue-demo2
|  └── vue-demo3
├── package.json
```

进入到项目的目录下，打开 `package.json` 文件，是这样的：

```json
{
  "name": "vue-demo1",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.2.25"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^2.2.0",
    "typescript": "^4.5.4",
    "vite": "^2.8.0",
    "vue-tsc": "^0.29.8"
  }
}
```

我们要知道，目前这三个项目是完全一样的，需要的依赖也是完全一样的，所以这些依赖项就可以直接抽离出来，变成公共的依赖项，添加上版本号，另外调试的话也不需要在这里进行调试，也直接删掉，稍加修改这个文件，最后变成这样：

```json
{
  "name": "vue-demo1",
  "private": true,
  "version": "1.0.0"
}
```

将三个项目都按照上面的方式进行修改即可。

## 创建公共依赖配置

接下来就需要将三个公共的依赖项，进行配置到根目录，使用全局的依赖包提供这三个项目使用：

在 根目录下的 `package.json` 新增之前抽离出来的公共配置项，都添加到公共的配置文件中：

```json
{
  "name": "vue3-pnpm-monorepo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "vue": "^3.2.25"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^2.2.0",
    "typescript": "^4.5.4",
    "vite": "^2.8.0",
    "vue-tsc": "^0.29.8"
  },
  "license": "ISC"
}
```

那么现在还没有调试的方式，可以新增调试的命令，一般启动项目可以使用 `dev:项目名` 来进行分别启动项目，后面跟上需要启动的路径即可

```json
{
  "name": "vue3-pnpm-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:vue-demo1": "vite packages/vue-demo1",
    "dev:vue-demo2": "vite packages/vue-demo2",
    "dev:vue-demo3": "vite packages/vue-demo3"
  },
  "dependencies": {
    "vue": "^3.2.25"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^2.2.0",
    "typescript": "^4.5.4",
    "vite": "^2.8.0",
    "vue-tsc": "^0.29.8"
  },
  "license": "ISC"
}
```

这样配置之后，就可以根据不同的命令，来启动不同的项目了。

接下来就是需要安装依赖进行测试了，不过安装前还需要配置一个特殊的文件 `pnpm-workspace.yaml`，这个文件可以帮助我们在安装公共依赖的情况下，也将 `packages` 下的项目所需要的依赖也同时进行安装。

在根目录创建 `pnpm-workspace.yaml` 文件，内容为：

```yaml
packages:
  - 'packages/*'
```

配置好之后，就可以在根目录执行：

```sh
pnpm i
```

来安装依赖，安装好了之后，我们就会发现，在项目的根目录和分别每个项目中，都会有了 `node_modules` 文件夹。

通过命令启动一下项目：

```sh
pnpm run dev:vue-demo1
pnpm run dev:vue-demo2
pnpm run dev:vue-demo3
```

发现每一个项目都是正常启动的，成功～

## 局部安装依赖项

比如说，我的 `vue-demo1` 的项目中需要安装 `tyh-ui`，而其它的两个项目是不需要的，那么这样的话，就可以将 `tyh-ui` 单独安装到 `vue-demo1` 的项目中，而另外两个项目是不需要的，所以就没必要安装到全局，直接安装到 `vue-demo1` 内部，安装的方式有两种：

1. 进入到指定目录去安装
   可以直接进入到指定需要安装的目录进行安装，那么进入到 `packages/vue-demo1` 中，执行：
   ```sh
   npm i tyh-ui2
   ```
   完成安装，这样 `vue-demo1` 中就会单独多出一个依赖项进行使用了。
2. `--filter` 安装  
   使用 `--filter` 修饰符可以实现在根目录指定某个目录进行安装，具体命令为：
   ```sh
   pnpm i tyh-ui2 --filter vue-demo1
   ```
   这样也可以实现。

## 全局安装依赖项

添加全局的依赖项的时候，需要在命令后面加上 `-W`。

比如所有的组件都需要使用到 `lodash`，就可以执行：

```sh
pnpm i lodash -W
```

这样就实现了在所有组件中都可以使用 lodash 了。
