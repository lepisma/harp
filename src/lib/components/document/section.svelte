<script lang="ts">
  import type { Asset, Document } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';
  import SelectAllInput from '$lib/components/select-all-input.svelte';

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

<div class="mb-5">
  <SelectAllInput
    allFilteredSelected={ allFilteredSelected }
    someFilteredSelected={ someFilteredSelected }
    nSelection={ selectedDocs.length }
    nHiddenSelection={ nHiddenSelection }
    entityName="document"
    entityNamePlural="documents"
    handleSelectAll={ handleSelectAll }
    />
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
