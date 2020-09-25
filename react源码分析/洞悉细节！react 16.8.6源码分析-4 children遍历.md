# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。

# 正文
## 子节点遍历
```js
/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */

 // 这个是个递归函数，来统计子节点数目，也会执行回调
 // 遍历所有子节点的接口实现
 // traverseContext这个上下文本质上就是一个存储处理结果的对象
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  //  获取children的类型
  var type = typeof children;
  //  如果类型为undifined或者布尔，children为null
  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  var invokeCallback = false;

  //  如果type为undefined、boolean、string、number、REACT_ELEMENT_TYPE、REACT_PORTAL_TYPE时，表示已经调用到底层元素，要调用回调
  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }
    }
  }

  if (invokeCallback) {
    //  使用上级传下来的上下文跑一下回调，同时计数，第三个参数，累加当前的组件名
    //  针对mapIntoWithKeyPrefixInternal，这个callback其实是mapSingleChildIntoContext
    callback(traverseContext, children,
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows.

    //  如果这是唯一的子元素，把这个名字当做包裹在数组里面的处理，是的子元素增加的时候保持名字不变
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    //  返回计数1
    return 1;
  }

  var child = void 0;
  //  往下传递的名字
  var nextName = void 0;
  //  当前子树下子元素的节点个数
  var subtreeCount = 0; // Count of children found in the current subtree.
  //  下一个名字的前缀，如果当前的名字是空串，设置为.,否则是当前的名字+分隔符：
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  //  数组的话继续递归
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      //  拼出下一个名字
      nextName = nextNamePrefix + getComponentKey(child, i);
      //  递归调用，获得当前子树下挂载的节点数
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    //  如果是迭代器的话也继续递归
    //  获取children的迭代器
    var iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      {
        // Warn about using Maps as children
        //  如果使用map当做子元素，报错
        if (iteratorFn === children.entries) {
          //  控制这个报错只出现一次
          !didWarnAboutMaps ? warning$1(false, 'Using Maps as children is unsupported and will likely yield ' + 'unexpected results. Convert it to a sequence/iterable of keyed ' + 'ReactElements instead.') : void 0;
          didWarnAboutMaps = true;
        }
      }

      //  获取迭代器的第一次结果
      var iterator = iteratorFn.call(children);
      var step = void 0;
      var ii = 0;
      //  while循环不停跑，迭代器不停跑
      while (!(step = iterator.next()).done) {
        //  获取下一个子元素
        child = step.value;
        //  获取下一层的名字
        nextName = nextNamePrefix + getComponentKey(child, ii++);
        //  继续跑递归
        subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
      }
    //  如果是不是REACT_ELEMENT_TYPE，REACT_PORTAL_TYPE类型的对象，就报错
    } else if (type === 'object') {
      var addendum = '';
      {
        //  如果想要渲染子元素的集合，需要使用数组，末尾追加调用堆栈
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead.' + ReactDebugCurrentFrame.getStackAddendum();
      }
      //  children强制转string
      var childrenString = '' + children;
      //  抛错
      invariant(false, 'Objects are not valid as a React child (found: %s).%s', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum);
    }
  }

  return subtreeCount;
}
```
这个函数的核心功能是根据提供的一个children,遍历其所有子节点，统计所有子节点的数目，同时根据节点的类型来判断是否执行回调，换句话来说，这个方法不是纯函数，是带有副作用的，后续的很多方法都有调用这个函数。注意这里的`traverseContext`实际上是外围上下文池中的一个上下文，在`getPooledTraverseContext`有详细的定义，其中的result变量就是用来存储最终的处理结果的.

