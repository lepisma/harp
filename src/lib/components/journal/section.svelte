<script lang="ts">
  import IconPlus from '@lucide/svelte/icons/plus';
  import type { JournalEntry, Journal, Asset } from '$lib/types';
  import JournalForm from '$lib/components/journal/form.svelte';
  import JournalEntryCard from '$lib/components/journal/entry-card.svelte';
  import SelectAllInput from '$lib/components/select-all-input.svelte';

  interface Props {
    journals: Journal[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    selectedUUIDs: string[];
    selectedTags?: string[];
  };

  let { journals = $bindable(), onChange, onAssetUpload, readAsset, selectedUUIDs = $bindable(), selectedTags = [] }: Props = $props();
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

  let selectedEntries = $derived.by(() => {
    if (selectedUUIDs.length > 0) {
      return entries.filter(entry => selectedUUIDs.includes(entry.uuid));
    } else {
      return [];
    }
  })

  let nHiddenSelection = $derived.by(() => {
    // Count selected entries that are NOT in the currently filtered set
    const filteredUUIDs = new Set(filteredEntries.map(entry => entry.uuid));
    return selectedUUIDs.filter(uuid => !filteredUUIDs.has(uuid)).length;
  });

  let allFilteredSelected = $derived.by(() =>
    filteredEntries.length > 0 && filteredEntries.every(entry => selectedUUIDs.includes(entry.uuid))
  );

  let someFilteredSelected = $derived.by(() =>
    selectedEntries.length > 0 && selectedEntries.some(entry => filteredEntries.map(fe => fe.uuid).includes(entry.uuid)) && !allFilteredSelected
  );

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

  function handleSelectAll() {
    let filteredUUIDs = filteredEntries.map(entry => entry.uuid);
    const allFilteredAreSelected = filteredUUIDs.length > 0 && filteredUUIDs.every(uuid => selectedUUIDs.includes(uuid));

    if (allFilteredAreSelected) {
      selectedUUIDs = selectedUUIDs.filter(uuid => !filteredUUIDs.includes(uuid));
    } else {
      const newSelectedSet = new Set(selectedUUIDs);
      filteredUUIDs.forEach(uuid => newSelectedSet.add(uuid));
      selectedUUIDs = Array.from(newSelectedSet);
    }
  }

  function handleSelection(entry: JournalEntry, isSelected: boolean) {
    if (isSelected) {
      if (!selectedUUIDs.includes(entry.uuid)) {
	selectedUUIDs = [...selectedUUIDs, entry.uuid];
      }
    } else {
      selectedUUIDs = selectedUUIDs.filter(uuid => uuid !== entry.uuid);
    }
  }
</script>

<div class="mb-4">
  <button type="button" onclick={() => isJournalFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Entry</span>
    <IconPlus size={18} />
</div>

<div class="text-sm text-gray-500 italic mb-5">
  {#if filteredEntries.length < entries.length}
    Showing { filteredEntries.length } of total { entries.length } {#if entries.length === 1}entry{:else}entries{/if}
  {:else}
    Showing {#if entries.length === 1} the only entry{:else}all { entries.length } entries{/if}
  {/if}
</div>

<div class="mb-5">
  <SelectAllInput
    allFilteredSelected={ allFilteredSelected }
    someFilteredSelected={ someFilteredSelected }
    nSelection={ selectedEntries.length }
    nHiddenSelection={ nHiddenSelection }
    entityName="entry"
    entityNamePlural="entries"
    handleSelectAll={ handleSelectAll }
    />
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
      checked={ selectedUUIDs.includes(entry.uuid) }
      onSelectionChange={ (isSelected) => handleSelection(entry, isSelected) }
      />
  {/each}
</div>
