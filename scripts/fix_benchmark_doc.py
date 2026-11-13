#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把对标文档改对。

一、事实错误
文档里有三处写着深河中科有 "FSC CoC / 印刷许可 / BSCI"。这是**德信力
（另一家公司）的资质**，不是深河中科的。深河中科实际持有的是：ISO 22716
GMP、FDA 设施注册、3 项中国许可（高新技术企业证书 / 消毒产品卫生许可证 /
饲料添加剂生产许可证）、10 份第三方实验室报告（其中 8 个 SKU 有报告覆盖）、
以及全站独有的链上存证与报告哈希自验。

一个把别家公司的资质写进自家对标文档的错误，比没有这一段更糟：它会被
照抄进官网文案。

二、进度回填
P0 七项的完成状态写回表格，P0-1 标注服务器侧改动与备份文件名。
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, "docs", "对标-三家同行-缺项与补站排期.md")

EDITS = [
    # --- 一、事实错误 -------------------------------------------------------
    (
        "| 我们有 FSC 链上存证 + 商标 + 印刷许可，**性质更硬但没被当成专利级论据用** |",
        "| 我们有链上存证 + 10 份报告哈希可自验 + 3 项中国许可，**性质更硬但没被当成专利级论据用** |",
    ),
    (
        "我们的真优势（自营产线、自检、FSC CoC、印刷许可、BSCI）从没被这样用",
        "我们的真优势（自营产线、自检、ISO 22716 GMP、FDA 设施注册、3 项中国许可、报告链上可验）从没被这样用",
    ),
    (
        "| 首页一张表：MSDS / standards / trade-compliance / FSC CoC / 印刷许可 |",
        "| 首页一张表：随货出海的 7 份单证 + MSDS / standards / global-compliance / trade-compliance 四个合规入口 |",
    ),
    (
        "用真实能力填：自营产线、自检、FSC CoC、印刷经营许可证、BSCI/ISO、报告链上可验",
        "用真实能力填：自营产线、自检、ISO 22716 GMP、FDA 设施注册、3 项中国许可、报告链上可验",
    ),
    # --- 二、P0-1 已完成 -----------------------------------------------------
    (
        "| 1 | **修 `/de/`、`/es/` 的 301 → 404 死链**：语言页既然没上线，这两条规则就不该存在（删掉），或语言页上线时一并恢复；顺带把 `i18n-routes-parked` 的恢复路径在 `docs/八语言系统-架构与落地路径.md` 标成待办 | `/etc/nginx/conf.d/shenhe-site.conf`（服务器上改，走备份→`nginx -t`→reload）+ 文档 | 0.5 天 | `/de/`、`/es/` 不再指向 404；GSC「未找到」列表里这两条消失 |",
        "| 1 | **修 `/de/`、`/es/` 的 301 → 404 死链** | `/etc/nginx/conf.d/shenhe-site.conf` | 0.5 天 | ✅ **已完成（2026-11-02）**：服务器上删掉 `location = /de/ { return 301 /de.html; }` 与 `/es/` 同款规则，`nginx -t` 通过后 reload，备份 `shenhe-site.conf.bak.20261102_215900`。现在 `/de/`、`/es/` 直接 404，`/` `/about.html` `/api/health` `/sitemap.xml` 全部不变 |",
    ),
]


def main():
    raw = io.open(DOC, encoding="utf-8").read()
    for src, dst in EDITS:
        n = raw.count(src)
        if n != 1:
            raise SystemExit("the anchor matched %d times: %s" % (n, src[:60]))
        raw = raw.replace(src, dst)
    io.open(DOC, "w", encoding="utf-8", newline="").write(raw)
    print("the benchmark document: %d edit(s) applied" % len(EDITS))


if __name__ == "__main__":
    main()
