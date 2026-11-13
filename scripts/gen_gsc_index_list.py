#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成"逐个请求收录"的清单：GSC 那 22 个 + 3 个关键页。"""
import io
import os
import re
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://shenhezhongke.com"

PRIORITY = [
    ("https://shenhezhongke.com/", "首页 —— 入口页，权重最高，先请求它"),
    ("https://shenhezhongke.com/products.html", "产品目录页 —— 买家搜品类的落点"),
    ("https://shenhezhongke.com/faq.html", "FAQ 页 —— 2026-11-03 新建，今天才第一次被抓"),
]

# GSC 报"未查明"的那 22 行，按 GSC 截图里的顺序
GSC_ORDER = [
    ("Pet Immunoglobulin (IgG) 15 g × 8 sachets", "/products/pet-immunoglobulin.html"),
    ("Pet Digestive Probiotics 8 mL × 9 vials", "/products/pet-digestive-probiotics.html"),
    ("Outdoor Insect Repellent Spray 80 mL", "/products/outdoor-insect-repellent-spray.html"),
    ("Outdoor Protection Spray for Pets 80 mL", "/products/outdoor-protection.html"),
    ("Pet Paw Moisturizing Gel 10 g", "/products/pet-paw-moisturizing-gel.html"),
    ("Laundry Detergent for Pet Households 1.5 kg", "/products/pet-household-laundry-detergent.html"),
    ("Pet Paw Cleansing Foam 200 mL", "/products/pet-paw-cleaning-foam.html"),
    ("No-Rinse Pet Cleansing Foam 300 mL", "/products/pet-waterless-cleaning-foam.html"),
    ("No-Rinse Pet Cleansing Foam 500 mL", "/products/waterless-cleansing-foam-500.html"),
    ("Pet Shampoo — Antibacterial · Mite Control 300 mL", "/products/pet-shampoo-antibacterial-300.html"),
    ("Pet Shampoo for Cats or Dogs 500 mL", "/products/pet-shampoo-antibacterial-500.html"),
    ("Multi-Purpose Pet Wash 200 mL", "/products/multi-purpose-pet-wash-200.html"),
    ("Multi-Purpose Pet Wash 300 mL", "/products/multi-purpose-pet-wash-300.html"),
    ("Probiotic Pet Dental Water", "/products/probiotic-pet-tooth-cleaner.html"),
    ("Pet Ear Cleansing Solution", "/products/ear-mite-cleaning-solution.html"),
    ("Pet Deodorizing Spray Gun Kit", "/products/pet-deodorizing-spray-gun-kit.html"),
    ("Cat Litter Partner — Deodorizing Powder 300 g", "/products/cat-litter-partner-300.html"),
    ("Cat Litter Partner — Deodorizing Powder 500 g", "/products/cat-litter-companion.html"),
    ("CatClean Antifungal & Deodorizing Solution", "/products/cat-ringworm-spray.html"),
    ("Disinfectant & Deodorizing Solution", "/products/pet-disinfectant-deodorizing-solution.html"),
    ("Power Odor Eliminator (Extra Strength)", "/products/pet-deodorizing-spray.html"),
    ("Probiotic + Bio-Enzyme Odor Control Set", "/products/odor-control-set.html"),
]


def main():
    out = []
    out.append("# 逐个「请求编入索引」清单（GSC → 网址检查 → 粘贴 URL → 请求编入索引）\n")
    out.append("> 生成于 2026-11-03，依据：GSC 网站地图报告里那 22 个「未查明网址」的条目，"
               "逐条对回 sitemap 里的真实地址。\n")
    out.append("## 第一批：3 个关键页（先点这三个）\n")
    out.append("| URL | 为什么是它 |")
    out.append("|---|---|")
    for u, why in PRIORITY:
        out.append("| %s | %s |" % (u, why))
    out.append("")
    out.append("## 第二批：22 个产品页（GSC 报「未查明」的那 22 行）\n")
    out.append("| GSC 上显示的名字 | 要粘贴的 URL |")
    out.append("|---|---|")
    for name, path in GSC_ORDER:
        out.append("| %s | %s |" % (name, BASE + path))
    out.append("")
    out.append("## 怎么用\n")
    out.append("1. GSC 左侧「网址检查」→ 上面那个搜索框**粘贴 URL**（不要点目录树）。")
    out.append("2. 等它跑完（几秒到几十秒），页面会显示这个地址的状态。")
    out.append("3. 页面右上角「**请求编入索引**」→ 等那个转圈结束。")
    out.append("4. 重复下一个。\n")
    out.append("**只粘贴 URL 就够了**，不要点「测试实际网址」——那是对域名做实时可用性测试，")
    out.append("对一个还没被收录的地址没有意义。\n")
    out.append("## 时间预期\n")
    out.append("- 请求收录**不等于**当天收录。它是把地址排到 Google 的队列最前面。")
    out.append("- 48 小时内先看：状态有没有从「未查明」变成「已发现」。")
    out.append("- 7 天后再看「网页索引」报告的覆盖率。")
    out.append("- 如果 7 天后这 22 个仍然是「未查明」，那才说明有我们没看到的问题。")
    out.append("  今天已经用 Googlebot / OAI-SearchBot / GPTBot 的 User-Agent 从公网抓过：")
    out.append("  **返回与普通浏览器完全一致**（同样 200、同样字节、无 X-Robots-Tag），")
    out.append("  所以服务器没有按 UA 拦截或限流。")

    p = os.path.join(ROOT, "docs", "GSC-请求收录清单.md")
    io.open(p, "w", encoding="utf-8", newline="").write("\n".join(out))
    print("written: %s" % p)
    print("\n".join(out[:24]))


if __name__ == "__main__":
    main()
