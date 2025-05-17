<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import IconCheck from '@lucide/svelte/icons/check';
  import JournalForm from '$lib/components/journal/form.svelte';
  import type { Asset, JournalEntry } from '$lib/types';
  import { triggerOpen, transformAttachmentLinks, formatDatetime } from '$lib/utils';
  import { formatOrgToHTML } from '$lib/org';

  interface CardProps {
    entry: JournalEntry;
    onDelete: (entry: JournalEntry) => void;
    onEdit: (entry: JournalEntry) => void;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
  }

  let { entry, onDelete, onEdit, onAssetUpload, readAsset }: CardProps = $props();
  let content = $derived.by(async () => {
    return transformAttachmentLinks(await formatOrgToHTML(entry.text));
  });
  let isSelected = $state(false);

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

  function handleSave(editedEntry: JournalEntry) {
    onEdit(editedEntry);
    isEditFormOpen = false;
  }
</script>

<div class="rounded-md shadow-md py-5 transition-all duration-150 ease-in-out"
     class:border-blue-500={isSelected}
     class:ring-2={isSelected}
     class:ring-blue-300={isSelected}
     class:shadow-lg={isSelected}
     class:bg-gray-50={isSelected}
     class:dark:bg-gray-800={isSelected}
     >
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <div class="flex bg-gray-100 dark:bg-gray-800 pl-2">
        <label class="relative flex items-center cursor-pointer select-none">
          <input type="checkbox" bind:checked={ isSelected } class="sr-only peer" />
          <span class="rounded-md border-2
                       border-gray-300 dark:border-gray-600
                       text-gray-300 peer-checked:text-white dark:text-gray-600 dark:peer-checked:text-white
                       peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600
                       peer-checked:border-blue-500 dark:peer-checked:border-blue-600
                       transition-colors duration-150 ease-in-out">
            <IconCheck size={20} />
          </span>
        </label>
        <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 pl-2 pr-5">
          { formatDatetime(entry.datetime) }
        </span>
      </div>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(entry)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
  </header>
    <p class="p-5" onclick={ handleContentClick }>
      {#await content then value}
	{@html value}
      {/await}
    </p>
  </article>
  <footer class="flex items-center justify-between gap-4">
    <small class="opacity-60 pl-4">
      {#each entry.tags as tag}
        <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{ tag }</span>
      {/each}
      {#each entry.metricValues as mv}
        <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">{ mv.id } = { mv.value }</span>
      {/each}
    </small>
  </footer>
</div>

{#if isEditFormOpen}
  <JournalForm entry={ entry } title='Edit Entry' onSave={ handleSave } onAssetUpload={ onAssetUpload } onClose={() => isEditFormOpen = false } />
{/if}
