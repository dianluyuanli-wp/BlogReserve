/*
 * @Author: dianluyuanli-wp
 * @LastEditors: dianluyuanli-wp
 * @Date: 2023-03-18 15:29:32
 * @LastEditTime: 2023-04-02 19:09:42
 */
//  装饰器,针对属性或方法
function decorator(type) {
    return function(target,name,descriptor) {
        return {
            enumerator: true,
            configurable: true,
            get: function() {
                return v;
            },
            set: function(c) {
                v = c;
            }
        }
        //  return descriptor;
    }
}
class A {
    @decorator
    props: 1,
}
//  针对类的装饰器
function clsDec(target) {
    target.prototype.log = () => console.log(11);
}
//  react手写
function render(element,container) {
    container.innerHTML = `<span>${element}</span>`
}
let ReactDom = {
    render,
}
export default ReactDom;
//hooks手写
let memorizedState=[];
let cursor=0;
function useState(init) {
    memorizedState[cursor] = memorizedState[cursor]||init;
    let currentCursor = cursor;
    function setState(newState) {
        memorizedState[currentCursor]=newState;
        render();
    }
    return [memorizedState[cursor++],setState]
}
function useEffect(callback, depArray) {
    const hasNoDep = !depArray;
    const deps = memorizedState[cursor];
    const hasChange = deps ? 
        !deps.every((ele,i)=>ele===deps[i]) : true;
    if(hasChange||hasNoDep){
        callback();
        memorizedState[cursor]=depArray;
    }
    cursor++;
}

//深拷贝,防循环引用
function deepClone(obj, hash= new WeakMap()) {
    if(obj===null) {
        return obj;
    }
    if(obj instanceof Date) {
        return new Date(obj)
    }
    if(obj instanceof RegExp) {
        return new RegExp(obj)
    }
    if(typeof obj!== 'object') {
        return obj;
    }
    if(hash.get(obj)) {
        return hash.get(obj)
    }
    let newObj = new obj.constructor();
    hash.set(obj,newObj);
    for(let i in obj) {
        if(obj.hasOwnProperty(i)) {
            newObj[i] = deepClone(obj[i],hash)
        }
    }
    return newObj;
}
JSON.parse(JSON.stringify(obj))
//  浅拷贝
Object.assign({}, obj);
//{...obj}
//  针对数组
//.slice() 和.contact()

//防抖,无论出发多少次，只执行最后一次
function debounce(fn, delay, immediate) {
    var timer;
    return function() {
      var context = this;
      var args = arguments;
      // 停止定时器
      if (timer) clearTimeout(timer);
      // 回调函数执行的时机
      if (immediate) {
        // 是否已经执行过
        // 执行过，则timer指向定时器对象，callNow 为 false
        // 未执行，则timer 为 null，callNow 为 true
        var callNow = !timer;
        // 设置延时
        timer = setTimeout(function() {
          timer = null;
        }, delay);
        if (callNow) fn.apply(context, args);
      } else {
        // 停止调用后delay时间才执行回调函数
        timer = setTimeout(function() {
          fn.apply(context, args);
        }, delay);
      }
    };
  }
