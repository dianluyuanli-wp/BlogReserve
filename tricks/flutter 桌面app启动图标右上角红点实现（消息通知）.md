## 背景
&emsp;&emsp;在进行app开发的过程中，我们往往需要实现类似于微信图标右上角的消息提醒红点功能。类似下图：  
![微信右上角红点](https://user-gold-cdn.xitu.io/2020/1/7/16f7dc0dee102a03?w=571&h=576&f=jpeg&s=523725)  
&emsp;&emsp;在传统的App开发流程中，这种问题都有现成的解决方案，但是在flutter中如何实现类似效果呢？社区已经有了一个库实现类似的功能[flutter_app_badger](https://pub.dev/packages/flutter_app_badger), 这个库的实现原理是对社区中原来已经有的库进行了一个简单的封装，方便flutter框架调用
## 具体使用
在pubspec.yaml文件中加入如下内容：  
```
dependencies:
  flutter_app_badger: ^1.1.2
```
然后执行命令`flutter pub get`,安装到本地。
使用时只需在文件头部加上如下内容：
```
import 'package:flutter_app_badger/flutter_app_badger.dart';
```

为了适配ios设备，还需要在`Info.plist`文件中添加如下键值对：
```
<key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>
```

这个库的使用方法非常简单，api只有以下几个：
* 设置右上角数字
```
FlutterAppBadger.updateBadgeCount(1);
//  只支持int类型
```

* 移除红点
```
FlutterAppBadger.removeBadge();
```

* 检查当前设备是否支持该特性：
```
FlutterAppBadger.isAppBadgeSupported();
```
