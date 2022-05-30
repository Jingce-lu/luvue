# lerna + yarn workspace 使用总结

[[toc]]

lerna 管理方式属于 `Monorepo` 模式，这有别于传统的 `Multirepo` 单仓库应用模式，下面我们先来了解一下两者的区别。

## 模式对比

### Multirepo

传统的项目开发模式，比如 create-react-app、vue-cli 等框架模板脚手架生成的项目。

- 优点：
  1. 各模块管理自由度高；
  2. 各模块仓库体积一般不会太大；
- 缺点
  1. 仓库分散不好找，分支管理混乱；
  2. 版本更新频繁，公共模块版本发生变化，需要对所有模块进行依赖更新；

### Monorepo

- 优点：
  1. 统一的规范、构建工具；
  2. 方便版本管理和依赖，模块之间的引用调试都变得非常方便；
  3. Multirepo 的缺点就是它的优点。
- 缺点：
  1. 随着应用扩展，仓库体积将变大。

### lerna + yarn workspace 应用场景

1. 作为业务组件库的工程环境搭建。
   实现单个业务组件作为单独的 `npm` 包 进行管理和发布，无需将各个业务组件分开建立在多个 Git 仓库中，且它们的技术栈、构建工具、规范等都可以保持一致。
2. 作为日常业务项目工程管理。
   比如有一个低代码业务需求，低代码核心工作区的交互都相同，不同的是业务场景（外层壳子和一些定制功能），低代码相关的模块都可以复用，我们只需在这个仓库内不断去扩展业务需求即可，达到核心代码的复用（当然，可能会想到将低代码核心作为线上包）。

## Lerna

Lerna 是一个管理工具，用于管理包含多个软件包（package）的 JavaScript 项目，是 Babel 自己用来维护自己的 Monorepo 并开源出的一个项目。

它可以：

- 统一的一套规范、构建标准；
- 对相互耦合较大、相互独立的 JS/Git 库进行管理；
- 统一的工作流和 Code Sharing（代码共享）。

下面我们从以下几个方面来熟悉 Lerna：

- Lerna 管理模式；
- Lerna 入门指引；
- Lerna 管理命令；
- Lerna 配置文件；
- Lerna 应用 Demo；
- Lerna 版本发布；
- Lerna 最佳实践；
- Lerna 注意事项。

### Lerna 管理模式

lerna 管理项目可以使用两种模式，默认固定模式，当使用 `lerna init -i` 命令初始化项目时，此时为独立模式。（模式是用来管理多个 package 发包时的方式）

1. 固定模式：
   在发包时会检测 packages 下涉及到变更的包，给这些变更的包使用同一版本，未发生变更的包不应用改版本，且不做发布升级；发布时可通过 lerna publish major（大） | minor（中） | patch （小）自定义版本。
2. 独立模式（常用的模式）：
   允许每个包有自己独立的版本号，在 lerna publish 发布时，需要为每个改动的库指定版本号（逐个询问需要升级的版本号）。此模式，lerna.json - version 字段指定为 independent。

> 如果 packages 下，其中一个包发生改动，另一个包依赖了这个包，即使它没有发生改动，也会被进行发布更新。

### Lerna 入门指引

1. 全局安装 Lerna：
   ```sh
   npm install --global lerna
   ```
2. 初始化 git 代码仓库：
   ```sh
   git init lerna-repo && cd lerna-repo
   ```
3. 初始化 Lerna：
   ```sh
   lerna init
   // lerna info Creating package.json
   // lerna info Creating lerna.json
   // lerna info Creating packages directory
   // lerna success Initialized Lerna files
   ```
4. 此时得到了这样一个仓库目录结构：
   ```sh
   lerna-repo/
       packages/
       package.json
       lerna.json
   ```
   其中 `packages` 中保存着每个独立的包模块。
5. 安装 lerna 到仓库 node_modules 中：
   ```sh
   npm install
   ```

至此，我们就完成了一个 Lerna 工程的初始化工作，下面我们掌握一些操作命令来管理 Lerna。

### Lerna 管理命令

1. `lerna init`
   将一个仓库初始化为 lerna 仓库（默认固定模式）。支持参数：
   ```sh
   --independent/-i – 使用独立的版本控制模式
   ```
