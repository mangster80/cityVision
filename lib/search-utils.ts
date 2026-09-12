import { Place, Proposal } from "@/types";

/**
 * Normalizes text for search by lowercasing, stripping diacritics / accents,
 * expanding common Swedish abbreviations, and collapsing whitespace.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks (e.g. å->a, ä->a, ö->o, é->e)
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // Replace punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common abbreviations or aliases in Sweden.
 */
const SWEDISH_SEARCH_ALIASES: Record<string, string> = {
  sthlm: "stockholm",
  gbg: "goteborg",
  mmo: "malmo",
  upps: "uppsala",
  vasteras: "vasteras",
  orebro: "orebro",
  linkpg: "linkoping",
  norrkpg: "norrkoping",
  jkpg: "jonkoping",
  st: "stockholm",
};

/**
 * Computes Levenshtein edit distance between two short strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Swap to ensure `b` is shorter to save memory
  if (a.length < b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  let prevRow: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let currRow: number[] = new Array(b.length + 1).fill(0);

  for (let i = 0; i < a.length; i++) {
    currRow[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      currRow[j + 1] = Math.min(
        currRow[j] + 1, // insertion
        prevRow[j + 1] + 1, // deletion
        prevRow[j] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[b.length];
}

/**
 * Checks if a search token matches a target word either exactly, as a prefix,
 * or with typo tolerance (Levenshtein distance).
 */
export function tokenMatchesWord(token: string, word: string): { matches: boolean; exact: boolean; prefix: boolean; fuzzy: boolean } {
  if (token === word) {
    return { matches: true, exact: true, prefix: false, fuzzy: false };
  }
  if (word.startsWith(token) && token.length >= 2) {
    return { matches: true, exact: false, prefix: true, fuzzy: false };
  }
  // If token is inside word (substring)
  if (word.includes(token) && token.length >= 3) {
    return { matches: true, exact: false, prefix: false, fuzzy: false };
  }
  // Typo tolerance: 1 edit for 4-6 chars, 2 edits for 7+ chars
  if (token.length >= 4) {
    const maxDistance = token.length >= 7 ? 2 : 1;
    if (Math.abs(token.length - word.length) <= maxDistance) {
      const dist = levenshteinDistance(token, word);
      if (dist <= maxDistance) {
        return { matches: true, exact: false, prefix: false, fuzzy: true };
      }
    }
  }

  return { matches: false, exact: false, prefix: false, fuzzy: false };
}

/**
 * Tokenizes a query into normalized tokens and expands Swedish aliases.
 */
export function extractSearchTokens(rawQuery: string): string[] {
  const normalized = normalizeSearchText(rawQuery);
  if (!normalized) return [];

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const processedTokens: string[] = [];

  for (const tok of rawTokens) {
    if (SWEDISH_SEARCH_ALIASES[tok]) {
      processedTokens.push(SWEDISH_SEARCH_ALIASES[tok]);
    }
    // Remove "kommun" or "stad" suffix if part of a token list
    if (tok !== "kommun" && tok !== "stad") {
      processedTokens.push(tok);
    }
  }

  return Array.from(new Set(processedTokens));
}

/**
 * Scores a place against a query. Higher score = better match.
 * Returns 0 if the place does not match the search query.
 */
