# 前言
写博客也有一段时间了，不知道诸位是不是跟我一样在多个平台都有同步博文，笔者目前在掘金、csdn和简书都有在同步文章，这个过程中发现一个问题，简书官方没有统计作者所有博文的总阅读、评论、点赞等数据，只是给出了每篇文章的对应数据，这对于习惯了在各个平台上查看数据的笔者来说十分不友好（看着博客阅读数上涨是更新的巨大动力），为此笔者决定通过技术手段解决这个问题。
# 思考解决思路
要解决这个难点，最直观的思路自然是扒接口，如果官方有暴露对应的api的话，那一切都简单了。点开浏览器产看对应的`xhr`请求：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180b606fa011ad?w=875&h=277&f=png&s=37703)
首屏的请求逐个点开看，发现没有一个有相关信息的。接着我们查看服务器返回的HTML文件：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180ba316cbea06?w=989&h=778&f=png&s=112349)
发现简书个人中心页使用了后端渲染，每篇文章的内容都是server直出的，首次返回的html里只有首屏会显示的文章，后续的文章是怎么加载的呢?我们滚动scroll,观察接口：
![](https://user-gold-cdn.xitu.io/2020/4/16/17180c5b1cacf17e?w=987&h=712&f=png&s=94221)
我们发现在滚动之后，浏览器会自动请求新的内容，然后添加在之前渲染的内容末尾，每篇文章的相关数据都是由服务器计算好之后直出的，并没有暴露出对应的api。看来要解决这个问题只有通过最`"笨"`但是有效的DOM查询大法了。
# 实战操作
## 页面搜寻法
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
    //  ic-list-加上lable就是对应的类名
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
