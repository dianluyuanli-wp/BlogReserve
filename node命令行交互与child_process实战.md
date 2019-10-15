# 1、 前言
&emsp;&emsp;随着项目的逐步膨胀和复杂，我们在实际的工程应用中会通过编写各种各样的脚本来提高效率，传统的方法是在项目的package.json文件中注册各种各样的命令，来完成打包，构建，打包分析等操作。类似于这样：  
```
{
  "name": "chat",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "babel-node ./bin/www",
    "build": "babel-node ./bundle",
    "dll-build": "webpack --color --config webpack.dll.config.js -p",
    "delete": "node ./script/delete",
    "build-ana": "babel-node ./bundle analyze",
    "cBuild": "webpack --color --config webpack.pro.config.js",
    "dBuild": "webpack --color --config webpack.config.js"
  },
  dependencies: {
      ...
  },
  devDependencies: {
      ...
  }
}
```
&emsp;&emsp;随着注册的操作越来越多，很多指令愈发的难以记忆，而且.json文件中不支持注释，使用上不够便捷。同时package.js主要针对的是js生态中的一些常见包文件和指令，针对.sh等其他语言的脚本不够友好，为此我们有必要编写自己的命令行交互工具，将常见操作整合，完善人机交互。

# 2、 命令行交互实战
## 1)、 带颜色输出
&emsp;&emsp;为了页面友好，我们可以使用'chalk'包来给我们的输出添加颜色。
```
const chalk = require('chalk');
const rWord = chalk.red;
rWord('hello world')
```
以上代码会输出红色文字。  
## 2)、 读取键盘输入
&emsp;&emsp;接下来的问题是如何使node能够接受用户输入，并根据输入内容来确定执行的操作。process 对象是一个全局变量，它提供有关当前 Node.js 进程的信息并对其进行控制。node中通过process这个全局对象，来暴露一些输入输出方法。process.stdin标准输入可以通过监听data事件，来获取用户输入,并通过回调来对输入进行处理。
```
const stdin = process.stdin;

stdin.on('data', callBack(data){
  console.log(data);
  ......
});
```
此处有个易错点，运行示例代码后会发现，stdin获取的用户输入，并不是字符串，而是Buffer对象，如果要做进一步处理，需要对获取的数据调用toString方法，再进行后续处理逻辑。需要注意，得到的字符串会自带换行符（因为输入确认要按Enter键）
## 3)、 通过child_process执行命令行或脚本文件
&emsp;&emsp;通常执行命令行交互主要有两种场景：直接执行命令和执行脚本文件，针对这两种场景，node中分别通过child_process(node自带，无需引入)的exec和execFile方法来实现。这二者用法如下：
```
child_process.exec(command[, options][, callback])

child_process.execFile(file[, args][, options][, callback])
```
具体来讲，exec将会开启一个shell,并且执行输入的命令，而execFile可以用来运行可执行文件，将会开启一个进程。  
可以使用child_process.exec('node xxx.js', callBack)来直接执行js文件,或shell命令行操作child_process.exec('ls', callBack)，如果需要执行.sh脚本，则可以这样child_process.execFile('xxx.sh', callBack);此处有一个坑点：如果是在windows下，通过git Bash等非原生linux环境来执行命令execFile时，系统会报错，可能是windows系统的问题。可以使用child_process.exec('bash xxx.sh', callBack)来替代。

# 3、代码实战
&emsp;&emsp;闲言少叙，直接贴笔者的实现代码：
```
const chalk = require('chalk');
const exec = require('child_process').exec;

const stdin = process.stdin;
const gWord = chalk.green;
const rWord = chalk.red;

//  通过数组记录菜单文案
const contents = ['1、show files tree', '2、say hello to the world', '3、Release Edition', '4、Export Out Files', '5、Exit'];
console.log(chalk.yellow('Choose what you want to do, enter number please:'));
contents.forEach(item => {
    // 使用chalk彩色输出
    console.log(gWord(item));
})
//stdin.resume();
//  监听标准输入流的data事件
stdin.on('data', async function(data) {
    //  输入获得的是buffer 对象，不能直接使用，否则会有问题，还要记得处理输入时带入的换行符
    const enterString = data.toString().slice(0, -2);
    //  如果输入不是数字，弹出提示语，并继续监听
    if (!/[0-9]+$/.test(enterString)) {
        console.log(rWord('Input Words is not Number!'));
        return ;
    }
    const funcMap = {
        1: () => getWrapperPromise('node script/allPath.js'),
        2: () => { console.log(rWord('hello World!')) },
        3: () => getWrapperPromise('bash ./script/relese.sh'),
        4: () => getWrapperPromise('bash ./script/export.sh'),
        5: () => {}
    }
    const targetFunc = funcMap[enterString];
    if (targetFunc) {
        //  通过promise包装异步操作，以便理顺执行顺序
        await targetFunc();
        enterString !== '5' && console.log(gWord('Complete Task!'));
        //  调用pause表示停止监听输入事件
        stdin.pause();
    } else {
        //  如果输入的数字不在范围内，输出提醒
        console.log(rWord('please enter valid number!'));
    }
})

//  将异步操作进行包裹，生成promise的函数
const getWrapperPromise = (script) => new Promise((resolve, reject) => {
    exec(script, function(error, stdout, stderr) {
        if(error) {
            console.error('error: ' + error);
            return;
        }
        //  输出开启的shell内输出的stdout输出流
        console.log(stdout);
        resolve();
        // console.log('stderr: ' + typeof stderr);
    })
});
```

---------------------------------------------------------------------------------------  
项目地址：https://github.com/dianluyuanli-wp/chat/blob/master/command.js