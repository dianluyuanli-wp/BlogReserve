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
根据是否是页面或组件跑不同的方法，通过option传入的内容，进行处理后返回真正的option
拿的实例数组，跑prepStore,给实例注入唯一key,注入update方法，将observable移动到data中
定义了各种包装过的原生方法onshow onload等等，进行了各种缓存操作,
createStr给页面或者组件实例绑定store
通过changeProObser给property添加observer方法，在属性改变时强制setDat,触发computed的计算与更新
通过hooksetda来魔改原来的setdata方法，先计算computed再执行setData的内容，hooked这个给页面组件的data：xxstore.xxx赋store的初始值，维护全局map，这个方法放在魔改方法里，在特定的时候跑一遍setdata
其实是有两个更新路径，setData和update，update的时候先data再com,setData的时候先com再data
自主实现computed，update的时候可以直接同步页面UI
实现跨组件状态共用


## 综合商品列表
原来问题：
通用商品列表杂糅多种样式，多种功能，运营只想使用一个组价来搭建页面，随着功能迭代，这个组件过于膨胀，来接口侧，数据侧和渲染侧，各种ifelse逻辑，维护成本越来越高
组件过多，业务逻辑过于庞杂

解决方案
通过装饰器，在组价的各个关键生命周期，注入对应的业务逻辑，在最外围添加功能判断模块，确认在后续的流程中需要跑那些逻辑，将各个功能模块的专属逻辑抽出到各自的文件中，方便维护

## 多米诺整体解决方案
多米诺系统，生成营销页的编辑与展示一体化平台，可视化，可交互，对运营友好，内容组件化，方便维护，业务逻辑以组件维度解耦。项目主体分为编辑页和展示页两部分，编辑页支持运营直接新增或编辑组件，组建内部支持UI编辑与业务逻辑编辑（数据源，交互方式等），在编辑页面可实时预览当前的编辑效果，点击提交后，会将运营编辑的页面生成一个json文件，其内部包含了生成该页面所需的所有内容，将其提交给后端。
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

## 字节
字节跳动海外广告业务线，tiktok海外广告展示站点creative center. 展示当前Tik Tok的流行趋势，热词，背景音乐等等，以及各个行业效果出众的广告，方便广告主进行参考。同时还提供便捷的渠道方便广告主跳转到广告投放和生成页面。

使用next.js架构进行后端渲染，优化用户体验，方便进行SEO，页面内提供了行业国家等等筛选器，方便广告主快速定位自己感兴趣的素材或者行业广告，引入缓存机制，降低服务期负担。

seo优化，html标签语义化改造，htmlheader动态添加关键词和描述，每次发布时自动更新sitemap，方便google爬虫更新站点的页面内容，img添加alt,增加高权重被引。

## 自创
将链上数据通过图形化的方式呈现给用户，方便用户进行体验，用户可以在宏观数据，衍生品，市场估值等等板块中寻找自己关心的内容进行探索，用户可以收藏和分享他喜欢的内容，同时也提供了高效的站内搜索功能以及国际化 

设计了一套架构，能够快速生成各种不同类型的图表，将echarts的option生成过程中的几个关键节点插入函数钩子，方便各个图表进行定制化开发，每个图标只需要修改少数内容就可以沿用尽可能多的图表公共逻辑。

设计了后端JWT用户认证架构和引入redis缓存，提高服务性能，避免频繁查询mysql底表
自建大数据集群，编写定时任务自动处理新生成的数据，设计数据结构存储海量区块数据，同时兼顾后续图表数据的产出 

## 装饰器写法
https://blog.csdn.net/zl_best/article/details/94447018 
通过装饰器log给一个类新增logger方法,如果带参数，返回的是科里化的结果函数 

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
1\握手阶段使用tcp
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

需要注意的是：因为协调阶段可能被中断、恢复，甚至重做，⚠️React 协调阶段的生命周期钩子可能会被调用多次!, 例如 componentWillMount 可能会被调用两次。
因此建议 协调阶段的生命周期钩子不要包含副作用. 索性 React 就废弃了这部分可能包含副作用的生命周期方法，例如componentWillMount、componentWillUpdate. v17后我们就不能再用它们了, 所以现有的应用应该尽快迁移.

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
浅拷贝方法：Object.assign,展开运算符，concat,slice

