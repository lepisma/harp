<script lang="ts">
  import type { Asset, Document } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import IconCheck from '@lucide/svelte/icons/check';
  import IconSquareMinus from '@lucide/svelte/icons/square-minus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

  interface Props {
    documents: Document[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    selectedUUIDs: string[];
    selectedTags?: string[];
  };

  let { documents = $bindable(), onChange, onAssetUpload, readAsset, selectedUUIDs = $bindable(), selectedTags = [] }: Props = $props();
  let isDocumentFormOpen = $state(false);

  documents.sort((a, b) => a.datetime < b.datetime);

  let filteredDocs = $derived.by(() => {
    if (selectedTags.length > 0) {
      return documents.filter(doc => doc.tags.some(tag => selectedTags.includes(tag)));
    } else {
      return documents;
    }
  });

  let selectedDocs = $derived.by(() => {
    if (selectedUUIDs.length > 0) {
      return documents.filter(doc => selectedUUIDs.includes(doc.uuid));
    } else {
      return [];
    }
  })

  let nHiddenSelection = $derived.by(() => {
    // Count selected entries that are NOT in the currently filtered set
    const filteredUUIDs = new Set(filteredDocs.map(doc => doc.uuid));
    return selectedUUIDs.filter(uuid => !filteredUUIDs.has(uuid)).length;
  });

  let allFilteredSelected = $derived.by(() =>
    filteredDocs.length > 0 && filteredDocs.every(doc => selectedUUIDs.includes(doc.uuid))
  );

  let someFilteredSelected = $derived.by(() =>
    selectedDocs.length > 0 && selectedDocs.some(doc => filteredDocs.map(d => d.uuid).includes(doc.uuid)) && !allFilteredSelected
  );

  async function handleNewDocument(doc: Document) {
    documents.push(doc);
    await onChange();

    isDocumentFormOpen = false;
  }

  async function handleDeleteDocument(doc: Document) {
    if (window.confirm('Do you really want to delete this document?')) {
      documents = documents.filter(d => d.uuid !== doc.uuid);
      await onChange();
    }
  }

  async function handleEditDocument(doc: Document) {
    documents = documents.map(d => (d.uuid === doc.uuid) ? doc : d);
    await onChange();
  }

  function handleSelectAll() {
    let filteredUUIDs = filteredDocs.map(doc => doc.uuid);
    const allFilteredAreSelected = filteredUUIDs.length > 0 && filteredUUIDs.every(uuid => selectedUUIDs.includes(uuid));

    if (allFilteredAreSelected) {
      selectedUUIDs = selectedUUIDs.filter(uuid => !filteredUUIDs.includes(uuid));
    } else {
      const newSelectedSet = new Set(selectedUUIDs);
      filteredUUIDs.forEach(uuid => newSelectedSet.add(uuid));
      selectedUUIDs = Array.from(newSelectedSet);
    }
  }

  function handleSelection(doc: Document, isSelected: boolean) {
    if (isSelected) {
      if (!selectedUUIDs.includes(doc.uuid)) {
	selectedUUIDs = [...selectedUUIDs, doc.uuid];
      }
    } else {
      selectedUUIDs = selectedUUIDs.filter(uuid => uuid !== doc.uuid);
    }
  }
</script>

<div class="mb-4">
  <button type="button" onclick={() => isDocumentFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Document</span>
    <IconPlus size={18} />
  </button>
</div>

<div class="text-sm text-gray-500 italic mb-5">
  {#if filteredDocs.length < documents.length}
    Showing { filteredDocs.length } of total { documents.length } {#if documents.length === 1}document{:else}documents{/if}
  {:else}
    Showing {#if documents.length === 1} the only document{:else}all { documents.length } documents{/if}
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
  <span>Selected { selectedDocs.length } {#if selectedDocs.length === 1} entry{:else} entries{/if} {#if nHiddenSelection > 0 } ({ nHiddenSelection } hidden) {/if}</span>
</div>

{#if isDocumentFormOpen}
  <DocumentForm
    onSave={ handleNewDocument }
    onClose={() => isDocumentFormOpen = false}
    title='New Document'
    onAssetUpload={ onAssetUpload }
    readAsset={ readAsset }
    />
{/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each filteredDocs as doc}
    <DocumentCard
      title='Document'
      entity={ doc }
      onDelete={ handleDeleteDocument }
      onEdit={ handleEditDocument }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      checked={ selectedUUIDs.includes(doc.uuid) }
      onSelectionChange={ (isSelected) => handleSelection(doc, isSelected) }
      />
  {/each}
</div>
