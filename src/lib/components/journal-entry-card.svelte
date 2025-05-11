<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import JournalForm from '$lib/components/journal-form.svelte';
  import type { Asset, JournalEntry } from '$lib/types';
  import { triggerOpen } from '$lib/utils';
  import { formatOrgToHTML } from '$lib/org';

  let { entry, onDelete, onEdit, onAssetUpload, readAsset } = $props();
  let content = $derived.by(async () => {
    return transformAttachmentLinks(await formatOrgToHTML(entry.text));
  });

  let isEditFormOpen = $state(false);

  async function handleContentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'A' && target.hasAttribute('data-filename')) {
      event.preventDefault();

      const fileName = target.getAttribute('data-filename');
      if (fileName) {
        let asset = entry.assets.find((a: Asset) => a.fileName === fileName);

        if (!asset) {
          alert(`Asset ${fileName} not found`);
        } else {
          let data = await readAsset(asset, entry.uuid);
          triggerOpen(data);
        }
      }
    }
  }

  function transformAttachmentLinks(htmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const anchorTags = doc.querySelectorAll('a');
    anchorTags.forEach(tag => {
      const href = tag.getAttribute('href');

      if (href && href.startsWith('attachment:')) {
        const fileName = href.substring('attachment:'.length);
        tag.setAttribute('href', '#');
        tag.setAttribute('data-filename', fileName);
        tag.classList.add('btn', 'btn-sm', 'preset-tonal');

        // Simplify the text inside link. This is needed since many files have
        // underscores etc. in name and they are getting transformed to
        // subscripts because of usual org thing.
        tag.innerHTML = fileName;
      }
    });

    return doc.body.innerHTML;
  }

  function handleSave(editedEntry: JournalEntry) {
    onEdit(editedEntry);
    isEditFormOpen = false;
  }
</script>

<div class:blurred={entry.isPrivate} class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 px-5">
        {entry.datetime.toLocaleString()}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(entry)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <p class="p-5" onclick={handleContentClick}>
      {#await content then value}
	{@html value}
      {/await}
    </p>
  </article>
  <footer class="flex items-center justify-between gap-4">
    <small class="opacity-60 pl-4">
      {#each entry.tags as tag}
        <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
      {/each}
    </small>
    <small class="text-gray-500 pr-2">
      {#if entry.metricValues.length > 0 }
        <span class="rounded-md bg-gray-100 px-2">Metrics</span>
      {/if}
      {#if entry.assets.length > 0 }
        <span class="rounded-md bg-gray-100 px-2">Assets</span>
      {/if}
    </small>
  </footer>
</div>

{#if isEditFormOpen}
  <JournalForm entry={ entry } title='Edit entry' onSave={handleSave} onAssetUpload={onAssetUpload} onClose={() => isEditFormOpen = false } />
{/if}
