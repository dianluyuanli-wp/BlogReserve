# 前言
在笔者的上一篇文章([基于react的前后端渲染实例讲解]())中，对react下前后端渲染的流程进行了一个介绍，同时留下了一个引子：如何优雅地实现前后端渲染的样式同构。由此我们引出了公共库`isomorphic-style-loader`,在这篇文章中，笔者将结合实例介绍该库在项目中的应用以及对其原理进行分析。
# 项目实战
这里我们以上一篇文章中的测试项目为基础，借助`isomorphic-style-loader`来实现前后端渲染的样式同构。仓库地址附在文末。项目的主干部分不变，具体的区别在于前端和后端渲染的入口文件以及业务组件。业务组件代码(`entry/component/index.js`)如下:
```js
import React from 'react';
import s from './color.css';
import withStyles from 'isomorphic-style-loader/withStyles';
import useStyles from 'isomorphic-style-loader/useStyles';
//  传统写法 class式组件亦可
function ShowComponent(props, context) {
    return <div className={s.color}>英雄的中国人民万岁！</div>
}
export default withStyles(s)(ShowComponent);
```
这里主要是借助库内提供的`withStyles`对我们的原始组件进行处理，后续样式标签的自动添加和删除都会通过库来实现。`isomorphic-style-loader`对react的hooks特性也进行了兼容，使用hooks组件的写法如下：
```js
//  省略部分依赖引用
//  react hooks 写法 
const ShowComponent = () => {
    useStyles(s);
    return <div className={s.color}>英雄的中国人民万岁万岁！</div>
}
export default ShowComponent;
```
在前端渲染的入口文件(`entry/index.js`)也要进行对应的处理：
```js
import React from 'react';
import ReactDom from 'react-dom';
import Com from './component';
import StyleContext from 'isomorphic-style-loader/StyleContext';

const insertCss = (...styles) => {
    const removeCss = styles.map(style => style._insertCss())
    return () => removeCss.forEach(dispose => dispose())
}
//  挂载组件
const mountNode = document.getElementById('main');

//  原始前端渲染 在html的节点上挂载组件
// ReactDom.render((
//     <Com />
// ),mountNode);

ReactDom.hydrate(
    <StyleContext.Provider value={{ insertCss }}>
      <Com />
    </StyleContext.Provider>,
    mountNode
);
```
这里通过react的`context`预发，给我们的入口组件包裹一个`StyleContext`，便于后续子组件调用`insertCss`方法，该方法负责实时在html文件中插入`style`标签以便跟新样式，该方法同时返回一个函数，用于在组件移除是同步删除样式标签。  
后端渲染的入口文件也要做类似处理