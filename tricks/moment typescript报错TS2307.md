# 问题描述
最近在用typescript+antd(版本4+)+react进行项目开发，webpack打包的时候报如下错误：  
```
ERROR in [at-loader] ./node_modules/antd/lib/time-picker/index.d.ts:1:24
    TS2307: Cannot find module 'moment'.

ERROR in [at-loader] ./node_modules/antd/lib/calendar/index.d.ts:2:24
    TS2307: Cannot find module 'moment'.

ERROR in [at-loader] ./node_modules/antd/lib/date-picker/index.d.ts:2:24
    TS2307: Cannot find module 'moment'.

```
git moment官网下的issue发现如下描述：  
![](https://user-gold-cdn.xitu.io/2020/5/2/171d3824942ba027?w=838&h=319&f=png&s=29857)
简单来说可以理解为`2.25.0`的版本有点问题，回退到`2.24.0`就可以正常使用了

# 参考文献
[moment issue地址](https://github.com/moment/moment/issues/5486)