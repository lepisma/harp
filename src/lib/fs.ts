import type { Profile } from './types';
import { parseTitle, parseOrgId } from './org';


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
