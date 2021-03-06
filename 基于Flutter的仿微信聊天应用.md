# 前言
&emsp;&emsp;作为当下风头正劲的跨端框架，flutter成为原生开发者和前端开发者争相试水的领域，笔者将通过一个仿微信聊天的应用，展现flutter的开发流程和相关工具链，旨在熟悉flutter的开发生态，同时也对自己的学习过程进行一个总结。笔者是web前端开发，相关涉及原生的地方难免有错漏之处，欢迎批评指正。项目代码库链接放在文末。
# 功能简介
1. 聊天列表
本应用支持用户直接点对点聊天，使用webSocket实现消息提醒与同步
好友列表页：  
![好友列表页](https://user-gold-cdn.xitu.io/2020/2/4/17010441cd5a3312?w=1080&h=1920&f=png&s=86788) 
在聊天列表展示所有好友，点击进入聊天详情，未读消息通过好友头像右上角小红点表示。  
聊天页：  
![聊天页](https://user-gold-cdn.xitu.io/2020/2/4/170105ac0d97d6e2?w=1080&h=1920&f=png&s=222656)  

2. 搜索页
用户可以通过搜索添加好友：
![搜索页](https://user-gold-cdn.xitu.io/2020/2/4/17010698be42dcb5?w=1080&h=1920&f=jpeg&s=108278)   

3. 个人中心页  
该页面可以进行个人信息的修改，包括调整昵称，头像，修改密码等等,同时可以退出登录。
![个人中心页](https://user-gold-cdn.xitu.io/2020/2/4/170106db7e67384c?w=1080&h=1920&f=png&s=93536)  

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
![小红点](https://user-gold-cdn.xitu.io/2020/2/5/1701592c0ff20a41?w=274&h=287&f=jpeg&s=103108)  

* 修改用户头像时，获取本地相册或调用照相机，使用`image_picker`库来实现，图片的裁剪通过`image_cropper`库来实现  
* 网络图片缓存，使用`cached_network_image`来完成，避免使用图片时反复调用http服务
# 功能实现
1. 应用初始化
在打开app时，首先要进行初始化，请求相关接口，恢复持久化状态等。在main.dart文件的开头，进行如下操作：  
> 为了避免文章充斥着大段具体业务代码影响阅读体验，本文的代码部分只会列举核心内容，部分常见逻辑和样式内容会省略，完整代码详见项目仓库  
```
import 'global.dart';
...

//  在运行runApp,之间，运行global中的初始化操作
void main() => Global.init().then((e) => runApp(MyApp(info: e)));
```
接下来我们查看`global.dart`文件
```dart
library global;

import 'dart:convert';
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
```dart
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
```dart
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
为了在改变数据的时候能够同步更新UI，这里UserModel继承了ProfileChangeNotifier类，该类定义了notifyListeners方法，UserModel内部设置了各个属性的set和get方法，将读写操作代理到Global.profile上，同时劫持set方法，使得在更新模型的值的时候会自动触发notifyListeners函数，该函数负责更新UI和同步状态的修改到持久化的状态管理中。在具体的业务代码中，如果要改变model的状态值，可以参考如下代码：  
```dart
    if (key == 'avatar') {
      Provider.of<UserModle>(context).avatar = '图片url';
    }
```
这里通过provider包，根据提供的组件context,在组件树中上溯寻找最近的UserModle,并修改它的值。这里大家可能会抱怨，只是为了单纯读写一个值，前面居然要加如此长的一串内容，使用起来太不方便，为了解决这个问题，我们可以进行简单的封装,在global.dart文件中我们有如下的定义：
```dart
//  给其他widget做的抽象类，用来获取数据
abstract class CommonInterface {
  String cUser(BuildContext context) {
    return Provider.of<UserModle>(context).user;
  }
  UserModle cUsermodal(BuildContext context) {
    return Provider.of<UserModle>(context);
  }
  ...
}
```
通过一个抽象类，将参数的前缀部分都封装起来，具体使用如下：
```dart
class testComponent extends State<FriendList> with CommonInterface {
    ...
    if (key == 'avatar') {
      cUsermodal(context).avatar = '图片url';
    }
}
```
3. 路由管理  
接下来我们继续梳理main.dart文件：
```dart
class ContextContainer extends StatefulWidget {
  //    后文中类似代码将省略
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
这里使用ContextContainer进行了一次组件包裹，是为了保证向服务器登记用户上线的逻辑仅触发一次，在ListenContainer的MaterialApp中，定义了应用中会出现的所有路由页，`/`代表根路由，在根路由下，根据用户的登录态来选择渲染的组件:MyHomePage是应用的主页面，里面包含好友列表页，搜索页和个人中心页以及底部的切页tab，LogIn则表示应用的登录页
* 登录页：
![登录页](https://user-gold-cdn.xitu.io/2020/2/6/1701a8a9253485c5?w=1080&h=1920&f=png&s=70464)  
其代码在login.dart文件中：

```dart
class LogIn extends StatefulWidget {
    ...
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
    //  初始化用户名
    _unameController.text = Global.profile.user;
    if (_unameController.text != null) {
      _nameAutoFocus = false;
    }
    super.initState();
  }

  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: ...
      body: SingleChildScrollView(
        child: Padding(
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
                  //    校验器
                  validator: (v) {
                    return v.trim().isNotEmpty ? null : 'required userName';
                  },
                ),
                TextFormField(
                  controller: _pwdController,
                  autofocus: !_nameAutoFocus,
                  decoration: InputDecoration(
                      ...
                    //  控制密码是否展示的按钮
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
                  child: ConstrainedBox(
                    ...
                    //  登录按钮
                    child: RaisedButton(
                      ...
                      onPressed: _onLogin,
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
```dart
class MyHomePage extends StatefulWidget {
    ...
}

class _MyHomePageState extends State<MyHomePage> with CommonInterface{
  int _selectedIndex = 1;

  @override
  Widget build(BuildContext context) {
    registerNotification();
    return Scaffold(
      appBar: ...
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
                      ...
                  ),
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
  //  注册来自服务器端的事件响应
  void registerNotification() {
    //  这里的上下文必须要用根上下文，因为listencontainer组件本身会因为路由重建，导致上下文丢失，全局监听事件报错找不到组件树
    BuildContext rootContext = widget.originCon;
    UserModle newUserModel = cUsermodal(rootContext);
    Message mesArray = Provider.of<Message>(rootContext);
    //  监听聊天信息
    if(!cMysocket(rootContext).hasListeners('chat message')) {
      cMysocket(rootContext).on('chat message', (msg) {
        ...
        SingleMesCollection mesC = mesArray.getUserMesCollection(owner);
        //  在消息列表中插入新的消息
        ...
        //  根据所处环境更新未读消息数
        ...
        updateBadger(rootContext);
      });
    }
    //  系统通知
    if(!cMysocket(rootContext).hasListeners('system notification')) {
      cMysocket(rootContext).on('system notification', (msg) {
        String type = msg['type'];
        Map message = msg['message'] == 'msg' ? {} : msg['message'];
        //  注册事件的映射map
        Map notificationMap = {
          'NOT_YOUR_FRIEND': () { showToast('对方开启好友验证，本消息无法送达', cUsermodal(rootContext).toastContext); },
           ...
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
查看MyHomePage的参数我们可以发现，这里从上级组件传递了两个BuildContext实例。每个组件都有自己的context，context就是组件的上下文，由此作为切入点我们可以遍历组件的子元素，也可以向上追溯父组件，每当组件重绘的时候，context都会被销毁然后重建。_MyHomePageState的build方法首先调用registerNotification来注册对服务器端发起的事件的响应，比如好友发来消息时，消息列表自动更新；有人发起好友申请时触发提醒等。其中通过`provider`库来同步应用状态,`provider`的原理也是通过context来追溯组件的状态。registerNotification内部使用的context必须使用父级组件的context，即originCon。因为MyHomePage会因为状态的刷新而重建，但事件注册只会调用一次，如果使用MyHomePage自己的context,在注册后组件重绘，调用相关事件的时候将会报无法找到context的错误。registerNotification内部注册了提醒弹出toast的逻辑，此处的toast的实现用到了上溯找到的MaterialApp的上下文，此处不能使用originCon，因为它是MyHomePage父组件的上下文，无法溯找到MaterialApp，直接使用会报错。  
底部tab的我们通过BottomNavigationBarItem来实现，每个item绑定点击事件，点击时切换展示的组件，聊天列表、搜索和个人中心都通过单个的组件来实现,由MiddleContent来包裹，并不改变路由。  
* 聊天页  
在聊天列表页点击任意对话，即进入聊天页：  
```dart
class ChatState extends State<Chat> with CommonInterface {
  ScrollController _scrollController = ScrollController(initialScrollOffset: 18000);

  @override
  Widget build(BuildContext context) {
    UserModle myInfo = Provider.of<UserModle>(context);
    String sayTo = myInfo.sayTo;
    cUsermodal(context).toastContext = context;
    //  更新桌面icon
    updateBadger(context);
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(cFriendInfo(context, sayTo).nickName),
        actions: <Widget>[
          IconButton(
            icon: Icon(Icons.attach_file, color: Colors.white),
            onPressed: toFriendInfo,
          )
        ],
      ),
      body: Column(children: <Widget>[
          TalkList(scrollController: _scrollController),
          ChatInputForm(scrollController: _scrollController)
        ],
      ),
    );
  }
  //    点击跳转好友详情页
  void toFriendInfo() {
    Navigator.pushNamed(context, 'friendInfo');
  }

  void slideToEnd() {
    _scrollController.jumpTo(_scrollController.position.maxScrollExtent + 40);
  }
}
```
这里的结构相对简单，由TalkList和ChatInputForm分别构成聊天页和输入框，外围用Scaffold包裹，实现用户名展示和右上角点击icon，接下来我们来看看TalkList组件：
```dart
class _TalkLitState extends State<TalkList> with CommonInterface {
  bool isLoading = false;

  //    计算请求的长度
  int get acculateReqLength {
      //    省略业务代码
      ...
  }
  //    拉取更多消息
  _getMoreMessage() async {
      //    省略业务代码
      ...
  }

  @override
  Widget build(BuildContext context) {
    SingleMesCollection mesCol = cTalkingCol(context);
    return Expanded(
            child: Container(
              color: Color(0xfff5f5f5),
              //    通过NotificationListener实现下拉操作拉取更多消息
              child: NotificationListener<OverscrollNotification>(
                child: ListView.builder(
                  itemBuilder: (BuildContext context, int index) {
                    //  滚动的菊花
                    if (index == 0) {
                        //  根据数据状态控制显示标志 没有更多或正在加载
                        ...
                    }
                    return MessageContent(mesList: mesCol.message, rank:index);
                  },
                  itemCount: mesCol.message.length + 1,
                  controller: widget.scrollController,
                ),
                //  注册通知函数
                onNotification: (OverscrollNotification notification) {
                  if (widget.scrollController.position.pixels <= 10) {
                    _getMoreMessage();
                  }
                  return true;
                },
              )
            )
          );
  }
}
```
这里的关键是通过NotificationListener实现用户在下拉操作时拉取更多聊天信息，即分次加载。通过widget.scrollController.position.pixels来读取当前滚动列表的偏移值，当其小于10时即判定为滑动到顶部，此时执行_getMoreMessage拉取更多消息。这里详细解释下聊天功能的实现：消息的传递非常频繁，使用普通的http请求来实现是不现实的，这里通过dart端的socket.io来实现消息交换(类似于web端的webSocket,服务端就是用node上的socket.io server实现的)，当你发送消息时，首先会更新本地的消息列表，同时通过socket的实例向服务器发送消息，服务器收到消息后将接收到的消息转发给目标用户。目标用户在初始化app时，就会监听socket的相关事件，收到服务器的消息通知后，更新本地的消息列表。具体的过程比较繁琐，有很多实现细节，这里暂时略去，完整实现在源码中。  
接下来我们查看ChatInputForm组件  
```dart
class _ChatInputFormState extends State<ChatInputForm> with CommonInterface {
  TextEditingController _messController = new TextEditingController();
  GlobalKey _formKey = new GlobalKey<FormState>();
  bool canSend = false;

  @override
  Widget build(BuildContext context) {
    return Form(
        key: _formKey,
        child: Container(
            color: Color(0xfff5f5f5),
            child: TextFormField(
                ...
                controller: _messController,
                onChanged: validateInput,
                //  发送摁钮
                decoration: InputDecoration(
                    ...
                    suffixIcon: IconButton(
                    icon: Icon(Icons.message, color: canSend ? Colors.blue : Colors.grey),
                        onPressed: sendMess,
                    )
                ),
            )
        )
    );
  }

  void validateInput(String test) {
    setState(() {
      canSend = test.length > 0;
    });
  }

  void sendMess() {
    if (!canSend) {
      return;
    }
    //  想服务器发送消息，更新未读消息，并更新本地消息列表
    ...
    // 保证在组件build的第一帧时才去触发取消清空内容
    WidgetsBinding.instance.addPostFrameCallback((_) {
        _messController.clear();
    });
    //  键盘自动收起
    //FocusScope.of(context).requestFocus(FocusNode());
    widget.scrollController.jumpTo(widget.scrollController.position.maxScrollExtent + 50);
    setState(() {
      canSend = false;
    });
  }
}
```
这里用Form包裹TextFormField组件，通过注册onChanged方法来对输入内容进行校验，防止其为空，点击发送按钮后通过socket实例发送消息，列表滚动到最底部，并且清空当前输入框。  
* 个人中心页  
```dart
class _MyAccountState extends State<MyAccount> with CommonInterface{
  @override
  Widget build(BuildContext context) {
    String me = cUser(context);
    return SingleChildScrollView(
      child: Container(
        ...
        child: Column(
          ...
          children: <Widget>[
            Container(
              //    通用组件，展现用户信息
              child: PersonInfoBar(infoMap: cUsermodal(context)),
              ...
            ),
            //  展示昵称，头像，密码三个配置项
            Container(
              margin: EdgeInsets.only(top: 15),
              child: Column(
                children: <Widget>[
                  ModifyItem(text: 'Nickname', keyName: 'nickName', owner: me),
                  ModifyItem(text: 'Avatar', keyName: 'avatar', owner: me),
                  ModifyItem(text: 'Password', keyName: 'passWord', owner: me, useBottomBorder: true)
                ],
              ),
            ),
            //  退出摁钮
            Container(
              child: GestureDetector(
                child: Container(
                  ...
                  child: Text('Log Out', style: TextStyle(color: Colors.red)),
                ),
                onTap: quit,
              ) 
            )
          ],
        )
      )
    );
  }

  void quit() {
    Provider.of<UserModle>(context).isLogin = false;
  }
}

var borderStyle = BorderSide(color: Color(0xffd4d4d4), width: 1.0);

class ModifyItem extends StatelessWidget {
  ModifyItem({this.text, this.keyName, this.owner, this.useBottomBorder = false, });
  ...

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      child: Container(
        ...
        child: Text(text),
      ),
      onTap: () => modify(context, text, keyName, owner),
    );
  }
}

void modify(BuildContext context, String text, String keyName, String owner) {
  Navigator.pushNamed(context, 'modify', arguments: {'text': text, 'keyName': keyName, 'owner': owner });
}
```
头部是一个通用的展示组件，用来展示用户名和头像，之后通过三个ModifyItem来展示昵称，头像和密码修改项，其上通过`GestureDetector`绑定点击事件，切换路由进入修改页。  
* 个人信息修改页(昵称)
效果图如下：  
![](https://user-gold-cdn.xitu.io/2020/2/11/1703470bae0bb16b?w=587&h=290&f=jpeg&s=62626)
```dart
class NickName extends StatefulWidget {
  NickName({Key key, @required this.handler, @required this.modifyFunc, @required this.target}) 
    : super(key: key);
  ...

  @override
  _NickNameState createState() => _NickNameState();
}

class _NickNameState extends State<NickName> with CommonInterface{
  TextEditingController _nickNameController = new TextEditingController();
  GlobalKey _formKey = new GlobalKey<FormState>();
  bool _nameAutoFocus = true;

  @override
  Widget build(BuildContext context) {
    String oldNickname = widget.target == cUser(context) ? cUsermodal(context).nickName : cFriendInfo(context, widget.target).nickName;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        autovalidate: true,
        child: Column(
          children: <Widget>[
            TextFormField(
              ...
              validator: (v) {
                var result = v.trim().isNotEmpty ? (_nickNameController.text != oldNickname ? null : 'please enter another nickname') : 'required nickname';
                widget.handler(result == null);
                widget.modifyFunc('nickName', _nickNameController.text);
                return result;
              },
            ),
          ],
        ),
      ),
    );
  }
}
```
这里的逻辑相对比较简单，一个简单的TextFormField，使用validator检验输入是否为空，是否同原来内容一致等等。修改密码的逻辑此处类似，不再赘述。  
* 个人信息修改页(头像)  
具体效果图如下：  
![选择页](https://user-gold-cdn.xitu.io/2020/2/11/170346d42981cf82?w=571&h=226&f=jpeg&s=43031)  
选择好图片后，进入裁剪逻辑：  
![裁剪页](https://user-gold-cdn.xitu.io/2020/2/11/170347605ba0185d?w=1080&h=1920&f=jpeg&s=97271)  

代码实现如下：  
```dart
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../../tools/base64.dart';
import 'package:image/image.dart' as img;
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

class Avatar extends StatefulWidget {
  Avatar({Key key, @required this.handler, @required this.modifyFunc}) 
    : super(key: key);
  final ValueChanged<bool> handler;
  final modifyFunc;

  @override
  _AvatarState createState() => _AvatarState();
}

class _AvatarState extends State<Avatar> {
  var _imgPath;
  var baseImg;
  bool showCircle = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        SingleChildScrollView(child: imageView(context),) ,
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: <Widget>[
            RaisedButton(
              onPressed: () => pickImg('takePhote'),
              child: Text('拍照')
            ),
            RaisedButton(
              onPressed: () => pickImg('gallery'),
              child: Text('选择相册')
            ),
          ],
        )
      ],
    );
  }

  Widget imageView(BuildContext context) {
    if (_imgPath == null && !showCircle) {
      return Center(
        child: Text('请选择图片或拍照'),
      );
    } else if (_imgPath != null) {
      return Center(
          child: 
          //    渐进的图片加载
          FadeInImage(
            placeholder: AssetImage("images/loading.gif"),
            image: FileImage(_imgPath),
            height: 375,
            width: 375,
          )
      ); 
    } else {
      return Center(
        child: Image.asset("images/loading.gif",
          width: 375.0,
          height: 375,
        )
      );
    }
  }

  Future<String> getBase64() async {
    //  生成图片实体
    final img.Image image = img.decodeImage(File(_imgPath.path).readAsBytesSync());
    //  缓存文件夹
    Directory tempDir = await getTemporaryDirectory();
    String tempPath = tempDir.path; // 临时文件夹
    //  创建文件
    final File imageFile = File(path.join(tempPath, 'dart.png')); // 保存在应用文件夹内
    await imageFile.writeAsBytes(img.encodePng(image));
    return 'data:image/png;base64,' + await Util.imageFile2Base64(imageFile);
  }  

  void pickImg(String action) async{
    setState(() {
      _imgPath = null;
      showCircle = true;
    });
    File image = await (action == 'gallery' ? ImagePicker.pickImage(source: ImageSource.gallery) : ImagePicker.pickImage(source: ImageSource.camera));
    File croppedFile = await ImageCropper.cropImage(
        //  cropper的相关配置
        ...
    );
    setState(() {
      showCircle = false;
      _imgPath = croppedFile;
    });
    widget.handler(true);
    widget.modifyFunc('avatar', await getBase64());
  }
}
```  
该页面下首先绘制两个按钮，并给其绑定不同的事件，分别控制选择本地相册或者拍摄新的图片(使用`image_picker`)，具体通过`ImagePicker.pickImage(source: ImageSource.gallery)`与`ImagePicker.pickImage(source: ImageSource.camera))`来实现，该调用将返回一个file文件，而后通过`ImageCropper.cropImage`来进入裁剪操作，裁剪完成后将成品图片通过`getBase64`转换成base64字符串，通过post请求发送给服务器，从而完成头像的修改。  
# 后记
该项目只是涉及app端的相关逻辑，要正常运行还需要配合后端服务，具体逻辑可以参考笔者自己的[node服务器](https://github.com/dianluyuanli-wp/apiTest)，包含了常规http请求和websocket服务端的相关逻辑实现。   
[本项目代码仓库](https://github.com/dianluyuanli-wp/IChat_For_Flutter)  
如有任何疑问，欢迎留言交流~







