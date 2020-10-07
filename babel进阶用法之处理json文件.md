# 前言
社区里面关于`babel`的介绍非常多了，这里不想重复这些常见内容。很多人认为`babel`只是一个语法转译工具，将浏览器无法识别的高级语法进行转换（polyfill）,提升开发体验。其实babel是一个强大的工具链，它基于`acorn`和`acorn-jsx`，将js转化为抽象语法树（AST）,抽象语法树可以理解为一个大的对象，精细化定义了代码的所有细节。对这个大对象进行处理后，再将其转化为代码，这其实就是各种各样的babel插件代码转换的核心原理。本文也是从这里入手，以一个小例子，展示babel在处理json文件中的进阶应用。
# 应用场景
假设有一个跟配置相关的大json文件，里面有各种各样的key,我们需要能够使用代码来动态修改这个大json中的内容，比如替换某个key的内容，删除某个key,新增内容等等。这里有人可能会说了，直接使用node中的`fs`读取文件并修改不可以吗？比较简单的文件的确可以这样操作，但是如果json结构比较复杂，比如有很多层级或者不同层级有相同的key,直接使用字符串进行匹配和搜索将变得非常繁琐，并且非常容易出错。这里我们借用`babel`的能力将json解析成抽象语法树，在进行对应的调整。
# 核心原理
读者可能会有疑问，`babel`只能处理js模块，如何处理json文件呢？json文件本身可以看做一个json对象，而babel内部显然是具有处理对象的能力的，为此我们只需要通过代码将json改写成js文件，将其传入babel转化成抽象语法树,对特定的部分进行修改之后，再转换回js代码。把js代码中的json对象导出，生成目标json文件。
## 代码实现
这里举一个简单的例子，假设有如下的json内容(origin.json)：
```json
{
    "name": "wang",
    "ppp": 123
}
```
我们的目标是删除到`ppp`这条属性，并增加一个新的属性。直接上代码：
```js
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
//  原始json
const UPLOAD_DIR = path.resolve(__dirname, "origin.json"); // 大文件存储目录

//  通过babel插件，写入新的文件
const oldContent = fs.readFileSync(UPLOAD_DIR);
//  强行转换成js文件
const addContent = 'let b=' + oldContent + ';exports.b = b;';
//  通过babel处理替换，替换内容
const newContent = babel.transformSync(addContent, {
    plugins: ['./progressJson/plugin']
}).code;
//  生成中介文件
fs.writeFileSync('progressJson/relayFile.js', newContent, 'utf8');

function writeFinalFile() {
    const trueInfo = require('./relayFile.js').b;
    //  生成最终的结果
    fs.writeFileSync('progressJson/result.json', JSON.stringify(trueInfo), 'utf8');
}

writeFinalFile();
```
这里讲解下，首先用`fs`模块读取原始json的内容（以字符串的形式），然后开启黑科技，在头尾拼接特殊字符串，使其转变为js文件的字符串形式，传入`babel.transformSync`,引入我们的插件，进行处理之后，生成代码字符串。然后使用`fs.writeFileSync`将生成的字符串写成文件。最后再引用该文件，读取json变量，对其stringfy获得最终的内容，在将内容写入最后的文件`result.json`。核心逻辑都在我们的babel插件中。
## 替换属性的babel插件
直接上代码：
```js
//  要小心循环引用，超过迭代次数还没有出来就会自动停止，而且不会报错
module.exports = function (babel) {
    const { types: t } = babel;
    return {
        name: 'write in new content', // not required
        visitor: {
            //  捕捉对象属性
            //  t表示的是type,也就是各种属性，要对节点做操作，需要对path做处理，相关api在@babel/traverse里面，市面上几乎没有文档
            ObjectProperty(path) {
                //  遍历所有的对象属性
                const node = path.node;
                //  定位到key为ppp的对象属性
                if (node.key.value === 'ppp') {
                    //  插入节点
                    path.insertAfter(t.objectProperty(t.identifier('load'), t.nullLiteral()));
                    //  删除节点
                    path.remove();
                }
            }
        }
    };
};
```
关于babel插件的具体写法，笔者之前写过一篇[文章]()，里面有babel原理的详细分析，可以参考。这里再简单讲解下原理，。babel插件本质是一个函数，入参是babel的实例，返回值是一个对象，里面的`visitor`用来匹配目标内容，这里的
`ObjectProperty`表示遇到对象属性时进入执行逻辑，类似地，`FunctionDeclaration`表示遇到函数定义时进入操作逻辑，此外还有`BinaryExpression`(二元表达式)、`Identifier`(标识符)等等的visitor入口函数。babel将代码解析成抽象语法树之后，我们可以用上面提到的这些类型匹配函数来找到目标代码的位置，具体可以参考[@babel/types](https://www.babeljs.cn/docs/babel-types)。这里顺便吐槽下，官方的文档给的十分粗糙，只有非常含混的类型定义，也没有使用例子，全看个人领悟力，不参考其他babel插件的写法来配合理解根本不知道什么意思(参考一些官方插件的写法)，体验极差。`ObjectProperty`的入参是path,表示当前正在检查的节点的路径，可以配合AST生成工具来配合理解,在笔者的那篇[博文]()中有详解。`t.objectProperty`表示构造一个对象属性节点，其接受两个参数，第一个参数`t.identifier(load)`表示key为load,第二个参数`t.nullLiteral()`表示生成一个null。
# babel插件常用api
## path相关api
有关`path`相关的源码都在`@babel/traverse`这个目录下。想要查找到符合条件的节点并进行各种各样的操作，都要依赖这部分的api,官方文档基本等于没有，相关api的用法只有自己扒源码，源码中的api功能大致通过名字可以猜出来，大家可以先有个印象，以后有对应的需求再去查找具体用法。
### ancestry相关api
这一部分的api主要是查找当前节点的祖先节点和有关判断，具体使用规则只有看源码自行体会。
```js
//  从当前节点上溯，传入回调函数，通过函数来判断返回什么节点，从自己开始
exports.findParent = findParent;
//  从当前节点上溯，传入回调函数，通过函数来判断返回什么节点，从自己的父节点开始找
exports.find = find;
//  查找第一个函数式父组件
exports.getFunctionParent = getFunctionParent;
//  查找其声明的父组件（感觉指的是react中继承的父组件）
exports.getStatementParent = getStatementParent;
//  传入一个path,获取最上层的常规祖先节点
exports.getEarliestCommonAncestorFrom = getEarliestCommonAncestorFrom;
//  传入一个path,获取最底层的常规祖先节点
exports.getDeepestCommonAncestorFrom = getDeepestCommonAncestorFrom;
//  返回一个包含所有祖先的数组
exports.getAncestry = getAncestry;
//  传入一个节点，判断当前的节点是否是传入节点的祖先
exports.isAncestor = isAncestor;
//  传入一个节点，判断当前节点是否是出入节点的子节点
exports.isDescendant = isDescendant;
//  上溯，传入一个类型数组，判断所有节点中是否是数组中的类型
exports.inType = inType;
```
### comments相关api
这一部分的api主要是查找跟注释相关的节点
```js
//  和兄弟元素共享注释
exports.shareCommentsWithSiblings = shareCommentsWithSiblings;
//  添加单条注释
exports.addComment = addComment;
//  添加多行注释
exports.addComments = addComments;
```
### context相关api
主要是跟当前访问上下文相关的api
```js
//  调用一系列函数，返回布尔值
exports.call = call;
//  内部方法，配合call使用
exports._call = _call;
//  当前节点的类型是否在黑名单中
exports.isBlacklisted = isBlacklisted;
//  访问一个节点，返回布尔值，是否应该停止访问
exports.visit = visit;
//  标记跳过
exports.skip = skip;
//  置skipkey
exports.skipKey = skipKey;
//  停止
exports.stop = stop;
//  设置scope
exports.setScope = setScope;
//  设置上下文
exports.setContext = setContext;
exports.resync = resync;
exports._resyncParent = _resyncParent;
exports._resyncKey = _resyncKey;
exports._resyncList = _resyncList;
exports._resyncRemoved = _resyncRemoved;
exports.popContext = popContext;
exports.pushContext = pushContext;
exports.setup = setup;
exports.setKey = setKey;
exports.requeue = requeue;
exports._getQueueContexts = _getQueueContexts;
```
### conversion相关api
```js
exports.toComputedKey = toComputedKey;
exports.ensureBlock = ensureBlock;
exports.arrowFunctionToShadowed = arrowFunctionToShadowed;
exports.unwrapFunctionEnvironment = unwrapFunctionEnvironment;
exports.arrowFunctionToExpression = arrowFunctionToExpression;
```
