# pnpm + workspace + changesets 构建 monorepo 工程

[[toc]]

## 如何使用 pnpm 来搭建 menorepo 工程

安装 pnpm

```sh
$ npm install -g pnpm
```

> v7 版本的 pnpm 安装使用需要 node 版本至少大于 v14.19.0，所以在安装之前首先需要检查下 node 版本。

## 工程初始化

为了便于后续的演示，先在工程根目录下新建 `packages` 目录，并且在 `packages` 目录下创建 `pkg1` 和 `pkg2` 两个工程，分别进到 `pkg1` 和 `pkg2` 两个目录下，执行 `npm init` 命令，初始化两个工程，`package.json` 中的 `name` 字段分别叫做 `@ailjc/menorepo1` 和 `@ailjc/monorepo2`。

为了防止根目录被发布出去，需要设置工程工程个目录下 `package.json` 配置文件的 private 字段为 true。

为了实现一个完整的例子，这里我使用了 `father-build` 对模块进行打包，father-build 是基于 rollup 进行的一层封装，使用起来更加便捷。

在 pkg1 和 pkg2 的 src 目录下个创建一个 `index.ts` 文件：

```ts
// pkg1/src/index.ts
import pkg2 from '@ailjc/monorepo2';

function fun2() {
  pkg2();
  console.log('I am package 1');
}

export default fun2;
```

```ts
// pkg2/src/index.ts
function fun2() {
  console.log('I am package 2');
}

export default fun2;
```

分别在 pkg1 和 pkg2 下新增 `.fatherrc.ts` 和 `tsconfig.ts` 配置文件。

```ts
// .fatherrc.ts
export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  disableTypeCheck: false,
};
```

```ts
// tsconfig.ts
{
  "include": ["src", "types", "test"],
  "compilerOptions": {
    "target": "es5",
    "module": "esnext",
    "lib": ["dom", "esnext"],
    "importHelpers": true,
    "declaration": true,
    "sourceMap": true,
    "rootDir": "./",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "*": ["src/*", "node_modules/*"]
    },
    "jsx": "react",
    "esModuleInterop": true
  }
}
```

全局安装 `father-build`:

```sh
$ pnpm i -Dw father-build
```

最后在 pkg1 和 pkg2 下的 `package.json` 文件中增加一条 `script`:

```json
{
  "scripts": {
    "build": "father-build"
  }
}
```

这样在 pkg1 或者 pkg2 下执行 `build` 命令就会将各子包的 ts 代码打包成 js 代码输出至 `lib` 目录下。

要想启动 `pnpm` 的 `workspace` 功能，需要工程根目录下存在 `pnpm-workspace.yaml` 配置文件，并且在 `pnpm-workspace.yaml` 中指定工作空间的目录。比如这里我们所有的子包都是放在 `packages` 目录下，因此修改 `pnpm-workspace.yaml` 内容如下：

```yaml
packages:
  - 'packages/*'
```

初始化完毕后的工程目录结构如下：

```
.
├── README.md
├── package.json
├── packages
│   ├── pkg1
│   │   ├── package.json
│   │   ├── src
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── pkg2
│       ├── package.json
│       ├── src
│       │   └── index.ts
│       └── tsconfig.json
├── pnpm-workspace.yaml
└── tsconfig.root.json
```

## 安装依赖包

使用 pnpm 安装依赖包一般分以下几种情况：

- 全局的公共依赖包，比如打包涉及到的 `rollup`、`typescript` 等  
  pnpm 提供了 `-w`, `--workspace-root` 参数，可以将依赖包安装到工程的根目录下，作为所有 package 的公共依赖。

  比如：

  ```sh
  $ pnpm install react -w
  ```

  如果是一个开发依赖的话，可以加上 `-D` 参数，表示这是一个开发依赖，会装到 `pacakage.json` 中的 `devDependencies` 中，比如：

  ```sh
  $ pnpm install rollup -wD
  ```

