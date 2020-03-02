# 前言
如果你不甘于做一个纯粹的页面仔，想了解一个web应用从编写到到发布到用户可见的全过程，或是想自己玩一点新东西，突破原有的技术圈层，那么本文将是一个很好的入门指南。笔者将从实战入手，尽可能细致地结合当前主流的工具链，以命令行为粒度来讲解一个web应用CI/CD的全过程。有些部分的内容可能过于基础，大神们可以酌情跳过。  
本例的应用架构大致是:一个web静态中台服务，和与之配套的后端服务（通过node实现）。通过nginx部署静态文件（web网站），使用node部署一个后端服务。nginx将静态站和后端服务整合起来，通过81端口将服务暴露给用户。在工程层面使用jenkins持续集成。除了jenkins外，所有的服务都运行在docker容器中，方便快速部署。   

# 虚拟机环境搭建
笔者选择马云旗下厂商的ECS(Elastic Compute Service 弹性计算服务)作为虚拟机，其他公司的机器如马化腾、贝佐斯旗下厂商的vps(Virtual Private Server 虚拟专用服务器)也可参考如下内容，所谓的ECS或者vps都可以简单地理解为厂商物理服务器上划分出来的一个虚拟主机。  
## 选择机器配置
在官网选择ECS相关产品，在产品选购页面可以见到如下的内容：  
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c7966ca507bd?w=1646&h=895&f=png&s=139598)
这里的操作比较傻瓜，点点点一通操作即可，笔者这里的例子使用的是CentOs8系统,选择机器的位置的时候建议香港，下载某些程序包或者资源的时候就不用设置国内镜像也能获取不错的速度。机器购买成功后，要记得配置机器root账户的密码。这里关于机器的配置我想说几句，机器配置越高，花费越贵，图上是最低配云机器一年的花费(在没有促销活动的情况下)，通常双十一或者凭学生身份或者首次消费均会有不同程度的优惠。如果你想长时间的部署你的服务，建议选择包年，如果只是想短期玩玩，包月甚至按小时服务亦可。针对典型的前端应用，笔者实测最低配的云主机可以胜任部署静态网站或者node服务，但是稍微吃cpu的项目就跑不起来了，比如说webpack打包，还有部署jenkins(jenkins是用java写的，运行需要java虚拟机，比较吃资源)。如果各位土豪不差钱，大可选择高配机器爽一爽。
## 机器属性简介
购买云机器后，可以在ecs实例页面查看你的机器，注意图中划红线的部分内容：
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c822750593e2?w=1688&h=177&f=png&s=45979)  
ip地址一栏有公网ip和内网ip两项，公网ip就是你的机器能够被外网访问的ip,内网ip就是你的机器内部或者局域网内访问本机的ip，右侧的远程连接可以选择Workbench或者VNC进入机器的命令行,首次通过VNC进入的时候会给你一个随机6位密码，供以后登录使用。  
![](https://user-gold-cdn.xitu.io/2020/2/26/1707f5260be5640d?w=1753&h=341&f=png&s=38317)  
点击远程连接左侧的管理进入实例详情  
![](https://user-gold-cdn.xitu.io/2020/3/1/17096621f23474bd?w=796&h=387&f=png&s=38388)  
点击本实例安全组，再点击配置规则进入虚拟机的端口配置页：
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c8bdeb92f3b2?w=1672&h=471&f=png&s=73013)  
这里的端口配置决定了外网能否通过这些端口访问你的机器，默认设置是把常用端口都打开的，如果在操作的过程中发现在外网无法访问你的机器，首先要做的就是检查实例安全组端口配置。在实例功能部署完毕后，建议把除了80和443之外的所有端口都禁掉，保证机器安全。笔者的mongodb服务的数据库就是因为没有关闭27017端口，被黑过好几次，这里建议大家提高警惕。
## 安装虚拟机常用工具
我们如果要操控我们的虚拟机，只能通过厂商提供的web命令行么?肯定不是。为了在开发过程中方便远程登录，我们可以安装openSSH-server并开启机器的ssh服务，同时为了方便进行文件操作(比如上传下载等)，我们还需要安装vsftpd并开启ftp服务。注意，请确保你的实例安全组的21端口（ftp服务）和22（ssh服务）端口在调试时保持开启。    
[openSSH安装与配置](https://www.cnblogs.com/liuhouhou/p/8975812.html)  
[某厂商云ssh官方指导](https://help.aliyun.com/knowledge_detail/141305.html?spm=5176.13910061.0.0.7192146ami7Bu9&aly_as=jE83dxTO)  
[某厂商云vsftp服务安装与配置](https://help.aliyun.com/knowledge_detail/60152.html)  
这里有一些常见的公私钥的生成，远程服务器公钥配置等等关于ssh的基础知识，笔者就不赘述了(配置过git的应该都懂，跟这个类似)。安装成功后，你就可以通过如下命令本地命令行`ssh 你的账号@你的机器ip`直接登录云主机了(前提是你本地有ssh客户端)：  
```
$ ssh root@xx.xx.xxx.xxx

Welcome to Alibaba Cloud Elastic Compute Service !

Activate the web console with: systemctl enable --now cockpit.socket

Last failed login: Tue Feb 25 19:22:36 CST 2020 from xx.xxx.xx.xxx on ssh:notty
There were 1224 failed login attempts since the last successful login.
Last login: Tue Feb 25 14:21:38 2020 from xxx.xxx.xx.xxx
[root@iZj6cavaweeoyi3tqucik6Z ~]#

```
通过本地的ftp客户端(笔者是FlashFXP)通过账号密码查看云主机的文件：
![](https://user-gold-cdn.xitu.io/2020/2/25/1707ca47554daa14?w=1365&h=851&f=png&s=152602)  

# 用docker部署你的服务
docker是现在独树一帜的容器技术，几乎所有的互联网的企业的服务都是部署在docker容器中的。这里我不想搬运官网上的定义和解释，直接结合实操来讲解docker容器的优势。在传统的服务部署中，每一台虚拟机中都会安装服务的一整套依赖，尽管如此有时候依然会因为平台间的差异导致各种各样的bug。在移除服务的时候，也要同步的移除相关的依赖，这个过程不仅繁琐，还容易处理的不彻底。docker你可以简单地理解为一个沙盒，这个沙盒类似一个极简的虚拟机，在其中你可以安装你的服务及其相关依赖，这个沙盒的启动和重启等等操作都十分迅速，性能优异。正因为是容器，服务的插拔都十分方便，同时这个沙盒可以通过类似于gitHub的系统方便其他机器获取，只要是同一个沙盒，就可以保证其在不同的平台上表现一致，容器本身抹平了几乎所有的差异。通常情况下安装`nginx`或者`jenkins`等服务时都需要非常复杂的本地配置，如果启用相应的docker容易则可以简单地一键安装，一键移除，干净清爽。
## 安装docker  
这里以笔者的centOs 8为例子介绍docker的安装步骤，首先安装依赖：
```
yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
```
然后设置docker后续拉取镜像时的仓库地址：
```
yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

```
然后安装docker社区版和命令行等：
```
yum install docker-ce docker-ce-cli containerd.io
```
如果安装的时候失败，报错信息显示containerd.io的版本过低不符合要求，那么可以本地重新安装`containerd.io`,首先下载安装包:
```
wget https://download.docker.com/linux/centos/7/x86_64/edge/Packages/containerd.io-1.2.6-3.3.el7.x86_64.rpm
```
在安装新包内容：
```
yum -y install containerd.io-1.2.6-3.3.el7.x86_64.rpm
```
安装成功之后再次执行docker的安装命令，docker安装成功之后设置开机自启动：
```
# 开机自启
systemctl enable docker
# 启动coker服务
systemctl start docker
```
此时输入`docker --version`查看版本,证明安装成功：
```
[root@iZj6cavaweeoyi3tqucik6Z /]# docker --version
Docker version 19.03.6, build 369ce74a3c
```
## docker基础概念简介
* 镜像(image)  
网上有很多关于容器和镜像的描述，感觉都十分笼统，不够形象。镜像简单的来说你可以把它理解成一个类，其中包含一些特定的功能，例如本例会使用到的nginx镜像，node镜像等等，甚至还有操作系统的镜像centOs。业界常用的应用或软件都有对应的官方镜像。镜像中整合了一定的功能，用户可以自定义自己的镜像并且将其push到仓库。  
* 容器(container)  
容器简单的来说就是由一个镜像生成的实例，我们的所有操作都是在容器中进行的，向外提供功能和服务的也是容器。我们在容器中进行一些操作（比如安装一些依赖等等），可以依托这个容器，反向生成我们自己的镜像。通常来说我们不会从零开始搭建镜像，往往是依托官方镜像生成容器，在其中扩展功能，再将扩展后的容器生成我们自己的镜像。  

接下来我们通过一个简单的例子展示下镜像和容器的概念，首先从仓库中拉取我们的目标镜像：
```
docker pull node
```
如果要确定版本，可以在使用类似的语句`docker pull node:12.16.1`等等，如果不指定版本，则默认是latest。然后查看当前的镜像`docker images`：
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker images
REPOSITORY                              TAG                 IMAGE ID            CREATED             SIZE
node                                    latest              e0e011be5f0f        6 hours ago         942MB
```
然后我们通过这个node镜像创建一个容器`docker run -it --name node-test node`：
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker run -it --name node-test node
Welcome to Node.js v13.8.0.
Type ".help" for more information.
> console.log(111)
111
```
我们在doker容器中直接运行node服务，并且打印字符串。这里我们通过`run`指令，用node镜像创建的一个叫node-test的容器， -i(interactive,表示开启交互), -t(terminal, 表示终端)，-it是两个参数的简写，表示通过命令行的方式运行。还可以添加-d(deamon)表示在后台运行。退出控制台后，我们通过`docker ps -a`查看当前的所有容器：
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker ps -a
CONTAINER ID        IMAGE                                   COMMAND                  CREATED             STATUS                     PORTS                NAMES
a158b266e1d8        node                                    "docker-entrypoint.s…"   9 minutes ago       Exited (0) 7 minutes ago                        node-test
```
接下来我们再次启动这个容器，并进入其中运行bash命令行:
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker start node-test
node-test
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker exec -it node-test /bin/bash
root@a158b266e1d8:/# node -v
v13.8.0
root@a158b266e1d8:/# ls
bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```
我们可以使用exec指令让一个运行中的容器执行指令，这里我们使用交互终端的形式，在名为node-test的容器中运行bash,即开启命令行。在容器中我们可以使用`node -v`查看版本，查看目录等等，此时的docker容器就像是一个新的虚拟机，内部有着最基本centos系统架构和node。使用exit指令可以退出容器回到我们云主机。`exec`指令和`attach`指令有着类似的功能，唯一的不同是使用exec退出时并不会终止容器。接下来我们要做的就是部署我们的node应用代码到node容器中，具体的方法有两种：  
1. 将外部文件映射到容器的特定目录下(使用-v 参数)，然后在容器中运行文件  
2. 在容器中通过git拉取业务代码，再执行业务代码  

到这里聪明的读者们应该已经知道所谓的服务部署在docker里是怎么回事了。接下来我们要做什么就呼之欲出：
```
1. 在node容器中部署我们的业务代码
2. 拉取nginx镜像，并创建nginx容器
3. 修改nginx的配置，把我们的服务通过云主机的端口暴露给外网
```
这里给大家列出来一些常用的关于image(镜像)和container(容器)的命令
## docker image和container常用指令
docker ps –a 查看所有的容器  
docker sotp 容器id或名称 关闭容器  
docker restart 容器id或名称 重启容器  
docker exec id或名称 /bin/bash  命令行式进入某个容器，如果使用exit退出容器不会停止  
docker attach id或名称 /bin/bash  命令行式进入容器，如果退出容器会停止  
docker rm –f id或名称 删除某个容器  
docker images 查看当前所有镜像  
docker rmi name 删除镜像  
docker commit –m=’node+git’ –a=’guanlanlu’ id或者名称 guanlanlu/node_and_git  
从一个容器创建镜像 –m 表示信息 –a表示作者 guanlanlu是docker仓库的用户名，node_and_git是创建镜像的名字  

docker push username/名字  
向你的仓库推送镜像

docker run -itd --name node-test node  
交互式已node为镜像创造一个后台运行的容器，名字叫node-test  

docker run –-name mynginx –d –p 80:80 –v /software/nginx/mynginx.conf:/etc/nginx/nginx.conf nginx  
使用本地的nginx镜像创建一个nginx容器，-p 映射80端口，-v 挂载本地文件到etc也就是容器的文件夹下  

## docker进阶与nginx配置
之前提到过在node的容器中部署我们的应用，除了拉取代码，我们往往还需要进行依赖安装，代码构建打包等等操作。这些都通过我们人肉登录云主机再进入docker容器中进行操作，非常的繁琐，有没有简单的自动化的构建工具或脚本? 幸运的是docker可以通过Dockerfile来进一步集成这些操作。
### Dockerfile入门
Dockerfile简单来说就是一个文本文件，可以通过一条条的指令告诉docker如何创建镜像，如安装依赖，打包，暴露接口等等一系列操作都可以在Dockerfile文件中定义。这里直接放一个Dockerfile例子：
```
# /usr/src/nodejs/hello-docker/Dockerfile
# 依据哪个镜像创建你的容器
FROM guanlanlu/node_and_git

# 在容器中创建一个目录
RUN mkdir -p /usr/src

# 定位到容器的工作目录
WORKDIR /usr/src

# 拉仓库并且安装依赖,这里是我的测试仓库，可以替换成你自己的服务
RUN git clone https://github.com/dianluyuanli-wp/testBackEnd.git
WORKDIR /usr/src/testBackEnd
RUN npm i

//  容器暴露给外部的端口
EXPOSE 4000
CMD npm run start
```
`FROM`表示你要以哪个目标镜像来创建容器，例子中是笔者自己创建的一个包括node和git的镜像，`RUN`指令表示执行后面的命令，`WORKDIR`表示移动到目录，`EXPOSE`表示你要将容器的哪个端口暴露给外部，`CMD`表示容器构建完毕运行时执行的指令，通常用来启动你的服务(多个CMD指令只有最后一个生效)，通过`COPY`指令将本地文件复制到容器指定路径:
```
COPY 源路径 目标路径
```
其他更多指令可以查询文档。笔者自己写了个最简单的node后台服务([项目地址](https://github.com/dianluyuanli-wp/testBackEnd))，供测试使用，代码如下：
```
//  省略express的引用
var app =express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const apiPrefix = '/api';
 
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
//设置跨域访问
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin",  req.headers.origin);
   res.header("Access-Control-Allow-Credentials", "true");
   res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,AccessToken");
   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
   res.header("X-Powered-By",' 3.2.1');
   res.header("Content-Type", "application/json;charset=utf-8");
   next();
});

//  写个测试接口 get请求
app.get(apiPrefix + '/query', async function(req,res){
    res.status(200),
    res.json('SUCCESS! from 广兰路地铁');
});
 
//配置服务端口
//  这里的端口要与Dockerfile中EXPOSE 指定的端口一致
let PORT = process.env.PORT || 4000;
var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('open success')
    console.log('Example app listening at http://%s:%s', host, port);
})
```
在Dockerfile中通过执行git命令直接将代码仓库拉取到容器中。接下来我们创建一个文件夹，将我们的Dockerfile放在其中，然后执行
```
docker build -t 镜像名称:镜像标签 .
```
build后面的`.`表示上下文路径，也就是在执行`COPY`命令时文件的路径。然后有如下控制台输出：  
```
[root@iZj6cavaweeoyi3tqucik6Z test]# docker build -t testbackend:testB .
Sending build context to Docker daemon  2.048kB
Step 1/8 : FROM guanlanlu/node_and_git
 ---> a2cb4df8dafa
Step 2/8 : RUN mkdir -p /usr/src
 ---> Using cache
 ---> 98d9491ede80
Step 3/8 : WORKDIR /usr/src
 ---> Using cache
 ---> 271867383a29
Step 4/8 : RUN git clone https://github.com/dianluyuanli-wp/testBackEnd.git
 ---> Running in 5140ce25a97e
Cloning into 'testBackEnd'...
remote: Enumerating objects: 11, done.
remote: Counting objects: 100% (11/11), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 11 (delta 2), reused 11 (delta 2), pack-reused 0
Unpacking objects: 100% (11/11), done.
Removing intermediate container 5140ce25a97e
 ---> e049c63addfb
Step 5/8 : WORKDIR /usr/src/testBackEnd
 ---> Running in d14f4f6fed0a
Removing intermediate container d14f4f6fed0a
 ---> ebb24c9d7e22
Step 6/8 : RUN npm i
 ---> Running in 199b66e3bce9
npm WARN deprecated core-js@2.6.11: core-js@<3 is no longer maintained and not recommended for usage due to the number of issues. Please, upgrade your dependencies to the actual version of core-js@3.

> core-js@2.6.11 postinstall /usr/src/testBackEnd/node_modules/core-js
> node -e "try{require('./postinstall')}catch(e){}"

Thank you for using core-js ( https://github.com/zloirock/core-js ) for polyfilling JavaScript standard library!

The project needs your help! Please consider supporting of core-js on Open Collective or Patreon:
> https://opencollective.com/core-js
> https://www.patreon.com/zloirock

Also, the author of core-js ( https://github.com/zloirock ) is looking for a good job -)

npm notice created a lockfile as package-lock.json. You should commit this file.
added 127 packages from 100 contributors and audited 546 packages in 7.89s

4 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

Removing intermediate container 199b66e3bce9
 ---> 359c7242d228
Step 7/8 : EXPOSE 4000
 ---> Running in eea3c5c78b65
Removing intermediate container eea3c5c78b65
 ---> 306fa86735c0
Step 8/8 : CMD npm run start
 ---> Running in 478f8899fe74
Removing intermediate container 478f8899fe74
 ---> cc4f959f9aa1
Successfully built cc4f959f9aa1

```
随后的的控制台输出表示镜像创建成功，我们查看刚才构建的镜像：
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker images
REPOSITORY                              TAG                 IMAGE ID            CREATED             SIZE
testbackend                             testB               b335d0022ee4        4 minutes ago       1.12GB
```
然后我们根据这个镜像运行一个容器，并将端口进行映射(将容器的4000端口映射到云主机的3001端口)：
```
docker run -d --name testback1 -p 3001:4000 testbackend:testB
```
然后在外网进行测试(前提是你的云主机安全组开放了3001端口)：  
![](https://user-gold-cdn.xitu.io/2020/2/28/17089c6e6e21a7df?w=557&h=98&f=png&s=16424)  
如上图，我们已经可以正常访问部署的后端服务了。

### nginx配置
上一节中我们已经部署好了我们的node服务，也可以正常访问了，为什么还要引入nginx呢? 通常一个成熟的应用，不可能只有一个服务，如果我们的应用需要多个服务协同工作，我们难道在云主机上开放一个个不同的端口去分别调用?如果各个服务间还有复杂的路由和转发策略呢?对于访问静态文件的需求，难道每个请求都要访问我们部署在node上的express服务(这样非常低效)? 内容缓存和网络请求压缩怎么处理?幸运的是，这些问题很多都可以通过nginx来解决。  
首先简要解释下什么是nginx，nginx是现在业界使用广泛的高性能web静态文件或者代理服务器，可以理解为tomcat的升级版，支持高并发、内部服务转发代理与各种你能想象得到的网络配置。外界的访问流量通过一个特定端口(通常是80或443)访问我们的云主机，我们使用nginx监听这个端口，nginx根据我们的配置将流量导向对应的服务(静态网页或者api服务)。首先我们拉取nginx镜像：
```
docker pull nginx
```
然后我们编写nginx配置文件myngnix.conf：
```
events {
    # 工作进程最大连接数量
	worker_connections 1024;
}
http {
    # 定义静态文件支持的类型，否则在浏览器会出现文件类型解析错误，导致css无法解析等错误
	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	server {
        # 监听的端口
		listen 81;
        # 你的云主机外网ip
		server_name 你的云主机外网ip;

        # 是否开启gzip压缩
		gzip on;
        # 最小启用压缩的门限
		gzip_min_length 1k;
        # 压缩等级，取值1-9，越小压的越厉害，但是越耗cpu
		gzip_comp_level 9;
        # 启用压缩的文件类型
		gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png;
        # 启用应答头"Vary: Accept-Encoding"
		gzip_vary on;
        # 某些特定的ie浏览器不启用压缩
		gzip_disable "MSIE [1-6]\.";

        # 定义根目录，静态文件将依据其查找
		root /usr/share/nginx/html;

        # 根目录下直接查找静态文件
		location / {
			# 静态文件查找
			try_files $uri $uri/ /index.html;

			  # 如果有资源，建议使用 https + http2，配合按需加载可以获得更好的体验
			  # rewrite ^/(.*)$ https://preview.pro.ant.design/$1 permanent;

		}
        # api路由下的请求转发到node服务器
		location /api {
        # 转发到云主机的对应端口 proxy_pass 你的云主机内网地址:你的node容器连接到云主机的端口
			proxy_pass xxx.xx.xxx.xx:3001;
		}
	}
}
```
nginx的配置博大精深，建议大致在官网或者默认的配置文件下浏览有哪些配置项，有哪些功能可以支持即可，等到真正有需求的时候再去找网上的帮助帖。上述的配置文件主要干了几件事：
1. 开启gzip压缩
2. 配置静态文件的根目录，部署静态网站
3. 配置api请求转发。发送到niginx 服务器的以/api开头的请求，将会被转发到我们的node docker容器(部署了后端服务)  

开启我们的nginx容器：
```
docker run –-name mynginx –d –p 81:81 –v 你的配置文件路径/mynginx.conf:/etc/nginx/nginx.conf -v 你的外部静态文件目录:/usr/share/nginx/html nginx
```
注意，这里要通过`-v`分别挂载nginx配置和静态文件的文件夹到容器的对应目录，现在我们访问浏览器验证配置生效：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708ef6f5d57dcc2?w=477&h=103&f=png&s=14658)  
现在我们可以通过81端口访问服务了，因为nginx将api请求给我们代理到了docker容器中。如果访问81端口下的根目录，就可以看到你部署的静态站点。我们用一张图来描述当前的架构：  
![](https://user-gold-cdn.xitu.io/2020/2/29/17090137ef624ae3?w=581&h=445&f=png&s=30180)  
此时外界通过3001和81都可以访问内部api服务(因为nginx转发了请求，如果关闭云主机的3001端口，则只能通过nginx访问)  
### docker-compose入门
到了这里其实部署应用的基本操作已经介绍的差不多了，但是肯定还有较真的读者会问：刚才的部署操作还是太过繁琐，如果有多个容器之间互相级联的需求，或者单纯想做进一步的持续集成，有没有对应的解决方法呢?比如我的应用需要node服务，静态文件服务和redis数据库这三者配合起来使用，有没有统一集成的解决方案?这就要引出我们的`docker-compose`工具。docker-compose可以通过脚本构建多容器协作的docker服务，通过`.yml`文件来进行配置，功能强大。  
首先安装`docker-compose`:
```
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```
添加执行权限：
```
sudo chmod +x /usr/local/bin/docker-compose
```
创建软连接：
```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```
检验是否安装成功：
```
[root@iZj6cavaweeoyi3tqucik6Z ~]# docker-compose --version
docker-compose version 1.24.1, build 4667896b
```
接下来我们创建测试目录，在其中创建如下文件：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708f12bf27fcced?w=209&h=66&f=png&s=4036)  
backend下的Dockerfile就是前文例子中的那个Dockerfile文件，接下来编写我们的配置文件`docker-compose.yml`:
```
version: "2.0"
services:
  # 定义我们的后端服务
  newbackend:
    # 定义构建方式：通过目标目录下的dockerfile构建
    build: ./backend
    restart: always
    container_name: newbackend

  # 定义我们的nginx服务
  nginx-host:
    # 定义构建方式，这里表示通过本地镜像构建
    image: nginx
    restart: always
    # 定义我们需要挂载到docker容器中的内容
    volumes:
        - 你的nginx配置文件目录/compose.conf:/etc/nginx/nginx.conf:ro
        - 你的静态文件目录:/usr/share/nginx/html
    ports:
    # 定义端口映射
      - "81:80"
    links:
    # 定义容器间的链接
      - newbackend
    container_name: nginx-host
```
这里的`compose.conf`文件跟之前的`mynginx.conf`文件几乎一致，唯一的不同只在api请求转发的配置处：
```
...
		location /api {
            # 这里不再填内网地址了，改成docker容器的名字
			proxy_pass http://newbackend:4000;
		}
...
```
之后进入测试文件夹，执行如下命令：
```
docker-compose up -d
```
表示以守护进程的形式执行文件夹中的`docker-compose.yml`文件，完成后会自动运行容器。此时会构建一个镜像：
```
[root@iZj6cavaweeoyi3tqucik6Z dockerComposeNginx+Dash+back]# docker images
REPOSITORY                              TAG                 IMAGE ID            CREATED             SIZE
dockercomposenginxdashback_newbackend   latest              a49a7ba8a7e2        6 days ago          1.13GB
```
查看我们的本地镜像，我们发现此时创建了一个以`docker-compose.yml`所在文件夹和容器名称命名的镜像(这是由backend下的Dockerfile生成的)，再查看容器：
```
[root@iZj6cavaweeoyi3tqucik6Z dockerComposeNginx+Dash+back]# docker ps -a
CONTAINER ID        IMAGE                                   COMMAND                  CREATED             STATUS                    PORTS                        NAMES
3fc5ea5c788f        nginx                                   "nginx -g 'daemon of…"   12 minutes ago      Up 5 minutes              0.0.0.0:80->80/tcp           nginx-host
c5bfc139980f        dockercomposenginxdashback_newbackend   "docker-entrypoint.s…"   12 minutes ago      Up 6 minutes              4000/tcp                     newbackend
```
此时我们发现docker-compose自动帮我们创建了连个容器来运行服务，名字分别为`nginx-host`和`newbackend`，跟我们`docker-compose.yml`定义的容器名称一一对应。现在在浏览器中访问云主机的ip和对应端口，我们会发现静态服务和api都已经部署好了。  
静态站点：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708f94d336f133e?w=1039&h=574&f=png&s=79080)  
api服务：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708f9610171f46c?w=516&h=341&f=png&s=33971)  
这里再列举下`docker-compose`的常用命令：  
* docker-compose build 构建或重新构建你的服务 --no-cache禁止使用缓存(如果发现重新构建后服务没有更新，可以添加)  
* docker-compose up -d 以守护进程启动服务，如果首次运行会自动build  
* docker-compose stop 关闭服务，这个服务下的所有容器都会stop  
* docker-compose down 关闭并且移除容器，内建网络，镜像和挂载的内容卷  
* docker-compose restart 重启你的服务  
* docker-compose help 查看其他命令  

注意，跟服务相关的命令运行时要在`docker-compose.yml`所在的文件夹中，否则会报错。到此为止，服务的部署和上线基本告一段落。此时服务的架构大致如下图所示(可以对比下使用`docker-compose`之前的图)：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1709035167fa8e55?w=573&h=527&f=png&s=37096)  

# 通过jenkins持续集成
以我自己的项目为例，如果项目需要更新需要做的是：
1. 如果是静态站点更新，需要手动更新代码重新打包，并上传到云主机对应目录(如果你的云机器够强，支持在虚拟机内打包，就不用上传)  
2. 如果是api服务更新，需要通过docker-compose重新依据新代码构建服务并启动  

这些操作都需要ssh远程登录云主机并且通过命令行进行操作，如果想要进一步解放生产力，完成所谓的`一键发版`,我们需要借助CI/CD工具，这里我们引入`jenkins`,jenkins是开源的基于web实现的自动化服务器，可用于持续集成，它本身是通过java写的。jenkins推荐通过docker容器来进行部署在云主机上，笔者由于穷买的是底配机器，跑不起来java虚拟机(连webpack打包也会报内存溢出)，所以选择部署在自己的windows本地机上（下载的安装包），云主机上的部署流程网上有很多的教程，笔者就不赘述了。  
jenkins安装好之后，需要安装git等等配合的插件，方便后续流程。为了让jenkins能够远程登录云主机执行命令，我们需要在jenkins的系统配置里添加本地私钥和云主机的ip地址：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fc70c6ce564f?w=1540&h=536&f=png&s=54270)  
之后我们新建项目：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fbce87187556?w=841&h=179&f=png&s=17469)  
新建一个自由项目：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fbdb95bb18e5?w=804&h=233&f=png&s=24169)  
项目配置中其他的内容(源码管理、构建触发器、构建环境等)都无需配置，我们直接配置构建脚本：  
针对静态站点，更新思路如下：  
1. 本地代码完成修改
2. jenkins通过脚本本地打包，让后将打包文件推送到远端仓库
3. jenkins通过ssh远程登录云主机，进入目录git pll拉取代码完成更新  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fd32a89bb76e?w=1393&h=954&f=png&s=95081)  

针对后台服务，更新思路如下：  
1. 本地代码完成修改并推送到远程仓库  
2. jenkins远程登录云主机，执行命令：无缓存重新构建服务并重启  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fd45620f97aa?w=1388&h=665&f=png&s=61598)  

配置完成后在项目页面点击`Build Now`即可开启构建。

## 备注
往云主机传输文件，可以使用ssh自带的`scp`命令：
```
scp -r 本地文件 云主机用户名@云主机公网ip:云主机目标路径
```
如果显示没有权限，可能是jenkins没有找到正确的私钥，可以通过`-i`手动指定：
```
scp -i 本地私钥路径 -r 本地文件 云主机用户名@云主机公网ip:云主机目标路径
```
执行windows commond时，如果ssh相关服务报没有权限，可以运行`services.msc`, 选择jenkins服务，设置登录的用户为本机用户：  
![](https://user-gold-cdn.xitu.io/2020/2/29/1708fe6636036905?w=910&h=600&f=png&s=87696)  

# 参考文献
[docker教程](https://www.runoob.com/docker/docker-tutorial.html)  