防抖、截流 https://juejin.cn/post/6844903752063778830
bind,call,apply, 
https://juejin.cn/post/7128233572380442660
await async
https://juejin.cn/post/6844904102053281806#heading-0
核心是把async改写成generator，然后用一个asyncToGenerator来直线generator的自动执行
函数科里化
https://juejin.cn/post/6844903645222273037

柯里化，可以理解为提前接收部分参数，延迟执行，不立即输出结果，而是返回一个接受剩余参数的函数。因为这样的特性，也被称为部分计算函数。柯里化，是一个逐步接收参数的过程。在接下来的剖析中，你会深刻体会到这一点。

反柯里化，是一个泛型化的过程。它使得被反柯里化的函数，可以接收更多参数。目的是创建一个更普适性的函数，可以被不同的对象使用。有鸠占鹊巢的效果。

# 浏览器缓存
https://juejin.cn/post/6855469171703185416
更细
https://juejin.cn/post/6844903763665240072

强缓存，协商缓存


三级缓存原理 (访问缓存优先级)
先在内存中查找,如果有,直接加载。
如果内存中不存在,则在硬盘中查找,如果有直接加载。
如果硬盘中也没有,那么就进行网络请求。
请求获取的资源缓存到硬盘和内存。

强缓存：
expires 绝对时间

Cache-Control（优先级高于Expires）
max-age
no-cache：需要进行协商缓存，发送请求到服务器确认是否使用缓存。
no-store：禁止使用缓存，每一次都要重新请求数据。
public：可以被所有的用户缓存，包括终端用户和 CDN 等中间代理服务器。
private：只能被终端用户的浏览器缓存，不允许 CDN 等中继缓存服务器对其缓存。
Cache-Control 与 Expires 可以在服务端配置同时启用，同时启用的时候 Cache-Control 优先级高。

协商缓存：
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

手写继承
https://www.jianshu.com/p/6925ed009f1e

手写观察者模式
204和304之间区别
两个进程之间如何通信？
https://juejin.cn/post/6844904199902199822#heading-11
http://www.voidcn.com/article/p-dplsmcdk-bsq.html
child_process.fork()
子网掩码有什么作用？

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

# 补缺
websocket机理，

小程序底层机理，
https://juejin.cn/post/6844903638226173965
## 小程序启动加载性能
控制代码包的大小
分包加载
首屏体验（预请求，利用缓存，避免白屏，及时反馈
## 小程序渲染性能
避免不当的使用setData
合理利用事件通信
避免不当的使用onPageScroll
优化视图节点
使用自定义组件

前端算法题

https://blog.csdn.net/weixin_38984353/article/details/80393412

排序算法
https://segmentfault.com/a/1190000020072884

https://juejin.cn/post/6844904122848641032

git 细节版本
https://github.com/biaochenxuying/blog/issues/42

h5性能优化
https://juejin.cn/post/6904517485349830670
# 技术选型
根据业务特性选择合理的前端架构和技术栈
# NetWork
可以依次分析：
请求资源size,
请求资源时长
请求资源数量
接口响应时间
接口发起数量，
接口报文size
接口响应状态
瀑布图

time to first byte
# webpack bundle analyzer

显示模块的size和gzip之后的size
显示所有打入的模块，观察是否有重复打包
# performanceNavigationTiming
DNS解析时间： domainLookupEnd - domainLookupStart
tcp链接建立时间： connectEnd - connectionStart
白屏时间： responseStart - navigationStart
dom渲染时间： domContentLoadEnentEnd - navigationStart
页面onload时间 loadEnentEnd - navigationStart
# performace
FCP/LCP时间是否过长
请求并发是否过于频繁
请求发起顺序是否不对
jascript执行是否过慢
浏览器模块，并发请求，FCP LCP是否过长

# 性能测试工具
chrome 自带performance, memory/profiler,recorder

