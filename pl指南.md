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

computed原理梳理

## 综合商品列表
原来问题：
通用商品列表杂糅多种样式，多种功能，运营只想使用一个组价来搭建页面，随着功能迭代，这个组件过于膨胀，来接口侧，数据侧和渲染侧，各种ifelse逻辑，维护成本越来越高
组件过多，业务逻辑过于庞杂

解决方案
通过装饰器，在组价的各个关键生命周期，注入对应的业务逻辑，在最外围添加功能判断模块，确认在后续的流程中需要跑那些逻辑，将各个功能模块的专属逻辑抽出到各自的文件中，方便维护

## 多米诺整体解决方案
多米诺系统，生成营销页的编辑与展示一体化平台，可视化，可交互，对运营友好，内容组件化，方便维护，业务逻辑以组件维度解耦。项目主体分为编辑页和展示页两部分，展示页支持运营直接新增或编辑组件，组建内部支持UI编辑与业务逻辑编辑（数据源，交互方式等），在编辑页面可实时预览当前的编辑效果，点击提交后，会将运营编辑的页面生成一个json文件，其内部包含了生成该页面所需的所有内容，将其提交给后端。
antd+mobx

展示侧通过后端渲染来直出页面，在node端提前获取页面json数据，渲染首屏组件（拉取组件各自接口），通过react的能力实现后端渲染，直出带有样式的html文件，通过isomorphic-style-loader来实现前后端渲染样式重构。

流式渲染，后端渲染，打包策略梳理

重写路由，重写组件map,生成client和server的编译Promise，这个promise resolve之后启用app.handle
入口文件entry client和server,
server中，给req挂上commonContext上下文,universal-router控制路由
    app.get('*.html', ahandler, bhandler);
routes里面有各个路由对应的加载函数，定义了load,load动态加载一个文件，文件输出action函数，action动态加载@pages/subject,这个动态加载的组件就是最后的component,返回一个对象，这个对象挂在locals的route上，在renderHandle里面调用component
初始化store在renderHandle里面，调用组件上的initProps方法，这个是通过装饰器注入到类里面的，最后renderToString，插入到html里面
entry/client里面基本是个空壳，啥都没有,csr的时候注入client的chunk

## 装饰器写法
https://blog.csdn.net/zl_best/article/details/94447018

装饰器实战
https://juejin.cn/post/6844903506562777101

# dart项目
Flutter是谷歌的移动UI框架，可以快速在iOS和Android上构建高质量的原生用户界面。包含很多核心widget,可以在iso和安卓上达到原生应用一样的性能。Flutter的热重载可帮助您快速地进行测试、构建UI、添加功能并更快地修复错误。
1、react-native，weekx核心是通过js开发，执行时需要js解释器，UI通过原生控件渲染。flutter既不使用webview，也不实用原生控件，使用自有引擎来绘制组件，使用本机指令集运行，不涉及解释器，可以达到和原生一样的性能。

flutter问题：
使用dart，有一定的学习成本
逻辑和UI强耦合，开发体验不友好，如果要对底层能力进行编程，还是需要了解原生的开发步骤，flutter只是抹平了UI层的区别

浏览器事件循环
https://juejin.cn/post/6844903577052250119

宏任务：js同步执行的代码块，setTimeout、setInterval、XMLHttprequest等。
微任务：promise、process.nextTick（node环境）等。

先执行一个宏任务，如果遇到其他宏任务，将其放入消息队列，如果有微任务，放入微任务队列
当前宏任务执行完毕之后，执行所有微任务，比如promise的then
微任务执行完毕后，消息队列出队，执行该任务
# 手写promise  
https://juejin.cn/post/6844903843507994632
 * 有个变量存贮三种状态，有个excutor来立即执行函数，res和rej我们直接来提他们实现  
 * protype原型上挂then，根据状态来执行回调
 * 为了实现异步，通过两个数组sucList和errList来存放回调，resolve后再执行，then的时候只是执行push
 * 需要实现链式调用 操作
 * 每一步操作都要try catch, then方法要有兜底的入参
 * resAno的核心是尽可能的执行ans.then,解决promise,如果是promise继续递归
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

