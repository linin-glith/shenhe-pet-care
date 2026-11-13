#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把 Bing 验证那一步改写成可以照着点的操作手册。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, "docs", "搜索引擎收录-你要做的三步.md")

OLD = """**入口**：https://www.bing.com/webmasters

1. 「从 Google Search Console 导入」→ 直接导入上面的 `shenhezhongke.com` 属性
   （这样最省事，不用再验证一次）。
2. 导入后到「**网站** → 设置 → 验证**」，
   把它给出的 `BingSiteAuth.xml` 内容放到服务器的站点根目录：

   ```
   /www/wwwroot/shenhezhongke.com/BingSiteAuth.xml
   ```

   放好之后，线上 `https://shenhezhongke.com/BingSiteAuth.xml` 要返回 **200**。
   **告诉我一声，我来放**（上传并验证一步到位），或者你放完我帮你复验。
3. 验证通过后，IndexNow 推送会被接受——脚本已经在每次部署后自动跑，
   不用你再做什么。"""

NEW = """### 入口

**https://www.bing.com/webmasters**

用 **Microsoft、Google 或 Facebook** 账号登录。
**用你在 GSC 那个 Google 账号最省事**——下面第一种方式要用它。

### 第一步 · 把站点加进去（二选一，先试第一种）

**A. 从 Google Search Console 导入（推荐）**

登录后的首屏有两个选项：「**从 Google Search Console 导入**」和「添加网站」。
选前者 → 用拥有 `shenhezhongke.com` 属性的那个 Google 账号登录 →
勾选这个站点 → 点「导入」。

> 按官方说明，**导入会把 GSC 里已验证的站点和它的 sitemap 一起带过来**，
> 所以很多时候**根本不需要再放验证文件**，站点直接就在 Bing 里活着了。
> 这一步做完，先看第���步的 sitemap 列表里有没有我们的 URL——有就成了。

**B. 手动添加**（导入不成功、或提示要验证时用）

输入完整网址 `https://shenhezhongke.com` → 点「添加」→ 选一种验证方式。

### 第二步 · 验证（如果它还要你证明你是站长）

Bing 会给你两样东西之一，**任选其一**：

**方法 1 · XML 文件（推荐——我一条命令就能放好）**

- Bing 给你一个 `BingSiteAuth.xml`，下载到本地。
- **把文件内容贴给我**（就那几行 XML），或者告诉我它在你电脑上的路径。
- 我放到站点根目录，然后 `https://shenhezhongke.com/BingSiteAuth.xml` 就要返回 **200**。
- 回 Bing 点「**验证**」。

**方法 2 · HTML meta 标签**

- Bing 给你一行 `<meta name="msvalidate.01" content="XXXXXXXX" />`。
- **贴给我**，我加到首页 `<head>` 里，重新构建并上线，再回 Bing 点「验证」。
- 比方法 1 慢一轮（要重新上线），但效果一样。

**方法 3 · DNS CNAME** — 要改 DNS，我们不走这条。

> ✅ **一个坑我已经提前堵了**：
> 部署脚本每次上线会把整个站点目录换掉。`BingSiteAuth.xml` 是验证凭据，
> 如果只放进站点目录而没进保留名单，**下一次上线它就没了**，
> 而 Bing 那边的验证会在某天悄悄失效，且没有任何报错指向原因。
> 我已经把服务器上的 `/usr/local/bin/shenhe-deploy` 改了
> （备份 `shenhe-deploy.bak.20261103_162449`）：
> 它现在和 IndexNow 密钥一样，每���上线都把 `BingSiteAuth.xml` 拷回新目录。

### 第三步 · 提交 sitemap

左侧菜单「**网站地图**」→ 「提交网站地图」→ 逐条提交这 4 个地址：

```
https://shenhezhongke.com/sitemap-index.xml
https://shenhezhongke.com/sitemap.xml
https://shenhezhongke.com/sitemap-ai.xml
https://shenhezhongke.com/sitemap-images.xml
```

第一条是索引，它自己会带出下面三个；如果索引被拒，就单独补一次 `sitemap.xml`。

### 第四步 · 提交 URL（Bing 每天上限 100 个）

左侧菜单「**URL 提交**」→ 「提交 URL」→ 每行一个 → 送出。
先贴这 3 个（和 GSC 那次是同一批）：

```
https://shenhezhongke.com/
https://shenhezhongke.com/products.html
https://shenhezhongke.com/faq.html
```

之后把 `docs/GSC-请求收录清单.md` 里那 22 个产品页也贴进去（一天内贴完，
之后隔几天再贴一次，不要每天重复贴同一批）。

### 第五步 · 回来验一次 IndexNow

验证通过后，Bing 与共享端点也会开始接受推送。
**你说一声，我重跑一次推送脚本**，那一行应该从 `5 / 7` 变成 `7 / 7`。"""

OLD2 = """3. 验证通过后，IndexNow 推送会被接受——脚本已经在每次部署后自动跑，
   不用你再做什么。"""

NOTE = """
> **为什么这一步值得做**：Bing 是 IndexNow 的接收方之一，而 IndexNow 是
> "页面变了就告诉搜索引擎"的那条管道。
>
> **现状（2026-11-03 实测）**：密钥文件已经发在根目录、内容正确，
> 每次上线自动推送 68 个 URL。**7 个参与端点里 5 个已经在收**——
> Yandex、Seznam、Yep、Amazon、Naver。
> 还在拒的只有 **Bing 与共享端点**，它们返回的是
> "这个主机还没被验证"（403），而不是请求写错了。
> **换句话说：管道本身是通的，缺的是这一次验证。**
> 验证之后，这一行会变成 7/7。
>
> 另外两条"替代管道"已经废弃，别去试了：Bing 的 sitemap ping 返回 410 Gone，
> Google 的 ping 返回 404 并明确写着 ping 已被弃用。"""


def main():
    doc = io.open(DOC, encoding="utf-8", newline="").read()
    if "### 入口" in doc and "方法 1 · XML 文件" in doc:
        print("the guide is already the step-by-step version")
        return
    if OLD not in doc:
        raise SystemExit("the anchor was not found")
    doc = doc.replace(OLD, NEW, 1)
    io.open(DOC, "w", encoding="utf-8", newline="").write(doc)
    print("the guide: the Bing steps are now click-by-click")


if __name__ == "__main__":
    main()
