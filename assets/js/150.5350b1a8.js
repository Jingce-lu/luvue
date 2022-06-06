(window.webpackJsonp=window.webpackJsonp||[]).push([[150],{585:function(s,t,a){"use strict";a.r(t);var n=a(65),e=Object(n.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"流程概览"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#流程概览"}},[s._v("#")]),s._v(" 流程概览")]),s._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#before-mutation-之前"}},[s._v("before mutation 之前")])]),a("li",[a("a",{attrs:{href:"#layout-之后"}},[s._v("layout 之后")])])])]),a("p"),s._v(" "),a("p",[s._v("上一章"),a("RouterLink",{attrs:{to:"/react/02-架构篇/process/completeWork.html#流程结尾"}},[s._v("最后一节")]),s._v("我们介绍了，"),a("code",[s._v("commitRoot")]),s._v("方法是"),a("code",[s._v("commit阶段")]),s._v("工作的起点。"),a("code",[s._v("fiberRootNode")]),s._v("会作为传参。")],1),s._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[s._v("commitRoot")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br")])]),a("p",[s._v("在"),a("code",[s._v("rootFiber.firstEffect")]),s._v("上保存了一条需要执行"),a("code",[s._v("副作用")]),s._v("的"),a("code",[s._v("Fiber节点")]),s._v("的单向链表"),a("code",[s._v("effectList")]),s._v("，这些"),a("code",[s._v("Fiber节点")]),s._v("的"),a("code",[s._v("updateQueue")]),s._v("中保存了变化的"),a("code",[s._v("props")]),s._v("。")]),s._v(" "),a("p",[s._v("这些"),a("code",[s._v("副作用")]),s._v("对应的"),a("code",[s._v("DOM操作")]),s._v("在"),a("code",[s._v("commit")]),s._v("阶段执行。")]),s._v(" "),a("p",[s._v("除此之外，一些生命周期钩子（比如"),a("code",[s._v("componentDidXXX")]),s._v("）、"),a("code",[s._v("hook")]),s._v("（比如"),a("code",[s._v("useEffect")]),s._v("）需要在"),a("code",[s._v("commit")]),s._v("阶段执行。")]),s._v(" "),a("p",[a("code",[s._v("commit")]),s._v("阶段的主要工作（即"),a("code",[s._v("Renderer")]),s._v("的工作流程）分为三部分：")]),s._v(" "),a("ul",[a("li",[a("p",[s._v("before mutation 阶段（执行"),a("code",[s._v("DOM")]),s._v("操作前）")])]),s._v(" "),a("li",[a("p",[s._v("mutation 阶段（执行"),a("code",[s._v("DOM")]),s._v("操作）")])]),s._v(" "),a("li",[a("p",[s._v("layout 阶段（执行"),a("code",[s._v("DOM")]),s._v("操作后）")])])]),s._v(" "),a("p",[s._v("你可以从"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2001",target:"_blank",rel:"noopener noreferrer"}},[s._v("这里"),a("OutboundLink")],1),s._v("看到"),a("code",[s._v("commit")]),s._v("阶段的完整代码")]),s._v(" "),a("p",[s._v("在"),a("code",[s._v("before mutation阶段")]),s._v("之前和"),a("code",[s._v("layout阶段")]),s._v("之后还有一些额外工作，涉及到比如"),a("code",[s._v("useEffect")]),s._v("的触发、"),a("code",[s._v("优先级相关")]),s._v("的重置、"),a("code",[s._v("ref")]),s._v("的绑定/解绑。")]),s._v(" "),a("p",[s._v("这些对我们当前属于超纲内容，为了内容完整性，在这节简单介绍。")]),s._v(" "),a("h2",{attrs:{id:"before-mutation-之前"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#before-mutation-之前"}},[s._v("#")]),s._v(" before mutation 之前")]),s._v(" "),a("p",[a("code",[s._v("commitRootImpl")]),s._v("方法中直到第一句"),a("code",[s._v("if (firstEffect !== null)")]),s._v("之前属于"),a("code",[s._v("before mutation")]),s._v("之前。")]),s._v(" "),a("p",[s._v("我们大体看下他做的工作，现在你还不需要理解他们：")]),s._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("do")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，所以这里要一直遍历执行直到没有任务")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("flushPassiveEffects")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("while")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("rootWithPendingPassiveEffects "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!==")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// root指 fiberRootNode")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// root.finishedWork指当前应用的rootFiber")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" finishedWork "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 凡是变量名带lane的都是优先级相关")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("finishedLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("finishedWork "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("===")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\nroot"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("finishedWork "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\nroot"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("finishedLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 重置Scheduler绑定的回调函数")]),s._v("\nroot"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("callbackNode "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\nroot"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("callbackId "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("let")]),s._v(" remainingLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("mergeLanes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("lanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("childLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 重置优先级相关变量")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("markRootFinished")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" remainingLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("rootsWithPendingDiscreteUpdates "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!==")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("hasDiscreteLanes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("remainingLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&&")]),s._v("\n    rootsWithPendingDiscreteUpdates"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("has")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    rootsWithPendingDiscreteUpdates"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("delete")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 重置全局变量")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("===")]),s._v(" workInProgressRoot"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  workInProgressRoot "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  workInProgress "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  workInProgressRootRenderLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 将effectList赋值给firstEffect")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 由于每个fiber的effectList只包含他的子孙节点")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 所以根节点如果有effectTag则不会被包含进来")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 所以这里将有effectTag的根节点插入到effectList尾部")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 这样才能保证有effect的fiber都在effectList中")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("let")]),s._v(" firstEffect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("effectTag "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),s._v(" PerformedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("lastEffect "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!==")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("lastEffect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("nextEffect "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    firstEffect "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("firstEffect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    firstEffect "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 根节点没有effectTag")]),s._v("\n  firstEffect "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" finishedWork"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("firstEffect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br"),a("span",{staticClass:"line-number"},[s._v("38")]),a("br"),a("span",{staticClass:"line-number"},[s._v("39")]),a("br"),a("span",{staticClass:"line-number"},[s._v("40")]),a("br"),a("span",{staticClass:"line-number"},[s._v("41")]),a("br"),a("span",{staticClass:"line-number"},[s._v("42")]),a("br"),a("span",{staticClass:"line-number"},[s._v("43")]),a("br"),a("span",{staticClass:"line-number"},[s._v("44")]),a("br"),a("span",{staticClass:"line-number"},[s._v("45")]),a("br"),a("span",{staticClass:"line-number"},[s._v("46")]),a("br"),a("span",{staticClass:"line-number"},[s._v("47")]),a("br"),a("span",{staticClass:"line-number"},[s._v("48")]),a("br"),a("span",{staticClass:"line-number"},[s._v("49")]),a("br"),a("span",{staticClass:"line-number"},[s._v("50")]),a("br"),a("span",{staticClass:"line-number"},[s._v("51")]),a("br"),a("span",{staticClass:"line-number"},[s._v("52")]),a("br"),a("span",{staticClass:"line-number"},[s._v("53")]),a("br"),a("span",{staticClass:"line-number"},[s._v("54")]),a("br"),a("span",{staticClass:"line-number"},[s._v("55")]),a("br"),a("span",{staticClass:"line-number"},[s._v("56")]),a("br"),a("span",{staticClass:"line-number"},[s._v("57")]),a("br"),a("span",{staticClass:"line-number"},[s._v("58")]),a("br"),a("span",{staticClass:"line-number"},[s._v("59")]),a("br"),a("span",{staticClass:"line-number"},[s._v("60")]),a("br")])]),a("p",[s._v("可以看到，"),a("code",[s._v("before mutation")]),s._v("之前主要做一些变量赋值，状态重置的工作。")]),s._v(" "),a("p",[s._v("这一长串代码我们只需要关注最后赋值的"),a("code",[s._v("firstEffect")]),s._v("，在"),a("code",[s._v("commit")]),s._v("的三个子阶段都会用到他。")]),s._v(" "),a("h2",{attrs:{id:"layout-之后"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#layout-之后"}},[s._v("#")]),s._v(" layout 之后")]),s._v(" "),a("p",[s._v("接下来让我们简单看下"),a("code",[s._v("layout")]),s._v("阶段执行完后的代码，现在你还不需要理解他们：")]),s._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" rootDidHavePassiveEffects "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" rootDoesHavePassiveEffects"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// useEffect相关")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("rootDoesHavePassiveEffects"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  rootDoesHavePassiveEffects "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("false")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  rootWithPendingPassiveEffects "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  pendingPassiveEffectsLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" lanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n  pendingPassiveEffectsRenderPriority "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" renderPriorityLevel"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 性能优化相关")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("remainingLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!==")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("enableSchedulerTracing"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 性能优化相关")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("enableSchedulerTracing"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!")]),s._v("rootDidHavePassiveEffects"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...检测无限循环的同步任务")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("remainingLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("===")]),s._v(" SyncLane"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("ensureRootIsScheduled")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("root"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("now")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ...处理未捕获错误及老版本遗留的边界问题")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 执行同步任务，这样同步任务不需要等到下次事件循环再执行")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 比如在 componentDidMount 中执行 setState 创建的更新会在这里被同步执行")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 或useLayoutEffect")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("flushSyncCallbackQueue")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br"),a("span",{staticClass:"line-number"},[s._v("38")]),a("br"),a("span",{staticClass:"line-number"},[s._v("39")]),a("br"),a("span",{staticClass:"line-number"},[s._v("40")]),a("br"),a("span",{staticClass:"line-number"},[s._v("41")]),a("br"),a("span",{staticClass:"line-number"},[s._v("42")]),a("br"),a("span",{staticClass:"line-number"},[s._v("43")]),a("br")])]),a("blockquote",[a("p",[s._v("你可以在"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2195",target:"_blank",rel:"noopener noreferrer"}},[s._v("这里"),a("OutboundLink")],1),s._v("看到这段代码")])]),s._v(" "),a("p",[s._v("主要包括三点内容：")]),s._v(" "),a("ol",[a("li",[a("code",[s._v("useEffect")]),s._v("相关的处理。")])]),s._v(" "),a("p",[s._v("我们会在讲解"),a("code",[s._v("layout阶段")]),s._v("时讲解。")]),s._v(" "),a("ol",{attrs:{start:"2"}},[a("li",[s._v("性能追踪相关。")])]),s._v(" "),a("p",[s._v("源码里有很多和"),a("code",[s._v("interaction")]),s._v("相关的变量。他们都和追踪"),a("code",[s._v("React")]),s._v("渲染时间、性能相关，在"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/profiler.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Profiler API"),a("OutboundLink")],1),s._v("和"),a("a",{attrs:{href:"https://github.com/facebook/react-devtools/pull/1069",target:"_blank",rel:"noopener noreferrer"}},[s._v("DevTools"),a("OutboundLink")],1),s._v("中使用。")]),s._v(" "),a("blockquote",[a("p",[s._v("你可以在这里看到"),a("a",{attrs:{href:"https://gist.github.com/bvaughn/8de925562903afd2e7a12554adcdda16#overview",target:"_blank",rel:"noopener noreferrer"}},[s._v("interaction 的定义"),a("OutboundLink")],1)])]),s._v(" "),a("ol",{attrs:{start:"3"}},[a("li",[s._v("在"),a("code",[s._v("commit")]),s._v("阶段会触发一些生命周期钩子（如 "),a("code",[s._v("componentDidXXX")]),s._v("）和"),a("code",[s._v("hook")]),s._v("（如"),a("code",[s._v("useLayoutEffect")]),s._v("、"),a("code",[s._v("useEffect")]),s._v("）。")])]),s._v(" "),a("p",[s._v("在这些回调方法中可能触发新的更新，新的更新会开启新的"),a("code",[s._v("render-commit")]),s._v("流程。考虑如下 Demo：")]),s._v(" "),a("p",[s._v("::: details useLayoutEffect Demo")]),s._v(" "),a("p",[s._v("在该 Demo 中我们点击页面中的数字，状态会先变为 0，再在"),a("code",[s._v("useLayoutEffect")]),s._v("回调中变为随机数。但在页面上数字不会变为 0，而是直接变为新的随机数。")]),s._v(" "),a("p",[s._v("这是因为"),a("code",[s._v("useLayoutEffect")]),s._v("会在"),a("code",[s._v("layout阶段")]),s._v("同步执行回调。回调中我们触发了状态更新"),a("code",[s._v("setCount(randomNum)")]),s._v("，这会重新调度一个同步任务。")]),s._v(" "),a("p",[s._v("该任务会在在如上"),a("code",[s._v("commitRoot")]),s._v("倒数第二行代码处被同步执行。")]),s._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[s._v("flushSyncCallbackQueue")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br")])]),a("p",[s._v("所以我们看不到页面中元素先变为 0。")]),s._v(" "),a("p",[s._v("如果换成"),a("code",[s._v("useEffect")]),s._v("多点击几次就能看到区别。")]),s._v(" "),a("p",[a("RouterLink",{attrs:{to:"/react/02-架构篇/me.html"}},[s._v("关注公众号")]),s._v("，后台回复"),a("strong",[s._v("908")]),s._v("获得在线 Demo 地址")],1),s._v(" "),a("p",[s._v(":::")])])}),[],!1,null,null,null);t.default=e.exports}}]);