- 给某个 package 单独安装指定依赖  
   pnpm 提供了 `–filter` 参数，可以用来对特定的 `package` 进行某些操作。

  因此，如果想给 `pkg1` 安装一个依赖包，比如 `axios`，可以进行如下操作：

  ```sh
  $ pnpm add axios --filter @ailjc/monorepo1
  ```

  需要注意的是，`--filter` 参数跟着的是 `package` 下的 `package.json` 的 `name` 字段，并不是目录名。  
   关于 `--filter` 操作其实还是很丰富的，比如执行 `pkg1` 下的 `scripts` 脚本：

  ```sh
  $ pnpm build --filter @ailjc/monorepo1
  ```

  `filter` 后面除了可以指定具体的包名，还可以跟着匹配规则来指定对匹配上规则的包进行操作，比如：

  ```sh
  $ pnpm build --filter "./packages/**"
  ```

  此命令会执行所有 `package` 下的 `build` 命令。具体的用法可以参考 [filter](https://pnpm.io/zh/filtering) 文档。

- 模块之间的相互依赖  
  最后一种就是我们在开发时经常遇到的场景，比如 pkg1 中将 pkg2 作为依赖进行安装。
  基于 `pnpm` 提供的 `workspace:协议`，可以方便的在 packages 内部进行互相引用。比如在 pkg1 中引用 pkg2：
  ```sh
  $ pnpm install @ailjc/monorepo2 -r --filter @ailjc/monorepo1
  ```
  此时我们查看 pkg1 的 package.json，可以看到 `dependencies` 字段中多了对 `@ailjc/monorepo2` 的引用，以 `workspace:` 开头，后面跟着具体的版本号。
  ```json
  {
    "name": "@ailjc/monorepo1",
    "version": "1.0.0",
    "dependencies": {
      "@ailjc/monorepo2": "workspace:^1.0.0",
      "axios": "^0.27.2"
    }
  }
  ```
  在设置依赖版本的时候推荐用 `workspace:*`，这样就可以保持依赖的版本是工作空间里最新版本，不需要每次手动更新依赖版本。  
   当 `pnpm publish` 的时候，会自动将 `package.json` 中的 `workspace` 修正为对应的版本号。

## 只允许 pnpm

当在项目中使用 `pnpm` 时，如果不希望用户使用 `yarn` 或者 `npm` 安装依赖，可以将下面的这个 `preinstall` 脚本添加到工程根目录下的 `package.json` 中：

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

`preinstall` 脚本会在 `install` 之前执行，现在，只要有人运行 `npm install` 或 `yarn install`，就会调用 `only-allow` 去限制只允许使用 `pnpm` 安装依赖。

## Release 工作流

在 `workspace` 中对包版本管理是一个非常复杂的工作，遗憾的是 `pnpm` 没有提供内置的解决方案，一部分开源项目在自己的项目中自己实现了一套包版本的管理机制，比如 `Vue3`、`Vite` 等。

pnpm 推荐了两个开源的版本控制工具：

- [changesets](https://github.com/changesets/changesets)
- [rush](https://rushjs.io/)

这里我采用了 [changesets](https://github.com/changesets/changesets) 来做依赖包的管理。选用 `changesets` 的主要原因还是文档更加清晰一些，个人感觉上手比较容易。

按照 [changesets 文档](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)介绍的，changesets 主要是做了两件事：

> Changesets hold two key bits of information: a version type (following semver), and change information to be added to a changelog.

简而言之就是管理包的 `version` 和生成 `changelog`。

### 配置 changesets

- 安装
  ```sh
  $ pnpm add -DW @changesets/cli
  ```
- 初始化
  ```sh
  $ pnpm changeset init
  ```

执行完初始化命令后，会在工程的根目录下生成 `.changeset` 目录，其中的 `config.json` 作为默认的 `changeset` 的配置文件。

修改配置文件如下：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [["@ailjc/*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

说明如下：

- `changelog`: changelog 生成方式
- `commit`: 不要让 changeset 在 publish 的时候帮我们做 git add
- `linked`: 配置哪些包要共享版本
- `access`: 公私有安全设定，内网建议 restricted ，开源使用 public
- `baseBranch`: 项目主分支
- `updateInternalDependencies`: 确保某包依赖的包发生 upgrade，该包也要发生 version upgrade 的衡量单位（量级）
- `ignore`: 不需要变动 version 的包
- `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH`: 在每次 version 变动时一定无理由 patch 抬升依赖他的那些包的版本，防止陷入 major 优先的未更新问题

### 如何使用 changesets

一个包一般分如下几个步骤：  
为了便于统一管理所有包的发布过程，在工程根目录下的 `pacakge.json` 的 `scripts` 中增加如下几条脚本：

1. 编译阶段，生成构建产物
   ```json
   {
     "build": "pnpm --filter=@ailjc/* run build"
   }
   ```
2. 清理构建产物和 `node_modules`
   ```json
   {
     "clear": "rimraf 'packages/*/{lib,node_modules}' && rimraf node_modules"
   }
   ```
3. 执行 `changeset`，开始交互式填写变更集，这个命令会将你的包全部列出来，然后选择你要更改发布的包
   ```json
   {
     "changeset": "changeset"
   }
   ```
4. 行 `changeset version`，修改发布包的版本

   ```json
   {
     "version-packages": "changeset version"
   }
   ```

   这里需要注意的是，版本的选择一共有三种类型，分别是 `patch`、`minor` 和 `major`，严格遵循 [semver](https://semver.org/) 规范。

   **这里还有个细节，如果我不想直接发 `release` 版本，而是想先发一个带 `tag` 的 `prerelease` 版本呢(比如 `beta` 或者 `rc` 版本)？**

   这里提供了两种方式：

   1. 手工调整  
      这种方法最简单粗暴，但是比较容易犯错。

      首先需要修改包的版本号：

      ```json
      {
        "name": "@ailjc/monorepo1",
        "version": "1.0.2-beta.1"
      }
      ```

      然后运行：

      ```sh
      $ pnpm changeset publish --tag beta
      ```

      注意发包的时候不要忘记加上 `--tag` 参数。

   2. 通过 `changeset` 提供的 `Prereleases` 模式  
      利用官方提供的 [Prereleases 模式](https://github.com/changesets/changesets/blob/main/docs/prereleases.md) ，通过 `pre enter <tag>` 命令进入先进入 pre 模式。

      常见的 tag 如下所示：

      | 名称  | 功能                                                                                        |
      | ----- | ------------------------------------------------------------------------------------------- |
      | alpha | 是内部测试版，一般不向外部发布，会有很多 Bug，一般只有测试人员使用                          |
      | beta  | 也是测试版，这个阶段的版本会一直加入新的功能。在 Alpha 版之后推出                           |
      | rc    | Release 　 Candidate) 系统平台上就是发行候选版本。RC 版不会再加入新的功能了，主要着重于除错 |

      ```sh
      $ pnpm changeset pre enter beta
      ```

      之后在此模式下的 `changeset publish` 均将默认走 `beta` 环境，下面在此模式下任意的进行你的开发，举一个例子如下：

      ```sh
      # 1-1 进行了一些开发...
      # 1-2 提交变更集
      pnpm changeset
      # 1-3 提升版本
      pnpm version-packages # changeset version
      # 1-4 发包
      pnpm release # pnpm build && pnpm changeset publish --registry=...
      # 1-5 得到 1.0.0-beta.1

      # 2-1 进行了一些开发...
      # 2-2 提交变更集
      pnpm changeset
      # 2-3 提升版本
      pnpm version-packages
      # 2-4 发包
      pnpm release
      # 2-5 得到 1.0.0-beta.2
      ```

      完成版本发布之后，退出 Prereleases 模式：

      ```sh
      $ pnpm changeset pre exit
      ```

5. 构建产物后发版本
   ```json
   {
     "release": "pnpm build && pnpm release:only",
     "release:only": "changeset publish --registry=https://registry.npmjs.com/"
   }
   ```
