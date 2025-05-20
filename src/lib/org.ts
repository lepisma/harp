// Org parsing and formatting functions

import type { Asset, Document, Journal, JournalEntry, Metadata, Metric, MetricValue, Profile, Report } from "./types";
import { unified } from 'unified';
import parse from 'uniorg-parse';
import uniorg2rehype from 'uniorg-rehype';
import stringify from 'rehype-stringify';
import type { Headline, Keyword, OrgData, PropertyDrawer, Section, Text } from 'uniorg';
import { parseMimeType } from "./fs";

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
 * Convert a property drawer from org tree to a simple js record
 */
function drawerRecord(drawerElem: PropertyDrawer): Record<string, string> {
  const record: Record<string, string> = {};

  for (const child of drawerElem.children) {
    if (child.type === 'node-property') {
      record[child.key.toUpperCase()] = child.value.trim();
    }
  }

  return record;
}

/*
 * Return relative path of an asset file using the default org-attach approach
 */
export function orgAttachPath(asset: Asset, parentId: string): string {
  return `data/${parentId.substring(0, 2)}/${parentId.substring(2)}/${asset.fileName}`;
}

function parseTitle(data: OrgData): string | null {
  const titleElem = data.children.find(child => child.type === 'keyword' && child.key.toUpperCase() === 'TITLE');

  if (titleElem) {
    return (titleElem as Keyword).value.trim();
  } else {
    return null;
  }
}

