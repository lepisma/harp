// Org parsing functions

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
