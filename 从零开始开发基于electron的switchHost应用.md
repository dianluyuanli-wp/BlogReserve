# 前言
市面上应该有不少切换window下域名映射的应用了，个人感觉这个功能实现起来应该不是很复杂，正好是自己切入electron学习的好机会。electron作为js生态在桌面端的重磅应用，极大地拓展了js的边界(vsCode就是用electron开发的)。最为一个前端开发，补齐桌面端的开发短板也是很有意义的一件事。

# 开发目标
实现一个简单的桌面端switch host应用，windows中有一个文件`hosts`(路径通常是`C:\Windows\System32\drivers\etc\hosts`),该文件维护了一个域名和ip地址的映射。一般长这样：  
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f55963c594974d4eb649d40fb7a813d3~tplv-k3u1fbpfcp-zoom-1.image)  
向文件中的域名发出请求时，将会直接向对应的ip地址发送请求体，通常用来实现本地代理，搞前端开发的应该经常会这样操作。使用`#`作为注释标记。在开发过程中，需要经常切换本地和线上真实环境，频繁改动这个文件比较繁琐，这里开发桌面应用来简化这个过程，提高效率。最后的成品长这样:
![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7e86adc660b480788f24eed8ada658b~tplv-k3u1fbpfcp-zoom-1.image)  
操作过后，配置文件中的内容也会更新,项目地址放在文末