## 与遍历子元素相关的方法
```js

//  遍历被指定为props.children的子元素，但是也可以通过属性指定
//  traverseAllChildren(this.props.children, ...) traverseAllChildren(this.props.leftPanelChildren, ...)
//  traverseContext是一个可选的参数，将在整个遍历过程中被传递，它可以用来存储状态或者回调函数能够用到的东西
/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */

 // 遍历所有子元素 返回所有子元素的计数
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }
  //  第二个参数是当前的名字， 第三个参数是‘mapSingleChildIntoContext’里面有当前处理过的子元素的结果数组result,和回调函数
  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

//  生成用来标识一个集合中的元素的key
/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  //  在这里要做一些校验，因为我们调用的时候是处于黑箱中，我们想要确保不会屏蔽调未来ES标准的api

  //  如果component是对象，其不为null并且存在key,则返回
  if (typeof component === 'object' && component !== null && component.key != null) {
    // Explicit key
    //  生成转义后的key，$开头
    return escape(component.key);
  }
  // Implicit key determined by the index in the set
  //  否则使用集合中的index来生成key
  return index.toString(36);
}

//  对单个子元素进行处理
//  读取bookKeeping中的数据来调用函数
function forEachSingleChild(bookKeeping, child, name) {
  var func = bookKeeping.func,
      context = bookKeeping.context;

  func.call(context, child, bookKeeping.count++);
}

//  遍历被指定为props.children的子元素,提供的forEachFunc将会被每个叶子节点调用
/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenforeach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  //  获取当前要遍历的上下文
  var traverseContext = getPooledTraverseContext(null, null, forEachFunc, forEachContext);
  //  返回的计数貌似没有用到
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  //  释放用到的上下文
  releaseTraverseContext(traverseContext);
}
```
这里定义了一些与遍历children相关的方法，如单个元素的回调调用，元素所有子节点的回调调用等等。

## 由子节点遍历拼装而来的方法（子树扁平化）
```js
//  把单个子元素映射到上下文中 这也是个递归 bookkeeping其实就是个上下文的实例
//  其实就是给上下文对象的result中插入处理后的子元素
function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;

  //  获取处理过后的子元素，绑定上下文调用func,计数加1
  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    //  如果是子元素的数组，使用key和固定前缀映射
    //  这里本质上还是递归，mapIntoWithKeyPrefixInternal里面会调用mapSingleChildIntoContext
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, function (c) {
      return c;
    });
  } else if (mappedChild != null) {
    //  如果是单元素
    if (isValidElement(mappedChild)) {
      //  获取映射过后的元素，其实是使用的克隆方法
      mappedChild = cloneAndReplaceKey(mappedChild,
      //如果新key和老key不一样，则二者都保留，因为traverseAllChildren这个方法通常把对象视为子元素
      // Keep both the (mapped) and old keys if they differ, just as
      // traverseAllChildren used to do for objects as children
      //  如果映射后的子元素有key,且原来元素的key不与之相同，则给mapped.key添加一个/,再拼接子元素的key
      keyPrefix + (mappedChild.key && (!child || child.key !== mappedChild.key) ? escapeUserProvidedKey(mappedChild.key) + '/' : '') + childKey);
    }
    //  处理后的子元素推到result里面
    result.push(mappedChild);
  }
}

//  对所有子元素进行遍历，使用一个特定的prefix
function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  //  给所有/加一个/号
  if (prefix != null) {
    //  把所有前缀都增加一个/,同时在尾巴上加一个/
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  //  加载当前的一个context 返回的context的result参数就是送进去的array
  var traverseContext = getPooledTraverseContext(array, escapedPrefix, func, context);
  //  第二个参数是个函数，把处理后的元素推到traverseContext的result里面
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  releaseTraverseContext(traverseContext);
}

//  映射所有被标识为props.children的元素
//  每个叶子元素都会被mapFunction所调用
/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenmap
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
//  从头开始遍历，前缀是初始的空字符串
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }
  //  result貌似都到context里面去了，通过回调调用，没有显示使用
  var result = [];
  //  第三个null,对应空字符串的前缀， result埋到context里面去了,context是最后调用函数时候的上下文
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

//  计算被标识为props.children的节点的数目
/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrencount
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */

 // 统计子元素数目
function countChildren(children) {
  //  遍历函数，callback啥也没干，上下文是null
  return traverseAllChildren(children, function () {
    return null;
  }, null);
}

//  拍平子元素对象，返回一个有合适key的子元素组成的数组
/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrentoarray
 */
//  获得扁平化的子元素数组
function toArray(children) {
  var result = [];
  //  最后的回调是原封不动丢回来
  mapIntoWithKeyPrefixInternal(children, result, null, function (child) {
    return child;
  });
  return result;
}
```
这一部分里提供了一些有趣的方法，他们大多通过`traverseAllChildren`对某个节点的所有的子元素进行遍历，要么获得map处理过后的结果数组(`mapChildren`),要么获得拍平过后的节点数组(`toArray`),要么统计所有子节点的数目(`countChildren`),使用特定前缀进行map(`mapIntoWithKeyPrefixInternal`),或者是给已经处理好的上下文追加新的处理结果(`mapSingleChildIntoContext`)

