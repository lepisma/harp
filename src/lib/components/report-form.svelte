<script lang="ts">
  import { parseMetricValues, parseTags } from '$lib/org';
  import type { Asset, Source, Report, MetricValue } from '$lib/types';
  import { fly } from 'svelte/transition';
  import { v4 as uuidv4 } from 'uuid';
  import IconCamera from '@lucide/svelte/icons/camera';
  import IconVideo from '@lucide/svelte/icons/video';
  import IconPaperclip from '@lucide/svelte/icons/paperclip';

  let { onSave, onClose, title = 'New Report', onAssetUpload, report = null } = $props();

  let name = $state('');
  let datetime = $state(formatDateForInput(new Date()));
  let uuid = $state(uuidv4());
  let tags: string[] = $state([]);
  let source = $state(null);
  let assets: Asset[] = $state([]);
  let metricValues: MetricValue[] = $state([]);
  let annotation = $state('');

  if (report !== null) {
    name = report.name;
    datetime = formatDateForInput(report.datetime);
    uuid = report.uuid;
    tags = report.tags;
    source = report.source;
    assets = report.assets;
    metricValues = report.metricValues;
    annotation = report.annotation;
  }

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleInput(e) {
    let text = e.target.value;
    tags = parseTags(text);
    metricValues = parseMetricValues(text, new Date(datetime), uuid);
  }

  function handleSave() {
    let editedReport: Report = {
      name,
      datetime: new Date(datetime),
      uuid,
      tags,
      source,
      assets,
      metricValues,
      annotation
    }
    report = editedReport;
    onSave(report);
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

        let textarea = document.getElementById('annotation');

        // Try to insert at cursor, or just at the end
        const insertAt = textarea.selectionEnd;
        const insertText = `[[attachment:${asset.fileName}][${asset.fileName}]]`
        if (insertAt) {
          annotation = annotation.substring(0, insertAt) + insertText + annotation.substring(insertAt);
        } else {
          annotation += insertText;
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
        <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <h2 class="h5 mb-5">{ title }</h2>

    <label class="label mb-4">
      <span class="label-text">Datetime</span>
      <input type="datetime-local" id="datetime" class="input text-sm" bind:value={datetime} />
    </label>

    <label class="label mb-4">
      <span class="label-text">Title</span>
      <input type="text" id="name" class="input text-sm" bind:value={name} />
    </label>

    <div class="flex gap-2 mb-4">
      <button disabled class="btn-sm preset-outlined rounded-md" title="Insert photo from camera"><IconCamera size={18} /></button>
      <button disabled class="btn-sm preset-outlined rounded-md" title="Insert video from camera"><IconVideo size={18} /></button>
      <button onclick={handleFileUpload} class="btn-sm preset-outlined rounded-md" title="Insert a file"><IconPaperclip size={18} /></button>
    </div>

    <label class="label mb-4">
      <span class="label-text">Annotation</span>
      <textarea class="textarea" id="annotation" oninput={handleInput} bind:value={annotation} rows="4" placeholder=""></textarea>
    </label>

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
      <button type="button" class="btn preset-filled" onclick={handleSave}>Save</button>
      <button type="button" class="btn preset-outlined" onclick={onClose}>Discard</button>
    </div>
  </div>
</div>
