(window.webpackJsonp=window.webpackJsonp||[]).push([[114],{542:function(e,t,a){"use strict";a.r(t);var s=a(62),r=Object(s.a)({},(function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[a("h1",{attrs:{id:"概览"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#概览"}},[e._v("#")]),e._v(" 概览")]),e._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#底层架构-fiber-架构"}},[e._v("底层架构 —— Fiber 架构")])]),a("li",[a("a",{attrs:{href:"#架构的驱动力-scheduler"}},[e._v("架构的驱动力 —— Scheduler")])]),a("li",[a("a",{attrs:{href:"#架构运行策略-lane-模型"}},[e._v("架构运行策略 —— lane 模型")])]),a("li",[a("a",{attrs:{href:"#上层实现"}},[e._v("上层实现")]),a("ul",[a("li",[a("a",{attrs:{href:"#batchedupdates"}},[e._v("batchedUpdates")])]),a("li",[a("a",{attrs:{href:"#suspense"}},[e._v("Suspense")])]),a("li",[a("a",{attrs:{href:"#usedeferredvalue"}},[e._v("useDeferredValue")])])])]),a("li",[a("a",{attrs:{href:"#总结"}},[e._v("总结")])])])]),a("p"),e._v(" "),a("p",[e._v("在"),a("RouterLink",{attrs:{to:"/react/03-实现篇/state/reactdom.html#react的其他入口函数"}},[e._v("ReactDOM.render")]),e._v("一节我们介绍了"),a("code",[e._v("React")]),e._v("当前的三种入口函数。日常开发主要使用的是"),a("code",[e._v("Legacy Mode")]),e._v("（通过"),a("code",[e._v("ReactDOM.render")]),e._v("创建）。")],1),e._v(" "),a("p",[e._v("从"),a("a",{attrs:{href:"https://mp.weixin.qq.com/s/zrrqldzRbcPApga_Cp2b8A",target:"_blank",rel:"noopener noreferrer"}},[e._v("React v17.0 正式发布！"),a("OutboundLink")],1),e._v("一文可以看到，"),a("code",[e._v("v17.0")]),e._v("没有包含新特性。究其原因，"),a("code",[e._v("v17.0")]),e._v("主要的工作在于源码内部对"),a("code",[e._v("Concurrent Mode")]),e._v("的支持。所以"),a("code",[e._v("v17")]),e._v("版本也被称为“垫脚石”版本。")]),e._v(" "),a("p",[e._v("你可以从官网"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html",target:"_blank",rel:"noopener noreferrer"}},[e._v("Concurrent 模式介绍"),a("OutboundLink")],1),e._v("了解其基本概念。")]),e._v(" "),a("p",[e._v("一句话概括：")]),e._v(" "),a("blockquote",[a("p",[e._v("Concurrent 模式是一组 React 的新功能，可帮助应用保持响应，并根据用户的设备性能和网速进行适当的调整。")])]),e._v(" "),a("p",[a("code",[e._v("Concurrent Mode")]),e._v("是"),a("code",[e._v("React")]),e._v("过去 2 年重构"),a("code",[e._v("Fiber架构")]),e._v("的源动力，也是"),a("code",[e._v("React")]),e._v("未来的发展方向。")]),e._v(" "),a("p",[e._v("可以预见，当"),a("code",[e._v("v17")]),e._v("完美支持"),a("code",[e._v("Concurrent Mode")]),e._v("后，"),a("code",[e._v("v18")]),e._v("会迎来一大波基于"),a("code",[e._v("Concurrent Mode")]),e._v("的库。")]),e._v(" "),a("p",[e._v("底层基础决定了上层"),a("code",[e._v("API")]),e._v("的实现，接下来让我们了解下，"),a("code",[e._v("Concurrent Mode")]),e._v("自底向上都包含哪些组成部分，能够发挥哪些能力？")]),e._v(" "),a("h2",{attrs:{id:"底层架构-fiber-架构"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#底层架构-fiber-架构"}},[e._v("#")]),e._v(" 底层架构 —— Fiber 架构")]),e._v(" "),a("p",[e._v("从"),a("RouterLink",{attrs:{to:"/react/03-实现篇/preparation/idea.html"}},[e._v("设计理念")]),e._v("我们了解到要实现"),a("code",[e._v("Concurrent Mode")]),e._v("，最关键的一点是：实现异步可中断的更新。")],1),e._v(" "),a("p",[e._v("基于这个前提，"),a("code",[e._v("React")]),e._v("花费 2 年时间重构完成了"),a("code",[e._v("Fiber")]),e._v("架构。")]),e._v(" "),a("p",[a("code",[e._v("Fiber")]),e._v("架构的意义在于，他将单个"),a("code",[e._v("组件")]),e._v("作为"),a("code",[e._v("工作单元")]),e._v("，使以"),a("code",[e._v("组件")]),e._v("为粒度的“异步可中断的更新”成为可能。")]),e._v(" "),a("h2",{attrs:{id:"架构的驱动力-scheduler"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#架构的驱动力-scheduler"}},[e._v("#")]),e._v(" 架构的驱动力 —— Scheduler")]),e._v(" "),a("p",[e._v("如果我们同步运行"),a("code",[e._v("Fiber")]),e._v("架构（通过"),a("code",[e._v("ReactDOM.render")]),e._v("），则"),a("code",[e._v("Fiber")]),e._v("架构与重构前并无区别。")]),e._v(" "),a("p",[e._v("但是当我们配合"),a("code",[e._v("时间切片")]),e._v("，就能根据宿主环境性能，为每个"),a("code",[e._v("工作单元")]),e._v("分配一个"),a("code",[e._v("可运行时间")]),e._v("，实现“异步可中断的更新”。")]),e._v(" "),a("p",[e._v("于是，"),a("a",{attrs:{href:"https://github.com/facebook/react/tree/master/packages/scheduler",target:"_blank",rel:"noopener noreferrer"}},[e._v("scheduler"),a("OutboundLink")],1),e._v("（调度器）产生了。")]),e._v(" "),a("h2",{attrs:{id:"架构运行策略-lane-模型"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#架构运行策略-lane-模型"}},[e._v("#")]),e._v(" 架构运行策略 —— lane 模型")]),e._v(" "),a("p",[e._v("到目前为止，"),a("code",[e._v("React")]),e._v("可以控制"),a("code",[e._v("更新")]),e._v("在"),a("code",[e._v("Fiber")]),e._v("架构中运行/中断/继续运行。")]),e._v(" "),a("p",[e._v("基于当前的架构，当一次"),a("code",[e._v("更新")]),e._v("在运行过程中被中断，过段时间再继续运行，这就是“异步可中断的更新”。")]),e._v(" "),a("p",[e._v("当一次"),a("code",[e._v("更新")]),e._v("在运行过程中被中断，转而重新开始一次新的"),a("code",[e._v("更新")]),e._v("，我们可以说：后一次"),a("code",[e._v("更新")]),e._v("打断了前一次"),a("code",[e._v("更新")]),e._v("。")]),e._v(" "),a("p",[e._v("这就是"),a("code",[e._v("优先级")]),e._v("的概念：后一次"),a("code",[e._v("更新")]),e._v("的"),a("code",[e._v("优先级")]),e._v("更高，他打断了正在进行的前一次"),a("code",[e._v("更新")]),e._v("。")]),e._v(" "),a("p",[e._v("多个"),a("code",[e._v("优先级")]),e._v("之间如何互相打断？"),a("code",[e._v("优先级")]),e._v("能否升降？本次"),a("code",[e._v("更新")]),e._v("应该赋予什么"),a("code",[e._v("优先级")]),e._v("？")]),e._v(" "),a("p",[e._v("这就需要一个模型控制不同"),a("code",[e._v("优先级")]),e._v("之间的关系与行为，于是"),a("code",[e._v("lane")]),e._v("模型诞生了。")]),e._v(" "),a("h2",{attrs:{id:"上层实现"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#上层实现"}},[e._v("#")]),e._v(" 上层实现")]),e._v(" "),a("p",[e._v("现在，我们可以说：")]),e._v(" "),a("blockquote",[a("p",[e._v("从源码层面讲，Concurrent Mode 是一套可控的“多优先级更新架构”。")])]),e._v(" "),a("p",[e._v("那么基于该架构之上可以实现哪些有意思的功能？我们举几个例子：")]),e._v(" "),a("h3",{attrs:{id:"batchedupdates"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#batchedupdates"}},[e._v("#")]),e._v(" batchedUpdates")]),e._v(" "),a("p",[e._v("如果我们在一次事件回调中触发多次"),a("code",[e._v("更新")]),e._v("，他们会被合并为一次"),a("code",[e._v("更新")]),e._v("进行处理。")]),e._v(" "),a("p",[e._v("如下代码执行只会触发一次"),a("code",[e._v("更新")]),e._v("：")]),e._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[e._v("onClick")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[e._v("stateA")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[e._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(";")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[e._v("stateB")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[e._v("false")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(";")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[e._v("stateA")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[e._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(";")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])]),e._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[e._v("1")]),a("br"),a("span",{staticClass:"line-number"},[e._v("2")]),a("br"),a("span",{staticClass:"line-number"},[e._v("3")]),a("br"),a("span",{staticClass:"line-number"},[e._v("4")]),a("br"),a("span",{staticClass:"line-number"},[e._v("5")]),a("br")])]),a("p",[e._v("这种合并多个"),a("code",[e._v("更新")]),e._v("的优化方式被称为"),a("code",[e._v("batchedUpdates")]),e._v("。")]),e._v(" "),a("p",[a("code",[e._v("batchedUpdates")]),e._v("在很早的版本就存在了，不过之前的实现局限很多（脱离当前上下文环境的"),a("code",[e._v("更新")]),e._v("不会被合并）。")]),e._v(" "),a("p",[e._v("在"),a("code",[e._v("Concurrent Mode")]),e._v("中，是以"),a("code",[e._v("优先级")]),e._v("为依据对更新进行合并的，使用范围更广。")]),e._v(" "),a("h3",{attrs:{id:"suspense"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#suspense"}},[e._v("#")]),e._v(" Suspense")]),e._v(" "),a("p",[a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html",target:"_blank",rel:"noopener noreferrer"}},[e._v("Suspense"),a("OutboundLink")],1),e._v("可以在组件请求数据时展示一个"),a("code",[e._v("pending")]),e._v("状态。请求成功后渲染数据。")]),e._v(" "),a("p",[e._v("本质上讲"),a("code",[e._v("Suspense")]),e._v("内的组件子树比组件树的其他部分拥有更低的"),a("code",[e._v("优先级")]),e._v("。")]),e._v(" "),a("h3",{attrs:{id:"usedeferredvalue"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#usedeferredvalue"}},[e._v("#")]),e._v(" useDeferredValue")]),e._v(" "),a("p",[a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue",target:"_blank",rel:"noopener noreferrer"}},[e._v("useDeferredValue"),a("OutboundLink")],1),e._v("返回一个延迟响应的值，该值可能“延后”的最长时间为"),a("code",[e._v("timeoutMs")]),e._v("。")]),e._v(" "),a("p",[e._v("例子：")]),e._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" deferredValue "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("useDeferredValue")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),e._v("value"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[e._v("timeoutMs")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[e._v("2000")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(";")]),e._v("\n")])]),e._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[e._v("1")]),a("br")])]),a("p",[e._v("在"),a("code",[e._v("useDeferredValue")]),e._v("内部会调用"),a("code",[e._v("useState")]),e._v("并触发一次"),a("code",[e._v("更新")]),e._v("。")]),e._v(" "),a("p",[e._v("这次"),a("code",[e._v("更新")]),e._v("的"),a("code",[e._v("优先级")]),e._v("很低，所以当前如果有正在进行中的"),a("code",[e._v("更新")]),e._v("，不会受"),a("code",[e._v("useDeferredValue")]),e._v("产生的"),a("code",[e._v("更新")]),e._v("影响。所以"),a("code",[e._v("useDeferredValue")]),e._v("能够返回延迟的值。")]),e._v(" "),a("p",[e._v("当超过"),a("code",[e._v("timeoutMs")]),e._v("后"),a("code",[e._v("useDeferredValue")]),e._v("产生的"),a("code",[e._v("更新")]),e._v("还没进行（由于"),a("code",[e._v("优先级")]),e._v("太低一直被打断），则会再触发一次高优先级"),a("code",[e._v("更新")]),e._v("。")]),e._v(" "),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[e._v("#")]),e._v(" 总结")]),e._v(" "),a("p",[e._v("除了以上介绍的实现，相信未来"),a("code",[e._v("React")]),e._v("还会开发更多基于"),a("code",[e._v("Concurrent Mode")]),e._v("的玩法。")]),e._v(" "),a("p",[a("code",[e._v("Fiber")]),e._v("架构在之前的章节已经学习了。所以，在本章接下来的部分，我们会按照上文的脉络，自底向上，从架构到实现讲解"),a("code",[e._v("Concurrent Mode")]),e._v("。")])])}),[],!1,null,null,null);t.default=r.exports}}]);