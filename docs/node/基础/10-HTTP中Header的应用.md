# HTTP 中 Header 的应用

[[toc]]

## 1.实现静态服务

mime 模块处理请求文件类型

```sh
npm install mime -g
```

```js
let server = http.createServer((req, res) => {
  let { pathname } = url.parse(req.url);
  // 根据请求路径查找文件
  let absFilePath = path.join(__dirname, pathname);
  fs.stat(absFilePath, (err, stat) => {
    if (err) {
      return res.end(`Not Found`);
    }
    if (stat.isDirectory()) {
      // 尝试查找index.html
      absFilePath = path.join(absFilePath, "index.html");
      fs.access(absFilePath, (err) => {
        if (err) {
          res.end(`Not Found`);
        } else {
          let type = mime.getType(absFilePath);
          res.setHeader("Content-Type", type + ";charset=utf-8");
          fs.createReadStream(absFilePath).pipe(res);
        }
      });
    } else {
      let type = mime.getType(absFilePath);
      res.setHeader("Content-Type", type + ";charset=utf-8");
      fs.createReadStream(absFilePath).pipe(res);
    }
  });
});
server.listen(3000);
```

## 2.通过类改写静态服务

通过 async 和 await 改写主体流程

```js
let http = require("http");
let fs = require("fs").promises;
let { createReadStream } = require("fs");
let url = require("url");
let path = require("path");
let mime = require("mime");
class Server {
  async handleServer(req, res) {
    let { pathname } = url.parse(req.url);
    let absFilePath = path.join(__dirname, pathname);
    try {
      let statObj = await fs.stat(absFilePath);
      if (statObj.isDirectory()) {
        absFilePath = path.join(absFilePath, "index.html");
      }
      this.sendFile(req, res, absFilePath, statObj);
    } catch (err) {
      console.log(err);
      this.sendError(req, res);
    }
  }
  sendFile(req, res, absFilePath, statObj) {
    let type = mime.getType(absFilePath);
    res.setHeader("Content-Type", type + ";charset=utf-8");
    createReadStream(absFilePath).pipe(res);
  }
  sendError(req, res) {
    res.statusCode = 404;
    res.end(`Not Found`);
  }
  start() {
    let server = http.createServer(this.handleServer.bind(this));
    server.listen(...arguments);
  }
}
let server = new Server();
server.start(3000);
```

## 3.ajax 跨域问题

cors 解决跨域问题

```js
"Access-Control-Allow-Origin", "http://a.zf.cn:5000"; // 允许某个域访问
"Access-Control-Allow-Credentials", "true"; // 允许携带cookie
"Access-Control-Allow-Headers", "a"; // 允许携带的header
"Access-Control-Max-Age", "3600"; // 设置options的请求发送时长
```

```js
let xhr = new XMLHttpRequest();
xhr.open("GET", "http://localhost:5000/user", true);
xhr.setRequestHeader("a", "1"); // 设置请求头

xhr.onload = function () {
  console.log(xhr.responseText);
};
xhr.withCredentials = true; // 设置强制携带cookie
xhr.send();
```

跨域配置

```js
res.setHeader("Access-Control-Allow-Origin", "http://a.zf.cn:5000");
res.setHeader("Access-Control-Allow-Credentials", "true");
res.setHeader("Access-Control-Max-Age", 3600);
res.setHeader("Access-Control-Allow-Headers", "a");
if (req.method === "OPTIONS") {
  // options请求直接结束即可
  return res.end();
}
```

## 4.http 缓存问题

### 强制缓存 (Cache-Control && Expires)

Cache-Control:

- private 客户端可以缓存
- public 客户端和代理服务器都可以缓存
- max-age=60 缓存内容将在 60 秒后失效
- no-cache 需要使用对比缓存验证数据,强制向源服务器再次验证 (没有强制缓存)
- no-store 所有内容都不会缓存，强制缓存和对比缓存都不会触发 (不缓存)

<div align="center"><img :src="$withBase('/images/node/cache2.png')" alt="node/cache2.png"></div>

### 对比缓存

- Last-Modified & If-Modified-Since
- ETag & If-None-Match

<div align="center"><img :src="$withBase('/images/node/cache4.png')" alt="node/cache4.png"></div>

## 5.压缩与解压缩处理(accept-encoding)

使用 GZIP / DEFLATE 实现解压

```js
var zlib = require("zlib");
var fs = require("fs");
var http = require("http");
http
  .createServer(function (request, response) {
    var raw = fs.createReadStream("." + request.url);
    var acceptEncoding = request.headers["accept-encoding"];
    if (!acceptEncoding) {
      acceptEncoding = "";
    }
    if (acceptEncoding.match(/\bdeflate\b/)) {
      response.setHeader("Content-Encoding", "deflate");
      raw.pipe(zlib.createDeflate()).pipe(response);
    } else if (acceptEncoding.match(/\bgzip\b/)) {
      response.setHeader("Content-Encoding", "gzip");
      raw.pipe(zlib.createGzip()).pipe(response);
    } else {
      raw.pipe(response);
    }
  })
  .listen(9090);
```

## 6.多语言 (accept-language)

```js
let http = require("http");
let pack = {
  en: {
    title: "hello",
  },
  cn: {
    title: "欢迎",
  },
};

function request(req, res) {
  let acceptLangulage = req.headers["accept-language"];
  let lan = "en";
  if (acceptLangulage) {
    lan = acceptLangulage
      .split(",")
      .map((item) => {
        let values = item.split(";");
        return {
          name: values[0].split("-")[0],
          q: isNaN(values[1]) ? 1 : parseInt(values[1]),
        };
      })
      .sort((lan1, lan2) => lan1.q - lan2.q)
      .shift().name;
  }
  res.end(pack[lan] ? pack[lan].title : pack["en"].title);
}
let server = http.createServer();
server.on("request", request);
server.listen(8080);
```
