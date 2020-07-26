# 前言
最近在开发过程中遇到了需要diff文件内容或者大json的业务场景，发现了一个比较好用且经典的js库[diff](https://www.npmjs.com/package/diff)。这个库功能十分强大，不仅能够简洁地输出字符串结果，也能够输出规范化的结构方便二次开发。这里笔者针对这个库的文档进行文档翻译和简单的讲解，同时也会展示自己的测试demo。
## 库简介
`diff`是一个javascript 文本内容diff的实现库。它基于已发表论文中的算法[An O(ND) Difference Algorithm and its Variations" (Myers, 1986).](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927)
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
文中例子的线上演示地址[演示地址]()

* `JsDiff.diffWords(oldStr, newStr[, options])` 该方法比较两段文字，比较的维度是单词，忽略空格，返回一个由描述改变对象组成的列表，可选的配置属性`ignoreCase`: 同`diffChars`中一样，这里给出一个使用例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388d4274c11e5d?w=1115&h=349&f=png&s=24462)  

* `JsDiff.diffWordsWithSpace(oldStr, newStr[, options])` 该方法比较两段文字，比较的维度是单词，同上一个方法不同的是，它将比较空格的差异，返回一个由描述改变的对象组成的列表。这里给出一个例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17388eb9962e0424?w=1112&h=343&f=png&s=238)  

* `JsDiff.diffLines(oldStr, newStr[, options])` 比较两段文字，比较的维度是行。可选的配置项：  
`ignoreWhitespace`：设置为true时，将忽略开头和结尾处的空格，在`diffTrimmedLines`中也有这个配置。  
`newlineIsToken`: 设置为true时，将换行符看作是分隔符。这样就可以独立于行内容对换行结构进行更改，并将其视为独立的(原文:This allows for changes to the newline structure to occur independently of the line content and to be treated as such, 这一句是机翻的，感觉不大准确)。总得来说，这样使得`diffLines`的输出对人类阅读(相较于其他对计算机比较有好的输出)来说更为友好，更叫方便于比较差异。返回一个由描述改变的对象组成的列表。（这里返回的obj列表中，`count`表示这段内容的行数，下面的方法类似），接下来展示一个例子：  
![](https://user-gold-cdn.xitu.io/2020/7/26/1738900b7af058c6?w=1113&h=416&f=png&s=26994)  

* `sDiff.diffTrimmedLines(oldStr, newStr[, options])` 比较两段文字，比较的维度是行，忽略开头和结尾处的空格，返回一个由描述改变的对象组成的列表。实例截图：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17389035daaff7b1?w=1111&h=418&f=png&s=31169)  

* `JsDiff.diffSentences(oldStr, newStr[, options])` 比较两段文字，比较的维度是句子。返回一个由描述改变的对象组成的列表。实例截图：  
![](https://user-gold-cdn.xitu.io/2020/7/26/17389073a67959ec?w=1112&h=438&f=png&s=29346)  

* `JsDiff.diffCss(oldStr, newStr[, options])` 比较两段内容，基于css中的相关符号和语法。返回一个由描述改变的对象组成的列表。

* `JsDiff.diffJson(oldObj, newObj[, options])` 比较两个JSON对象，比较基于对象内部的key。这些key在json对象内的顺序，在比较时将不会影响结果。返回一个由描述改变的对象组成的列表。展示一个例子:  
![](https://user-gold-cdn.xitu.io/2020/7/26/1738911184274497?w=1132&h=862&f=png&s=51112)  
