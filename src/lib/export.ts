// All export related functions
import type { Database } from './db';
import type { Profile } from './types';
import { archiveProfile } from './fs';
import saveAs from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';

export async function shareAsPDF(profile: Profile) {
  const fonts = {
    EtBook: {
      normal: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-roman-line-figures/et-book-roman-line-figures.ttf',
      italics: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-display-italic-old-style-figures/et-book-display-italic-old-style-figures.ttf',
      bold: 'https://cdn.jsdelivr.net/npm/typeface-et-book@0.0.2/et-book/et-book/et-book-bold-line-figures/et-book-bold-line-figures.ttf',
    },

    Roboto: {
      normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
      bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
      italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
      bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
    },
  };

  const description = prompt('Provide a description for the generated document');

  let items: any[] = [...profile.journals[0].entries];
  items.push(...profile.reports);
  items.push(...profile.documents);
  items.sort((a, b) => a.datetime < b.datetime);

  let dt = new Date();
  let docDefinition = {
    content: [
      { text: 'harp', color: 'gray', italics: true },
      { text: `Health Record for ${profile.name}`, fontSize: 20 },
      { text: `Generated at ${dt.toLocaleString()} via harp app`, fontSize: 12 },
      { text: description ? `\n${description}\n\n` : '\n\n', fontSize: 12 },
      ...items.map(it => {
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
          bodyLines.push({ text: it.name, fontSize: 20 });
          bodyLines.push({ text: `From ${it.source.id}`, italics: true });

          if (it.annotation.trim() !== '') {
            bodyLines.push({ text: `\n${it.annotation}` });
          }

          for (const asset of it.assets) {
            bodyLines.push('\n' + asset.fileName);
          }
        } else {
          // This is journal entry
          itemType = 'Journal Entry';
          if (it.metricValues.length > 0) {
            for (const mv of it.metricValues) {
              bodyLines.push({ text: `${mv.id} = ${mv.value} ${profile?.metadata.metrics.find(metric => metric.id === mv.id)?.unit || ''}`, bold: true });
            }
          }
          bodyLines.push('\n' + it.text);
        }
        let lines = [
          { text: '\n' + it.datetime.toLocaleString(), color: '#fff', background: '#666' },
          { text: itemType, color: '#333', bold: true },
          ...bodyLines,
        ];

        return lines;
      })
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
