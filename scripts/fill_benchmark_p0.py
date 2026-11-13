#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把 P0 七项的完成结果回填进对标文档。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, "docs", "对标-三家同行-缺项与补站排期.md")

EDITS = [
    (
        "| 2 | **JSON-LD 补 OfferCatalog + ItemList + BreadcrumbList** | 新增 `scripts/gen-offer-catalog.mjs`，进构建链 | 1 天 | schema.org 校验器 0 错误；产品目录能被解析成类目树 |",
        "| 2 | **JSON-LD 补 OfferCatalog + ItemList + BreadcrumbList** | `lib/seo/schema.ts` 的 `offerCatalogSchema()` + 首页 | 1 天 | ✅ **已完成（2026-11-02）**：首页输出 4 条产品线 / 22 个商品的 OfferCatalog 与 20 项 ItemList，**不带价格**；线页地址按 `LINE_PAGES` 查，查不到就不写 url |",
    ),
    (
        "| 3 | **链上存证上首页**（B1） | `app/(site)/page.tsx` 首页 | 0.5 天 | 首页出现\"报告哈希可自验\"模块，链到 /attestation.html 与 report-hashes.json |",
        "| 3 | **链上存证上首页**（B1） | `components/v2/HomeSections.tsx` 的 `AttestationSection` | 0.5 天 | ✅ **已完成（2026-11-02）**：首页印出 3 份报告的 SHA-256，与线上 `/report-hashes.json` 逐一对得上；同时说清它证明什么、不证明什么 |",
    ),
    (
        "| 5 | **独立 /faq.html**（A3），把 8 条扩到 15–20 条，按采购者问题分类（MOQ / 打样 / 认证 / 包装 / 交期 / 付款 / 物流 / 配方） | 新页 + FAQPage schema | 1 天 | GSC FAQ 富媒体结果可读；页内 15–20 条 |",
        "| 5 | **独立 /faq.html**（A3），把 8 条扩到 15–20 条，按采购者问题分类（MOQ / 打样 / 认证 / 包装 / 交期 / 付款 / 物流 / 配方） | `app/(site)/faq/page.tsx` + `content/v2/faq-page.ts` | 1 天 | ✅ **已完成（2026-11-02）**：16 条、6 个主题分组、FAQPage schema 16 条、1 个 h1、已进 sitemap 与页脚；线上验收 16/16 对齐 |",
    ),
    (
        "| 6 | **响应承诺口径统一**：全站\"1 business hour\"→\"one business day\"（未获客户确认前用保守值），并检查所有未经确认的承诺 | 全站文案 | 0.5 天 | `grep -ri \"business hour\"` 命中 0；承诺口径一致 |",
        "| 6 | **响应承诺口径统一**：全站\"1 business hour\"→\"one business day\"（未获客户确认前用保守值），并检查所有未经确认的承诺 | `lib/shenhe.config.ts` 的 `response` + 全站 67 个文件 | 0.5 天 | ✅ **已完成（2026-11-02）**：产物里 0 处 \"business hour\" 承诺（\"business hours\"=工作时间，未动）；样品发货 48h、召回 SOP 48h、NDA 24h 也未动 |",
    ),
    (
        "| 7 | **/.well-known/agent-skills/index.json + api-catalog**（A10） | 新增生成脚本 | 0.5 天 | 两个 URL 可取且 schema 正确 |",
        "| 7 | **/.well-known/agent-skills/index.json + api-catalog**（A10） | `scripts/gen-agent-skills.mjs` + 仓库的 `agent-skills/` | 0.5 天 | ✅ **已完成（2026-11-02）**：4 个 skill（Agent Skills discovery 0.2.0），digest 逐个对得上；线上 index.json / api-catalog / openapi.json / version.json 四个 URL 全部 200 |",
    ),
    (
        "**P0 小计：约 3.5–4 天**，全部可独立验收，且不碰任何需要客户确认的事实。",
        "**P0 小计：约 3.5–4 天**，全部可独立验收，且不碰任何需要客户确认的事实。\n\n"
        "> **2026-11-02：P0 七项已全部完成并上线。**\n"
        "> 构建门全绿（93 页 / 64 个 sitemap URL）；体检 0 ERROR / 4 WARNING（4 条都是老账）；\n"
        "> 线上 `check_live_urls.py` PASS（64 页，一页一 URL）；新增 `scripts/verify_p0.py`（本地 44 项）\n"
        "> 与 `scripts/verify_p0_live.py`（线上 31 项）逐项验收全过。\n"
        "> 详见 `HEALTH-CHECK.md` 第 44 轮。",
    ),
]


def main():
    raw = io.open(DOC, encoding="utf-8", newline="").read()
    for src, dst in EDITS:
        n = raw.count(src)
        if n != 1:
            raise SystemExit("the anchor matched %d times: %s" % (n, src[:70]))
        raw = raw.replace(src, dst)
    io.open(DOC, "w", encoding="utf-8", newline="").write(raw)
    print("the benchmark document: %d edit(s) applied" % len(EDITS))


if __name__ == "__main__":
    main()
