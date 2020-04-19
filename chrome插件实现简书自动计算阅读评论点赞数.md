# 前言
写博客也有一段时间了，不知道诸位是不是跟我一样在多个平台都有同步博文，笔者目前在掘金、csdn和简书都有在同步文章，这个过程中发现一个问题，简书官方没有统计作者所有博文的总阅读、评论、点赞等数据，只是给出了每篇文章的对应数据，这对于习惯了在各个平台上查看数据的笔者来说十分不友好（看着博客阅读数上涨是更新的巨大动力），为此笔者决定通过技术手段解决这个问题。
# 思考解决思路
要解决这个难点，最直观的思路自然是扒接口，如果官方有暴露对应的api的话，那一切都简单了。点开浏览器查看对应的`xhr`请求：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180b606fa011ad?w=875&h=277&f=png&s=37703)
首屏的请求逐个点开看，发现没有一个有相关信息的。接着我们查看服务器返回的HTML文件：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180ba316cbea06?w=989&h=778&f=png&s=112349)
发现简书个人中心页使用了后端渲染，每篇文章的内容都是server直出的，首次返回的html里只有首屏会显示的文章，后续的文章是怎么加载的呢?我们滚动scroll,观察接口：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180c5b1cacf17e?w=987&h=712&f=png&s=94221)
我们发现在滚动之后，浏览器会自动请求新的内容，然后添加在之前渲染的内容末尾，每篇文章的相关数据都是由服务器计算好之后直出的，并没有暴露出对应的api。看来要解决这个问题只有通过最`"笨"`但是有效的DOM查询大法了。
# 实战操作
## 页面Dom搜寻法
接下来我们通过chrome开发工具，查看每篇文章的相关元素：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180d3764d5bdfc?w=1571&h=241&f=png&s=69442)
发现表示浏览数的dom元素机构是固定的，有唯一的类名去修饰其样式，这就非常方便我们使用`jquery`来获取元素并读取其中的内容，简单来讲，统计页面内所有文章表示浏览数的dom元素，然后读取其中的数字求和就可以实现我们的统计目的。评论数和点赞数同理，核心代码如下：
```js
//  一个映射对象，分别声明阅读数、评论数和点赞数的类名关键字
const targetMap = {
    views: 'read',
    comments: 'comments',
    likes: 'like'
}
//  计算的通用方法
const compute = function(type) {
    const lable = targetMap[type];
    let count = 0;
    //  ic-list-加上lable就是对应的类名 依赖jquery
    $(`.ic-list-${lable}`).each(function(key, value) {
        //  jquery获取所有目标元素的父元素其中的html内容
        const parentNodeHtmlContent = $(this).parent().html();
        //  替换调html内容中我们不感兴趣的部分，只获取数字并求和
        count += parseInt(parentNodeHtmlContent.replace(`<i class="iconfont ic-list-${lable}"></i>`, ''));
    });
    return count;
}
//  输出浏览数，评论数和点赞数方法类似
console.log(compute('views'))
```
接下来还有一个问题，页面是懒加载的，如果在博主的所有博文没有被加载完全的时候去统计，获取的数据肯定是不准确的，因为没有加载出来的内容没有被统计。我们需要让页面自动滚动加载直至加载完所有内容。这个功能如何实现呢? 我们可以通过脚本让页面滚动到最底部，触发页面加载新的内容，如果此时页面的总高度和我们滚动前计算的总高度不一致，表示加载出了新的内容，页面需要继续滚动，直至页面滚动后的高度和滚动前的高度保持一致（这表示页面没有新的内容了），核心代码如下：
```js
let allFunc = async function() {
    //  记录页面滚动前的初始位置
    const originPositon = window.scrollY;
    //  当前页面高度
    let currentDocHeight = 1;
    //  滚动后的页面高度，随便一个初始值，二者不一致即可，触发第一次滚动
    let newHeight = 0;
    const scrollFunc = async() => {
        while(currentDocHeight !== newHeight) {
            //  更新当前页面高度
            currentDocHeight = $(document).height();
            //  promise实现异步，要给网络加载内容的时间
            await new Promise((resolve) => {
                //  页面滚动
                $(document).scrollTop($(document).height());
                //  每次滚动间隔800毫秒，确保内容加载完毕
                setTimeout(resolve, 800);
            })
            //  更新新的页面高度
            newHeight = $(document).height();
        }
    }
    // 不停滚动直至加载完所有内容
    await scrollFunc();
    //  回到初始位置
    $(window).scrollTop(originPositon);
}
```
## api内容搜寻法
通过上述的方法我们实现了页面数据的统计，但是方法实在笨重，要通过页面滚动加载完用户所有的文章之后在统计页面的dom,而且页面滚动时的`setTimeout`时间不好把握，时间过短在低网速情况下可能会导致页面没有加载新的内容后就开始页面长度比较，导致滚动操作提前停止，时间过长则会拉长等待时间，体验也不好。那有没有更佳的解决方案呢?观察页面滚动时的加载流程我们发现，页面是通过`https://www.jianshu.com/u/xxx?order_by=shared_at&page=数字`这个get请求来拉取新的页面内容的，那我们直接调用这个api,在返回的html文件中查找我们需要的信息不就可以了?接下来的问题是如何确定已经拉取了所有内容，通过实践发现，当拉取的页数超过用户发布的所有文章数时，返回的html将会自动切换到用户动态页：
![](https://user-gold-cdn.xitu.io/2020/4/19/17190383a58fcb33?w=1762&h=743&f=png&s=238027)
(以笔者的博客为例，博客文章一共有三页，请求到第四页时，返回的是`动态`页的内容)  
我们可以通过分析`动态页`的html特征，确认之前文章请求结束。具体代码如下：
```js
//  简单封装的get请求，返回promise
const getApiPromise = function(url) {
    return new Promise((resolve, reject) => {
        try {
            $.get(url, function(data) {
                resolve(data);
            })
        } catch(e) {
            reject(e)
        }
    })
}

//  获取页面请求url
const getUrl = (id, page) => `https://www.jianshu.com/u/${id}?order_by=shared_at&page=${page}`;
//  通过正则表达式和返回的html,获取页面各项数据
const getCount = (originContent, reg) => originContent.toString().match(reg).reduce((oldValue, newVaule) => {
    return oldValue + parseInt(newVaule)}, 0)

const countThroughApi = async function() {
    //  匹配用户uid
    const exec = /[0-9a-z]{12}$/
    const userId = window.location.href.match(exec)[0];
    if (!userId) {
        return 'not Find';
    }
    let page = 1;
    let views = 0, comments = 0, likes = 0;
    let res;
    //  匹配浏览数的正则
    const viewReg = /(?<=<i class="iconfont ic-list-read"><\/i>\s).*(?=(\s)*<\/a>)/g;
    //  匹配评论数的正则
    const commentReg = /(?<=<i class="iconfont ic-list-comments"><\/i>\s).*(?=(\s)*<\/a>)/g;
    //  匹配点赞数的正则
    const likesReg = /(?<=<i class="iconfont ic-list-like"><\/i>\s).*(?=(\s)*<\/span>)/g;
    while (true) {
        //  请求api
        res = await getApiPromise(getUrl(userId, page));
        //  通过动态页中html的特征内容，确认文章页请求完成，终止循环
        if (res.includes('<!-- 发表了文章 -->') || res.includes('<!-- 发表了评论 -->')) {
            break;
        }
        //  分别计算浏览、评论和点赞数
        views += getCount(res, viewReg);
        comments += getCount(res, commentReg);
        likes += getCount(res, likesReg);
        //  更新页码
        page += 1;
    }
    const ansString = '总阅读数:' + views + ' 总评论：' + comments + ' 总点赞: ' + likes;
    console.log(ansString);
    return ansString;
}
```
以上是功能实现两种方法。每次要计算机结果的时候如果都把以上脚本通过`injected script`的形式在chrome的dev tool里执行，过于繁琐，体验很差，为此我们需要引入chrome插件。
# 插件开发
有关插件开发的基础知识我这里不再赘述了，有一个大神有非常完备的[总结帖](https://www.cnblogs.com/liuxianan/p/chrome-plugin-develop.html)，看完之后全网的chrome插件教程除了官方文档，几乎都不用看了，墙裂推荐。笔者的代码仓库地址会放在文末，这里笔者只提及我们要开发的这个插件需要的几个关键点。  
## manifest.json文件
```json
{
    // ...省略部分内容
    "background": {
        //  后台js
        "scripts": ["background.js"]
    },
    //  前台执行的js
    "content_scripts": [{
        //  脚本生效的rul
        "matches": [
            "http://www.jianshu.com/u/*",
            "https://www.jianshu.com/u/*"
        ],
        //  需要加载的js
        "js": [
            "jquery.js",
            "computed.js"
        ],
        //  执行模式，这里表示页面加载完成后再加载插件相关代码
        "run_at": "document_idle"
    }],
    //  权限申请，允许我们添加右键菜单页和控制插件图标
    "permissions": ["contextMenus", "declarativeContent"]
}
```
插件后台文件`background.js`：
```js
//  与content_script,即computed.js进行通讯的函数
function sendMessageToContentScript(message, callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		chrome.tabs.sendMessage(tabs[0].id, message, function(response)
		{
			if(callback) callback(response);
		});
	});
}

