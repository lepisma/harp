<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import IconPaperclip from '@lucide/svelte/icons/paperclip';
  import DocumentForm from '$lib/components/document-form.svelte';
  import type { Asset, Report, Document } from '$lib/types';
  import { triggerOpen } from '$lib/utils';
  import { formatOrgToHTML } from '$lib/org';

  type Entity = Report | Document;

  interface CardProps {
    title: String,
    entity: Entity;
    onDelete: (entity: Entity) => void;
    onEdit: (entity: Entity) => void;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    enableMetricValues?: boolean;
  };

  let { title, entity, onDelete, onEdit, onAssetUpload, readAsset, enableMetricValues = false }: CardProps = $props();
  let content = $derived.by(async () => {
    if (entity.annotation) {
      return await formatOrgToHTML(entity.annotation);
    } else {
      return undefined;
    }
  });

  let isEditFormOpen = $state(false);

  async function handleAssetClick(asset: Asset) {
    let data = await readAsset(asset, entity.uuid);
    triggerOpen(data);
  }

  function handleSave(editedEntity: Entity) {
    onEdit(editedEntity);
    isEditFormOpen = false;
  }
</script>

<div class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 px-5">
        {entity.datetime.toLocaleString()}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(entity)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <div class="p-5">
      <h4 class="h4 flex items-center gap-2">
        <span class="font-normal">{entity.name}</span>
      </h4>
      <div class="text-sm mb-3">From <i>{entity.source.id}</i></div>
      <div>
        <div class="text-sm text-gray-600 flex items-center gap-2 mb-2"><IconPaperclip size={14}/> Attachments</div>
        <ol class="text-sm list-inside list-decimal space-y-2">
          {#each entity.assets as asset }
            <li><a class="anchor" href="#" onclick={() => handleAssetClick(asset)}>{asset.fileName}</a></li>
          {/each}
        </ol>
      </div>
      {#await content then value}
        {#if value}
          <p class="py-5">
	    {@html value}
          </p>
        {/if}
      {/await}
      {#if entity.tags.length + (enableMetricValues ? entity.metricValues.length : 0)  > 0}
        <div class="flex items-center justify-between gap-4 mt-3">
          <small class="opacity-60">
            {#each entity.tags as tag}
              <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
            {/each}
            {#if enableMetricValues }
              {#each entity.metricValues as mv}
                <span class="inline-block bg-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 mr-2">{mv.id} = {mv.value}</span>
              {/each}
            {/if}
          </small>
        </div>
      {/if}
    </div>
  </article>
</div>

{#if isEditFormOpen}
  <DocumentForm
    entity={ entity }
    title={`Edit ${title}`}
    onSave={ handleSave }
    onAssetUpload={ onAssetUpload }
    readAsset={ readAsset }
    onClose={() => isEditFormOpen = false }
    enableMetricValues={ enableMetricValues }
    />
{/if}
