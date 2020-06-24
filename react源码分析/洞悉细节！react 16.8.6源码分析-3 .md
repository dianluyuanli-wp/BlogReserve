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
创建一个ReactElement时，首先根据config中的值，依次给`key`,`ref`，`ref`,`source`赋值，然后将congfig中的其他属性依次赋值给props(前提是非react属性保留字`RESERVED_PROPS`中的属性，定义在上一篇[洞悉细节！react 16.8.6源码分析-2 组件构造与获取调用栈]()),接下来将children赋值给props。接下来将传入的`type`上面的默认属性赋值给props。然后针对`key`和`ref`这两个属性设置取值报警。最后调用`ReactElement`来构造元素。


未完待续......

# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥当之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
下一篇：  
[洞悉细节！react 16.8.6源码分析-2 组件构造与获取调用栈]()  