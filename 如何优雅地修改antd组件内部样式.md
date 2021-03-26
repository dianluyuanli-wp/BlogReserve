# 前言
在前端领域，antd无疑是react生态下使用最为广泛的UI类库，antd对常见的表单类输入组件进行了高度封装，带来开箱即用的便利性，但是与此同时，对其样式的控制也愈发困难。大家应该都有过被产品或者交互逼着修改antd样式的经历。次数多了，很难再通过"这是开源的控件，样式不好修改"搪塞过去。那么问题来了，如何优雅第修改antd的样式?
# 具体方法
经过探索，大致有以下几种思路：  
1. 直接添加类名或者style  
这个是最常规的方法，能够直接作用于当前的元素，但是有的时候我们会发现antd的组件最终在dom层中有很多的层级嵌套。仅仅使用对外层元素进行修改并且让子元素继承样式的方法并不能完全达成目的；这个时候很自然的想法就是使用css的选择器来检索下级元素，大致的代码逻辑如下：
```js
import s from './index.css';
import { Input, AutoComplete } from 'antd';
//  ...省略无关代码
    <div className={s.feeWrap}>
        <Input
            disabled
            value={lanWrap('Transfer fee')}
            addonAfter={fee}
            className={cx(s.feeInput, 'tInput')}/>
    </div>
```
css代码
```css
.feeInput .ant-input {
    background-color: #ffffff !important;
    font-size: .14rem;
    color: #555555  !important;
    user-select: none;
}
```
接下来我们来检测下成果。  
![第一种.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a5b89f6b1bf4a819027d11c9864fe77~tplv-k3u1fbpfcp-watermark.image)  
输入框的背景颜色并没有如我们预期地发生改变。接下来我们分析下具体原因，从上面的截图中可以看到，antd组件内部的css类名并没有被css module处理，但是我们的自定义样式是通过css module来实现的，导致dom没有办法匹配到正确的样式。我们来查看下webpack的配置：
```js
    module: {
        rules: [
                        {
                test: /(?<!antd)\.(css|scss)$/,
                exclude: /node_modules/,
                use: [
                    //MiniCssExtractPlugin.loader,
                    'style-loader',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: true,
                            namedExport: true
                        }
                    }
                ]
            },
            {
                //  专门处理antd的css样式
                test: /\.(less)$/,
                include: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                javascriptEnabled: true
                            }
                        }
                    }
                ],
            },
        ]
    }
```
从这里的配置我们可以看到，业务代码使用了css moudle,由于antd的组件使用less编写，这里我们使用了less loader来处理样式，less的部分没有开启css loader故而在dom中看得到的类名还是原始类名。当然，如果你的项目并没有启用css module,直接使用原始类名来控制样式，那就不存在这个问题了。  
2. 运用多种css文件打包策略
上文已经分析了问题的根源，接下来就是如何解决问题，最自然的思路就是针对这部分特殊的需求，采用特殊的css样式打包策略,简单来说就是针对antd组件的样式，在外面挂上一个常规的字符串类名，使用单独的css文件来控制样式，在打包的时候，对这种文件采取特殊的策略，即不启用css module，这样就跟antd组件的类名处理方式保持一致，就可以通过css的类名选择器来直接控制样式了。webpack配置如下  
```js
    module: {
        rules: [
            {
                //  为了给antd定制样式，使用非获取匹配，反向肯定预查，不使用css module
                //  文件名中包含antd字样的，不启用css module
                test: /(?<=antd)\.(css|scss)$/,
                exclude: /node_modules/,
                use: [
                    //MiniCssExtractPlugin.loader,
                    'style-loader',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: false,
                            namedExport: true
                        }
                    }
                ]
            },
            {
                //  文件名中不包含antd字样的，启用css module
                test: /(?<!antd)\.(css|scss)$/,
                exclude: /node_modules/,
                use: [
                    //MiniCssExtractPlugin.loader,
                    'style-loader',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: true,
                            namedExport: true
                        }
                    }
                ]
            },
        ]
    }
```
针对antd的特殊样式文件，我们其名为`index.antd.css`,使其不会被css module处理，代码我们做如下修改：
```js
import s from './index.css';
import './index.antd.css';

//  ...省略无关代码
            <div className={s.feeWrap}>
                <Input
                    disabled
                    value={lanWrap('Transfer fee')}
                    addonAfter={fee}
                    className={cx('feeInput', 'tInput')}/>
            </div>
```
在`index.antd.css`中有如下内容
```css
.feeInput .ant-input {
    background-color: #ffffff !important;
    font-size: .14rem;
    color: #555555  !important;
    user-select: none;
}
```
接下来我们看下效果：  
![第二步.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/42be9f97b1ca40bca9e3db19fd3b6997~tplv-k3u1fbpfcp-watermark.image)  
从这里我们可以看到，外围的`feeInput`类已经成功地通过类选择器修改了antd自带的`.ant-input`样式。    
3. 终极解决方案
问题解决了，但是实操过程过于繁琐，要多出来一个文件，还要新增webpack打包规则，不符合`less is more`的规则，那么有没有更好的方案呢?这里有一点可以注意下，css module针对全局的样式（使用`:global`包裹的），不会将类名进行hash化，换句话来说，我们可以利用这一点，将antd组件外部用来精细化控制样式的类定义在`:global`中，这样就避免了类名hash化，可以配合antd的类名规则，实现样式控制。具体代码如下：
```js
import s from './index.css';

//  ...省略无关代码
            <div className={s.feeWrap}>
                <Input
                    disabled
                    value={lanWrap('Transfer fee')}
                    addonAfter={fee}
                    className={cx('fee11Input', 'tInput')}/>
            </div>
```
js的代码不用引入专门的`index.antd.css`文件了，css文件这样改：
```css
:global(.fee11Input .ant-input) {
    background-color: #ffffff !important;
    font-size: .14rem;
    color: #555555  !important;
    user-select: none;
}
```
接下来我们看看效果：
![第三步.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cfe3bb013c6641e6a9d5122d2bd8bfa0~tplv-k3u1fbpfcp-watermark.image)  
效果如预期，完成了对antd组件内嵌样式的完美修改！没有第二种方案中引入多余文件的问题，简洁高效。


