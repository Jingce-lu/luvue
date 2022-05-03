(window.webpackJsonp=window.webpackJsonp||[]).push([[108],{536:function(t,e,s){"use strict";s.r(e);var a=s(62),r=Object(a.a)({},(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"hooks-数据结构"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#hooks-数据结构"}},[t._v("#")]),t._v(" Hooks 数据结构")]),t._v(" "),s("p"),s("div",{staticClass:"table-of-contents"},[s("ul",[s("li",[s("a",{attrs:{href:"#dispatcher"}},[t._v("dispatcher")])]),s("li",[s("a",{attrs:{href:"#一个-dispatcher-使用场景"}},[t._v("一个 dispatcher 使用场景")])]),s("li",[s("a",{attrs:{href:"#hook-的数据结构"}},[t._v("Hook 的数据结构")])]),s("li",[s("a",{attrs:{href:"#memoizedstate"}},[t._v("memoizedState")])])])]),s("p"),t._v(" "),s("p",[t._v("在上一节我们实现了一个极简的"),s("code",[t._v("useState")]),t._v("，了解了"),s("code",[t._v("Hooks")]),t._v("的运行原理。")]),t._v(" "),s("p",[t._v("本节我们讲解"),s("code",[t._v("Hooks")]),t._v("的数据结构，为后面介绍具体的"),s("code",[t._v("hook")]),t._v("打下基础。")]),t._v(" "),s("h2",{attrs:{id:"dispatcher"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#dispatcher"}},[t._v("#")]),t._v(" dispatcher")]),t._v(" "),s("p",[t._v("在上一节的极简"),s("code",[t._v("useState")]),t._v("实现中，使用"),s("code",[t._v("isMount")]),t._v("变量区分"),s("code",[t._v("mount")]),t._v("与"),s("code",[t._v("update")]),t._v("。")]),t._v(" "),s("p",[t._v("在真实的"),s("code",[t._v("Hooks")]),t._v("中，组件"),s("code",[t._v("mount")]),t._v("时的"),s("code",[t._v("hook")]),t._v("与"),s("code",[t._v("update")]),t._v("时的"),s("code",[t._v("hook")]),t._v("来源于不同的对象，这类对象在源码中被称为"),s("code",[t._v("dispatcher")]),t._v("。")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// mount时的Dispatcher")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("HooksDispatcherOnMount")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Dispatcher "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useCallback")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountCallback"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useContext")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" readContext"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountEffect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useImperativeHandle")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountImperativeHandle"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useLayoutEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountLayoutEffect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useMemo")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountMemo"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useReducer")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountReducer"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useRef")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountRef"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useState")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" mountState"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ...省略")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// update时的Dispatcher")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("HooksDispatcherOnUpdate")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Dispatcher "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useCallback")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateCallback"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useContext")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" readContext"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateEffect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useImperativeHandle")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateImperativeHandle"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useLayoutEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateLayoutEffect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useMemo")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateMemo"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useReducer")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateReducer"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useRef")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateRef"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useState")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" updateState"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ...省略")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br"),s("span",{staticClass:"line-number"},[t._v("5")]),s("br"),s("span",{staticClass:"line-number"},[t._v("6")]),s("br"),s("span",{staticClass:"line-number"},[t._v("7")]),s("br"),s("span",{staticClass:"line-number"},[t._v("8")]),s("br"),s("span",{staticClass:"line-number"},[t._v("9")]),s("br"),s("span",{staticClass:"line-number"},[t._v("10")]),s("br"),s("span",{staticClass:"line-number"},[t._v("11")]),s("br"),s("span",{staticClass:"line-number"},[t._v("12")]),s("br"),s("span",{staticClass:"line-number"},[t._v("13")]),s("br"),s("span",{staticClass:"line-number"},[t._v("14")]),s("br"),s("span",{staticClass:"line-number"},[t._v("15")]),s("br"),s("span",{staticClass:"line-number"},[t._v("16")]),s("br"),s("span",{staticClass:"line-number"},[t._v("17")]),s("br"),s("span",{staticClass:"line-number"},[t._v("18")]),s("br"),s("span",{staticClass:"line-number"},[t._v("19")]),s("br"),s("span",{staticClass:"line-number"},[t._v("20")]),s("br"),s("span",{staticClass:"line-number"},[t._v("21")]),s("br"),s("span",{staticClass:"line-number"},[t._v("22")]),s("br"),s("span",{staticClass:"line-number"},[t._v("23")]),s("br"),s("span",{staticClass:"line-number"},[t._v("24")]),s("br"),s("span",{staticClass:"line-number"},[t._v("25")]),s("br"),s("span",{staticClass:"line-number"},[t._v("26")]),s("br"),s("span",{staticClass:"line-number"},[t._v("27")]),s("br")])]),s("p",[t._v("可见，"),s("code",[t._v("mount")]),t._v("时调用的"),s("code",[t._v("hook")]),t._v("和"),s("code",[t._v("update")]),t._v("时调用的"),s("code",[t._v("hook")]),t._v("其实是两个不同的函数。")]),t._v(" "),s("p",[t._v("在"),s("code",[t._v("FunctionComponent")]),t._v(" "),s("code",[t._v("render")]),t._v("前，会根据"),s("code",[t._v("FunctionComponent")]),t._v("对应"),s("code",[t._v("fiber")]),t._v("的以下条件区分"),s("code",[t._v("mount")]),t._v("与"),s("code",[t._v("update")]),t._v("。")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[t._v("current "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("memoizedState "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br")])]),s("p",[t._v("并将不同情况对应的"),s("code",[t._v("dispatcher")]),t._v("赋值给全局变量"),s("code",[t._v("ReactCurrentDispatcher")]),t._v("的"),s("code",[t._v("current")]),t._v("属性。")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[t._v("ReactCurrentDispatcher"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("current "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v("\n  current "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("memoizedState "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("?")]),t._v(" HooksDispatcherOnMount\n    "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" HooksDispatcherOnUpdate"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br")])]),t._v(" "),s("blockquote",[s("p",[t._v("你可以在"),s("a",{attrs:{href:"https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L409",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),s("OutboundLink")],1),t._v("看到这行代码")])]),t._v(" "),s("p",[t._v("在"),s("code",[t._v("FunctionComponent")]),t._v(" "),s("code",[t._v("render")]),t._v("时，会从"),s("code",[t._v("ReactCurrentDispatcher.current")]),t._v("（即当前"),s("code",[t._v("dispatcher")]),t._v("）中寻找需要的"),s("code",[t._v("hook")]),t._v("。")]),t._v(" "),s("p",[t._v("换言之，不同的调用栈上下文为"),s("code",[t._v("ReactCurrentDispatcher.current")]),t._v("赋值不同的"),s("code",[t._v("dispatcher")]),t._v("，则"),s("code",[t._v("FunctionComponent")]),t._v(" "),s("code",[t._v("render")]),t._v("时调用的"),s("code",[t._v("hook")]),t._v("也是不同的函数。")]),t._v(" "),s("blockquote",[s("p",[t._v("除了这两个"),s("code",[t._v("dispatcher")]),t._v("，你可以在"),s("a",{attrs:{href:"https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1775",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),s("OutboundLink")],1),t._v("看到其他"),s("code",[t._v("dispatcher")]),t._v("定义")])]),t._v(" "),s("h2",{attrs:{id:"一个-dispatcher-使用场景"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#一个-dispatcher-使用场景"}},[t._v("#")]),t._v(" 一个 dispatcher 使用场景")]),t._v(" "),s("p",[t._v("当错误的书写了嵌套形式的"),s("code",[t._v("hook")]),t._v("，如：")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token function"}},[t._v("useEffect")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("useState")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br")])]),s("p",[t._v("此时"),s("code",[t._v("ReactCurrentDispatcher.current")]),t._v("已经指向"),s("code",[t._v("ContextOnlyDispatcher")]),t._v("，所以调用"),s("code",[t._v("useState")]),t._v("实际会调用"),s("code",[t._v("throwInvalidHookError")]),t._v("，直接抛出异常。")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("export")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("ContextOnlyDispatcher")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Dispatcher "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useCallback")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" throwInvalidHookError"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useContext")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" throwInvalidHookError"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" throwInvalidHookError"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useImperativeHandle")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" throwInvalidHookError"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("useLayoutEffect")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" throwInvalidHookError"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ...省略")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br"),s("span",{staticClass:"line-number"},[t._v("5")]),s("br"),s("span",{staticClass:"line-number"},[t._v("6")]),s("br"),s("span",{staticClass:"line-number"},[t._v("7")]),s("br")])]),s("blockquote",[s("p",[t._v("你可以在"),s("a",{attrs:{href:"https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L458",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),s("OutboundLink")],1),t._v("看到这段逻辑")])]),t._v(" "),s("h2",{attrs:{id:"hook-的数据结构"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#hook-的数据结构"}},[t._v("#")]),t._v(" Hook 的数据结构")]),t._v(" "),s("p",[t._v("接下来我们学习"),s("code",[t._v("hook")]),t._v("的数据结构。")]),t._v(" "),s("div",{staticClass:"language-js line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("hook")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Hook "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("memoizedState")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseState")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("baseQueue")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("queue")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("next")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br"),s("span",{staticClass:"line-number"},[t._v("5")]),s("br"),s("span",{staticClass:"line-number"},[t._v("6")]),s("br"),s("span",{staticClass:"line-number"},[t._v("7")]),s("br"),s("span",{staticClass:"line-number"},[t._v("8")]),s("br"),s("span",{staticClass:"line-number"},[t._v("9")]),s("br")])]),s("blockquote",[s("p",[t._v("你可以在"),s("a",{attrs:{href:"https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L546",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),s("OutboundLink")],1),t._v("看到创建"),s("code",[t._v("hook")]),t._v("的逻辑")])]),t._v(" "),s("p",[t._v("其中除"),s("code",[t._v("memoizedState")]),t._v("以外字段的意义与上一章介绍的"),s("RouterLink",{attrs:{to:"/react/03-实现篇/state/update.html#updatequeue"}},[t._v("updateQueue")]),t._v("类似。")],1),t._v(" "),s("h2",{attrs:{id:"memoizedstate"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#memoizedstate"}},[t._v("#")]),t._v(" memoizedState")]),t._v(" "),s("div",{staticClass:"custom-block warning"},[s("p",{staticClass:"custom-block-title"},[t._v("注意")]),t._v(" "),s("p",[s("code",[t._v("hook")]),t._v("与"),s("code",[t._v("FunctionComponent fiber")]),t._v("都存在"),s("code",[t._v("memoizedState")]),t._v("属性，不要混淆他们的概念。")]),t._v(" "),s("ul",[s("li",[s("p",[s("code",[t._v("fiber.memoizedState")]),t._v("："),s("code",[t._v("FunctionComponent")]),t._v("对应"),s("code",[t._v("fiber")]),t._v("保存的"),s("code",[t._v("Hooks")]),t._v("链表。")])]),t._v(" "),s("li",[s("p",[s("code",[t._v("hook.memoizedState")]),t._v("："),s("code",[t._v("Hooks")]),t._v("链表中保存的单一"),s("code",[t._v("hook")]),t._v("对应的数据。")])])])]),t._v(" "),s("p",[t._v("不同类型"),s("code",[t._v("hook")]),t._v("的"),s("code",[t._v("memoizedState")]),t._v("保存不同类型数据，具体如下：")]),t._v(" "),s("ul",[s("li",[s("p",[t._v("useState：对于"),s("code",[t._v("const [state, updateState] = useState(initialState)")]),t._v("，"),s("code",[t._v("memoizedState")]),t._v("保存"),s("code",[t._v("state")]),t._v("的值")])]),t._v(" "),s("li",[s("p",[t._v("useReducer：对于"),s("code",[t._v("const [state, dispatch] = useReducer(reducer, {});")]),t._v("，"),s("code",[t._v("memoizedState")]),t._v("保存"),s("code",[t._v("state")]),t._v("的值")])]),t._v(" "),s("li",[s("p",[t._v("useEffect："),s("code",[t._v("memoizedState")]),t._v("保存包含"),s("code",[t._v("useEffect回调函数")]),t._v("、"),s("code",[t._v("依赖项")]),t._v("等的链表数据结构"),s("code",[t._v("effect")]),t._v("，你可以在"),s("a",{attrs:{href:"https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1181",target:"_blank",rel:"noopener noreferrer"}},[t._v("这里"),s("OutboundLink")],1),t._v("看到"),s("code",[t._v("effect")]),t._v("的创建过程。"),s("code",[t._v("effect")]),t._v("链表同时会保存在"),s("code",[t._v("fiber.updateQueue")]),t._v("中")])]),t._v(" "),s("li",[s("p",[t._v("useRef：对于"),s("code",[t._v("useRef(1)")]),t._v("，"),s("code",[t._v("memoizedState")]),t._v("保存"),s("code",[t._v("{current: 1}")])])]),t._v(" "),s("li",[s("p",[t._v("useMemo：对于"),s("code",[t._v("useMemo(callback, [depA])")]),t._v("，"),s("code",[t._v("memoizedState")]),t._v("保存"),s("code",[t._v("[callback(), depA]")])])]),t._v(" "),s("li",[s("p",[t._v("useCallback：对于"),s("code",[t._v("useCallback(callback, [depA])")]),t._v("，"),s("code",[t._v("memoizedState")]),t._v("保存"),s("code",[t._v("[callback, depA]")]),t._v("。与"),s("code",[t._v("useMemo")]),t._v("的区别是，"),s("code",[t._v("useCallback")]),t._v("保存的是"),s("code",[t._v("callback")]),t._v("函数本身，而"),s("code",[t._v("useMemo")]),t._v("保存的是"),s("code",[t._v("callback")]),t._v("函数的执行结果")])])]),t._v(" "),s("p",[t._v("有些"),s("code",[t._v("hook")]),t._v("是没有"),s("code",[t._v("memoizedState")]),t._v("的，比如：")]),t._v(" "),s("ul",[s("li",[t._v("useContext")])])])}),[],!1,null,null,null);e.default=r.exports}}]);