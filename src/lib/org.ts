// Org parsing and formatting functions

import type { Asset, Document, Journal, Metadata, MetricValue, Profile, Report } from "./types";
import { unified } from 'unified';
import parse from 'uniorg-parse';
import uniorg2rehype from 'uniorg-rehype';
import stringify from 'rehype-stringify';

interface OrgNode {
  id?: string;
  datetime?: Date;
  level: number;
  title: string;
  tags: string[];
  props: object;
  content: string;
}

/*
 * Return relative path of an asset file using the default org-attach approach
 */
export function orgAttachPath(asset: Asset, parentId: string): string {
  return `data/${parentId.substring(0, 2)}/${parentId.substring(2)}/${asset.fileName}`;
}

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

function addAnchorClassToLinks(htmlString: string): string {
  const parser = new DOMParser();

  const doc = parser.parseFromString(htmlString, 'text/html');
  const anchorTags = doc.querySelectorAll('a');

  anchorTags.forEach(tag => {
    tag.classList.add('anchor');
  });

  return doc.body.innerHTML;
}

export function formatOrgToHTML(content: string): Promise<string> {
  return new Promise(resolve => {
    const processor = unified().use(parse).use(uniorg2rehype).use(stringify);
    processor.process(content).then(file => resolve(addAnchorClassToLinks(file.value as string)));
  });
}

function formatTags(tags: string[]): string {
  if (tags.length > 0) {
    return `:${tags.join(':')}:`;
  } else {
    return '';
  }
}

/*
 * Format as inactive org timestamps. This is primarily for use in properties blocks.
 */
function formatDatetimeForOrg(dt: Date): string {
  const year = dt.getFullYear();
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const day = dt.getDate().toString().padStart(2, '0');
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');

  // Check if the time components are all zeros, indicating a date-only value
  if (dt.getHours() === 0 && dt.getMinutes() === 0 && dt.getSeconds() === 0 && dt.getMilliseconds() === 0) {
    return `[${year}-${month}-${day}]`;
  } else {
    return `[${year}-${month}-${day} ${hours}:${minutes}]`;
  }
}

/*
 * Format an org node with heading etc.
 */
function formatNode(node: OrgNode): string {
  let titleLine = `${'*'.repeat(node.level)} ${node.title}    ${formatTags(node.tags)}`;
  let props = {...node.props};
  if (node.id) {
    props['ID'] = node.id;
  }
  if (node.datetime) {
    props['DATETIME'] = formatDatetimeForOrg(node.datetime);
  }

  let propLines = [];
  for (const [key, value] of Object.entries(props)) {
    propLines.push(`:${key}:  ${value}`);
  }

  let propBlock = '';

  if (propLines.length > 0) {
    propBlock = `:PROPERTIES:
${propLines.join('\n')}
:END:`;
  }

  return `${titleLine}\n${propBlock ? propBlock + '\n' : ''}\n${node.content}`;
}

function formatPreamble(profile: Profile): string {
  return `:PROPERTIES:
:ID: ${profile.uuid}
:END:
#+TITLE: ${profile.name}`;
}

function formatSection(title: string, children: OrgNode[], level: number = 1): string {
  return `${'*'.repeat(level)} ${title}\n${children.map(formatNode).join('\n\n')}`;
}

function formatMetadata(metadata: Metadata): string {
  let sourceNode = {
    level: 2,
    title: 'Sources',
    tags: [],
    props: {},
    content: metadata.sources.map(source => `- ${source.id} :: ${source.description}`).join('\n')
  }

  let metricNodes: OrgNode[] = metadata.metrics.map(m => {
    let props = {
      'TAG_ID': m.id,
      'UNIT': m.unit,
    };

    props['RANGE'] = `${m.range[0]}-${m.range[1]}`;
    props['HEALTHY_RANGE'] = `${m.healthyRange[0]}-${m.healthyRange[1]}`;

    return {
      tags: m.tags,
      props,
      level: 3,
      title: m.name,
      content: ''
    };
  });

  let metricsNode = {
    level: 2,
    title: 'Metrics',
    tags: [],
    props: {},
    content: metricNodes.map(formatNode).join('\n\n')
  };

  return formatSection('Metadata', [sourceNode, metricsNode]);
}

function formatJournals(journals: Journal[]): string {
  let journalNodes = [];

  for (const journal of journals) {
    let entryNodes = [];

    for (const entry of journal.entries) {
      let tags = [...entry.tags];
      if (entry.assets.length > 0) {
        tags.push('ATTACH');
      }

      let entryNode = {
        id: entry.uuid,
        datetime: entry.datetime,
        level: 3,
        title: 'Entry',
        tags,
        props: {
          'PRIVATE': entry.isPrivate ? 't' : 'nil'
        },
        content: entry.text
      };

      entryNodes.push(entryNode);
    }

    let journalNode = {
      level: 2,
      title: journal.name,
      tags: [],
      props: {},
      content: entryNodes.map(formatNode).join('\n\n'),
    };
    journalNodes.push(journalNode);
  }

  return formatSection('Journals', journalNodes);
}

function formatReports(reports: Report[]): string {
  return formatSection('Reports', reports.map(r => {
    let tags = [...r.tags];
    let props: Record<string, string> = {
      'SOURCE': r.source.id
    };

    if (r.assets.length > 0) {
      tags.push('ATTACH');
      props['FILES'] = r.assets.map(asset => asset.fileName).join(', ');
    }

    return {
      id: r.uuid,
      datetime: r.datetime,
      level: 2,
      title: r.name,
      tags,
      props,
      content: r.annotation || ''  // No need to parse metric values since they
                                   // are stored in the annotation itself
    };
  }));
}

function formatDocuments(documents: Document[]): string {
  return formatSection('Documents', documents.map(d => {
    let tags = [...d.tags];
    let props: Record<string, string> = {
      'SOURCE': d.source.id
    };

    if (d.assets.length > 0) {
      tags.push('ATTACH');
      props['FILES'] = d.assets.map(asset => asset.fileName).join(', ');
    }

    return {
      id: d.uuid,
      datetime: d.datetime,
      level: 2,
      title: d.name,
      tags,
      props,
      content: d.annotation || ''
    };
  }));
}

// Convert profile to a single Org Mode file for export
export function formatProfile(profile: Profile): string {
  let preamble = formatPreamble(profile);
  let metadata = formatMetadata(profile.metadata);
  let journals = formatJournals(profile.journals);
  let reports = formatReports(profile.reports);
  let documents = formatDocuments(profile.documents);
  // metricValues are derived, so not formatting them separately. Note that
  // metric definitions are in metadata.

  return `${preamble}

${metadata}

${journals}

${reports}

${documents}`;
}