2. `lerna create 「package」`
   创建一个 package 到项目工程的 packages 下。
3. `lerna add 「module」`
   - 为每个 package 都安装指定依赖：
     ```sh
     lerna add react
     ```
   - 为指定的 package 安装特定依赖：
     ```sh
     lerna add react-dom packages/package1
     // or
     lerna add react-dom --scope=package1
     ```
   - 添加依赖到根目录 node_modules 中：
     ```sh
     npm install typescript -D
     ```
   - package 之间的相互依赖（会在 package/package.json 下添加该依赖）：
     ```sh
     lerna add package2 --scope package1
     // or
     lerna add package2 packages/package1
     ```
4. `lerna publish`
   用于 npm 包版本发布，具体细节可看下文 「Lerna 版本发布」。
5. `lerna bootstrap`
   用于将 packages 链接在一起(前提是相互依赖的库)，并安装 package 下的依赖到 package/node_modules。

   > 注意，它不会安装根目录 package.json 的依赖，如果需要安装根目录依赖，请使用 npm install。

   参数：`--hoist`：依赖提升，把每个 package 下的依赖包都 `提升` 到工程根目录（删除包下的 node_modules，将依赖安装在根目录，但依赖注册不会在 package/package.json 内删除，也不会在 root/package.json 内添加此依赖）

6. `lerna clean`
   删除各个包下的 node_modules（不会删除根目录 node_modules）。
7. lerna ls
   列出当前 Lerna 仓库中的所有公共软件包（public packages）。
8. `lerna run 「script」`
   - 运行每个包下面的 script（如果某个包没有此 script，将会报错）
     ```sh
     lerna run test
     ```
   - 运行某个包下面的 script
     ```sh
     lerna run test --scope package1
     ```
9. `lerna exec 「shell」`
   允许去执行 shell 脚本
   ```sh
   lerna exec webpack
   ```
10. `lerna changed`
    检查自上次发布以来哪些软件包被修改过。
11. `lerna link`
    链接互相引用的库，当 pakcage/package.json 内明确了 packages 下的包时，才会将相关包链接到 package/node_modules 中。
12. `lerna info`
    查看 lerna 及运行环境的信息。

### Lerna 配置文件

在 lerna.json 配置文件内可以指定工作模式、packages 的位置以及一些命令的默认参数定义，如下示例：

```json
{
  "version": "1.0.0",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "packages": ["packages/*"],
  "command": {
    "bootstrap": {
      "npmClientArgs": ["--no-package-lock"]
    },
    "version": {},
    "publish": {
      "npmClient": "npm",
      "ignoreChanges": ["**/*.md", "**/test/**"],
      "message": "chore(release): publish",
      "registry": "https://registry.npmjs.org",
      "conventionalCommits": true
    }
  }
}
```

- `version`: 当前仓库的版本，Independent mode 请设置为 independent；
- `packages`: 指定包所在的目录，支持指定多个目录；
- `npmClient`: 允许指定命令使用的 client， 默认是 npm， 可以设置成 yarn；
- `useWorkspaces`: 使用 yarn workspaces 管理 Monorepo；
- `command.bootstrap.npmClientArgs`: 指定默认传给 lerna bootstrap 命令的参数；
- `command.publish.ignoreChanges`: 指定那些目录或者文件的变更不用触发 package 版本的变更；
- `command.publish.message`: 执行发布版本更新时的生成的 commit message；
- `command.publish.registry`: 指定发布到的 registry url，比如可以发布到指定私服，默认是 npmjs.org；
- `command.publish.conventionalCommits`: lerna version 将生成 CHANGELOG.md files（如果设置了这个，lerna 管理模式将直接使用固定模式，version = independent 的配置将失效）。

### Lerna 应用 Demo

有了上面的基础使用的了解，下面我们通过一个简单 Demo 熟悉一下 Lerna 管理 Packages 的流程方式。

1. 创建 Lerna 工程：
   ```sh
   git init lerna-demo && cd lerna-demo && lerna init
   ```
2. 创建两个 package：
   ```sh
   lerna create lerna-module1
   lerna create lerna-module2
   ```
