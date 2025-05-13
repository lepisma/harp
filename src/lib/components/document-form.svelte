<script lang="ts">
  import { parseMetricValues, parseTags } from '$lib/org';
  import type { Asset, Report, Document, MetricValue } from '$lib/types';
  import { triggerOpen } from '$lib/utils';
  import { fly } from 'svelte/transition';
  import { v4 as uuidv4 } from 'uuid';
  import IconTrash from '@lucide/svelte/icons/square-x';
  import IconX from '@lucide/svelte/icons/x';

  type Entity = Report | Document;

  interface FormProps {
    onSave: (entity: Entity) => void;
    onClose: () => void;
    title: string;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    entity?: Entity | null;
    enableMetricValues?: boolean;
  }

  let { onSave, onClose, title, onAssetUpload, readAsset, entity = null, enableMetricValues = false }: FormProps = $props();

  let name: string = $state('');
  let datetimeString: string = $state(formatDateForInput(new Date()));
  let uuid: string = $state(uuidv4());
  let tags: string[] = $state([]);
  let sourceName: string = $state('');
  let assets: Asset[] = $state([]);
  let metricValues: MetricValue[] = $state([]);
  let annotation: string | undefined = $state();
  let files: FileList | undefined = $state();

  if (entity !== null) {
    name = entity.name;
    datetimeString = formatDateForInput(entity.datetime);
    uuid = entity.uuid;
    tags = entity.tags;
    sourceName = entity.source.id;
    assets = entity.assets;

    // Documents don't have metric values
    if (enableMetricValues) {
      metricValues = entity.metricValues;
    }
    annotation = entity.annotation;
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
    if (enableMetricValues) {
      metricValues = parseMetricValues(text, new Date(datetimeString), uuid);
    }
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

    let editedEntity: Entity = {
      name,
      datetime: new Date(datetimeString),
      uuid,
      tags,
      // For now we just use the source name to completely define the source
      source: { id: sourceName, description: '' },
      assets: [...assets, ...newAssets],
      annotation
    }

    if (enableMetricValues) {
      editedEntity['metricValues'] = metricValues;
    }

    entity = editedEntity;
    onSave(entity);
  }

  async function handleAssetClick(asset: Asset) {
    let data = await readAsset(asset, entity.uuid);
    triggerOpen(data);
  }

  async function handleAssetDelete(asset: Asset) {
    assets = assets.filter(a => a.fileName !== asset.fileName);
  }
</script>

<div class="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center" transition:fly={{ y: -100, duration: 300 }}>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
    <button class="absolute top-2 right-2 btn btn-sm" onclick={onClose}>
      <IconX />
    </button>

    <h2 class="h5 mb-5">{ title }</h2>

    <form onsubmit={handleSave}>
      <label class="label mb-4">
        <span class="label-text">Datetime</span>
        <input type="datetime-local" required id="datetime" class="input text-sm" bind:value={datetimeString} />
      </label>

      <label class="label mb-4">
        <span class="label-text">Title</span>
        <input type="text" id="name" required class="input text-sm" bind:value={name} />
      </label>

      <label class="label mb-4">
        <span class="label-text">Source</span>
        <input type="text" id="name" required class="input text-sm" bind:value={sourceName} />
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
        {#if assets.length === 0}
          <!-- We want to force the user to upload a file when no file is attached till now -->
          <input id="many-files" required bind:files multiple type="file" />
        {:else}
          <input id="many-files" bind:files multiple type="file" />
        {/if}
      </label>

      <label class="label mb-4 mt-5">
        <span class="label-text">Annotation</span>
        <textarea class="textarea" id="annotation" oninput={handleInput} bind:value={annotation} rows="2" placeholder=""></textarea>
      </label>

      {#if tags.length + metricValues.length > 0  }
        <div class="mb-4">
          <div class="text-xs">{#if enableMetricValues }Tags and Metrics{:else}Tags{/if}</div>
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
