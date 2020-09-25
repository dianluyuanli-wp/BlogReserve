# 前言
作为一个前端页面仔和需求粉碎机，在日常的工作中重复雷同的业务需求，能够获得的提高是很有限的。要想跳出此山中，开阔新视野，笔者墙裂建议大家阅读市面上顶尖开源库的源码。这是学习和掌握js语言特性的绝佳机会(前端发展到现在，大型应用高度依赖框架，正常情况下普通开发者是没有机会接触底层的语言特性)，同时也是深刻理解框架底层思维的契机。这里笔者选择`react`第一个开刀，市面上不少关于react源码分析的文章要么过于老旧，要么只截取部分代码或者是伪代码，笔者这里将选取react的16.8.6版本作为示例，从第0行开始，不漏过任何一个源码细节，和大家分享笔者在源码阅读过程中的体会。希望和大家共同进步，本系列博文中涉及的源码本人会放在git仓库中，链接在文末。

# 正文
## React.lazy和forwardRef
```js
//  lazy的构造函数
function lazy(ctor) {
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _ctor: ctor,
    //  react使用这些值去储存结果
    // React uses these fields to store the result.
    _status: -1,
    _result: null
  };

  {
    //  在生产环境下，这些都会设置在对象上
    // In production, this would just set it on the object.
    var defaultProps = void 0;
    var propTypes = void 0;
    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get: function () {
          return defaultProps;
        },
        set: function (newDefaultProps) {
          //  react不支持给lazy加载的组件修改默认属性,要么在定义的时候修改，要么在外面包上一层
          warning$1(false, 'React.lazy(...): It is not supported to assign `defaultProps` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');
          defaultProps = newDefaultProps;
          //  和生产环境的行为更接近
          //  设置可枚举类型
          // Match production behavior more closely:
          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true
          });
        }
      },
      propTypes: {
        configurable: true,
        get: function () {
          return propTypes;
        },
        set: function (newPropTypes) {
          //  react不支持给懒加载组件设置属性类型
          warning$1(false, 'React.lazy(...): It is not supported to assign `propTypes` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');
          propTypes = newPropTypes;
          // Match production behavior more closely:
          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true
          });
        }
      }
    });
  }

  return lazyType;
}

//  前向ref
function forwardRef(render) {
  {
    //  感觉就是一堆校验
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      //  如果render不为null且其类型为REACT_MEMO_TYPE，抛错
      warningWithoutStack$1(false, 'forwardRef requires a render function but received a `memo` ' + 'component. Instead of forwardRef(memo(...)), use ' + 'memo(forwardRef(...)).');
    } else if (typeof render !== 'function') {
      //  如果不是函数，抛错
      warningWithoutStack$1(false, 'forwardRef requires a render function but was given %s.', render === null ? 'null' : typeof render);
    } else {
      !(
        //  0参数的时候不报错，因为这可能是因为参数是对象
      // Do not warn for 0 arguments because it could be due to usage of the 'arguments' object
      //  如果参数数组长度不为0或2，抛错：forwardRef只接受2个参数，属性值和ref,'你忘记传ref'或'多出来的参数都会被省略'
      render.length === 0 || render.length === 2) ? warningWithoutStack$1(false, 'forwardRef render functions accept exactly two parameters: props and ref. %s', render.length === 1 ? 'Did you forget to use the ref parameter?' : 'Any additional parameter will be undefined.') : void 0;
    }

    //  如果不满足之前的条件且render不为空
    if (render != null) {
      //  如果render上存在defaultProps或者propTypes，抛错：forwardRef的渲染函数不支持propTypes或者defaultProps，你实际上传入了一个react组件是吗
      !(render.defaultProps == null && render.propTypes == null) ? warningWithoutStack$1(false, 'forwardRef render functions do not support propTypes or defaultProps. ' + 'Did you accidentally pass a React component?') : void 0;
    }
  }

  return {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };
}

```
接下来的内容主要是部分react方法的实现，到这里大家应该会逐步看到一些熟悉的方法，首先介绍的lazy和forwardRef

