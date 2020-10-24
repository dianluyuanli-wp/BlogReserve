还能咋办，赶紧删git仓库！
# 缘起
不久之前遇见了一件糟心事，开发一个小工具的时候，拿了公司本地项目里的文件来做测试，搞完之后忘记删除敏感文件，就把这个小工具的个人项目推送到了gitHub,结果没过半个小时，公司的it就来查水表了，气氛一度十分尴尬；还好只是一个简单文件，否则就要重刷LeetCode了。
# 怎样避免再次翻车
咋办呢?总不能时不时全文搜索敏感字符串吧?作为经常写个人项目的开发，为了避免这种问题再次出现，需要找到从根本上规避问题的方法。能不能在每次提交前自动检查仓库的内容，有敏感内容的时候就终止提交并报错呢？这个时候我想到了`git-hook`,之前听说过这个工具，但是始终没有实操过，这次正好是一个好机会。  
在每次提交commit的时候，git工具有一套生命周期方法，会依次调用，可以给开发者暴露出来进行一些操作。可以在`.git/hooks`目录下查看：  
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a872f4107548406681de1096580b8ce6~tplv-k3u1fbpfcp-watermark.image)  
大家可以看到`commit-msg`,`pre-commit`等等的钩子，文件的后缀名是sample,这个时候脚本文件并没有生效，要生效的话去掉`sample`后缀即可。钩子文件的本质是脚本，但是不限于sh脚本，你可以使用python,js等等你想要使用的语言，只要你的本机有这种语言的执行工具。在文件前第一行加上如下内容：
```
#!/usr/bin/env node
```
这个表示使用node来执行后续的脚本，python类型的脚本类似。
## 我的pre-commit
接下来的目标比较明确了，写一个我们自己的pre-commit脚本，每次提交之前自动检索当前仓库，如果含有敏感字符串，抛错，终止commit.
```js
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

//  字符串反转
function strReverse(str) {
    return str.split('').reverse().join('');
}
const sensitiveStr = ['敏感字符串1', '敏感字符串2'];
let errPath = [];

//  切换路径，默认在.git/hooks目录下执行
const rootPosition = path.resolve(__dirname, '..', '..');

//  获取所有的ignore文件
const ignores = fs.readFileSync(path.resolve(rootPosition, '.gitignore'), 'utf8')
    .split('\r\n').map(item => path.resolve(rootPosition, item));
//  把.git放到数组里面
ignores.push(path.resolve(rootPosition, '.git'));

function recurseDir(rootDir, cb) {
    //  如果是ignore的文件，直接返回
    if (ignores.includes(rootDir)) {
        return;
    }
    //  获取文件状态
    let currentTarget = fs.statSync(rootDir);
    if (currentTarget.isFile()) {
        //  是文件调回调
        cb(rootDir);
    } else {
        //  是文件夹，读取路径，递归
        const entries = fs.readdirSync(rootDir);
        entries.forEach(item => {
            recurseDir(path.resolve(rootDir, item), cb)
        })
    }
}

function noCompaneStr(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    sensitiveStr.forEach(item => {
        if (content.includes(item)) {
            errPath.push(filePath);
        }
    });
}

const currentPath = path.resolve(rootPosition);
recurseDir(currentPath, noCompaneStr);
if (errPath.length > 0) {
    console.log('当前文件存在敏感字符串，小心被查水表哦\n 有问题的文件:');
    errPath.forEach(item => {
        console.log(item);
    })
    //  非0退出码即为异常，打断后续流程
    process.exit(1);
}
console.log('通过敏感词校验');
```
这里讲解下核心思路，在项目的根目录下，递归遍历所有的文件，将文件读取成字符串的形式，在其中检索所有的敏感字符串，有的话将翻车的文件路径放入一个数组中。遍历结束后如果该数组为空，表示通过检测，否则执行`process.exit(1)`，process.ext输入不为0，就会中断后续的流程。这里再补充要注意的几个细节：git执行hook的路径是在`.git/hooks`下，脚本内部要注意文件路径；其次在遍历的时候，我们要屏蔽掉`.gitignore`中的内容，否则递归`node_modules`等不需要的文件夹非常消耗时间。在某个文件中插入敏感词，尝试提交commit,展现下结果:  
![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/94a5e1648b6444f592502144ec9497b4~tplv-k3u1fbpfcp-watermark.image)  
结果符合预期，现在总于可以放心大胆地推个人项目的代码了。



