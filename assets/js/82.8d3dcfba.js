(window.webpackJsonp=window.webpackJsonp||[]).push([[82],{490:function(t,e,a){"use strict";a.r(e);var s=a(56),r=Object(s.a)({},(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"深入理解优先级"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#深入理解优先级"}},[t._v("#")]),t._v(" 深入理解优先级")]),t._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#什么是优先级"}},[t._v("什么是优先级")])]),a("li",[a("a",{attrs:{href:"#如何调度优先级"}},[t._v("如何调度优先级")])]),a("li",[a("a",{attrs:{href:"#例子"}},[t._v("例子")])]),a("li",[a("a",{attrs:{href:"#如何保证状态正确"}},[t._v("如何保证状态正确")]),a("ul",[a("li",[a("a",{attrs:{href:"#如何保证-update-不丢失"}},[t._v("如何保证Update不丢失")])]),a("li",[a("a",{attrs:{href:"#如何保证状态依赖的连续性"}},[t._v("如何保证状态依赖的连续性")])])])]),a("li",[a("a",{attrs:{href:"#参考资料"}},[t._v("参考资料")])])])]),a("p"),t._v(" "),a("p",[t._v("通过"),a("RouterLink",{attrs:{to:"/react/03-实现篇/02-第六章状态更新/mental.html"}},[t._v("更新的心智模型")]),t._v("，我们了解到"),a("code",[t._v("更新")]),t._v("具有"),a("code",[t._v("优先级")]),t._v("。")],1),t._v(" "),a("p",[t._v("那么什么是"),a("code",[t._v("优先级")]),t._v("？"),a("code",[t._v("优先级")]),t._v("以什么为依据？如何通过"),a("code",[t._v("优先级")]),t._v("决定哪个状态应该先被更新？")]),t._v(" "),a("p",[t._v("本节我们会详细讲解。")]),t._v(" "),a("h2",{attrs:{id:"什么是优先级"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#什么是优先级"}},[t._v("#")]),t._v(" 什么是优先级")]),t._v(" "),a("p",[t._v("在"),a("RouterLink",{attrs:{to:"/react/03-实现篇/preparation/idea.html#理解-响应自然"}},[t._v("React 理念一节")]),t._v("我们聊到"),a("code",[t._v("React")]),t._v("将人机交互研究的结果整合到真实的"),a("code",[t._v("UI")]),t._v("中。具体到"),a("code",[t._v("React")]),t._v("运行上这是什么意思呢？")],1),t._v(" "),a("p",[a("code",[t._v("状态更新")]),t._v("由"),a("code",[t._v("用户交互")]),t._v("产生，用户心里对"),a("code",[t._v("交互")]),t._v("执行顺序有个预期。"),a("code",[t._v("React")]),t._v("根据"),a("code",[t._v("人机交互研究的结果")]),t._v("中用户对"),a("code",[t._v("交互")]),t._v("的预期顺序为"),a("code",[t._v("交互")]),t._v("产生的"),a("code",[t._v("状态更新")]),t._v("赋予不同优先级。")]),t._v(" "),a("p",[t._v("具体如下：")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("生命周期方法：同步执行。")])]),t._v(" "),a("li",[a("p",[t._v("受控的用户输入：比如输入框内输入文字，同步执行。")])]),t._v(" "),a("li",[a("p",[t._v("交互事件：比如动画，高优先级执行。")])]),t._v(" "),a("li",[a("p",[t._v("其他：比如数据请求，低优先级执行。")])])]),t._v(" "),a("h2",{attrs:{id:"如何调度优先级"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何调度优先级"}},[t._v("#")]),t._v(" 如何调度优先级")]),t._v(" "),a("p",[t._v("我们在"),a("RouterLink",{attrs:{to:"/react/03-实现篇/preparation/newConstructure.html"}},[t._v("新的 React 结构一节")]),t._v("讲到，"),a("code",[t._v("React")]),t._v("通过"),a("code",[t._v("Scheduler")]),t._v("调度任务。")],1),t._v(" "),a("p",[t._v("具体到代码，每当需要调度任务时，"),a("code",[t._v("React")]),t._v("会调用"),a("code",[t._v("Scheduler")]),t._v("提供的方法"),a("code",[t._v("runWithPriority")]),t._v("。")]),t._v(" "),a("p",[t._v("该方法接收一个"),a("code",[t._v("优先级")]),t._v("常量与一个"),a("code",[t._v("回调函数")]),t._v("作为参数。"),a("code",[t._v("回调函数")]),t._v("会以"),a("code",[t._v("优先级")]),t._v("高低为顺序排列在一个"),a("code",[t._v("定时器")]),t._v("中并在合适的时间触发。")]),t._v(" "),a("p",[t._v("对于更新来讲，传递的"),a("code",[t._v("回调函数")]),t._v("一般为"),a("RouterLink",{attrs:{to:"/react/03-实现篇/02-第六章状态更新/prepare.html#render阶段的开始"}},[t._v("状态更新流程概览一节")]),t._v("讲到的"),a("code",[t._v("render阶段的入口函数")]),t._v("。")],1),t._v(" "),a("blockquote",[a("p",[t._v("你可以在"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/scheduler/src/Scheduler.js#L217",target:"_blank",rel:"noopener noreferrer"}},[t._v("==unstable_runWithPriority== 这里"),a("OutboundLink")],1),t._v("看到"),a("code",[t._v("runWithPriority")]),t._v("方法的定义。在"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/scheduler/src/SchedulerPriorities.js",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),a("OutboundLink")],1),t._v("看到"),a("code",[t._v("Scheduler")]),t._v("对优先级常量的定义。")])]),t._v(" "),a("h2",{attrs:{id:"例子"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#例子"}},[t._v("#")]),t._v(" 例子")]),t._v(" "),a("p",[t._v("优先级最终会反映到"),a("code",[t._v("update.lane")]),t._v("变量上。当前我们只需要知道这个变量能够区分"),a("code",[t._v("Update")]),t._v("的优先级。")]),t._v(" "),a("p",[t._v("接下来我们通过一个例子结合上一节介绍的"),a("code",[t._v("Update")]),t._v("相关字段讲解优先级如何决定更新的顺序。")]),t._v(" "),a("blockquote",[a("p",[t._v("该例子来自"),a("a",{attrs:{href:"https://twitter.com/acdlite/status/978412930973687808",target:"_blank",rel:"noopener noreferrer"}},[t._v("React Core Team Andrew 向网友讲解 Update 工作流程的推文"),a("OutboundLink")],1)])]),t._v(" "),a("img",{attrs:{src:t.$withBase("/images/react/update-process.png"),alt:"优先级如何决定更新的顺序"}}),t._v(" "),a("p",[t._v("在这个例子中，有两个"),a("code",[t._v("Update")]),t._v("。我们将“关闭黑夜模式”产生的"),a("code",[t._v("Update")]),t._v("称为"),a("code",[t._v("u1")]),t._v("，输入字母“I”产生的"),a("code",[t._v("Update")]),t._v("称为"),a("code",[t._v("u2")]),t._v("。")]),t._v(" "),a("p",[t._v("其中"),a("code",[t._v("u1")]),t._v("先触发并进入"),a("code",[t._v("render阶段")]),t._v("。其优先级较低，执行时间较长。此时：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("blackTheme")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("text")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'H'")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("firstBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("lastBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("shared")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("pending")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" u1\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("effects")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br")])]),a("p",[t._v("在"),a("code",[t._v("u1")]),t._v("完成"),a("code",[t._v("render阶段")]),t._v("前用户通过键盘输入字母“I”，产生了"),a("code",[t._v("u2")]),t._v("。"),a("code",[t._v("u2")]),t._v("属于"),a("strong",[t._v("受控的用户输入")]),t._v("，优先级高于"),a("code",[t._v("u1")]),t._v("，于是中断"),a("code",[t._v("u1")]),t._v("产生的"),a("code",[t._v("render阶段")]),t._v("。")]),t._v(" "),a("p",[t._v("此时：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("shared"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("pending "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" u2 "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" u1\n                                     "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("^")]),t._v("        "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v("\n                                     "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v("________"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 即")]),t._v("\nu2"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("next "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" u1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\nu1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("next "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" u2"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br")])]),a("p",[t._v("其中"),a("code",[t._v("u2")]),t._v("优先级高于"),a("code",[t._v("u1")]),t._v("。")]),t._v(" "),a("p",[t._v("接下来进入"),a("code",[t._v("u2")]),t._v("产生的"),a("code",[t._v("render阶段")]),t._v("。")]),t._v(" "),a("p",[t._v("在"),a("code",[t._v("processUpdateQueue")]),t._v("方法中，"),a("code",[t._v("shared.pending")]),t._v("环状链表会被剪开并拼接在"),a("code",[t._v("baseUpdate")]),t._v("后面。")]),t._v(" "),a("p",[t._v("需要明确一点，"),a("code",[t._v("shared.pending")]),t._v("指向最后一个"),a("code",[t._v("pending")]),t._v("的"),a("code",[t._v("update")]),t._v("，所以实际执行时"),a("code",[t._v("update")]),t._v("的顺序为：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("u1 "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),t._v(" u2\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br")])]),a("p",[t._v("接下来遍历"),a("code",[t._v("baseUpdate")]),t._v("，处理优先级合适的"),a("code",[t._v("Update")]),t._v("（这一次处理的是更高优的"),a("code",[t._v("u2")]),t._v("）。")]),t._v(" "),a("p",[t._v("由于"),a("code",[t._v("u2")]),t._v("不是"),a("code",[t._v("baseUpdate")]),t._v("中的第一个"),a("code",[t._v("update")]),t._v("，在其之前的"),a("code",[t._v("u1")]),t._v("由于优先级不够被跳过。")]),t._v(" "),a("p",[a("code",[t._v("update")]),t._v("之间可能有依赖关系，所以被跳过的"),a("code",[t._v("update")]),t._v("及其后面所有"),a("code",[t._v("update")]),t._v("会成为下次更新的"),a("code",[t._v("baseUpdate")]),t._v("。（即"),a("code",[t._v("u1 -- u2")]),t._v("）。")]),t._v(" "),a("p",[t._v("最终"),a("code",[t._v("u2")]),t._v("完成"),a("code",[t._v("render - commit阶段")]),t._v("。")]),t._v(" "),a("p",[t._v("此时：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("blackTheme")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("text")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'HI'")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("firstBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" u1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("lastBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" u2\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("shared")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("pending")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("effects")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br")])]),a("p",[t._v("在"),a("code",[t._v("commit")]),t._v("阶段结尾会再调度一次更新。在该次更新中会基于"),a("code",[t._v("baseState")]),t._v("中"),a("code",[t._v("firstBaseUpdate")]),t._v("保存的"),a("code",[t._v("u1")]),t._v("，开启一次新的"),a("code",[t._v("render阶段")]),t._v("。")]),t._v(" "),a("p",[t._v("最终两次"),a("code",[t._v("Update")]),t._v("都完成后的结果如下：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("fiber"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("blackTheme")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("false")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("text")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'HI'")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("firstBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("lastBaseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("shared")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("pending")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("effects")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br")])]),a("p",[t._v("我们可以看见，"),a("code",[t._v("u2")]),t._v("对应的更新执行了两次，相应的"),a("code",[t._v("render阶段")]),t._v("的生命周期勾子"),a("code",[t._v("componentWillXXX")]),t._v("也会触发两次。这也是为什么这些勾子会被标记为"),a("code",[t._v("unsafe_")]),t._v("。")]),t._v(" "),a("h2",{attrs:{id:"如何保证状态正确"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何保证状态正确"}},[t._v("#")]),t._v(" 如何保证状态正确")]),t._v(" "),a("p",[t._v("现在我们基本掌握了"),a("code",[t._v("updateQueue")]),t._v("的工作流程。还有两个疑问：")]),t._v(" "),a("ul",[a("li",[a("p",[a("code",[t._v("render阶段")]),t._v("可能被中断。如何保证"),a("code",[t._v("updateQueue")]),t._v("中保存的"),a("code",[t._v("Update")]),t._v("不丢失？")])]),t._v(" "),a("li",[a("p",[t._v("有时候当前"),a("code",[t._v("状态")]),t._v("需要依赖前一个"),a("code",[t._v("状态")]),t._v("。如何在支持跳过"),a("code",[t._v("低优先级状态")]),t._v("的同时保证"),a("strong",[t._v("状态依赖的连续性")]),t._v("？")])])]),t._v(" "),a("p",[t._v("我们分别讲解下。")]),t._v(" "),a("h3",{attrs:{id:"如何保证update不丢失"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何保证update不丢失"}},[t._v("#")]),t._v(" 如何保证"),a("code",[t._v("Update")]),t._v("不丢失")]),t._v(" "),a("p",[t._v("在"),a("RouterLink",{attrs:{to:"/react/03-实现篇/02-第六章状态更新/update.html#例子"}},[t._v("上一节例子")]),t._v("中我们讲到，在"),a("code",[t._v("render阶段")]),t._v("，"),a("code",[t._v("shared.pending")]),t._v("的环被剪开并连接在"),a("code",[t._v("updateQueue.lastBaseUpdate")]),t._v("后面。")],1),t._v(" "),a("p",[t._v("实际上"),a("code",[t._v("shared.pending")]),t._v("会被同时连接在"),a("code",[t._v("workInProgress updateQueue.lastBaseUpdate")]),t._v("与"),a("code",[t._v("current updateQueue.lastBaseUpdate")]),t._v("后面。")]),t._v(" "),a("blockquote",[a("p",[t._v("具体代码见"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L424",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),a("OutboundLink")],1)])]),t._v(" "),a("p",[t._v("当"),a("code",[t._v("render阶段")]),t._v("被中断后重新开始时，会基于"),a("code",[t._v("current updateQueue")]),t._v("克隆出"),a("code",[t._v("workInProgress updateQueue")]),t._v("。由于"),a("code",[t._v("current updateQueue.lastBaseUpdate")]),t._v("已经保存了上一次的"),a("code",[t._v("Update")]),t._v("，所以不会丢失。")]),t._v(" "),a("p",[t._v("当"),a("code",[t._v("commit阶段")]),t._v("完成渲染，由于"),a("code",[t._v("workInProgress updateQueue.lastBaseUpdate")]),t._v("中保存了上一次的"),a("code",[t._v("Update")]),t._v("，所以 "),a("code",[t._v("workInProgress Fiber树")]),t._v("变成"),a("code",[t._v("current Fiber树")]),t._v("后也不会造成"),a("code",[t._v("Update")]),t._v("丢失。")]),t._v(" "),a("h3",{attrs:{id:"如何保证状态依赖的连续性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何保证状态依赖的连续性"}},[t._v("#")]),t._v(" 如何保证状态依赖的连续性")]),t._v(" "),a("p",[t._v("当某个"),a("code",[t._v("Update")]),t._v("由于优先级低而被跳过时，保存在"),a("code",[t._v("baseUpdate")]),t._v("中的不仅是该"),a("code",[t._v("Update")]),t._v("，还包括链表中该"),a("code",[t._v("Update")]),t._v("之后的所有"),a("code",[t._v("Update")]),t._v("。")]),t._v(" "),a("p",[t._v("考虑如下例子：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("''")]),t._v("\nshared"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("pending"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("A1")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("B2")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C1")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("D2")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br")])]),a("p",[t._v("其中"),a("code",[t._v("字母")]),t._v("代表该"),a("code",[t._v("Update")]),t._v("要在页面插入的字母，"),a("code",[t._v("数字")]),t._v("代表"),a("code",[t._v("优先级")]),t._v("，值越低"),a("code",[t._v("优先级")]),t._v("越高。")]),t._v(" "),a("p",[t._v("第一次"),a("code",[t._v("render")]),t._v("，"),a("code",[t._v("优先级")]),t._v("为 1。")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("''")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("render阶段使用的Update")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("A1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("memoizedState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'AC'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("其中"),a("code",[t._v("B2")]),t._v("由于优先级为 2，低于当前优先级，所以他及其后面的所有"),a("code",[t._v("Update")]),t._v("会被保存在"),a("code",[t._v("baseUpdate")]),t._v("中作为下次更新的"),a("code",[t._v("Update")]),t._v("（即"),a("code",[t._v("B2 C1 D2")]),t._v("）。")]),t._v(" "),a("p",[t._v("这么做是为了保持"),a("code",[t._v("状态")]),t._v("的前后依赖顺序。")]),t._v(" "),a("p",[t._v("第二次"),a("code",[t._v("render")]),t._v("，"),a("code",[t._v("优先级")]),t._v("为 2。")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'A'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseUpdate")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("B2")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C1")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("--")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("D2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("render阶段使用的Update")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("B2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("D2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("memoizedState")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'ABCD'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("注意这里"),a("code",[t._v("baseState")]),t._v("并不是上一次更新的"),a("code",[t._v("memoizedState")]),t._v("。这是由于"),a("code",[t._v("B2")]),t._v("被跳过了。")]),t._v(" "),a("p",[t._v("即当有"),a("code",[t._v("Update")]),t._v("被跳过时，"),a("code",[t._v("下次更新的baseState !== 上次更新的memoizedState")]),t._v("。")]),t._v(" "),a("blockquote",[a("p",[t._v("跳过"),a("code",[t._v("B2")]),t._v("的逻辑见"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L479",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),a("OutboundLink")],1)])]),t._v(" "),a("p",[t._v("通过以上例子我们可以发现，"),a("code",[t._v("React")]),t._v("保证最终的状态一定和用户触发的"),a("code",[t._v("交互")]),t._v("一致，但是中间过程"),a("code",[t._v("状态")]),t._v("可能由于设备不同而不同。")]),t._v(" "),a("p",[t._v(":::details 高优先级任务打断低优先级任务 Demo")]),t._v(" "),a("p",[a("RouterLink",{attrs:{to:"/react/03-实现篇/me.html"}},[t._v("关注公众号")]),t._v("，后台回复"),a("strong",[t._v("815")]),t._v("获得在线 Demo 地址")],1),t._v(" "),a("p",[t._v(":::")]),t._v(" "),a("h2",{attrs:{id:"参考资料"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考资料"}},[t._v("#")]),t._v(" 参考资料")]),t._v(" "),a("p",[a("a",{attrs:{href:"https://juejin.im/post/5f05a3e25188252e5c576cdb",target:"_blank",rel:"noopener noreferrer"}},[t._v("深入源码剖析 componentWillXXX 为什么 UNSAFE"),a("OutboundLink")],1)]),t._v(" "),a("p",[a("a",{attrs:{href:"https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactUpdateQueue.new.js#L10",target:"_blank",rel:"noopener noreferrer"}},[t._v("React 源码中讲解 Update 工作流程及优先级的注释"),a("OutboundLink")],1)]),t._v(" "),a("p",[a("a",{attrs:{href:"https://twitter.com/acdlite/status/978412930973687808",target:"_blank",rel:"noopener noreferrer"}},[t._v("React Core Team Andrew 向网友讲解 Update 工作流程的推文"),a("OutboundLink")],1)])])}),[],!1,null,null,null);e.default=r.exports}}]);