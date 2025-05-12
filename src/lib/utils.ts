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

export function profileAssets(): Asset

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
