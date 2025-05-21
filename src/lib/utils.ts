import type { Asset, MetricValue, Profile } from './types';

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

/*
 * Collect and return all assets present in the profile along with the
   corresponding parent IDs
 */
export function profileParentAssetPairs(profile: Profile): [string, Asset][] {
  const output: [string, Asset][] = [];

  for (const journal of profile.journals) {
    for (const entry of journal.entries) {
      output.push(...entry.assets.map(asset => [entry.uuid, asset] as [string, Asset]));
    }
  }

  for (const report of profile.reports) {
    output.push(...report.assets.map(asset => [report.uuid, asset] as [string, Asset]));
  }

  for (const doc of profile.documents) {
    output.push(...doc.assets.map(asset => [doc.uuid, asset] as [string, Asset]));
  }
  return output;
}

export function formatDatetime(dt: Date): string {
  if (dt.getHours() === 0 && dt.getMinutes() === 0) {
    // HACK: We assume that midnight means only date is provided
    return dt.toLocaleDateString();
  } else {
    return dt.toLocaleString();
  }
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
