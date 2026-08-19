const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  қ: "q", ғ: "g", ҳ: "h", ў: "o",
};

export function normalizeSearchText(value: string): string {
  const transliterated = Array.from(value.toLocaleLowerCase("uz-UZ"))
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻʼ’‘`´]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      current.push(
        Math.min(
          current[j] + 1,
          previous[j + 1] + 1,
          previous[j] + (a[i] === b[j] ? 0 : 1),
        ),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function tokenSimilarity(queryToken: string, candidateToken: string): number {
  if (queryToken === candidateToken) return 1;
  if (candidateToken.includes(queryToken)) return 0.96;

  const distance = levenshtein(queryToken, candidateToken);
  const maxLength = Math.max(queryToken.length, candidateToken.length);
  const allowedDistance = maxLength <= 4 ? 1 : maxLength <= 7 ? 2 : 3;
  if (distance > allowedDistance) return 0;

  return 1 - distance / maxLength;
}

export function searchRelevance(query: string, fields: string[]): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const normalizedFields = fields.map(normalizeSearchText).filter(Boolean);
  const haystack = normalizedFields.join(" ");
  if (haystack.includes(normalizedQuery)) return 1;

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const candidateTokens = haystack.split(" ").filter(Boolean);
  if (!queryTokens.length || !candidateTokens.length) return 0;

  const scores = queryTokens.map((queryToken) =>
    Math.max(...candidateTokens.map((candidateToken) => tokenSimilarity(queryToken, candidateToken))),
  );

  if (scores.some((score) => score < 0.86)) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
