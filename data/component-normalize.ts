/**
 * Component aliases.
 *
 * KanjiVG spells the same radical more than one way (both 辶 U+8FB6 and ⻌
 * U+2ECC occur, ~56 and ~49 times). Folding them here keeps the style map from
 * needing duplicate entries, and stops the same radical being rendered two
 * different ways — the class of inconsistency that produced v4's 部→立ﾛ卩.
 */
export const componentAlias: Readonly<Record<string, string>> = {
  // Radical block -> unified ideograph, so the style map has one key each.
  '⻌': '辶',
  '⺅': '亻',
  '⺡': '氵',
  '⺘': '扌',
  '⺮': '竹',
  '⺾': '艹',

  // Rare radical forms folded onto their legible equivalents.
  '⻞': '飠',
  '⺶': '羊',
  '⺫': '罒',
};