export function scorePlace(place: Place, rawQuery: string, tokens: string[]): number {
  if (tokens.length === 0) return 100; // Base score when no search query

  const normQuery = normalizeSearchText(rawQuery);
  const normName = normalizeSearchText(place.name);
  const normCity = normalizeSearchText(place.city);
  const normMunicipality = normalizeSearchText(place.municipality || "");
  const normCategory = normalizeSearchText(place.category);
  const normDescription = normalizeSearchText(place.description || "");

  let score = 0;

  // 1. Exact or whole-string matches (highest priority)
  if (normName === normQuery) score += 200;
  else if (normName.startsWith(normQuery)) score += 120;
  else if (normName.includes(normQuery)) score += 80;

  if (normMunicipality === normQuery || normCity === normQuery) score += 90;
  else if (normMunicipality.startsWith(normQuery) || normCity.startsWith(normQuery)) score += 60;
  else if (normMunicipality.includes(normQuery) || normCity.includes(normQuery)) score += 40;

  // Category match
  if (normCategory === normQuery || normCategory.includes(normQuery)) score += 50;

  // 2. Token-by-token evaluation across all fields
  const nameWords = normName.split(/\s+/).filter(Boolean);
  const locationWords = `${normCity} ${normMunicipality}`.split(/\s+/).filter(Boolean);
  const categoryWords = normCategory.split(/\s+/).filter(Boolean);
  const descWords = normDescription.split(/\s+/).filter(Boolean);

  let matchedTokenCount = 0;

  for (const token of tokens) {
    let tokenMatched = false;

    // Check in name words
    for (const w of nameWords) {
      const match = tokenMatchesWord(token, w);
      if (match.matches) {
        score += match.exact ? 40 : match.prefix ? 25 : match.fuzzy ? 15 : 20;
        tokenMatched = true;
        break;
      }
    }

    // Check in location words (city, municipality)
    if (!tokenMatched) {
      for (const w of locationWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 35 : match.prefix ? 20 : match.fuzzy ? 12 : 15;
          tokenMatched = true;
          break;
        }
      }
    }

    // Check in category
    if (!tokenMatched) {
      for (const w of categoryWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 30 : match.prefix ? 15 : 10;
          tokenMatched = true;
          break;
        }
      }
    }

    // Check in description
    if (!tokenMatched) {
      for (const w of descWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 15 : match.prefix ? 8 : 5;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) {
      matchedTokenCount++;
    }
  }

  // If query had multiple tokens and not all tokens matched, apply strict penalty or reject
  if (tokens.length > 1) {
    if (matchedTokenCount === 0) return 0;
    const matchRatio = matchedTokenCount / tokens.length;
    if (matchRatio < 0.6) return 0; // Filter out weak partial matches for multi-token queries
    score = Math.round(score * matchRatio);
  } else if (matchedTokenCount === 0 && score === 0) {
    return 0;
  }

  // Small tiebreaker for proposal activity
  score += Math.min(place.proposalCount * 2, 20);

  return score;
}

/**
 * Scores a proposal against a query.
 */
export function scoreProposal(
  proposal: Proposal,
  place: Place | undefined,
  rawQuery: string,
  tokens: string[]
): number {
  if (tokens.length === 0) return 100;

  const normQuery = normalizeSearchText(rawQuery);
  const normTitle = normalizeSearchText(proposal.title);
  const normMunicipality = normalizeSearchText(proposal.municipality || place?.municipality || "");
  const normPlaceName = normalizeSearchText(place?.name || "");
  const normCategory = normalizeSearchText(proposal.category);
  const normDescription = normalizeSearchText(proposal.description || "");
  const normAuthor = normalizeSearchText(proposal.author?.name || "");

  let score = 0;

  // 1. Direct query matching
  if (normTitle === normQuery) score += 200;
  else if (normTitle.startsWith(normQuery)) score += 120;
  else if (normTitle.includes(normQuery)) score += 80;

  if (normPlaceName && normPlaceName.includes(normQuery)) score += 60;
  if (normMunicipality && normMunicipality.includes(normQuery)) score += 50;
  if (normCategory && normCategory.includes(normQuery)) score += 40;

  // 2. Token-by-token evaluation
  const titleWords = normTitle.split(/\s+/).filter(Boolean);
  const placeWords = `${normPlaceName} ${normMunicipality}`.split(/\s+/).filter(Boolean);
  const categoryWords = normCategory.split(/\s+/).filter(Boolean);
  const descWords = normDescription.split(/\s+/).filter(Boolean);
  const authorWords = normAuthor.split(/\s+/).filter(Boolean);

  let matchedTokenCount = 0;

  for (const token of tokens) {
    let tokenMatched = false;

    // Check title words
    for (const w of titleWords) {
      const match = tokenMatchesWord(token, w);
      if (match.matches) {
        score += match.exact ? 40 : match.prefix ? 25 : match.fuzzy ? 15 : 20;
        tokenMatched = true;
        break;
      }
    }

    // Check place name / municipality
    if (!tokenMatched) {
      for (const w of placeWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 30 : match.prefix ? 18 : 12;
          tokenMatched = true;
          break;
        }
      }
    }

    // Check author
    if (!tokenMatched) {
      for (const w of authorWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 25 : match.prefix ? 15 : 10;
          tokenMatched = true;
          break;
        }
      }
    }

    // Check category
    if (!tokenMatched) {
      for (const w of categoryWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 25 : match.prefix ? 15 : 10;
          tokenMatched = true;
          break;
        }
      }
    }

    // Check description
    if (!tokenMatched) {
      for (const w of descWords) {
        const match = tokenMatchesWord(token, w);
        if (match.matches) {
          score += match.exact ? 15 : match.prefix ? 8 : 5;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) {
      matchedTokenCount++;
    }
  }

  if (tokens.length > 1) {
    if (matchedTokenCount === 0) return 0;
    const matchRatio = matchedTokenCount / tokens.length;
    if (matchRatio < 0.6) return 0;
    score = Math.round(score * matchRatio);
  } else if (matchedTokenCount === 0 && score === 0) {
    return 0;
  }

  return score;
}

