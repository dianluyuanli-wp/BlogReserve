# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。

# 正文
1. reactElement的构造函数
```js
//  定义一个创建react 元素的构造函数，这跟class模式的组建不一样，请不要使用new来调用，所有instanceof来检查是失效的，不要使用要用Symbol.for('react.element')，而要用$$typeof来检查，
//  来判断是否是react组件

//  self是一个暂时的变量，是用来判断当React.createElement被调用的时候this和owner是否一致，以便我们告警。我们打算摆脱owner这个概念并且
//  使用箭头函数，只要这个二者一致，组件就没有变化
//  source是一个注释对象（被转译器或者其他文件名，行数，等信息所添加）
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, no instanceof check
 * will work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @param {*} owner
 * @param {*} props
 * @internal
 */

 // react元素构造函数
 // 返回的其实是element对象
var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    //  通过这个标签来识别react的元素
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    //  属于这个元素的内建属性
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    //  记录创建这个组件的组件
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    //  这个验证标志是可变的，我们把这个放在外部支持存储，以便我们能够冻结整个对象，
    //  这个可以被若映射替代，一旦在开发环境下实现了

    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // 为了更加方便地进行测试，我们设置了一个不可枚举的验证标志位，以便测试框架忽略它
    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    //  给_store设置validated属性false
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    });
    //  self和source都是开发环境才存在的

    // self and source are DEV only properties.
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    });
    //  两个再不同地方创建的元素从测试的角度来看是相等的，我们在列举的时候忽略他们

    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });
    //  如果Object有freeze的实现，我们冻结元素和它的属性
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
```
这里首先引出`ReactElement`的构造函数，注意react内部是使用`$$typeof`来判断react 元素的类型的。使用`_store`来记录内部的状态，后面会有用到。为了方便测试框架，`_store`中定义了不可配置不可枚举的validated属性。类似的，框架内部定义了self和source的副本`_self`和`_source`，他们都是不可配置不可枚举不可写的。

