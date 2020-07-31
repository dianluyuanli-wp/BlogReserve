# 前言
最近发现了一个比较好用的内容diff库(就叫[diff](https://www.npmjs.com/package/diff))，非常方便js开发者实现文本内容的diff，既可以直接简单输出格式化的字符串比较内容，也可以输出较为复杂的changes数据结构，方便二次开发。这里笔者就基于这个库实现高仿github的文本diff效果。  
# 效果演示
实现了代码展开，单列和双列对比等功能。示例如下：  
![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/498bd148b66f45bebf5459ab95735e7d~tplv-k3u1fbpfcp-zoom-1.image)  
[代码演示站点](http://tangshisanbaishou.xyz/diff/index.html)  
# 如何实现
## 核心原理
最核心的文本diff算法，由`diff`库替我们实现，这里我们使用的是`diffLines`方法(关于diff库的使用，笔者有一篇[博文]()有详细介绍)。通过该库输出的数据结构，对其进行二次开发，以便类似gitHub的文件diff效果。
## 获取输入
这里我们的比较内容都是以字符串的形式进行输入。至于如何将文件转化成字符串，在浏览器端可以使用`Upload`进行文件上传，然后在获得的文件句柄上调用`text`方法，即可获得文件对应的字符串，类似这样：
```js
import React from 'react';
import { Upload } from 'antd';
//  不一定要用react和antd,就是表达下思路
class Test extends React.Fragment {
    changeFile = async (type, info) => {
        const { file } = info;
        const content = await file.originFileObj.text();
        console.log(content);
    }

    render() {
        <Upload
            onChange={this.changeFile.bind(null, 0)}
            customRequest={() => {}}
        >
            点我上传1
        </Upload>
    }
}
```
在`node`端就要方便很多了，调用`fs`（文件系统库），直接对文件流进行读取即可。  
## 输出结构分析
接下来我们看看`diffLines`的输出大致长什么样：  
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/380f7148954f49929101dfdc5bd195e8~tplv-k3u1fbpfcp-zoom-1.image)  
这里我们对输出结果进行分析，输出是一个数组，数组的对象有多个属性：  
* value: 表示代码块的具体内容  
* count: 表示该代码块的行数
* added: 如果该代码块为新增内容，其值为true
* removed： 如果该代码块表示移除的内容，其值为true  
到这里我们的实现思路已经大致成型：根据数组内容渲染代码块，以`\n`为分隔符，划分代码行，`added`部分标绿，`removed`部分标红，其余部分正常显示即可，至于具体的代码行数，可以根据`count`进行计算。


