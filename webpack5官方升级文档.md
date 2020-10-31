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
webpack 5在开发和生产模式中都开启了`sideEffects`优化。在webpack 4中，由于