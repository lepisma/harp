import type { Profile } from './types';
import { parseTitle, parseOrgId, formatProfile } from './org';

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file content'));
      }
    }

    reader.onerror = () => {
      reject(reader.error);
    }

    reader.readAsText(file);
  });
}

export async function loadLog(profile: Profile): Promise<string> {
  return readFile(profile.file);
}

export async function loadProfile(file: File): Promise<Profile> {
  let content = await readFile(file);
  return {
    uuid: parseOrgId(content),
    name: parseTitle(content),
    file: file,
  };
}

/*
 * Create a tarball containing all logs and files from the profile.
 *
 * The structure has a main org file with assets present and referenced as
 * org-attachments in a ./data directory.
 */
export async function archiveProfile(profile: Profile): Promise<Blob> {
  let indexFile = formatProfile(profile);

  return new Blob([indexFile], { type: 'text/plain;charset=uft-8' });
}
