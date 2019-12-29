# 前言
&emsp;&emsp;使用一种语言编写各种应用的时候，横亘在开发者面前的第一个问题就是如何进行状态管理。在前端领域，我们习惯使用框架或者各种辅助库来进行状态管理。例如，开发者经常使用react自带的context,或者mobx/redux等工具来管理组件间状态。在大热的跨端框架flutter中，笔者将对社区中使用广泛的provider框架进行介绍。  
# 准备工作
## 安装与引入
[provider pub链接](https://pub.flutter-io.cn/packages/provider)  
官方文档宣称(本文基于4.0版本)，provider是一个依赖注入和状态管理的混合工具，通过组件来构建组件。  
provider有以下三个特点：
1. 可维护性，provider强制使用单向数据流  
2. 易测性/可组合性，provider可以很方便地模拟或者复写数据  
3. 鲁棒性，provider会在合适的时候更新组件或者模型的状态，降低错误率  

在pubspec.yaml文件中加入如下内容：  
```
dependencies:
  provider: ^4.0.0
```
然后执行命令`flutter pub get`,安装到本地。
使用时只需在文件头部加上如下内容：
```
import 'package:provider/provider.dart';
```
## 暴露一个值
如果我们想让某个变量能够被一个widget及其子widget所引用，我们需要将其暴露出来，典型写法如下：
```
Provider(
  create: (_) => new MyModel(),
  child: ...
)
```
## 读取一个值
如果要使用先前暴露的对象，可以这样操作
```
class Home extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    MyModel yourValue = Provider.of<MyModel>(context)
    return ...
  }
}
```
## 暴露和使用多个值（MultiProvider）
Provider的构造方法可以嵌套使用
```
Provider<Something>(
  create: (_) => Something(),
  child: Provider<SomethingElse>(
    create: (_) => SomethingElse(),
    child: Provider<AnotherThing>(
      create: (_) => AnotherThing(),
      child: someWidget,
    ),
  ),
),
```
上述代码看起来过于繁琐，走入了嵌套地狱，好在provider给了更加优雅的实现
```
MultiProvider(
  providers: [
    Provider<Something>(create: (_) => Something()),
    Provider<SomethingElse>(create: (_) => SomethingElse()),
    Provider<AnotherThing>(create: (_) => AnotherThing()),
  ],
  child: someWidget,
)
```
## 代理provider(ProxyProvider)
在3.0版本之后，有一种新的代理provider可供使用，`ProxyProvider`能够将不同provider中的多个值整合成一个对象，并将其发送给外层provider，当所依赖的多个provider中的任意一个发生变化时，这个新的对象都会更新。下面的例子使用`ProxyProvider`来构建了一个依赖其他provider提供的计数器的例子
```
Widget build(BuildContext context) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => Counter()),
      ProxyProvider<Counter, Translations>(
        create: (_, counter, __) => Translations(counter.value),
      ),
    ],
    child: Foo(),
  );
}

class Translations {
  const Translations(this._value);

  final int _value;

  String get title => 'You clicked $_value times';
}
```
## 各种provider
可以通过各种不同的provider来应对具体的需求
* `Provider` 最基础的provider,它会获取一个值并将它暴露出来  
* `ListenableProvider` 用来暴露可监听的对象，该provider将会监听对象的改变以便及时更新组件状态  
* `ChangeNotifierProvider` ListerableProvider依托于ChangeNotifier的一个实现，它将会在需要的时候自动调用`ChangeNotifier.dispose`方法  
* `ValueListenableProvider` 监听一个可被监听的值，并且只暴露`ValueListenable.value`方法  
* `StreamProvider` 监听一个流，并且暴露出其最近发送的值  
* `FutureProvider` 接受一个`Future`作为参数，在这个`Future`完成的时候更新依赖
# 项目实战
接下来笔者将以自己项目来举例provider的用法  
首先定义一个基类，完成一些UI更新等通用工作
```
import 'package:provider/provider.dart';

class ProfileChangeNotifier extends ChangeNotifier {
  Profile get _profile => Global.profile;

  @override
  void notifyListeners() {
    Global.saveProfile(); //保存Profile变更
    super.notifyListeners();
  }
}
```
之后定义自己的数据类
```
class UserModle extends ProfileChangeNotifier {
  String get user => _profile.user;
  set user(String user) {
    _profile.user = user;
    notifyListeners();
  }

  bool get isLogin => _profile.isLogin;
  set isLogin(bool value) {
    _profile.isLogin = value;
    notifyListeners();
  }

  String get avatar => _profile.avatar;
  set avatar(String value) {
    _profile.avatar = value;
    notifyListeners();
  }
```
这里通过`set`和`get`方法劫持对数据的获取和修改，在有相关改动发生时通知组件树同步状态。  
在主文件中，使用provider
```
class MyApp extends StatelessWidget with CommonInterface {

  MyApp({Key key, this.info}) : super(key: key);
  final info;
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    UserModle newUserModel = new UserModle();
    return MultiProvider(
      providers: [
        //  用户信息
        ListenableProvider<UserModle>.value(value: newUserModel),
      ],
      child: ListenContainer(),
    );
  }
}
```
接下来，在所有的子组件中，如果需要使用用户的名字，只需`Provider.of<UserModle>(context).user`即可，但是这样的写法看上去不够精简，每次调用时都需要写很长的一段开头`Provider.of<xxx>(context).XXX`很是繁琐，故而这里我们可以简单封装一个抽象类：
```
abstract class CommonInterface {
  String cUser(BuildContext context) {
    return Provider.of<UserModle>(context).user;
  }
}
```
在子组件声明时，使用`with`，来简化代码
```
class MyApp extends StatelessWidget with CommonInterface {
  ......
}
```
在使用时只需`cUser(context)`即可。
```
class _FriendListState extends State<FriendList> with CommonInterface {
  @override
  Widget build(BuildContext context) {
    return Text(cUser(context));
  }
}
```  
项目完整代码详见[本人仓库](https://github.com/dianluyuanli-wp/IChat_For_Flutter)

## 其他相关细节和常见问题（来自官方文档）
1. 为什么在`initState`中获取Provider会报错?  
不要在只会调用一次的组件生命周期中调用Provider,比如如下的使用方法是错误的
```
initState() {
  super.initState();
  print(Provider.of<Foo>(context).value);
}
```
要解决这个问题，要么使用其他生命周期方法（didChangeDependencies/build）
```
didChangeDependencies() {
  super.didChangeDependencies();
  final value = Provider.of<Foo>(context).value;
  if (value != this.value) {
    this.value = value;
    print(value);
  }
}
```
或者指明你不在意这个值的更新，比如
```
initState() {
  super.initState();
  print(Provider.of<Foo>(context, listen: false).value);
}
```
2. 我在使用`ChangeNotifier`的过程中，如果更新变量的值就会报出异常?   
这个很有可能因为你在改变某个子组件的`ChangeNotifier`时，整个渲染树还处在创建过程中。  
比较典型的使用场景是notifier中存在http请求
```
initState() {
  super.initState();
  Provider.of<Foo>(context).fetchSomething();
}
```
这是不允许的，因为组件的更新是即时生效的。  
换句话来说如果某些组件在异步过程之前构建，某些组件在异步过程之后构建，这很有可能触发你应用中的UI表现不一致，这是不允许的。  
为了解决这个问题，需要把你的异步过程放在能够等效的影响组件树的地方  
* 直接在你provider模型的构造函数中进行异步过程
```
class MyNotifier with ChangeNotifier {
  MyNotifier() {
    _fetchSomething();
  }

  Future<void> _fetchSomething() async {}
}
```
* 或者直接添加异步行为
```
initState() {
  super.initState();
  Future.microtask(() =>
    Provider.of<Foo>(context).fetchSomething(someValue);
  );
}
```
3. 为了同步复杂的状态，我必须使用`ChangeNotifier`吗?  
并不是，你可以使用一个对象来表示你的状态，例如把`Provider.value()`和`StatefulWidget`结合起来使用,达到即刷新状态又同步UI的目的.
```
class Example extends StatefulWidget {
  const Example({Key key, this.child}) : super(key: key);

  final Widget child;

  @override
  ExampleState createState() => ExampleState();
}

class ExampleState extends State<Example> {
  int _count;

  void increment() {
    setState(() {
      _count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Provider.value(
      value: _count,
      child: Provider.value(
        value: this,
        child: widget.child,
      ),
    );
  }
}
```
当需要读取状态时：
```
return Text(Provider.of<int>(context).toString());
```
当需要改变状态时：
```
return FloatingActionButton(
  onPressed: Provider.of<ExampleState>(context).increment,
  child: Icon(Icons.plus_one),
);
```
4. 我可以封装我自己的Provider么?  
可以，`provider`暴露了许多细节api以便使用者封装自己的provider，它们包括：`SingleChildCloneableWidget`、`InheritedProvider`、`DelegateWidget`、`BuilderDelegate`、`ValueDelegate`等  
5. 我的组件重建得过于频繁，这是为什么?  
可以使用`Provider.of`来替代`Consumer/Selector`.  
可以使用可选的`child`参数来保证组件树只会重建某个特定的部分
```
Foo(
  child: Consumer<A>(
    builder: (_, a, child) {
      return Bar(a: a, child: child);
    },
    child: Baz(),
  ),
)
```
在以上例子中，当`A`改变时，只有`Bar`会重新渲染，`Foo`和`Baz`并不会进行不必要的重建。  
为了更精细地控制，我们还可以使用`Selector`来忽略某些不会影响组件数的改变。
```
Selector<List, int>(
  selector: (_, list) => list.length,
  builder: (_, length, __) {
    return Text('$length');
  }
);
```
在这个例子中，组件只会在list的长度发生改变时才会重新渲染，其内部元素改变时并不会触发重绘。  

6. 我可以使用两个不同的provider来获取同一个类型的值吗?  
不可以，哪怕你给多个provider定义了同一个类型，组件也只能获取距离其最近的一个父组件中的provider的值.



