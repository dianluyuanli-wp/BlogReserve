## 前言
&emsp;&emsp;dart语言的库及其相关语法是了解dart应用代码组织的基础。网上查找的相关资料往往只是涉及某几个点，很难有系统性的认识，这里笔者将结合一些文档和个人实践经验来对dart的库及其相关语法进行一个梳理。
## 库的引入
&emsp;&emsp;dart中，任意一个文件都会被认为是一个库，尽管其中可能并没有`library`标签，dart库目前的引入方式大致有三种：
* 引入dart语言的内置库：
```
import 'dart:math';
```
引入内置库时，在使用的uri中以`dart:`开头
* 引入pub包管理器提供库：
```
import 'package:flutter/material.dart';
```
在引用包管理器提供的库时，uri中以`package`开头
* 引入本地文件：
```
import './tools/network.dart';
```
引用本地文件时，uri字符串中直接填写文件的相对路径。
### 指定库的别名
两个库中如果存在相同的标识符，在使用时很有可能会产生冲突；或者在引入一个库的内容的时候，由于当前文件引入的库比较多，导致使用IDE工具提供的标识符名称联想时，很有可能出现一些本不是我们想要选取，但是首字母相近的内容，影响编码效率，为此我们可以使用给库指定别名的方法，来规避以上问题。
```
import 'package:socket_io_client/socket_io_client.dart' as IO;

class MySocketIO {
  IO.Socket mySocket;
  MySocketIO(this.mySocket);
}

```
### 只引入库的部分内容
如果只想引入库的部分内容，可以使用如下语法：
```
// Import only foo.
import 'package:lib1/lib1.dart' show foo;
```
如果想屏蔽库中的某些内容，不引入这部分：
```
// Import all names EXCEPT foo.
import 'package:lib2/lib2.dart' hide foo;
```
### 延迟加载或者异步加载
延迟加载一个库时，要使用`deferred as`来进行导入：
```
import 'package:greetings/hello.dart' deferred as hello;
```
在使用时，需要通用调用`loadLibrary()`来加载对应的内容
```
Future greet() async {
  await hello.loadLibrary();
  hello.printGreeting();
}
```
尽管你可能在项目中多次调用`loadLibrary()`来加载一个库，但是这个库也只会被加载一次。
## 编写一个库
库是代码复用和逻辑模块化的绝佳手段。库是以包的形式被创造和分发的。dart语言有两种类型的包：包含本地库的应用包([application packages](https://www.dartcn.com/tools/pub/glossary#application-package))和库包([library packages](https://www.dartcn.com/tools/pub/glossary#library-package)).  
* 应用包通常会依赖其他的包，但是绝不会有自引用，应用包的反面就是库包
* 库包是其他包的依赖对象，他们自己也会依赖其他包，亦有可能会自引用，它们中往往含有会直接运行的脚本，库包的反面就是应用包
### 编写一个库包

下图展示了一个最简单的库包组成结构：
![极简库包结构图](https://www.dartcn.com/assets/libraries/simple-lib2-81ebdc20fdb53d3abbc4364956141eb0f6f8f275d1636064fc3e1db959b93c1a.png)  
一个库所需的最简内容包括：  
1. pubspec file
`pubspec.yaml`文件在库包和应用包中是类似的，二者并没有区别。
2. lib 目录
正如你直觉感觉的那样，库的代码都在lib目录下，这部分内容对其他包也是可见的。如果需要的话，你可以在lib文件夹下创造其他层级的文件，按照惯例，逻辑实现的代码通常放在lib/src目录下。在该目录下的文件通常被认为是私有的。其他的包不应引入src目录下的内容从而暴露lib/scr中的API,