优化点：
tree shake 
split Chunk
拆包
gzip压缩，
图片压缩，分割，雪碧图
静态资源上cdn
使用iconfont字体图表替换图片
懒加载
逻辑后移
算法复杂度
避免组件频繁渲染
后端渲染
添加node中间件合并请求
webworker创造多线程环境
开启GPU渲染优化动画
善用缓存
ajax get请求缓存
resource hints资源预加载：DNS-prefetch preload
域名发散

http,tcp,udp
tcp 全双工，三握四挥，全双工,点对点,保证可靠连接
udp 可以一对多，多对一，一对一，不需要连接，直接发数据，速度快，不保证一定会到达，适合广播
https://juejin.cn/post/6844903872339804167#heading-4
//  网络模型
https://juejin.cn/post/6844904049800642568

应用层：http,https,ftp(文件传输),stmp(邮件),tanlent， dns等 直接提供服务
传输层：tcp，udp, 为两台主机中的进程提供传输服务 
网络层：ip，两台主机提供通信服务，并通过选择合适的路由将数据传递到目标主机。
物理层（数据链路层，物理层）

应用层--------------->SMTP,POP3等du高层协议
表示层--------------->数据压缩加密zhi等
会话层--------------->建立应用到应用的连接
传输层--------------->TCP,UDP等
网络层--------------->IP/IPX等 设备:网关,多口网关(路由器)
数据链路层----------->PPP,帧中继等 设备:网桥,多口网桥(交换机)
物理层--------------->物理特性 设备:中继器,多口中继(集线器)

单工信道：只能有一个方向的通信而没有反方向的通信；
半双工信道：通信的双方都能发送信息，但双方不能同时发送或接收信息。
全双工信道：通信的双方可以同时发送和接收信息。

三次握手，四次挥手
SYN，表示同步，ACK表示响应，seq标识序列号，发送的时候seq,
FIN表示finish,先FIN,seq=a,服务器ACK,seq=a+1,然后FIN，seq=b,最后发起方ACK,seq=b+1
## 为什么要三次四次
https://juejin.cn/post/6844903913611591688
最后一次服务端需要确认客户端收到了，四次因为服务器可能还要再发送，不能把FIN和ACK一同发送

http只能浏览器发起，
1.0是个短链接，发完就关闭
1.1 是长连接，在一个时间间隔内，可以复用原来的tcp通道，不用重连

请求行：
说明是get还是post,版本协议等
请求头
User-agent:浏览器类型，Accep，可接受的数据类型，Accept-Encoding,Accept-Language等等，content-type发送内容类型（post才有）
空行
请求体

响应
状态行
状态码和协议版本
响应报头 date server content-length connection set-cookie等
空行
响应报文

http报文详解

BFC
https://juejin.cn/post/6898278714312753159#heading-0
里面的元素不会影响外面的元素，表现方式从上到下依次排列
父子上边距合并，父子相邻边距，父子浮动，兄弟浮动
父元素：overflow:hidden display：flow-root,加border: 1px solid padding: 1px

proxy看看
https://juejin.cn/post/6844904090116292616

链表
https://juejin.cn/post/6844904023531716616

前端算法leetCode
https://juejin.cn/post/6847009772500156429#heading-15
面经干货 
https://juejin.cn/post/6844904149386002440

# hppts过程
https://juejin.cn/post/6844903602494898183
通信使用密文，验证身份，验证内容完整性
ssl基于应用层与传输层
HTTPS并不是一个单独的应用层协议，而只是Http使用SSL通道进行数据传输的过程。

react如何动态加载
Ack = () => import('xxxxxx');
react diff算法
es module和commonjs的区别
https://juejin.cn/post/6844904080955932680#heading-12

https://juejin.cn/post/6844904137159606285
common 模块依赖关系建立发生在代码运行阶段，输出是拷贝，
Module依赖关系的建立发生在代码编译阶段，输出是动态映射
commonjs支持可以在运行时使用变量进行 require, 静态语法import不行，ES6模块会先解析所有模块再执行代码

