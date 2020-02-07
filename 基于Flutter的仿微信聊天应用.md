# 前言
&emsp;&emsp;作为当下风头正劲的跨端框架，flutter成为原生开发者和前端开发者争相试水的领域，笔者将通过一个仿微信聊天的应用，展现flutter的开发流程和相关工具链，旨在熟悉flutter的开发生态，同时也对自己的学习过程进行一个总结。笔者是web前端开发，相关涉及原生的地方难免有错漏之处，欢迎批评指正。项目代码库链接放在文末。
# 功能简介
1. 聊天列表
本应用支持用户直接点对点聊天，使用webSocket实现消息提醒与同步
好友列表页：  
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/4/17010441cd5a3312?w=1080&h=1920&f=png&s=86788" width="400" alt="image"/>
</div>
在聊天列表展示所有好友，点击进入聊天详情，未读消息通过好友头像右上角小红点表示。  
聊天页：  
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/4/170105ac0d97d6e2?w=1080&h=1920&f=png&s=222656" width="400" alt="image"/>
</div>  

2. 搜索页
用户可以通过搜索添加好友：
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/4/17010698be42dcb5?w=1080&h=1920&f=jpeg&s=108278" width="400" alt="image"/>
</div>  

3. 个人中心页  
该页面可以进行个人信息的修改，包括调整昵称，头像，修改密码等等,同时可以退出登录。
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/4/170106db7e67384c?w=1080&h=1920&f=png&s=93536" width="400" alt="image"/>
</div>  

