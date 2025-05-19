<script lang="ts">
  import IconPlus from '@lucide/svelte/icons/plus';
  import IconCheck from '@lucide/svelte/icons/check';
  import IconSquareMinus from '@lucide/svelte/icons/square-minus';
  import type { JournalEntry, Journal, Asset } from '$lib/types';
  import JournalForm from '$lib/components/journal/form.svelte';
  import JournalEntryCard from '$lib/components/journal/entry-card.svelte';

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
      // If all filtered are selected, unselect *only* those currently filtered entries.
      // Keep any selected entries that are currently hidden by the filter.
      selectedUUIDs = selectedUUIDs.filter(uuid => !filteredUUIDs.includes(uuid));
    } else {
      // If not all filtered are selected (or none are), select all filtered entries.
      // Combine the current selectedUUIDs with the filteredUUIDs, ensuring uniqueness,
      // and importantly, reassign the variable.
      const newSelectedSet = new Set(selectedUUIDs); // Start with currently selected (might include hidden)
      filteredUUIDs.forEach(uuid => newSelectedSet.add(uuid)); // Add all filtered UUIDs
      selectedUUIDs = Array.from(newSelectedSet); // Convert back to array and REASSIGN
    }
  }

  function handleSelection(entry: JournalEntry, isSelected: boolean) {
    if (isSelected) {
      // Add the UUID to the selectedUUIDs array, using reassignment
      if (!selectedUUIDs.includes(entry.uuid)) { // Prevent duplicates just in case
	selectedUUIDs = [...selectedUUIDs, entry.uuid];
      }
    } else {
      // Remove the UUID from the selectedUUIDs array, using filter (which creates a new array)
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

<div class="text-sm mb-5 flex gap-2">
  <label class="relative flex items-center cursor-pointer select-none">
    <input
      type="checkbox"
      onchange={ handleSelectAll }
      checked={ allFilteredSelected }
      indeterminate={ someFilteredSelected }
      class="sr-only peer"
      />
    <span class="rounded-md border-2 w-5 h-5 flex items-center justify-center
		 border-gray-300 dark:border-gray-600
		 text-transparent peer-checked:text-white dark:text-transparent dark:peer-checked:text-white
		 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600
		 peer-checked:border-blue-500 dark:peer-checked:border-blue-600
		 peer-indeterminate:bg-blue-500 dark:peer-indeterminate:bg-blue-600
		 peer-indeterminate:border-blue-500 dark:peer-indeterminate:border-blue-600
		 peer-indeterminate:text-white dark:peer-indeterminate:text-white
		 transition-colors duration-150 ease-in-out">
      {#if allFilteredSelected}
	<IconCheck size={18} />
      {:else if someFilteredSelected}
	<IconSquareMinus size={18} />
      {:else}
	<IconCheck size={18} class="text-transparent" />
      {/if}
    </label>
  <span>Selected { selectedEntries.length } {#if selectedEntries.length === 1} entry{:else} entries{/if} {#if nHiddenSelection > 0 } ({ nHiddenSelection } hidden) {/if}</span>
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
