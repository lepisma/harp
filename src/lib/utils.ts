import type { MetricValue, Profile } from './types';

/*
 * Collect all metric values from the profile
 */
export function profileMetricValues(profile: Profile): MetricValue[] {
  let metricValues: MetricValue[] = [];

  for (const journal of profile.journals) {
    for (const entry of journal.entries) {
      metricValues.push(...entry.metricValues);
    }
  }

  for (const report of profile.reports) {
    metricValues.push(...report.metricValues);
  }

  return metricValues;
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function transformAttachmentLinks(htmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const anchorTags = doc.querySelectorAll('a');
  anchorTags.forEach(tag => {
    const href = tag.getAttribute('href');

    if (href && href.startsWith('attachment:')) {
      const fileName = href.substring('attachment:'.length);
      tag.setAttribute('href', '#');
      tag.setAttribute('data-filename', fileName);
      tag.classList.add('btn', 'btn-sm', 'preset-tonal');

      // Simplify the text inside link. This is needed since many files have
      // underscores etc. in name and they are getting transformed to
      // subscripts because of usual org thing.
      tag.innerHTML = fileName;
    }
  });

  return doc.body.innerHTML;
}

/*
 * Collect and return tags from across items in profile
 */
export function profileTags(profile: Profile): string[] {
  let tags: Set<string> = new Set();

  for (const journal of profile.journals) {
    for (const entry of journal.entries) {
      for (const tag of entry.tags) {
        tags.add(tag);
      }
    }
  }

  for (const report of profile.reports) {
    for (const tag of report.tags) {
      tags.add(tag);
    }
  }

  for (const document of profile.documents) {
    for (const tag of document.tags) {
      tags.add(tag);
    }
  }

  for (const metric of profile.metadata.metrics) {
    for (const tag of metric.tags) {
      tags.add(tag);
    }
  }

  return [...tags].sort();
}

export function triggerDownload(data: Blob, fileName: string) {
  const url = URL.createObjectURL(data);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function triggerOpen(data: Blob) {
  const url = URL.createObjectURL(data);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.target = '_blank';

  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
