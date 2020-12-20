浏览器事件循环
# 手写promise  
 * 有个变量存贮三种状态，有个excutor来立即执行函数，res和rej我们直接来提他们实现  
 * protype原型上挂then，根据状态来执行回调
 * 为了实现异步，通过两个数组sucList和errList来存放回调，resolve后再执行，then的时候只是执行push
 * 需要实现链式调用 操作
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


浏览器插件
后端渲染
浏览器宏任务

项目优化
webpack打包，loader原理

梳理项目
梳理博客

# 面经：
社招中级前端笔试面试题总结
https://juejin.cn/post/6844903605107965960

一年社招面经（有pdd和字节）
https://juejin.cn/post/6844903928623038478

字节面经
https://www.nowcoder.com/discuss/580800?type=2&order=3&pos=22&page=1&channel=-1&source_id=discuss_tag_nctrack