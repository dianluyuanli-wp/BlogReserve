# 前言
最近在开发过程中遇到了需要diff文件内容或者大json的业务场景，发现了一个比较好用且经典的js库[diff](https://www.npmjs.com/package/diff)。这个库功能十分强大，不仅能够简洁地输出字符串结果，也能够输出规范化的数据结构方便二次开发。这里笔者针对这个库的文档进行翻译和简单的讲解，同时也会展示自己的测试demo。
## 库简介
`diff`是一个基于javascript实现的文本内容diff的库。它基于已发表论文中的算法[An O(ND) Difference Algorithm and its Variations" (Myers, 1986).](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927)
## 安装
```
npm install diff --save
```

## 引用
```js
//  不支持import 语法，也就是module引入
const jsDiff = require('diff');
```
## API
* `JsDiff.diffChars(oldStr, newStr[, options])` 这个方法将比较两段文字，比较的维度是基于单个字符  
返回一个由描述改变的对象组成的列表。大致如下：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388c99fc6129ed?w=319&h=313&f=png&s=17360)  
`added`表示是否是添加内容，`removed`表示是否为删除内容。共有的内容这两个属性都没有，`value`表示内容，`count`表示字符的个数（在某些用法中表示内容的行数）
可选的配置属性`ignoreCase`: 标记为true时忽略字符的大小写，默认为false，这里给出一个测试例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388cdfc9cdd02d?w=1121&h=335&f=png&s=24841)  
文中例子的线上演示地址[演示地址](http://tangshisanbaishou.xyz/diff/index.html)

* `JsDiff.diffWords(oldStr, newStr[, options])` 该方法比较两段文字，比较的维度是单词，忽略空格，返回一个由描述改变对象组成的列表，可选的配置属性`ignoreCase`: 同`diffChars`中一样，这里给出一个使用例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388d4274c11e5d?w=1115&h=349&f=png&s=24462)  

* `JsDiff.diffWordsWithSpace(oldStr, newStr[, options])` 该方法比较两段文字，比较的维度是单词，同上一个方法不同的是，它将比较空格的差异，返回一个由描述改变的对象组成的列表。这里给出一个例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388eb9962e0424?w=1112&h=343&f=png&s=238)  

* `JsDiff.diffLines(oldStr, newStr[, options])` 比较两段文字，比较的维度是行。可选的配置项：  
`ignoreWhitespace`：设置为true时，将忽略开头和结尾处的空格，在`diffTrimmedLines`中也有这个配置。  
`newlineIsToken`: 设置为true时，将换行符看作是分隔符。这样就可以独立于行内容对换行结构进行更改，并将其视为独立的(原文:This allows for changes to the newline structure to occur independently of the line content and to be treated as such, 这一句是机翻的，感觉不大准确)。总得来说，这样使得`diffLines`的输出对人类阅读(相较于其他对计算机更为友好的输出方式)更为友好，更加方便于比较差异。返回一个由描述改变的对象组成的列表。（这里返回的obj列表中，`count`表示这段内容的行数，下面的方法类似），接下来展示一个例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/1738900b7af058c6?w=1113&h=416&f=png&s=26994)  

* `sDiff.diffTrimmedLines(oldStr, newStr[, options])` 比较两段文字，比较的维度是行，忽略开头和结尾处的空格，返回一个由描述改变的对象组成的列表。实例截图：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17389035daaff7b1?w=1111&h=418&f=png&s=31169)  

* `JsDiff.diffSentences(oldStr, newStr[, options])` 比较两段文字，比较的维度是句子。返回一个由描述改变的对象组成的列表。实例截图：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17389073a67959ec?w=1112&h=438&f=png&s=29346)  

* `JsDiff.diffCss(oldStr, newStr[, options])` 比较两段内容，比较基于css中的相关符号和语法。返回一个由描述改变的对象组成的列表。