## 组件有效判断与hooksAPI定义
```js

//  判断是否是元素的可用类型
function isValidElementType(type) {
  //  字符串，函数，react片段或者组件
  return typeof type === 'string' || typeof type === 'function' ||
  //  这里的类型可能是symbol或者是数字，如果使用了降级的写法
  // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  //  后面的这些type要调一次$$typeof
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE);
}

//  纯函数版本的pureComponent,第一个参数是个函数
function memo(type, compare) {
  {
    //  如果不是react类型
    if (!isValidElementType(type)) {
      //  memo的第一个参数必须是组件
      warningWithoutStack$1(false, 'memo: The first argument must be a component. Instead ' + 'received: %s', type === null ? 'null' : typeof type);
    }
  }
  return {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };
}

//  返回当前的dispatcher
function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;
  //  如果dispatcher是null,报错
  //  不可用的钩子调用，hooks只能在函数类型的组件内调用，发生这个报错可能有以下几个原因：
  //  1react和渲染器（react dom）的版本不匹配，2你没有遵循react的使用规则，3你的app内可能有多个react实例
  !(dispatcher !== null) ? invariant(false, 'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.') : void 0;
  return dispatcher;
}

//  貌似都是hooks相关api
function useContext(Context, unstable_observedBits) {
  //  获得当前的dispatcher
  var dispatcher = resolveDispatcher();
  {
    //  如果有第二个参数抛警告
    //  useContext的第二个参数是为未来保留的
    !(unstable_observedBits === undefined) ? warning$1(false, 'useContext() second argument is reserved for future ' + 'use in React. Passing it is not supported. ' + 'You passed: %s.%s', unstable_observedBits, typeof unstable_observedBits === 'number' && Array.isArray(arguments[2]) ? '\n\nDid you call array.map(useContext)? ' + 'Calling Hooks inside a loop is not supported. ' + 'Learn more at https://fb.me/rules-of-hooks' : '') : void 0;

    // TODO: add a more generic warning for invalid values.
    if (Context._context !== undefined) {
      var realContext = Context._context;
      //  不要删除重复数据，因为这个将会合理地触发bug，没有人会在现存的代码中这样用
      // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.
      if (realContext.Consumer === Context) {
        //  useContext(Context.Consumer)这种写法会抛错
        warning$1(false, 'Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' + 'removed in a future major release. Did you mean to call useContext(Context) instead?');
      } else if (realContext.Provider === Context) {
        //  useContext(Context.Provider)这种写法会抛错
        warning$1(false, 'Calling useContext(Context.Provider) is not supported. ' + 'Did you mean to call useContext(Context) instead?');
      }
    }
  }
  //  通过dispatcher调用useContext
  return dispatcher.useContext(Context, unstable_observedBits);
}

//  一堆react hooks API的定义
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}

function useRef(initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

function useEffect(create, inputs) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, inputs);
}

function useLayoutEffect(create, inputs) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, inputs);
}

function useCallback(callback, inputs) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, inputs);
}

function useMemo(create, inputs) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, inputs);
}

function useImperativeHandle(ref, create, inputs) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, inputs);
}

function useDebugValue(value, formatterFn) {
  {
    var dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}
```
这里通过`isValidElementType`来判断是否是合格的react组件，这里react组件的定义很广，字符串，数字，react组件等等的都算，详细实现请看源码。接下来是`React.memo`的定义，没什么特殊的内容，只是指定了`$$typeof`的类型。接下来是一系列reactHooks的相api，首先是`resolveDispatcher`，其将返回一个dispatcher,这个是其他react原生hook进行处理的关键媒介。关于`ReactCurrentDispatcher`的详细实现，在`react-dom.development.js`中。接下来是一系列hook的实现。