//截留
function thro(fn,wait,option) {
    let timer;
    let previous=0;
    function reaFn() {
        let self = this;
        let nowT = + new Date();
        if(option.head && !previous) {
            fn.call(this);
            previous = nowT;
            return;  
        }
        let remain = wait - (nowT-previous);
        if(remain <=0 && previous>0) {
            fn.call(this);
            previous = nowT
        } else if (!timer && option.tailing) {
            timer = setTimeout(() => {
                fn.call(self);
                previous = nowT
                clearTimeout(timer);
                timer=null;
            },remain > 0 ? remain : wait)
        }
    }
    reaFn.cancle = function() {
        clearTimeout(timer);
        timer=null;
        previous=0
    }
    return reaFn;
}
let now = + new Date();
let say = () => {
    let nn = + new Date();
    console.log(111, nn - now);
}
let newSay = thro(say,1000,{
    head:true,
    tailing: true
});
setTimeout(newSay,0);
setTimeout(newSay,100);
setTimeout(newSay,500);
setTimeout(newSay,3000);
setTimeout(newSay,3700);
//手动bind,call,apply
Function.prototype.mycall = function(target,...args) {
    let context = target || window;
    let symbol = Symbol();
    context[symbol] = this;
    let res = context[symbol](...args);
    delete context[symbol];
    return res;
}
Function.prototype.myapply = function(target,args) {
    let context = target || window;
    let symbol = Symbol();
    context[symbol] = this;
    let res = context[symbol](...args);
    delete context[symbol];
    return res;
}
Function.prototype.mybind = function(target,...args) {
    let context = target || window;
    let symbol = Symbol();
    context[symbol] = this;
    let fn = function(...innerargs) {
        return context[symbol](...args,...innerargs);
    }
    return fn;
}
Function.prototype.myBind = function (context) {
    // 判断调用对象是否为函数
    if (typeof this !== "function") {
      throw new Error("Type error");
    }
    // 获取参数
    const args = [...arguments].slice(1),
    const fn = this;
    return function Fn() {
      return fn.apply(
        this instanceof Fn ? this : context,
        // 当前的这个 arguments 是指 Fn 的参数
        args.concat(...arguments)
      );
    };
  };
//手动async await
function* test() {
    let data = yield getdata();
    return 'success'
}
function asyncToGenerator(fn) {
    return function() {
        const newFn = fn.apply(this,arguments);
        return new Promise((res,reject)=> {
            function step(key,arg) {
                let res;
                try {
                    res = newFn[key](arg);
                } catch(err) {
                    reject(err)
                }
                const { value, done } = res;
                if(done) {
                    res(value)
                } else {
                    return Promise.resolve(value).then(function(val) {
                     step('next',val)   
                    },function(err) {
                        step('throw',err)
                    })
                }
            }
            step('next');
        })
    }
}
//  柯里化,用一个闭包来存数据
//  add(1)(2, 3)(4)()
function currying(fn) {
    let props = [];
    return function next() {
        let arr = arguments.slice();
        if(arr.length>0) {
            props = props.concat(arr);
            return next;
        } else {
            return fn.apply(null,props);
        }
    }
}
let add = currying(function () {
    let sum = 0;
    for(let i=0;i<arguments.length;i++){
        sum+=arguments[i]
    }
    return sum;
})
//add(1)(2, 3)(4)(5)=15
function cur2(fn) {
    let props = [];
    function next() {
        let arr = arguments.slice();
        props = props.concat(arr);
        return next;
    }
    next.valueOf = function() {
        return fn.apply(null,props)
    }
    next.toString = function() {
        return fn.apply(null,props) + ''
    }
    return next;
}
//  返回一个函数，传入的第一个参数作为this的绑定
Function.prototype.unCurry = function() {
    let self = this;
    return function() {
        return Function.prototype.call.apply(self, arguments);
    }
}
function myinstanceof(L, R) { //L是表达式左边，R是表达式右边
    const O = R.prototype;
    L = L.__proto__;
    while(true) {
        if (L === null)
            return false;
        if (L === O) // 这里重点：当 L 严格等于 0 时，返回 true 
            return true;
        L = L.__proto__;
    }
}
//  寄生组合继承
function Cat(name) {
    Animal.call(this); 
}
(function() {
    let ssuper = function() {};
    ssuper.prototype = Animal.prototype;
    Cat.prototype = new ssuper(); 
})()
//  发布订阅
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    on(type,cb) {
        if(this.listeners[type]) {
            this.listeners[type].push(cb)
        } else {
            this.listeners[type] = [cb];
        }
    }
    emit(type,...argus) {
        if(this.listeners[type].length) {
            this.listeners[type].forEach(item => {
                item(...argus)
            })
        }
    }
    off(type,cb){
        if(this.listeners[type].length){
            let rank = this.listeners[type].findIndex(item => item ===cb);
            if(rank>-1){
                this.listeners[type].splice(rank,1)
            }
            if(this.listeners[type].length===0){
                delete this.listeners[type]
            }
        }
    }
    deleteAll(type) {
        delete this.listeners[type];
    }
}
//  观察者模式
class Observer {
    constructor(cb) {
        this.cb = cb;
    }
    update() {
        this.cb;
    }
}

