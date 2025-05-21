import type { Asset, Profile } from './types';
import { formatProfile, parseProfile, orgAttachPath } from './org';
import JSZip from 'jszip';
import { loadAsset } from './ops';
import type { Database } from './db';

/*
 * Programmatically ask user to upload a file using a hidden input element and
 * return the object.
 */
export async function uploadFile(acceptString?: string): Promise<File> {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';

  if (acceptString) {
    fileInput.accept = acceptString;
  }

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

export async function loadArchive(zipFile: File): Promise<Profile | null> {
  const files = (await JSZip.loadAsync(zipFile)).files;
  const indexFile = files['index.org'];

  if (!indexFile) {
    console.error('Unable to find index.org file');
    return null;
  }

  const orgContent = await indexFile.async('text')
  return await parseProfile(orgContent);
}

export async function loadAssetDataFromZip(zipFile: File, parentId: string, asset: Asset): Promise<Blob | null> {
  const files = (await JSZip.loadAsync(zipFile)).files;
  const filePath = `data/${parentId.substring(0, 2)}/${parentId.substring(2)}/${asset.fileName}`;

  const dataFile = files[filePath];
  if (!dataFile) {
    console.error(`Unable to load file ${filePath} from zip`);
    return null;
  } else {
    return await dataFile.async('blob');
  }
}

export function parseMimeType(fileName: string): string | null {
  const parts = fileName.split('.');
  if (parts.length < 2) {
    return null;
  }

  const extension = parts[parts.length - 1].toLowerCase();

  switch (extension) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'webp':
      return 'image/webp';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    case 'svg':
      return 'image/svg+xml';

    case 'pdf':
      return 'application/pdf';

    default:
      return null;
  }
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
