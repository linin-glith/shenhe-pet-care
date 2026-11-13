#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把 Bing 里新生成的密钥托管上去，然后逐端点 × 逐形式实测。

WHAT THIS SETTLES
Bing 的《开始使用》页给了四步，��第 3 步的响应码表把 403 的含义写死了：
"如果密钥无效（例如找不到密钥，找到文件但密钥不在文件中）"。
而我们实测到的是：
    共享端点 403 · Bing 403 · Yandex 202→200 · Seznam/Yep/Amazon/Naver 200

两种解释：
  A. 密钥无效（文件找不到 / 文件里没有密钥）
  B. 这个引擎还没在它的站长后台里验证过这个主机

B 假设下，Yandex 也该是 403（它也没验证过），但它是 200——所以 B 不成立得更彻底：
**至少对 Yandex 来说，我们的密钥文件是被认可的**。
那 Bing 为什么还 403？剩下的可能是**提交形式**：
文档的第 3 步给的是 GET（url + key 作为查询参数），
而我们的脚本用的是 POST（JSON body）。如果某个端点不读 POST body，
它就"找不到密钥" → 403。

所以这一次把每个端点 × 每种形式都试一遍：
  POST JSON（无 keyLocation）
  POST JSON（带 keyLocation）
  GET（url + key 查询参数）
× 两个密钥（我们现有的 / Bing 里新生成的）。

Why this matters
如果我们推的密钥和 Bing 后台里记的不是同一个，Bing 就永远不认；
如果形式不对，密钥再对也没用。这两件事测出来才知道。
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
SITE = "https://shenhezhongke.com"
KEY_OURS = "2e1e0eceb7ea47d8863642fac0affb10"
KEY_BING = "c1998c9829d2420692ca88095d4b0d7f"
URL = "https://shenhezhongke.com/faq.html"

ENDPOINTS = [
    ("共享", "https://api.indexnow.org/indexnow"),
    ("bing", "https://www.bing.com/indexnow"),
    ("yandex", "https://yandex.com/indexnow"),
    ("seznam", "https://search.seznam.cz/indexnow"),
    ("yep", "https://indexnow.yep.com/indexnow"),
    ("amazon", "https://indexnow.amazonbot.amazon/indexnow"),
    ("naver", "https://searchadvisor.naver.com/indexnow"),
]


def post_json(endpoint, payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=body, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8",
                 "User-Agent": "shenhezhongke-deploy/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace").strip()[:90].replace("\n", " ")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace").strip()[:90].replace("\n", " ")
    except Exception as e:
        return type(e).__name__, str(e)[:90]


def get(endpoint, url, key):
    q = urllib.parse.urlencode({"url": url, "key": key})
    req = urllib.request.Request(endpoint + "?" + q,
                                 headers={"User-Agent": "shenhezhongke-deploy/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace").strip()[:90].replace("\n", " ")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace").strip()[:90].replace("\n", " ")
    except Exception as e:
        return type(e).__name__, str(e)[:90]


def key_file(key):
    url = "%s/%s.txt" % (SITE, key)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return r.status, raw.decode("utf-8", "replace"), r.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        return e.code, "", ""
    except Exception as e:
        return type(e).__name__, "", ""


def main():
    print("=== 密钥文件现状（原始字节，含换行就看出来了）===")
    for k in (KEY_OURS, KEY_BING):
        st, body, ct = key_file(k)
        print("  %s.txt -> HTTP %s  %r  %s" % (k[:12], st, body, ct))

    print()
    print("=== 每个端点 × 每种形式 × 每个密钥 ===")
    for name, ep in ENDPOINTS:
        for klabel, key in (("ours", KEY_OURS), ("bing", KEY_BING)):
            base = {"host": "shenhezhongke.com", "key": key, "urlList": [URL]}
            withloc = dict(base)
            withloc["keyLocation"] = "%s/%s.txt" % (SITE, key)
            a = post_json(ep, base)
            b = post_json(ep, withloc)
            c = get(ep, URL, key)
            print("  %-8s %-5s  POST %-4s | POST+loc %-4s | GET %-4s" % (name, klabel, a[0], b[0], c[0]))


if __name__ == "__main__":
    main()
