(window.webpackJsonp=window.webpackJsonp||[]).push([[136],{529:function(t,s,a){"use strict";a.r(s);var e=a(54),n=Object(e.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"react-理念"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#react-理念"}},[t._v("#")]),t._v(" React 理念")]),t._v(" "),a("p"),a("div",{staticClass:"table-of-contents"},[a("ul",[a("li",[a("a",{attrs:{href:"#react-理念"}},[t._v("React 理念")])]),a("li",[a("a",{attrs:{href:"#cpu-的瓶颈"}},[t._v("CPU 的瓶颈")])]),a("li",[a("a",{attrs:{href:"#io-的瓶颈"}},[t._v("IO 的瓶颈")])]),a("li",[a("a",{attrs:{href:"#总结"}},[t._v("总结")])]),a("li",[a("a",{attrs:{href:"#参考资料"}},[t._v("参考资料")])])])]),a("p"),t._v(" "),a("p",[t._v("软件的设计是为了服务理念。只有懂了设计理念，才能明白为了实现这样的理念需要如何架构。")]),t._v(" "),a("p",[t._v("所以，在我们深入源码架构之前，先来聊聊"),a("code",[t._v("React")]),t._v("理念。")]),t._v(" "),a("h2",{attrs:{id:"react-理念-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#react-理念-2"}},[t._v("#")]),t._v(" React 理念")]),t._v(" "),a("p",[t._v("我们可以从"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/thinking-in-react.html",target:"_blank",rel:"noopener noreferrer"}},[t._v("官网"),a("OutboundLink")],1),t._v("看到"),a("code",[t._v("React")]),t._v("的理念：")]),t._v(" "),a("blockquote",[a("p",[t._v("我们认为，React 是用 JavaScript 构建"),a("strong",[t._v("快速响应")]),t._v("的大型 Web 应用程序的首选方式。它在 Facebook 和 Instagram 上表现优秀。")])]),t._v(" "),a("p",[t._v("可见，关键是实现"),a("code",[t._v("快速响应")]),t._v("。那么制约"),a("code",[t._v("快速响应")]),t._v("的因素是什么呢？")]),t._v(" "),a("p",[t._v("我们日常使用 App，浏览网页时，有两类场景会制约"),a("code",[t._v("快速响应")]),t._v("：")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("当遇到大计算量的操作或者设备性能不足使页面掉帧，导致卡顿。")])]),t._v(" "),a("li",[a("p",[t._v("发送网络请求后，由于需要等待数据返回才能进一步操作导致不能快速响应。")])])]),t._v(" "),a("p",[t._v("这两类场景可以概括为：")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("CPU 的瓶颈")])]),t._v(" "),a("li",[a("p",[t._v("IO 的瓶颈")])])]),t._v(" "),a("p",[a("code",[t._v("React")]),t._v("是如何解决这两个瓶颈的呢？")]),t._v(" "),a("h2",{attrs:{id:"cpu-的瓶颈"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#cpu-的瓶颈"}},[t._v("#")]),t._v(" CPU 的瓶颈")]),t._v(" "),a("p",[t._v("当项目变得庞大、组件数量繁多时，就容易遇到 CPU 的瓶颈。")]),t._v(" "),a("p",[t._v("考虑如下 Demo，我们向视图中渲染 3000 个"),a("code",[t._v("li")]),t._v("：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("App")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" len "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("3000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("ul"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n      "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("Array")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("len"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("map")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("_"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" i")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n          "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("li"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("i"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("li"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("ul"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" rootEl "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" document"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("querySelector")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'#root'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\nReactDOM"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("render")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("App "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" rootEl"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br"),a("span",{staticClass:"line-number"},[t._v("13")]),a("br"),a("span",{staticClass:"line-number"},[t._v("14")]),a("br"),a("span",{staticClass:"line-number"},[t._v("15")]),a("br")])]),a("p",[t._v("主流浏览器刷新频率为 60Hz，即每（1000ms / 60Hz）16.6ms 浏览器刷新一次。")]),t._v(" "),a("p",[t._v("我们知道，JS 可以操作 DOM，"),a("code",[t._v("GUI渲染线程")]),t._v("与"),a("code",[t._v("JS线程")]),t._v("是互斥的。所以"),a("strong",[t._v("JS 脚本执行")]),t._v("和"),a("strong",[t._v("浏览器布局、绘制")]),t._v("不能同时执行。")]),t._v(" "),a("p",[t._v("在每 16.6ms 时间内，需要完成如下工作：")]),t._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[t._v("JS脚本执行 -----  样式布局 ----- 样式绘制\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br")])]),a("p",[t._v("当 JS 执行时间过长，超出了 16.6ms，这次刷新就没有时间执行"),a("strong",[t._v("样式布局")]),t._v("和"),a("strong",[t._v("样式绘制")]),t._v("了。")]),t._v(" "),a("p",[t._v("在 Demo 中，由于组件数量繁多（3000 个），JS 脚本执行时间过长，页面掉帧，造成卡顿。")]),t._v(" "),a("p",[t._v("可以从打印的执行堆栈图看到，JS 执行时间为 73.65ms，远远多于一帧的时间。")]),t._v(" "),a("img",{attrs:{src:t.$withBase("/images/react/long-task.png"),alt:"长任务"}}),t._v(" "),a("p",[t._v("如何解决这个问题呢？")]),t._v(" "),a("p",[t._v("答案是：在浏览器每一帧的时间中，预留一些时间给 JS 线程，"),a("code",[t._v("React")]),t._v("利用这部分时间更新组件（可以看到，在"),a("a",{attrs:{href:"https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119",target:"_blank",rel:"noopener noreferrer"}},[t._v("源码"),a("OutboundLink")],1),t._v("中，预留的初始时间是 5ms）。")]),t._v(" "),a("p",[t._v("当预留的时间不够用时，"),a("code",[t._v("React")]),t._v("将线程控制权交还给浏览器使其有时间渲染 UI，"),a("code",[t._v("React")]),t._v("则等待下一帧时间到来继续被中断的工作。")]),t._v(" "),a("blockquote",[a("p",[t._v("这种将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为"),a("code",[t._v("时间切片")]),t._v("（time slice）")])]),t._v(" "),a("p",[t._v("接下来我们开启"),a("code",[t._v("Concurrent Mode")]),t._v("（后续章节会讲到，当前你只需了解开启后会启用"),a("code",[t._v("时间切片")]),t._v("）：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("div",{staticClass:"highlight-lines"},[a("br"),a("br"),a("div",{staticClass:"highlighted"},[t._v(" ")]),a("br")]),a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 通过使用ReactDOM.unstable_createRoot开启Concurrent Mode")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ReactDOM.render(<App/>, rootEl);")]),t._v("\nReactDOM"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("unstable_createRoot")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("rootEl"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("render")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("App "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("p",[t._v("此时我们的长任务被拆分到每一帧不同的"),a("code",[t._v("task")]),t._v("中，"),a("code",[t._v("JS脚本")]),t._v("执行时间大体在"),a("code",[t._v("5ms")]),t._v("左右，这样浏览器就有剩余时间执行"),a("strong",[t._v("样式布局")]),t._v("和"),a("strong",[t._v("样式绘制")]),t._v("，减少掉帧的可能性。")]),t._v(" "),a("img",{attrs:{src:t.$withBase("/images/react/time-slice.png"),alt:"长任务"}}),t._v(" "),a("p",[t._v("所以，解决"),a("code",[t._v("CPU瓶颈")]),t._v("的关键是实现"),a("code",[t._v("时间切片")]),t._v("，而"),a("code",[t._v("时间切片")]),t._v("的关键是：将"),a("strong",[t._v("同步的更新")]),t._v("变为"),a("strong",[t._v("可中断的异步更新")]),t._v("。")]),t._v(" "),a("p",[t._v("::: details 同步更新 vs 异步更新 Demo\n我们有个更新很耗时的大列表，让我们看看"),a("strong",[t._v("同步更新")]),t._v("和"),a("strong",[t._v("异步更新")]),t._v("时，输入框的响应速度")]),t._v(" "),a("p",[a("RouterLink",{attrs:{to:"/react/01-理念篇/me.html"}},[t._v("关注公众号")]),t._v("，后台回复"),a("strong",[t._v("323")]),t._v("获得在线 Demo 地址")],1),t._v(" "),a("p",[t._v("可以从 Demo 看到，当牺牲了列表的更新速度，"),a("code",[t._v("React")]),t._v("大幅提高了输入响应速度，使交互更自然。")]),t._v(" "),a("p",[t._v(":::")]),t._v(" "),a("h2",{attrs:{id:"io-的瓶颈"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#io-的瓶颈"}},[t._v("#")]),t._v(" IO 的瓶颈")]),t._v(" "),a("p",[a("code",[t._v("网络延迟")]),t._v("是前端开发者无法解决的。如何在"),a("code",[t._v("网络延迟")]),t._v("客观存在的情况下，减少用户对"),a("code",[t._v("网络延迟")]),t._v("的感知？")]),t._v(" "),a("p",[a("code",[t._v("React")]),t._v("给出的答案是"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#putting-research-into-production",target:"_blank",rel:"noopener noreferrer"}},[t._v("将人机交互研究的结果整合到真实的 UI 中"),a("OutboundLink")],1),t._v("。")]),t._v(" "),a("p",[t._v("这里我们以业界人机交互最顶尖的苹果举例，在 IOS 系统中：")]),t._v(" "),a("p",[t._v("点击“设置”面板中的“通用”，进入“通用”界面：")]),t._v(" "),a("img",{attrs:{src:t.$withBase("/images/react/legacy-move.gif"),alt:"同步"}}),t._v(" "),a("p",[t._v("作为对比，再点击“设置”面板中的“Siri 与搜索”，进入“Siri 与搜索”界面：")]),t._v(" "),a("img",{attrs:{src:t.$withBase("/images/react/concurrent-mov.gif"),alt:"异步"}}),t._v(" "),a("p",[t._v("你能感受到两者体验上的区别么？")]),t._v(" "),a("p",[t._v("事实上，点击“通用”后的交互是同步的，直接显示后续界面。而点击“Siri 与搜索”后的交互是异步的，需要等待请求返回后再显示后续界面。但从用户感知来看，这两者的区别微乎其微。")]),t._v(" "),a("p",[t._v("这里的窍门在于：点击“Siri 与搜索”后，先在当前页面停留了一小段时间，这一小段时间被用来请求数据。")]),t._v(" "),a("p",[t._v("当“这一小段时间”足够短时，用户是无感知的。如果请求时间超过一个范围，再显示"),a("code",[t._v("loading")]),t._v("的效果。")]),t._v(" "),a("p",[t._v("试想如果我们一点击“Siri 与搜索”就显示"),a("code",[t._v("loading")]),t._v("效果，即使数据请求时间很短，"),a("code",[t._v("loading")]),t._v("效果一闪而过。用户也是可以感知到的。")]),t._v(" "),a("p",[t._v("为此，"),a("code",[t._v("React")]),t._v("实现了"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html",target:"_blank",rel:"noopener noreferrer"}},[t._v("Suspense"),a("OutboundLink")],1),t._v("功能及配套的"),a("code",[t._v("hook")]),t._v("——"),a("a",{attrs:{href:"https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue",target:"_blank",rel:"noopener noreferrer"}},[t._v("useDeferredValue"),a("OutboundLink")],1),t._v("。")]),t._v(" "),a("p",[t._v("而在源码内部，为了支持这些特性，同样需要将"),a("strong",[t._v("同步的更新")]),t._v("变为"),a("strong",[t._v("可中断的异步更新")]),t._v("。")]),t._v(" "),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),a("p",[t._v("通过以上内容，我们可以看到，"),a("code",[t._v("React")]),t._v("为了践行“构建"),a("strong",[t._v("快速响应")]),t._v("的大型 Web 应用程序”理念做出的努力。")]),t._v(" "),a("p",[t._v("其中的关键是解决 CPU 的瓶颈与 IO 的瓶颈。而落实到实现上，则需要将"),a("strong",[t._v("同步的更新")]),t._v("变为"),a("strong",[t._v("可中断的异步更新")]),t._v("。")]),t._v(" "),a("h2",{attrs:{id:"参考资料"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考资料"}},[t._v("#")]),t._v(" 参考资料")]),t._v(" "),a("p",[a("a",{attrs:{href:"https://www.bilibili.com/video/BV134411c7Sk?from=search&seid=17404881291635824595",target:"_blank",rel:"noopener noreferrer"}},[t._v("「英文」尤雨溪论 JavaScript 框架设计哲学：平衡"),a("OutboundLink")],1)])])}),[],!1,null,null,null);s.default=n.exports}}]);