cors是如何做的
大数加法，精度函数
联想搜索组件
https://juejin.cn/post/6904151596960071687

let const var 变量提升
两个链表第一个公共节点 https://www.nowcoder.com/practice/6ab1d9a29e88450685099d45c9e31e46?tpId=117

牛客面经干货
https://www.nowcoder.com/discuss/538616

手写EventEmitter
promise控制异步并发很重要
https://juejin.cn/post/6916317088521027598#heading-1
总结归纳帖子
https://www.nowcoder.com/discuss/213693
手写promise.all race
自己实现一个event类

正则表达式
由字母开头，由字母数字下划线组成的6-30位字符串
/^[a-zA-z][a-zA-Z0-9_]{5,29}/

匹配电话区号
区号3-4位，第一位为0，中横线，7-8位数字
/0[\d]{2,3}-[\d]{7,8}/

手写jsonp实现
https://juejin.cn/post/6844904021401010184

常见手写代码
https://juejin.cn/post/6917811484898623495#heading-0

手写代码大全
https://juejin.cn/post/6902060047388377095#heading-24


h5性能优化，火焰图

前端首屏性能参数
https://juejin.cn/post/6844904020482457613
白屏时间
head标签头部和尾部
首屏时间
白屏时间+首屏渲染时间
可操作时间
dom.ready触发时间
DOMContentLoaded
https://zhuanlan.zhihu.com/p/25876048
总下载时间
window.onload触发时间点

window.performance

FMP DCL FP FCP LMP LCP
First Meaningful Paint 谷歌
DCL DOMContentLoaded Event FirstPaint FP(第一个内容) PCP First Contentful Paint(第一个图片或文字) FMP LCP Largest Contentful Paint Onload Event
http://www.alloyteam.com/2016/01/points-about-resource-loading/ 首屏时间细节

node 如何排查内存泄漏？
V8内部，会为程序所有的变量构建一个图，用来标识变量间关系，当从根节点无法被触达时，标识这个变量不会再被使用，就是可回收的
引用不释放，导致无法进入GC环节
devTool heapdump chrome devTool memwatch
node 64位最大内存1.4g,32位0.7g
获取堆快照，使用chrome dev载入，进行比对

https://juejin.cn/post/6877869159309377544
https://juejin.cn/post/6844903439747514376

前端web安全
https://juejin.cn/post/6844903876106125319
标签转译
跨站脚本攻击 XSS（Cross-site scripting）
获取页面数据，dom,cookie,localStorage等
劫持前端逻辑，
发送请求

反射型：通过url参数直接注入
存储型：存到数据库后读取注入
基于dom: 被执行恶意脚本修改页面结构

防御：
X-XSS-Protection
代码转义，进行json序列化
使用httpOnly
http头部Content-Security-Policy，控制浏览器可以获取那些资源

跨站请求伪造 CSRF(Cross Site Request Frogy) 
增加验证码，cookies设置sameSite, 验证refer，验证token，更换登录态方案，不使用cookie

1.登录受信任网站A，并在本地生成Cookie。
2.在不登出A的情况下，访问危险网站B。

vw/vh 
基于视口来计算，100vw等于视口宽度
rem
等同于根元素的font-size,1rem=根元素font-size
媒体查询
em计算的标准是自己的父元素

jsbridge实现
https://juejin.cn/post/6844903702721986568
js调用native：schemal拦截，url拦截，popup,alert拦截
native调h5 获取window上挂载的对象

链接：https://juejin.cn/post/6844904165462769678
事件循环不一定每轮都伴随着重渲染，但是如果有微任务，一定会伴随着微任务执行。
决定浏览器视图是否渲染的因素很多，浏览器是非常聪明的。
requestAnimationFrame在重新渲染屏幕之前执行，非常适合用来做动画。cancelAnimationFrame
requestIdleCallback在渲染屏幕之后执行，执行那些不需要及时更新的任务，例如计算、数据处理和网络请求。并且是否有空执行要看浏览器的调度，如果你一定要它在某个时间内执行，请使用 timeout参数。cancelIdleCallback
resize和scroll事件其实自带节流，它只在 Event Loop 的渲染阶段去派发事件到 EventTarget 上。

