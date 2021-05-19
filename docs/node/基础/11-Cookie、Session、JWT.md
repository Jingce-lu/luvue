# Cookie、Session、JWT

[[toc]]

## cookie+session 实现登录权限

```sh
yarn add koa koa-router koa-views koa-bodyparser koa-session
```

```js
let Koa = require("koa");
let Router = require("koa-router");
let bodyparser = require("koa-bodyparser");
let views = require("koa-views");
let session = require("koa-session");
let router = new Router();
let app = new Koa();
app.use(bodyparser());
app.use(session({}, app));
app.keys = ["zf"];
app.use(
  views(__dirname + "/views", {
    map: {
      html: "ejs",
    },
  })
);
router.get("/", async (ctx) => {
  // 默认访问首页
  await ctx.render("home.html");
});
router.post("/list", async (ctx) => {
  let { username, password } = ctx.request.body;
  if (username === password) {
    // 用户名和密码相等就认为用户登录过了
    ctx.session.user = { username };
    ctx.redirect("/list");
  } else {
    ctx.redirect("/");
  }
});
router.get("/list", async (ctx) => {
  // 登陆后才能访问 获取列表页面
  let { username } = ctx.session.user || {};
  if (username) {
    let r = await ctx.render("list.html", { username });
    console.log(r);
  } else {
    ctx.redirect("/");
  }
});
app.use(router.routes());
app.listen(4000);
```

## 1.什么是 jwt？

JSON Web Token（JWT）是目前最流行的跨域身份验证解决方案

- **解决问题**：session 不支持分布式架构，无法支持横向扩展，只能通过数据库来保存会话数据实现共享。如果持久层失败会出现认证失败。
- **优点**：服务器不保存任何会话数据，即服务器变为无状态，使其更容易扩展

JWT 包含了使用`.`分隔的三部分

- Header 头部
  ```js
  { "alg": "HS256", "typ": "JWT"}
  // algorithm => HMAC SHA256
  // type => JWT
  ```
- Payload 负载、载荷
  ```
  JWT 规定了7个官方字段
  iss (issuer)：签发人
  exp (expiration time)：过期时间
  sub (subject)：主题
  aud (audience)：受众
  nbf (Not Before)：生效时间
  iat (Issued At)：签发时间
  jti (JWT ID)：编号
  ```
- Signature 签名
  对前两部分的签名，防止数据篡改
  ```js
  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret);
  ```

JWT 作为一个令牌（token），有些场合可能会放到 URL（比如 api.example.com/?token=xxx）。Base64 有三个字符+、/和=，在 URL 里面有特殊含义，所以要被替换掉：=被省略、+替换成-，/替换成\_ 。这就是 Base64URL 算法。

## 2.使用方式

HTTP 请求的头信息 `Authorization` 字段里面

```
Authorization: Bearer <token>
```

通过 url 传输

```
http://www.xxx.com/pwa?token=xxxxx
```

如果是 post 请求也可以放在请求体中

## 3.实际应用

```js
let Koa = require("koa");
let Router = require("koa-router");
let bodyparser = require("koa-bodyparser");
let jwt = require("jwt-simple");
let router = new Router();
let app = new Koa();
app.use(bodyparser());
let secret = "zfpx";
// 验证是否登陆
router.post("/login", async (ctx) => {
  let { username, password } = ctx.request.body;
  if (username === "admin" && password === "admin") {
    let token = jwt.encode(username, secret);
    ctx.body = {
      code: 200,
      username,
      token,
    };
  }
});
// 验证是否有权限
router.get("/validate", async (ctx) => {
  let Authorization = ctx.get("authorization");
  let [, token] = Authorization.split(" ");
  if (token) {
    try {
      let r = jwt.decode(token, secret);
      ctx.body = {
        code: 200,
        username: r,
        token,
      };
    } catch (e) {
      ctx.body = {
        code: 401,
        data: "没有登陆",
      };
    }
  } else {
    ctx.body = {
      code: 401,
      data: "没有登陆",
    };
  }
});
app.use(router.routes());
app.listen(4000);
```

## 4.原理实现

```js
let myJwt = {
  sign(content, secret) {
    let r = crypto
      .createHmac("sha256", secret)
      .update(content)
      .digest("base64");
    return this.base64urlEscape(r);
  },
  base64urlEscape(str) {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  },
  toBase64(content) {
    return this.base64urlEscape(
      Buffer.from(JSON.stringify(content)).toString("base64")
    );
  },
  encode(username, secret) {
    let header = this.toBase64({ typ: "JWT", alg: "HS256" });
    let content = this.toBase64(username);
    let sign = this.sign([header, content].join("."), secret);
    return [header, content, sign].join(".");
  },
  base64urlUnescape(str) {
    str += new Array(5 - (str.length % 4)).join("=");
    return str.replace(/\-/g, "+").replace(/_/g, "/");
  },
  decode(token, secret) {
    let [header, content, sign] = token.split(".");
    let newSign = this.sign([header, content].join("."), secret);
    if (sign === newSign) {
      return Buffer.from(this.base64urlUnescape(content), "base64").toString();
    } else {
      throw new Error("被篡改");
    }
  },
};
```

> jsonwebtoken https://www.npmjs.com/package/jsonwebtoken
