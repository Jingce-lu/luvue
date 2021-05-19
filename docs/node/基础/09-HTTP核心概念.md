# HTTP 核心概念

[[toc]]

## 1）什么是 HTTP?应用层

通常的网络是在 TCP/IP 协议族的基础上来运作的，HTTP 是一个子集。

## 2）TCP/IP 协议族 (HTTP 应用层协议 在传输层的基础上增加了一些自己的内容)

协议简单来说就是通信的规则，例如：通信时谁先发起请求，怎样结束，如何进行通信。把互联网相关的协议统称起来称为 TCP/IP

## 3）协议分层(OSI 协议分层)

(物，数)，网，传，(会，表，应)

- 应用层 HTTP,FTP,DNS (与其他计算机进行通讯的一个应用服务，向用户提供应用服务时的通信活动)
- 传输层 TCP（可靠） UDP 数据传输 (HTTP -> TCP DNS->UDP)
- 网络层 IP 选择传输路线 (通过 ip 地址和 mac 地址)(使用 ARP 协议凭借 mac 地址进行通信)
- 链路层 网络连接的硬件部分

<div align="center"><img :src="$withBase('/images/node/tpchttp.png')" alt="node/tpchttp.png"></div>

## 4) HTTP 特点

- http 是不保存状态的协议，使用 cookie 来管理状态 (登录 先给你 cookie 我可以看一下你有没有 cookie)
- 为了防止每次请求都会造成无谓的 tcp 链接建立和断开，所以采用保持链接的方式 keep-alive
- 以前发送请求后需要等待并收到响应，才能发下一个，现在都是管线化的方式 (js css 可以并发请求 6 2) cdn

## 5) HTTP 缺点

通信采用明文

不验证通信方的身份

无法验证内容的完整性 (内容可能被篡改)

> 通过 SSL（安全套阶层）建立安全通信线路 HTTPS (超文本传输安全协议)

## 6) HTTP 方法 (get post 简单请求) Resful 风格

- GET:获取资源 /user？
- POST:传输实体主体 请求体中
- PUT：来传输文件
- HEAD: 获取报文首
- DELETE: 删除文件
- OPTIONS:询问支持的方法 跨域 如果默认发送的是 get/post 不会发送 options 的 ""复杂请求""
- get /post (a:1) headers:{a:1} put / delete 复杂的请求

**REST API** Resful 风格 根据路径和不同的方法 就能确定对资源进行什么操作

跨域是浏览器之前的 服务器之间没有跨域问题 反向代理 、后端设置 cors

c.com-> d.com OPTIONS 非简单请求会发送 options (options 直接返回 ok 就可以了)

## 7) HTTP 状态码 (发请求 命令行 curl 命令) 服务端

curl 命令行工具 postman

- 1xx 信息性状态码 websocket upgrade
- 2xx 成功状态码 200 204(没有响应体) 206(范围请求 暂停继续下载) 获取网页的部分请求
- 3xx 重定向状态码 301 302 303 post -> get 304(删除报文主体 在次发送请求) 307 (不会从 POST 转为 GET)
- 4xx 客户端错误状态码 400 401 403 404 405 方法不允许
- 5xx 服务端错误状态码 500 503

## 8) http 客户端和服务端通信

Http 报文，http 交互的信息称之为 http 报文

<div align="center"><img :src="$withBase('/images/node/requestheader.png')" alt="node/requestheader.png"></div>

通用首部字段：请求和响应报文都有的首部

实体首部字段：描述实体部分的字段

<div align="center"><img :src="$withBase('/images/node/request.png')" alt="node/request.png"></div>
<div align="center"><img :src="$withBase('/images/node/response.png')" alt="node/response.png"></div>

## 9) URI 和 URL

### URI

URI(Uniform Resource Identifier)是统一资源标识符,在某个规则下能把这个资源独一无二标示出来，比如人的身份证号

- Uniform 不用根据上下文来识别资源指定的访问方式
- Resource 可以标识的任何东西
- Identifier 表示可标识的对象

### URL

统一资源定位符，表示资源的地点，URL 时使用浏览器访问 WEB 页面时需要输入的网页地址

- Uniform 不用根据上下文来识别资源指定的访问方式
- Resource 可以标识的任何东西
- Location 定位

<div align="center"><img :src="$withBase('/images/node/urlformat.png')" alt="node/urlformat.png"></div>

## 10) 报文应用

Content-Encoding : gzip 压缩 form-data: 多部分对象集合 上传文件

range: 范围请求 206 accept-language：内容协商 前端控制 后端控制

host：单主机多域名 304 http 缓存

referer:访问来源 防盗链 proxy:代理、网关和隧道

user-agent:用户内核 安全相关的头: X-Frame-Options、X-XSS-Protection (安全 csrf xss https 加密)