## 
```js
//  ReactElementValidator提供一个元素工厂函数的包装器，他可以校验传递给元素的属性。
//  这只会在开发环境中被调用，在支持严格模式的语言中将会被替换
/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

 // 属性名拼错提醒,标志位，避免重复warning
var propTypesMisspellWarningShown = void 0;

{
  propTypesMisspellWarningShown = false;
}

// 一堆报错方法
//  获取错误的信息
function getDeclarationErrorAddendum() {
  //  如果存在ReactCurrentOwner
  if (ReactCurrentOwner.current) {
    var name = getComponentName(ReactCurrentOwner.current.type);
    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }
  return '';
}

//  获取源码的错误信息
function getSourceInfoErrorAddendum(elementProps) {
  //  确定元素及其source存在
  if (elementProps !== null && elementProps !== undefined && elementProps.__source !== undefined) {
    var source = elementProps.__source;
    //  删掉前面的路径
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    //  读取行数，拼接信息
    return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
  }
  return '';
}

//  如果动态子元素数组上没有设置明确的key或者key本身无效就告警。这将方便我们跟踪子元素的更新
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */

 // 一个报错信息的映射map
var ownerHasKeyUseWarning = {};

//  获取当前组件的错误信息
function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    //  如果父元素类型是字符串，直接返回，否则读取displayname或者那么
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;
    if (parentName) {
      //  提醒检查父组件
      info = '\n\nCheck the top-level render call using <' + parentName + '>.';
    }
  }
  return info;
}

//  如果一个组件没有被指定明确的key则告警。这里的元素是个数组，这个数组可能增加或者减少或者重排
//  所有没有被验证的元素都需要被指定一个key,错误状态将会被缓存，使得警告只会发生一次
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
//  验证是否存在key
function validateExplicitKey(element, parentType) {
  //  如果元素上不存在_store，或者元素已经被校验过，或者元素的key存在，直接返回
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  //  标记元素
  element._store.validated = true;

  //  获取错误信息
  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
    return;
  }
  //  标记一下，避免重复抛错
  ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

  //  通常情况下当前的元素时肇事者，但是如果它接受了子元素作为属性，那么它将成为一个需要制定key的元素的创建者
  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    //  返回创建这个元素的父元素的信息
    // Give the component that originally created this child.
    childOwner = ' It was passed a child from ' + getComponentName(element._owner.type) + '.';
  }

  //  设置当前正在校验的元素，以便追踪堆栈
  setCurrentlyValidatingElement(element);
  {
    //  抛出带调用堆栈信息的错
    //  list中的每个子元素都需要有一个不同的key属性
    warning$1(false, 'Each child in a list should have a unique "key" prop.' + '%s%s See https://fb.me/react-warning-keys for more information.', currentComponentErrorInfo, childOwner);
  }
  //  将当前元素置为null
  setCurrentlyValidatingElement(null);
}

//  确保每个元素都被透传到一个静态位置（指的是每个元素都有被指定一个key），或者在一个存在可用key的对象字面量中

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
//  验证子元素的key
function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  //  针对迭代器，数组和单个的情况来确认键
  if (Array.isArray(node)) {
    //  分别验证数组的每个元素
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (isValidElement(node)) {
    // 入过是单个react节点，直接标志位通过
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    //  获取迭代器函数
    var iteratorFn = getIteratorFn(node);
    if (typeof iteratorFn === 'function') {
      //  入口迭代器过去提供隐式的key,现在我们将为他们输出警告
      // Entry iterators used to provide implicit keys,
      // but now we print a separate warning for them later.
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step = void 0;
        //  while循环不停跑迭代器，并验证key
        while (!(step = iterator.next()).done) {
          if (isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}

//  给定一个函数，验证它的参数是否遵循属性类型的定义
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */

 // 验证类型
function validatePropTypes(element) {
  var type = element.type;
  //  入过元素类型不存在或者是字符串，直接返回
  if (type === null || type === undefined || typeof type === 'string') {
    return;
  }
  var name = getComponentName(type);
  var propTypes = void 0;
  //  如果type是工厂函数，读取其propTypes
  if (typeof type === 'function') {
    propTypes = type.propTypes;

    //  如果是forward_ref或者memo类型
  } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE ||
  // Note: Memo only checks outer props here.
  // Inner props are checked in the reconciler.
  //  Memo只校验外层属性，内部的属性交给协调器处理
  type.$$typeof === REACT_MEMO_TYPE)) {
    propTypes = type.propTypes;
  } else {
    //  以上二者都不是，直接返回
    return;
  }
  if (propTypes) {
    //  设置当前正在校验的元素
    setCurrentlyValidatingElement(element);
    //  这里调用的是公共包内容
    checkPropTypes(propTypes, element.props, 'prop', name, ReactDebugCurrentFrame.getStackAddendum);
    setCurrentlyValidatingElement(null);
  } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
    //  如果type.ProTypes是有值的，并且拼写错误标志位为false
    propTypesMisspellWarningShown = true;
    //  组件使用propTypes而不是PropTypes，你是不是拼错了
    warningWithoutStack$1(false, 'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', name || 'Unknown');
  }
  if (typeof type.getDefaultProps === 'function') {
    //  如果type上的getDefaultProps是个函数
    //  除非是支持react class组件的，否则抛警告
    //  getDefaultProps仅在经典的React.createClass定义中使用，请使用静态属性defaultProps来替代
    !type.getDefaultProps.isReactClassApproved ? warningWithoutStack$1(false, 'getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.') : void 0;
  }
}

//  提供一个碎片，验证其只被赋予了碎片支持的属性
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */

 // 检查块的参数，只支持key和children
function validateFragmentProps(fragment) {
  //  设置当前正在校验的元素
  setCurrentlyValidatingElement(fragment);

  var keys = Object.keys(fragment.props);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key !== 'children' && key !== 'key') {
      //  如果有非children和key的参数，抛错
      warning$1(false, 'Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);
      break;
    }
  }

  if (fragment.ref !== null) {
    //  fragment不支持ref
    warning$1(false, 'Invalid attribute `ref` supplied to `React.Fragment`.');
  }
  //  还原
  setCurrentlyValidatingElement(null);
}

//  创建一个元素，并且进行类型验证
function createElementWithValidation(type, props, children) {
  //  这个是一个返回的bool值
  var validType = isValidElementType(type);

  //  在这里我们仅仅警告并不抛错，我们假设元素的创建是成功的，在渲染阶段会有报错
  // We warn in this case but don't throw. We expect the element creation to
  // succeed and there will likely be errors in render.

  //  如果没有type的话启动报错
  if (!validType) {
    var info = '';
    //  如果type未定义或者type是一个空对象
    if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
      //  你可能忘记导出你的组件，或者搞混了默认的导出模式与具名导出的方式
      info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
    }
    //  获取源码信息，包括文件名和代码行数
    var sourceInfo = getSourceInfoErrorAddendum(props);
    //  如果存在就拼接源码信息
    if (sourceInfo) {
      info += sourceInfo;
    } else {
      //  获取声明报错的信息
      info += getDeclarationErrorAddendum();
    }

    var typeString = void 0;
    if (type === null) {
      typeString = 'null';
    } else if (Array.isArray(type)) {
      typeString = 'array';
    } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
      //  如果type是一个react元素，修改信息
      typeString = '<' + (getComponentName(type.type) || 'Unknown') + ' />';
      //  你是否错误地导出了一个JSX字面量而不是一个react组件
      info = ' Did you accidentally export a JSX literal instead of a component?';
    } else {
      typeString = typeof type;
    }
    //  告警 type不可用, 期望一个字符串（最为嵌入式组件）或者一个类/函数（作为合成组件）,但是得到了 xxx
    warning$1(false, 'React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
  }

  //  构建元素
  var element = createElement.apply(this, arguments);

  //  这个结果有可能是null,如果是mock的或者入参里有自定义函数
  // The result can be nullish if a mock or a custom function is used.

  //  todo: 将会丢掉这部分逻辑，当不在允许null作为参数时
  // TODO: Drop this when these are no longer allowed as the type argument.
  if (element == null) {
    return element;
  }

  // 当type不可用的时候跳过key的告警，因为我们的key检验逻辑并不期望会获得非字符串/函数 类型，这样会抛出令人疑惑地错误
  //  我们期望不一样的行为以便区别开发和生产环境（渲染过程将会抛出有益的信息只要类型是固定的，此时类型的警告也会出现）
  // Skip key warning if the type isn't valid since our key validation logic
  // doesn't expect a non-string/function type and can throw confusing errors.
  // We don't want exception behavior to differ between dev and prod.
  // (Rendering will throw with a helpful message and as soon as the type is
  // fixed, the key warnings will appear.)
  
  //  如果类型校验通过，再校验key  
  if (validType) {
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }
  }

  //  如果是fragment类型，跑对应的校验，反之跑通用的类型校验
  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  } else {
    validatePropTypes(element);
  }

  return element;
}
```
这里主要涉及了一系列校验函数，包括对组件参数的校验。`createElementWithValidation`创建了一个元素并内嵌了校验功能。

