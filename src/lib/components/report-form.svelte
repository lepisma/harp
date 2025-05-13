<script lang="ts">
  import { parseMetricValues, parseTags } from '$lib/org';
  import type { Asset, Source, Report, MetricValue } from '$lib/types';
  import { triggerOpen } from '$lib/utils';
  import { fly } from 'svelte/transition';
  import { v4 as uuidv4 } from 'uuid';
  import IconCamera from '@lucide/svelte/icons/camera';
  import IconVideo from '@lucide/svelte/icons/video';
  import IconPaperclip from '@lucide/svelte/icons/paperclip';
  import IconTrash from '@lucide/svelte/icons/square-x';

  let { onSave, onClose, title = 'New Report', onAssetUpload, readAsset, report = null } = $props();

  let name = $state('');
  let datetime = $state(formatDateForInput(new Date()));
  let uuid = $state(uuidv4());
  let tags: string[] = $state([]);
  let sourceName = $state('');
  let assets: Asset[] = $state([]);
  let metricValues: MetricValue[] = $state([]);
  let annotation = $state('');
  let files = $state();

  if (report !== null) {
    name = report.name;
    datetime = formatDateForInput(report.datetime);
    uuid = report.uuid;
    tags = report.tags;
    sourceName = report.source.id;
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

  async function handleSave() {
    let newAssets = [];

    if (files) {
      for (const file of files) {
        const asset: Asset = {
          fileName: file.name,
          mimeType: file.type || undefined,
        };
        const data: Blob = file;
        await onAssetUpload(asset, uuid, data);

        newAssets.push(asset);
      }
    }

    let editedReport: Report = {
      name,
      datetime: new Date(datetime),
      uuid,
      tags,
      source: { id: sourceName, description: '' },
      assets: [...assets, ...newAssets],
      metricValues,
      annotation
    }
    report = editedReport;
    onSave(report);
  }

  async function handleAssetClick(asset) {
    let data = await readAsset(asset, report.uuid);
    triggerOpen(data);
  }

  async function handleAssetDelete(asset) {
    assets = assets.filter(a => a.fileName !== asset.fileName);
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

    <label class="label mb-4">
      <span class="label-text">Source</span>
      <input type="text" id="name" class="input text-sm" bind:value={sourceName} />
    </label>

    {#if assets.length > 0}
      <label class="label mb-4">
        <span class="label-text">Current attachments</span>
        <ul class="text-sm list-inside space-y-2">
          {#each assets as asset, i }
            <li class="flex items-start gap-2">
              <span class="flex-shrink-0">{i + 1}.</span>
              <div class="flex items-center flex-grow">
                <span class="px-2 rounded-md preset-tonal">
                  <a class="anchor" href="#" onclick={() => handleAssetClick(asset)}>{asset.fileName}</a>
                </span>
                <button onclick={() => handleAssetDelete(asset)} class="btn-sm rounded-md" title="Delete attachment">
                  <IconTrash size={18} />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </label>
    {/if}

   <label for="many-files" class="text-sm mb-4">
     <span class="label-text">Add files to Upload</span>
     <input id="many-files" bind:files multiple type="file" />
    </label>

    <label class="label mb-4 mt-5">
      <span class="label-text">Annotation</span>
      <textarea class="textarea" id="annotation" oninput={handleInput} bind:value={annotation} rows="2" placeholder=""></textarea>
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