* `JsDiff.diffJson(oldObj, newObj[, options])` 比较两个JSON对象，比较基于对象内部的key。这些key在json对象内的顺序，在比较时将不会影响结果。返回一个由描述改变的对象组成的列表。展示一个例子:  
![](https://user-gold-cdn.xitu.io/2020/7/26/1738911184274497?w=1132&h=862&f=png&s=51112)  

* `JsDiff.diffArrays(oldArr, newArr[, options])` 比较两个数组，每一个元素使用严格等于来判定(`===`)。可选参数：`comparator`: function(left, right)用来进行相等性的比较，返回一个由描述改变的对象组成的列表。  

* `JsDiff.createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader)` -创造一个统一的diff补丁输出。参数：  
    * `oldFileName`: 移除内容在文件名部分输出的字符串  
    * `newFileName`: 增添内容在文件名部分输出的字符串  
    * `oldStr`: 原始的字符串(作为基准) 
    * `newStr`: 比较内容的字符串  
    * `oldHeader`: 在老文件头部新增的信息  
    * `newHeader`: 在新文件头部新增的信息
    * `options`: 一个描述配置的对象，目前仅支持`context`,用来描述应该展示context的多少行  
这里展示一个例子：  
![](https://user-gold-cdn.xitu.io/2020/7/27/1738dff85f2eb629?w=1768&h=520&f=png&s=40346)  
这里可以看到，该方法返回的是已经格式化的可直接输出的字符串，方便直接展示。  

* `JsDiff.createPatch(fileName, oldStr, newStr, oldHeader, newHeader)` -创造一个统一的diff补丁输出,该方法的使用和`JsDiff.createTwoFilesPatch`几乎一致，唯一的区别是`oldFileName`等于`newFileName`  

* `JsDiff.structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options)` 返回一个由描述具体变化的对象构成的数组。这个方法类似于`createTwoFilesPatch`,但是返回了一个适合于开发者后续处理的数据结构。其参数跟`createTwoFilesPatch`保持一致，返回的数据类似于如下：  
![](https://user-gold-cdn.xitu.io/2020/7/27/1738e09c2b18a1e0?w=721&h=403&f=png&s=36583)  
与之对应的应用实例如下：  
![](https://user-gold-cdn.xitu.io/2020/7/27/1738e0a82154e1d3?w=1058&h=455&f=png&s=31154)  

* `JsDiff.applyPatch(source, patch[, options])` 使用一个统一的diff补丁。该方法会返回一个应用了补丁的新版本字符串。这里的补丁（patch）可能是字符串形式的diff或者`parsePatch`和`structuredPatch`方法返回的输出。可选的配置项有如下：  
    * `fuzzFactor`: 拒绝应用补丁之前允许比较的内容的行数。默认是0  
    * `compareLine(lineNumber, line, operation, patchContent)` 用来比较给定的行内容在应用补丁时是否应该被认定为相等。默认是使用严格相等来比较的，但是这容易与fuzzier比较相冲突。当内容应该被拒绝时返回false。

* `JsDiff.applyPatches(patch, options)` 应用一个或者多个补丁。这个方法将会迭代补丁的内容并且将其应用在回调中传入的内容上。每个补丁被使用的整体工作流程是：  
    * `options.loadFile(index, callback)` 调用者应该加载文件的内容并且将其传递给回调（`callback(err, data)`）。传入一个`err`将会中断未来补丁的执行
    * `options.patched(index, content, callback)` 该方法在每个补丁被使用时调用。传入一个`err`将会中断未来补丁的执行

* `JsDiff.parsePatch(diffStr)` 将一个补丁解析为结构化数据。返回一个由补丁解析而来的JSON对象，该方法适合同`applyPatch`配合使用。该方法返回的内容同`JsDiff.structuredPatch`返回的内容结构上一致。

* `convertChangesToXML(changes)` 转换一个changes的列表到序列化的XML格式  

以上的所有可以接受一个可选的回调的方法，在该参数(callback)被省略时该方法工作在同步模式，当这个参数被传入时工作在异步模式。这使得能够处理更大的范围diff而不会使得事件流被长期挂起。callback要么作为最后一个参数被直接传入要么作为`options`中的一个属性被传入。

## Change Objects
上面的许多方法都会返回change对象（前文翻译成描述改变的对象），这些对象通常包含以下的属性：  
* `value`: 文本内容  
* `added`: 如果是文本被插入新内容的话，该值为true  
* `removed`: 如果是文本被移除内容的话，该值为true  

## 使用小结
上述的内容主要是基于官方的文档。这里结合笔者的实战经验来说说使用的细节。`JsDiff`的方法绝大多数的入参都是字符串（除了`JsDiff.diffJson`,`JsDiff.diffArrays`等少数几个api）。用于比较字符，单词，句子或者文本文件时，需要将以上内容都转换成字符串，句子或者文本文件默认使用`\n`作为分隔符。输出通常是描述变化的对象组成的Array,方便二次开发，如果只是想简单输出文件之间的diff,可以直接使用`JsDiff.createTwoFilesPatch`支持输出格式化的内容，不用额外处理。关于二次开发输出满足需求的样式，这里给一个简单的例子：
```js
import React from 'react';
const jsDiff = require('diff');
import s from './index.css';
import cx from 'classnames';

const str1 = 'guanlanluditie';
const str2 = 'smartguanlanluditie';
const diffArr = jsDiff.diffChars(str1, str2);

const charColorMap = {
    'add': s.charAdd,
    'removed': s.charRemoved,
}

export default class Text extends React.Component {
    render() {
        return <div className={s.result}>
            比较结果: 
            {diffArr.map((item, index) => {
                const { value, added, removed } = item;
                const type = added ? 'add' : (removed ? 'removed' : '')
                return <span key={index} className={cx(charColorMap[type], s.charPreWrap)}>{value}</span>
                })
            }
        </div>
    }
}
```
关于使用`diff`库实现类似于`github`的文件diff效果，可以参考笔者的一个仓库,也就是上文中的演示代码，[仓库地址](https://github.com/dianluyuanli-wp/jsDiffWeb),具体的实现思路后续会出一篇文详述，稍候。

# 参考资料与相关链接
[diff库官方文档](https://www.npmjs.com/package/diff)  
[演示站点](http://tangshisanbaishou.xyz/diff/index.html)  
[演示站点代码仓库](https://github.com/dianluyuanli-wp/jsDiffWeb)  
