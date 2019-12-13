# 问题场景
在用flutter进行真机调试时,一旦修改代码并触发真机热更新时会报如下错误：  
真机报错：  
![真机报错](https://img-blog.csdnimg.cn/20191213174825170.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpYW9odWxpZGFzaGFiaQ==,size_16,color_FFFFFF,t_70)
控制台报错：  
![控制台输出](https://img-blog.csdnimg.cn/2019121317465162.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3hpYW9odWxpZGFzaGFiaQ==,size_16,color_FFFFFF,t_70)
# 问题解决
这里发现同样的错误报了很多个，这里分析是在渲染列表是发生了无element的错误，查看控制台发现此处报错：  
```
  SingleMesCollection getUserMesCollection(String name) {
    return messageArray.firstWhere((item) => item.bothOwner.contains(name));
  }
```
就是一个普通的列表查找内容的操作，查询其api后发现firstWhere还可以接受第二个参数（orElse）作为无返回时的兜底,这里进行如下修改：  
```
  SingleMesCollection getUserMesCollection(String name) {
    return messageArray.firstWhere((item) => item.bothOwner.contains(name), orElse: () => new SingleMesCollection());
  }
```
至此问题解决