//  给页面创建右键菜单
chrome.contextMenus.create({
    title: "计算浏览数-by页面滚动统计Dom",
    //  设置匹配的url
    documentUrlPatterns: ['https://www.jianshu.com/u/*'],
	onclick: function(){
        //  发送通信消息
        sendMessageToContentScript({cmd:'dom'}, function(response)
        {
            //  console.log('来自content的回复：'+response);
        });
    }
});

chrome.contextMenus.create({
    title: "计算浏览数-by请求api",
    documentUrlPatterns: ['https://www.jianshu.com/u/*'],
	onclick: function(){
        sendMessageToContentScript({cmd:'api'}, function(response)
        {
            //  console.log('来自content的回复：'+response);
        });
    }
});

//  控制插件图标在特定时刻高亮
chrome.runtime.onInstalled.addListener(function(){
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
		chrome.declarativeContent.onPageChanged.addRules([
			{
				conditions: [
					// 只有打开简书的用户页才显示pageAction
					new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'www.jianshu.com/u'}})
				],
				actions: [new chrome.declarativeContent.ShowPageAction()]
			}
		]);
	});
});
```
接下来我们查看`content_script`,即`computed.js`的相关内容:
```js
//  allFunc和countThroughApi的相关定义同之前的分析，这里略去

//  content_script监听background.js发过来的通信请求
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse)
{
    sendResponse('');
    //  通过两种不同的而方法统计数据
    if (request.cmd === 'dom') {
        alert(await allFunc());
    } else {
        alert(await countThroughApi())
    }
});
```
接下来我们在本地测试一下效果:
![](https://user-gold-cdn.xitu.io/2020/4/19/17190569377104ca?w=1505&h=607&f=png&s=287363)
可以看到右上角插件图标亮起，表示可用，右键鼠标，出现两种计算方法的选项，点击任意一种，开始统计:
![](https://user-gold-cdn.xitu.io/2020/4/19/1719057f9abc457a?w=765&h=641&f=png&s=99383)

[项目地址]()
# 参考文献
[大神的chrome插件详细攻略](https://www.cnblogs.com/liuxianan/p/chrome-plugin-develop.html)  
[chrome extension 官方文档](https://developer.chrome.com/extensions)
