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
  return readFile(profile.logFile);
}

// Return a list of profiles present in given root directory's file list
export async function loadProfiles(dirFiles: FileList): Promise<Profile[]> {
  if (dirFiles.length > 0) {
    let profiles: Profile[] = [];

    for (const file of dirFiles) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      const fileName = parts.pop();

      // Only direct directories with and index.org in then are harp profiles
      if (fileName === 'index.org' && parts.length === 2) {
        const directoryPath = parts.join('/');

        let content = await readFile(file);

        let profile = {
          uuid: parseOrgId(content),
          name: parseTitle(content),
          dir: directoryPath,
          logFile: file,
        };
        profiles.push(profile);
      }
    }
    return profiles;
  } else {
    return [];
  }
}
