#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""第 47 轮台账：GSC 那 22 项「未查明」到底是什么。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")

SECTION = """

## 第 47 轮：GSC 报 22 项「未查明网址」——查清它到底是什么（2026-11-03 下午）

### 起因

用户提交 sitemap 后，GSC 的网站地图报告出现「**检测到了 22 项无效内容**」，
22 行全部是「**个未查明网址**」，而且全是产品页。

### 一、它不是"不符合收录要求"

用户打开的 `/faq.html` 的网址检查页把话说得很清楚：

| GSC 的字段 | 值 | 读作 |
|---|---|---|
| 网页未编入索引 | **Google 无法识别此网站** | 不是被拒绝，是不认识 |
| 是否允许抓取？ | **不适用** | **没有抓取记录** |
| 是否允许编入索引？ | **不适用** | **没有判定记录** |
| 上次抓取时间？ | **不适用** | 从没抓过 |
| 未检测到任何引荐站点地图 | — | sitemap 是今天 10:12 才提交的，还没关联上 |
| 未检测到引荐来源网页 | — | 还没抓到那些链到它的页 |

**"不适用"不是"不合格"。** 真正的"不合格"在 GSC 里是另一套词：
「不允许编入索引」「备用网页」「已发现但未编入索引」「抓取错误」。这 22 项都不是。

而 `/faq.html` 是 2026-11-03 才建出来的页，状态**一模一样**——这就是证据：
这不是某一类页面的毛病，是"Google 还没见过这些地址"。

### 二、为什么偏偏是那 22 个产品页

历史数字对得上：第 43 轮实测 GSC 只知道 **86 个 URL = 43 个页面 × 2 个形式**
（无扩展名 + `.html`），而当时全站有 **63 个页面**；
**63 − 20 = 43** —— 也就是说 **Google 从来没有抓过那 20 个产品页**。

旧站的产品地址与今天**完全一致**（用 git 比对过 `content/products__index.json` 的
历史版本：21 个产品地址一字不差）。所以这不是本轮改坏的，是老问题；
而 v2 重建让这些页第一次有了正确的 canonical、商品 JSON-LD 与站内接线。

### 三、我们这边逐条核对过，没有可修的缺陷

| 检查 | 结果 |
|---|---|
| sitemap 64 条 ↔ 实际发布的文件 | **一一对得上** |
| 每个产品页：HTTP / robots / canonical | 200 · `index, follow` · 自指 canonical |
| 线上字节 ↔ 本地产物 | 一致（`one business day`、`Covers`、`Message us on WhatsApp` 三个标记两边都在） |
| 每个产品页的**站内入链** | **3–74 处，没有一个是 0**（目录页 3–5 处、线页 68–74 处） |
| 全站入链为 0 的公开页 | 只有 `/`（首页本来就被链，是终点不是起点） |
| **用 Googlebot / OAI-SearchBot / GPTBot 的 UA 从公网抓** | **与普通浏览器完全一致**：同样 200、同样字节、**无 X-Robots-Tag** → 服务器没有按 UA 拦、也没有对爬虫限流 |
| robots.txt | 同时广告 `sitemap.xml` 与 `sitemap-index.xml` |
| sitemap 提交 | 2026-11-03 10:12（用户操作） |

> **一个自造的假结论，纠正于核对阶段**：我一度按产品**名**拼 slug
> （"Cleansing Foam" vs 真实的 `pet-paw-cleaning-foam`），
> 数出两个"内链 0 的孤儿页"。**那两个地址根本不存在**。
> 真实地址的入链是 8 处和 11 处。
> **教训**：用名字反推地址再下结论，是把猜测当证据；地址要从 sitemap 里取。

### 四、要做的动作

1. **点「请求编入索引」**（GSC 网址检查页右上角）——这是把一个"从未见过"的地址
   推进 Google 队列的**唯一**动作。清单：`docs/GSC-请求收录清单.md`
   （3 个关键页 + 22 个产品页，每条都写了"GSC 上显示的名字 ↔ 要粘贴的 URL"）。
2. **等**。sitemap 是 4 小时前提交的，Google 还没把 URL 和 sitemap 关联起来。
3. **Bing 还没验证域名**，IndexNow 每次推送都被拒，那条"页面变了就通知引擎"的
   管道现在是空的。

**预期**：请求收录 ≠ 当天收录。48 小时内先看状态有没有从「未查明」变成「已发现」；
7 天后再看「网页索引」报告的覆盖率。
**如果 7 天后这 22 个仍然是「未查明」**，那才说明有我们没看到的问题——
那时候要做的第一件事是**从服务器上直接模拟 Googlebot 抓一次**
（今天已经从公网用 Googlebot 的 UA 抓过，通的）。
"""


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "第 47 轮" in raw:
        print("the round 47 section is already there")
        return
    if not raw.endswith("\n"):
        raw += "\n"
    io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw + SECTION.lstrip("\n"))
    print("the ledger: the round 47 section is written")


if __name__ == "__main__":
    main()