链接：https://juejin.cn/post/6844904165462769678

react hooks解决的问题
函数组件中不能拥有自己的状态（state）。
在hooks之前函数组件是无状态的，都是通过props来获取父组件的状态，但是hooks提供了useState来维护函数组件内部的状态。
函数组件中不能监听组件的生命周期。
useEffect聚合了多个生命周期函数。
class组件中生命周期较为复杂（在15版本到16版本的变化大）。
class组件逻辑难以复用（HOC，render props）。

hooks对比class好处
写法更加简洁
业务代码更加聚合
逻辑复用方便

https://juejin.cn/post/6844903744518389768
commonjs
所有代码都运行在模块作用域，不会污染全局作用域。
模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。
模块加载的顺序，按照其在代码中出现的顺序。

AMD
使用require.js,支持异步

CMD
CMD规范专门用于浏览器端，模块的加载是异步的，模块使用时才会加载执行。CMD规范整合了CommonJS和AMD规范的特点。

ES6模块化
ES6 模块的设计思想是尽量的静态化，使得编译时就能确定模块的依赖关系，以及输入和输出的变量。CommonJS 和 AMD 模块，都只能在运行时确定这些东西。

ES6 模块与 CommonJS 模块的差异
它们有两个重大差异：
① CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。
② CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。

前端内存泄漏场景：
闭包使用不当
全局变量
分离dom节点
控制台打印
遗忘定时器

https://juejin.cn/post/7211800391012237368
什么是微前端？
微前端就是将不同的功能按照不同的维度拆分成多个子应用。通过主应用来加载这些子应用。

不同团队间开发同一个应用技术栈不同怎么破？
希望每个团队都可以独立开发，独立部署怎么破？
项目中还需要老的应用代码怎么破

iframe有什么问题？
如果使用iframe，iframe中的子应用切换路由时用户刷新页面就尴尬了。
浏览器路径不同步。浏览器刷新之后，iframe链接状态丢失。浏览器前进后退按钮在iframe中也是无法使用的。
DOM 结构不共享。想象一下屏幕右下角 的 iframe 需要一个居中的弹框，我们可以通过iframe通信的方式实现，但是会给我们增加不必要的复杂度。
iframe间cookie管理成本较高，我们需要在iframe中共享同一个cookie。
慢。每次子应用进入都需要重建浏览器上下文、资源也会重新加载。

实现方式：
iframe
微前端的最简单方案，通过iframe加载子应用。 通信可以通过postMessage进行通信。 完美的沙箱机制自带应用隔离。
Web Components
将前端应用程序分解为自定义 HTML 元素。 基于CustomEvent实现通信
Shadow DOM天生的作用域隔离
single-spa
single-spa 通过路由劫持实现应用的加载(采用SystemJS)，提供应用间公共组件加载及 公共业务逻辑处理。子应用需要暴露固定的钩子 bootstrap、mount、 unmount)接入协议。
Module federation
通过模块联邦将组件进行打包导出使用 共享模块的方式进行通信 无CSS沙箱和JS沙箱

react 18 新特性
https://juejin.cn/post/7094037148088664078
引入并发渲染concurrent
React 17 和 React 18 的区别就是：从同步不可中断更新变成了异步可中断更新。
setState自动批处理
renderAPI更改 ReactDOM.createRoot(root).render(<App />);
startTransition、useDeferredValue

react和vue区别：
https://juejin.cn/post/7144648542472044558
，比如都使用虚拟DOM高效的更新视图，都提倡组件化，都实现了数据驱动视图，都使用diff算法，也都对diff算法进行了优化

都有组件化：
React推荐的做法是JSX + inline style, 也就是把 HTML 和 CSS 全都写进 JavaScript 中,即 all in js;

Vue 推荐的做法是 template 的单文件组件格式(简单易懂，从传统前端转过来易于理解),即 html,css,JS 写在同一个文件(vue也支持JSX写法)

