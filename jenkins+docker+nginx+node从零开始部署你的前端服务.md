# 前言
如果你不甘于做一个纯粹的页面仔，想了解一个web应用从编写到到发布到用户可见的全过程，或是想自己玩一点新东西，突破原有的技术圈层，那么本文将是一个很好的入门指南。笔者将从实战入手，尽可能细致地结合当前主流的工具链，以命令行为粒度来讲解一个web应用CI/CD的全过程。有些部分的内容可能过于基础，大神们可以酌情跳过。  
本例的应用架构大致是:一个web静态中台服务，和与之配套的后端服务（通过node实现）。通过nginx部署静态文件（web网站），使用node部署一个后端服务。nginx将静态站和后端服务整合起来，通过80端口将服务暴露给用户。在工程层面使用jenkins持续集成。除了jenkins外，所有的服务都运行在docker容器中，方便快速部署。   

# 虚拟机环境搭建
笔者选择阿里云的ECS(Elastic Compute Service 弹性计算服务)作为虚拟机，其他公司的机器如腾讯云、亚马逊甚至搬瓦工(有境外需求)的vps(Virtual Private Server 虚拟专用服务器)也可参考如下内容，所谓的ECS或者vps都可以简单地理解为云主机上划分出来的一个个虚拟主机。  
## 选择机器配置
在阿里云官网选择ECS相关产品，在产品选购页面可以见到如下的内容：  
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c7966ca507bd?w=1646&h=895&f=png&s=139598)
这里的操作比较傻瓜，点点点一通操作即可，笔者这里的例子使用的是CentOs8系统,选择机器的位置的时候建议香港，下载某些程序包或者资源的时候就不用设置墙内镜像也能获取不错的速度。机器购买成功后，要记得配置机器root账户的密码。这里关于机器的配置我想说几句，机器配置越高，花费越贵，图上是最低配云机器一年的花费(在没有促销活动的情况下)，通常双十一或者凭学生身份或者首次消费均会有不同程度的优惠。如果你想长时间的部署你的服务，建议选择包年，如果只是想短期玩玩，包月甚至按小时服务亦可。针对典型的前端应用，笔者实测最低配的阿里云主机可以胜任部署静态网站或者node服务，但是稍微吃cpu的项目就跑不起来了，比如说webpack打包，还有部署jenkins(jenkins是用java写的，运行需要java虚拟机，比较吃资源)。如果各位土豪不差钱，大可选择高配机器爽一爽。
## 机器属性简介
购买云机器后，可以在ecs实例页面查看你的机器，注意图中划红线的部分内容：
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c822750593e2?w=1688&h=177&f=png&s=45979)  
ip地址一栏有公网ip和内网ip两栏，公网ip就是你的机器能够被外网访问的ip,内网ip就是你的机器内部或者局域网内访问本机的ip，右侧的远程连接可以选择Workbench或者VNC进入机器的命令行,首次通过VNC进入的时候会给你一个随机6位密码，供以后登录使用。  
![](https://user-gold-cdn.xitu.io/2020/2/26/1707f5260be5640d?w=1753&h=341&f=png&s=38317)  
点击远程连接左侧的管理进入实例详情  
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c89a2825ea08?w=793&h=536&f=png&s=48561)  
点击本实例安全组，再点击配置规则进入虚拟机的端口配置页：
![](https://user-gold-cdn.xitu.io/2020/2/25/1707c8bdeb92f3b2?w=1672&h=471&f=png&s=73013)  
这里的端口配置决定了外网能否通过这些端口访问你的机器，默认设置是把常用端口都打开的，如果在操作的过程中发现在外网无法访问你的机器，首先要做的就是检查实例安全组端口配置。在实例功能部署完毕后，建议把除了80和443之外的所有端口都禁掉，保证机器安全。笔者的mongodb服务的数据库就是因为没有关闭27017端口，被黑过好几次，这里建议大家提高警惕。
## 安装虚拟机常用工具
我们如果要操控我们的虚拟机，只能通过阿里云提供的web命令行么?肯定不是。为了在开发过程中方便远程登录，我们可以安装openSSH-server并开启机器的ssh服务，同时为了方便进行文件操作(比如上传下载等)，我们还需要安装vsftpd并开启ftp服务。注意，请确保你的实例安全组的21端口（ftp服务）和22（ssh服务）端口在调试时保持开启。    
[openSSH安装与配置](https://www.cnblogs.com/liuhouhou/p/8975812.html)  
[阿里云ssh官方指导](https://help.aliyun.com/knowledge_detail/141305.html?spm=5176.13910061.0.0.7192146ami7Bu9&aly_as=jE83dxTO)  
[阿里云vsftp服务安装与配置](https://help.aliyun.com/knowledge_detail/60152.html)  
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
docker是现在独树一帜的容器技术，几乎所有的互联网的企业的服务都是部署在docker容器中的。这里我不想搬运官网上的定义和解释，直接结合实操来讲解docker容器的优势。在传统的服务部署中，每一台虚拟机中都会安装服务的一整套依赖，尽管如此有时候依然会因为平台间的差异导致各种各样的bug。在移除服务的时候，也要同步的移除相关的依赖，这个过程不仅繁琐，还容易处理的不彻底。docker你可以简单地理解为一个沙盒，这个沙盒类似一个极简的虚拟机，在其中你可以安装你的服务及其相关依赖，这个沙盒的启动和重启等等操作都十分迅速，性能优异。正因为是容器，服务的插拔都十分方便，同时这个沙盒可以通过类似于gitHub的系统方便其他机器获取，只要是同一个沙盒，就可以保证其在不同的平台上表现一致，容器本身抹平了几乎所有的差异。
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
如果安装的时候失败，报错信息显示containerd.io的版本过低不符合要求，那么可以本地重新安装containerd.io,首先下载安装包:
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
* 镜像  
网上有很多关于容器和镜像的描述，感觉都十分笼统，不够形象。镜像简单的来说你可以把它理解成一个类，其中包含一些特定的功能，例如本例会使用到的nginx镜像，node镜像等等，甚至还有操作系统的镜像centOs。业界常用的应用或软件都有对应的官方镜像。镜像中整合了一定的功能，用户可以自定义自己的镜像并且将其push到仓库。  
* 容器  
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
我们可以使用exec指令让一个运行中的容器执行指令，这里我们使用交互终端的形式，在名为node-test的容器中运行bash,即开启命令行。在容器中我们可以使用`node -v`查看版本，查看目录等等，此时的docker容器就像是一个新的虚拟机，内部有着最基本centos系统架构和node。使用exit指令可以退出容器回到我们云主机。`exec`指令和`attach`指令有着类似的功能，唯一的不同是使用exec退出时并不会终止容器。到这里聪明的读者们应该已经知道所谓的服务部署在docker里是怎么回事。接下来我们要做什么就呼之欲出了：
```
1. 拉取nginx镜像，并创建nginx容器
2. 在node容器中部署我们的业务代码
3. 修改nginx的配置，把我们的服务通过云主机的端口暴露给外网
```
这里给大家列出来一些常用的关于image(镜像)和container(容器)的命令
## docker image和container常用指令
docker ps –a 查看所有的容器  
docker sotp 容器id或名称 关闭容器  
docker restart 容器id或名称 重启容器  
docker exec id或名称 /bin/bash命令行式进入某个容器，如果使用exit退出容器不会停止
docker attach id /bin/bash命令行式进入容器，如果退出容器会停止
docker rm –f id 删除某个容器
docker images 查看当前所有镜像

docker rmi name 删除镜像

docker commit –m=’node+git’ –a=’guanlanlu’ id guanlanlu/node_and_git 从一个容器创建镜像 –m 表示信息 –a表示作者

docker run -itd --name node-test node
交互式已node为镜像创造一个后台运行的容器，名字叫node-test

docker exec -it node-test /bin/bash
命令行形式执行容器，使用exec退出的话，并不会终止当前的容器

Docker run –-name mynginx –d –p 80:80 –v /software/nginx/mynginx.conf:/etc/nginx/nginx.conf nginx
使用本地的nginx镜像创建一个nginx容器，映射80端口，挂载本地文件到etc也就是容器的文件夹下

# nginx配置与docker进阶使用



