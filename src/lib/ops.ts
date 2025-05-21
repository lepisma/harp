// Core operations

import type { Database } from './db';
import type { Profile, Asset, ProfileSummary } from './types';
import { v4 as uuidv4 } from 'uuid';
import { profileMetricValues, profileParentAssetPairs } from './utils';

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
    documents: []
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
      documents: profile.documents.length,
      metricValues: profileMetricValues(profile).length,
    }
  };
}

export async function createNewProfile(db: Database, profileName: string): Promise<Profile> {
  let profile = newProfile(profileName);
  await saveProfile(db, profile);
  return profile;
}

/*
 * Find all assets linked in the profile and delete them
 */
async function deleteProfileAssets(db: Database, profile: Profile) {
  const assetPairs = profileParentAssetPairs(profile);

  for (const [parentId, asset] of assetPairs) {
    await deleteAsset(db, parentId, asset);
  }
}

export async function deleteProfile(db: Database, profileId: string) {
  const profile = await loadProfile(db, profileId);
  if (profile) {
    await deleteProfileAssets(db, profile);
    await db.delete('profiles', profileId);
  }
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

export async function isAssetInDB(db: Database, parentId: string, asset: Asset): Promise<boolean> {
  const assetId = `${parentId}-${asset.fileName}`;
  const result = await db.get('assets', assetId);
  return !!result;
}

export async function saveAsset(db: Database, parentId: string, asset: Asset, data: Blob) {
  let assetId = `${parentId}-${asset.fileName}`;
  await db.put('assets', { id: assetId, data });
}

export async function deleteAsset(db: Database, parentId: string, asset: Asset) {
  let assetId = `${parentId}-${asset.fileName}`;
  await db.delete('assets', assetId);
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
      datetime: new Date(r.datetime),
      metricValues: r.metricValues.map(mv => {return {...mv, datetime: new Date(mv.datetime)}})
    }
  });

  clonedProfile.documents = clonedProfile.documents.map(d => {
    return {
      ...d,
      datetime: new Date(d.datetime)
    }
  });

  await db.put('profiles', clonedProfile);
}
