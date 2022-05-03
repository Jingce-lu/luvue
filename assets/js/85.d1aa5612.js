(window.webpackJsonp=window.webpackJsonp||[]).push([[85],{513:function(t,s,a){"use strict";a.r(s);var n=a(62),e=Object(n.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"流程概览"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#流程概览"}},[t._v("#")]),t._v(" 流程概览")]),t._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#递-阶段"}},[t._v("“递”阶段")])]),a("li",[a("a",{attrs:{href:"#归-阶段"}},[t._v("“归”阶段")])]),a("li",[a("a",{attrs:{href:"#例子"}},[t._v("例子")])]),a("li",[a("a",{attrs:{href:"#总结"}},[t._v("总结")])]),a("li",[a("a",{attrs:{href:"#参考资料"}},[t._v("参考资料")])])])]),a("p"),t._v(" "),a("p",[t._v("本章我们会讲解"),a("code",[t._v("Fiber节点")]),t._v("是如何被创建并构建"),a("code",[t._v("Fiber树")]),t._v("的。")]),t._v(" "),a("p",[a("code",[t._v("render阶段")]),t._v("开始于"),a("code",[t._v("performSyncWorkOnRoot")]),t._v("或"),a("code",[t._v("performConcurrentWorkOnRoot")]),t._v("方法的调用。这取决于本次更新是同步更新还是异步更新。")]),t._v(" "),a("p",[t._v("我们现在还不需要学习这两个方法，只需要知道在这两个方法中会调用如下两个方法：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// performSyncWorkOnRoot会调用该方法")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("workLoopSync")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("while")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("workInProgress "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!==")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("performUnitOfWork")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("workInProgress"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// performConcurrentWorkOnRoot会调用该方法")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("workLoopConcurrent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("while")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("workInProgress "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!==")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("shouldYield")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("performUnitOfWork")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("workInProgress"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br"),a("span",{staticClass:"line-number"},[t._v("13")]),a("br")])]),a("p",[t._v("可以看到，他们唯一的区别是是否调用"),a("code",[t._v("shouldYield")]),t._v("。如果当前浏览器帧没有剩余时间，"),a("code",[t._v("shouldYield")]),t._v("会中止循环，直到浏览器有空闲时间后再继续遍历。")]),t._v(" "),a("p",[a("code",[t._v("workInProgress")]),t._v("代表当前已创建的"),a("code",[t._v("workInProgress fiber")]),t._v("。")]),t._v(" "),a("p",[a("code",[t._v("performUnitOfWork")]),t._v("方法会创建下一个"),a("code",[t._v("Fiber节点")]),t._v("并赋值给"),a("code",[t._v("workInProgress")]),t._v("，并将"),a("code",[t._v("workInProgress")]),t._v("与已创建的"),a("code",[t._v("Fiber节点")]),t._v("连接起来构成"),a("code",[t._v("Fiber树")]),t._v("。")]),t._v(" "),a("blockquote",[a("p",[t._v("你可以从"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1599",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),a("OutboundLink")],1),t._v("看到"),a("code",[t._v("workLoopConcurrent")]),t._v("的源码")])]),t._v(" "),a("p",[t._v("我们知道"),a("code",[t._v("Fiber Reconciler")]),t._v("是从"),a("code",[t._v("Stack Reconciler")]),t._v("重构而来，通过遍历的方式实现可中断的递归，所以"),a("code",[t._v("performUnitOfWork")]),t._v("的工作可以分为两部分：“递”和“归”。")]),t._v(" "),a("h2",{attrs:{id:"递-阶段"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#递-阶段"}},[t._v("#")]),t._v(" “递”阶段")]),t._v(" "),a("p",[t._v("首先从"),a("code",[t._v("rootFiber")]),t._v("开始向下深度优先遍历。为遍历到的每个"),a("code",[t._v("Fiber节点")]),t._v("调用"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3058",target:"_blank",rel:"noopener noreferrer"}},[t._v("beginWork 方法"),a("OutboundLink")],1),t._v("。")]),t._v(" "),a("p",[t._v("该方法会根据传入的"),a("code",[t._v("Fiber节点")]),t._v("创建"),a("code",[t._v("子Fiber节点")]),t._v("，并将这两个"),a("code",[t._v("Fiber节点")]),t._v("连接起来。")]),t._v(" "),a("p",[t._v("当遍历到叶子节点（即没有子组件的组件）时就会进入“归”阶段。")]),t._v(" "),a("h2",{attrs:{id:"归-阶段"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#归-阶段"}},[t._v("#")]),t._v(" “归”阶段")]),t._v(" "),a("p",[t._v("在“归”阶段会调用"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L652",target:"_blank",rel:"noopener noreferrer"}},[t._v("completeWork"),a("OutboundLink")],1),t._v("处理"),a("code",[t._v("Fiber节点")]),t._v("。")]),t._v(" "),a("p",[t._v("当某个"),a("code",[t._v("Fiber节点")]),t._v("执行完"),a("code",[t._v("completeWork")]),t._v("，如果其存在"),a("code",[t._v("兄弟Fiber节点")]),t._v("（即"),a("code",[t._v("fiber.sibling !== null")]),t._v("），会进入其"),a("code",[t._v("兄弟Fiber")]),t._v("的“递”阶段。")]),t._v(" "),a("p",[t._v("如果不存在"),a("code",[t._v("兄弟Fiber")]),t._v("，会进入"),a("code",[t._v("父级Fiber")]),t._v("的“归”阶段。")]),t._v(" "),a("p",[t._v("“递”和“归”阶段会交错执行直到“归”到"),a("code",[t._v("rootFiber")]),t._v("。至此，"),a("code",[t._v("render阶段")]),t._v("的工作就结束了。")]),t._v(" "),a("h2",{attrs:{id:"例子"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#例子"}},[t._v("#")]),t._v(" 例子")]),t._v(" "),a("p",[t._v("以上一节的例子举例：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("App")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("div"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n      i am\n      "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("span"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("KaSong"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("span"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("div"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\nReactDOM"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("render")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("App "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" document"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getElementById")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'root'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br")])]),a("p",[t._v("对应的"),a("code",[t._v("Fiber树")]),t._v("结构：\n"),a("img",{attrs:{src:t.$withBase("/images/react/fiber.png"),alt:"Fiber架构"}})]),t._v(" "),a("p",[a("code",[t._v("render阶段")]),t._v("会依次执行：")]),t._v(" "),a("div",{staticClass:"language-sh line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-sh"}},[a("code",[a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v(". rootFiber beginWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),t._v(". App Fiber beginWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("3")]),t._v(". div Fiber beginWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("4")]),t._v(". "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"i am"')]),t._v(" Fiber beginWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("5")]),t._v(". "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"i am"')]),t._v(" Fiber completeWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("6")]),t._v(". span Fiber beginWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("7")]),t._v(". span Fiber completeWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("8")]),t._v(". div Fiber completeWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("9")]),t._v(". App Fiber completeWork\n"),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("10")]),t._v(". rootFiber completeWork\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br")])]),a("div",{staticClass:"custom-block warning"},[a("p",{staticClass:"custom-block-title"},[t._v("注意")]),t._v(" "),a("p",[t._v("之所以没有 “KaSong” Fiber 的 beginWork/completeWork，是因为作为一种性能优化手段，针对只有单一文本子节点的"),a("code",[t._v("Fiber")]),t._v("，"),a("code",[t._v("React")]),t._v("会特殊处理。")])]),t._v(" "),a("p",[t._v("::: details 自己试一试 Demo\n我在"),a("code",[t._v("beginWork")]),t._v("和"),a("code",[t._v("completeWork")]),t._v("调用时打印"),a("code",[t._v("fiber.tag")]),t._v("和"),a("code",[t._v("fiber.type")]),t._v("。")]),t._v(" "),a("p",[t._v("你可以从"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactWorkTags.js",target:"_blank",rel:"noopener noreferrer"}},[t._v("ReactWorkTags.js"),a("OutboundLink")],1),t._v("看到"),a("code",[t._v("Fiber节点")]),t._v("的所有"),a("code",[t._v("tag")]),t._v("定义。")]),t._v(" "),a("p",[t._v("相信多调试几次，你一定能明白方法的调用顺序")]),t._v(" "),a("p",[a("RouterLink",{attrs:{to:"/react/02-架构篇/me.html"}},[t._v("关注公众号")]),t._v("，后台回复"),a("strong",[t._v("904")]),t._v("获得在线 Demo 地址\n:::")],1),t._v(" "),a("p",[t._v("::: details performUnitOfWork 的递归版本")]),t._v(" "),a("p",[t._v("如果将"),a("code",[t._v("performUnitOfWork")]),t._v("转化为递归版本，大体代码如下：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("performUnitOfWork")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("fiber")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 执行beginWork")]),t._v("\n\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("child"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("performUnitOfWork")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("child"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 执行completeWork")]),t._v("\n\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sibling"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("performUnitOfWork")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sibling"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br"),a("span",{staticClass:"line-number"},[t._v("13")]),a("br")])]),a("p",[t._v(":::")]),t._v(" "),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),a("p",[t._v("本节我们介绍了"),a("code",[t._v("render阶段")]),t._v("会调用的方法。在接下来两节中，我们会讲解"),a("code",[t._v("beginWork")]),t._v("和"),a("code",[t._v("completeWork")]),t._v("做的具体工作。")]),t._v(" "),a("h2",{attrs:{id:"参考资料"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考资料"}},[t._v("#")]),t._v(" 参考资料")]),t._v(" "),a("p",[a("a",{attrs:{href:"https://indepth.dev/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-to-walk-the-components-tree/",target:"_blank",rel:"noopener noreferrer"}},[t._v("The how and why on React’s usage of linked list in Fiber to walk the component’s tree"),a("OutboundLink")],1)]),t._v(" "),a("p",[a("a",{attrs:{href:"https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/",target:"_blank",rel:"noopener noreferrer"}},[t._v("Inside Fiber: in-depth overview of the new reconciliation algorithm in React"),a("OutboundLink")],1)])])}),[],!1,null,null,null);s.default=e.exports}}]);