class Subject {
    constructor() {
        this.observerList = []
    }
    addObserver(obs) {
        this.observerList.push(obs)
    }
    notify() {
        this.observerList.forEach(item => {
            item.update();
        })
    }
}
//promise控制多种并发，同一时刻有上线
function multi(urls=[],maxNum) {
    let len = urls.length;
    const result = new Array(len).fill(false);
    let count = 0;

    return new Promise((res,rej) => {
        while(count<maxNum){
            next();
        }
        function next() {
            let cur = count++;
            if(cur>=len) {
                !res.includes(false) && res(result)
            }
            const url = cur[cur];
            fetch(url).then(ress=> {
                result[cur] = ress;
                if(cur<len){
                    next();
                }
            }).catch(err=> {
                result[cur]=err;
                if(cur<len){
                    next();
                }
            })
        }
    })
}
// 手写new实现
function myNew(context) {
    let obj = new Object();
    obj.__proto__ = context.prototype;
    let res = context.apply(obj,[...arguments].slice(1));
    return typeof res === 'object' ? res : obj;
}
//手写promise all
Promise.myall = function(promise) {
    return new Promise((resolve,reject) => {
        if(typeof promise[Symbol.iterator] !== 'function') {
            reject("Error")
        }
        if(promise.length===0) {
            return resolve([])
        } else {
            const res = [];
            let cursor = 0;
            for(let i=0;i<promise.length;i++){
                Promise.resolve(promise[i]).then(data=> {
                    res[cursor]=data;
                    cursor++;
                    if(cursor===promise.length){
                        resolve(res)
                    }
                }).catch(err=> {
                    reject(err)
                })
            }
        }
    })
}
//  手写instanceof
function myInstance(target,origin) {
    if(typeof target !== 'object' || target === null) {
        return false;
    }
    if(typeof origin !== 'function') {
        throw new Error('need to be function');
    }
    let proto = Object.getPrototypeOf(target);
    while(proto){
        if(proto===origin) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
function myinstanceof(L, R) { //L是表达式左边，R是表达式右边
    const O = R.prototype;
    L = L.__proto__;
    while(true) {
        if (L === null)
            return false;
        if (L === O) // 这里重点：当 L 严格等于 0 时，返回 true 
            return true;
        L = L.__proto__;
    }
}
//  数组扁平化
function flat(arr,dep) {
    if(dep>0) {
        return arr.reduce((old,newItem) => {
            return old.concat(Array.isArray(newItem)? flat(newitem,dep -1) : newItem)
        }, [])
    }
    return arr.slice();
}
//  手写reduce
Array.prototype.myreduce = function(cb, init) {
    const arr = this;
    let total = init || arr[0];
    for(let i=0;i<arr.length;i++){
        total = cb(total,arr[i],i,arr)
    }
    return total;
}
//带并发的一部调度器
class Scheduler {
    constructor() {
        this.waits = [];
        this.excuting = [];
        this.maxnum=2;
    }
    add(promi) {
        if(this.excuting.length<this.maxnum) {
            this.run(promi)
        } else {
            this.waits.push(promi)
        }
    }
    run(promi) {
        const len = this.excuting.push(promi);
        const index = len -1;
        promi().then(() => {
            this.excuting.splice(index,1);
            if(this.waits.length>0){
                this.run(this.waits.shift());
            }
        })
    }
}