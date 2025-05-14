<script lang="ts">
  import { parseMetricValues, parseTags } from '$lib/org';
  import DatetimeInput from '$lib/components/datetime-input.svelte';
  import type { Asset, JournalEntry, MetricValue } from '$lib/types';
  import { fly } from 'svelte/transition';
  import { v4 as uuidv4 } from 'uuid';
  import IconCamera from '@lucide/svelte/icons/camera';
  import IconVideo from '@lucide/svelte/icons/video';
  import IconPaperclip from '@lucide/svelte/icons/paperclip';
  import IconX from '@lucide/svelte/icons/x';

  interface FormProps {
    title?: string;
    onSave: (entry: JournalEntry) => void;
    onClose: () => void;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    entry?: JournalEntry | null;
  };

  let { onSave, onClose, title = 'New Entry', onAssetUpload, entry = null }: FormProps = $props();

  let uuid: string = $state(uuidv4());
  let text: string = $state('');
  let tags: string[] = $state([]);
  let metricValues: MetricValue[] = $state([]);
  let datetime: Date = $state(new Date());
  let assets: Asset[] = $state([]);

  if (entry !== null) {
    uuid = entry.uuid;
    text = entry.text;
    tags = entry.tags;
    metricValues = entry.metricValues;
    datetime = entry.datetime;
    assets = entry.assets;
  }

  function handleInput(e) {
    let text = e.target.value;
    tags = parseTags(text);
    metricValues = parseMetricValues(text, datetime, uuid);
  }

  function handleSave() {
    let editedEntry: JournalEntry = {
      datetime,
      uuid,
      tags,
      metricValues,
      text,
      assets,
      isPrivate: false
    }
    entry = editedEntry;
    onSave(entry);
  }

  async function handleFileUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async (event) => {
      document.body.removeChild(fileInput);
      const files = (event.target as HTMLInputElement).files;

      if (files && files.length > 0) {
        const selectedFile = files[0];
        const asset: Asset = {
          fileName: selectedFile.name,
          mimeType: selectedFile.type || undefined
        };
        const data: Blob = selectedFile;

        let textarea = document.getElementById('text');

        // Try to insert at cursor, or just at the end
        const insertAt = textarea.selectionEnd;
        const insertText = `[[attachment:${asset.fileName}][${asset.fileName}]]`
        if (insertAt) {
          text = text.substring(0, insertAt) + insertText + text.substring(insertAt);
        } else {
          text += insertText;
        }

        assets.push(asset);

        await onAssetUpload(asset, uuid, data);
      };
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  }
</script>

<div
  class="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center"
  transition:fly={{ y: -100, duration: 300 }}
  >
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
    <button class="absolute top-2 right-2 btn btn-sm" onclick={onClose}>
      <IconX />
    </button>

    <h2 class="h5 mb-5">{ title }</h2>

    <form onsubmit={handleSave}>
      <label class="label mb-4">
        <span class="label-text">Datetime</span>
        <DatetimeInput bind:datetime={ datetime } />
      </label>

      <label class="label mb-4">
        <span class="label-text">Content</span>
        <textarea class="textarea" required id="text" oninput={handleInput} bind:value={text} rows="4" placeholder=""></textarea>
      </label>

      <div class="flex gap-2 mb-4">
        <button disabled class="btn-sm preset-outlined rounded-md" title="Insert photo from camera"><IconCamera size={18} /></button>
        <button disabled class="btn-sm preset-outlined rounded-md" title="Insert video from camera"><IconVideo size={18} /></button>
        <button onclick={handleFileUpload} class="btn-sm preset-outlined rounded-md" title="Insert a file"><IconPaperclip size={18} /></button>
      </div>

      {#if tags.length + metricValues.length > 0  }
        <div class="mb-4">
          <div class="text-xs">Tags and Metrics</div>
          <div class="text-xs opacity-60 pt-2">
            {#each tags as tag}
              <span class="inline-block bg-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 mr-2">#{tag}</span>
            {/each}
            {#each metricValues as mv}
              <span class="inline-block bg-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 mr-2">{mv.id} = {mv.value}</span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="flex justify-end gap-2">
        <button type="submit" class="btn preset-filled">Save</button>
        <button type="button" class="btn preset-outlined" onclick={onClose}>Discard</button>
      </div>
    </form>
  </div>
</div>
