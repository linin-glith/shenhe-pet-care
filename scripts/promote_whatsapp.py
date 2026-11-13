# -*- coding: utf-8 -*-
"""把 WhatsApp 提为一级出口（首页 + 目录页）。

为什么
全站唯一那条真实询盘（INQ-20261028-LRR8E）是从 **`/products.html` 的 WhatsApp
按钮**进来的：来源字段写的是 `whatsapp`，落地页写的是 `/products.html`，
而 `products` 是空的——**他没选 SKU，就要了一句"配对"**。

也就是说：站上现在 6 条表单出口、4 条 WhatsApp 出口，而**被验证过会带来真实
买家的那一条，是目录页上的 WhatsApp 按钮**。它当时是描边的次要按钮。

三处改动
1. **目录页收尾带**：WhatsApp 提到前面、变成实心主按钮，表单降为描边；
   消息用 `whatsappLink()` 预填（号码从配置取，不再是写死的字符串）；
   并补一条"还没想清楚要哪个"的入口——因为真实那位就是在没选 SKU 时开的口。
2. **首页 RFQ 区块**：WhatsApp 从 secondary 变主按钮，并写清同一个承诺
   （一个工作日内回），免得两个出口两个口径。
3. **首页 hero**：首屏给 WhatsApp 一个文字级出口（不占第二个实心按钮，
   守住"一个视口一个重点色"的设计规矩）。

不做的
**微信**：用户目前没有可对外的微信号。站上不给承诺我们给不了的通道。
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def patch(rel_path, edits):
    p = os.path.join(ROOT, rel_path)
    raw = io.open(p, encoding="utf-8", newline="").read()
    for src, dst in edits:
        n = raw.count(src)
        if n != 1:
            raise SystemExit("%s: the anchor matched %d times: %s" % (rel_path, n, src[:70]))
        raw = raw.replace(src, dst)
    io.open(p, "w", encoding="utf-8", newline="").write(raw)
    print("patched %s (%d edit(s))" % (rel_path, len(edits)))


# ---------------------------------------------------------------- 1. 目录页
CATALOGUE = [
    (
        """          <div className="flex shrink-0 gap-3">
            <a
              href="/contact.html"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900"
            >
              Request pricing
            </a>
            <a
              href={`https://wa.me/${siteConfig.brand.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              WhatsApp
            </a>
          </div>""",
        """          {/*
            WHATSAPP 在前，表单在后。

            不是因为它更现代，是因为**它是唯一被验证过的出口**：
            全站唯一一条真实询盘就是从这个按钮进来的（来源 `whatsapp`，
            落地页 `/products.html`）。它当时是描边的次要按钮。

            消息用 whatsappLink() 预填：号码从配置取（站上只应该有一个号码），
            开头一句用买家自己的口气写的话——他要读一遍、改一遍、发出去，
            一句要重写的话往往就发不出去了。
          */}
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href={whatsappLink({ page: 'your pet care catalogue' })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900"
            >
              Message us on WhatsApp
            </a>
            <a
              href="/contact.html"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Request pricing
            </a>
          </div>""",
    ),
    (
        """            <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <Icon name="shield" size={16} />
              {siteConfig.metrics.gmpStandard} GMP · FDA registered · exporting since{' '}
              {siteConfig.brand.foundedYear}
            </p>""",
        """            <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <Icon name="shield" size={16} />
              {siteConfig.metrics.gmpStandard} GMP · FDA registered · exporting since{' '}
              {siteConfig.brand.foundedYear}
            </p>
            {/*
              还没想清楚要哪个？——真实那位就是这么开的口。

              那一条询盘来自目录页，`products` 是空的：他没选 SKU，
              要的是"配对"。所以这里给的不是另一个报价入口，
              是一条"描述用途，我们帮你选"的路——它通到 /ai-customize.html。
            */}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              Not sure which product yet?{' '}
              <a href="/ai-customize.html" className="font-semibold text-white underline">
                Answer four questions
              </a>{' '}
              and we will match the closest SKUs — or just describe what you need on
              WhatsApp.
            </p>""",
    ),
    (
        """import { FaqView } from '@/components/v2/Converted';""",
        """import { FaqView } from '@/components/v2/Converted';
import { whatsappLink } from '@/lib/contact-links';""",
    ),
]

# ---------------------------------------------------------------- 2. 首页 RFQ 区块
HOME_CONTENT = [
    (
        """    whatsappCta: {
      label: 'Chat on WhatsApp',
      href: 'https://wa.me/8617266659928',
      external: true,
      variant: 'secondary',
    },""",
        """    whatsappCta: {
      label: 'Chat on WhatsApp',
      /*
       * 号码从配置取，消息预填。
       *
       * 原来这里写死了 'https://wa.me/8617266659928'——站上的号码只应该有一个
       * 地方说了算，而这个块是内容文件，号码是配置。
       *
       * 它是主按钮（不再是 secondary）：站上唯一那条真实询盘走的就是 WhatsApp，
       * 而 WhatsApp 是买家**在对话里**就能得到答复的通道——一个在华的采购
       * 代理要的是即时回应，不是一张他还要再等一天的表单。
       */
      href: whatsappLink({ page: 'private-label pet care products' }),
      external: true,
      note: 'answered within one business day',
    },""",
    ),
    (
        """import { clientProducts } from '@/lib/client-products';""",
        """import { clientProducts } from '@/lib/client-products';
import { whatsappLink } from '@/lib/contact-links';""",
    ),
]

# ---------------------------------------------------------------- 3. 首页 hero
HOME_PAGE = [
    (
        """        cta={
          <>
            <Btn cta={{ label: 'Request a quote', href: '#rfq', note: 'reply < 1 day' }} />
            {/*
              `light` because the hero is a dark surface: the default
              secondary button draws dark ink on a dark background, and the
              label simply disappears. It was the one control on the home page
              a buyer could not read.
            */}
            <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} light />
          </>
        }""",
        """        cta={
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Btn cta={{ label: 'Request a quote', href: '#rfq', note: 'reply < 1 day' }} />
              {/*
                `light` because the hero is a dark surface: the default
                secondary button draws dark ink on a dark background, and the
                label simply disappears. It was the one control on the home page
                a buyer could not read.
              */}
              <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} light />
            </div>
            {/*
              首屏也给 WhatsApp 一个出口——但是文字级的，不是第二个实心按钮。

              理由：站上唯一那条真实询盘走的就是 WhatsApp，而首屏的实心按钮
              只能有一个（一个视口一个重点色）。所以这里用一条带图标的文字
              链接，位置在按钮下面，不抢主按钮的注意力，但**不用滚到表单
              就能开始对话**。
            */}
            <a
              href={whatsappLink({ page: 'private-label pet care products' })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              <Icon name="chat" size={16} className="text-v2-accent-300" />
              Message us on WhatsApp — answered within one business day
            </a>
          </div>
        }""",
    ),
    (
        """import { faqPageSchema, itemListSchema, offerCatalogSchema } from '@/lib/seo/schema';""",
        """import { faqPageSchema, itemListSchema, offerCatalogSchema } from '@/lib/seo/schema';
import { whatsappLink } from '@/lib/contact-links';
import { Icon } from '@/components/v2/Icon';""",
    ),
]


def main():
    patch("app/(site)/products/page.tsx", CATALOGUE)
    patch("content/v2/home.ts", HOME_CONTENT)
    patch("app/(site)/page.tsx", HOME_PAGE)


if __name__ == "__main__":
    main()
