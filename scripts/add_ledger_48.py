#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""第 48 轮：IndexNow 实测与推送脚本改写 + 文档回填。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")
DOC = os.path.join(ROOT, "docs", "搜索引擎收录-你要做的三步.md")

LEDGER_SECTION = """

## 第 48 轮：IndexNow 实测——原来推给了两个正在拒绝我们的引擎（2026-11-03 下午）

### 起因

用户发来 IndexNow 官网的说明页。顺着查了官方 FAQ，把 403 的原因查准了。

### 一、官方 FAQ 里的三条关键事实

1. 密钥文件要在**根目录**，文件名 = 密钥 + `.txt`，内容 = 密钥本身；
2. **首次请求可能返回 202**——"引擎收到了，会自己去验证你的密钥，验证完成后后续返回 200"；
3. 每个参与引擎都有**独立的端点**，提交给其中一个即可。

**403 不在 FAQ 列的错误码里**（它只列了 200 / 202 / 400 / 422 / 429），
而它的正文写着 "Please verify the site using the key"——是"这个主机还没被验证"，
不是"你的请求写错了"。重试没有用。

### 二、实测（服务器出网直连，用真密钥）

```
密钥文件 https://shenhezhongke.com/2e1e0eceb7ea47d8863642fac0affb10.txt
  HTTP 200   Content-Type: text/plain; charset=utf-8   内容 = 密钥本身 ✓

共享端点 api.indexnow.org        403
Bing      www.bing.com/indexnow 403
Yandex    yandex.com/indexnow   202 → 再推 200   ✓ 已验证
Seznam    search.seznam.cz       200  ✓
Yep       indexnow.yep.com       200  ✓
Amazon    indexnow.amazonbot.amazon 200 ✓
Naver     searchadvisor.naver.com 200 ✓
```

**旧脚本推的恰好是拒绝我们的那两个**（共享端点 + Bing），
而且把 403 当成失败打出来——**看起来像管道坏了，其实是两个引擎没验证我们**。

顺带测了两条"替代管道"，都不通：
- `www.bing.com/ping?sitemap=...` → **410 Gone**（已废弃）
- `www.google.com/ping?sitemap=...` → **404**，并明确写 "Sitemaps ping is deprecated"

### 三、改了什么

`/usr/local/bin/push-indexnow.sh`（仓库里同名文件同步改了，备份
`push-indexnow.sh.bak.20261103_160638`）：

- 推送**全部 7 个端点**，不再是 2 个；
- 响应码分类：200/202 = 接受；**403 = "这个引擎还没验证本站"**（并说明要在哪个站长后台验证）；
  429 = 限流；其它 = 原样打印；
- 结尾汇总"接受本次推送的引擎：N / 7"。

**现在每次上线，7 个引擎里有 5 个会收到我们的 68 个 URL。**
剩下 Bing 与共享端点要等域名在 Bing Webmaster Tools 里被验证（要你的账号）。

### 四、仍然开着的

| 项 | 卡在哪 |
|---|---|
| **Bing 验证域名** | 要你的 Bing 账号；验证完成后共享端点与 Bing 立刻开始接受 |
| GSC 效果报告 | 要等 3–7 天有数据；那时才第一次能看见买家在搜什么词 |
"""

DOC_OLD = """**入口**：https://www.bing.com/webmasters

1. 「从 Google Search Console 导入」→ 直接导入上面的 `shenhezhongke.com` 属性
   （这样最省事，不用再验证一次）。
2. 导入后到「**网站** → 设置 → 验证**」，
   把它给出的 `BingSiteAuth.xml` 内容放到服务器的站点根目录：

   ```
   /www/wwwroot/shenhezhongke.com/BingSiteAuth.xml
   ```

   放好之后，线上 `https://shenhezhongke.com/BingSiteAuth.xml` 要返回 **200**。
   **告诉我一声，我来放**（上传并验证一步到位），或者你放完我帮你复验。
3. 验证通过后，IndexNow 推送会自动被接受——脚本已经在每次部署后自动跑，
   不用你再做什么。

> **为什么这一步值得做**：Bing 是 IndexNow 的接收方之一，而 IndexNow 是
> "页面变了就告诉搜索引擎"的那条管道。我们现在每改一次站，都在推 69 个 URL 给
> 两个引擎，然后被两个引擎拒收。验证一次，之后每一次推送都算数。"""

DOC_NEW = """**入口**：https://www.bing.com/webmasters

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
   不用你再做什么。

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

DOC_OLD2 = """> 顺带：GSC 的「网页索引」报告里，如果还有 URL 报 404，**把那几条抄给我**——
> 这是我们自己的死链清单，比任何对标文档都准。"""

DOC_NEW2 = """> 顺带：GSC 的「网页索引」报告里，如果还有 URL 报 404，**把那几条抄给我**——
> 这是我们自己的死链清单，比任何对标文档都准。

> **还有一件不用你做、我已经做完的事**：IndexNow 的推送脚本原先只推两个端点
> （共享端点 + Bing），而这两个恰好是当时正在拒收我们的引擎——看起来像管道坏了。
> 现在推全部 7 个端点，**其中 5 个已经在收**（Yandex / Seznam / Yep / Amazon / Naver），
> 剩下两个等你在 Bing Webmaster Tools 里验证域名。"""

DOC_OLD3 = """## 第 2 步 · Bing 验证（IndexNow 现在是被拒的）

**现在的症状**：每次上线，服务器会自动推 IndexNow（69 个 URL），两个端点都回

```
403 {"errorCode":"UserForbiddedToAccessSite"}
```

密钥文件是有的、内容也对（`/2e1e0eceb7ea47d8863642fac0affb10.txt` 200），
但**Bing 从没见过这个域**，所以它拒绝接受推送。"""

DOC_NEW3 = """## 第 2 步 · Bing 验证（IndexNow 只差这一次验证）

**现在的症状**：每次上线，服务器会自动推 IndexNow（68 个 URL）。
密钥文件是有的、内容也对（`/2e1e0eceb7ea47d8863642fac0affb10.txt` 200，text/plain），
但 **Bing 与共享端点还没验证过这个域**，所以回

```
403 {"errorCode":"UserForbiddedToAccessSite"}
```

**这不是请求写错了**（官方 FAQ 的错误码表里没有 403，正文写的是
"Please verify the site using the key"），**是"这个主机还没被验证"**。
实测：其余 5 个端点（Yandex / Seznam / Yep / Amazon / Naver）都收。"""

EDITS = [
    (DOC, DOC_OLD3, DOC_NEW3),
    (DOC, DOC_OLD, DOC_NEW),
    (DOC, DOC_OLD2, DOC_NEW2),
]


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "第 48 轮" not in raw:
        if not raw.endswith("\n"):
            raw += "\n"
        io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw + LEDGER_SECTION.lstrip("\n"))
        print("the ledger: the round 48 section is written")

    doc = io.open(DOC, encoding="utf-8", newline="").read()
    for path, old, new in EDITS:
        if old not in doc:
            print("  (already updated) %s" % old[:40])
            continue
        doc = doc.replace(old, new, 1)
    io.open(DOC, "w", encoding="utf-8", newline="").write(doc)
    print("the guide: updated")


if __name__ == "__main__":
    main()
