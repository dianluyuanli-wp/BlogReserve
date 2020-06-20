# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。
# 正文
react库的文件主要分为两个，分别是`react-dom.development.js`和`react.development.js`(这里选的是源码文件，而不是生产环境的min.js文件)，首先我们看看`npm`上关于`react-dom`的介绍：
```
This package serves as the entry point to the DOM and server renderers for React. It is intended to be paired with the generic React package, which is shipped as react to npm
```
简单翻译下：这个包的功能是作为DOM元素的入口和服务器端渲染器而为react开发的，它需要和react配合使用，它和react捆绑在一起，一同通过npm进行分发。简单来说`react-dom.js`主要是react中涉及到和真实DOM相关的部分（前后端渲染的渲染器等等），`react.js`则是react的核心源码,包括react元素（虚拟DOM）的创建，克隆等等逻辑。先给大家打个预防针，`react-dom.development.js`源码21429行，`react.development.js`源码大概2000行，柿子捡软的捏，我们从`react.development.js`开始，闲话少叙，直接进入源码部分。
## 代码分析
1. 类型定义
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
//  这些都是react内部的api,不清楚的可以官网去查
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
这里简单讲解下，`react.js`每部指引用了两个公共包，分别是`object-assign`和`prop-types/checkPropTypes`,`object-assign`主要是为了兼容IE浏览器，毕竟其他的主流绿色浏览器和`Node.js 4`以上环境都已经实现了原生的`Object.assign`api, `prop-types/checkPropTypes`则主要是为了实现属性校验。  
react针对内置的各个属性都优先使用`Symbol`来标识，确保唯一性，如果不支持，则使用一个4位16进制数字来降级处理。  

2. 获取迭代器、定义底层报错函数
```js
//  返回迭代器的函数
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }
  //  获取传入参数的iterator或者@@iterator
  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }
  return null;
}

//  使用invariant来判断入参的不变性
//  使用类似sprintf的格式来处理入参，相关信息会被移除，但是函数本身在生产环境会被保留
/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

 // 验证格式
var validateFormat = function () {};

{
  //  处理错误信息需要格式，没有格式的话抛错，格式可以李继伟一个字符串模板
  validateFormat = function (format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error = void 0;
    if (format === undefined) {
      //  如果没有格式，抛出非格式化的错误
      //  压缩后的代码有抛错发生，请使用非压缩的开发模式，以便获取完整的报错信息
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      //  replace方法会对每一个匹配项返回回调函数的返回值
      //  生成错误提示
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      //  报错的名字是不变性的破坏
      error.name = 'Invariant Violation';
    }
    //  我们并不care 报错函数本身的调用栈，位置置为1，frame这里可以理解为调用栈中的某一帧
    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}
```
这里定义了`getIteratorFn`，在后面需要用到递归和拍平操作的地方，都需要获取对象的迭代器函数，`invariant`本质上是一个抛错函数，根据传入的模板和对应的参数来依次替换模板中的`%s`，生成最终的报错字符串。  

