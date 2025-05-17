<script lang="ts">
  import type { Asset, Document } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

  interface Props {
    documents: Document[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    selectedTags?: string[];
  };

  let { documents = $bindable(), onChange, onAssetUpload, readAsset, selectedTags = [] }: Props = $props();
  let isDocumentFormOpen = $state(false);

  let filteredDocuments = $derived.by(() => {
    if (selectedTags.length > 0) {
      return documents.filter(doc => doc.tags.some(tag => selectedTags.includes(tag)));
    } else {
      return documents;
    }
  });

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
</script>

<div class="mb-4">
  <button type="button" onclick={() => isDocumentFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Document</span>
    <IconPlus size={18} />
  </button>
</div>

<div class="text-sm text-gray-500 italic mb-5">
  {#if filteredDocuments.length < documents.length}
    Showing { filteredDocuments.length } of total { documents.length } {#if documents.length === 1}document{:else}documents{/if}
  {:else}
    Showing {#if documents.length === 1} the only document{:else}all { documents.length } documents{/if}
  {/if}
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
  {#each filteredDocuments as doc}
    <DocumentCard
      title='Document'
      entity={ doc }
      onDelete={ handleDeleteDocument }
      onEdit={ handleEditDocument }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      />
  {/each}
</div>
