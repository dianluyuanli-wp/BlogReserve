# 前言
自己在去年用ant design pro 创建了个后台服务的项目，当时创建的时候umi控制台提示是否使用antd 4,当时抱着尝鲜的想法选择了yes,结果项目跑起来之后，功能没有问题，但是打开后台后发现各种提醒你升级或者迁移的warning,类似这样：  
![](https://user-gold-cdn.xitu.io/2020/4/10/17161e0c6e63e776?w=930&h=682&f=png&s=109056)  
看着着实蛋疼，ant design pro 本质上是蚂蚁全家桶，结合了antd和umi的一整套后台项目解决方案，如果要解决这些warning,需要对整个项目进行系统升级(umi 2内部使用的还是antd 3版本的组件，哪怕你业务组件都改了，umi不升级警告还是存在的)。  
# 升级实战
## antd design pro 升级
这个升级最简单，根据官方文档的提醒，直接安装最新依赖：
```
npm i @ant-design/pro-layout --save
```
然后需要替换`BasicLayout`文件，这个直接参考[官网升级指南](https://pro.ant.design/docs/upgrade-v4-cn)即可，这里不赘述。
## umi 3 升级
接下来的重点是umi 从2升级到3，官网讲了大致的改动，但是具体的升级细节涉及的不多，这里我将结合官网指南和个人的项目来进行讲解：
首先umi3需要`node` 10.13以上，这个是前提,其次为了支持umi3的新别名`@@`需要修改`tsconfig.json`的配置,在`path`中增加如下内容：
```json
"paths": {
    "@/*": ["./src/*"],
    "@@/*": ["./src/.umi/*"]
}
```
接下来要修改项目的配置文件`config/config.ts`, 原先的配置文件:
```js
const plugins: IPlugin[] = [
  [
    'umi-plugin-react',
    {
      antd: true,
      dva: {
        hmr: true,
      },
      locale: {
        // default false
        enable: true,
        // default zh-CN
        default: 'zh-CN',
        // default true, when it is true, will use `navigator.language` overwrite default
        baseNavigator: true,
      },
      dynamicImport: {
        loadingComponent: './components/PageLoading/index',
        webpackChunkName: true,
        level: 3,
      },
      pwa: pwa
        ? {
            workboxPluginMode: 'InjectManifest',
            workboxOptions: {
              importWorkboxFrom: 'local',
            },
          }
        : false, // default close dll, because issue https://github.com/ant-design/ant-design-pro/issues/4665
      // dll features https://webpack.js.org/plugins/dll-plugin/
      // dll: {
      //   include: ['dva', 'dva/router', 'dva/saga', 'dva/fetch'],
      //   exclude: ['@babel/runtime', 'netlify-lambda'],
      // },
    },
  ],
  [
    'umi-plugin-pro-block',
    {
      moveMock: false,
      moveService: false,
      modifyRequest: true,
      autoAddMenu: true,
    },
  ],
];

export default {
  plugins,
  targets: {
    ie: 11,
  },
  //    省略部分内容...
}

```
umi2中的plugins被移除(即无需使用`umi-plugin-react`)，其中的配置项上提一层，修改后：
```js
import { defineConfig, utils } from 'umi';

export default defineConfig({
  hash: true,
  antd: {},
  dva: {
    hmr: true,
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  dynamicImport: {
    loading: '@/components/PageLoading/index',
  },
  targets: {
    ie: 11,
  },
  //    省略部分内容...
}
```
umi3中将原先plugins中的`pwa`配置去除，`umi-plugin-pro-block`、`umi-plugin-ga`、`umi-plugin-antd-theme`等插件都去除，同时最外层的配置需要使用umi3中最新的`defineConfig`进行处理，老版本中使用`slash2`这个包来处理windows下的css路径，新版本通过`umi.utils.winPath`来处理。这里还有几个关键点要注意：
* 配置中的lessLoaderOptions要替换成lessLoader  
* 配置中的cssLoaderOptions要替换为cssLoader  
* 删除了 routes、library、dll、hardSource、pwa、hd、fastClick、chunks，不可继续使用  
* 内置 dynamicImport、title、scripts、headScripts、metas 和 links 到 Umi 中，可继续使用  
关于配置文件的升级，还可以参考官方的`ant design pro 4`的默认[配置文件](https://github.com/ant-design/ant-design-pro/blob/master/config/config.ts)

`package.json`移除不需要的依赖：
```json
{
  "umi-plugin-antd-icon-config": "^1.0.2",
  "umi-plugin-ga": "^1.1.3",
  "umi-plugin-pro": "^1.0.3",
  "umi-types": "^0.5.9",
  "redux": "^4.0.1",
  "umi-plugin-antd-icon-config": "^1.0.2",
  "umi-plugin-antd-theme": "1.2.0",
  "umi-plugin-pro-block": "^1.3.2",
  "umi-plugin-react": "^1.14.10",
  "dva": "^2.6.0-beta.16"
}
```
添加新的依赖：
```json
{
  "@umijs/plugin-blocks": "^2.0.5",
  "@umijs/preset-ant-design-pro": "^1.0.1",
  "@umijs/preset-react": "^1.3.0",
  "@umijs/preset-ui": "^2.0.9"
}
```
`dva`、`redux`等库已经全部整合到了`umi`包中，原先那些包中引用的方法直接从`umi`中导入即可，不再需要引用上述提到的那些包。具体涉及的方法包括`connect`，`ConnectProps`, `getLocale`, `setLocale`，`formatMessage`，`Dispatch`，`Link`，`FormattedMessage`，`Reducer`，`Effect`，`AnyAction`等等。
## 业务代码调整
### 样式调整
除了上述提到的点，业务代码上还有部分改动，首先如果要在css里引用别名或第三方库，需要添加`~`前缀，例如：
```
# 别名
变 background: url(@/xx/xx.jpg)
为 background: url(~@/xx/xx.jpg)

# 第三方库
变 @import url(foo/bar.css);
为 @import url(~foo/bar.css);
```
### 部分方法调整
原先的umi中的`router`相关方法全部替换为`history`:
```js
import router from 'umi/router';
...
 router.push(`/account/${key}`);
...
```
变为：
```js
import { connect, history } from 'umi';
...
history.push(`/account/${key}`);
```
如果你运行项目，可能会有如下提醒：  
![](https://user-gold-cdn.xitu.io/2020/4/11/17167cf33976f2d4?w=951&h=227&f=png&s=29353)  
这个是由于umi3中针对国际化的相关语法有了变化，根据提醒，如果还使用老的`formatMessage`，在切换语言时可能页面UI不会跟着变化，需要使用新的`useIntl`或`injectIntl`，这两者都是umi3中的新方法，前者针对react 的hooks语法，后者针对class。以`useIntl`为例，原来的写法为：
```js
import { formatMessage } from 'umi3';
...
return(<ProLayout
    formatMessage={formatMessage}
>
...
</ProLayout>)
...
```
现在为：
```js
import { useIntl } from 'umi3';
const intl = useIntl();
...
return(<ProLayout
    formatMessage={intl.formatMessage}
>
...
</ProLayout>)
...
```
`injectIntl`的使用方法类似，可以去查找对应的api。  
## antd 4 升级
接下来的主要迁移工作在于antd 4，该版本中的很多组件重写或者使用了新的api,其中比较典型的就是最为常用的`Form`组件，`icon`组件也改变了引用的方式，能够显著减小打包体积。这里由于篇幅关系，不详细展开。表单迁移的注意事项详见[官方文档](https://ant.design/components/form/v3-cn/).`antd 4`的其他变化详见[迁移指南](https://ant.design/docs/react/migration-v4-cn)

# 参考文献
[ant design pro 4官方迁移文档](https://pro.ant.design/docs/upgrade-v4-cn)  
[ant design pro 中升级umi 3](https://pro.ant.design/docs/upgrade-umi3-cn)  
[umi 3 官方升级文档](https://umijs.org/docs/upgrade-to-umi-3#%E9%85%8D%E7%BD%AE%E5%B1%82)
[antd 4官方升级指南](https://ant.design/docs/react/migration-v4-cn)
