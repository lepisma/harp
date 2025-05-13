<script lang="ts">
  import type { Database } from '$lib/db';
  import type { Asset, Document, Profile } from '$lib/types';
  import { saveProfile } from '$lib/ops';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

  interface Props {
    db: Database;
    profile: Profile;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
  };

  let { db, profile, onAssetUpload, readAsset }: Props = $props();

  let documents: Document[] = $derived(profile !== null ? profile.documents : []);
  let isDocumentFormOpen = $state(false);

  async function handleNewDocument(doc: Document) {
    profile.documents.push(doc);
    await saveProfile(db, profile);

    isDocumentFormOpen = false;
  }

  async function handleDeleteDocument(doc: Document) {
    if (window.confirm('Do you really want to delete this document?')) {
      profile.documents = profile.documents.filter(d => d.uuid !== doc.uuid);
      await saveProfile(db, profile);
    }
  }

  async function handleEditDocument(doc: Document) {
    profile.documents = profile.documents.map(d => (d.uuid === doc.uuid) ? doc : d);
    await saveProfile(db, profile);
  }
</script>

<div class="mb-4">
  <button type="button" onclick={() => isDocumentFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Document</span>
    <IconPlus size={18} />
  </button>
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
  {#each documents as doc}
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
