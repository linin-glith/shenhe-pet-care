#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""第 45 轮：把"我们的流量逻辑"这轮写进台账，并回填计划文档的进度。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")
PLAN = os.path.join(ROOT, "docs", "我们的流量逻辑与内容布局.md")

SECTION = """

## 第 45 轮：把对标换成我们自己的路（2026-11-03 凌晨）

### 起因

用户说：**"我们对标同行是要结合我们的网站去做属于我们的流量逻辑，内容布局。"**

这是对上一轮那件事的纠正。对标文档的 P0 七项没问题（做的是我们自己的缺口），
但它的 **P1/P2 是按对手的页数排的**——"他们有 12 个品类页，我们也做 12 个"
"他们有 70 个导航链接"。那是对标抄结构。

这一轮就把 P1/P2 换掉：依据只用**三个我们自己的来源**，对标只做校验。

### 一、我们自己的流量逻辑（实测）

| 来源 | 怎么量的 |
|---|---|
| nginx 访问日志 | 11 天，72,839 个请求（`workspace/traffic_logic.py`、`workspace/traffic_humans.py`，跑在服务器上） |
| 内链图 | 93 个公开页的入链 / 出链 / 转化接线（`scripts/audit_content_layout.py`） |
| 那一条真实询盘 | 生产库 `inquiries` 全表 1 条 |

**结论：三段路里，瓶颈不在内容那一段。**

| 段 | 实测 |
|---|---|
| ① 入口 | 机器很勤（robots.txt 104、security.txt 104、openid-configuration 104 次）；**人几乎没有**——11 天里外部 referrer 只有 google 1 次、duckduckgo 1 次 |
| ② 承接 | 内容齐全、接线也通（`/contact.html` 258 入链、`/products.html` 146 入链 110 出链） |
| ③ 转化 | 全站 1 条询盘，来自 `/products.html` 的 WhatsApp 按钮 |

### 二、唯一那条询盘比整份对标文档信息量都大

`INQ-20261028-LRR8E`：Murillo Buono / Vetzcare（**巴西**），落地页 **`/products.html`**，
入口 **WhatsApp 按钮**（chat_id 4），**没选任何 SKU**（`products: []`），原话
"我是巴西公司的代表，现在在中国，想找宠物用品制造商合作，能给我一个微信号吗？"

四条结论，**每一条都是从这一条询盘里读出来的**：

1. **转化入口是 WhatsApp，不是表单**——站上 6 条 `/contact.html` 出口、4 条 WhatsApp 出口，
   真实成交走的是 WhatsApp，**而且是从目录页走的**。
2. **他在目录页发起对话却没选 SKU**——他要的是"配对"，不是"报价"。
   我们缺一个"还没想清楚要什么"的入口（对手 DUNTEK 有这句首页文案，**我们的数据同样指向这里**）。
3. **他要 WeChat，我们只有电话 / WhatsApp / 邮箱**——站上没有任何 WeChat 入口，
   而这是唯一一条询盘明确要的通道。
4. **他在中国现场**——在华采购代理/采购团，要即时对话；而**我们的邮件一封都发不出去**
   （Gmail `530 5.7.0`），他当天回的邮件我们没收到。

### 三、内容布局的内链图（93 个公开页）

| 事实 | 数字 | 判读 |
|---|---|---|
| 有转化出口的页 | 71 / 93 | 接线是好的 |
| **没有转化出口的公开页** | **12 个：10 个报告页 + 1 个旧目录形式** | **报告页是买家拿证据的地方，却没有"下一步"** |
| 首页出链 | 85 条，通往询盘的只有 10 条 | 首页现在是"内容展台"，不是"路径" |
| 孤岛 | 27 个（portal/admin/404 为主） | 正常 |

**所以：不加页面。** 93 个页里近一半没人请求过，再加 12 个"配方维度品类页"
就是多 12 个冷页。要做的是**接线**：报告 → 覆盖它的 SKU → 询盘。

### 四、本轮已做并已上线

| 动作 | 依据 | 状态 |
|---|---|---|
| `/blog/` → 301 `/blog.html` | 11 天 35 次 404，是我们自己的死链（`/news/` 也有 28 次，但它不是我们的页，404 是对的） | ✅ 已上线，备份 `shenhe-site.conf.bak.20261103_002011` |
| `robots.txt` 广告 `sitemap-index.xml` | 3 个 sitemap 里 AI 那个没被广告 | ✅ 已上线 |
| **首页存证表接 SKU**：报告 → 它覆盖的商品页 | 证据与产品之间断了一截，而那正是买家拿着报告来问"这个 SKU 能不能做"的路径 | ✅ 已上线，三份报告的 covers 链接逐条核对过 |
| 闸门改用**探测式**找 Python 解释器 | 闸门写死 `python3`，而 Windows 上的 `python3` 是 Microsoft Store 的空壳 → 闸门把"**解释器没跑起来**"报成"**有报告编号对不上文件**" | ✅ 已修（不改判据，只改找解释器的方式） |

线上复核：`check_live_urls.py` **PASS（65 页，一页一 URL、无重复形式）**；
`verify_p0_live.py` **31 PASS / 0 FAIL**。

### 五、明确不做（并说明为什么）

| 对标文档里的项 | 决定 | 理由 |
|---|---|---|
| ZeBounty 的 12 个配方维度品类页 | **不做** | 我们 93 个页里近一半没人请求过；加 12 个冷页就是灌水 |
| Ocean Star 的 70 个导航链接 | **不做** | 我们的 `/products.html` 已有 146 入链、110 出链，目录本身是连通的 |
| DUNTEK 的"按客户类型四路分层" | **降级** | 等有流量再做；现在做等于给没人看的页面加分类 |
| 5 种语言 | **暂缓** | 唯一那条巴西询盘**用的是英文**，不是葡萄牙语——目前没有证据支撑多语言 |
| 客户证言 | **仍不做** | 拿不到书面授权，不编 |
| 展会 / 参观预约 | **等素材** | 展名 / 展位 / 时间要你给 |

### 六、仍然开着的

| 项 | 卡在哪 |
|---|---|
| **GSC 提交 sitemap-index + 请求收录 65 个 URL** | **要你的 Google 账号**（浏览器里没有登录态） |
| **Bing Webmaster Tools 验证域名** | **要你的 Bing 账号**——不验证，IndexNow 每次推送都被拒（403 `UserForbiddedToAccessSite`），机器面白做 |
| **站上给一个 WeChat 入口** | **要你的微信号 + 二维码**（唯一那条询盘明确要的通道） |
| **邮件通道**（企业邮箱 / SMTP 授权码） | Gmail 拒收，101 次尝试 0 成功 |
| 报告页的"下一步"接线 | 报告页由另一条线在生成，**要等它改完再接**，不抢它的文件 |
| P1 素材（展会 / 证言 / 作者 / 编辑政策） | 要你给 |
| 5 种语言真实翻译 | 翻译后端还没接 |
"""

