#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""在第 44 轮的台账里补一段：并发会话把共享构建弄红时的状态说明。"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "HEALTH-CHECK.md")

ANCHOR = """### 七、仍然开着的"""

ADD = """### 七、这一轮结束时共享构建的状态（别误读）

**这一轮结束时（23:47）构建门是全绿的**，本地产物完整，上线与线上验收都过了。
之后（23:53）**另一条并发会话**在同一个仓库里做了它自己的改动，共享构建变红：

```
Error: expected 10 reports, found 9
```

原因是它新增的 `scripts/gen-reports-index.mjs`（它自己的文件、它自己的在途任务）：
证书页上的第 4 份报告换了一个发行方与编号（`GIM` / `XJ2025001233`，原为 `YD20251215351`），
而那个脚本里 `ISSUER_NAMES` 只有 `GDDCM` 和 `NACC`，正则也匹配不了写成
多段字符串拼接的 `note`。**这是它在做的事，不是本轮引入的**，所以本轮没有改它的文件——
发行方能不能被查证、查证方式怎么写，是它的判断，不是本轮的。

**线上不受影响**：线上是本轮 23:47 那次完整构建部署上去的版本，
`check_live_urls.py` PASS（64 页）、`verify_p0_live.py` 31 PASS / 0 FAIL。
它那条线改完第 4 份报告的编号后自会重新部署；届时
`lib/report-hashes.ts` 里的 `YD2025121537`… 与证书页的 `XJ2025001233`
必须同步（那正是它新加的 `scripts/check_report_numbers.py` 要抓的东西）。

### 八、仍然开着的"""

PARAGRAPH = """### 六点五、这一轮结束时共享构建的状态（别误读）"""

REPLACEMENT = ADD


def main():
    raw = io.open(LEDGER, encoding="utf-8", newline="").read()
    if "并发会话把共享构建弄红" in raw:
        print("the note is already there")
        return
    if ANCHOR not in raw:
        raise SystemExit("the anchor was not found")
    raw = raw.replace(ANCHOR, REPLACEMENT, 1)
    io.open(LEDGER, "w", encoding="utf-8", newline="").write(raw)
    print("the ledger: the concurrency note is written")


if __name__ == "__main__":
    main()
