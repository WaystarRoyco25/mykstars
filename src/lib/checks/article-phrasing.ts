import type { Article } from "../domain/stories";
import { issue, type CheckIssue } from "./result";

/**
 * Analysis playbook rule 15. `check:style` knows the phrasings that have already gone
 * wrong; this knows convergence itself, so it still fires on a formula nobody has
 * written yet. Three words is the window because the July 2026 run varied the verb and
 * kept the noun phrase ("the strongest counterargument" is/concerns/sits in), which puts
 * the tic at words 1-3 and the variation at word 4. Three articles is the floor because
 * two pieces sharing a trigram is ordinary English.
 */
export const FORMULA_GRAM_WORDS = 3;
export const FORMULA_ARTICLE_FLOOR = 3;

/**
 * Chart, filing and box-office vocabulary a writer cannot paraphrase, because rule 4
 * requires repeating it. Seeded from the terms measured closest to the floor, not from
 * guesswork. Grow it when a real domain term trips the check; a phrase here exempts any
 * gram containing it, so keep entries specific.
 */
export const DOMAIN_PHRASES = Object.freeze([
  "album-equivalent units",
  "streaming-equivalent units",
  "on-demand streams",
  "chart dated",
  "box office",
  "operating margin",
] as const);

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "also", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below", "between",
  "both", "but", "by", "can", "could", "did", "do", "does", "down", "during", "each",
  "even", "ever", "every", "few", "for", "from", "further", "had", "has", "have", "he",
  "her", "here", "hers", "his", "how", "i", "if", "in", "into", "is", "it", "its",
  "least", "less", "let", "made", "make", "many", "may", "me", "might", "more", "most",
  "much", "must", "my", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "our", "out", "over", "own", "per", "same", "shall", "she", "should",
  "so", "some", "still", "such", "than", "that", "the", "their", "them", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "us", "very", "was", "we", "were", "what", "when", "where", "which", "while",
  "who", "whom", "why", "will", "with", "would", "yet", "you", "your",
]);

const NUMBER_WORDS = new Set([
  "billion", "dozen", "eight", "eighth", "eleven", "fifth", "first", "five", "four",
  "fourth", "half", "hundred", "million", "nine", "nineteen", "ninth", "one", "percent",
  "second", "seven", "seventh", "six", "sixth", "ten", "tenth", "third", "thirty",
  "thousand", "three", "trillion", "twelve", "twenty", "two", "zero",
]);

const MONTHS = new Set([
  "january", "february", "march", "april", "may", "june", "july", "august", "september",
  "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug",
  "sep", "sept", "oct", "nov", "dec",
]);

interface PhraseToken {
  /** Original casing, so a mid-sentence capital can be read as a proper noun. */
  raw: string;
  /** Lowercased, asterisks and punctuation stripped. */
  word: string;
  /** First token of its sentence, where a capital carries no information. */
  initial: boolean;
}

/**
 * Split on terminal punctuation only when the next sentence actually starts. Requiring an
 * uppercase (or quote/asterisk) opener keeps "No. 1", "Hive Media Corp. co-produced",
 * "*Part.5*" and "10.5 million" intact, which matters because a bad split invents a
 * sentence-initial position and blinds the proper-noun guard at that token.
 */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[*'"“‘A-Z])/);
}

function tokenize(sentence: string): PhraseToken[] {
  const raws = sentence.replace(/\*/g, "").split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
  return raws.map((raw, index) => ({
    raw,
    word: raw.toLowerCase().replace(/^[''’-]+|[''’-]+$/g, ""),
    initial: index === 0,
  }));
}

/** A capital away from the sentence opening is a name, a title or a ticker, never a tic. */
function isProperNoun(token: PhraseToken): boolean {
  return !token.initial && /^[A-Z]/.test(token.raw);
}

/** Numerals, number words and months carry the facts rule 4 mandates, so they never count. */
function isContentWord(token: PhraseToken): boolean {
  if (!token.word) return false;
  if (/\d/.test(token.word)) return false;
  return !STOPWORDS.has(token.word) && !NUMBER_WORDS.has(token.word) && !MONTHS.has(token.word);
}

/**
 * Mark every token position covered by a domain phrase. Positions rather than substrings,
 * because a window can straddle two allowlisted terms and contain neither: "streaming-equivalent
 * units from on-demand streams" yields "units from on-demand", which is forced by the two
 * mandated terms sitting next to each other while matching neither of them.
 */
function domainTokenIndices(words: readonly string[]): Set<number> {
  const marked = new Set<number>();
  for (const phrase of DOMAIN_PHRASES) {
    const phraseWords = phrase.split(" ");
    for (let start = 0; start + phraseWords.length <= words.length; start++) {
      if (phraseWords.every((word, offset) => words[start + offset] === word)) {
        for (let offset = 0; offset < phraseWords.length; offset++) marked.add(start + offset);
      }
    }
  }
  return marked;
}

/**
 * Count a trigram only when it could carry a voice: no proper nouns, at least two content
 * words, no mandated domain vocabulary. The guard skips over half of all prose, which is
 * the price of the 11 pre-formula articles scoring zero.
 */
function countableGram(
  tokens: readonly PhraseToken[],
  start: number,
  domain: ReadonlySet<number>,
): string | undefined {
  const window = tokens.slice(start, start + FORMULA_GRAM_WORDS);
  for (let offset = 0; offset < window.length; offset++) {
    if (domain.has(start + offset)) return undefined;
  }
  if (window.some(isProperNoun)) return undefined;
  if (window.filter(isContentWord).length < 2) return undefined;
  return window.map((token) => token.word).join(" ");
}

export function recycledPhrasingIssues(
  articles: readonly Article[],
  file: string,
): CheckIssue[] {
  const grams = new Map<string, Set<string>>();

  for (const article of articles) {
    if (!article.slug) continue;
    for (const text of [article.dek, ...(article.body ?? [])]) {
      if (!text) continue;
      for (const sentence of sentences(text)) {
        const tokens = tokenize(sentence).filter((token) => token.word);
        const domain = domainTokenIndices(tokens.map((token) => token.word));
        for (let index = 0; index + FORMULA_GRAM_WORDS <= tokens.length; index++) {
          const gram = countableGram(tokens, index, domain);
          if (!gram) continue;
          const seen = grams.get(gram) ?? new Set<string>();
          seen.add(article.slug);
          grams.set(gram, seen);
        }
      }
    }
  }

  return [...grams.entries()]
    .filter(([, slugs]) => slugs.size >= FORMULA_ARTICLE_FLOOR)
    .sort(([leftGram, left], [rightGram, right]) =>
      right.size - left.size || leftGram.localeCompare(rightGram),
    )
    .map(([gram, slugs]) => {
      const named = [...slugs];
      const shown = named.slice(0, 3).join(", ");
      const rest = named.length > 3 ? `, +${named.length - 3} more` : "";
      return issue(
        file,
        "recycled phrasing",
        `"${gram}" does the same job in ${named.length} articles (${shown}${rest}): the ` +
          "playbook names the machinery so you know which move to make, and the prose must " +
          "not echo the name. Make the move in each piece's own words (steelman rule 3, " +
          "side rule 5, closer rule 8; docs/analysis-playbook.md rule 15). If this is real " +
          "domain vocabulary a writer cannot paraphrase, add it to DOMAIN_PHRASES instead.",
      );
    });
}
