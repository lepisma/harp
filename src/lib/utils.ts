import type { Profile } from './types';
import { v4 as uuidv4 } from 'uuid';

export function newProfile(name: string): Profile {
  return {
    uuid: uuidv4(),
    name: name,
    metadata: {
      sources: [],
      metrics: []
    },
    journals: [{
      name: 'Main',
      entries: []
    }],
    reports: [],
    consultations: [],
    metrics: [],
  }
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
