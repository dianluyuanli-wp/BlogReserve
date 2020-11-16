# Webpack 5 发行版 (2020-10-10)
webpack 4在2018年二月份发行。在那以后我们封装了一些列特性，但是并没有引入破坏性的变化。我们知道大家不喜欢有破环新变化（`breaking changes`）的变更。特别是针对webpack这类工具，人们一年只会接触这种应用的机会很有限，其余时候把它丢在一边，只要它能正常工作。但是不引入破换新变化的同时风向新特性是有代价的：我们不能进行核心api或者架构层面的升级。  
随着时间的推移，总会到这么一个时间点，面临的问题堆积到了一定程度使得我们必须去通过引入破换性的变化来进行修复，而不是让代码朝着更加不可维护的方向发展。现在是时候发布新版本了，webpack 5包含了架构升级和新特性，我们在实现它们的同时不引入破坏性变更。  
与此同时，大版本的发布也是一个修正一些错误、与业界提案和规范保持一致的机会。  
所以在今天（202-10-10）webpack 5正式发布，但这并不意味着这个版本已经完成，没有bug,完成了所有的特性开发。与此同时，我们会继续维护webpack 4,修复bug并且增加新特性。接下来的日子里我们主要会进行bug修复，特性的追加会稍后。  
# 常见问题
## 发行版意味着什么？
这意味着我们完成了破坏性变更的开发。许多顶层的重构已经完成，未来特性(包括当前的特性)的开发打下了很好的基础。
## 什么时候适合升级？
这个看情况。升级很有可能不会一次成功，你可能需要尝试两次甚至三次。如果你对这个过程并不敏感，那么欢迎你立即升级并且向webpack，插件，loader等提供反馈。我们非常渴望修复其中的问题。它们中的一些已经被修复，你可能就是从他人的反馈中受益的一份子。
# 赞助更新
webpack完全是靠赞助来维持运转的。它跟一些大公司,比如一些开源项目并无瓜葛。99%的赞助都用来根据贡献的大小支付给webpack代码的贡献者和维护者。我们坚信这样的投资会让webpack发展得更好。  
由于疫情的缘故，很多公司对于开源项目的赞助变少了，webpack正处于疫情的不利影响下（正如很多公司和人正经历的那样）。  
我们没有能力向贡献者们支付他们本该获得的酬劳，但是现在我们只有一半的资金可用，我们不得不进行开支的削减。直到情况有所好转，我们只会给每月前10天提交代码的贡献者或者维护者支付酬劳。剩下的日子他们都是志愿工作，由他们原本的雇主支付薪水，或者通过做其他的一些事来赚钱。这意味着我们支付的头10天的酬劳将远远大于开发者们付出的时间。  
最诚挚的感谢送给`trivago`,他们在过去的三年中给webpack提供了大量的赞助。遗憾的是他们无力在今年继续进行赞助，因为他们本身也受到了新冠病毒的影响。我希望其他的公司能够像他们那样慷慨解囊。  
感谢所有的赞助者！  
# 总体的方向
这次的发行版改动点集中在以下几个方向：
* 通过持久化缓存提审构建性能  
* 通过更好算法和默认设置来提升长期缓存的效果  
* 通过web平台来提升兼容性  
* 清理掉内部的一些遗留的结构，在v4版本中，为了实现一些特性而引入了一些古怪的状态，这里没有引入破坏性变更  
* 为了未来的一些特性，这里使用引用了一些破坏性的变更，这使得我们在v5版本能够停留足够长的时间  
# 迁移指南
详情点击[migration guide](https://webpack.js.org/migrate/5/)
# 主要变更之移除
## 移除废弃的配置项目
v4中所有的废弃项目被删除。
迁移：确保你的webpack 4打包过程中不会打印任何的有关废弃api的告警。  
这里有一些项目被移除了，但是在v4版本中并不会发出废弃api的告警：
* IgnorePlugin和BannerPlugin现在必出传入一个参数，该参数可以是对象，字符串或者函数。
## 移除代码
新的弃用包括一个弃用代码，因此它们更易于引用。
## 废弃的语法
`require.include`被废弃，使用的时候会有warning。  
告警的行为可以在`Rule.parser.requireInclude`设置为允许，废弃或禁止。  
## 自动的node.js polyfill被移除
在早些时候，webpack致力于让Node.jsd的模块能够运行在浏览器中，但是情况发生了变化，很多模块仅仅是为了前端的使用而编写。小于等于4版本的webpack为很多Node.js模块封装了polyfills，一旦有某个模块使用了node.js的核心模块这些polifills将会生效（例如`crypto`模块）。  
这样的兼容使得使用那些为node.js编写的模块非常方便，但是这也导致打包文件中引入了很多的polyfills代码，在很多时候这些polifills都是不必要的。  
webpack 5停止自动去兼容这些node核心模块，将开发重心聚焦于前端模块的兼容性。我们的目标是提审web平台的兼容性，很多时候Node.js核心模块都是不必要的。  
迁移：
* 尽可能使用具有浏览器兼容性的模块  
* 请尽可能手动加入针对Node.js模块的polyfill，将会有报错信息来指导你这样做
* 包作者：请在`package.json`中使用`borwser`域，确保包能够在浏览器环境下运行。为浏览器环境提供其他实现或者依赖来解决兼容性问题。
# 主要变更之长期缓存
## 确定性的chunk,模块id和导出命名
长期缓存中引入了新的算法，这在生产模式中被自动引入。也就是类似这样的配置：
```
chunkIds: "deterministic" moduleIds: "deterministic" mangleExports: "deterministic"
```
算法以确定的方式指定3到5位数字id给模块和chunks,2位字符作为输出的名字。这是在打包体积和长期缓存之间做出的妥协。  
`moduleIds/chunkIds/mangleExports: false`将会禁止默认行为，你可以通过引入插件来使用常规算法。注意在webpack 4中，设置`moduleId/chunkIds:false`却引入插件是可以运行的，但是在wepack 5中必须提供一个插件。  
迁移：  
最好在`chunkIds`,`moduleIds`,`mangleExports`使用默认值设置。你也可以在配置中使用以前的默认值`chunkIds: "size", moduleIds: "size", mangleExports: "size"`.这样打包体积会更小，但是会让打包过程中的缓存更加频繁地失效。(换句话来说，打包速度变慢了，译者注)  
注意：在webpack 4中哈希过后的模块id降低了gzip的性能，这跟模块顺序的变更有关，现已被修复。  
注意：在webpack 5中，`deterministic`id（持久化id）在开发环境下默认启用  
## 真实的内容hash
webpack 5在配置`[contenthash]`将会使用文件内容的hash。先前仅仅使用文件内部结构的hash。在仅仅是注释和变量重命名时，将会对长期缓存产生正面影响。这些变化在代码压缩之后是不可见的。  
# 主要变化之开发支持
## 具名Chunk id
在开发模式中，将会默认启用新的chunk id命名算法，这会给chunk和文件名赋予具有可读性的名字。一个模块（module）的ID取决于它的路径，同上下文有关.一个chunk的ID取决于chunk的内容。  
所以你不用再使用类似`import(/* webpackChunkName: "name" */ "module")`来debugging,但是如果你想控制生产环境下的文件名时，这样做依然有意义。  
在生产环境中很有可能使用`chunkIds: "named"`这样的写法，但是请确保这样不会暴露一些敏感的模块名。  
迁移：  
在开发模式下，如果你不喜欢文件名的随意改变，你可以传入`chunkId: "natural"`来使用老的数字命名的形式。
## 模块联合（module federation）
webpack 5添加了一个新的特性叫做"模块联合"，这使得开发者可以使用多个webpack的构建结果来共同工作。从运行时的角度来看，来自不同构建的模块能够被连接在一起成为一个巨大的模块图结构。从开发者的角度来看，模块能能够在最小的限制下从不同的远端构建引入。更对细节请查看这篇[单独的指引](https://webpack.js.org/concepts/module-federation/)  
# 主要变动之新的web平台特性
## JSON 模块
JSON模块现在遵从协议的规定，如果使用非默认的输出是将会有告警。当从一个严格模式的ECMAScript模块中引入时，JSON模块将不再有具名导出。
迁移:  
使用默认导出。  
尽管使用了默认导出方式，设置`optimization.usedExports`会使得没有使用到的属性被丢弃。设置`optimization.mangleExport`绘制的属性名被破坏性优化（译者注：属性名会被修改，减少字符数）.  
可以通过在`rule.parser.parse`中指定JSON的解析器来引入类似JSON结构的文件,比如toml,yaml,json5等等
## import.meta
* `import.meta.webpackHot`是`module.hot`的别名，这个在严格模式下的ESM中也是生效的
* `import.meta.webpack`是webpack的主版本号
* `import.meta.url`是当前文件的文件url（类似于`__filename`,但是作为文件的url）
## asset模块
webpack 5对表示assets的模块有原生支持。这些模块要么将一个文件放入输出文件夹，要么将一个DataURI放入javascript打包文件中。这两种方式都提供了一个URL。  
可以通过多种方式引用：  
* 老方法：`import url from "./image.png"`并且在`module.rules`中设置`type: "asset"`（当improt的方式匹配的时候）
* 新方法：`new URL("./image.png", import.meta.url)`  
这里的新方法预发允许代码在未打包的情况下运行，这个语法在原生ECMAScript模块中可以在浏览器中执行。
## 原生worker支持
当`new URL`和`new Worker / new ShareWorker / navigator.serviceWorker.register`等一起使用的时候，webpack将会为web worker生成一个单独的入口。  
`new Worker(new URL("./worker.js", import.meta.url))`  
这个语法也允许在未打包的情况下使用。在原生ECMAScript模块这样使用在浏览器中也是支持的。
## URIs
webpack 5支持控制接口请求中的协议。  
* `data:` 支持。Base64或者原始的编码内容都支持。Mimetype能够被映射到`module.rules`中的各个loader。例如：`import x from "data:text/javascript,export default 42"`
* `file:` 支持
* `http(s):`支持。但是需要配置`new webpack.experiments.schemesHttp(s)UriPlugin()`
***默认情况下目标是web，这些URIs用来获取外部资源（都属于externals）
请求中的分块也是支持的,例如：`./file.js#fragment`
## 异步模块
webpack 5支持所谓的异步模块。这些模块并不会同步执行，他们被异步的promise来替代了。  
通过`import`引入的模块会被自动处理，并不需要额外的操作，这其中的差别几乎无法识别。  
通过`require()`引入的模块，将会返回一个promise，这个promise的resolve返回原先的exports.  
在webpack中，有多个方法引入异步模块：  
* 异步externals(async externals)
* 新规范中的WebAssembly 模块
* 使用顶层await 的ECMAScritp模块
## Externals 
webpack 5中引入了额外的外部文件(external)类型来应对更多的应用场景：  
`promise:`一个返回Promise的表达式。外部的模块是异步的，并且promise resolve的值就是模块的exports.
`import:`原生的`import()`是用来加在特定请求的。外部的模块是异步模块。  
`module:`暂时没有实现，但是打算通过`import x from "..."`来实现加载模块的功能  
`script:`通过`<script`标签来加载url,通过一个全局变量来获取其输出（包括他的属性，如果存在的话），这里external的模块是一个异步模块
# 主要变化之新的node.js生态系统特性
# resolving
在package.json中支持使用`exports`和`imports`。  
Yarn PnP现在原生支持。  
更多细节请查看[包导出](https://webpack.js.org/guides/package-exports/)
# 主要变化之开发体验
## 构建目标优化
webpack 5允许传入一个构建目标列表，可以精细化控制构建目标的版本。  
例如：`target: "node14" target: ["web", "es2020"]`  
这是一个给webpack提供所构建目标信息的方法，告诉构建需要什么，比如：  
* chunk的下载机制
* 支持的语法
## stats
stats的测试格式提升了可读性，降低了配置的繁琐性。默认配置变的更加简洁并对也适用于大型项目的构建。
* Chunk之间的关系现在被默认隐藏了。可以通过`stats.chunkRelations`来开启。
* stats现在会区分`file`和`auxiliaryFiles`
* stats现在回默认隐藏module和chunk的id，可以通过`stats.ids`开启
* modules的列表心在会按照其距离入口文件的距离来排序。这个可以通过`stats.modulesSort`来调整
* chunk列表现在的顺序是通过module的名字来排序。这个可以通过`stats.chunkModulesSort`来调整
* 串联模块(concatenated module)中的嵌套模块列表将根据拓扑顺序进行排序。可以通过`stats.nestedModulesSort`来调整
* Chunks和Assets现在会展示id提示
* Assets和module将会进行树形展示，以前是表格形式展示
* 通用信息的总结会在构建流程的最后展示，它展示webpack的版本，配置的名字和报错、告警的数量
* hash现在会被默认隐藏，可以在`stats.hash`中进行配置
* 构建的时间戳现在不会默认展示。可以在`stats.builtAt`中进行设置。在最后构建最后的的总结输出中将会展示时间戳
* 子编译过程现在默认不会展示。可以通过`stats.children`进行配置。
## 过程
`ProgressPlugin`进行了一定的优化，通过`--progress`可以在CLI中进行优化，同时也可以作为一个插件手动添加。  
它过去只会记录已完成的模块数。现在可以对入口数，依赖数等进行计数，他们都会被默认展示。  
过去它只会展示当前正在进行的模块。这会导致过多的错误输出，在有一些console的情况下甚至会导致性能问题。这个特性现在被默认关闭(`activeModules`属性控制)。同时也减少了无谓的console.log输出。现在在构建过程中的stderr输出将会有500ms的截流。profiling模式现在也有升级，将会展示嵌套进程消息的时间。这将有助于分析由于插件所引入的性能问题。  
一个新增的`percentBy`属性会告知`ProgressPlugin`如何计算进程的百分比。  
```js
new webpack.ProgressPlugin({ percentBy: 'entries' });
```
为了使得进程计算的百分比足够精确，`ProgressPlugin`将会缓存已知的总模块数并且在下一次构建中重用。第一次启动的时候会热启动缓存，后续的构建中会使用并且更新这份缓存。
## 自主区别命名
在webpack 4中，多个webpack在同一个html中运行时会产生冲突，因为他们使用同样的全局变量来做chunk的加载。为了修复，需要在`output.jsonpFunction`配置项中提供一个通用的名字。  
webpack 5现在自动从`package.json`引入了一个独一无二的名字,并且使用它来作为`output.uniqueName`的内容。  
这个值将会用来给所有潜在会冲突的全局变量独一无二。  
迁移：为了实现独一无二的命名，可以移除`package.json`中的`output.jsonFunction`。
## 自动的公共路径
webpack 5将会尽可能地自动配置`output.publicPath`。
## typescript 类型
webpack 5源码支持typescript,并且通过npm包进行了引入。  
迁移：移除`@types/webpack`,请在名称不同时更新引用。
# 主要改动之优化（Optimization）
## 嵌套的树摇(tree-shaking)
webpack现在可以追踪输出内容的嵌套属性。这将在再次导出(reexporting)命名空间对象的时候提审tree shaking（移除没有使用的属性）的性能。
```js
// inner.js
export const a = 1;
export const b = 2;

// module.js
export * as inner from './inner';
// or import * as inner from './inner'; export { inner };

// user.js
import * as module from './module';
console.log(module.inner.a);
```
在上述的例子中，变量b(没有引用)将会在生产环境中被移除
## 内部模块树摇
webpack 4中不会分析模块输入和输入之间的依赖。webpack 5有一个新的配置项`optimization.innerGraph`，在生产环境中默认开启。这个配置会进行对模块中的符号进行分析，找出从输入到输出的依赖。来看看下面这个例子：
```js
import { something } from './something';

function usingSomething() {
  return something;
}

export function test() {
  return usingSomething();
}
```
内部图算法将会发现`something`只有在`test`被导出的时候才会使用。这会将很多没有使用过的内容打上标志位，以便在打包文件中移除。  
当`"sideEffects": false`这样设置的时候，这将会移除更多的模块。在这个例子中`./something`将会被移除，如果`test`没有被使用。  
为了获得更多的关于没有使用的导出的信息,`optimization.unusedExports`需要被设置。为了移除没有副作用的模块，需要设置`optimization.sideEffects`。  
下面的语法符号在打包过程中将会被分析:  
* 函数声明
* 类声明
* 包含以下内容的`export default`和变量声明  
    - 函数表达式
    - 类表达式
    - 序列表达式
    - `/*#__PURE__*/`表达式
    - 本地变量
    - imported 绑定
    - 内容
反馈：在这个过程中如果你发现遗漏了什么没有列举出来，请给我们提issue,我们将会考虑加上。  
在模块中使用`eval()`将会使得这个优化失效，因为eval执行的代码内部可能引用域内的所有变量。  
这个优化也叫作深度作用域分析（Deep Scope Analysis）。
## commonJs 树摇
webpack过去在针对Commonjs导出的资源，或者使用`require()`导出的资源不尽兴然和的特殊处理。  
webpack 5增加了对Commonjs结构的支持，使得可以移除未使用的Commonjs输出并且从`require()`调用中追踪被引用的导出内容的名字。  
这个新特性支持下面的结构:  
* `exports|this|module.exports.xxx = ...`
* `exports|this|module.exports = require("...") (reexport)`
* `exports|this|module.exports.xxx = require("...").xxx (reexport)`
* `Object.defineProperty(exports|this|module.exports, "xxx", ...)`
* `require("abc").xxx`
* `require("abc").xxx`
* 来自ESM的导入
* 通过`require()`引用一个 ESM
* 标记输出类型（特别处理非严格模式的ESM导入）
    * `Object.defineProperty(exports|this|module.exports, "__esModule", { value: true|!0 })`
    * `exports|this|module.exports.__esModule = true|!0`
* 未来有可能支持更多的结构
如果探测到无法分析的代码，webpack将会放弃追踪所有导出的信息(出于性能考虑)
## 副作用分析
package.json中的`sideEffect`标记将会允许手动标记没有副作用的模块，在没有使用的时候将会在构建中移除。  
webpack 5将会根据源码静态分析的结果自动给模块标记是否有副作用。
## 每次运行时的优化
webpack 5现在能够在每次运行的时候去分析和优化模块（默认行为），每次运行等效于一个入口。这个机制保证只会到处真正被使用的入口文件。入口文件彼此之间不会互相影响。
## 模块聚合(module concatenation)
在每个运行时（runtime）都会进行模块聚合，这使得每个运行时都会有不同的聚合模块。  
模块聚合成为了一等公民，任意的模块和依赖现在都可以实现。最初webpack 5已经对ExternalModules和json modules进行支持。在未来将会支持更多类型的模块。
## 常规树摇优化
`export *`现在会捕获更多的的信息，并且不会把`default`输出标记为被使用的内容。  
`export *`webpack在发现冲突的导出时会抛出警告。  
`import()`允许手动树摇模块，即通过类似`/* webpackExports: ["abc", "default"] */`这样的注释来指定。
## 开发与生产环境的相似性
我们通过提升开发模式和生产模式的相似性，来尽量在开发环境的构建性能和避免生产环境独有的问题之间找平衡。  
webpack 5在开发和生产模式中都开启了`sideEffects`优化。在webpack 4中，由于`sideEffects`标记的错误，这个优化会导致一些只在生产环境才会出现的问题。在开发环境中页开启这个优化使得潜在的问题能够更早地暴露。  
在很多时候，开发环境和生产环境是在文件系统大小写名感性不同的操作系统中运行的。webpack 5针对一些不合常理的大小写增加了新的错误和告警。
## 代码生成过程的提升
webpack会探测ASI(auto semicolon insertion，简称ASI, 译者注)，同时没有分号插入的时候会产生更短的代码`Object(...) -> (0, ...)`  
webpack会把对个输出的getter合并到一个运行时的函数调用中：`r.d(x, "a", () => a); r.d(x, "b", () => b); -> r.d(x, {a: () => a, b: () => b});`  
现在webpack有一个新的配置项`output.environment`。这个配置会告诉webpack在运行时代码中可以使用哪些`ECMAScript`的特性。通常情况下不会直接指定这个配置项，而是在`target`中进行配置。  
webpack 4过去只会生成ES5的代码。webpack 5现在可以生成ES5和ES6/ES2015的代码。  
如果只考虑支持现代浏览器的话，可以使用箭头函数将会让生成的代码将会更短。使用带TDZ(暂时性死区 temporal dead zone,译者注)const声明会生成更多符合规范的代码。  
## 优化`target`配置
在webpack 4中，`target`是一个很粗略的介于`web`和`node`之间的配置项（或者其他的目标）。webpack 5现在开放了更多的选项。  
现在的`target`配置会比以往影响更多的生成代码。  
* chunk加载的方法
* chunk的格式
* wasm加载的方法
* 在worker中chunk和wasm加载的方法
* 全局对象的使用
* publicPath是否应该被自动指定
* ECMAScript 特性和预发在生成代码中的使用
* `externals`默认开启
* 部分Node.js兼容层的行为（`global`, `__filename`, `__dirname`）
* 解析modules(`browser`域，`exports`和`imports`条件)
* 部分loader可能会改变上面的行为
因为以上列举的原因，`web`和`node`之间的选择太粗略了，我们需要更多的信息.因而我们允许指定一个最小版本，比如`node10.13`并且推断更多的目标环境的属性。  
现在还可以将多个目标与数组组合，webpack将会找出所有目标的最小兼容属性。当使用没有提供完整信息（如“web”或“node”（没有版本号）的目标时，使用数组也很有用。例如`['web','es2020']`将会整合这两个部分的目标。  
这里有一个目标`browserslist`,将会使用浏览器列表属性去决定环境的属性。当这里有一个可用的browserslist配置可用的时候，这就是webpack的默认target。如果没有，`web`将会成为默认的target。  
一些组合和特性在当前版本中并没有实现，并且会抛出错误。他们是为未来的特性准备的，例如：  
* `["web","node"]`将会让输出使用通用的chunk加载方法，但是这个目前没有实现。
* `["web","node"]` + `output.module: true`将会让输出使用module chunk加载方法，目前没有实现。
* `"web"`将会使用`http(s):`来引入那些被认为是模块的external,目前并没有实现(折中方法：`externalsPresets: {web: false, webAsync: true}`，这样将会使用`import()`来加载模块)  
## chunk分割和module的大小
modules现在并不单单使用数字来标识大小。现在有不同的的size类型。  
splitChunksPlugin现在知道如何使用这些不同的大小，并将他们应用于`minSize`和`maxSize`。在默认情况下，只有`javascript`的大小会被计算，你可以传入多个值来控制计算的范围：
```js
module.exports = {
  optimization: {
    splitChunks: {
      minSize: {
        javascript: 30000,
        webassembly: 50000,
      }
    }
  }
};
```
你依然可以只使用数字来标记大小。在这种情况下，webpack将会自动使用默认的size类型。  
`mini-css-extract-plugin`使用`css/mini-extra`作为size类型，并且将这个size类型叫到了默认的types中。
# 主要变动之性能
## 持久化缓存
webpack现在将使用文件系统缓存。这个是可配置的，能够通过下面的配置开启：
```js
module.exports = {
  cache: {
    // 1. Set cache type to filesystem
    type: 'filesystem',

    buildDependencies: {
      // 2. Add your config as buildDependency to get cache invalidation on config change
      config: [__filename]

      // 3. If you have other things the build depends on you can add them here
      // Note that webpack, loaders and all modules referenced from your config are automatically added
    }
  }
};
```
重点注意：  
默认情况下，webpack会假设`node_modules`的文件路径只会被package manager改动。针对`node_modules`的hash和时间戳机制被抛弃了了。现在只有包的名字和版本会被考虑进来。系统全局的链接是可用的，只要`resolve.symlink: false`没有被设置（尽量避免这样做）。请不要直接修改`node_modules`下的内容，除非你决定通过`snapshot.managedPaths: []`来关闭对应的优化。当使用yarn Pnp时，webapck会假定yarn缓存是不可变的(通常情况下是这样)。你可以通过设置`snapshot.immutablePaths: []`来关闭这个优化。  
缓存内容将会被放在`node_modules/.cache/webpack`目录下（但使用node_modules时）.默认情况（使用yarn PnP）下缓存放在`.yarn/.cache/webpack`,通常情况下你不用手动删除过这些缓存，前提是所有的插件都有正确处理缓存。  
许多内部插件也会使用持久化缓存。例如:`SourceMapDevToolPlugin`(混窜生成的sourceMap),`ProgressPlugin`(缓存模块数)。  
持久化缓存将会自动根据用途创建多个缓存文件，以便优化读写过程。  
默认情况下，时间戳将会在开发环境下被用来做快照，在生产环境下将会使用文件hash.文件hash同样支持在CI上使用持久化缓存。
### 编译器闲置和关闭
编译器在使用之后需要关闭。编译器现在会进入或者离开空闲状态，现在有钩子来控制这些状态。插件现在回通过这些钩子来做一些不重要的工作。（例如持久化缓存将会缓慢地存放在硬盘上）。在编译器关闭的时候，所有剩余的工作都需要尽快完成。将会有一个回调来告知编译器关闭。  
插件和他们的作者应该预设部分的使用者可能忘记关闭编译器。在闲置模式中，所有的工作最终都应该完成。在工作完成的时候不应该还有运行的进程。  
`webpack()`传入回调函数的时候，将会自动调用`close`;  
迁移：尽管使用了Node.js API,请确保在完成的时候有调用`Compier.close`;
## 文件输出
webpack过去在第一次构建的时候将会输出所有的文件，在增量构建(watch)的时候会跳过对没有改动的文件的写操作。这里将会家丁在webpack运行的时候不会有其他的东西改动输出文件。  
添加了持久缓存后，即使在重新启动webpack进程时也应该获得类似watch的体验，但如果认为即使webpack没有运行，也没有其他任何东西会更改输出目录，这种想法有点一厢情愿了。  
所以webpack现在会去检查输出路径中存在的文件并且同内存中的输出文件内容进行比较。只有在内容有变动的时候才会去写文件。这个过程只会在第一次构建的时候发生。如果在webpack的运行进程中有新的内容生成，增量编译将会去写这些文件。  
我们假定webpack和插件只会在内容改动的时候生成新的文件。缓存被用来确保在输入相等的时候不会有新的内容被生成。如果不遵从这个建议的话将会拖慢性能。  
那些被标记为`immutable`的文件(包括内容hash),只要已经存在一个同名文件，将永远不会被写入。我们假设文件hash将会同文件内容一起改变。这个假设绝大多数时候是成立的。但是在webpack或者插件的开发过程中是可能不是这样。  
# 主要变化之一些长期存在的突出问题
## 单文件目标的代码分割
以前那些只能通过单文件来启动的项目（比如node，webworker,electron主程序），现在支持在运行时初始化的过程中加载所需要的依赖。  
这使得在`chunks: "all"`时可以用`opimization.splitChunks`和`optimization.runtimeChunk`来针对这些目标文件。  
注意这些目标文件的chunk加载是异步的。这使得初始的评估过程也是异步的。在`output.library`时可能会产生问题，因为现在导出的值是promise。  
## 更新resolver
webpack 5现在支持`enhanced-resolve`。现在做了如下优化：  
* 会追踪更多的依赖，比如一些小事的文件
* aliasing现在可能有多个可选项
* aliasing现在可以是false
* 支持类似`exports`和`imports`这样的特性
* 性能提升
## 非js的chunk
不含js代码的chunks将不再生成js文件。现在允许chunk只含有css.
# 主要改动之未来特性
## 实验
在开始的时候不是所有的特性都是稳定的。在webpack 4中我们增加了测试特性并且在changelog中进行了标注，但是在配置中这些特性是否是实验性的并不直观。  
在webpack 5中，有一个新的`experiments`配置项能够用来开启实验中的特性。这可以直观地看到哪些特性被开启。
虽然webpack遵循语义版本控制，但它将为实验性功能提供一个例外。  
实验特性在小版本中有可能会含有破坏性的变更。当这种情况发生的时候，我们将会在changelog中新增清晰的记录。这会使我们在维护实验特性的时候更快，同时也允许我们在主要版本上停留更长时间以获得稳定的功能。  
下面的这些实验特性将会封装在webpack 5中：
* webpack 4中对于老webassembly的支持(`experiments.syncWebAssembly`)
* 根据更新的特性，对新webassembly的支持(`experiments.asyncWebAssembly`)
  * 这使得一个webassembly模块成为一个异步模块
* 顶层await提案的支持（`experiments.topLevelAwait`）
  * 在顶层模块shiyong`await`使得这个模块成为异步模块。
* 将输出打包文件作为模块（`experiments.outputModule`）
  * 现在从打包文件中移除了IIFE( Immediately Invoked Function Expression 立即执行函数表达式)包裹器，增强了严格模式，通过`<script type="module">`来懒加载内容，模块模式中的最小化。
这也意味着现在默认支持`webassembly`.
## 最小node版本支持
现在支持的最小node版本从6迁移到10.13.0.  
迁移： 升级node到最新的可用版本。
# 配置的修改
## 架构变化
* `entry: {}` 现在允许传入一个空对象（可以使用插件来添加入口）
* `target` 支持数组、版本和浏览器列表
* `cach: Object` 移除： 不能设置内容缓存对象
* `cache.type` 新增：有两个可选项：`memory`和`filesystem`
* 针对`cache.type = "filesystem"`有新的配置项：
  * `cache.cacheDirectory`
  * `cache.name`
  * `cache.store`
  * `cche.hashAlgorighm`
  * `cache.idleTimeout`
  * `cache.idleTimeoutForInitialSotre`
  * `cache.buildDependencies`
* 新增`snapshot.resolveBuildDependencies`
* 新增`snapshot.resolve`
* 新增`snapshot.module`
* 新增`snapshot.managedPaths`
* 新增`snapshot.immutablePaths`
* 新增`resolve.cache`,允许开启或者关闭resolve缓存
* 移除`resolve.concord`
* `resolve.alias`的值能够为数组或者false
* 新增`resolve.restrictions` 允许限制潜在的resolve结果
* 新增`resolve.fallback` 允许对无法解析的请求进行别名
* 新增`resolve.preferRelative` 允许将模块的解析请求也看做相对请求
* 对于Node.js的的自动适配被移除
  * `node.Buffer`被移除
  * `node.console`被移除
  * `node.process`被移除
  * `node.*`(Node.js原生模块)被移除
  * 迁移：使用`resolve.alias`和`ProviderPlugin`。有报错时将会有提示（请参阅[node-libs-browser](https://github.com/webpack/node-libs-browser)了解v4中的polyfill和mock是怎样做的）
* `output.filename` 现在支持传入函数
* 新增`output.assetModuleFilename`
* `output.jsonpScriptType`重命名为`output.scriptType`
* `devtool`现在更加严格
  * 格式：`false | eval | [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map`
* `optimization.chunkIds`,新增`"deterministic"`配置
* `optimization.moduleIds`新增`"deterministic"`配置
* `optimization.moduleIds`新增`"hashed"`配置
* `optimization.moduleIds`移除`"total-size"`
* 多个关于模块和chuank的标志位被移除
  * 移除`optimization.hashedModuleIds`
  * 移除`optimization.namedChunks`,`NamedChunksPlugin`也被移除
  * 移除`optimization.namedModules`，`NamedModulesPlugin `也被移除
  * 移除`optimization.occurrenceOrder`
  * 迁移：使用`chunkIds`和`moduleIds`
* `optimization.splitChunks` `test`不在匹配chunk的名字
  * 迁移：使用一个test函数(module, { chunkGraph }) => chunkGraph.getModuleChunks(module).some(chunk => chunk.name === "name")
* 新增`optimization.splitChunks` `minRemainingSize`
* `optimization.splitChunks` `filename`现在可以为函数
* `optimization.splitChunks` size现在能够为一个包含每个来源类型和size的映射对象
  * `minSize`
  * `minRemainingSize`
  * `maxSize`
  * `maxAsyncSize`
  * `maxInitialSize`
* `optimization.splitChunks` `maxAsyncSize` 和 `maxInitialSize`新增了`maxSize`:允许定义不同的初始化chunk和异步chunk的最大size
* `optimization.splitChunks` `name:true`被移除：现在不支持自动命名
  * 迁移: 使用默认配置。`chunkIds: "named"`将会为你的构建文件提供有意义的名字，方便debug
* `optimization.splitChunks.cacheGroups[].idHint`新增：提供一个提示，说明如何选择命名chunk id
* `optimization.splitChunks` `automaticNamePrefix`被移除
  * 迁移： 使用`idHint`来替代
* `optimization.splitChunks` `filename` 不再局限于初始chunk
* `optimization.splitChunks` `usedExports`在比较模块的时候将会包括已使用的导出
* `optimization.splitChunks.defaultSizeTypes`新增：当使用具体数字来标识size时的大小类型
* 新增`optimization.mangleExports`
* `optimization.minimizer` `"..."`能够被用来引用默认内容
* `optimization.usedExports` 新增`"global"`配置，允许能能够关闭每次运行时的分析改在全局做（出于性能考虑）
* `optimization.noEmitOnErrors`重命名为`optimization.emitOnErrors`，相关逻辑也进行了翻转
* 新增`optimization.realContentHash`
* 移除`output.devtoolLineToLine`
  * 迁移：没有兼容方案
* `output.chunkFilename` 现在允许传入函数
* `output.hotUpdateChunkFilename`,现在不允许传入函数，传入也不会生效
* `output.hotUpdateMainFilename` 现在不允许传入函数，传入也不会生效
* `output.importFunctionName` 字符串可以指定用来替换`import()`的方法名，以便用来兼容不支持的环境
* 新增`output.charset` 将这个设置为false可以移除script标签上的`charset`属性
* `output.hotUpdateFunction`改名为`output.hotUpdateGlobal`
* `output.jsonpFunction`改名为`output.chunkLoadingGlobal`
* `output.chunkCallbackFunction`改名为`output.chunkLoadingGlobal`
* 新增`output.chunkLoading`
* 新增`output.enabledChunkLoadingTypes`
* 新增`output.chunkFormat`
* `module.rules`内部的`resolve`和`parser`将会使用另外一种方式合并配置（对象将会深度merge，数组将会通过`...`来引用上一个值）
* `module.rules` `parser.worker`新增，允许配置对worker的支持
* `module.rules`下移除`query`和`loaders`
* `module.rules` `options`不再支持传入字符串
  * 迁移：传入一个对象，如果不支持的话可以提issue
* `module.rules` 新增`mimetype`，允许匹配DataURI的mimetype
* `module.rules` 新增`descriptionData`,允许匹配package.json中的数据
* `module.defaultRules` 可以使用`"..."`来引用默认配置
* 新增`stats.chunkRootModules`展示chunk的根模块
* 新增`stats.orphanModules` 显示未发出的模块
* 新增`stats.runtime`,展示运行时的模块
* 新增`stats.chunkRelations` 展示父、子、兄弟模块
* 新增`stats.errorStack` 展示webpack内部对于错误堆栈的追踪
* 新增`stats.preset` 选择一个预设值（preset）
* 新增`stats.relatedAssets` 展示与其他assets相关的assets（比如sourceMap）
* 为支持`ignoreWarnings`,现废弃`stats.warningsFilter`
* `BannerPlugin.banner`签名修改
  * 移除`data.basename`
  * 移除`data.query`
  * 迁移：从`filename`中抽出
* `SourceMapDevToolPlugin` 移除`lineToLine`
  * 迁移：没有替代
* `[hash]` 完整编译过程中不再支持hash 
  * 迁移：使用`[fullhash]`来替换其他的hash选项
* `[modulehash]`被移除
  * 迁移 使用`[hash]`来替代
* `[moduleid]`被废弃
  * 迁移：使用`[id]`来替代
* `[filebase]` 被移除
  * 迁移：使用`[base]`来替换
* 基于文件的模板使用新的占位内容（例如 SourceMapDevToolPlugin）
  * `[name]`
  * `[base]`
  * `[path]`
  * `[ext]`
* `externals` 当传入函数的时候，现在有不同的信号签名`({ context, request }, callback)`
  * 迁移：改变签名
* 新增`externalsPresets`
* 新增`experiments` (请参见前文的Experiments部分)
* 新增`watchOptions.followSymlinks`
* `watchOptions.ignored` 现在可以为正则表达式
* `webpack.util.serialization` 现在被暴露出来
## 默认配置的修改
* `target`现在默认值为`browserslist`(当浏览器列表配置有效的时候)
* `module.unsafeCache`现在默认只对`node_modules`有效
* `optimization.moduleIds`在生产环境下默认值为`deterministic`,而不是`size`
* `optimization.chunkIds`在生产环境下默认值为`deterministic`,而不是`total-size`
* `optimization.nodeEnv`在`none`模式下默认为`false`
* `optimization.splitChunks.minSize`在生产环境下默认为`20k`
* `optimization.splitChunks.enforceSizeThreshold`在生产环境下默认为`50k`
* `optimization.splitChunks` `minRemainingSize`默认为`minSize`
  * 这会使得剩余的部分非常小的时候，分割的chunk数目会更少
* `optimization.splitChunks` `maxAsyncRequests`和`maxInitialRequests`默认增加到30
* `optimization.splitChunks.cacheGroups.vendors`被重命名为`optimization.splitChunks.cacheGroups.defaultVendors`
* `optimization.splitChunks.cacheGroups.defaultVendors.reuseExistingChunk`默认设置为`true`
* `optimization.minimizer` 在简洁状态时目标默认使用`compress.passes: 2`
* 当使用缓存时，`resolve(Loader).cache`默认为`true`
* `resolve(Loader).cacheWithContext defaults`默认为`false`
* `resolveLoader.extensions`移除`.json`
* `node.global` `node.__filename`和`node.__dirname`在node-target时默认为`false`
* `stats.errorStack` 默认为`false`
# Loader相关改变
## this.getOptions
这个新的api将会简化loader的配置。允许传入一个JSON来校验，[查看详情](https://github.com/webpack/webpack/pull/10017)
## this.exec
这个方法在loader的上下文中被移除  
迁移：现在可以由loader本身去实现
## this.getResolve
在loader API总，`getResolve(options)`将会合并各个不同的配置，请见`module.rules resolve`.  
因为webpack5在不同的发布依赖项之间存在差异,所以建议传入`dependencyType`来作为配置(例如`"esm"`,`"commonjs"`)
# 主要的内部改变
以下的内容需要进一步调整
接下来的内容主要跟插件作者相关：
## 新的插件顺序
webpack 5的插件会在默认配置项生效之前生效。这使得插件能够使用他们自己的默认值，或者使用传入的配置值。
这是一个破坏性变更，因为插件不能依赖配置的值来生效了。  
迁移：只能在插件钩子中访问配置。或者最好完全避免访问配置，并通过构造函数进行配置。
## 运行时模块
大量的运行时代码现在被移动到所谓的运行时模块中。这些特殊的模块负责添加运行时代码。他们将会被加入任何chunk中，并且总是会被加入到运行时chunk中。控制运行时模块的"运行时的需求"被添加到打包文件中。这将确保只有运行时代码会被添加到打包文件中。在未来，运行时模块将会被添加到一个需要被加载的chunk中，以便在需要的时候加载运行时代码。  
在绝大多数情况下，核心的运行时逻辑允许在入口模块中插入行内内容，而不是调用`__webpack_require__`.如果在打包文件中没有其他的模块了，根本就不需要`__webpack_require__`。这很好地结合了模块连接（多个模块合并到一个模块）。  
在理想状态下，是根本不需要运行时代码的。  
迁移：如果你通过wepack插件在运行时中注入代码，可以考虑通过运行时模块来替换。
## 序列化
现在新增了序列化的机制，以便webpack中的能够对复杂对象进行序列化。语义化是可选的，所以需要被序列化的class需要被明确标记（他们的序列化已经实现）所有的模块，依赖和部分错误都已经完成了序列化。  
迁移：当使用通过模块或者一来的时候，这里推荐使用序列化以便应用持久化缓存
## 缓存插件
添加了一个带有插件接口的缓存类。这个雷能够被用来对缓存进行读写。根据配置，不同的插件将会给缓存添加不同的功能。插件`MemoryCachePlugin`添加了内存缓存。`FileCachePlugin`将会添加持久化（文件系统）缓存。  
`FileCachePlugin`使用序列化机制来从磁盘整持久化和存储缓存对象  
## Object Frozen添加钩子
带有钩子的类冻结了它们的hooks对象，因此不再能用这种方式添加自定义钩子  
迁移：现在推荐使用WeakMap和一个静态的`getXXXHooks(XXX)`（比如：`getCompilationHook(compilation)`）方法来添加通用钩子。内部的类使用同样的机制来处理通用的钩子。
## tapable升级
为了webpack 3设置的兼容层被删除了。在webpack 4中也被废弃。部分不太常使用tapable api的被删除或废弃。  
迁移：使用新的tabpable API
## 分阶段的钩子
在封装过程的几个阶段，有各个不同的钩子来处理这些不同的阶段，例如`optimizeDependenciesBasic` `optimizeDependencies`和`optimizeDependenciesAdvanced`。为了使单个钩子能够使用`stage`选项，这些钩子已经被移除了。请查找`OptimizationStages`来获取更多的可选stage值。  
迁移：请使用剩下的hook来替代，你可以添加`stage`选项。
## Main/Chunk/ModuleTemplate 被废弃
构建模板被重构了。MainTemplate/ChunkTemplate/ModuleTemplate已经被废弃，JavascriptModulesPlugin 现在负责js的模板化。  
在重构之前，JS的输出被Main/ChunkTemplate控制，其他输出（比如WASM,CSS）被插件控制。看起来JS像是第一等公民，其他的输出是第二等公民。重构带来的变化是所有的输出都被他们各自的插件控制。  
现在一人可以介入到模板生成的过程中。这些钩子现在在JavascriptModulesPlugin中，而不是Main/ChunkTemplate(现在插件也支持hooks了，我称其为附加钩子)   
现在有一个兼容层，所以Main/Chunk/ModuleTemplate依然存在，但只能将tap调用委托给新的钩子位置。  
迁移：遵循弃用消息中的建议。主要指向不同位置的钩子。  
## 入口描述符
如果一个对象作为入口的值被传入，那么他可能是字符串，数组裹着一个描述符：
```js
module.exports = {
  entry: {
    catalog: {
      import: './catalog.js',
    }
  }
}
```
描述符语法将会传入额外的选项。
### 入口输出文件名
在默认情况下，入口chunk的输出文件名是从`output.filename`中提取的，但是你可以对某个特殊的入口指定一个输出文件名。
```js
module.exports = {
  entry: {
    about: { import: './about.js', filename: 'pages/[name][ext]' }
  }
};
```
### 入口依赖
默认情况下，每一个入口chunk保存了它用到的所有模块，通过`dependOn` 选项，你可以在多个入口chunk键分享模块：
```js
module.exports = {
  entry: {
    app: { import: './app.js', dependOn: 'react-vendors' },
    'react-vendors': ['react', 'react-dom', 'prop-types']
  }
};
```
app的chunk将不会包括`react-vendors`包含的模块
### 入口库
入口描述符允许针对每个入口传入不同的`library`选项
```js
module.exports = {
  entry: {
    commonjs: {
      import: './lib.js',
      library: {
        type: 'commonjs-module'
      }
    },
    amd: {
      import: './lib.js',
      library: {
        type: 'amd'
      }
    }
  }
};
```
### 入口运行时
入口描述符允许针对每个入口指定`runtime`。指定时，将创建一个具有此名称的块，该块仅包含项的运行时代码。当多个入口指定了同样的`runtime`,这些入口的chunk都会包含同样的运行时。这意味着他们能够使用同一个html页面。  
```js
module.exports = {
  entry: {
    app: {
      import: './app.js',
      runtime: 'app-runtime'
    }
  }
};
```
### 入口chunk加载
入口描述符允许对每一个入口指定`chunkLoading`.运行时的入口将会指定的方法使用这个来加载chunk.  
```js
module.exports = {
  entry: {
    app: {
      import: './app.js'
    },
    worker: {
      import: './worker.js',
      chunkLoading: 'importScripts'
    }
  }
};
```
## 顺序和ID
webpack过去在编译过程中会对modules和chunk进行排序，具体来说，指定一个增序的id。现在这个机制被废弃了。顺序将不会被用来作为id生成的机制，id的控制逻辑将全部交给插件。  
优化模块module和chunk排序的hooks被移除了。  
迁移：你在也不能在编译阶段依赖module和chunk的顺序了。
## 数组到集合
* Compilation.modules现在是一个集合(Set)
* Compilation.chunks现在是一个集合
* Chunk.files现在是一个集合
这里有兼容设计，目前会打印即将废弃warngin.  
迁移：请使用集合的相关方法来替换数组相关方法
## Compilation.fileSystemInfo
这个新的类能用来以缓存的方式获取文件系统相关的信息。现在，他能够请求文件和目录的时间戳。如果可能的话，时间戳的相关信息是从watcher中得来的，否则的话讲过从文件系统中获取。  
在未来，请求文件hash将会被添加，模块将能够通过文件内容而不是文件hash去检查文件的可用性。  
迁移：请使用`file/contextTimestamps`来替换`compilation.fileSystemInfo`.  
现在支持文件目录的时间戳，这使得上下文模块的序列化成为可能。  
现在引入了`Compiler.modifiedFiles`，使得能够获得改变文件的引用，（下一步会实现`Compiler.removedFiles`）
## 文件系统
在`compiler.inputFileSystem`和`compiler.outputFileSystem`之后，这里有一个新的`compiler.intermediateFileSystem`能够针对所有不被看做是输入或输出文件系统操作，比如写记录，缓存或者分析输出。  
文件系统现在有`fs`实例了，并且不再需要额外的方法，比如`join`或者`mkdirp`.但如果他们有类似于`join`和`dirname`的方法，则去使用。  
## 热更新模块替换
HMR 运行时现在已经被重构为运行时modules.`HotUpdateChunkTemplate`已经被合并到`ChunkTemplate`中。ChunkTemplates和插件现在需要控制`HotUpdateChunk`了。  
javascript部分的HMR运行时已经从核心的HMR运行时中分离开。其他的模块类型也能够以他们各自的方式来控制HMR.在未来，为了mini-css-extract-plugin和WASM的HMR将成为可能。  
迁移：因为这个一个新引入的特性，这里不需要迁移。  
`import.meta.webpackHot`和`module.hot`暴露了一样的API.这对严格模式下的ESM modules(.mjs,package.json中的'module',他们无法访问`module`)也是适用的.
## 工作队列
webpack过去通过函数调用函数来控制模块进程，这里还有一个`semaphore`来控制进程并行数。`Compilation.semaphore`现在被移除，现在通过一个异步的丢了来控制工作队列和进程，每一步都有一个分开的队列：  
* `Compilation.factorizeQueue`调用模块工厂函数来处理一组依赖
* `Compilation.addModuleQueue` 调价模块到编译队列（可能会从缓存中复原存储模块）
* `Compilation.buildQueue` 在需要的时候构建模块（可能会从缓存中复原模块）
* `Compilation.rebuildQueue` 如果手动出发的话，会再次构建模块
* `Compilation.processDependenciesQueue` 处理模块的依赖项
这些队列都是有一些钩子来观察或者监听任务的进度。  
在未来，多个编译器可能会同时工作，任务的协同可能通过监听这些队列来实现。  
迁移：因为这是一个新引入的功能，目前不需要迁移
## 日志上报
webpack内部现在有一些日志上报。`stats.logging`和`infrastructureLogging`选项能够用来开启日志信息。
## 模块和chunk图
webpack过去会存储依赖中已经解析的模块，存储已经包含在chunk中的模块。现在不会这样了，所有关于模块是如何被连接到模块图中的信息现在存储在ModuleGraph类中。还有关于模块是如何连接到chunks中的信息现在被存储在ChunkGraph类中。以来的相关信息（例如chunk图）也被存储在相关的类中。  
这意味着下面这些关于模块的信息可以被移除：  
* Module connections -> ModuleGraph
* Module issuer -> ModuleGraph
* Module optimization bailout -> ModuleGraph(todo: 检查是否需要用ChunkGraph来替换)
* Module usedExports -> ModuleGraph
* Module providedExports -> ModuleGraph
* Module pre order index -> ModuleGraph
* Module post order index -> ModuleGraph
* Module depth -> ModuleGraph
* Module profile -> ModuleGraph
* Module id -> ChunkGraph
* Module hash -> ChunkGraph
* Module runtime requirements -> ChunkGraph
* Module is in chunk -> ChunkGraph
* Module is runtime module in chunk -> ChunkGraph
* Chunk runtime requirement -> ChunkGraph
wepack过去会在从缓存中恢复modules的时候断掉模块和graph的链接。现在不再必要了。模块不存储有关图的信息，因为技术上可以在多个图中使用复用相关信息。这更加方便缓存。  
对于绝大多数的改动，这里有兼容层，在使用的时候会打印api废弃的信息。  
迁移：使用ModuleGraph和ChunkGraph中的新api
## 初始碎片化
`DependenciesBlockVariables`已被移除，取而代之的是initFragments.  
`DependencyTemplates`现在可以通过添加`initFragments`将代码注入到模块源的顶层，`InitFragments`允许复写。  
迁移：使用`InitFragments`，而不是在源码中插入负索引。  
## 模块的源类型
模块现在必须通过`Module.getSourceTypes()`定义是什么类型的源是支持的.根据这个机制，不同的插件通过不同的类型来调用`source()`。例如，对于源类型`javascript`,`JavascriptModulesPlugin`将源码嵌入到打包文件中。源码类型`webassembly`将会使得`WebAssemblyModulesPlugin`输出一个wasm文件。常见的源码类型都是支持的，例如`mini-css-extract-plugin`将会用来支持`stylesheet`,将源码插入到css文件中。  
模块类型和源码类型之间没有必然联系。例如模块类型`json`可以使用`javascritp`类型，模块类型`webassembly/experimental`可以使用源码类型`javascript`和`webassembly`.  
迁移：常用的模块需要去实现这些新的接口方法。
## Stats相关插件
Stats`preset`,`default`,`json`和`toString`现在刚出现在在插件系统中（译者注：此处翻译不大确定）。将当前的Stats转换为插件。  
迁移：并不需要完全替换状态函数，你可以兼容它。额外的信息能够添加到stats json中，而不是写一个单独的文件。
## 新的watching
webpack的观察者被重构了。先前使用`chokidar`和原生的`fsevents`依赖（只在macOS）.现在只依赖原生的Node.js`fs`。这意味着在webpack没有原生依赖了。  
在watching的时候还会捕获文件系统的信息。webpack现在也会捕获mtimes,同时监视事件的次数。由此，`WatchFileSystem`API有些许调整。因为我们把Array转换为集合，把对象转换为Map。   
## 在emit之后SizeOnlySource 
webpack现在会将`Compilation.assets`中的源替换为`SizeOnlySource`的变体，以便减少内存的使用。  
## 多次发送assets
警告`Multiple assets emit different content to the same filename`现在会成为一个error.
## 导出信息
模块导出信息的存储方式在新版本中进行了重构。ModuleGrap现在在`module`中都有一个`ExportsInfo`,每一个输出都会储存对应的信息。如果模块在使用过程中有副作用，webpack会存储位置导出的信息。  
针对每一个导出，如下的信息会被储存：
* 