虚拟dom的差别：
react 会自顶向下全diff。vue会跟踪每一个组件的依赖关系,不需要重新渲染整个组件树。Vue2的核心Diff算法采用了双端比较的算法，同时从新旧children的两端开始进行比较，借助key值找到可复用的节点，再进行相关操作。相比React的Diff算法，同样情况下可以减少移动节点次数，减少不必要的性能损耗，更加的优雅。

数据驱动视图：
同时每一个实例对象都有一个watcher实例对象，他会在模板编译的过程中,用getter去访问data的属性，watcher此时就会把用到的data属性记为依赖，这样就建立了视图与数据之间的联系。当之后我们渲染视图的数据依赖发生改变（即数据的setter被调用）的时候，watcher会对比前后两个的数值是否发生变化，然后确定是否通知视图进行重新渲染。

React通过setState实现数据驱动视图，通过setState来引发一次组件的更新过程从而实现页面的重新渲染

vue2和vue3的变化
https://juejin.cn/post/7203195123433734203
响应性：
2依赖Object.defineProperty ,3依赖refect和proxy

运行时
3把宿主环境和渲染逻辑进行分离，可以在非浏览器运行

编辑器
script setup

如何判断一个元素是否在视口内？

useRef
任意一次渲染周期(函数调用)的state/prop(直观来说就是like值)都不会随着时间改变，因为每次调用渲染函数中的like值都是一个常量(在各自的渲染函数作用域内)。它的作用仅仅只是渲染输出，插入jsx中的数字而已。

作用一：多次渲染之间的纽带
useRef会在所有的render中保持对返回值的唯一引用。因为所有对ref的赋值和取值拿到的都是最终的状态，并不会因为不同的render中存在不同的隔离。

react中获取DOM
通过useRef创建一个变量进行保存(domRef)。
在jsx中通过ref={domRef}给对应元素节点添加属性。
在页面挂载后通过domRef.current就可以获取对应节点的真实DOM元素了。

跨域：
不同域之间相互请求资源，就算作“跨域”。它是由浏览器的同源策略造成的，是浏览器对javascript实施的安全限制。

简单请求和非简单请求
简单请求采取先请求后判断的方式，非简单请求采取预检请求的方式判断是否允许跨域访问。
请求端带origin,服务器返回Access-Control-Allow-Origin
Access-Control-Allow-Credentials 是否携带cookie
Access-Control-Allow-Headers 允许带头信息

非简单请求先发option

解决：
客户端在浏览器设置

服务端
代理转发，配置cors

-----2023------
查漏补缺 最近两周出去面试遇到的面试题（前端初级、长更）
https://juejin.cn/post/7073869980411887652
六年前端面试报告
https://juejin.cn/post/7158019029163048974
做了一份前端面试复习计划，保熟～
https://juejin.cn/post/7061588533214969892
//  细节补缺
https://juejin.cn/post/6844904197595332622

微前端，react最新版本的特性,18，vue新版本特性,vue3新特性,vite
service worker,如何实现全屏换肤 useRef,跨域,requestAnimationFrame实操，
你想要问什么问题？

react.purecomponent
https://juejin.cn/post/6844904094021206024
当使用component时，父组件的state或prop更新时，无论子组件的state、prop是否更新，都会触发子组件的更新，这会形成很多没必要的render，浪费很多性能；pureComponent的优点在于：pureComponent在shouldComponentUpdate只进行浅层的比较，只要外层对象没变化，就不会触发render,减少了不必要的render

前端优化，btc项目核心梳理
后端相关

移动端样式rem, 跨站脚本攻击
函数式编程，如何判断一个元素是否可见
1.el.offsetTop - document.documentElement.scrollTop <= viewPortHeight
2.getBoundingClientRect 相对于视口的位置
3.intersection observer

初级和中高级的比例
技术分享？
开会的话重要内容是什么？
项目发布的节奏大致是怎样的？

高级前端面筋
https://www.bilibili.com/read/cv19424440?from=articleDetail
https://segmentfault.com/a/1190000021966814
https://github.com/kaindy7633/blog/issues/43