function parseOrgId(data: OrgData): string | null {
  const drawerElem = data.children.find(child => child.type === 'property-drawer');

  if (drawerElem) {
    return drawerRecord(drawerElem)['ID'] || null;
  } else {
    return null;
  }
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
 * Parse org datetime stamps. This works as the inverse of `formatDatetimeForOrg`.
 */
function parseDatetimeFromOrg(text: string): Date | null {
  const match = text.match(/^\[(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?\]$/);

  if (!match) {
    console.error(`Invalid Org datetime format: ${text}`);
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in Date
  const day = parseInt(match[3], 10);

  // Check if time components exist
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;

  return new Date(year, month, day, hours, minutes);
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

function findNamedSection(orgData: OrgData, name: string): Section | null {
  const sectionElem = orgData.children.find(child => child.type === 'section'
    && child.children[0].type === 'headline'
    && headlineText(child.children[0]) === name);

  if (!sectionElem) {
    return null;
  }

  return sectionElem as Section;
}

/*
 * Return assets present in form of org links in the body text
 */
function parseAssetsFromText(text: string): Asset[] {
  const assets: Asset[] = [];
  const assetRegex = /\[\[attachment:([^\]]+)\]\[\1\]\]/g;

  let match: RegExpExecArray | null;

  while ((match = assetRegex.exec(text)) !== null) {
    const fileName = match[1];
    const mimeType = parseMimeType(fileName);

    if (mimeType) {
      assets.push({ fileName, mimeType });
    } else {
      assets.push({ fileName });
    }
  }

  return assets;
}

function parseMetrics(orgData: OrgData): Metric[] {
  const metaSectionElem = findNamedSection(orgData, 'Metadata');
  if (!metaSectionElem) {
    console.error('No metadata section found:', orgData);
    return [];
  }

  const sectionElem = findNamedSection(metaSectionElem as unknown as OrgData, 'Metrics');
  if (!sectionElem) {
    console.error('No metrics section found:', metaSectionElem);
    return [];
  }

  const metrics: Metric[] = [];
  const metricElems = sectionElem.children.filter(child => child.type === 'section');

  for (const metricElem of metricElems) {
    const headElem = metricElem.children.find(child => child.type === 'headline');
    if (!headElem) {
      console.error('Error in parsing heading:', metricElem);
      continue;
    }

    const name = headlineText(headElem);
    const tags = headElem.tags;

    const props = sectionProps(metricElem);
    let parsingIssue = false;
    for (const propName of ['UNIT', 'TAG_ID', 'RANGE', 'HEALTHY_RANGE']) {
      if (!props[propName]) {
        console.error(`Unable to find ${propName}:`, metricElem);
        parsingIssue = true;
        break;
      }
    }
    if (parsingIssue) {
      continue;
    }

    const metric: Metric = {
      name,
      id: props['TAG_ID'],
      unit: props['UNIT'],
      tags,
      range: parseNumberRange(props['RANGE']),
      healthyRange: parseNumberRange(props['HEALTHY_RANGE']),
    }

    metrics.push(metric);
  }

  return metrics;
}

function parseNumberRange(text: string): [number | undefined, number | undefined] {
  const regex = /^\s*(-?\d+(\.\d+)?|null)\s*-\s*(-?\d+(\.\d+)?|null)\s*$/i;
  const match = text.match(regex);

  if (!match) {
    return [undefined, undefined];
  }

  const rawStart = match[1];
  const rawEnd = match[3];

  let start: number | undefined;
  let end: number | undefined;

  if (rawStart.toLowerCase() === 'null') {
    start = undefined;
  } else {
    start = parseFloat(rawStart);
    if (isNaN(start)) {
      start = undefined;
    }
  }

  if (rawEnd.toLowerCase() === 'null') {
    end = undefined;
  } else {
    end = parseFloat(rawEnd);
    if (isNaN(end)) {
      end = undefined;
    }
  }

  return [start, end];
}

function parseJournalEntry(sectionElem: Section): JournalEntry | null {
  const text = sectionBody(sectionElem);
  if (!text) {
    console.error('Unable to find body text for journal entry:', sectionElem);
    return null;
  }

  const props = sectionProps(sectionElem);
  let parsingIssue = false;
  for (const propName of ['ID', 'DATETIME', 'PRIVATE']) {
    if (!props[propName]) {
      console.error(`Unable to find ${propName}:`, sectionElem);
      parsingIssue = true;
      break;
    }
  }
  if (parsingIssue) {
    return null;
  }

  const datetime = parseDatetimeFromOrg(props['DATETIME']);
  if (!datetime) {
    console.error('Error in parsing datetime value');
    return null;
  }

  return {
    datetime,
    uuid: props['ID'],
    tags: sectionTags(sectionElem).filter(tag => tag !== 'ATTACH'),
    text,
    metricValues: parseMetricValues(text, datetime, props['ID']),
    assets: parseAssetsFromText(text),
    isPrivate: props['PRIVATE'] === 't'
  };
}

function parseJournals(orgData: OrgData): Journal[] {
  const sectionElem = findNamedSection(orgData, 'Journals');

  if (!sectionElem) {
    console.error('Error in finding Journals section in orgData:', orgData);
    return [];
  }

  // As of now, we only allow working with one journal called 'Main'
  const journalSection = findNamedSection(sectionElem as unknown as OrgData, 'Main');

  if (!journalSection) {
    console.error('Cannot find the Main journal');
    return [];
  }

  const entries: JournalEntry[] = journalSection.children.filter(child => child.type === 'section')
    .map(child => parseJournalEntry(child))
    .filter(it => it !== null);

  return [{
    name: 'Main',
    entries: entries
  }];
}

function sectionProps(sectionElem: Section): Record<string, string> {
  const drawerElem = sectionElem.children.find(child => child.type === 'property-drawer');
  if (!drawerElem) {
    console.error('Unable to find property drawer:', sectionElem);
    return {};
  }

  return drawerRecord(drawerElem);
}

function sectionTags(sectionElem: Section): string[] {
  const headElem = sectionElem.children.find(child => child.type === 'headline');
  if (!headElem) {
    console.error('Found a section without headline:', sectionElem);
    return [];
  }

  return headElem.tags;
}

/*
 * Return body text for the headlined section
 */
function sectionBody(sectionElem: Section): string | null {
  const bodyElems = sectionElem.children.filter(child => child.type === 'paragraph');
  if (bodyElems.length > 0) {
    const paragraphTexts = bodyElems.map(be => be.children.filter(child => child.type === 'text').map(child => child.value).join());
    const bodyText = paragraphTexts.join('\n\n').trim();

    return bodyText !== '' ? bodyText : null;
  } else {
    return null;
  }
}

function headlineText(headlineElem: Headline): string {
  return (headlineElem.children[0] as Text).value.trim();
}

function parseReportsOrDocuments(orgData: OrgData, isReport: boolean): (Report | Document)[] {
  const sectionElem =  findNamedSection(orgData, (isReport ? 'Reports' : 'Documents'));

  if (!sectionElem) {
    console.error('Error in parsing section from orgData:', orgData);
    return [];
  }

  const entityElems = (sectionElem as Section).children.filter(child => child.type === 'section');

  const entities: (Report | Document)[] = [];
  for (const entityElem of entityElems) {
    const headElem = entityElem.children.find(child => child.type === 'headline');
    if (!headElem) {
      console.error('Error in parsing heading:', entityElem);
      continue;
    }

    const name = headlineText(headElem);
    // ATTACH tag is just to tell org mode that there are attachments. We anyway
    // keep attachment names in FILES prop.
    const tags = headElem.tags.filter(tag => tag !== 'ATTACH');

    const props = sectionProps(entityElem);
    let parsingIssue = false;
    for (const propName of ['SOURCE', 'ID', 'FILES', 'DATETIME']) {
      if (!props[propName]) {
        console.error(`Unable to find ${propName}:`, entityElem);
        parsingIssue = true;
        break;
      }
    }
    if (parsingIssue) {
      continue;
    }

    // Parse assets
    const assets: Asset[] = props['FILES'].split(',').map(text => text.trim()).map(fileName => {
      const asset: Asset = { fileName };
      const mimeType = parseMimeType(fileName);
      if (mimeType) {
        asset['mimeType'] = mimeType;
      }
      return asset;
    });

    const datetime = parseDatetimeFromOrg(props['DATETIME']);
    if (!datetime) {
      console.error('Error in parsing datetime value');
      continue;
    }

    // NOTE: We might have to be careful here since there could be many other
    // items here too beyond paragraphs.
    const annotation = sectionBody(entityElem) || '';

    const entity: Report | Document = {
      name,
      datetime,
      uuid: props['ID'],
      tags,
      source: {
        id: props['SOURCE'],
        description: '' // We just use ID as of now
      },
      assets,
      annotation
    };

    if (isReport) {
      (entity as Report)['metricValues'] = parseMetricValues(annotation, datetime, props['ID']);
    }

    entities.push(entity);
  }

  return entities;
}

function parseReports(orgData: OrgData): Report[] {
  return parseReportsOrDocuments(orgData, true) as Report[];
}

function parseDocuments(orgData: OrgData): Document[] {
  return parseReportsOrDocuments(orgData, false);
}

export async function parseProfile(content: string): Promise<Profile | null> {
  const processor = unified().use(parse);
  const orgData = processor.parse(content);

  let uuid = parseOrgId(orgData);
  if (uuid === null) {
    console.error('Unable to parse uuid for profile');
    return null;
  }

  let name = parseTitle(orgData);
  if (name === null) {
    console.error('Unable to parse name for profile');
    return null;
  }

  const reports = parseReports(orgData);
  const documents = parseDocuments(orgData);

  const sources = Array.from(new Set([...documents.map(doc => doc.source.id), ...reports.map(rep => rep.source.id)]))
    .map(s => { return { id: s, description: '' }; });

  const metadata = {
    sources,
    metrics: parseMetrics(orgData),
  };

  const profile = {
    uuid,
    name,
    metadata,
    journals: parseJournals(orgData),
    reports,
    documents,
  };

  return profile;
}
