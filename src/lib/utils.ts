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
