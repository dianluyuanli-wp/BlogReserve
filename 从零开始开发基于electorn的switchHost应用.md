# 前言
市面上应该有不少切换window下域名映射的应用了，个人感觉这个功能实现起来应该不是很复杂，正好作为自己切入electron学习的机会。electron作为js生态在桌面应用的重磅应用，极大地拓展了js的边界(vsCode就是用electron开发的)。最为一个前端开发，补齐桌面端的开发短板也是很有意义的一件事。

# 开发目标
实现一个简单的桌面端switch host应用，windows中有一个文件`hosts`(路径通常是`C:\Windows\System32\drivers\etc\hosts`),该文件维护了一个域名和ip地址的映射。一般长这样：  
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f55963c594974d4eb649d40fb7a813d3~tplv-k3u1fbpfcp-zoom-1.image)  
向文件中的域名发出请求时，将会直接向对应的ip地址发送请求体，通常用来实现本地代理，搞前端开发的应该经常会这样操作。使用`#`作为注释标记。在开发过程中，需要经常切换本地和线上真实环境，频繁改动这个文件比较繁琐，这里开发桌面应用来简化这个过程，提高效率。最后的成品长这样:
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/11fa408b96cc4f42b00d4befe414672e~tplv-k3u1fbpfcp-zoom-1.image)  
项目地址放在文末

# 实现
## 什么是electron
electron是一套基于js的桌面应用开发套件，使用它可以帮助js开发者方便地开发桌面应用，使用js开发者熟悉的html,css,js文件来绘制页面，实现交互。在使用原生能力上，electron可以开放node的能力给开发者使用，从而获得系统级别的能力，electron也封装了一系列原生的api，方便开发者调用，从而跟操作系统和桌面UI等进行交互。简单来说，可以使用前端开发者熟悉的工具链，直接实现你想要的功能，electron帮你完成了后续的封装，生成可执行文件等工作。electron的原理并不复杂，chrome的v8引擎的强劲性能给了很多开发者无限的想象力，electron也受益于chrome,它相当于把你写的js应用放到一个浏览器里面执行，从而实现开发语言和UI实现上跟前端开发的无缝对接。
## electron光速入门
首先编写你自己的js应用，将其整合成一个html文件，类似这样(这里是index.html)：  
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Switch Host</title>
    <!-- https://electronjs.org/docs/tutorial/security#csp-meta-tag -->
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  </head>
  <body>
    <div id='main'></div>
  </body>
  <link rel="stylesheet" href="common.css" >
  <link rel="stylesheet" href="app.css" >
  <script src="app.bundle.js" type="text/javascript"></script>
  <script src="common.bundle.js" type="text/javascript"></script>
</html>
```
这可以看到，这里我把打包完成之后的文件和样式都通过内联的方式写在html文件里，我们app开发完之后的成品就长这样，然后安装`electron`(这里可能需要梯子，或者使用国内镜像源),接下来写一个electron启动文件`index.js`文件：  
```js
const { app, BrowserWindow } = require('electron')

function createWindow () {   
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // 并且为你的应用加载index.html
  win.loadFile('app/index.html')

  // 打开开发者工具
  win.webContents.openDevTools()
}

// Electron会在初始化完成并且准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(createWindow)

//当所有窗口都被关闭后退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 您可以把应用程序其他的流程写在在此文件中
// 代码 也可以拆分成几个文件，然后用 require 导入。
```
接下来在`package.json`中添加命令：
```json
  "scripts": {
    "start": "electron index",
  },
```
之后就可以开启你自己的应用了`npm run start`,正常的话，应该会在桌面弹出一个浏览器窗口，里面绘制的就是你`index.html`中的内容，这个html里面要实现什么逻辑就是你说了算。
## 业务逻辑
electron壳子的相关逻辑到这里就结束了，接下来我们转入业务逻辑的部分。这里笔者的工具链是ts+react(函数式组件hooks)+antd,通过node中的`fs`和`path`来读取文件，通过webpack将所有逻辑打包成js和css文件，将其内联到我们的`index.html`里面。接下来是业务逻辑，这里首先要做的就是从系统中读取`hosts`文件的内容，然后将其中的域名-ip映射一一提取出来，并抽象成一定的数据结构，方便后续处理，代码如下：  
```js
import React, { useState, useEffect, useReducer } from 'react';
import * as s from './index.css';
const fs = window.require('fs');
const path = window.require('path');
import { Form, Input, Switch, Modal, message, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { UploadFile, UploadChangeParam } from 'antd/lib/upload/interface';
import { EditOutlined, DeleteOutlined, FileAddOutlined } from '@ant-design/icons';

const SPLIT_CHAR = '\r\n';
const FormItem = Form.Item;
const EDIT_CONFIG = 'edit';
const ADD_CONFIG = 'add';

//  出于篇幅考虑，这里省略interface定义

//  全文匹配ip地址
const regx = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;
//  匹配输入框的ip地址
const singleReg = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/g;
function Panel() {
    //  读取配置文件路径
    const configPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

    function objReducer(state: T_infoObj, action: T_infoObj) {
        //  以前没有空对象，react还是以为是原始对象，会不触发更新
        return Object.assign({}, state, action);
    }
    const [infoObj, setInfo] = useReducer(objReducer, {
        textLines: [],
        detailObjArr: [] as Array<detailObj>,
    } as T_infoObj);

    function setMSReducer(state: modalStatus, action: modalStatus) {
        return Object.assign({}, state, action);
    }
    const [modStatus, setMS] = useReducer(setMSReducer, {
        showModal: false,
        modalType: EDIT_CONFIG,
        curIndex: 0,
    } as modalStatus);
    //  path.resolve('D:\\self\\eletron\\testApp', "content.txt");
    useEffect(() => {
        const TEXT_PATH = configPath; // 大文件存储目录
        const oldContent = fs.readFileSync(TEXT_PATH, 'utf-8');
        //  提取所有行
        const xxx = oldContent.split(SPLIT_CHAR);
        //  结果的结构体数组
        const yyy = xxx.map((item, index) => {
            //  匹配所有ip，返回数组
            const targetIps = item.match(regx) || [];
            //  根据目标ip,通常是首个，分裂行内容
            const splitRes = item.split(targetIps[0]);
            const first = splitRes[0].trim();
            const isValid = splitRes.length >= 2 && first.length <= 1;
            if (isValid) {
                return {
                    //  是否是符合语法的映射
                    isValid,
                    //  对应原始文件的第几行
                    index,
                    //  是数组中的第几个，后面会修改
                    objIndex: 0,
                    //  映射是否激活
                    able: first.length === 0,
                    //  对应的ip
                    ip: targetIps[0],
                    //  对应的域名
                    domain: splitRes[1].split('#')[0].trim()
                } as detailObj
            } else {
                return {
                    index,
                    isValid
                } as detailObj;
            }
        })
        setInfo({
            textLines: xxx,
            detailObjArr: yyy.filter(item => item.isValid).map((item, index) => Object.assign(item, { objIndex: index })) as Array<detailObj>
        })
    }, []);

    //  省略渲染的部分
    return ();
}
```
这里的处理思路是根据`hotsts`文件中的行尾换行符`\r\n`，将文件切为单行内容分别分析。通过正则表达式，提取出每行中可能存在的ip地址。通过匹配到的ip地址将行内容split,split的结果来判断该行是否是符合语法的域名-ip映射。这一系列操作完成后，获得两个变量供后续操作：`textLines`是一个数组，其内部保存`hotst`文件中每一行的内容，`detailObjArr`也是一个数组，内容是所有符合hosts文件配置语法的域名-ip映射抽象出的对象。具体定义详见源码