3. 在 package 中维护几行测试代码：

   ```js
   // lerna-module1/lib/lerna-module1.js
   module.exports = lernaModule1;
   function lernaModule1() {
     console.log('lerna-module1');
   }

   // lerna-module2/lib/lerna-module2.js
   const lernaModule1 = require('lerna-module1');
   module.exports = lernaModule2;
   function lernaModule2() {
     console.log('lerna-module2');
   }
   lernaModule1();
   lernaModule2();
   ```

4. 在 lerna-module2 下添加一个执行脚本：
   ```js
   // lerna-module2/package.json
   "scripts": {
     "test": "node ./lib/lerna-module2.js"
   }
   ```
5. 运行脚本：
   ```sh
   lerna run test --scope lerna-module2
   ```
   此时会看到终端报错信息：
   > Error: Cannot find module 'lerna-module1'
6. 手动建立 package 之间的关联：
   ```sh
   lerna add lerna-module1 --scope lerna-module2
   # lerna info Adding lerna-module1 in 1 package
   ```
   > 此时可以在 lerna-module2 目录下看到生成了 node_modules 文件夹，并且在里面放置了和 lerna-module1 一模一样的包（软链接）。
7. 再来执行一次命令：
   ```sh
   lerna run test --scope lerna-module2
   终端输出：
   lerna-module1
   lerna-module2
   ```

### Lerna 版本发布

packages 下的包版本发布需要使用 `lerna publish`，这个命令组合了这两个命令：`lerna version` 和 `npm publish`。  
其中 lerna version 针对 Lerna 的管理模式（固定模式和独立模式），在表现上有所不同。  
但主要工作还是在进行 `npm publish` 之前，去管理哪些包要进行发布，以及发布过程中生成的 Git commit、Git tag 的提交。

1. 固定模式下的 lerna version：
   - 找出从上一个版本发布以来有过`变更的 package`；
   - 根据当前 lerna.json 中的版本`生成新的版本号`；
   - 更新涉及到变更 package 下的 package.json 版本号；
   - 更新 lerna.json 文件中的版本号；
   - 将 `version` 更新、生成的 `CHANGELOG.md` 文件带来的变动提交为一次 commit；
   - 基于这次 commit 为所有涉及到更新的 package 打上各自的 tag；
   - 推送 commit 和 tags 到远程仓库。
2. 独立模式下的 lerna version：
   - 找出从上一个版本发布以来有过变更的 package；
   - 提示开发者为需要更新的 package 选择（一组 Version Select）要发布的版本号；
   - 更新到 package 下的 package.json version 版本号；
   - 如果 packages 下其他包有依赖这个包，那么其他包的 package.json 此包版本也会更新；
   - 将 version 更新、生成的 CHANGELOG.md 文件带来的变动提交为一次 commit；
   - 基于这次 commit 为所有涉及到更新的 package 打上各自的 tag；
   - 推送 commit 和 tags 到远程仓库。

这里需要注意一下 lerna 查找包变更的逻辑：

::: tip lerna 查找包变更的逻辑
在当前分支，找到最近一次 tag，将当前 commit 和 tag 进行比较，看哪些 package 下的文件发生了变更。
:::

命令使用如下：

```sh
lerna publish
lerna publish semver
# semver bump [major | minor | patch | premajor | preminor | prepatch | prerelease]
lerna publish from git
lerna publish from-package
```

初次使用发布时可能会遇到以下一些问题和注意事项：

1. 避免开发者自己去打 tag。
   lerna 发布时会自动生成 tag，并且查找更新是基于 tag 来识别的，避免开发者手动打上 tag 后，影响 lerna 查找变更，可能会造成一些变更包没有按照预期发布。
2. 避免多条分支同时进行。
   在多条分支同时进行时，可能会生成相同的版本号，从而发生版本冲突。解决办法：分支开发者之前应提前约定好版本。
3. lerna publish 中途发布失败，如何进行重发布。
   有时候发布可能会失败（比如 npm 没有登录、没有使用 npmjs 镜像源），再次运行 lerna publish 时，因为 tag 已经打上了，无法再查找到更新，进行包的发布。  
   可以采用下面两种发布方式：
   - 运行 `lerna publish from-git`。会将当前标签中涉及的 NPM 包再发布一次。（不会再更新 package.json，只是执行 npm publish）；
   - 运行 `lerna publish from-package`。会将当前所有本地包中的 package.json 和远端 npm 比对，如果 npm 上不存在此包的最新版本，都执行一次 npm publish。

