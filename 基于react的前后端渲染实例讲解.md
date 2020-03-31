# 前言
前端技术发展至今，开发者关注的焦点已经从功能和页面呈现效果的实现转变为对用户体验的极致追求。在最近几年间，后端（服务器端，通常指的是node）渲染的概念在业界广泛铺开。后端渲染打破了传统web页面等待服务器返回js文件，client再加载执行的工作流，由服务器直接返回渲染好部分内容的html文件，能够极大地提升用户体验（html文件返回即可展示，不再依赖其他文件的下载执行）。页面的后端渲染暨服务器直出几乎成为大厂标配，如何实现后端渲染也成为前端技术人员的刚需技能，在此笔者将结合一个简单的例子，来为大家讲解服务器端渲染的核心流程。
# 项目构建
## 工具链
为了营造一个尽可能真实的项目环境，笔者将从零开始构造一个测试项目，通过`express`搭建node服务器，并使用webpack打包业务代码，项目使用`react`。有相关基础的读者可以直接跳过这部分内容。
## 代码讲解
项目地址放在文末。首先是我们的服务器启动文件`bin/start.js`：
```javascript
var app = require('../app');
var debug = require('debug')('weather:server');
var http = require('http');

var webpack = require('webpack');
var webpackConfig = require('../webpack.config');
var compiler = webpack(webpackConfig);

// 在这里实现自动化打包观察
// const watching = compiler.watch({
//   aggregateTimeout: 300,
//   poll: undefined
// }, (err, stats) => {
//   //  console.log(stats)
// })

var port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

var server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
//  省略部分内容
```
这里的内容相对简单，使用node的`http`模块，依托我们的`app.js`文件，构造一个服务器并监听3001端口。  
接下来我们看看app的入口文件`app.js`:
```javascript
//  这个东西本质是服务器，根据前端的请求分发资源

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

var indexRouter = require('./router');

var app = express();
var ejs = require('ejs');

// view engine setup
//  这个模板引擎好像是必须设置的，express默认是jade
app.engine('.html', ejs.renderFile);
app.set('views', path.join(__dirname, 'view')); // 这里设定了渲染页面时候的默认路径，view/index
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//  这里放打包好的文件，告诉express在这里找资源
app.use(express.static(path.join(__dirname, 'dist')));

//  app.use第一个参数是路由，后面是回调
//  use和get的区别是use可以嵌套或者匹配多个规则，get就是单一的返回回调，也就是接口的写法
app.use('*.html', indexRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

```
该文件的职责是构造`express`服务，设置模板引擎并指定静态资源的位置，`app.set('views', path.join(__dirname, 'view'))`设置html文件存放位置，打包后的静态资源放置在`dist`文件夹下。所有对根目录和html文件的请求将通过`router.js`文件进行处理。接下来我们看看`router.js`文件：
```javascript
var express = require('express');
var router = express.Router();
const React = require('react');
const ReactSSR = require('react-dom/server');
const fs = require('fs');
const path = require('path');

//  后端渲染的模板文件
const template = fs.readFileSync(path.join(__dirname,'./view/server.html'),'utf8');
//  后端渲染需要插入的css内容
const cssContent = fs.readFileSync(path.join(__dirname,'./dist/serverEntry.css'));
//  后端渲染打包好的react组件代码
const ServerEntry = require('./dist/serverEntry.bundle.js');
/* GET home page. */
router.get('/', async function(req, res, next) {
  if (req._parsedOriginalUrl.query === 'useServer=1') {
    //  后端渲染
    const instance = React.createElement(ServerEntry.default);
    const appString = ReactSSR.renderToString(instance);
    res.send(template.replace('<app></app>',appString).replace('<style></style>', `<style>${cssContent}</style>`));
  } else {
    //前端渲染
    //  入口文件位置 ./entry/index.js 
    //  html文件 ./view/index.html
    res.render('index');
  }
});
module.exports = router;
```
这里的核心逻辑是根据路由来判断当前的渲染逻辑，如果路由中有`useServer=1`的query,就采用后端渲染逻辑，反之就是走前端渲染逻辑。前端渲染逻辑即传统的页面渲染流程：浏览器发起请求，服务器返回一个html文件，html文件中通过`<script>`和`<style>`标签加载后续所需要执行的脚本和样式文件，这二者都下载完成且执行完毕后，页面才会走完渲染的后续流程。前端渲染的html文件如下：
```html
<!-- <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> -->
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
<title>样式测试</title>
</head>
<style></style>
<body>
    <div id='main'></div>
</body>
<link rel="stylesheet" href="app.css" >
<script src="app.bundle.js" type="text/javascript"></script>
<script src="common.bundle.js" type="text/javascript"></script>
</html>
```
在文件尾部，引入了css样式文件和所需执行的脚本。这里的脚本是我们对入口文件进行webpack打包后产生的。`app.bundle.js`是我们的业务代码，`common.bundle.js`是我们的各种相关的框架和依赖代码，入口文件`./entry/index.js`：
```js
import React from 'react';
import ReactDom from 'react-dom';
import Com from './component';

//  挂载组件
const mountNode = document.getElementById('main');

//  在html的节点上挂载组件
ReactDom.render((
    <Com />
),mountNode);
```
入口文件的职责是通过`react-dom`的`render`方法把我们的业务组件挂载在页面id为`main`的节点下（参考html入口文件），在浏览器用户下载好这段脚本并执行后才会在
页面显示我们的业务组件。业务组件代码`./entry/component/index.js`如下:
```js
import React from 'react';
import s from './color.css';
//  传统写法
function ShowComponent(props, context) {
    return <div className={s.color}>英雄的中国人民万岁！</div>
}
export default ShowComponent;
```
这里没有什么特殊逻辑，很常见的react函数式组件（顺便弘扬下正能量），这里使用了css module。  
## 前后端渲染测试
之后对相关的文件进行打包，`webpack`配置文件（前端渲染webpack.config.js，客户端渲染webpack.server.config.js）详见源码,启动项目：  
### 前端渲染
![前端渲染](https://user-gold-cdn.xitu.io/2020/3/31/1712e341fe58f7a0?w=1604&h=384&f=png&s=71794)  
![前端渲染返回的htnl](https://user-gold-cdn.xitu.io/2020/3/31/1712e354ee3b1538?w=938&h=269&f=png&s=41670)  
这里可以发现，服务器返回html文件后，再下载相关的css和js依赖并执行脚本，完成组价的绘制，这里我们在chrome的开发工具中查看下载的html文件并选择`Preview`(预览)，可以看到最开始返回的html就是个白板，对用户而言看到的就是白屏。  
![前端渲染html预览](https://user-gold-cdn.xitu.io/2020/3/31/1712e3a0bba2c8e2?w=691&h=409&f=png&s=9267)  
接下来我们来看看后端渲染：  
### 后端渲染  
![后端渲染](https://user-gold-cdn.xitu.io/2020/3/31/1712e3f4a5b65696?w=1621&h=367&f=png&s=65768)  
![后端渲染返回的html](https://user-gold-cdn.xitu.io/2020/3/31/1712e40274c13f02?w=931&h=300&f=png&s=46662)  
这里我们看到服务器返回html文件后，浏览器并没有在下载其他的文件，所有的内容和样式都直接跟随html文件一同返回，类似的，我们查看html文件的`Preview`:  
![后端渲染html预览](https://user-gold-cdn.xitu.io/2020/3/31/1712e429d71fcd0a?w=659&h=269&f=png&s=8748)  
这里我们可以看到，由server直出的html内容一开始就是成品，用户最开始看到的是已经渲染好的web内容，体验有了质的飞跃。  
后端渲染之所以能够达到这样的效果，原理并不复杂。在客户端渲染时，我们首先读取页面的html模板（`./view/server.html`）：
```html
<!-- <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> -->
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
<title>后端渲染</title>
</head>
<style></style>
<body>
    <div id='main'><app></app></div>
</body>
</html>
```
之后我们通过`react-dom/server`下的`renderToString`方法，把我们的组件直接在server端解析成html能够识别的字符串，并替换模板中的`<app></app>`标签。
```js
    //  后端渲染
    const instance = React.createElement(ServerEntry.default);
    const appString = ReactSSR.renderToString(instance);
    res.send(template.replace('<app></app>',appString).replace('<style></style>', `<style>${cssContent}</style>`));
```
为了保证样式也能一并返回浏览器，我们也需要读取所需的css内容，并替换模板中的`<style></style>`标签，至此大功告成。

# 后记
这里只是一个极简的例子，主要是为了展示后端渲染的核心思想，真实的项目中使用还会有很多需要兼容和考虑的内容。后端渲染能够极大提升用户体验，但是对于服务器来说则是加重了自身的负担，毕竟原先只用返回静态文件即可，方便启用cdn加速，而后端渲染则意味着针对每个请求都要进行组件的渲染（这里也可以缓存，但是对于千人千面的内容来说，服务器的负担还是小不了）。  
[项目地址](https://github.com/dianluyuanli-wp/isoStyleTest/tree/pure) 注意：相关逻辑在`pure`分支,不在`master`上  

大家可能会觉得手动提取css文件并插入html模板中过于繁琐，这里推荐一个第三方库可以方便我们更加简洁地实现前后端渲染样式的同构[isomorphic-style-loader](https://www.npmjs.com/package/isomorphic-style-loader)，近期笔者也会出一篇关于这个库的使用方法和源码分析的文，敬请期待~

