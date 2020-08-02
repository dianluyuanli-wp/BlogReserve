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
## 代码实现
### 原始数据处理
如果参与比较的文件过大，公共部分的代码中过长的部分需要进行折叠，新增和移除的代码需要全量展示，基于这个逻辑，我们将需要展示的代码做如下划分：  
![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d636ebfdeefa4888a8e85e2590ea1ac5~tplv-k3u1fbpfcp-zoom-1.image)  
确定了我们的展示逻辑，接下来需要做的就是针对`diff`库处理之后的数据进行处理，相关代码如下：
```js
import React from 'react';
import { Upload, Button, Layout, Menu, Radio } from 'antd';
import s from './index.css';
import cx from 'classnames';
const { Content } = Layout;

const SHOW_TYPE = {
    UNIFIED: 0,
    SPLITED: 1
}

const BLOCK_LENGTH = 5;

export default class ContentDiff extends React.Component {
    state = {
        //  供渲染的数据
        lineGroup: [],
        //  展示的类型
        showType: SHOW_TYPE.UNIFIED
    }
    //  刷新供渲染的数据
    flashContent = (newArr) => {
        const initLineGroup = (newArr || this.props.diffArr).map((item, index, originArr) => {
            let added, removed, value, count;
            added = item.added;
            removed = item.removed;
            value = item.value;
            count = item.count;
            //  以\n为分隔符，将value分割成以行划分的代码
            const strArr = value?.split('\n').filter(item => item) || [];
            //  获得当前数据块的类型+标识新增 -表示移除 空格表示相同的内容
            const type = (added && '+') || (removed && '-') || ' ';
            //  定义代码块的内部结构，分为头部，尾部和中间的隐藏部分
            let head, hidden, tail;
            //  如果是增加或者减少的代码块，头部填入内容，尾部和隐藏区域都为空
            if (type !== ' ') {
                hidden = [];
                tail = [];
                head = strArr;
            } else {
                const strLength = strArr.length;
                //  如果公共部分的代码量过少，就统一展开
                if (strLength <= BLOCK_LENGTH * 2) {
                    hidden = [];
                    tail = [];
                    head = strArr;
                } else {
                    //  否则只展示代码块头尾部分的代码，中间部分折叠
                    head = strArr.slice(0, BLOCK_LENGTH)
                    hidden = strArr.slice(BLOCK_LENGTH, strLength - BLOCK_LENGTH);
                    tail = strArr.slice(strLength - BLOCK_LENGTH);
                }
            }
            return {
                //  代码块类型，新增，移除，或者没变
                type,
                //  代码行数
                count,
                //  内容区块
                content: {
                    hidden,
                    head,
                    tail
                }
            }
        });
        //  接下来处理代码的行数，标记左右两侧代码块的初始行数
        let lStartNum = 1;
        let rStartNum = 1;
        initLineGroup.forEach(item => {
            const { type, count } = item;
            item.leftPos = lStartNum;
            item.rightPos = rStartNum;
            //  移除代码和新增代码的两部分分开计算
            lStartNum += type === '+' ? 0 : count;
            rStartNum += type === '-' ? 0 : count;
        })
        this.setState({
            lineGroup: initLineGroup
        });
    }
    render() {
        return (
            //  ...
        )
    }
}
```
通过上述代码完成对原始数据的处理，将表示内容的数组中的对象划分为三种：`added`,`removed`和公共代码三种，并将内容分成head，hidden和tail三部分（主要是为了公共代码部分隐藏冗余的代码），然后计算代码块在对比显示时的初始行数行数,分栏(splited)和整合(unified)模式下都可使用。  
## 整合模式下的内容展示
接下来是整合模式的展示代码：
```js
export default class ContentDiff extends React.Component {
    state = {
        //  供渲染的数据
        lineGroup: [],
        //  展示的类型
        showType: SHOW_TYPE.UNIFIED
    }

    handleShowTypeChange = (e) => {
        this.setState({
            showType: e.target.value
        })
    }

    get isSplit() {
        return this.state.showType === SHOW_TYPE.SPLITED;
    }

    //  刷新供渲染的数据
    flashContent = (newArr) => {
        //  省略重复内容
    }

    paintCode = (item, isHead = true) => {
        const { type, content: { head, tail, hidden }, leftPos, rightPos} = item;
        const isNormal = type === ' ';
        const cls = cx(s.normal, type === '+' ? s.add : '', type === '-' ? s.removed : '');
        const space = "     ";
        return (isHead ? head : tail).map((sitem, sindex) => {
            let posMark = '';
            if (isNormal) {
                const shift = isHead ? 0: (head.length + hidden.length);
                posMark = (space + (leftPos + shift + sindex)).slice(-5)
                    + (space + (rightPos + shift + sindex)).slice(-5);
            } else {
                posMark = type === '-' ? this.getLineNum(leftPos + sindex) + space
                    : space + this.getLineNum(rightPos + sindex);
            }
            return <div key={(isHead ? 'h-' : 't-') + sindex} className={cls}>
                <pre className={cx(s.pre, s.line)}>{posMark}</pre>
                <div className={s.outerPre}><div className={s.splitCon}><div className={s.spanWidth}>{' ' + type + ' '}</div>{this.getPaddingContent(sitem, true)}</div></div>
            </div>
        })
    }

    getUnifiedRenderContent = () => {
        return this.state.lineGroup.map((item, index) => {
            const { type, content: { hidden }} = item;
            const isNormal = type === ' ';
            return <div key={index}>
                {this.paintCode(item)}
                {hidden.length && isNormal && this.getHiddenBtn(hidden, index) || null}
                {this.paintCode(item, false)}
            </div>
        })
    }
    render() {
        const { showType } = this.state;
        return (
            <React.Fragment>
                <div className={s.radioGroup}>
                    <Radio.Group value={showType} size='small' onChange={this.handleShowTypeChange}>
                        <Radio.Button value={SHOW_TYPE.UNIFIED}>Unified</Radio.Button>
                        <Radio.Button value={SHOW_TYPE.SPLITED}>Split</Radio.Button>
                    </Radio.Group>
                </div>

                <Content className={s.content}>
                    <div className={s.color}>
                        {this.isSplit ? this.getSplitContent()
                            : this.getUnifiedRenderContent()}
                    </div>
                </Content>
            </React.Fragment>
        )
    }
}
```