### Lerna 最佳实践

目前业界使用最多的方案是：`lerna + yarm workspace` 结合的 `Monorepo` 方案，两者工作职责划分不同：

- `yarn` 处理依赖安装工作（只想做好包管理工具）；
- `lerna` 处理发布流程。

### Leran 注意事项

1. 发布前，提交工作区的变更。
   在发布前，需要提交工作区的文件变更，否则终端会收到下面报错信息：
   > lerna ERR! EUNCOMMIT Working tree has uncommitted changes, please commit or remove the following changes before continuing:
2. 发布前，需使用 npmjs.org 镜像。
   在发布前，如果 npm 设置的镜像源为淘宝镜像，需要切换回 npm 镜像：
   ```sh
   npm config get registry
   npm config set registry https://registry.npmjs.org
   ```
3. 如果要发布一个 Scope 包：
   Scope 是指具有“组织”的包，比如 Babel 的相关包都是这一格式：@babel/xxx，在发布一个具有 Scope 包时，需要确保 Organization（组织）已在 npm 上创建，私有包需要收费，公共包则为免费。  
   在发布 Scope package 时，需要在 package.json 声明 access publish：
   ```json
   {
     "name": "@feu/tools",
     "publishConfig": {
       "access": "publish" // 如果该模块需要发布，对于 scope 模块，需要设置为 publish
     }
   }
   ```
4. 发布意外中断，进行重发布：
   如果发布因为某些原因中断了，未发布成功，再次执行发布，会得到如下提示：

   > lerna success No changed packages to publish

   但由于包并未成功发布到 npmjs 上，这时可以执行以下命令进行重发布：

   ```sh
   lerna publish from-git
   # or
   lerna publish from-package
   ```

5. independent 模式并未生效：
   在 lerna.json 下指定了 version 为 independent，但是发布时却还是固定模式的流程，原因可能是 lerna.json 内配置了 `conventionalCommits`：
   ```json
   "command": {
     "publish": {
       "conventionalCommits": true
     }
   }
   ```
   可以将其配置移除得到解决。
6. 固定模式如何自己指定版本：
   当我们执行 lerna publish 时，lerna 会`自定分配一个版本`提供我们使用；但这个版本可能不是我们期望发布的版本；如何自己控制发布的版本呢，在发布时我们可以传递配置：
   ```sh
   lerna publish major（大） | minor（中） | patch （小）
   lerna publish patch # 发布小版本
   ```

## yarn workspace

对于 `Monorepo` 的工程，使用最多的方式是 `lerna` 结合 `yarn workspace` 一起使用。  
因为 `yarn` 在依赖管理上做的非常不错，适合我们业务场景的依赖模块管理。  
而 package 的发布工作依旧交由 `lerna publish` 来运转。

下面我们从以下几个方面来熟悉 yarn workspace：

- yarn workspace 管理工程；
- yarn workspace 管理命令；
- yarn workspace 入门实战。

### yarn workspace 管理工程

初始化工程的步骤和上面 `lerna` 的方式一样，与 lerna 不同的是，需要做以下配置：

1. 在 lerna.json 中声明使用 `yarn workspace` 进行依赖管理：
   ```json
   {
     ...
     "npmClient": "yarn",
     "useWorkspaces": true
   }
   ```
2. 在 `root/package.json` 下必需包含 `workspaces` 数组，与 `lerna.json` 下的 `packages` 保持一致：
   ```js
   {
     "private": true, // 工作空间不需要发布
     ...
     "workspaces": ["packages/*"]
   }
   ```

### yarn workspace 管理命令

yarn 管理命令大致分为两类（容易混淆，这里先提及一下）：

- 处理工程下指定的包模块时使用：`yarn workspace`；
- 处理工程根目录全局或所有包模块时使用：`yarn workspaces`。

1. `yarn install`
   代替 `npm install + lerna bootstrap` 安装工程依赖。

   它与 lerna bootstarp 不同的是：

   - `yarn install` 会将 `package` 下的依赖`统一安装到根目录之下`。这有利于提升依赖的安装效率和不同 package 间的版本复用（有些包是需要私有依赖的，而私有依赖会被多个包安装多次，而提升依赖可以解决这一问题）。
   - yarn install 会自动帮助解决安装（包括根目录下的安装）和 packages link 问题。

