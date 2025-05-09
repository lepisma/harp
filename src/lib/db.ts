// Database interaction functions and utilities

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Profile, Asset } from './types';

interface HarpDB extends DBSchema {
  'profiles': {
    key: string;
    value: Profile;
  },
  'assets': {
    key: string;
    value: Blob;
  }
}

const DB_NAME = 'harp';
const DB_VERSION = 1;

export async function loadDB() {
  const db = await openDB<HarpDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('profiles', {
        keyPath: 'uuid'
      });

      db.createObjectStore('assets', {
        keyPath: 'id'
      });
    },
  });

  return db;
}

export async function loadAsset(db: IDBPDatabase<HarpDB>, parentId: string, asset: Asset): Promise<Blob | undefined> {
  let assetId = `${parentId}-${asset.fileName}`;
  return await db.get('assets', assetId);
}

export async function saveAsset(db: IDBPDatabase<HarpDB>, parentId: string, asset: Asset, data: Blob) {
  let assetId = `${parentId}-${asset.fileName}`;
  await db.put('assets', data, assetId);
}

export async function loadProfileList(db: IDBPDatabase<HarpDB>): Promise<string[][]> {
  let profiles = await db.getAll('profiles');
  return profiles.map(p => [p.uuid, p.name]);
}

export async function loadProfile(db: IDBPDatabase<HarpDB>, profileId: string): Promise<Profile> {
  let profile = await db.get('profiles', profileId);

  if (!profile) {
    throw Error(`Unable to read profile ${profileId}`);
  }

  return profile;
}

export async function saveProfile(db: IDBPDatabase<HarpDB>, profile: Profile) {
  await db.put('profiles', profile);
}
