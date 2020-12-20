浏览器事件循环
promise  
    * 有个变量存贮三种状态，有个excutor来立即执行函数，res和rej我们直接来提他们实现  
    * protype原型上挂then，根据状态来执行回调
    * 为了实现异步，通过两个数组sucList和errList来存放回调，resolve后再执行，then的时候只是执行push
    * 需要实现链式调用 操作
react 原理
mobx原理
小程序框架
浏览器插件
后端渲染
浏览器宏任务

项目优化
webpack打包，loader原理

梳理项目
梳理博客

面经：
社招中级前端笔试面试题总结
https://juejin.cn/post/6844903605107965960

一年社招面经（有pdd和字节）
https://juejin.cn/post/6844903928623038478

字节面经
https://www.nowcoder.com/discuss/580800?type=2&order=3&pos=22&page=1&channel=-1&source_id=discuss_tag_nctrack