# 实现
## 什么是electron
electron是一套基于js的桌面应用开发套件，使用它可以帮助js开发者方便地开发桌面应用，使用js开发者熟悉的html,css,js文件来绘制页面，实现交互。在使用原生能力上，electron可以开放node的能力给开发者使用，从而获得系统级别的能力，electron也封装了一系列原生的api，方便开发者调用，从而跟操作系统和桌面UI等进行交互。简单来说，可以使用前端开发者熟悉的工具链，直接实现你想要的功能，electron帮你完成了后续的封装，生成可执行文件等工作。electron的原理并不复杂，chrome的v8引擎的强劲性能给了很多开发者无限的想象力，electron也受益于chrome,它相当于把你写的js应用放到一个浏览器里面执行，从而实现开发语言和UI实现上跟前端开发工具链的无缝对接。
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
这可以看到，这里我把打包完成之后的文件和样式都通过内联的方式写在html文件里，打包完成之后的css和js文件跟这个html文件放在同一个目录下。我们app开发完之后的成品就长这样，然后安装`electron`(这里可能需要T子，或者使用国内镜像源),接下来写一个electron启动文件`index.js`文件：  
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
electron壳子的相关逻辑到这里就结束了，接下来我们转入业务逻辑的部分。这里笔者的工具链是ts+react(函数式组件hooks)+antd,通过node中的`fs`和`path`来读取文件，通过webpack将所有逻辑打包成js和css文件，将其内联到我们的`index.html`里面。
### 数据初始化
接下来是业务逻辑，这里首先要做的就是从系统中读取`hosts`文件的内容，然后将其中的域名-ip映射一一提取出来，并抽象成一定的数据结构，方便后续处理，代码如下：  
```js
import React, { useState, useEffect, useReducer } from 'react';
import * as s from './index.css';
//  注意，如果要引用node模块中的方法，需要这么写
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
    //  hooks，记录原始文件内容和抽象过后的数据对象
    function objReducer(state: T_infoObj, action: T_infoObj) {
        //  以前没有空对象，react还是以为是原始对象，会不触发更新
        return Object.assign({}, state, action);
    }
    const [infoObj, setInfo] = useReducer(objReducer, {
        //  记录每一行的文本
        textLines: [],
        //  由每一行内容抽象出来的对象组成数组
        detailObjArr: [] as Array<detailObj>,
    } as T_infoObj);

    useEffect(() => {
        const TEXT_PATH = configPath; // 大文件存储目录
        //  读取文件内容
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
            //  打上标记，说明是数组里的第几个
            detailObjArr: yyy.filter(item => item.isValid).map((item, index) => Object.assign(item, { objIndex: index })) as Array<detailObj>
        })
    }, []);

    //  省略渲染的部分
    return ();
}
```
这里的处理思路是根据`hotsts`文件中的行尾换行符`\r\n`，将文件切为单行内容分别分析。通过正则表达式，提取出每行中可能存在的ip地址。通过匹配到的ip地址将行内容split,split的结果来判断该行是否是符合语法的域名-ip映射。这一系列操作完成后，获得两个变量供后续操作：`textLines`是一个数组，其内部保存`hotst`文件中每一行的内容，`detailObjArr`也是一个数组，内容是所有符合hosts文件配置语法的域名-ip映射抽象出的对象。具体定义详见源码。
### UI绘制与交互逻辑
```js
//  省略重复代码
function Panel() {
    function setMSReducer(state: modalStatus, action: modalStatus) {
        return Object.assign({}, state, action);
    }
    //  用来控制modal显示的reducer
    const [modStatus, setMS] = useReducer(setMSReducer, {
        //  是否展示对话框
        showModal: false,
        //  对话框的类型：编辑或者新增
        modalType: EDIT_CONFIG,
        //  当前修改的是第几个抽象obj，方便修改
        curIndex: 0,
    } as modalStatus);

    //  切换switch,打开或者关闭某个配置，具体就是对没有一行删除行首的#或者添加#
    //  同时同步info.detailObjArr的内容，更新UI
    function changeSwitch(item: detailObj, value) {
        const { index, objIndex } = item;
        let finalStr = '';
        //  获得原始内容的副本
        let cpyLines = infoObj.textLines.slice(0);
        const allLength = infoObj.textLines.length;
        //  更新原始string，使用reduce,拼接成新的文本内容
        finalStr = infoObj.textLines.reduce((old, newItem, sindex) => {
            let newLine = newItem;
            //  到了修改的那一行
            if (sindex === index) {
                //  确定是添加还是去除注释，修改代码行
                const originContent = value ? newItem.slice(1) : ('#' + newItem);
                newLine = originContent + SPLIT_CHAR;
                cpyLines[index] = originContent;
            } else if (sindex !== (allLength - 1)) {
                newLine = newLine + SPLIT_CHAR;
            }
            return old + newLine;
        }, '');
        //  更新objArr
        const cpObjArr = infoObj.detailObjArr.slice();
        cpObjArr[objIndex].able = value;
        //  更新UI
        setInfo({
            textLines: cpyLines,
            detailObjArr: cpObjArr,
        })
        //  更新文件内容
        writeFile(finalStr);
    };
    //  写文件操作，覆盖原始文件内容
    function writeFile(content) {
        fs.writeFileSync(configPath, content);
    }
    //  校验修改后的内容是否符合语法
    function validateNewObj(obj) {
        const { ip, domain } = obj;
        return domain && ip.match(singleReg);
    }
    //  一个modal,删除某一项配置
    function deleteConfig(index) {
        Modal.confirm({
            title: '删除配置',
            content: (
              <div>确认删除本条配置?</div>
            ),
            onCancel() {},
            onOk() {
                //  获得副本
                const copyLines = infoObj.textLines.slice();
                const copyObjArray = infoObj.detailObjArr.slice();
                //  删除对应的内容
                copyLines.splice(infoObj.detailObjArr[index].index, 1);
                copyObjArray.splice(index, 1);
                //  写原始文件
                writeFile(copyLines.join(SPLIT_CHAR));
                //  更新数据与UI
                setInfo({
                    textLines: copyLines,
                    detailObjArr: copyObjArray,
                })
            }
        })
    }
    let newObj = {
        ip: '',
        domain: ''
    };
    //  改变输入框中的ip或者domain
    function changInfo(key, e) {
        newObj[key] = e.target.value;
    }
    //  点击确认时的回调
    function handleOk() {
        if (!validateNewObj(newObj)) {
            message.error('输入有误，请检查');
            return;
        }
        //  获得新字符串，本质是拷贝一个副本
        const newLines = infoObj.textLines.slice();
        //  获得新对象，拷贝一个副本
        const newObjArray= infoObj.detailObjArr.slice();
        //  判断功能，添加配置和修改配置走不同的分支
        if (modStatus.modalType === ADD_CONFIG) {
            //  代码行增加新内容
            newLines.push(`${newObj.ip}    ${newObj.domain}`);
            //  抽象数据添加新对象
            newObjArray.push({
                isValid: true,
                index: newLines.length - 1,
                able: true,
                ip: newObj.ip,
                objIndex: newObjArray.length,
                domain: newObj.domain,
            })

        } else {
            //  修改配置
            const { index, domain, ip } = infoObj.detailObjArr[modStatus.curIndex];
            //  替换文本行中的domain和ip
            const newContent = newLines[index].replace(domain, newObj.domain).replace(ip, newObj.ip);
            /// 更新文件内容
            newLines[index] = newContent;
            const targetObj = newObjArray[index];
            Object.assign(targetObj, newObj);
        }
        writeFile(newLines.join(SPLIT_CHAR));
        setInfo({
            textLines: newLines,
            detailObjArr: newObjArray,
        })
        //  关闭modal
        setMS({
            showModal: false
        })
    }
    function handleCancel() {
        setMS({
            showModal: false
        })
    }
    function showModalFuc(type, index = -1) {
        setMS({
            showModal: true,
            modalType: type,
            curIndex: index,
        })
    }
    //  弹出的对话框，新增和修改用的是同一个组件
    function getModal() {
        const { modalType, curIndex } = modStatus;
        newObj = { domain: infoObj.detailObjArr[curIndex]?.domain || '', ip: infoObj.detailObjArr[curIndex]?.ip || ''};
        return <Modal
            title={ modalType === EDIT_CONFIG ? '修改配置' : '新增配置'}
            visible={modStatus.showModal}
            onOk={handleOk}
            onCancel={handleCancel}
        >
            <Form {...layout} initialValues={{ domain: newObj.domain, ip: newObj.ip }}>
                <FormItem label='域名' name='domain' rules={[{ required: true }]}>
                    <Input onChange={changInfo.bind(null, 'domain')}/>
                </FormItem>
                <FormItem label='ip' name='ip' rules={[{ pattern: singleReg, message: '请输入正确的ip'}]}>
                    <Input onChange={changInfo.bind(null, 'ip')}/>
                </FormItem>
            </Form>
        </Modal>;
    }
    //  渲染主面板
    return <div className={s.name}>
        <div className={s.addWrapper}>
            <div className={s.aWord}>新增配置</div><FileAddOutlined onClick={showModalFuc.bind(null, ADD_CONFIG)}/>
        </div>
        {infoObj.detailObjArr.map((item, index) => {
            const { ip, domain, index: lineNum, able } = item;
            return (
                <div key={index} className={s.formWrapper}>
                    <FormItem label={`${able ? '关闭' : '开启'}映射`} >
                            <Switch onChange={changeSwitch.bind(null, item)} defaultChecked={able}/>
                            <span className={s.domainAndIp}>{domain}: {ip}</span>
                    </FormItem>
                    <div className={s.iconGroup}>
                        <EditOutlined onClick={showModalFuc.bind(null, EDIT_CONFIG, index)}/>
                        <div className={s.iSpan}/>
                        <DeleteOutlined onClick={deleteConfig.bind(null, index)}/>
                    </div>
                </div>
            );
        })}
        {getModal()}
    </div>
}
```
这里核心逻辑是渲染配置项并且实现交互过程，所有的修改和新添加配置的modal(对话框)共用同一个，通过传参的不同来决定渲染的具体内容。修改之后，同步更新原始的文件内容和抽象过后的配置数组。这里借用`antd`的能力实现了domain和ip输入的校验。当打开或者关闭开关时，原始文件和抽象配置数组也会有对应的变化，这里不再赘述。
### 项目打包，生成exe文件
业务逻辑完成之后，这里我们进入打包的逻辑，这里笔者推荐使用`electron-builder`，这个是业界广泛使用的`electron`打包器，配置很多，功能丰富。这里只跑一下流程，详情请查看文档。首先安装打包器`npm i electron-builder --save-dev`,这个包安装过程中，会继续下载一系列配套工具，这里也需要T子或者用国内的镜像源。然后再`package.json`中添加如下配置：  
```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "electron index",
    "build": "webpack --color --config webpack.config.js",
    //  新增构建指令
    "pack": "electron-builder",
  },
  //    打包配置  
  "build": {
      // app_id,随意填写
		"appId": "xxx.wss.app",
        //  输出目录位置
		"directories": {
			"output": "build"
		},
        //  windows系统下的配置
		"win": {
            //  生成安装文件
			"target": [
				"nsis",
				"zip"
			],
            "icon": "icon.ico"
		},
        //  打包内容
		"files": [
            //  app内容
			"app/**/*",
            //  启动文件
			"index.js"
		]
  },
}
```
注意，为了方便理解才加了注释，json文件里不允许有注释的。这里我们新增打包指令和相应的配置。运行指令`npm run pack`,进入build文件夹，最后的成品大概这样：  
![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b101595248c649b1b967a38cd25d51cd~tplv-k3u1fbpfcp-zoom-1.image)  
顺利的话点击exe文件安装即可。

# 总结
`electron`极大地拓展了前端在桌面端开发的空间，现在大厂中的桌面应用需求，很多都是以它为平台进行开发的，传统的桌面端应用开发已经比较少见（指的是简单应用）。以上只是非常基础的一个示例，`electron`自身提供了非常丰富的api,以它为桥梁，我们可以桌面操作系统进行非常丰富的交互，很多的细节都在官方文档中。笔者很早之前就想学习`electron`,不过没有合适的机会，这里借这个机会也上手了桌面端的开发，技术侧的学习就是这样，实操胜过一切。

# 参考链接
[electron官方文档](http://www.electronjs.org/docs)  
[electron-builder官方文档](https://www.electron.build/)  
[文中项目git地址](https://github.com/dianluyuanli-wp/switchHost)  


