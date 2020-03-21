在开发小程序消息推送的过程中，ts语法检查未通过，显示`类型wx上不存在属性requestSubscribeMessage`  
![报错信息](https://img-blog.csdnimg.cn/20200314111515987.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpYW9odWxpZGFzaGFiaQ==,size_16,color_FFFFFF,t_70)  
当即怀疑是小程序api版本过低（requestSubscribeMessage最低从2.8.2版本开始支持），不支持此api,于是`npm i`升级小程序api版本，但是问题依然存在。此时怀疑是小程序开发工具版本不对，在小程序开发工具中更改配置  
![修改调试器版本](https://img-blog.csdnimg.cn/20200314111750211.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpYW9odWxpZGFzaGFiaQ==,size_16,color_FFFFFF,t_70)  
但是此时问题依然存在，遂查找node_modules中的定义  
![node_module中的定义](https://img-blog.csdnimg.cn/20200314112141994.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpYW9odWxpZGFzaGFiaQ==,size_16,color_FFFFFF,t_70)  
发现此时这里是存在定义的，此时查找`wx`的定义位置，发现其定义的路径在`typings\types\wx\lib.wx.api.d.ts`下，这其中的定义并没有随着npm包的更新同步，于是将`node_modules\miniprogram-api-typings\types\wx\lib.wx.api.d.ts`中的内容复制到对应文件下，问题解决
