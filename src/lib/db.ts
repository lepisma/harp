// Database interaction functions and utilities

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Profile } from './types';

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

export type Database = IDBPDatabase<HarpDB>;

export async function loadDB(): Promise<Database> {
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
