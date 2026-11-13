# -*- coding: utf-8 -*-
"""第 49 轮：部署脚本保留 BingSiteAuth.xml（验证凭据不能被下次上线删掉）。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")

SECTION = """

## 第 49 轮：验证凭据会被下一次上线删掉——提前堵上（2026-11-03 下午）

### 起因

用户要去 Bing Webmaster Tools 做域名验证。动手前先查了一件事：
`BingSiteAuth.xml` 放在哪里才能活过下一次上线。

### 问题

`/usr/local/bin/shenhe-deploy` 每次上线把整个站点目录换掉
（`mv "$ROOT" "$OLDBACK"; mv "$STAGE" "$ROOT"`）。
IndexNow 的密钥文件之所以每次都还在，是因为脚本末尾有一份 KEYS 名单，
把 `/data/shenhe/keys/` 里的文件拷回新目录。

**`BingSiteAuth.xml` 会走同一条路。** 它是 Bing 验证这个域的凭据，
按官方要求放在站点根目录（`https://shenhezhongke.com/BingSiteAuth.xml`）。
如果只是放进站点目录而没进那份名单，**下一次上线它就没了**——
而 Bing 那边的验证会在某一天悄悄失效，而且**没有任何报错指向原因**：
推送脚本只会说"还没验证过"，看起来像是我们没做，其实文件早被删了。

### 修法

服务器的 `/usr/local/bin/shenhe-deploy`（备份 `shenhe-deploy.bak.20261103_162449`）
的 KEYS 名单加上 `BingSiteAuth.xml`：

```
KEYS="indexnow-key.txt indexnow.txt 2e1e0eceb7ea47d8863642fac0affb10.txt BingSiteAuth.xml"
```

名单里多一个不存在的文件是无害的（`[ -f ... ] &&` 会跳过），
所以**在拿到文件之前就可以先改好**。

> **这是一类值得记住的坑**：任何**放在站点根目录的凭据文件**，
> 都要先进这份名单，否则它活不过下一次部署。
> 现在名单里是三个 IndexNow 相关的 + 一个 Bing 验证文件。
"""


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "第 49 轮" in raw:
        print("the round 49 section is already there")
        return
    if not raw.endswith("\n"):
        raw += "\n"
    io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw + SECTION.lstrip("\n"))
    print("the ledger: the round 49 section is written")


if __name__ == "__main__":
    main()
