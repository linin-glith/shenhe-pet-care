// 一次性脚本：只导出「缺结论句的 14 个」的完整可核实事实
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;

const data = JSON.parse(fs.readFileSync(path.join(root, "lib", "products.json"), "utf8"));
const pt = fs.readFileSync(path.join(root, "content", "v2", "product.ts"), "utf8");
const mh = pt.match(/const MEASURED_HEADLINE: Record<string, string> = \{([\s\S]*?)\n\};/);
const have = new Set();
if (mh) for (const m of mh[1].matchAll(/^\s*(P\d+):/gm)) have.add(m[1]);

const wanted = ["P004","P005","P006","P012","P013","P014","P015","P016","P017","P018","P019","P020"];
const keys = ["name_en","name_zh","specification","specification_options","function_en","function_zh",
  "ingredients_en","application","moq","moq_unit","b2b_price_rmb","lead_time_days_stock","lead_time_days_oem",
  "shelf_life_months","storage","package","carton_dimensions_cm","carton_weight_kg","hs_code","msds_available",
  "certifications_required","faq_ids","claims","line","category"];

for (const id of wanted) {
  const p = (data.products || []).find((x) => x.id === id);
  if (!p) { console.log(`\n### ${id} —— products.json 里没有`); continue; }
  console.log(`\n### ${id} ${p.name_en}`);
  for (const k of keys) {
    if (p[k] === undefined || p[k] === null || p[k] === "" || (Array.isArray(p[k]) && !p[k].length)) continue;
    console.log(`  ${k}: ${JSON.stringify(p[k])}`);
  }
}

// 规格族：同族兄弟 SKU 的规格选项
console.log("\n=== 兄弟 SKU（规格族）===");
const fam = {};
for (const p of data.products || []) {
  if (!p.specification_options || p.specification_options.length < 2) continue;
  (fam[p.name_en.replace(/\s*\d+\s*(mL|g|kg).*$/i, "").trim()] ||= []).push(`${p.id} ${p.specification}`);
}
for (const [k, v] of Object.entries(fam)) console.log(`  ${k}: ${v.join(" | ")}`);
