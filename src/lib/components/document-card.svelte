<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import DocumentForm from '$lib/components/document-form.svelte';
  import type { Asset, Document } from '$lib/types';
  import { triggerOpen, transformAttachmentLinks } from '$lib/utils';
  import { formatOrgToHTML } from '$lib/org';

  let { doc, onDelete, onEdit, onAssetUpload, readAsset } = $props();
  let content = $derived.by(async () => {
    return transformAttachmentLinks(await formatOrgToHTML(doc.annotation));
  });

  let isEditFormOpen = $state(false);

  async function handleContentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'A' && target.hasAttribute('data-filename')) {
      event.preventDefault();

      const fileName = target.getAttribute('data-filename');
      if (fileName) {
        let asset = doc.assets.find((a: Asset) => a.fileName === fileName);

        if (!asset) {
          alert(`Asset ${fileName} not found`);
        } else {
          let data = await readAsset(asset, report.uuid);
          triggerOpen(data);
        }
      }
    }
  }

  function handleSave(editedDoc: Document) {
    onEdit(editedDoc);
    isEditFormOpen = false;
  }
</script>

<div class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 px-5">
        {doc.datetime.toLocaleString()}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(doc)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <div class="p-5">
      <h3 class="h3 mb-3 flex items-center gap-2">
        <span class="font-normal">{doc.name}</span>
      </h3>
      <p class="p-5" onclick={handleContentClick}>
        {#await content then value}
	  {@html value}
        {/await}
      </p>
      <div class="flex items-center justify-between gap-4 mt-3">
        <small class="opacity-60">
          {#each doc.tags as tag}
            <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
          {/each}
        </small>
      </div>
    </div>
  </article>
</div>

{#if isEditFormOpen}
  <DocumentForm doc={ doc } title='Edit Document' onSave={handleSave} onAssetUpload={onAssetUpload} onClose={() => isEditFormOpen = false } />
{/if}