PLAN_EDITS = [
    (
        "| A3 | `robots.txt` 广告 `sitemap-index.xml`（现在只广告了 `sitemap.xml`） | 3 个 sitemap 里 AI 那个没被广告 | `scripts/gen-seo-files.mjs` | 无（我做） |",
        "| A3 | `robots.txt` 广告 `sitemap-index.xml`（现在只广告了 `sitemap.xml`） | 3 个 sitemap 里 AI 那个没被广告 | `scripts/gen-seo-files.mjs` | ✅ **2026-11-03 已上线** |",
    ),
    (
        "| A4 | `/blog/` → 301 `/blog.html` | 35 次真实 404，是我们自己的死链 | nginx | 无（我做） |",
        "| A4 | `/blog/` → 301 `/blog.html` | 35 次真实 404，是我们自己的死链 | nginx | ✅ **2026-11-03 已上线** |",
    ),
    (
        "| B2 | **首页存证模块接 SKU**：报告 → 覆盖它的商品页 | 证据与产品断链 | `components/v2/HomeSections.tsx` | 无（我做） |",
        "| B2 | **首页存证模块接 SKU**：报告 → 覆盖它的商品页 | 证据与产品断链 | `components/v2/HomeSections.tsx` | ✅ **2026-11-03 已上线**（三份报告的 covers 链接逐条核对过） |",
    ),
    (
        "> 对标三家在这份文档里只出现一次，位置在第六节，作用是**校验**——不是排期的依据。",
        "> 对标三家在这份文档里只出现一次，位置在第六节，作用是**校验**——不是排期的依据。\n"
        ">\n"
        "> **2026-11-03 更新**：甲组 A3、A4 与乙组 B2 已完成并上线；"
        "详细经过见 `HEALTH-CHECK.md` 第 45 轮。",
    ),
]


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "第 45 轮" in raw:
        print("the round 45 section is already there")
    else:
        if not raw.endswith("\n"):
            raw += "\n"
        io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw + SECTION.lstrip("\n"))
        print("the ledger: the round 45 section is written")

    plan = io.open(PLAN, encoding="utf-8", newline="").read()
    n = 0
    for src, dst in PLAN_EDITS:
        c = plan.count(src)
        if c != 1:
            raise SystemExit("the plan anchor matched %d times: %s" % (c, src[:50]))
        plan = plan.replace(src, dst)
        n += 1
    io.open(PLAN, "w", encoding="utf-8", newline="").write(plan)
    print("the plan: %d edit(s) applied" % n)


if __name__ == "__main__":
    main()