2. `yarn add 「module」`
   - 为每个 package 都安装指定依赖：
     ```sh
     yarn workspaces add react
     ```
   - 为指定的 package 安装特定依赖：
     ```sh
     yarn workspace package1 add react react-dom --save
     ```
     > 注意，package1 一定是 packages/package1/package.json name 字段，有时候 package 的目录名和 name 字段不一致，要以 name 为准。
   - 添加依赖到根目录 node_modules 中：
     ```sh
     cd 根目录
     yarn add @babel/core -D -W （-W 表示将依赖添加到 workspaces 根目录）
     ```
   - package 之间的相互依赖（会在 package/package.json 下添加该依赖）：
     ```sh
     yarn workspace package1 add package2
     ```
     > 注意，当 package2 没有发布在 npmjs 上时，此时会报错：package2 not found；解决办法：显示指定 package2 的版本： yarn workspace package1 add package2@^1.0.0
   - 在工程根目录下引入 packages/package 包：
     ```sh
     yarn add package@^1.0.0 -W
     ```
3. `yarn remove「module」`
   和上面 yarn add 命令格式相同，只需将 add 替换为 remove 即可。
4. `yarn run 「script」`
   - 运行工程根目录下 script：
     ```sh
     yarn test
     ```
   - 运行指定包模块下的 script：
     ```sh
     yarn workspace package1 run test
     ```
     > 值得注意的是，命令虽然是在根目录下执行，但在执行文件中拿到的 `process.cwd()` 是 `package` 下的执行文件所在路径
   - 运行所有 package 下的 script 命令：
     ```sh
     yarn workspaces run test
     ```
     > 注意，如果某个 package 下没有对应 script，将会终止命令，并报错。若 package 不具备 script，可以定义一个占位 script，类似如下：
     ```json
     "scripts": {
       "lint": "echo lint successful."
     }
     ```
5. `yarn workspaces info`
   查看 workspace 依赖树信息。

### yarn workspace 入门实战

1. 新建 yarn workspace 工程：
   ```sh
   git init yarn-demo && cd yarn-demo && yarn init -y && yarn add lerna -D && lerna init
   ```
2. 配置 lerna.json 改用 yarn workspaces：
   ```json
   // lerna.json
   {
     "npmClient": "yarn",
     "useWorkspaces": true,
     "packages": ["packages/*"],
     "version": "independent"
   }
   ```
3. 根目录 package.json 必须包含一个 workspaces 数组:
   ```json
   {
     "private": true, // 工作空间不需要发布
     "workspaces": ["packages/*"],
     ...
   }
   ```
4. 新建两个 package：
   ```sh
   cd packages && mkdir yarn-module1 && cd yarn-module1 && yarn init -y
   cd packages && mkdir yarn-module2 && cd yarn-module2 && yarn init -y
   ```
5. 添加几行测试代码：

   ```js
   // yarn-module1/index.js
   function yarnModule1() {
     console.log('yarn-module1');
   }

   module.exports = yarnModule1;

   // yarn-module2/index.js
   const yarnModule1 = require('yarn-module1');

   function yarnModule2() {
     console.log('yarn-module2');
   }

   yarnModule1();
   yarnModule2();

   module.exports = yarnModule2;
   ```

6. 为 yarn-module2 添加个 script：
   ```json
   // yarn-module2/package.json
   "scripts": {
     "test": "node index.js"
   }
   ```
7. 回到根目录执行 script：
   ```sh
   yarn workspace yarn-module2 run test
   ```
   不出意外，会得到如下错误：
   > Error: Cannot find module 'yarn-module1'
8. 建立 package 之间的关系：
   ```sh
   yarn install
   ```
   可以看到，根目录下的 node_modules 中已经存在了 yarn-module1 和 yarn-module2 这两个包，与 lerna 的区别在于没有在各自的 package 下创建 node_modules，而是统一链接到根目录。  
   但，`yarn-module2` 中依赖的 `yarn-module1`，应该将其添加到 package.json 中，最好的方式是采用
   ```sh
   yarn workspace yarn-module2 add yarn-module1@^1.0.0
   ```
9. 再来一次 script：

   ```sh
   yarn workspace yarn-module2 run test

   输出：
   yarn-module1
   yarn-module2
   ```
