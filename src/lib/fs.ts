import type { Profile } from './types';
import { parseTitle, parseOrgId, formatProfile, orgAttachPath } from './org';
import JSZip from 'jszip';
import { loadAsset } from './ops';
import type { Database } from './db';

/*
 * Programmatically ask user to upload a file using a hidden input element and
 * return the object.
 */
export async function uploadFile(): Promise<File> {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';

  return new Promise((resolve, reject) => {
    fileInput.addEventListener('change', async (event) => {
      document.body.removeChild(fileInput);
      const files = (event.target as HTMLInputElement).files;

      if (files && files.length > 0) {
        resolve(files[0]);
      } else {
        console.error('Some error in file upload');
        reject();
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  });
}

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
 * Create an archive file containing all logs and files from the profile.
 *
 * The structure has a main org file with assets present and referenced as
 * org-attachments in a ./data directory.
 */
export async function archiveProfile(db: Database, profile: Profile): Promise<Blob> {
  let zip = new JSZip();

  // First insert the index file
  zip.file('index.org', formatProfile(profile));

  // Journals, reports, and documents could have assets attachment
  for (const journal of profile.journals) {
    for (const entry of journal.entries) {
      for (const asset of entry.assets) {
        let parentId = entry.uuid;
        zip.file(orgAttachPath(asset, parentId), loadAsset(db, parentId, asset));
      }
    }
  }

  for (const report of profile.reports) {
    for (const asset of report.assets) {
      let parentId = report.uuid;
      zip.file(orgAttachPath(asset, parentId), loadAsset(db, parentId, asset));
    }
  }

  for (const document of profile.documents) {
    for (const asset of document.assets) {
      let parentId = document.uuid;
      zip.file(orgAttachPath(asset, parentId), loadAsset(db, parentId, asset));
    }
  }

  let data = await zip.generateAsync({ type: 'uint8array' });
  return new Blob([data], { type: 'application/zip' });
}
