# DLL是什么，用它来干啥？  
&emsp;&emsp;DLL（Dynamic Link Libray）原来特指windows系统中实现共享函数库的一种方式，扩展名通常为.dll。玩过老windows游戏的同学应该对这种文件不陌生，很多游戏的安装盘下就有很多.dll的文件。DLL通常是已经编译、链接的二进制文件，方便程序直接调用。  
#  前端应用场景
&emsp;&emsp;在大型项目的开发过程中，往往会用到很多公共库，公共库的内容不同于业务代码，在很长的一个时间周期内都不会有改动。这部分公共库通常会被打包在commonChunk中,webpack配置节选如下：  
```
    optimization: {
        splitChunks: {
            minSize: 1000000,
            cacheGroups: {
                vendor: {
                    name: "common",
                    test: /[\\/]node_modules[\\/]/,
                    chunks: "initial",
                    minSize: 30000,
                    minChunks: 1,
                    priority: 8
                }
            },
        }
    },
```
&emsp;&emsp;这样可以把长时间不变的公共包内容打包进一个名为common的chunk中，同业务代码进行隔离，生成稳定的缓存key,以便浏览器端实现缓存。但是这也带来一个问题：尽管用户端实现了缓存，但是我们在打包的时候，webpack依然会对所有用到的公共包进行遍历，解析，处理。严重影响打包速度。  
&emsp;&emsp;webpack中的DLL打包优化，同windows中的DLL的原理类似。通过另写一份打包配置，把长期不变的公共包内容单独打包，然后在业务代码打包时，通用webpack内置插件DllReferencePlugin引用之前打包的动态链接内容，而不是每次都打包同样的公共包内容，从而加快打包速度。  
# 项目实战  
接下来笔者将以自己项目为例，进行webpack dll优化。
使用原来的打包配置，结果如下：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b408e69a5b86?w=378&h=329&f=png&s=21686)  
打包耗时：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b4295f141413?w=566&h=84&f=png&s=9633)  
接下来，在项目中添加webpack.dll.config.js文件，对一些固定不变的内容提前打成dll资源：  
```
const webpack = require('webpack')
const library = '[name]_dll'
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: {
    vendors: ['react', 'mobx', 'mobx-react', 'antd', 'socket.io-client']
  },

  output: {
    filename: '[name]_dll.js',
    path: path.resolve(__dirname, 'dist'),
    //publicPath: path.resolve(__dirname, 'dist'),
    publicPath: './',
    library
  },

  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, 'dist/[name]-manifest.json'),
      // This must match the output.library option above
      name: library
    }),
    new BundleAnalyzerPlugin({
        analyzerPort: 8899
    })
  ],
}
```
打包结果如下(vendors_dll.js: 685kb)：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b487282981bd?w=1626&h=844&f=png&s=300342)
这个dll包压缩后还有600多kb!
接下来我们再对项目代码进行打包，在webpack配置文件中添加如下插件：
```
    plugins: [
        ......
        //  动态链接库
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require('./dist/vendors-manifest.json')
        }),
        ......
    ]    
```
打包大小：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b4c2a4718ece?w=380&h=330&f=png&s=21245)  
打包时间：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b500972810c1?w=569&h=81&f=png&s=9484)  
&emsp;&emsp;通过如上实验我们可以发现，使用DllReferencePlugin插件后，打包时间大幅缩小，从原来的16s缩减到10秒左右，这是由于相当部分的资源已经提前构建好，在业务代码改变的时候，自然就不用重复打包浪费时间了。但同时暴露出一个问题：原先的打包方式打包文件的体积大概是378kb,使用dll之后，打包体积是dll资源与业务代码之和（685kb+92kb）,整整大了两倍。要知道，dll文件浏览器也是需要下载的，这样完全是无法接受的。通过对打包内容的分析，我们可以发现webpack.dll.config.js文件的入口不是业务代码，直接是各个公共包，这就意味着dll显然是无法使用treeShake等等优化特性的，比如antd这个包，优化前使用treeShake按需加载，打包体积只有168kb左右，而在dll包中，antd整个包都进行了引入，体积膨胀到了250kb左右。由此我们可以得到一个重要的实战经验：针对antd，lodash等等可以使用按需加载的公共库，不能提前打包在dll中，像react,mobx等等必然会全盘引入的公共库才是最适合放入dll中的。  
&emsp;&emsp;接下来我们修改一下webpack.dll.config.js的entry配置(删掉antd)：
```
  entry: {
    vendors: ['react', 'mobx', 'mobx-react', 'socket.io-client']
  },
```
dll打包结果（vendors_dll:84kb）：
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b6659bdf44e9?w=1636&h=433&f=png&s=78088)  
业务代码打包结果：  
![](https://user-gold-cdn.xitu.io/2019/9/26/16d6b676a82f1bc5?w=374&h=332&f=png&s=21487)  
二者相加，打包文件体积与使用DllReferencePlugin前相仿。打包时间缩减了两秒，在不增加打包文件体积的前提下，减少了打包时间。

# 如何将vendors_dll.js插入html?  
&emsp;&emsp;笔者在实践过程中还发现一个问题，打包后的vendors_dll.js并没有被HtmlWebpackPlugin所识别，导致输出的HTML文件里没有这个资源，解决方法如下，在html模板文件的body添加一个script标签，并且附带内容模板：  
```
<body>
    <div id='main'></div>
    <script type="text/javascript" src="<%= htmlWebpackPlugin.options.vendor %>"></script>
</body>
```
然后在webpack文件中作如下更改：
```
//  头部引入打包好的文件
const manifest = require('./dist/vendors-manifest.json'); 
......

    plugins: [
        ......
        new HtmlWebpackPlugin({
            filename: '../dist/index.html',
            template: './views/template.html',
            inject: 'body',
            //  添加vendor,替换html模板中的内容
            vendor: './' + manifest.name + '.js' //manifest就是dll生成的json
        }),
        ......
    ]
```
最后在输出的html中将会带上我们的dll文件。

-----------------------------------------  
上文中用到的例子：https://github.com/dianluyuanli-wp/chat