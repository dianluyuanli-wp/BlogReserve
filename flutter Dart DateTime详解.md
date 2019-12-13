# DateTime 类
&emsp;&emsp;DateTime类用来标识一个瞬时的时间节点，可以通过构造函数，从标准格式（符合ISO 8601标准）的字符串中构造一个时间对象。DateTIme使用24小时计时法。以下是最基础的例子：  
```
var now = new DateTime.now();
var berlinWallFell = new DateTime.utc(1989, 11, 9);
var moonLanding = DateTime.parse("1969-07-20 20:18:04Z");  // 8:18pm
```
DateTime对象会锚定UTC(通用协调时Universal Time Coordinated)时区或者设备的本地时区。在创建之后，DateTime的值和所属的时区都不会改变。可以通过对象属性读取具体的时间值：  
```
assert(berlinWallFell.month == 11); //  柏林墙倒塌的月份
assert(moonLanding.hour == 20); //  登月时的时间（小时）
```
出于便捷性和可读性的考量，DateTIme类提供了星期和月份的常量值可供调用，你可以使用很多常量来提高代码的可读性，示例如下：  
```
var berlinWallFell = new DateTime.utc(1989, DateTime.november, 9);
assert(berlinWallFell.weekday == DateTime.thursday);
```
日期和月份的常量都是从1开始的，每周的开始从周一开始计算，所以january和monday的值都是1。
# 使用UTC时区和本地时区
DateTime实例默认使用本地时区，除非在创建时显示声明使用UTC时区。  
```
var dDay = new DateTime.utc(1944, 6, 6);
```
可以使用`isUtc`来确定当前的时间是否是UTC时区。可以使用`toLocal`和`toUtc`来进行时区间的转换，使用`timeZoneName`来获取DateTime实例所属时区的简写，使用`timeZoneOffset`来获取不同时区之间的时间差值。
# DateTime实例之间的比较
DateTime类有几个简单的方法来实现DateTime实例之间的比较，比如`isAfter`、`isBefore`、`isAtSameMomentAs`:
```
assert(berlinWallFell.isAfter(moonLanding) == true);
assert(berlinWallFell.isBefore(moonLanding) == false);
```
# DateTime与Duration类的配合使用
可以通过`add`和`subtract`方法加减一个Duration对象来对DateTime实例进行操作，并返回一个新的实例。例如，计算六天后的今天的时间：  
```
var now = new DateTime.now();
var sixtyDaysFromNow = now.add(new Duration(days: 60));
```
为了找出两个DateTime实例之间的差值，我们可以使用`difference`方法，它将返回一个Duration实例：
```
var difference = berlinWallFell.difference(moonLanding);
assert(difference.inDays == 7416);
```
两个不同时区之间的时间差就是按照两地之间的时间纳秒差，这个结果并不会补偿日历日或时制之间的差别。这就意味着如果相邻两个午夜时间跨过了夏令时的变更日期，那么这两个
午夜
&emsp;&emsp;