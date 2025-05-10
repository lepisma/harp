// Core operations

import type { Database } from './db';
import type { Profile, Asset, ProfileSummary } from './types';
import { v4 as uuidv4 } from 'uuid';

function newProfile(name: string): Profile {
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
    metricValues: [],
  }
}

function summarizeProfile(profile: Profile): ProfileSummary {
  return {
    uuid: profile.uuid,
    name: profile.name,
    metadata: profile.metadata,
    counts: {
      journals: profile.journals.length,
      journalEntries: profile.journals.map(j => j.entries.length).reduce((a, b) => a + b, 0),
      reports: profile.reports.length,
      consultations: profile.consultations.length,
      metricValues: profile.metricValues.length,
    }
  };
}

export async function createNewProfile(db: Database, profileName: string): Promise<Profile> {
  let profile = newProfile(profileName);
  await saveProfile(db, profile);
  return profile;
}

export async function deleteProfile(db: Database, profileId: string) {
  await db.delete('profiles', profileId);
}

export async function loadProfile(db: Database, profileId: string): Promise<Profile | undefined> {
  return await db.get('profiles', profileId);
}

export async function loadAsset(db: Database, parentId: string, asset: Asset): Promise<Blob | undefined> {
  let assetId = `${parentId}-${asset.fileName}`;
  let result = await db.get('assets', assetId);
  if (result) {
    return result.data;
  } else {
    return undefined;
  }
}

export async function saveAsset(db: Database, parentId: string, asset: Asset, data: Blob) {
  let assetId = `${parentId}-${asset.fileName}`;
  await db.put('assets', { id: assetId, data });
}

export async function loadProfileSummaries(db: Database): Promise<ProfileSummary[]> {
  let profiles = await db.getAll('profiles');
  return profiles.map(summarizeProfile);
}

export async function saveProfile(db: Database, profile: Profile) {
  // Since we might be taking svelte profile, we ensure that the db write gets a
  // proper object. Otherwise the write fails.
  let clonedProfile: Profile = JSON.parse(JSON.stringify(profile));

  // Datetime needs to be recovered as objects for this
  clonedProfile.journals[0].entries.forEach(entry => {
    entry.datetime = new Date(entry.datetime);
    entry.metricValues = entry.metricValues.map(mv => {return {...mv, datetime: new Date(mv.datetime)}});
  })

  clonedProfile.reports = clonedProfile.reports.map(r => {
    return {
      ...r,
      metricValues: r.metricValues.map(mv => {return {...mv, datetime: new Date(mv.datetime)}})
    }
  });

  await db.put('profiles', clonedProfile);
}