## react各种原生方法的导出
```js
//  创建带校验的工厂函数
function createFactoryWithValidation(type) {
  //  带验证的工厂函数
  var validatedFactory = createElementWithValidation.bind(null, type);
  validatedFactory.type = type;
  // Legacy hook: remove it
  //  历史代码，将会移除
  {
    Object.defineProperty(validatedFactory, 'type', {
      enumerable: false,
      get: function () {
        //  Factory.type这个api将会被移除，直接在类上获取，在透传到createFactory之前
        lowPriorityWarning$1(false, 'Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.');
        //  兼容性，还是给type一个定义
        Object.defineProperty(this, 'type', {
          value: type
        });
        return type;
      }
    });
  }

  return validatedFactory;
}

//  克隆元素并检查children的属性
function cloneElementWithValidation(element, props, children) {
  var newElement = cloneElement.apply(this, arguments);
  //  校验key
  for (var i = 2; i < arguments.length; i++) {
    validateChildKeys(arguments[i], newElement.type);
  }
  //  校验属性
  validatePropTypes(newElement);
  return newElement;
}

//  帮助识别在生命周期初始阶段hook和setState的副作用
// Helps identify side effects in begin-phase lifecycle hooks and setState reducers:

//  在某些情况下，严格模式也会有两次渲染的生命周期
//  这在测试环节中将会导致困扰，也会在生产环境中带来性能损耗
//  这个特性标志被用来控制这种行为：

// In some cases, StrictMode should also double-render lifecycles.
// This can be confusing for tests though,
// And it can be bad for performance in production.
// This feature flag can be used to control the behavior:


//  为了保留'暂停并且抛错'这种在debugger中的特性，我们重放了渲染失败组件初始阶段内部的invokeGuardedCallback
// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.

//  对被遗弃的api（async-unsafe生命周期）警告，详见RFC #6
// Warn about deprecated, async-unsafe lifecycles; relates to RFC #6:

//  收集先进的时间指标，为了分析子树中的呈现
// Gather advanced timing metrics for Profiler subtrees.

//  跟踪触发每个提交的交互
// Trace which interactions trigger each commit.

//  只能在web环境下使用
// Only used in www builds.
 // TODO: true? Here it might just be false.

// Only used in www builds.


// Only used in www builds.


//  React Fire: 避免value和checked属性与其相关的DOM元素同步
// React Fire: prevent the value and checked attributes from syncing
// with their related DOM properties

//  这些api在即将到来16.7版本中将不在是不稳定的（这个是以前的注释没改吧？）
//  通过一个标志位来控制，以便支持16.6以下的版本

// These APIs will no longer be "unstable" in the upcoming 16.7 release,
// Control this behavior with a flag to support 16.6 minor releases in the meanwhile.
var enableStableConcurrentModeAPIs = false;

//  各种会用到的api封装到一个对象里
//  react暴露出来的api大集合
var React = {
  //  childeren相关api
  Children: {
    map: mapChildren,
    forEach: forEachChildren,
    count: countChildren,
    toArray: toArray,
    only: onlyChild
  },

  createRef: createRef,
  Component: Component,
  PureComponent: PureComponent,

  createContext: createContext,
  forwardRef: forwardRef,
  lazy: lazy,
  memo: memo,

  //  hooks相关的api
  useCallback: useCallback,
  useContext: useContext,
  useEffect: useEffect,
  useImperativeHandle: useImperativeHandle,
  useDebugValue: useDebugValue,
  useLayoutEffect: useLayoutEffect,
  useMemo: useMemo,
  useReducer: useReducer,
  useRef: useRef,
  useState: useState,

  Fragment: REACT_FRAGMENT_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,

  //  元素相关的api
  createElement: createElementWithValidation,
  cloneElement: cloneElementWithValidation,
  createFactory: createFactoryWithValidation,
  isValidElement: isValidElement,

  version: ReactVersion,

  unstable_ConcurrentMode: REACT_CONCURRENT_MODE_TYPE,
  unstable_Profiler: REACT_PROFILER_TYPE,

  //  秘密的内部属性，不要使用否则你会被开除
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals
};

//  部分api是通过特性标志位来添加的
//  确保开源代码的稳定版本不会改变react对象来避免deopts
//  在稳定版本中也不应该暴露他们的名字

// Note: some APIs are added with feature flags.
// Make sure that stable builds for open source
// don't modify the React object to avoid deopts.
// Also let's not expose their names in stable builds.

if (enableStableConcurrentModeAPIs) {
  React.ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
  React.Profiler = REACT_PROFILER_TYPE;
  React.unstable_ConcurrentMode = undefined;
  React.unstable_Profiler = undefined;
}


//  React的不可变副本
var React$2 = Object.freeze({
	default: React
});

//  优先获取React
var React$3 = ( React$2 && React ) || React$2;

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.

//  这个有点hack，但是支持Rollup和Jest
var react = React$3.default || React$3;

module.exports = react;
  })();
}
```
这里主要就是react各种内置方法的导出，至此`react.development.js`全部代码结束。

# 结尾
出于篇幅考虑，本篇的源码分析就告一段落，下一篇出炉时链接将同步在这里。有什么错漏欢迎评论区讨论，关于官方注释的翻译有不妥当之处也请指出~  
仓库地址：  
[react16.8.3源码注释仓库](https://github.com/dianluyuanli-wp/reactSourceCodeAnalyze)  
上一篇：  
[洞悉细节！react 16.8.6源码分析-4 children遍历]()  
下一篇：  
[施工中]()  