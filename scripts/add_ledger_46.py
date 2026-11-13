#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""第 46 轮台账 + 计划文档回填。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")
PLAN = os.path.join(ROOT, "docs", "我们的流量逻辑与内容布局.md")

SECTION = """

## 第 46 轮：WhatsApp 提为一级出口（2026-11-03 凌晨）

### 起因

第 45 轮问了三件事，用户给了三个决定：

| 问题 | 决定 |
|---|---|
| GSC / Bing 的账号动作 | **用户自己去后台提交** → 步骤写成 `docs/搜索引擎收录-你要做的三步.md` |
| 有没有可对外的微信号 | **暂时没有** → 不承诺我们给不了的通道，先把 WhatsApp 提为一级通道 |
| 首页与目录页的转化出口怎么排 | **WhatsApp 提为一级出口** |

### 一、WhatsApp 提为一级出口（三处）

依据只有一条：**全站唯一那条真实询盘是从目录页的 WhatsApp 按钮进来的**
（`source: whatsapp`，落地页 `/products.html`）。它当时是描边的次要按钮。

| 位置 | 改前 | 改后 |
|---|---|---|
| **目录页收尾带** | 表单实心主按钮、WhatsApp 描边 | **WhatsApp 实心主按钮**（消息预填），表单描边；下面加一条"还没想清楚要哪个？四个问题我们帮你选"→ `/ai-customize.html` |
| **首页 RFQ 区块** | WhatsApp 是 secondary | **主按钮**，note 写明"一个工作日内回"，与表单同一个口径 |
| **首页 hero** | 只有表单 + 目录 | 按钮下面加一条**文字级** WhatsApp 出口（不占第二个实心按钮，守住"一个视口一个重点色"） |

消息统一用 `lib/contact-links.ts` 的 `whatsappLink()`：**号码从配置取**，
开头一句用买家自己的口气写的话（他要读一遍、改一遍、发出去，
一句要重写的话往往就发不出去了）。

**"还没想清楚"的入口是数据给的**：那条询盘的 `products` 是空的——他没选 SKU，
要的是"配对"。而我们当时只有一个"报价"入口。

### 二、顺带修掉的四个会自己漂的清单

这一轮里有四个地方**各自记着同一件事**，其中一份已经漂了：

| 地方 | 漂成什么了 | 怎么修 |
|---|---|---|
| `lib/shenhe.config.ts` 的 sameAs 报告页清单 | 指着 `/reports/yd20251215351.html`（那个页面已经不存在了） | 改成正确编号，并写清它是"手写副本"、由构建门守着 |
| `public/llms.txt` 的报告清单 | 挂着旧编号 → **构建里"AI 文件不许有死链"那一关报红** | `gen-ai-guides.mjs` 原来拿**整个标题字符串**比对，标题里的数量从 9 变成 10 之后就再也匹配不上 → 改成**按模式匹配** |
| `public/llms.txt` 的存证清单 | 同上；而且**一旦有批次上链，它还会继续写 "0 attested"** | 同一处修法 |
| 两个门户表单里的 WhatsApp 号码 | 写死的 `wa.me/8617266659928` | 改成 `whatsappLink()` |

> **同一类 bug 的通用形状**：一段"标题里带数量"的区块，靠**整串标题**去定位，
> 于是数量一变就再也定位不到——区块从此不再重建，里面的旧事实就一直挂着。
> 两处（报告清单、存证清单）都是这个形状。

### 三、构建门自己的环境 bug

构建门报 `the report numbers are the numbers on the documents: a number is not on its document`，
但那条检查单独跑是**绿的**（"10 report numbers, each one found in the PDF it links to"）。

原因：闸门调 Python 脚本时写死 `process.env.PYTHON || 'python3'`，而 Windows 上的
`python3` 是 Microsoft Store 的空壳——它不执行脚本，直接非零退出。闸门于是把
**"解释器没跑起来"报成了"有一条报告编号对不上它的文件"**。

**这是闸门最坏的失败方式：不是报干净，是报错，而且报的是一件没发生的事。**
（在 Linux 上它绿，在开发机上它永远红，两边说的不是同一件事。）

改法：先探一次解释器（`sys.version`），用第一个能跑起来的；`PYTHON` 环境变量仍然优先。
**判据没动**，动的只是"怎么找解释器"。

### 四、本轮上线内容

- 首页与目录页的 WhatsApp 出口（上面三处）
- `robots.txt` 同时广告 `sitemap.xml` 与 `sitemap-index.xml`
- `/blog/` → 301 `/blog.html`（11 天 35 次 404，是我们自己的死链）
- 首页存证表接 SKU（报告 → 它覆盖的商品页）
- `docs/搜索引擎收录-你要做的三步.md`（你要自己操作的那部分）

线上复核：`check_live_urls.py` **PASS（64 页，一页一 URL）**；
`verify_p0_live.py` **31 PASS / 0 FAIL**；构建门全绿；体检 **0 ERROR**。

### 五、仍然开着的

| 项 | 卡在哪 |
|---|---|
| **GSC 提交 + Bing 验证** | **等你**——步骤在 `docs/搜索引擎收录-你要做的三步.md`；Bing 验证文件放好之后 IndexNow 才会被接受 |
| **WeChat 通道** | 等你有一个可对外的微信号 + 二维码 |
| **邮件通道** | Gmail 拒收，101 次尝试 0 成功（要企业邮箱或 SMTP 授权码） |
| 报告页的"下一步"接线 | 报告页由另一条线在生成，等它改完再接，不抢它的文件 |
| P1 素材（展会 / 证言 / 作者 / 编辑政策） | 要你给 |
| 5 种语言真实翻译 | 翻译后端还没接；且唯一那条巴西询盘用的是英文，目前没有证据支撑 |
"""

