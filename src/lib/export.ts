// All export related functions
import type { Database } from './db';
import type { Asset, Profile } from './types';
import { archiveProfile } from './fs';
import saveAs from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import { loadAsset } from './ops';
import pdfToImages from 'pdf-to-images-browser';


// Convert attached file in asset to images and return their base64 data urls
async function assetToImages(db: Database, parentId: string, asset: Asset): Promise<null | [string]> {
  let data = await loadAsset(db, parentId, asset) as File;
  if (data) {
    if (data.type.match('image.*')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve([reader.result]);
        }
        reader.readAsDataURL(data);
      });
    } else if (data.type.match('application/pdf')) {
      let images = await pdfToImages(data, { format: 'png', output: 'base64' });
      console.log(images);
      return images;
    } else {
      console.error(`Unknown mimetype for embedding in a pdf: ${data.type}`);
      return null;
    }
  } else {
    return null;
  }
}

export async function shareAsPDF(db: Database, profile: Profile) {
  const fonts = {
    EtBook: {
      normal: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-roman-line-figures/et-book-roman-line-figures.ttf',
      italics: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-display-italic-old-style-figures/et-book-display-italic-old-style-figures.ttf',
      bold: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-bold-line-figures/et-book-bold-line-figures.ttf',
    },

    FiraCode: {
      normal: 'https://cdn.jsdelivr.net/npm/firacode@6.2.0/distr/ttf/FiraCode-Regular.ttf',
      bold: 'https://cdn.jsdelivr.net/npm/firacode@6.2.0/distr/ttf/FiraCode-Bold.ttf',
    },
  };

  const description = prompt('Provide a description for the generated document');

  let items: any[] = [...profile.journals[0].entries];
  items.push(...profile.reports);
  items.push(...profile.documents);
  items.sort((a, b) => a.datetime < b.datetime);

  let dt = new Date();
  const A4Width = 595.28;

  let contentLines = await Promise.all(items.map(async (it) => {
    let bodyLines: any[] = [];
    let itemType: string;

    if (Object.hasOwn(it, 'annotation')) {
      // This is either report or document
      if (Object.hasOwn(it, 'metricValues')) {
        // This is report
        itemType = 'Report';
      } else {
        // This is document
        itemType = 'Document';
      }
      bodyLines.push({ text: `${itemType} from ${it.source.id}`, color: '#333', italics: true }),
        bodyLines.push({ text: it.name, fontSize: 18 });

      bodyLines.push('\nAttachments:');
      let lis = [];
      for (const asset of it.assets) {
        lis.push({ text: asset.fileName, font: 'FiraCode', fontSize: 10, decoration: 'underline' });
      }
      bodyLines.push({ ol: lis });

      if (it.annotation.trim() !== '') {
        bodyLines.push({ text: `\n${it.annotation}` });
      }

      // We embed documents that we can, here
      for (const asset of it.assets) {
        let images = await assetToImages(db, it.uuid, asset);
        if (images !== null) {
          for (const image of images) {
            bodyLines.push(['\n', { image: image, width: A4Width - 2 * 40 }])
          }
        }
      }
    } else {
      // This is journal entry
      itemType = 'Journal Entry';
      bodyLines.push({ text: itemType, color: '#333', italics: true });
      if (it.metricValues.length > 0) {
        for (const mv of it.metricValues) {
          bodyLines.push({ text: `${mv.id} = ${mv.value} ${profile?.metadata.metrics.find(metric => metric.id === mv.id)?.unit || ''}`, bold: true });
        }
      }
      bodyLines.push('\n' + it.text);
    }
    return [
      { text: '\n\n' + it.datetime.toLocaleString(), color: '#000', background: '#fff', font: 'FiraCode', fontSize: 10 },
      ...bodyLines,
      {
        canvas: [{
          type: 'line',
          x1: 0, y1: 20,
          x2: A4Width - 2 * 40, y2: 20,
          lineWidth: 1,
          lineColor: '#ccc',
        }]
      }
    ];
  }));

  let docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      { text: 'harp', color: 'gray', italics: true },
      { text: `Health Record for ${profile.name}`, fontSize: 20 },
      { text: `Generated at ${dt.toLocaleString()} via harp app`, fontSize: 12 },
      { text: description ? `\n${description}\n\n` : '\n\n', fontSize: 12 },
      ...contentLines
    ],
    defaultStyle: {
      font: 'EtBook'
    },
    info: {
      title: `Health Record for ${profile?.name}`,
      author: 'harp',
      creator: 'harp app'
    }
  };

  pdfMake.createPdf(docDefinition, null, fonts).open();
}

export async function exportProfile(db: Database, profile: Profile) {
  const blob = await archiveProfile(db, profile);
  saveAs(blob, `archive-${profile?.uuid}.${(new Date()).toISOString()}.harp.zip`);
}
