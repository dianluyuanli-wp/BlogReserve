# 前言
&emsp;&emsp;最为一个前端开发者，应该没有人不知道babel是什么，但针对不大熟悉的同学，在这里我还是简单介绍一下：JavaScript 的版本标准更新频繁，从2015年开始，就以每年一个版本的速度更新（该版本为es6），每个版本标准都会推出一些新的语法糖（装饰器语法，动态加载等），极大地提升了编程体验；在下个版本推出前，社区也会提出一些提案，涉及未来es版本的最新特性（可选链式调用等）。这些新的特性或者语法糖并不为当前的浏览器引擎所识别。因此就需要一个类似polyfill的中间工具，将这些新的特性编译为降级语法，在功能不变的前提下，支持浏览器引擎。而babel就是这个最出名的polyfill工具，成为事实上的前端生态重要组成部分。
# 关于AST
&emsp;&emsp;在大型项目中，通常有大佬完成babel配置，作为搬砖仔只需要写业务代码就可以了。但是如果你并不满足于成为页面仔，那就需要对这个重要的底层工具有一定的深度了解。babel之所以能够替我们完成语法的转换，是因为其内置工具（基于ESTree）对我们的源码进行了静态分析，将js源码解析成为了以路径（path）和节点（node）作为基础元素的抽象语法树（AST，计算机科学中的概念）,针对js语法所允许的每一种写法，都有与之对应的描述方式与操作api，通过暴露出来的api,即可对源码进行替换，拼接，压缩等操作，输出转换后的代码。举一个最简单的例子，使用let关键字声明一个变量a:
```
let a = 1;
```
通过AST工具转换后，可以得到如下的结构（限于篇幅，没有截取全部内容，顺便安利一个ast分析工具astexplorer，链接https://astexplorer.net/ 输入代码后，可直接在右侧获取该代码解析出的对象）
![抽象语法树.png](https://upload-images.jianshu.io/upload_images/19372956-876b29ca221b928b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
variableDeclaration说明这个节点是一个变量声明，kind:let说明这个变量是let类型，id和init分别指代变量的名字和变量的初始值，所有的js预发都会被解析为类似的形式，其他的语法会被解析成什么样子，大家可以自行实验。获取了抽象语法树，接下来的问题就是如何对其进行改造，满足我们的要求。babel插件的写法并不难，其本质上就是一个函数，该函数返回一个对象，该对象包含visitor属性，该属性定义了在对ast进行遍历的过程中，对哪些节点进行处理：
```
module.exports = function() {
    return {
        visitor: {
            Identifier() {
                console.log("here is identifier");
            }
        }
    }
}
```
上面就是一个简单的babel插件，表示在遍历的过程中，每遇到一个标识符，就打印一句提示。identifier是babel内置的js语法描述标识，类似的还有MemberExpression 、FunctionDeclaration 等，表示在进入成员变量或者函数声明节点时要进行的操作。
# 示例
接下来是一个稍微复杂一些的例子：
源文件1：
```
function square(n) {
    return n * n;
}
```
将上述代码进行ast分析（使用astexplorer）：
![源文件1 部分ast.png](https://upload-images.jianshu.io/upload_images/19372956-43155df2626c3b75.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

插件内容：
```
module.exports = function({types: t}) {
    return {
        visitor: {
            BinaryExpression(path) {
                if (path.node.operator === '*') {
                    path.replaceWith(
                        t.binaryExpression('**', path.node.left, t.NumericLiteral(2))
                      );
                }
            }
        }
    }
}
```
输出内容(webpack打包之后)：
```
eval("function square(n) {\n  return Math.pow(n, 2);\n}\n\n//# sourceURL=webpack:///./index.js?");
```
通常情况下，一个babels是一个接受babel实例的函数，types是@babel/core包中的内容，在插件的编写过程中非常常用，故而此处使用解构赋值，以后使用命名的t变量指代types。插件的功能是遍历语法树，进入每一个二元表达式，当二元表达式的操作符是‘*’时，将其替换为一个新的二元表达式'n ** 2'，此处babel自己还进行了转码，故而最终输出内容是Math.pow(n, 2)。完整代码附在文末仓库中。编写babel插件的大致流程就是：首先对你要转化或处理的目标代码进行ast分析，找出其中的关键节点和特征表达式；之后对要处理的节点进行对应的修改或删除等操作，查找api中对应的方法。

再来个例子，替换函数中的变量名，原函数如下：
```
function square(n) {
    return n * n;
}
```
插件内容：
```
module.exports = function({types: t}) {
    return {
        visitor: {
            FunctionDeclaration(path) {
                path.scope.rename("n", "x");
              }
        }
    }
}
```
输出内容：
```
eval("function square(x) {\n  return x * x;\n}\n\n//# sourceURL=webpack:///./index.js?");
```
可以看到，源码中函数变量n变成了x,事实上，在babel插件中也有作用域的概念，即scope，可以用来保存局部状态，具体api详见文档。babel的文档太过繁杂，学习成本较高，对于二次开发不太友好，要进行一些骚操作还是要小心谨慎，最好先从babel官方的一些插件的源码开始阅读学习。笔者后续也会带来一篇balei插件源码分析的文章。  
填坑文章：[plugin-proposal-optional-chaining源码分析](https://juejin.im/post/5d745e12e51d4562120491ef)
————————————————————————————————————  
参考文献：  
babel插件写法官方文档：https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md  
babel types api文档：https://www.babeljs.cn/docs/babel-types  
AST explorer官网：https://astexplorer.net/  
文中例子的代码仓库：https://github.com/dianluyuanli-wp/myBabel  