/**
 * Filters and ranks places according to a search query and optional category filter.
 */
export function filterAndRankPlaces(
  places: Place[],
  rawQuery: string,
  categoryFilter = "ALL"
): Place[] {
  const tokens = extractSearchTokens(rawQuery);
  const hasQuery = tokens.length > 0;

  const scoredPlaces: { place: Place; score: number }[] = [];

  for (const place of places) {
    if (categoryFilter !== "ALL" && place.category !== categoryFilter) {
      continue;
    }

    const score = hasQuery ? scorePlace(place, rawQuery, tokens) : 100;
    if (score > 0) {
      scoredPlaces.push({ place, score });
    }
  }

  // Sort by score descending; fallback to proposal count
  scoredPlaces.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.place.proposalCount - a.place.proposalCount;
  });

  return scoredPlaces.map(item => item.place);
}

/**
 * Filters and ranks proposals according to a search query, category, status, and sort option.
 */
export function filterAndRankProposals(
  proposals: Proposal[],
  places: Place[],
  rawQuery: string,
  categoryFilter = "ALL",
  statusFilter = "ALL",
  sortOption: "popular" | "newest" | "support" = "popular"
): Proposal[] {
  const tokens = extractSearchTokens(rawQuery);
  const hasQuery = tokens.length > 0;
  const placesMap = new Map<string, Place>(places.map(p => [p.id, p]));

  const scoredList: { proposal: Proposal; score: number }[] = [];

  for (const proposal of proposals) {
    if (categoryFilter !== "ALL" && proposal.category !== categoryFilter) {
      continue;
    }

    const proposalStatus = proposal.status ?? "idea";
    if (statusFilter !== "ALL" && proposalStatus !== statusFilter) {
      continue;
    }

    const place = placesMap.get(proposal.placeId);
    const score = hasQuery ? scoreProposal(proposal, place, rawQuery, tokens) : 100;

    if (score > 0) {
      scoredList.push({ proposal, score });
    }
  }

  // Sorting
  scoredList.sort((a, b) => {
    // If there is an active search query, rank primarily by relevance score
    if (hasQuery && Math.abs(b.score - a.score) >= 15) {
      return b.score - a.score;
    }

    // Secondary sorting based on user's chosen sort
    if (sortOption === "newest") {
      return b.proposal.createdAt.localeCompare(a.proposal.createdAt);
    }
    if (sortOption === "support") {
      return b.proposal.supporters - a.proposal.supporters;
    }
    return b.proposal.votes - a.proposal.votes;
  });

  return scoredList.map(item => item.proposal);
}