3. 定义各种warning函数
```js
//  依靠对invariant的实现，我们可以保持格式和参数在web的构建中
// Relying on the `invariant()` implementation lets us
// preserve the format and params in the www builds.

/**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * Only change is we use console.warn instead of console.error,
 * and do nothing when 'console' is not supported.
 * This really simplifies the code.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

 // 低优先级的告警
var lowPriorityWarning = function () {};

//  这个括号为了封闭上下文，保持干净的命名空间?(哪位高人可以解答下，请留言)
//  大括号里面可以避免被覆盖？
{
  var printWarning = function (format) {
    //  复制入参数组
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    //  拼凑信息
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    //  如果有console的实现使用它
    if (typeof console !== 'undefined') {
      console.warn(message);
    }
    //  啥也没做
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      //  方便使用调用栈查询
      //  调试react用的
      throw new Error(message);
    } catch (x) {}
  };


  lowPriorityWarning = function (condition, format) {
    //  没有格式信息，抛错
    if (format === undefined) {
      throw new Error('`lowPriorityWarning(condition, format, ...args)` requires a warning ' + 'message argument');
    }
    if (!condition) {
      //  首先复制数组
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }
      //  传入格式和参数
      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

var lowPriorityWarning$1 = lowPriorityWarning;

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

 // 无调用栈的警告
var warningWithoutStack = function () {};

{
  warningWithoutStack = function (condition, format) {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    if (format === undefined) {
      //  没有格式直接报错
      throw new Error('`warningWithoutStack(condition, format, ...args)` requires a warning ' + 'message argument');
    }
    if (args.length > 8) {
      // Check before the condition to catch violations early.
      throw new Error('warningWithoutStack() currently supports at most 8 arguments.');
    }
    //  如果true直接忽略
    if (condition) {
      return;
    }
    if (typeof console !== 'undefined') {
      //  将所有入参转换成字符串
      var argsWithFormat = args.map(function (item) {
        return '' + item;
      });
      //  添加warning头
      argsWithFormat.unshift('Warning: ' + format);

      // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610
      //  不直接调用call,因为在ie9下会报错
      //  手动抛出warning
      //  console方法会自动替换%s, 使用添加的后续参数
      //  这个用法看不懂的，看看这篇https://www.cnblogs.com/web-record/p/10477778.html
      Function.prototype.apply.call(console.error, console, argsWithFormat);
    }
    try {
      //  这里是给react调试的地方，正常情况下是不会有作用的
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });

      //  手动抛出错误
      throw new Error(message);
    } catch (x) {}
  };
}

//  warning函数的副本
var warningWithoutStack$1 = warningWithoutStack;

//  未挂载组件的警告状态的是否更新
//  一个map,key是组件内部方法的名字
var didWarnStateUpdateForUnmountedComponent = {};

//  no-op的警告 no-operate
function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    //  获取组件的名字
    var componentName = _constructor && (_constructor.displayName || _constructor.name) || 'ReactClass';
    //  告警的key
    var warningKey = componentName + '.' + callerName;
    //  是否更新过
    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }
    //  调用抛出错误的方法，同时登记，避免二次触发
    //  不能在一个未挂载的组件上调用某个方法，这个是无意义的操作,
    //  但是这会触发你应用中的bug,为此你可以在组件中直接指向this.state或者定义state对象,在某个组件中带有所需状态的类属性。
    warningWithoutStack$1(false, "Can't call %s on a component that is not yet mounted. " + 'This is a no-op, but it might indicate a bug in your application. ' + 'Instead, assign to `this.state` directly or define a `state = {};` ' + 'class property with the desired state in the %s component.', callerName, componentName);
    didWarnStateUpdateForUnmountedComponent[warningKey] = true;
  }
}
```
这里首先定义了最底层的打印warning的方法`printWarning`,同样是根据format输出报错信息，然后通过它来拼装出`lowPriorityWarning`,稍后定义了`warningWithoutStack`,这其中进行了一些参数校验，其本质上是一个调用`console.error`的方法，不过为了避免变量被注入导致bug,使用了一些骚操作来规避bug（这种级别的公共库，一般都会有类似的操作），接下来是`warnNoop`，这里通过`didWarnStateUpdateForUnmountedComponent`来记录告警的结果，避免重复告警。  

4. 更新no-op队列的抽象api
```js

/**
 * This is the abstract API for an update queue.
 */
//  更新no-op队列的抽象api，no-operate的队列
var ReactNoopUpdateQueue = {
  //  检查这个复合组件是否挂载
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  //  入参是组件实例
  isMounted: function (publicInstance) {
    return false;
  },

  //  强制刷新，前提是不能在dom 变更的过程中更新

  //  你可能会想在某些无法使用setState更新状态的情况下强制刷新状态，
  //  forceUpdate无法触发shouldComponentUpdate，但是会触发componentWillUpdate和componentDidUpdate
  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  //  队列空调用的警告
  enqueueForceUpdate: function (publicInstance, callback, callerName) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  //  更新所有的状态，始终使用这个或者setState来改变状态，应该把this.state当作不可变的
  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
    warnNoop(publicInstance, 'replaceState');
  },

  //  设置状态的子集，这个提供merge策略，不支持深度复制，下一阶段：暴露pendingState或者在合并阶段不使用
  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} Name of the calling function in the public API.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    warnNoop(publicInstance, 'setState');
  }
};

//  定义空对象
var emptyObject = {};
//  冻起来
{
  Object.freeze(emptyObject);
}

```
这里定义了react组件更新队列的抽象api, 首先定义了`ReactNoopUpdateQueue`这个实例对象，其内部有`isMounted`,`enqueueForceUpdate`等方法，这里的主要目的是给出方法的定义。  

未完待续......

# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥当之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
下一篇：  
[施工中](https://www.webpackjs.com/api/loaders/)  
