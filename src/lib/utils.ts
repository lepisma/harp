import type { MetricValue, Profile } from './types';

/*
 * Collect all metric values from the profile and return a map of metric id to
   metric values
 */
export function profileMetricValues(profile: Profile): object {
  let metricValuesMap: Record<string, MetricValue[]> = {};

  for (const journal of profile.journals) {
    for (const entry of journal.entries) {
      for (const mv of entry.metricValues) {
        if (!Object.keys(metricValuesMap).includes(mv.id)) {
          metricValuesMap[mv.id] = [];
        }

        metricValuesMap[mv.id].push(mv);
      }
    }
  }

  for (const report of profile.reports) {
    for (const mv of report.metricValues) {
      if (!Object.keys(metricValuesMap).includes(mv.id)) {
        metricValuesMap[mv.id] = [];
      }

      metricValuesMap[mv.id].push(mv);
    }
  }

  return metricValuesMap;
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

  for (const consultation of profile.consultations) {
    for (const tag of consultation.tags) {
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
