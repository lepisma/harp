<script lang="ts">
  import IconPlus from '@lucide/svelte/icons/plus';
  import type { JournalEntry, Journal, Asset } from '$lib/types';
  import JournalForm from '$lib/components/journal/form.svelte';
  import JournalEntryCard from '$lib/components/journal/entry-card.svelte';

  interface Props {
    journals: Journal[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    selectedTags?: string[];
  };

  let { journals = $bindable(), onChange, onAssetUpload, readAsset, selectedTags = [] }: Props = $props();
  let isJournalFormOpen = $state(false);

  let entries = $derived.by(() => {
    let output = [...journals[0].entries];
    output.sort((a, b) => a.datetime < b.datetime);
    return output;
  });

  let filteredEntries = $derived.by(() => {
    if (selectedTags.length > 0) {
      return entries.filter(entry => entry.tags.some(tag => selectedTags.includes(tag)));
    } else {
      return entries;
    }
  });

  async function handleNewJournalEntry(entry: JournalEntry) {
    // Entry could be empty. We ignore them here
    if (entry.text !== '') {
      journals[0].entries.push(entry);
      await onChange();
    }

    isJournalFormOpen = false;
  }

  async function handleDeleteJournalEntry(entry: JournalEntry) {
    if (window.confirm('Do you really want to delete this entry?')) {
      journals[0].entries = journals[0].entries.filter(e => e.uuid !== entry.uuid);
      await onChange();
    }
  }
  async function handleEditJournalEntry(entry: JournalEntry) {
    if (entry.text === '') {
      await handleDeleteJournalEntry(entry);
    } else {
      journals[0].entries = journals[0].entries.map(e => (e.uuid === entry.uuid) ? entry : e);
      await onChange();
    }
  }

</script>

<div class="mb-4">
  <button type="button" onclick={() => isJournalFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Entry</span>
    <IconPlus size={18} />
</div>

<div class="text-sm text-gray-500 italic">
  {#if filteredEntries.length < entries.length}
    Showing { filteredEntries.length } of total { entries.length } entries
  {:else}
    Showing all entries
  {/if}
</div>

{#if isJournalFormOpen}
  <JournalForm
    onSave={ handleNewJournalEntry }
    onClose={() => isJournalFormOpen = false}
    onAssetUpload={ onAssetUpload }
    />
{/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each filteredEntries as entry}
    <JournalEntryCard
      entry={ entry }
      onDelete={ handleDeleteJournalEntry }
      onEdit={ handleEditJournalEntry }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      />
  {/each}
</div>
