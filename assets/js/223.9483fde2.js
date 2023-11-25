(window.webpackJsonp=window.webpackJsonp||[]).push([[223],{616:function(s,t,a){"use strict";a.r(t);var e=a(54),n=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"usr-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#usr-ts"}},[s._v("#")]),s._v(" usr ts")]),s._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#_1-ts-优点"}},[s._v("1. ts 优点")])]),a("li",[a("a",{attrs:{href:"#_2-typescript-语言内部分层"}},[s._v("2. TypeScript 语言内部分层")])]),a("li",[a("a",{attrs:{href:"#_3-implements-与-extends-的区别"}},[s._v("3. implements 与 extends 的区别")])])])]),a("p"),s._v(" "),a("h2",{attrs:{id:"_1-ts-优点"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_1-ts-优点"}},[s._v("#")]),s._v(" 1. ts 优点")]),s._v(" "),a("ol",[a("li",[s._v("在编译期进行静态类型分析的强类型语言")]),s._v(" "),a("li",[s._v("与现存的 JavaScript 代码有非常高的兼容性，是 js 超集")]),s._v(" "),a("li",[s._v("给大型项目提供一个构建机制")]),s._v(" "),a("li",[s._v("对于发行版本的代码，没有运行时开销")]),s._v(" "),a("li",[s._v("遵循当前以及未来出现的 ECMAScript 规范")]),s._v(" "),a("li",[s._v("跨平台开发工具")])]),s._v(" "),a("h2",{attrs:{id:"_2-typescript-语言内部分层"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_2-typescript-语言内部分层"}},[s._v("#")]),s._v(" 2. TypeScript 语言内部分层")]),s._v(" "),a("ul",[a("li",[a("code",[s._v("语言层")]),s._v("： 实现所有 TypeScript 的语言特性")]),s._v(" "),a("li",[a("code",[s._v("编译层")]),s._v("： 执行编译、类型减产，然后将 TypeScript 代码转换成 JavaScript 代码")]),s._v(" "),a("li",[a("code",[s._v("语言服务层")]),s._v("： 生成信息以帮助编辑器和其他工具来提供更好的辅助特性")]),s._v(" "),a("li",[a("code",[s._v("IDE 整合")]),s._v("： 为了利用 ts 的特性，IDE 开发者需要完成一些集成工作")])]),s._v(" "),a("h2",{attrs:{id:"_3-implements-与-extends-的区别"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-implements-与-extends-的区别"}},[s._v("#")]),s._v(" 3. implements 与 extends 的区别")]),s._v(" "),a("ul",[a("li",[a("code",[s._v("implements")]),a("br"),s._v("\n实现，一个新的类，从父类或者接口实现所有的属性和方法，同时可以重写属性和方法，包含一些新的功能")]),s._v(" "),a("li",[a("code",[s._v("extends")]),a("br"),s._v("\n继承，一个新的接口或者类，从父类或者接口继承所有的属性和方法，不可以重写属性，但可以重写方法")])]),s._v(" "),a("div",{staticClass:"language-ts line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-ts"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("interface")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("IPerson")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  age"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("number")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  name"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("interface")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("IPeoPle")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("extends")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("IPerson")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  sex"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("class")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("User")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("implements")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("IPerson")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  age"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("number")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  name"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("interface")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("IRoles")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("extends")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("User")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("class")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Roles")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("extends")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("User")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br")])]),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[s._v("注意点")]),s._v(" "),a("ul",[a("li",[s._v("接口不能实现接口或者类，所以实现只能用于类身上,即类可以实现接口或类")]),s._v(" "),a("li",[s._v("接口可以继承接口或类")]),s._v(" "),a("li",[s._v("类不可以继承接口，类只能继承类")]),s._v(" "),a("li",[s._v("可多继承或者多实现")])])])])}),[],!1,null,null,null);t.default=n.exports}}]);