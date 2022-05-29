# 手写webpack
<!-- TOC -->

- [手写webpack](#手写webpack)
  - [1. 要编译的项目代码](#1-要编译的项目代码)
  - [2. 手写的webpack代码，这里起名为KkbPack](#2-手写的webpack代码这里起名为kkbpack)
  - [3. 最后用手写的KkbPack来编译项目文件生成的代码](#3-最后用手写的kkbpack来编译项目文件生成的代码)

<!-- /TOC -->

## 1. 要编译的项目代码
src/index.js
```js
const sayHi = require('./a.js')

sayHi('开课吧')
```

src/a.js
```js
const sayAge = require('./common/util.js')
module.exports = (name)=>{
  console.log('hello world'+ name)
  sayAge(18)
}
```


src/common/util.js
```js
module.exports = (age)=>{
  console.log('你今年'+age+'岁了')
}
```

## 2. 手写的webpack代码，这里起名为KkbPack
kkb-pack/src/index.js
```js
#! /usr/bin/env node
const path = require('path')
const fs = require('fs')
// 默认配置
const defaultConfig = {
  entry:'./src/index.js',
  output:{
    filename:'bundle.js'
  }
}

const config = {...defaultConfig, ...require(path.resolve('./kkb.config.js'))}
// 拿到了最终的配置

class KkbPack{
  constructor(config){
    // 存储一下配置
    this.config = config 
    this.entry = config.entry
    // 工作 根目录
    this.root = process.cwd()
    // 存储所有代码
    this.modules = {}
  }
  parse(code, parent){
    let deps = []
    let r = /require\('(.*)'\)/g
    // require('xx')替换为__kkbpack_require__
    code = code.replace(r, function(match, arg){
      // 依赖路径
      const retPath = path.join(parent, arg.replace(/'|"/g),'')
      deps.push(retPath)
      return `__kkbpack_require__("./${retPath}")`
    })
    return {code, deps}
    // 能够解析文件内容种的require('xx.js')这种格式
  }
  createModule(modulePath, name){
    // if(this.modules[modulePath]){
    //   // 出现了循环依赖
    // }
      const fileContent = fs.readFileSync(modulePath,'utf-8')
      // 替换后的代码喝依赖数组
      const { code, deps} = this.parse(fileContent, path.dirname(name))
      console.log(code, deps)
      this.modules[name] = `function(module, exports, __kkbpack_require__){
        eval(\`${code}\`)
      }
      `
      // 循环获取所有依赖数组的内容
      deps.forEach(dep=>{
        this.createModule(path.join(this.root, dep), './'+dep)
      })
      // console.log(name)
      // console.log(code)
  }
  generateModuleStr(){
    let fnTemp = ""
    Object.keys(this.modules).forEach(name=>{
      fnTemp += `"${name}":${this.modules[name]},`
    })
    return fnTemp
  }
  generateFile(){
      let template = fs.readFileSync(path.resolve(__dirname, './template.js'),'utf-8')
      this.template = template.replace('__entry__',this.entry)
                      .replace('__modules_content__',this.generateModuleStr())
      // app.get('xxx.js',res=>{
      //   res.send(this.template)
      // })
      fs.writeFileSync('./dist/'+this.config.output.filename, this.template)
      console.log('写入文件完毕')
  }
  start(){

    console.log('开始解析文件的依赖')
    const entryPath = path.resolve(this.root, this.entry)
    this.createModule(entryPath, this.entry)
    console.log(this.modules)
    // 生成文件
    this.generateFile()
  }
}

const kkb = new KkbPack(config)
kkb.start()
```


kkb-pack/src/template.js
```js
!function(modules){
  // 缓存
  const installModules = {}
  function __kkbpack_require__(moduleId){
    // 是否缓存
    if(installModules[moduleId]){
      return installModules[moduleId].exports
    }
    let module = installModules[moduleId] = {
      exports: {}
    }
    console.log()
    modules[moduleId].call(modules.exports, module, module.exports, __kkbpack_require__)
    return module.exports
  }
  // 入口
  return __kkbpack_require__("__entry__")
}({__modules_content__})
```


## 3. 最后用手写的KkbPack来编译项目文件生成的代码
dist/kbb.js
```js
!function (modules) {
  // 缓存
  const installModules = {}

  function __kkbpack_require__(moduleId) {
    // 是否缓存
    if (installModules[moduleId]) {
      return installModules[moduleId].exports
    }
    let module = installModules[moduleId] = {
      exports: {}
    }
    console.log()
    modules[moduleId].call(modules.exports, module, module.exports, __kkbpack_require__)
    return module.exports
  }
  // 入口
  return __kkbpack_require__("./src/index.js")
}({
  "./src/index.js": function (module, exports, __kkbpack_require__) {
    eval(`const sayHi = __kkbpack_require__("./src/a.js")
        sayHi('开课吧')`)
  },
  "./src/a.js": function (module, exports, __kkbpack_require__) {
    eval(`const sayAge = __kkbpack_require__("./src/common/util.js")
      module.exports = (name)=>{
        console.log('hello world'+ name)
        sayAge(18)
      }
    `)
  },
  "./src/common/util.js": function (module, exports, __kkbpack_require__) {
    eval(`module.exports = (age)=>{
      console.log('你今年'+age+'岁了')
    }`)
  },
})
```