## createContext
```js

//  返回集合的第一个元素并且验证该集合是否只有一个元素
//  当前的实现是假设子元素外层是没有包裹的，但这个函数的目的是抽象出子元素的实际结构
/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenonly
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
function onlyChild(children) {
  !isValidElement(children) ? invariant(false, 'React.Children.only expected to receive a single React element child.') : void 0;
  return children;
}

//  context的构造函数
function createContext(defaultValue, calculateChangedBits) {
  //  如果calculateChangedBits是undefined，设置为null
  if (calculateChangedBits === undefined) {
    calculateChangedBits = null;
  } else {
    {
      //  可选的第二个参数是函数，如果不是函数或者null的话报错
      !(calculateChangedBits === null || typeof calculateChangedBits === 'function') ? warningWithoutStack$1(false, 'createContext: Expected the optional second argument to be a ' + 'function. Instead received: %s', calculateChangedBits) : void 0;
    }
  }

  var context = {
    //  定义类型
    $$typeof: REACT_CONTEXT_TYPE,
    _calculateChangedBits: calculateChangedBits,
    //  为了支持多个并行的渲染器，我们把他们分为一级渲染器和二级渲染器，我们只允许同时
    //  存在两个渲染器：react native是一级渲染器，fabric是二级渲染器，或者react DOM(一级渲染器)和react art（二级渲染器）
    //  二级渲染器会在一个分开的域存储他们的上下文
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    //  以前为了追踪这个上下文有多少个并行的渲染器，有这个变量（就像并行的服务器渲染）
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    //  这两个变量是循环引用的
    Provider: null,
    Consumer: null
  };

  context.Provider = {
    //  定义类型
    $$typeof: REACT_PROVIDER_TYPE,
    //  搞了个循环引用，指向自己
    _context: context
  };

  //  已经警告使用了嵌套的上下文消费者
  var hasWarnedAboutUsingNestedContextConsumers = false;
  //  已经警告了使用消费者和提供者
  var hasWarnedAboutUsingConsumerProvider = false;

  {
    //  一个分开的对象，但是代理到原来的上下文对象为了向下兼容。它有不同的$$typeof，所以我们能够针对上下文做消费者时的错误使用告警
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    var Consumer = {
      //  设置类型
      $$typeof: REACT_CONTEXT_TYPE,
      //  循环引用上下文
      _context: context,
      _calculateChangedBits: context._calculateChangedBits
    };
    //  Flow抱怨没有设置值，因为这是在内部的
    // $FlowFixMe: Flow complains about not setting a value, which is intentional here
    Object.defineProperties(Consumer, {
      //  给consumer设置getter和setter
      Provider: {
        get: function () {
          //  不能调用Consumer.Provider，否则将报警告，该错误只会报一次
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;
            //  启用带调用栈的warning
            warning$1(false, 'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Provider> instead?');
          }
          //  返回Provider
          return context.Provider;
        },
        set: function (_Provider) {
          context.Provider = _Provider;
        }
      },
      //  获取当前值
      _currentValue: {
        get: function () {
          return context._currentValue;
        },
        set: function (_currentValue) {
          context._currentValue = _currentValue;
        }
      },
      _currentValue2: {
        get: function () {
          return context._currentValue2;
        },
        set: function (_currentValue2) {
          context._currentValue2 = _currentValue2;
        }
      },
      _threadCount: {
        get: function () {
          return context._threadCount;
        },
        set: function (_threadCount) {
          context._threadCount = _threadCount;
        }
      },
      Consumer: {
        get: function () {
          //  不建议嵌套两层consumer，否则抛warning
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;
            warning$1(false, 'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Consumer> instead?');
          }
          return context.Consumer;
        }
      }
    });
    //  Flow抱怨丢失了属性因为他没有理解defineProperty
    // $FlowFixMe: Flow complains about missing properties because it doesn't understand defineProperty
    context.Consumer = Consumer;
  }
  //  设置默认渲染器
  {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}
```
从这里开始进入大家比较熟悉的api环节，`onlyChild`和`createContext`都是大家比较熟悉的react API,详细的实现细节大家可以自行观察。context内部引入了渲染器的概念。

# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥当之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
上一篇：  
[洞悉细节！react 16.8.6源码分析-3 元素创建]()  
下一篇：  
[洞悉细节！react 16.8.6源码分析-5 hooks API]()  