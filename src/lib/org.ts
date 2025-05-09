// Org parsing and formatting functions

import type { MetricValue } from "./types";

export function parseTitle(orgString: string): string | null {
  const titleMatch = orgString.match(/^#\+TITLE:\s*(.*)$/mi);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return null;
}

export function parseOrgId(orgString: string): string | null {
  const idMatch = orgString.match(/^:ID:\s*(.*)$/m);
  if (idMatch && idMatch[1]) {
    return idMatch[1].trim();
  }
  return null;
}

// Parse fragments like #tag or #metric(value) from body strings.  In case of
// simple tags, return tuples of one item, in case of metric values, return
// tuples of key value pair
function parseHashTags(orgString: string): string[][] {
  const matches = orgString.matchAll(/#([a-zA-Z][a-zA-Z0-9-]*)(?:\(([-+]?\d*\.?\d+)\))?/g);
  const results: string[][] = [];
  for (const match of matches) {
    if (match[2] === undefined) {
      results.push([match[1]]);
    } else {
      results.push([match[1], match[2]]);
    }
  }
  return results;
}

export function parseTags(orgString: string): string[] {
  return parseHashTags(orgString).filter(ht => ht.length === 1).map(ht => ht[0]);
}

export function parseMetricValues(orgString: string, datetime: Date, reference: string): MetricValue[] {
  // We ask for datetime and reference since all source of metric values
  // (should) have them.
  let hashTags = parseHashTags(orgString);

  return hashTags.filter(ht => ht.length == 2).map(ht => {
    return {
      id: ht[0],
      datetime,
      value: parseFloat(ht[1]),
      reference
    };
  });
}