# 工具链梳理
这里列举了本例中使用的几个关键第三方库，具体的使用细节在功能实现部分会有详解。
1. 消息同步与收发  
项目中使用webSocket同server进行通信，我的服务器是用`node`写的，webSocket使用`socket.io`来实现（详见文末链接）,`socket.io`官方最近也开发了基于dart的配套客户端库`socket_io_client`,其与服务端配合使用。由此可来实现消息收发和server端事件通知。  
2. 状态管理  
* 持久化状态管理  
持久化状态指的是用户名、登录态、头像等等持久化的状态，用户退出app之后，不用重新登录应用，因为登录态已经保存在本地，这里使用的是一个轻量化的包`shared_preferences`，将持久化的状态通过写文件的方式保存在本地，每次应用启动的时候读取该文件，恢复用户状态。  
* 非持久化状态 
这里使用社区广泛使用的库`provider`来进行非持久化的状态管理，非持久化缓存指的是控制app展示的相关状态，例如用户列表、消息阅读态以及依赖接口的各种状态等等。笔者之前也有一篇博文对`provider`进行了介绍[Flutter Provider使用指南](https://juejin.im/post/5e074e6cf265da339565f308)  
3. 网络请求  
这里使用`dio`进行网络请求，进行了简单的封装  
4. 其他  
* 手机桌面消息通知小红点通过`flutter_app_badger`包来实现，效果如下：  
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/5/1701592c0ff20a41?w=274&h=287&f=jpeg&s=103108" width="400" alt="image"/>
</div>  

* 修改用户头像时，获取本地相册或调用照相机，使用`image_picker`库来实现，图片的裁剪通过`image_cropper`库来实现  
* 网络图片缓存，使用`cached_network_image`来完成，避免使用图片时反复调用http服务
# 功能实现
1. 应用初始化
在打开app时，首先要进行初始化，请求相关接口，恢复持久化状态等。在main.dart文件的开头，进行如下操作：  
```
import 'global.dart';
...

//  在运行runApp,之间，运行global中的初始化操作
void main() => Global.init().then((e) => runApp(MyApp(info: e)));
```
接下来我们查看`global.dart`文件
```
library global;

import 'dart:convert';
import 'package:flutter/cupertino.dart';
import 'package:shared_preferences/shared_preferences.dart';
...
//  篇幅关系，省略部分包引用

// 为了避免单文件过大，这里使用part将文件拆分
part './model/User.dart';
part './model/FriendInfo.dart';
part './model/Message.dart';

//  定义Profile,其为持久化存储的类
class Profile {
  String user = '';
  bool isLogin = false;
  //  好友申请列表
  List friendRequest = [];
  //  头像
  String avatar = '';
  //  昵称
  String nickName = '';
  //  好友列表
  List friendsList = [];

  Profile();

  // 定义fromJson的构造方法，通过json还原Profile实例
  Profile.fromJson(Map json) {
    user = json['user'];
    isLogin = json['isLogin'];
    friendRequest = json['friendRequest'];
    avatar = json['avatar'];
    friendsList = json['friendsList'];
    nickName = json['nickName'];
  }
  //    定义toJson方法，将实例转化为json方便存储
  Map<String, dynamic> toJson() => {
    'user': user,
    'isLogin': isLogin,
    'friendRequest': friendRequest,
    'avatar': avatar,
    'friendsList': friendsList,
    'nickName': nickName
  };
}

//  定义全局类，实现初始化操作
class Global {
  static SharedPreferences _prefs;
  static Profile profile = Profile();

  static Future init() async {
    //  这里使用了shared_preferences这个库辅助持久化状态存储
    _prefs = await SharedPreferences.getInstance();

    String _profile = _prefs.getString('profile');
    Response message;
    if (_profile != null) {
      try {
        //  如果存在用户，则拉取聊天记录
        Map decodeContent = jsonDecode(_profile != null ? _profile : '');
        profile = Profile.fromJson(decodeContent);
        message = await Network.get('getAllMessage', { 'userName' : decodeContent['user'] });
      } catch (e) {
        print(e);
      }
    }
    String socketIODomain = 'http://testDomain';
    //  生成全局通用的socket实例，这个是消息收发和server与客户端通信的关键
    IO.Socket socket = IO.io(socketIODomain, <String, dynamic>{
      'transports': ['websocket'],
      'path': '/mySocket'
    });
    //  将socket实例和消息列表作为结果返回
    return {
      'messageArray': message != null ? message.data : [],
      'socketIO': socket
    };
  }
  //    定义静态方法，在需要的时候更新本地存储的数据
  static saveProfile() => _prefs.setString('profile', jsonEncode(profile.toJson()));
}
...
```
global.dart文件中定义了Profile类，这个类定义了用户的持久化信息，如头像、用户名、登录态等等，Profilet类还提供了将其json化和根据json数据还原Profile实例的方法。Global类中定义了整个应用的初始化方法，首先借助`shared_preferences`库，读取存储的json化的Profile数据，并将其还原，从而恢复用户状态。Global中还定义了saveProfile方法，供外部应用调用，以便更新本地存储的内容。在恢复本地状态后，init方法还请求了必须的接口，创建全局的socket实例，将这两者作为参数传递给main.dart中的runApp方法。global.dart内容过多，这里使用了`part`关键字进行内容拆分，UserModel等类的定义都拆分出去了，详见笔者的另一篇博文[dart flutter 文件与库的引用导出](https://juejin.im/post/5e17da38e51d4502044ec5a9)

2. 状态管理
接下来我们回到main.dart中，观察MyApp类的实现：
```
class MyApp extends StatelessWidget with CommonInterface {
  MyApp({Key key, this.info}) : super(key: key);
  final info;
  // This widget is the root of your application.
  //  根容器，用来初始化provider
  @override
  Widget build(BuildContext context) {
    UserModle newUserModel = new UserModle();
    Message messList = Message.fromJson(info['messageArray']);
    IO.Socket mysocket = info['socketIO'];
    return MultiProvider(
      providers: [
        //  用户信息
        ListenableProvider<UserModle>.value(value: newUserModel),
        //  websocket 实例
        Provider<MySocketIO>.value(value: new MySocketIO(mysocket)),
        //  聊天信息
        ListenableProvider<Message>.value(value: messList)
      ],
      child: ContextContainer(),
    );
  }
}
```
MyApp类做的做主要的工作就是创建整个应用的状态实例，包括用户信息，webSocket实例以及聊天信息等。通过`provider`库中的MultiProvider，根据状态的类型，以类似键值对的形式将状态实例暴露给子组件，方便子组件读取和使用。其原理有些类似于前端框架react中的Context,能够跨组件传递参数。这里我们继续查看UserModle的定义：
```
part of global;

class ProfileChangeNotifier extends ChangeNotifier {
  Profile get _profile => Global.profile;

  @override
  void notifyListeners() {
    Global.saveProfile(); //保存Profile变更
    super.notifyListeners();
  }
}

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

  ...省略类似代码

  BuildContext toastContext;
}
```
为了在改变数据的时候能够同步更新UI，这里UserModel继承了ProfileChangeNotifier类，该类定义了notifyListeners方法，UserModel内部设置了各个属性的set和get方法，将读写操作代理到Global.profile上，同时劫持set方法，使得在更新模型的值的时候会自动触发notifyListeners函数，该函数负责更新UI和同步状态的修改到持久化的状态管理中。  
3. 路由管理  
接下来我们继续梳理main.dart文件：
```
class ContextContainer extends StatefulWidget {
  @override
  _ContextContainerState createState() => _ContextContainerState();
}

class _ContextContainerState extends State<ContextContainer> with CommonInterface {
  //  上下文容器，主要用来注册登记和传递根上下文
  @override
  Widget build(BuildContext context) {
    //  向服务器发送消息，表示该用户已登录
    cMysocket(context).emit('register', cUser(context));
    return ListenContainer(rootContext: context);
  }
}

class ListenContainer extends StatefulWidget {
  ListenContainer({Key key, this.rootContext})
  : super(key: key);

  final BuildContext rootContext;
  @override
  _ListenContainerState createState() => _ListenContainerState();
}

class _ListenContainerState extends State<ListenContainer> with CommonInterface {
  //  用来记录chat组件是否存在的全局key
  final GlobalKey<ChatState> myK = GlobalKey<ChatState>();
  //  注册路由的组件，删好友每次pop的时候都会到这里，上下文都会刷新
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'Flutter Demo',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        //  配置初始路由
        initialRoute: '/',
        routes: {
          //    主路由  
          '/': (context) => Provider.of<UserModle>(context).isLogin ? MyHomePage(myK: myK, originCon: widget.rootContext, toastContext: context) : LogIn(),
          //    聊天页
          'chat': (context) => Chat(key: myK),
          //    修改个人信息页
          'modify': (context) => Modify(),
          //    好友信息页
          'friendInfo': (context) => FriendInfoRoute()
        }
      );
  }
}
```
这里使用ContextContainer进行了一次组价包裹，是为了保证向服务器登记用户上线的逻辑仅触发一次，在ListenContainer的MaterialApp中，定义了应用中会出现的所有路由页，`/`代表根路由，在根路由下，根据用户的登录态来选择渲染的组件:MyHomePage是应用的主页面，里面包含好友列表页，搜索页和个人中心页以及底部的切页tab，LogIn则表示应用的登录页
* 登录页：
<div align=center>
<img src="https://user-gold-cdn.xitu.io/2020/2/6/1701a8a9253485c5?w=1080&h=1920&f=png&s=70464" width="400" alt="image"/>
</div>  
其代码在login.dart文件中：

```
class LogIn extends StatefulWidget {
  @override
  _LogInState createState() => new _LogInState();
}

class _LogInState extends State<LogIn> {
  //    文字输入控制器
  TextEditingController _unameController = new TextEditingController();
  TextEditingController _pwdController = new TextEditingController();
  //    密码是否可见
  bool pwdShow = false;
  GlobalKey _formKey = new GlobalKey<FormState>();
  bool _nameAutoFocus = true;

  @override
  void initState() {
    _unameController.text = Global.profile.user;
    if (_unameController.text != null) {
      _nameAutoFocus = false;
    }
    super.initState();
  }

  @override
  Widget build(BuildContext context){
    //var gm = GmLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Container(
          alignment: Alignment.center,
          child: Text('登录'),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            autovalidate: true,
            child: Column(
              children: <Widget>[
                TextFormField(
                  //    是否自动聚焦
                  autofocus: _nameAutoFocus,
                  //    定义TextFormField控制器
                  controller: _unameController,
                  //    控制样式
                  decoration: InputDecoration(
                    //labelStyle: TextStyle(color: Colors.greenAccent),
                    labelText: 'UserName',
                    hintText: 'Enter your name',
                    //hintStyle: TextStyle(color: Colors.red),
                    prefixIcon: Icon(Icons.person)
                  ),
                  //    校验器
                  validator: (v) {
                    return v.trim().isNotEmpty ? null : 'required userName';
                  },
                ),
                TextFormField(
                  controller: _pwdController,
                  autofocus: !_nameAutoFocus,
                  decoration: InputDecoration(
                    // labelStyle: TextStyle(color: Colors.greenAccent),
                    // hintStyle: TextStyle(color: Colors.greenAccent),
                    labelText: 'PassWord',
                    hintText: 'Enter Password',
                    prefixIcon: Icon(Icons.lock),
                    //  控制密码是否展示
                    suffixIcon: IconButton(
                      icon: Icon(pwdShow ? Icons.visibility_off : Icons.visibility),
                      onPressed: () {
                        setState(() {
                        pwdShow = !pwdShow; 
                        });
                      },
                    )
                  ),
                  obscureText: !pwdShow,
                  validator: (v) {
                    return v.trim().isNotEmpty ? null : 'required passWord';
                  },
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 25),
                  child: ConstrainedBox(
                    constraints: BoxConstraints.expand(height: 55),
                    //  登录按钮
                    child: RaisedButton(
                      color: Theme.of(context).primaryColor,
                      onPressed: _onLogin,
                      textColor: Colors.white,
                      child: Text('Login'),
                    ),
                  ),
                )
              ],
            ),
          ),
        )
      )
    );
  }

  void _onLogin () async {
    String userName = _unameController.text;
    UserModle globalStore = Provider.of<UserModle>(context);
    Message globalMessage = Provider.of<Message>(context);
    globalStore.user = userName;
    Map<String, String> name = { 'userName' : userName };
    //  登录验证
    if (await userVerify(_unameController.text, _pwdController.text)) {
      Response info = await Network.get('userInfo', name);
      globalStore.apiUpdate(info.data);
      globalStore.isLogin = true;
      //  重新登录的时候也要拉取聊天记录
      Response message = await Network.get('getAllMessage', name);
      globalMessage.assignFromJson(message.data);
    } else {
      showToast('账号密码错误', context);
    }
  }
}
```
对这个路由页进行简单的拆解后，我们发现该页面的主干就三个组件，两个TextFormField分别用作用户名和密码的表单域，一个RaisedButton用做登录按钮。这里是最典型的TextFormField widget应用，通过组件的controller来获取填写的值，TextFormField的validator会自动对填写的内容进行校验，但要注意的是，只要在这个页面，validator的校验每时每刻都会运行，感觉很不智能。登录验证通过后，会拉取用户的聊天记录。  
* 项目主页  
继续回到我们的main.dart文件，主页的页面绘制内容如下：  
```
class MyHomePage extends StatefulWidget {
  MyHomePage({Key key, this.myK, this.originCon, this.toastContext})
  : super(key: key);
  //    标记聊天页的全局key
  final GlobalKey<ChatState> myK;
  final BuildContext originCon;
  final BuildContext toastContext;
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> with CommonInterface{
  int _selectedIndex = 1;

  @override
  Widget build(BuildContext context) {
    registerNotification();
    return Scaffold(
      appBar: AppBar(
        title: TitleContent(index: _selectedIndex),
      ),
      body: MiddleContent(index: _selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        items: <BottomNavigationBarItem>[
          BottomNavigationBarItem(icon: Icon(Icons.chat), title: Text('Friends')),
          BottomNavigationBarItem(
            icon: Stack(
              overflow: Overflow.visible,
              children: <Widget>[
                Icon(Icons.find_in_page),
                cUsermodal(context).friendRequest.length > 0 ? Positioned(
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  left: 15,
                  top: -2,
                ) : null,
              ].where((item) => item != null).toList()
            ),
            title: Text('Contacts')),
          BottomNavigationBarItem(icon: Icon(Icons.my_location), title: Text('Me')),
        ],
        currentIndex: _selectedIndex,
        fixedColor: Colors.green,
        onTap: _onItemTapped,
      ),
    );
  }
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index; 
    });
  }

  void registerNotification() {
    //  这里的上下文必须要用根上下文，因为listencontainer组件本身会因为路由重建，导致上下文丢失，全局监听事件报错找不到组件树
    BuildContext rootContext = widget.originCon;
    UserModle newUserModel = cUsermodal(rootContext);
    Message mesArray = Provider.of<Message>(rootContext);
    //  聊天信息
    if(!cMysocket(rootContext).hasListeners('chat message')) {
      cMysocket(rootContext).on('chat message', (msg) {
        String owner = msg['owner'];
        String message = msg['message'];
        SingleMesCollection mesC = mesArray.getUserMesCollection(owner);
        if (mesC.bothOwner == null) {
          mesArray.addItemToMesArray(owner, newUserModel.user, message);
        } else {
          cMesArr(rootContext).addMessRecord(owner, new SingleMessage(owner, message, new DateTime.now().millisecondsSinceEpoch));
        }
        //  非聊天环境
        if (widget.myK.currentState == null) {
          cMesCol(rootContext, owner).rankMark('receiver', owner);
        } else {
          //  聊天环境
          cMesCol(rootContext, owner).updateMesRank(cMysocket(rootContext), cUser(rootContext));
          widget.myK.currentState.slideToEnd();
        }
        updateBadger(rootContext);
      });
    }
    //  系统通知
    if(!cMysocket(rootContext).hasListeners('system notification')) {
      cMysocket(rootContext).on('system notification', (msg) {
        String type = msg['type'];
        Map message = msg['message'] == 'msg' ? {} : msg['message'];
        Map notificationMap = {
          'NOT_YOUR_FRIEND': () { showToast('对方开启好友验证，本消息无法送达', cUsermodal(rootContext).toastContext); },
          'NEW_FRIEND_REQ': () {
            cUsermodal(rootContext).addFriendReq(message);
          },
          'REQ_AGREE': () {
            if (cUsermodal(rootContext).friendsList.firstWhere((item) => item.user == message['userName'], orElse: () => null) == null) {
              cUsermodal(rootContext).friendsListJson.insert(0, { 'userName': message['userName'], 'nickName': message['nickName'], 'avatar': message['avatar'] });
              cUsermodal(rootContext).notifyListeners();
            }
          }
        };
        notificationMap[type]();
      });
    }
  }
}

class MiddleContent extends StatelessWidget {
  MiddleContent({Key key, this.index}) : super(key: key);

  final int index;

  @override
  Widget build(BuildContext context) {
    final contentMap = {
      0: FriendList(),
      1: FindFriend(),
      2: MyAccount()
    };
    return contentMap[index];
  }
}
```





