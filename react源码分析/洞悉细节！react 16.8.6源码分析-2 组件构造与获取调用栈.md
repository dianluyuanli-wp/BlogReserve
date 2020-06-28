# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。
# 正文
在这一篇中，我们将聚焦react虚拟DOM实现的核心，`component`的定义。
1. component和PureComponent定义
```js
/**
 * Base class helpers for the updating state of a component.
 */
//  组件的构造函数
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  //  如果组件使用字符串的refs,我们将会指定一个不同的对象
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  //  初始化默认的更新器，真实的更新器将会在渲染器内注入
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

//  定义原型属性
Component.prototype.isReactComponent = {};

//  设置状态的子集，始终使用this去改变状态，需要把this.sate当成正常状态下不可变的
//  并不保证this.state会马上更新，先设置再取值可能返回的是老值
//  并不保证setState的调用是同步的，因为多个调用最终会被合并，你可以提供一个可选的回调，在setStates事实上完成之后调用
//  当一个函数传递给setState时，它将在未来的某个时间点被调用，并且使用最新的参数（state,props,context等）这心值可能跟this.xxx不一样
//  因为你的函数是在receiveProps之后，shouldComponentUpdate之前调用的，在这个新阶段，props和context并没有赋值给this
/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
Component.prototype.setState = function (partialState, callback) {
  //  void 0 === undefined 省字节，同时防止undefined被注入
  //  partialState需要是对象，函数或者null
  !(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null) ? invariant(false, 'setState(...): takes an object of state variables to update or a function which returns an object of state variables.') : void 0;
  //  进入队列状态更新
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

//  强制刷新，该方法只能在非DOM转化态的时候调用
//  在一些深层状态改变但是setState没有被调用的时候使用，该方法不会调用shouldComponentUpdate，但componentWillUpdate和componentDidUpdate会被调用

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
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

//  废弃的api,这些api只会在经典的类组件上存在，我们将会遗弃它们。我们并不会直接移除他们，而是定义getter,并抛错
/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
{
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };
  //  定义遗弃api的告警函数
  var defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        lowPriorityWarning$1(false, '%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);
        return undefined;
      }
    });
  };
  //  依次注入getter
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

//  假组件，原型是真组件的原型
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;

/**
 * Convenience component with default shallow equality check for sCU.
 */
//  一个方便的组件，默认浅相等校验，其实是构造函数
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  //  如果有字符串类型的ref,我们将在稍后指派一个不同的对象
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

//  关于原型和构造函数的相关内容可以参考https://blog.csdn.net/cc18868876837/article/details/81211729
//  纯粹的组件原型
var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
//  定义纯粹组件原型的构造函数
pureComponentPrototype.constructor = PureComponent;
// Avoid an extra prototype jump for these methods.
//  原型上再次注入Component的原型
_assign(pureComponentPrototype, Component.prototype);
//  标志位，判断是纯粹组件
pureComponentPrototype.isPureReactComponent = true;
```
这里定义了组件的构造函数`Component`,然后定义了一系列IDE原型方法，比如`setState`、`forceUpdate`等等，然后针对一些已经废弃的api,给`Component`的原型添加`get`方法，以便在用户调用的时候抛错。接下来定义了一个过渡组件`ComponentDummy`,其原型为`Component`的原型，其实例为`PureComponent`的原型  