http 2.0 头部压缩 服务器推送 多路复用 二进制分帧

# react 原理手写
https://juejin.cn/post/6898292945867571207

实现ReactDom.render() innerHtml
实现React.createElement(type, props, children);
内部有多个内容：事件绑定，style,class,children,其他属性
实现自定义组件渲染，即React.component,组件有render方法，这个方法返回dom数据结构，在用createElement创建真实dom,自定义组件自己会递归调用createUnit方法，直到最后创建原生标签

createUnit:原生 NativeUnit Component
component内部new Compoent,调用render方法，返回内容继续递归调用CreateUnit,最终会返回原生标签
生命周期实现

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
https://juejin.cn/post/6844903856690724872#heading-3
1\Diff算法会对新旧两棵树做深度优先遍历，避免对两棵树做完全比较，因此算法复杂度可以达到O(n)。然后给每个节点生成一个唯一的标志：
2、只对同一级别的元素进行比较
不同类型，直接重建
同类型，原生直接修改标签内容，react原生组件，实例不变，更新组件状态，调用willUpdate和render，递归处理
新增，删除和移动

key应该具有稳定性，
# react Filber
## 策略
类似于堆栈的数据结构
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
1、setState 插入更新队列，请求调度
2、浏览器执行完后，时间片有剩余时间，执行任务
3、是否有中断的任务，有的话执行，没有的话取新任务
4、执行任务单元，还有时间的话继续取，否则让出
5、任务是否执行完，是的话归还控制权，否则的话继续申请调度
react原理 虚拟dom

chrome插件


# mobx原理
原理博文
https://juejin.cn/post/6844904202280402952

阿里解释
https://zhuanlan.zhihu.com/p/42150181

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

小程序性能优化


浏览器插件
后端渲染
浏览器宏任务

项目优化
# webpack原理
https://juejin.cn/post/6844903957769224206#heading-0
1、内部有installedModule来缓存对象，如果已经编译过直接返回
2、通过__webpack__require__内部递归调用，文件路径作为moduleId
3、生成的打包是一个立即执行函数，入参是entry文件，eval里面是编译之后的文件内容

获取到index.js的文件内容之后，并不能直接使用，需要通过将其解析成抽象语法树进行处理，需要使用一个插件@babel/parser将模块代码解析成AST，然后插件@babel/traverse配合着使用，将AST的节点进行替换，替换完成之后，使用插件@babel/generator将AST转换成模块的原有代码，改变的只是将require变成__webpack_require__，需要注意的是需要将路径处理一下，因为此时的路径是相对于src下面的。处理完index之后需要递归调用处理全部的模块，并声称bundle中自执行函数的参数modules

https://imweb.io/topic/59324940b9b65af940bf58ae

webpack打包，loader原理，babel原理

plugin
而至于 plugin 则是一些插件，这些插件可以将对编译结果的处理函数注册在 Webpack 的生命周期钩子上，在生成最终文件之前对编译的结果做一些处理。比如大多数场景下我们需要将生成的 JS 文件插入到 Html 文件中去。就需要使用到 html-webpack-plugin 这个插件，我们需要在配置中这样写。
每一个 plugin Class 都必须实现一个 apply 方法，这个方法接收 compiler 实例，然后将真正的钩子函数挂载到 compiler.hook 的某一个声明周期上。

# webpack优化
https://juejin.cn/post/6844903895697735687
1、tree shake 必须使用es6的module，否则无效，依赖es6的静态结构特性
2、scope hoisting 作用域上提，模块合并
3、通过mini-css-extract-plugin将css单独提取，支持异步加载
4、SplitChunksPlugin
5、@babel/plugin-syntax-dynamic-import 动态懒加载
6、ignorePlugin moment删除冗余语言包
7、dllPlugin 动态链接库
8、 webpack-bundle-analyzer 方便分析

梳理项目

梳理博客

# 后端渲染

# 原型链
https://blog.csdn.net/cc18868876837/article/details/81211729?utm_medium=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase

