/**
 * Kanji -> traditional/variant form (学 -> 學).
 *
 * GENERATED FILE — do not edit. Rebuild with: npm run data:build
 *
 * Derived from the Unicode Character Database (c) Unicode, Inc.
 * https://www.unicode.org/copyright.html
 */
const PACKED =
  "万萬与與乱亂争爭会會体體余餘党黨写寫励勵区區医醫却卻厘釐参參双雙叙敘号號嘱囑国國堕墮壮壯声聲奥奧奨奬学學宝寶寝寢寿壽将將属屬峡峽径徑恋戀惧懼惨慘担擔挟挾携攜数數断斷旧舊昼晝条條来來枢樞楼樓欧歐残殘殴毆浅淺湾灣湿濕滞滯灯燈炉爐点點独獨狭狹献獻画畫盗盜礼禮禅禪称稱窃竊胆膽茎莖虫蟲蚕蠶蛮蠻装裝触觸誉譽践踐踊踴踪蹤辞辭随隨静靜麦麥";

export const VARIANT_SIZE = 81;

let table: Map<string, string> | null = null;

export function getVariant(): Map<string, string> {
  if (table) return table;
  const m = new Map<string, string>();
  const cps = [...PACKED];
  for (let i = 0; i + 1 < cps.length; i += 2) m.set(cps[i]!, cps[i + 1]!);
  table = m;
  return table;
}