2. createRet和组件调用堆栈
```js
// an immutable object with a single mutable value
//  一个不可变的对象，一个不可变的值

// 被封闭对象仍旧全等该对象本身
// 可以通过Object.isSealed来判断当前对象是否被封闭
// 不能为被封闭对象添加任何未知属性, 也不能为其已知属性添加访问者
// 可以修改已知的属性

//  https://www.jianshu.com/p/96220f921272
function createRef() {
  //  只有current一个属性
  var refObject = {
    current: null
  };
  {
    Object.seal(refObject);
  }
  return refObject;
}

/**
 * Keeps track of the current dispatcher.
 */
//  跟踪当前的分发者
var ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
//  跟踪react当前的所有者，指的是所有正在构造的组件的父组件
var ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

//  正则，匹配任意内容加正反斜杆
//  括号内的内容是分组 https://www.jianshu.com/p/f09508c14e65
//  match如果是全局匹配，返回的是所有的匹配项，如果不是返回的是匹配字符串，位置，原始输入，如果有分组，第二项是匹配的分组
var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
//  描述组件的引用位置
var describeComponentFrame = function (name, source, ownerName) {
  var sourceInfo = '';
  if (source) {
    var path = source.fileName;
    //  解析出文件名
    var fileName = path.replace(BEFORE_SLASH_RE, '');
    {
      // In DEV, include code for a common special case:
      // prefer "folder/index.js" instead of just "index.js".
      //  在开发环境下，如果文件名为index 输出带上一级路径的文件名
      if (/^index\./.test(fileName)) {
        //  解析出反斜杠前的文件名
        var match = path.match(BEFORE_SLASH_RE);
        if (match) {
          var pathBeforeSlash = match[1];
          if (pathBeforeSlash) {
            //  获得文件名前的文件夹的名字
            var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
            fileName = folderName + '/' + fileName;
          }
        }
      }
    }
    //  获取最近的文件夹名和文件名，拼上代码行数
    sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }

  return '\n    in ' + (name || 'Unknown') + sourceInfo;
};

var Resolved = 1;

//  细化解析惰性组件
function refineResolvedLazyComponent(lazyComponent) {
  //  如果已经resolved,返回结果
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
}

//  获取外层组件的名字
function getWrappedName(outerType, innerType, wrapperName) {
  var functionName = innerType.displayName || innerType.name || '';
  //  优先是outerType的displayName,否则是wrapperName和functionName的组合
  return outerType.displayName || (functionName !== '' ? wrapperName + '(' + functionName + ')' : wrapperName);
}
```
这里首先定义了`createRef`的实现，其次定义了`ReactCurrentDispatcher`，react16.8.3版本后新增的hooks系列api,其机制类似于`redux`中的dispatcher，这里的`ReactCurrentDispatcher`在后续hooks api的定义中也会用到。接下来是
`describeComponentFrame`方法，其核心是获得文件源的出处（主要是文件名和代码行数），接下来定义了获得组件父组件的组件名的方法`getWrappedName`  

3. 获取组件名称与react debug模式下当前组件调用堆栈详情
```js
//  获取组件名
function getComponentName(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    //  如果是根，文字节点或不存在的类型，返回null
    return null;
  }
  {
    //  如果type的tag是数字
    if (typeof type.tag === 'number') {
    //  告警：接收到了预料之外的对象，这可能是react内部的bug，请提issue
      warningWithoutStack$1(false, 'Received an unexpected object in getComponentName(). ' + 'This is likely a bug in React. Please file an issue.');
    }
  }
  //  如果是构造函数，看他的静态属性displayName或者name
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  //  如果是字符串直接返回
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    //  如果是react当前的节点,这些都是当初symbol定义的
    case REACT_CONCURRENT_MODE_TYPE:
      return 'ConcurrentMode';
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';
    //  如果是入口
    case REACT_PORTAL_TYPE:
      return 'Portal';
    //  如果是分析器
    case REACT_PROFILER_TYPE:
      return 'Profiler';
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';
    case REACT_SUSPENSE_TYPE:
      return 'Suspense';
  }
  //  如果type是对象
  if (typeof type === 'object') {
    //  按照$$typeof来判断
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return 'Context.Consumer';
      case REACT_PROVIDER_TYPE:
        return 'Context.Provider';
      //  如果是前向ref
      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef');
      //  如果是memo类型，递归调用自己
      case REACT_MEMO_TYPE:
        return getComponentName(type.type);
      //  如果是lazy类型
      case REACT_LAZY_TYPE:
        {
          var thenable = type;
          //  细化解析惰性组件
          var resolvedThenable = refineResolvedLazyComponent(thenable);
          if (resolvedThenable) {
            return getComponentName(resolvedThenable);
          }
        }
    }
  }
  //  最后返回null
  return null;
}

//  react正在debug的frame，可以理解为一个对象里面有一些方法可供调取当前组件的调用栈
var ReactDebugCurrentFrame = {};

//  当前正在验证的元素
var currentlyValidatingElement = null;

//  设置当前正在验证的元素
function setCurrentlyValidatingElement(element) {
  {
    currentlyValidatingElement = element;
  }
}

{
  //  堆栈的实现是通过当前的renderer注入的
  // Stack implementation injected by the current renderer.
  ReactDebugCurrentFrame.getCurrentStack = null;

  //  增加枚举的方法
  //  本质上是返回调用堆栈的附录
  ReactDebugCurrentFrame.getStackAddendum = function () {
    var stack = '';

    // Add an extra top frame while an element is being validated
    //  增加一个额外的顶层框架，如果当前有元素正在被验证
    if (currentlyValidatingElement) {
      //  获取元素的名字
      var name = getComponentName(currentlyValidatingElement.type);
      //  获取元素所有者
      var owner = currentlyValidatingElement._owner;
      //  获取源的目录位置
      stack += describeComponentFrame(name, currentlyValidatingElement._source, owner && getComponentName(owner.type));
    }

    // Delegate to the injected renderer-specific implementation
    //  转交给renderer中的特殊实现来获取堆栈
    //  如果getCurrentStack被复写，追加该方法提供的信息
    var impl = ReactDebugCurrentFrame.getCurrentStack;
    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}
```
`getComponentName`根据传入的react 元素（Element）的类型来获得组件的名称，通过判断type和type上的`$$typeof`的值来判断返回的结果。`$$typeof`是react Element内部定义的一个变量，负责记录元素的类型，后续的代码中会有提及。`setCurrentlyValidatingElement`将在后续的一些validate的方法中被反复调用，设置当前正在校验的元素，以便后续输出抛错时的调用栈。  

