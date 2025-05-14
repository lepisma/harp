// Database interaction functions and utilities

import { openDB, type IDBPDatabase, type DBSchema, deleteDB } from 'idb';
import type { Profile } from './types';

interface HarpDB extends DBSchema {
  'profiles': {
    key: string;
    value: Profile;
  },
  'assets': {
    key: string;
    value: {
      id: string;
      data: Blob;
    };
  }
}

const DB_NAME = 'harp';
const DB_VERSION = 2;

export type Database = IDBPDatabase<HarpDB>;

export async function loadDB(): Promise<Database> {
  // We also ask for persistent storage permission here since that's essential
  // for keeping the storage reliable.
  if (!await navigator.storage.persisted()) {
    await navigator.storage.persist();
  }

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

export async function eraseDB() {
  await deleteDB(DB_NAME);
}
