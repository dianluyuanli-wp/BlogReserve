浏览器事件循环
promise  
    * 有个变量存贮三种状态，有个excutor来立即执行函数，res和rej我们直接来提他们实现  
    * protype原型上挂then，根据状态来执行回调
    * 为了实现异步，通过两个数组sucList和errList来存放回调，resolve后再执行，then的时候只是执行push
    * 需要实现链式调用 操作
react 原理
浏览器宏任务
梳理项目
梳理博客