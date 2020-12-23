核心点：
* react,webpack,node
* 项目经验，项目内容
* 个人项目

# 个人项目
## 小程序
支撑mdd首页和部分原生页面，方便mc captain进行订单管理和参与推广活动和进行门店运营,核心是小程序，状态管理使用自研框架,页面维度的store

首页改版，更多的露出，更多的版块，拆分两个loop
三个技术方案：
纯原生switchTab（原生底部tab，有二跳页面无法传参,官方会提前渲染两个page）
两个页面，底部自己画tab（使用navigateTo进行跳转 首次要重新渲染，体验不佳）
同一个页面分两块，隐藏一部分（体验流畅，但是首页比较臃肿）

## 综合商品列表
原来问题：
通用商品列表杂糅多种样式，多种功能，运营只想使用一个组价来搭建页面，随着功能迭代，这个组件过于膨胀，来接口侧，数据侧和渲染侧，各种ifelse逻辑，维护成本越来越高
组件过多，业务逻辑过于庞杂

解决方案
通过装饰器，在组价的各个关键生命周期，注入对应的业务逻辑，在最外围添加功能判断模块，确认在后续的流程中需要跑那些逻辑，将各个功能模块的专属逻辑抽出到各自的文件中，方便维护

浏览器事件循环
# 手写promise  
 * 有个变量存贮三种状态，有个excutor来立即执行函数，res和rej我们直接来提他们实现  
 * protype原型上挂then，根据状态来执行回调
 * 为了实现异步，通过两个数组sucList和errList来存放回调，resolve后再执行，then的时候只是执行push
 * 需要实现链式调用 操作
 * 每一步操作都要try catch, then方法要有兜底的入参
react 原理

# Loader
所谓 loader 只是一个导出为函数的 JavaScript 模块。loader runner 会调用这个函数，然后把上一个 loader 产生的结果或者资源文件(resource file)传入进去。函数的 this 上下文将由 webpack 填充，并且 loader runner 具有一些有用方法，可以使 loader 改变为异步调用方式，或者获取 query 参数。

第一个 loader 的传入参数只有一个：资源文件(resource file)的内容。compiler 需要得到最后一个 loader 产生的处理结果。这个处理结果应该是 String 或者 Buffer（被转换为一个 string），代表了模块的 JavaScript 源码。另外还可以传递一个可选的 SourceMap 结果（格式为 JSON 对象）。

如果是单个处理结果，可以在同步模式中直接返回。如果有多个处理结果，则必须调用 this.callback()。在异步模式中，必须调用 this.async()，来指示 loader runner 等待异步结果，它会返回 this.callback() 回调函数，随后 loader 必须返回 undefined 并且调用该回调函数。

1、	浏览器本身能处理的文件非常有限
2、	Loader的处理顺序是从右到左的，use对应的数组越靠后越先处理
3、	除了loader外还有pitch方法，越靠前的loader的pitch方法越先处理
4、	如果某个loader的pitch返回了内容，那么会跳过剩下的pitch和loader
5、	如果其中还有require,那么require引用的文件将会走完之前被跳过的loader逻辑

6、	是一个js模块
7、	后一个的输出是前一个的输入
8、	最有一个是string和buffer

# Socket长连接
https://www.cnblogs.com/nnngu/p/9347635.html
1\握手阶段使用http
可以实现浏览器和服务器互相通信
建立在tcp协议之上

核心请求字段
Upgrade: websocket
Connection: Upgrade

Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13

长短链接的区别
https://www.cnblogs.com/Catherine001/p/8359153.html

短连接：
连接->传输数据->关闭连接
HTTP是无状态的，浏览器和服务器每进行一次HTTP操作，就建立一次连接，但任务结束就中断连接。
也可以这样说：短连接是指SOCKET连接后发送后接收完数据后马上断开连接。
 
长连接、
连接->传输数据->保持连接 -> 传输数据-> 。。。 ->关闭连接。
长连接指建立SOCKET连接后不管是否使用都保持连接，但安全性较差。

HTTP1.1通过使用Connection:keep-alive进行长连接，HTTP 1.1默认进行持久连接。在一次 TCP 连接中可以完成多个 HTTP 请求，但是对每个请求仍然要单独发 header，Keep-Alive不会永久保持连接，它有一个保持时间，可以在不同的服务器软件（如Apache）中设定这个时间。这种长连接是一种“伪链接”
websocket的长连接，是一个真的全双工。长连接第一次tcp链路建立之后，后续数据可以双方都进行发送，不需要发送请求头。
 
keep-alive双方并没有建立正真的连接会话，服务端可以在任何一次请求完成后关闭。WebSocket 它本身就规定了是正真的、双工的长连接，两边都必须要维持住连接的状态。

# react 原理手写
https://juejin.cn/post/6898292945867571207

# react hooks原理
https://juejin.cn/post/6863642635916017671

https://www.jianshu.com/p/b9ac8fa849f1

手写

# react 虚拟dom
1、虚拟DOM只保留了真实DOM节点的一些基本属性，和节点之间的层次关系，它相当于建立在javascript和DOM之间的一层“缓存”
https://juejin.cn/post/6844903856690724872

2、React需要同时维护两棵虚拟DOM树：一棵表示当前的DOM结构，另一棵在React状态变更将要重新渲染时生成。React通过比较这两棵树的差异，决定是否需要修改DOM结构，以及如何修改。这种算法称作Diff算法。

3、React 在以下两个假设的基础之上提出了一套 O(n) 的启发式算法：

两个不同类型的元素会产生出不同的树；
开发者可以通过 key prop 来暗示哪些子元素在不同的渲染下能保持稳定；

深度优先遍历，打上唯一标记

## diff算法相关具体过程


