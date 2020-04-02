本人在开发过程中遇到这样一个问题，打算通过`useEffect`来初始化表单的默认值，这里使用的是react下的hooks Api,但是textArea的初始值始终无法设置成功：
```
import React, { useState, useEffect, useRef } from 'react';

//  文本框默认内容
const [textAreaContent, setText] = useState('sdc');

//  使用useEffect初始化表单
useEffect(() => {
    async function pageInfo() {
        const { data } = await getPageInfo();
        const { imgList, text } = JSON.parse(data[0]);
        setText(text);
    };
    pageInfo();
}, []);


//  显示部分
<Form>
    <FormItem label='内容' name={['user', 'pageContent']}>
        <TextArea value={textAreaContent} defaultValue={textAreaContent}/>
    </FormItem>
</From>
```
通过排查发现接口请求没有问题，使用hooks设置字符串的功能也正常，但就是无法设置textArea的默认值。甚至直接给TextArea的defaultValue和value写死字符串都无法生效。官网上有如下解释：
```
为什么 Form.Item 下的子组件 defaultValue 不生效？#  
当你为 Form.Item 设置 name 属性后，子组件会转为受控模式。因而 defaultValue 不会生效。你需要在 Form 上通过 initialValues 设置默认值。
```
[相关链接](https://ant.design/components/form-cn/)。  
可以参考官网的建议,或参考class实现下针对antd 表单组件的赋初始值方式：
```
    const { currentUser, form } = this.props;
    form.setFieldsValue(obj);
```
考虑到可能要通过form的setFieldsValue Api才能达到目的，于是对函数式组件进行改造：
```
import React, { useState, useEffect, useRef } from 'react';

const formRef = useRef(null);

//  文本框默认内容
const [textAreaContent, setText] = useState('sdc');

//  使用useEffect初始化表单
useEffect(() => {
    async function pageInfo() {
        const { data } = await getPageInfo();
        const { imgList, text } = JSON.parse(data[0]);
        formRef.current.setFieldsValue({
           user: {
             pageContent: text
           }
        })
        setText(text);
    };
    pageInfo();
}, []);


//  显示部分
<Form ref={formRef}>
    <FormItem label='内容' name={['user', 'pageContent']}>
        <TextArea />
    </FormItem>
</From>
```
这里通过`useRef`来获取antd form的实例，然后调用它的setFieldsValue，测试后发现TextArea初始值赋值成功