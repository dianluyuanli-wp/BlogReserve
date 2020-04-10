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
首先为了支持umi3的新别名`@@`需要修改`tsconfig.json`的配置,在`path`中增加如下内容：
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
umi2中的plugins被移除，其中的配置项上提一层，修改后：
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
umi3中将原先plugins中的`pwa`配置去除，`umi-plugin-pro-block`、`umi-plugin-ga`、`umi-plugin-antd-theme`等插件都去除，同时最外层的配置需要使用umi3中最新的`defineConfig`进行处理