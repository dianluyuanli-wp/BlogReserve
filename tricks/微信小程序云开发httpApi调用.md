# 前言
微信小程序的开发愈发火热，微信官方推出的云开发功能给中小型开发者提供了很大助力。开启了云开发功能的小程序，可以使用数据库，存储空间等一系列免费资源，给开发者提供了很大的便利，开发者可以聚焦核心功能，而不用分心部署自己并不熟悉的后端api服务。微信官方云开发文档对于小程序或者云函数中调用数据库的api解释的非常详细，但是对于非小程序或云函数环境（比如我们的node服务器）如何调用，就一笔带过，显得语焉不详。要注意，浏览器环境不能直接调用数据api,必须通过服务器中转。这里笔者将结合自己踩过的坑，展示一些特殊查询语句的调用方法。
# 准备工作
要在服务器环境中调用云开发的官方api,首先要根据你的小程序获取调用token:
```js
const getAccessToken = async() => {
    const domain = 'https://api.weixin.qq.com/cgi-bin/token';
    return await ownTool.netModel.get(domain, {
        grant_type: 'client_credential',
        appid: '你的appId',
        secret: '你app的密码'
    });
}
//  返回的是一个对象，结构如下
//  { access_token, expires_in }
//  expriest_in表示还有多少时间这个token将过期，过期后要重新申请
```
`ownTool.netModel`就是任意具有http接口调用功能的第三方库, 这里使用`get`方法发起请求，请求参数中的`appId`和`secret`都可以在小程序的开发者后台中产看。  
![](https://user-gold-cdn.xitu.io/2020/4/25/171b13c9a1ffeb4b?w=1764&h=582&f=png&s=52123)  
这里获取的`token`是我们后续调用官方api的必要条件。  
# 调用官方api
假设这里有如下格式的数据：  
![](https://user-gold-cdn.xitu.io/2020/4/25/171b14ec7917c564?w=431&h=217&f=png&s=11754)  
这里首先给出一个api调用的例子：
```js
const queryApi = 'https://api.weixin.qq.com/tcb/databasequery?access_token=';
//  外围是笔者的业务代码，不用太在意
//  功能就是向官方api查询数据，再转给client,也就是服务器
app.post(apiPrefix + '/queryPeriod', async function(req,res){
    //  这里的token就是我们之前获取的token
    const wxToken = await getToken();
    const doamin = queryApi + wxToken;
    const { offset, size } = req.body;
    //  向微信官方api发起查询请求
    let a = await ownTool.netModel.post(doamin, {
        env: '你的环境id',
        query: 'db.collection("period").where({counselorId:"' + req.body.counselorId + '"}).' +
        'skip(' + offset +').limit(' + size + ').orderBy("date","desc").get()'
    })
    res.send(a);
});
```
这里的环境id就是你的小程序官方编辑器点击`云开发`摁钮，在云开发面板中查询的：  
![](https://user-gold-cdn.xitu.io/2020/4/25/171b14a48f60c996?w=1144&h=533&f=png&s=54146)  
这里要注意，通过http api查询时，要把所有的查询语句转化成字符串的形式，最后把这个字符串作为请求参数传递给官方api。
> 通过http api调用官方接口的核心点和易错点就在这个query语句上,如果要表示字符串值，一定要用""或''对字段包裹，如果要让官方api理解为一个变量，则一定不能用""或''包裹。这里是绝大多数初学者在通过http调用api时翻车的原因    

这里笔者的查询语句功能是：在`period`集合中，查找`counselorId`为某个特定值的数据，跳过一开始的`offset`个数据，该次请求最多返回`size`个，返回数据根据`data`字段进行降序排序后返回。如果在小程序中，查询语句类似这样：
```js
db.collection('period').where({
  counselorId: '匹配的id'
}).skip(offset).limit(size)
.get({
  success: function(res) {
    console.log(res.data)
  }
})
```
如果功能在复杂一点，比如说我们要求`date`字段要在某个区间内的数据才返回，在小程序或云函数中我们的请求这样写：  
```js
const _ = db.command
db.collection('period').where({
  data: _.gt('2020-03-20').and(_.lt('2020-04-20'))
})
.get({
  success: function(res) {
    console.log(res.data)
  }
})
```
在自己的服务器中我们的查询字符串需要这样写：
```js
let a = await ownTool.netModel.post(doamin, {
    env: '你的环境id',
    query: 'db.collection("period").where({date: _.gt("2020-03-20").and(_.lt("2020-04-20"))}).get()'
})
```
在官方解析我们的query时，会自动把`_`理解为`db.command`的实例，我们直接在query字符串中使用即可。在真实的项目中，我们用手写查询语句显得比较笨重，可以通过对查询对象直接`JSON.stringfy()`的方法将其转化为字符串拼接到query字符串中。这里笔者贴下自己在项目中的示例代码给大家参考,细节就不解释了，大家主要可以参考下将查询对象转化为string的操作：
```js
function getQueryString(pageNum: number) {
    const queryJsonString = JSON.stringify(
        Object.assign(
        {},
        queryObj.switchOn
            ? {
                'formData.date': `_.gt('${queryObj.period?.[0]?.format('YYYY-MM-DD',
                )}').and(_.lt('${queryObj.period?.[1]?.format('YYYY-MM-DD')}'))`,
            } : {},
        queryObj.counselorId ? { counselorId: `'${queryObj.counselorId}'` } : {},
        ),
    )
    //  这里要替换下，否则后台会理解为字符串而不是查询条件
    .replace(/"/g, '')
    //  嵌套对象必须要套引号，否则无法解析
    .replace('formData.date', '"formData.date"');
    return `db.collection('interviewee').where(${queryJsonString}).skip(${(pageNum - 1) *
        SINGLE_PAGE_SIZE}).limit(${SINGLE_PAGE_SIZE}).orderBy('date','desc').get()`;
}
```

# 参考文献
[微信小程序云开发http api调用官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/backend-api.html)
