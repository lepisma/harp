<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import JournalForm from '$lib/components/journal-form.svelte';
  import type { JournalEntry } from '$lib/types';

  let { entry, onDelete, onEdit } = $props();

  let isEditFormOpen = $state(false);

  function handleSave(editedEntry: JournalEntry) {
    onEdit(editedEntry);
    isEditFormOpen = false;
  }
</script>

<div class:blurred={entry.isPrivate} class="bg-white rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 my-2 p-1 px-5">
        {entry.datetime}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(entry)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <p class="p-5">
      {entry.text}
    </p>
  </article>
  <footer class="flex items-center justify-between gap-4">
    <small class="opacity-60 pl-4">
      {#each entry.tags as tag}
        <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
      {/each}
    </small>
    <small class="text-gray-500 pr-2">
      {#if entry.metrics.length > 0 }
        <span class="rounded-md bg-gray-100 px-2">Metrics</span>
      {/if}
      {#if entry.assets.length > 0 }
        <span class="rounded-md bg-gray-100 px-2">Assets</span>
      {/if}
    </small>
  </footer>
</div>

{#if isEditFormOpen}
  <JournalForm entry={ entry } title='Edit entry' onSave={handleSave} onClose={() => isEditFormOpen = false } />
{/if}