PLAN_EDITS = [
    (
        "| A1 | **GSC 提交 `sitemap-index.xml` + 对 64 个 URL 请求收录** | 没收录 = 自然曝光 0（第 42 轮 `site:` 实测 0 条） | GSC 后台 | **需要你的 Google 账号**（我没登录态） |",
        "| A1 | **GSC 提交 `sitemap-index.xml` + 对关键页请求收录** | 没收录 = 自然曝光 0（第 42 轮 `site:` 实测 0 条） | GSC 后台 | ⏳ **步骤已写好，等你操作**：`docs/搜索引擎收录-你要做的三步.md` |",
    ),
    (
        "| A2 | **Bing Webmaster Tools 验证域名** | `/BingSiteAuth.xml` 404 → IndexNow 每次 403，机器面白做 | Bing 后台 | **需要你的 Bing 账号** |",
        "| A2 | **Bing Webmaster Tools 验证域名** | `/BingSiteAuth.xml` 404 → IndexNow 每次 403，机器面白做 | Bing 后台 | ⏳ **步骤已写好，等你操作**；验证文件放好后我可以上传并复验 |",
    ),
    (
        "| C2 | **把 WhatsApp 定为目录页的一级出口**（它已被验证会带来真实询盘） | 真实成交走的是目录页 WhatsApp 按钮 | 无（我做） |",
        "| C2 | **把 WhatsApp 定为目录页的一级出口**（它已被验证会带来真实询盘） | 真实成交走的是目录页 WhatsApp 按钮 | ✅ **2026-11-03 已上线**（目录页实心主按钮 + 首页 RFQ 主按钮 + hero 文字出口） |",
    ),
    (
        "| C3 | **\"还没想清楚要什么\"的入口** | 他在目录页发起对话且没选 SKU | 无（我做，走现有 `/ai-customize.html`） |",
        "| C3 | **\"还没想清楚要什么\"的入口** | 他在目录页发起对话且没选 SKU | ✅ **2026-11-03 已上线**（目录页收尾带加一行，通到 `/ai-customize.html`） |",
    ),
    (
        "| C1 | **站上给一个 WeChat 入口**（微信号 + 二维码 + \"中国采购请加微信\"） | 唯一那条询盘明确要 WeChat；我们没有 | **你的微信号**（还要二维码图） |",
        "| C1 | **站上给一个 WeChat 入口**（微信号 + 二维码 + \"中国采购请加微信\"） | 唯一那条询盘明确要 WeChat；我们没有 | ⏳ **暂时没有**——不承诺给不了的通道；等有微信号再做 |",
    ),
]


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "第 46 轮" in raw:
        print("the round 46 section is already there")
    else:
        if not raw.endswith("\n"):
            raw += "\n"
        io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw + SECTION.lstrip("\n"))
        print("the ledger: the round 46 section is written")

    plan = io.open(PLAN, encoding="utf-8", newline="").read()
    n = 0
    for src, dst in PLAN_EDITS:
        c = plan.count(src)
        if c != 1:
            raise SystemExit("the plan anchor matched %d times: %s" % (c, src[:60]))
        plan = plan.replace(src, dst)
        n += 1
    io.open(PLAN, "w", encoding="utf-8", newline="").write(plan)
    print("the plan: %d edit(s) applied" % n)


if __name__ == "__main__":
    main()
