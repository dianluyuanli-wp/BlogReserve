# 前言
书接上文，在前一篇文章中[babel插件分析-编写你的第一个插件](https://juejin.im/post/5d707290e51d453b762584f4)，对于babel的原理和如何写一个插件进行了大致的分析，这里我们将结合一个官方插件@babel/plugin-proposal-optional-chaining，对babel实现进行深入分析。当前的浏览器还不支持可选链式调用，也就是类似这样的写法：
```
let a = b?.c;
// or
let cc = a?.b();
```
即在.操作符前添加一个问号，表示如果?.操作符后的内容如果没法取到，将会直接返回undefined，在日常的开发过程中，这是一个容我们从链式调用地狱中解脱出来的神器，以前处于代码健壮性的考虑，我们常常写出类似这样的代码：
```
let value = a && a.b && a.b.c && a.b.c.d;
```
使用了@babel/plugin-proposal-optional-chaining插件后，我们只需这样：
```
let value = a?.b?.c?.d;
```
极大优化编程体验。源码是如何实现转化的呢？
# 源码分析
废话不多说，先上源码
```
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _helperPluginUtils() {
  const data = require("@babel/helper-plugin-utils");

  _helperPluginUtils = function () {
    return data;
  };

  return data;
}

function _pluginSyntaxOptionalChaining() {
  const data = _interopRequireDefault(require("@babel/plugin-syntax-optional-chaining"));

  _pluginSyntaxOptionalChaining = function () {
    return data;
  };

  return data;
}

function _core() {
  const data = require("@babel/core");

  _core = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//  以上部分是为插件内部导出一些核心工具方法

var _default = (0, _helperPluginUtils().declare)((api, options) => {
  api.assertVersion(7);
  const {
    loose = false
  } = options;
  return {
    //  插件名字
    name: "proposal-optional-chaining",
    //  继承父插件特性
    inherits: _pluginSyntaxOptionalChaining().default,
    visitor: {
      //  可选链式调用或者可选链式属性
      //  如果两种特征方法使用同一个函数可以使用'expressionA | expressionB'这样的写法
      "OptionalCallExpression|OptionalMemberExpression"(path) {
        const {
          parentPath,
          scope
        } = path;
        const optionals = [];
        let optionalPath = path;

        //  如果是可选链式调用或者可选链式属性，进入循环
        //  遍历所有的可选调用，将所有的可选节点放入数组
        while (optionalPath.isOptionalMemberExpression() || optionalPath.isOptionalCallExpression()) {
          //  获取路径节点
          const {
            node
          } = optionalPath;

          //  如果存在可选属性，添加到可选数组中
          if (node.optional) {
            optionals.push(node);
          }

          //  如果是可选成员表达式
          if (optionalPath.isOptionalMemberExpression()) {
            //  当前节点的类型变成成员表达式,以前是OptionalMemberExpression
            optionalPath.node.type = "MemberExpression";
            //  节点更新，替换成自己的子对象，相当于进入了下一层循环
            optionalPath = optionalPath.get("object");
          } else if (optionalPath.isOptionalCallExpression()) {
            //  节点更新，如果是可选调用，节点类型赋值成'callExprssion'
            optionalPath.node.type = "CallExpression";
            //  可选路径变成调用者，也是进入了下一层循环
            optionalPath = optionalPath.get("callee");
          }
        }

        //  替换路径，拷贝一份路径
        let replacementPath = path;

        //  是否是一元表达式 删除
        if (parentPath.isUnaryExpression({
          operator: "delete"
        })) {
          replacementPath = parentPath;
        }

        //  for循环所有的可选表达式节点
        for (let i = optionals.length - 1; i >= 0; i--) {
          const node = optionals[i];
          //  判断是否是调用表达式
          const isCall = _core().types.isCallExpression(node);
          
          //  判断先前被替换过的key是哪个
          const replaceKey = isCall ? "callee" : "object";
          //  获取登记结点的object或者callee属性，就是问号部分后面的链子
          const chain = node[replaceKey];
          let ref;
          //  check 最后拿去替换的变量
          let check;

          //  如果是宽松并且是调用,本质是给check和ref赋值
          //  loose是插件的一个可选属性，默认为false,此时如果问号前的变量是null或者undefined，都会返回undefined，反之，只有变量是undefined的时候才返回undefined
          if (loose && isCall) {
            check = ref = chain;
          } else {
            //  如果是静态节点，返回null，如果是动态的，返回节点的克隆
            ref = scope.maybeGenerateMemoised(chain);

            //  如果是动态节点
            if (ref) {
              //  check赋值成一个赋值表达式，ref克隆节点=chain
              check = _core().types.assignmentExpression("=", _core().types.cloneNode(ref), chain);
              //  原来的属性值替换成动态应用节点
              node[replaceKey] = ref;
            } else {
              //  不是静态节点的话，直接赋值
              check = ref = chain;
            }
          }

          //  如果是调用并且chain是成员对象表达式
          if (isCall && _core().types.isMemberExpression(chain)) {
            if (loose) {
              //  如果是loose,那么被调用者直接拼上链子
              node.callee = chain;
            } else {
              const {
                object
              } = chain;
              //  获取链子object，如果是静态节点，返回null，反之返回节点的克隆
              let context = scope.maybeGenerateMemoised(object);

              //  如果有链子object，则把它变成一个表达式context=object
              if (context) {
                chain.object = _core().types.assignmentExpression("=", context, object);
              } else {
                //  否则的话，克隆节点赋值成object
                context = object;
              }
              //  节点的参数数组添加context的复制节点
              node.arguments.unshift(_core().types.cloneNode(context));
              //  被调用者成为成员对象表达式，calle.call(context, ...)
              node.callee = _core().types.memberExpression(node.callee, _core().types.identifier("call"));
            }
          }
          //  替换路径被替换  条件表达式
          replacementPath.replaceWith(_core().types.conditionalExpression(loose ? _core().types.binaryExpression("==", _core().types.cloneNode(check), _core().types.nullLiteral()) //  克隆节点==null
              //  克隆节点===null || 克隆ref === undefined节点
              : _core().types.logicalExpression("||", _core().types.binaryExpression("===", _core().types.cloneNode(check), _core().types.nullLiteral()), _core().types.binaryExpression("===", _core().types.cloneNode(ref), scope.buildUndefinedNode())),
              //  第二个参数 undefined
              scope.buildUndefinedNode(),
              //  第三个参数 替换节点
              replacementPath.node));
          //  替换路径赋值成其alternat额属性
          replacementPath = replacementPath.get("alternate");
        }
      }

    }
  };
});

exports.default = _default;
```

要想替换可选链式调用的语法为浏览器和可以识别的方式，首先我们要知道?.在AST中的特征值，将类似'let a = b?.c'这样的代码粘贴到[AST分析工具中](https://astexplorer.net/ ),可以得到这用语法在AST中的关键字是'OptionalCallExpression'或'OptionalMemberExpression'
![AST分析可选链式调用](https://user-gold-cdn.xitu.io/2019/9/6/16d0466b434425b8?w=449&h=636&f=png&s=17751)  
在源码的visitor中，可以看到就是用这两个关键字方法来遍历语法树的。
源码的主要思路是：在visitor函数中遍历所有的可选调用节点（判断节点的optional属性是否为true），在一个while循环中将他们都推入一个数组，将当前节点的type进行修改的同时递归当前路径的下一个可选链式调用节点。
稍后通过for循环，处理之前push过的每一个节点