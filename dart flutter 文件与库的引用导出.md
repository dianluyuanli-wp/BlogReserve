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
### 关于part library 和 part of
在具体业务中有以下痛点：我们在应用中定义了多个类或者其他方法，在引用时我们想只import一个文件就将相关内容全部导出，如果将所有的类或者方法都放在一个文件中，会导致这个文件十分庞杂，不利于后续维护。为了解决这个问题，我们可以使用`part`、`library`和`part of`来组织我们的代码。
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
正如你直觉感觉的那样，库的代码都在lib目录下，这部分内容对其他包也是可见的。如果需要的话，你可以在lib文件夹下创造其他层级的文件，按照惯例，逻辑实现的代码通常放在lib/src目录下。在该目录下的文件通常被认为是私有的。其他的包不应引入src目录下的内容从而暴露lib/scr中的API,正确的使用方法是从lib目录下的其他文件中引出内容。
### 组织一个库包
当你创建称为迷你库的小型独立库时，库包最容易维护、扩展和测试。在绝大多数情况下，每一个类应该都以一个迷你库的形式存在，除非两个类之间深度耦合。  
为了引出一个库中的公共api,建议在lib目录下创建一个'main'文件，方便使用者仅仅通过应用单文件来获取库中的所有功能。lib目录下也有可能包含其他可引入的库。例如，如果你的库可以跨平台工作，但是你创建了两个不同的子文件分别依赖dart:io和datr:html。部分包引用了不同的库，在引用这部分内容时需要给他们添加前缀。
接下来我们观察一个真实的库包：shelf,这个包提供了使用Dart语法创建库的服务器的方法，下图是其的结构：
![shelf库结构图](https://www.dartcn.com/assets/libraries/shelf-02e5fd43b660fcef7dbe6a883c40159e0379c8ee2088288ca60ed7dc8781bafd.png) 
在lib目录下的主文件shelf.dart暴露了lib/src下的其他文件中的内容给使用者：
```
export 'src/cascade.dart';
export 'src/handler.dart';
export 'src/handlers/logger.dart';
export 'src/hijack_exception.dart';
export 'src/middleware.dart';
export 'src/pipeline.dart';
export 'src/request.dart';
export 'src/response.dart';
export 'src/server.dart';
export 'src/server_handler.dart';
```
shelf包还包括一个迷你库，shelf_io,他对dart:io中的http请求体进行了简单的封装。
### 引入库文件
当你引用一个库文件的时候，你可以使用`package:`指令来指定该文件的URI。
```
import 'package:utilities/utilities.dart';
```
对于引用的文件和被引，文件当两个文件都在lib内部时，或者当两个文件都在lib外部时，可以使用相对路径导入库。当其中一个文件在lib目录内或者外部时，你必须使用`package:`。当你举棋不定的时候，可以直接会用`package:`,这种语法在两种情况下都可用。
下面的图展示了如何分别从lib目录和网络引入`lib/foo/a.dart`：
![文件引入示意图](https://www.dartcn.com/assets/libraries/import-lib-rules-e1777e235dd56aa23f770babcccedb6a12be80af2c3e63065640b889d78be595.png) 
### 提供其他文件（测试代码、命令行工具）
一个设计良好的库要便于测试。我们推荐你使用[test](https://github.com/dart-lang/test)包来编写测试用例，你可以把测试代码放在包的顶级目录中的`test`文件夹下。  
如果你给用户创建了命令行工具，请将它们放在`bin`文件夹下，以便用户可以直接通过[pub global activate](https://www.dartcn.com/tools/pub/cmd/pub-global#activating-a-package)命令来使用命令行工具。将命令行工具写在[executables section](https://www.dartcn.com/tools/pub/pubspec#executables)以便用户可以直接调用命令行代码而无需调用[pub global run](https://www.dartcn.com/tools/pub/cmd/pub-global#running-a-script-using-pub-global-run)方法.  
任何库自己私有的工具函数或代码（你不想暴露给使用者）,你可以将它们放在`tool`文件夹下。
关于其他你想要的推送到Pub站点的文件，例如README和CHANGELOG等等，你可以在[Publishing a Pageage](https://www.dartcn.com/tools/pub/publishing)中查阅具体内容。
### 给库编写注释
你可以使用[dartdoc](https://github.com/dart-lang/dartdoc#dartdoc)工具来给你的库添加API注释。Dartdoc将会解析你的源码，找到其中通过注释语法标记的内容，标记示例如下：
```
/// The event handler responsible for updating the badge in the UI.
void updateBadge() {
  ...
}
```
### 开源一个库
如果你想要开源一个库，建议你将其分享在[Pub site](https://pub.dev/).可以使用`pub publish`命令来上传或者更新一个库。pub site不仅仅存储你的库，它同时也会自动生成并且保存的你库的api引用文档。  
为了确保你的包的API文档生成正确，你可以遵循以下步骤：
* 在你推送你的包之前，运行[dartdoc](https://github.com/dart-lang/dartdoc#dartdoc)工具确保你的文档生成正确并且展示符合预期
* 在你推送你的包之后，检查Vesion tab去报你的文档生成正确
* 如果文档生成失败，检查dartdoc的输出

## 参考文献
* [dart语法中文站](https://www.dartcn.com/guides/language/language-tour#%E5%BA%93%E5%92%8C%E5%8F%AF%E8%A7%81%E6%80%A7)
* [创建一个库 英文原址](https://www.dartcn.com/guides/libraries/create-library-packages)