# react Filber
## 策略
所以 React 通过Fiber 架构，让自己的Reconcilation 过程变成可被中断。 '适时'地让出CPU执行权，除了可以让浏览器及时地响应用户的交互，还有其他好处:

## 好处
与其一次性操作大量 DOM 节点相比, 分批延时对DOM进行操作，可以得到更好的用户体验。这个在《「前端进阶」高性能渲染十万条数据(时间分片)》 以及司徒正美的《React Fiber架构》 都做了相关实验
司徒正美在《React Fiber架构》 也提到：🔴给浏览器一点喘息的机会，他会对代码进行编译优化（JIT）及进行热代码优化，或者对reflow进行修正.

模拟堆栈实现的数据结构

时间分片

## react每次渲染有两个阶段，reconciliation 和commit
协调阶段: 可以认为是 Diff 阶段, 这个阶段可以被中断, 这个阶段会找出所有节点变更，例如节点新增、删除、属性变更等等, 这些变更React 称之为'副作用(Effect)' . 以下生命周期钩子会在协调阶段被调用：
constructor
componentWillMount 废弃
componentWillReceiveProps 废弃
static getDerivedStateFromProps
shouldComponentUpdate
componentWillUpdate 废弃
render

提交阶段: 将上一个阶段计算出来的需要处理的**副作用(Effects)**一次性执行了。这个阶段必须同步执行，不能被打断. 这些生命周期钩子在提交阶段被执行:

getSnapshotBeforeUpdate() 严格来说，这个是在进入 commit 阶段前调用
componentDidMount
componentDidUpdate
componentWillUnmount

双缓冲：work in progress和current

# 渲染图手绘

react原理 虚拟dom

chrome插件


# mobx原理
原理博文
https://juejin.cn/post/6844904202280402952

简易实现
https://zhuanlan.zhihu.com/p/26559530

如何实现autorun
1、收集依赖，维护全局对象，以对象id为key，内容是各种回调
2、对对象进行proxy代理，每次get的时候去注册
3、autorun声明的时候会去收集依赖
4、每次set的时候去触发注册的各种回调
5、observer的实现，对组件进行观察，有改变的时候触发render
6、computed本质上也是autorun

# 小程序框架
http://eux.baidu.com//blog/fe/%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F%E6%9E%B6%E6%9E%84%E5%8E%9F%E7%90%86

1、微信小程序只能通过其 mvvm 的模板语法来动态改变页面，本身 js 并不支持 BOM 和 DOM 操作
2、本质是双webview，UI和业务逻辑分开处理，避免阻塞，但是无法直接操作dom，逻辑层和UI层的数据交互有性能损耗
3、大部分通过html实现，少部分通过原生实现，微信能力，网络能力等通过JSBridge实现

也有编译模板和虚拟dom


浏览器插件
后端渲染
浏览器宏任务

项目优化
webpack原理
https://juejin.cn/post/6844903957769224206#heading-0
1、内部有installedModule来缓存对象，如果已经编译过直接返回
2、通过__webpack__require__内部递归调用，文件路径作为moduleId
3、生成的打包是一个立即执行函数，入参是entry文件，eval

获取到index.js的文件内容之后，并不能直接使用，需要通过将其解析成抽象语法树进行处理，需要使用一个插件@babel/parser将模块代码解析成AST，然后插件@babel/traverse配合着使用，将AST的节点进行替换，替换完成之后，使用插件@babel/generator将AST转换成模块的原有代码，改变的只是将require变成__webpack_require__，需要注意的是需要将路径处理一下，因为此时的路径是相对于src下面的。处理完index之后需要递归调用处理全部的模块，并声称bundle中自执行函数的参数modules

https://imweb.io/topic/59324940b9b65af940bf58ae

webpack打包，loader原理，babel原理

plugin
而至于 plugin 则是一些插件，这些插件可以将对编译结果的处理函数注册在 Webpack 的生命周期钩子上，在生成最终文件之前对编译的结果做一些处理。比如大多数场景下我们需要将生成的 JS 文件插入到 Html 文件中去。就需要使用到 html-webpack-plugin 这个插件，我们需要在配置中这样写。
每一个 plugin Class 都必须实现一个 apply 方法，这个方法接收 compiler 实例，然后将真正的钩子函数挂载到 compiler.hook 的某一个声明周期上。

webpack原理

梳理项目

梳理博客

# 后端渲染

# 原型链
https://blog.csdn.net/cc18868876837/article/details/81211729?utm_medium=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase

# 面经：
社招中级前端笔试面试题总结
https://juejin.cn/post/6844903605107965960

一年社招面经（有pdd和字节）
https://juejin.cn/post/6844903928623038478

字节面经
https://www.nowcoder.com/discuss/580800?type=2&order=3&pos=22&page=1&channel=-1&source_id=discuss_tag_nctrack

https://www.jianshu.com/p/cb6db0d708b7

前端面试题
https://www.jianshu.com/p/8af1bd7308ab
技术栈
https://www.jianshu.com/p/dfefa9d7ab55

手写深拷贝，防抖、截流，bind,call,apply, await async
函数科里化
https://juejin.cn/post/6844903645222273037

柯里化，可以理解为提前接收部分参数，延迟执行，不立即输出结果，而是返回一个接受剩余参数的函数。因为这样的特性，也被称为部分计算函数。柯里化，是一个逐步接收参数的过程。在接下来的剖析中，你会深刻体会到这一点。

反柯里化，是一个泛型化的过程。它使得被反柯里化的函数，可以接收更多参数。目的是创建一个更普适性的函数，可以被不同的对象使用。有鸠占鹊巢的效果。

# 算法：
二叉树的前中后序遍历、快排

# css
水平垂直居中
https://juejin.cn/post/6844903510731915277

盒模型，计算样式权重