2. 创建一个给定类型的ReactElement
```js
//  创建并返回指定类型的reactElement
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */
function createElement(type, config, children) {
  //  属性名 void 0就是undefined
  var propName = void 0;

  // Reserved names are extracted

  //  被保护的名字被屏蔽
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  //  根据confi的内容来初始化
  if (config != null) {
    //  如果有可用的ref,将其赋值给ref变量
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    //  如果有可用的key,将其赋值给key
    if (hasValidKey(config)) {
      key = '' + config.key;
    }
    //  再给self赋值
    self = config.__self === undefined ? null : config.__self;
    //  给source赋值
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    for (propName in config) {
       // 如果不是保留字的话就复制属性 
       if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  //  子元素会有不止一个，这些将会通过一个属性对象向下传递

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  //  复制子元素
  //  给props属性添加children属性
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    {
      //  冻结子元素列表
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  //  解析默认属性，如果type上存在默认属性
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    //  如果没有属性值，采用type类型默认属性上的默认值
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  {
    if (key || ref) {
      //  这里的type估计是个构造函数对象
      //  如果type是个构造函数
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;
      if (key) {
        //  避免保护参数被错误取到，提供警告
        defineKeyPropWarningGetter(props, displayName);
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }
  //  返回创建的元素
  //  type是直接透传的，key,ref等等都是从config里面解析出来的，props是由config上的参数，type上的参数（如果有的话），children等组合而成
  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
```
创建一个ReactElement时，首先根据config中的值，依次给`key`,`ref`，`ref`,`source`赋值，然后将congfig中的其他属性依次赋值给props(前提是非react属性保留字`RESERVED_PROPS`中的属性，定义在上一篇[洞悉细节！react 16.8.6源码分析-2 组件构造与获取调用栈]()),接下来将children赋值给props。接下来将传入的`type`上面的默认属性赋值给props。然后针对`key`和`ref`这两个属性设置取值报警。最后调用`ReactElement`来构造元素。这里我们截取一个react组件console后的结果。  
![](https://user-gold-cdn.xitu.io/2020/6/25/172eab24c2a0c545?w=690&h=167&f=png&s=10951)  

3. react元素克隆
```js
//  返回一个可以创建指定类型的react元素的函数
/**
 * Return a function that produces ReactElements of a given type.
 * See https://reactjs.org/docs/react-api.html#createfactory
 */

//  克隆并且替换key
function cloneAndReplaceKey(oldElement, newKey) {
  //  其实就是替换调key,其他不变
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);

  return newElement;
}

//  克隆并返回一个新的react元素，目标元素将作为起始点
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */
function cloneElement(element, config, children) {
  //  如果element是null或者undefined，抛出不可用的错误
  !!(element === null || element === undefined) ? invariant(false, 'React.cloneElement(...): The argument must be a React element, but you passed %s.', element) : void 0;
  //  属性名
  var propName = void 0;

  // Original props are copied
  //  复制原始属性
  var props = _assign({}, element.props);

  // Reserved names are extracted
  //  受保护的属性被单独提取出来
  var key = element.key;
  var ref = element.ref;
  //  self受保护是因为owner受保护
  // Self is preserved since the owner is preserved.
  var self = element._self;
  //  source受保护是因为克隆一个元素并不是一个转译操作，原始的源对真实的父元素来说可能是一个更好的标志
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  var source = element._source;

  // Owner will be preserved, unless ref is overridden
  //  owner将会被保护，除非ref被复写
  var owner = element._owner;

  if (config != null) {
    //  如果存在config,那么其中的值将会覆盖刚才定义的变量
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      //  静默封装从父元素存底来的ref
      ref = config.ref;
      //  修改owner
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // Remaining properties override existing props
    //  剩下的属性将会复现现存的属性
    var defaultProps = void 0;
    if (element.type && element.type.defaultProps) {
      //  element.type上的默认属性赋值给defaultProps
      defaultProps = element.type.defaultProps;
    }
    //  属性复制
    for (propName in config) {
      //  如果该属性是config自有的并且不是react的保留属性
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        //  如果config中没有值并且默认属性的值存在就从默认属性中赋值
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          //  否则复制config中的值
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  //  复制子元素，逻辑类似先前
  //  children挂在props上，透传
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
}
```
这里的核心逻辑是将原始元素内部的`_source`,`_self`,`_owner`等属性依次赋给`source`,`self`,`owner`,将它们传给`ReactElement`，内部还进行了属性复制，子元素复制等等操作。

4. reactElement元素验证与元素遍历池上下文维护
```js
//  判断一个对象是否是react元素
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
//  首先是对象，其次不是null，再次$$typeoff为REACT_ELEMENT_TYPE
function isValidElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

//  提取并且包裹key，使他可以用为reactid
/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */
//  替换key
function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = ('' + key).replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });
  //  开头贴个$,=和冒号分别变成=0和=2
  return '$' + escapedString;
}

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

 // 关于映射的警告
 // 控制这种报错只出现一次
var didWarnAboutMaps = false;

//  匹配一个或多个/符号 给所有的/符号加一个/
var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  //  $&表示之前匹配中的串
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}
//  

//  维护一个池子  这玩意儿感觉是共用的，每次调用的时候把函数往下传，或者返回一个空的
var POOL_SIZE = 10;
var traverseContextPool = [];
//  获得合并的传递的上下文
//  mapResult其实是处理过后的子元素的数组
function getPooledTraverseContext(mapResult, keyPrefix, mapFunction, mapContext) {
  //  如果有上下文，返回最后一个
  if (traverseContextPool.length) {
    var traverseContext = traverseContextPool.pop();
    //  将相应的值改成传入的值
    traverseContext.result = mapResult;
    traverseContext.keyPrefix = keyPrefix;
    traverseContext.func = mapFunction;
    traverseContext.context = mapContext;
    traverseContext.count = 0;
    return traverseContext;
  } else {
    //  否则根据入参返回一个新的
    return {
      result: mapResult,
      keyPrefix: keyPrefix,
      func: mapFunction,
      context: mapContext,
      count: 0
    };
  }
}

//  释放一个上下文，小于上限的话就往池子里push
function releaseTraverseContext(traverseContext) {
  traverseContext.result = null;
  traverseContext.keyPrefix = null;
  traverseContext.func = null;
  traverseContext.context = null;
  traverseContext.count = 0;
  //  小于上限的话就往里推
  if (traverseContextPool.length < POOL_SIZE) {
    traverseContextPool.push(traverseContext);
  }
}
```
判断一个元素是否是react元素，核心是根据`$$typeof`这个属性来判断，然后是`escape`函数，react内部通过这个函数生成安全的reactid,将`=`和`:`分别替换为`=0`和`=2`,然后将开头拼接上`$`成为reactid。之后定义了一个数组，作为遍历元素时的上下文堆栈，然后定义`getPooledTraverseContext`，来获取遍历元素时的上下文。  

未完待续......

# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥当之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
上一篇：  
[洞悉细节！react 16.8.6源码分析-2 组件构造与获取调用栈]()  
下一篇：  
[施工中]()  