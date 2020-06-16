# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。
# 正文
react库的文件主要分为两个，分别是`react-dom.development.js`和`react.development.js`(这里选的是源码文件，而不是生产环境的min.js文件)，首先我们看看`npm`上关于`react-dom`的介绍：
```
This package serves as the entry point to the DOM and server renderers for React. It is intended to be paired with the generic React package, which is shipped as react to npm
```
简单翻译下：这个包的功能是作为DOM元素的入口和服务器端渲染器而为react开发的，它需要和react配合使用，它和react捆绑在一起，一同通过npm进行分发。简单来说`react-dom.js`主要是react中涉及到和真实DOM相关的部分（前后端渲染的渲染器等等），`react.js`则是react的核心源码,包括react元素（虚拟DOM）的创建，克隆等等逻辑。先给大家打个预防针，`react-dom.development.js`源码21429行，`react.development.js`源码大概2000行，柿子捡软的捏，我们从`react.development.js`开始，闲话少叙，直接进入源码部分。
## 代码分析
```js
/** @license React v16.8.6
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';



if (process.env.NODE_ENV !== "production") {
  (function() {
'use strict';

var _assign = require('object-assign');
var checkPropTypes = require('prop-types/checkPropTypes');

// TODO: this is special because it gets imported during build.

var ReactVersion = '16.8.6';

//  使用Symbol来标记类似react的属性，如果没有原生的Symbol或腻子语法，使用一个数字来标记
// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;

//  Symbol.for 以字符串为key,创建symbol,如果以前有，使用以前的，否则新建一个
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace;

var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
//  懒加载标记
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;

//  定义symbol,如果不支持的话会用兜底方案

//  返回symbol的迭代器
var MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
//  属性的key
//  要成为可迭代对象，一个对象必须实现@@iterator方法，这意味着对象 必须有一个键为@@iterator属性，可通过常量Symbol.iterator访问该属性
//  https://www.cnblogs.com/pengsn/p/12892954.html
var FAUX_ITERATOR_SYMBOL = '@@iterator';
```