4. 内部控制构件的定义、react元素属性保留字与hasValidXXX方法
```js
//  react内部共享的控制构件
var ReactSharedInternals = {
  //  当前的分发者
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  //  当前的所有者
  ReactCurrentOwner: ReactCurrentOwner,
  //  Object.assign避免在UMD下被打包两次
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign: _assign
};

{
  _assign(ReactSharedInternals, {
    //  在生产环境不应该有
    // These should not be included in production.
    ReactDebugCurrentFrame: ReactDebugCurrentFrame,
    // Shim for React DOM 16.0.0 which still destructured (but not used) this.
    // TODO: remove in React 17.0.
    //  react树形钩子
    ReactComponentTreeHook: {}
  });
}

//  类似于不变性的警告，只有在条件不满足的时候才打印
/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

 // 首先赋值warningWithoutStack$1
var warning = warningWithoutStack$1;

//  本质上是带调用栈的warning方法
{
  //  第二个条件是格式化
  warning = function (condition, format) {
    if (condition) {
      return;
    }
    //  获取当前的调用序列
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum();
    // eslint-disable-next-line react-internal/warning-and-invariant-args

    //  拼装后面的参数
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    //  复用原来的warning方法，前面的内容照旧，后面的内容拼上调用序列的信息
    warningWithoutStack$1.apply(undefined, [false, format + '%s'].concat(args, [stack]));
  };
}

var warning$1 = warning;

//  定义hasOwnProperty方法
var hasOwnProperty = Object.prototype.hasOwnProperty;

//  属性保留字
var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

//  特殊的属性key展示告警
// void 0 就是undefined
var specialPropKeyWarningShown = void 0;
var specialPropRefWarningShown = void 0;

//  排除ref是warning的情况，判断是否存在ref
function hasValidRef(config) {
  {
    //  如果config有ref自有属性属性
    if (hasOwnProperty.call(config, 'ref')) {
      //  获取get方法
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      //  如果这个getter是warning的，返回false
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  //  否则根据是否undefined来判断
  return config.ref !== undefined;
}

//  是否具有可用属性
//  逻辑跟ref的很相似
function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

//  定义key属性的warning Getter
function defineKeyPropWarningGetter(props, displayName) {
  //  关于访问key的告警
  var warnAboutAccessingKey = function () {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;
      //  key不能作为参数获取，被react内部征用了
      //  key不能作为参数，尝试去获取它只会返回undefined，如果你想获取子组件上的这个值，你应该传另一个名字的属性
      warningWithoutStack$1(false, '%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName);
    }
  };
  //  这个函数定义为react warngin
  warnAboutAccessingKey.isReactWarning = true;
  //  给入参的key属性定义getter，避免外界访问
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

//  这部分内容跟key的非常类似
//  定义ref的获取方法
function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    if (!specialPropRefWarningShown) {
      specialPropRefWarningShown = true;
      warningWithoutStack$1(false, '%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName);
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}
```
接下来react内部定义了一个对象`ReactSharedInternals`，其内部包含了一些方法获取全局公用的一些方法，比如`ReactCurrentDispatcher`（hooks相关功能）等，接下来又定义了带有堆栈信息的warning方法，其实就是`getStackAddendum`的结果拼装`warningWithoutStack$1`。接下来通过一个常量定义了react Element（元素）属性的保留字：`key`,`ref`,`__self`和`__source`。接下来定义了验证是否有可用key或ref的方法。  

未完待续......


# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
下一篇：  
[洞悉细节！react 16.8.6源码分析-3 元素创建]()  