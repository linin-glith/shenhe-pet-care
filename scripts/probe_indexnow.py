#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""在服务器上实测 IndexNow：密钥文件 + 每一个引擎端点。

为什么在服务器上跑
服务器出网是直连（不经过本机隧道），而 IndexNow 的限流与验证是按来源算的。
而且这正是部署脚本每次上线后要做的事——**在真实环境里跑一遍，才知道哪条管道是通的**。

官方 FAQ 的三条关键事实（2026-11-03 查）：
  1. 密钥文件要在**根目录**，文件名 = 密钥 + .txt，内容 = 密钥本身；
  2. **首次请求可能返回 202**——引擎收到后会自己去验证密钥，验证完成后后续返回 200；
  3. 每个参与引擎都有**独立的端点**，提交给其中一个即可。
我们现在的 403（UserForbiddedToAccessSite）说的是"这个主机还没被验证过"——
所以要试的是：**哪个引擎端点肯先替我们验证这个密钥**。
"""
import json
import os
import sys
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")
SITE = "https://shenhezhongke.com"
KEY = "2e1e0eceb7ea47d8863642fac0affb10"

ENDPOINTS = [
    ("共享端点", "https://api.indexnow.org/indexnow"),
    ("Bing", "https://www.bing.com/indexnow"),
    ("Yandex", "https://yandex.com/indexnow"),
    ("Seznam", "https://search.seznam.cz/indexnow"),
    ("Yep", "https://indexnow.yep.com/indexnow"),
    ("Amazon", "https://indexnow.amazonbot.amazon/indexnow"),
    ("Naver", "https://searchadvisor.naver.com/indexnow"),
]

PAYLOAD = {
    "host": "shenhezhongke.com",
    "key": KEY,
    "urlList": ["https://shenhezhongke.com/faq.html"],
}


def key_file():
    url = "%s/%s.txt" % (SITE, KEY)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace").strip()
            print("密钥文件 %s" % url)
            print("  HTTP %s   Content-Type: %s" % (r.status, r.headers.get("Content-Type", "")))
            print("  内容：%r" % body)
            print("  内容就是密钥：%s" % (body == KEY))
            return body == KEY
    except urllib.error.HTTPError as e:
        print("密钥文件 HTTP %s（%s）" % (e.code, e.reason))
        return False
    except Exception as e:
        print("密钥文件取不到：%s: %s" % (type(e).__name__, e))
        return False


def push(name, endpoint):
    body = json.dumps(PAYLOAD).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=body, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8",
                 "User-Agent": "shenhezhongke-deploy/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode("utf-8", "replace").strip()
            print("  %-8s HTTP %-3s %s" % (name, r.status, text[:160]))
            return r.status
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", "replace").strip()
        print("  %-8s HTTP %-3s %s" % (name, e.code, text[:160]))
        return e.code
    except Exception as e:
        print("  %-8s %s: %s" % (name, type(e).__name__, e))
        return None


def main():
    print("=== 密钥文件 ===")
    ok = key_file()
    print()
    print("=== 逐个引擎端点（推 1 个 URL：/faq.html）===")
    if not ok:
        print("密钥文件不合格，先修它——下面的结果没有意义。")
        return 1
    for name, ep in ENDPOINTS:
        push(name, ep)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