prototype函数才有，指向这个函数实例化对象都具有的属性
对象 __protype__指向这个对象的原型,组成原型链的关键，沿着这个去查找属性
constructor 指向每个对象的构造函数

# babel相关
它基于`acorn`和`acorn-jsx`
babel/types babel/parser babel/transform bable/generator

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

手写深拷贝，
https://juejin.cn/post/6844904197595332622

防抖、截流 https://juejin.cn/post/6844903752063778830
bind,call,apply, 
await async
https://juejin.cn/post/6844904102053281806#heading-0
核心是把async改写成generator，然后用一个asyncToGenerator来直线generator的自动执行
函数科里化
https://juejin.cn/post/6844903645222273037

柯里化，可以理解为提前接收部分参数，延迟执行，不立即输出结果，而是返回一个接受剩余参数的函数。因为这样的特性，也被称为部分计算函数。柯里化，是一个逐步接收参数的过程。在接下来的剖析中，你会深刻体会到这一点。

反柯里化，是一个泛型化的过程。它使得被反柯里化的函数，可以接收更多参数。目的是创建一个更普适性的函数，可以被不同的对象使用。有鸠占鹊巢的效果。

# 浏览器缓存
https://juejin.cn/post/6855469171703185416
强缓存，协商缓存


三级缓存原理 (访问缓存优先级)
先在内存中查找,如果有,直接加载。
如果内存中不存在,则在硬盘中查找,如果有直接加载。
如果硬盘中也没有,那么就进行网络请求。
请求获取的资源缓存到硬盘和内存。

强缓存：
expires 绝对时间

Cache-Control（优先级高于Expires）
no-cache：需要进行协商缓存，发送请求到服务器确认是否使用缓存。
no-store：禁止使用缓存，每一次都要重新请求数据。
public：可以被所有的用户缓存，包括终端用户和 CDN 等中间代理服务器。
private：只能被终端用户的浏览器缓存，不允许 CDN 等中继缓存服务器对其缓存。
Cache-Control 与 Expires 可以在服务端配置同时启用，同时启用的时候 Cache-Control 优先级高。

Last-Modify/If-Modify-Since
ETag/If-None-Match

Last-Modified 与 ETag 是可以一起使用的，服务器会优先验证 ETag，一致的情况下，才会继续比对 Last-Modified，最后才决定是否返回 304。

1.看看是否命中强缓存，如果命中，就直接使用缓存了。
2.如果没有命中强缓存，就发请求到服务器检查是否命中协商缓存。
3.如果命中协商缓存，服务器会返回 304 告诉浏览器使用本地缓存。
4.否则，返回最新的资源。

# 变量提升
https://juejin.cn/post/6844904089713639431

# 算法：
二叉树的前中后序遍历、快排

instance 和 instanceof
https://juejin.cn/post/6844904081803182087#heading-4
构造函数的原型是否在实例的原型链上

从输入url，浏览器发生了什么
https://juejin.cn/post/6844904054074654728
DNS域名解析
建立tcp链接
发送http请求，服务器处理请求
关闭tcp链接
浏览器渲染
  * 构建DOM树
  * 样式计算
  * 页面布局
  * 生成分层树
  * 栅格化
  * 显示

手写继承，
https://www.jianshu.com/p/6925ed009f1e

手写观察者模式
204和304之间区别
两个进程之间如何通信？子网掩码有什么作用？

# css
水平垂直居中
https://juejin.cn/post/6844903510731915277
margin: 0 auto
如果知道本身的宽高，可以用负margin
position: absolute;
top: 50%;
left: 50%
magin-left: -50rpx;
margin-top: -50rpx
如果不知道宽高
  transform: translate(-50%, -50%);

或者flex
容器属性：
flex-direction
flex-wrap
flex-flow
justify-content
align-items
align-content

项目属性：
order
flex-grow
flex-shrink
flex-basis
flex
align-self

或者
position:absolute;
top: 0;left:0;right:0;bottom:0;
margin: auto;


盒模型，计算样式权重