<script lang="ts">
  import { saveProfile } from '$lib/ops';
  import IconPlus from '@lucide/svelte/icons/plus';
  import type { JournalEntry, Journal, Profile, Asset } from '$lib/types';
  import JournalForm from '$lib/components/journal-form.svelte';
  import JournalEntryCard from '$lib/components/journal-entry-card.svelte';
  import type { Database } from '$lib/db';

  interface Props {
    db: Database;
    profile: Profile;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
  };

  let { db, profile, onAssetUpload, readAsset }: Props = $props();

  let journal: Journal[] = $derived(profile !== null ? profile.journals[0] : []);

  let isJournalFormOpen = $state(false);

  async function handleNewJournalEntry(entry: JournalEntry) {
    // Entry could be empty. We ignore them here
    if (entry.text !== '') {
      profile.journals[0].entries.push(entry);
      await saveProfile(db, profile);
    }

    isJournalFormOpen = false;
  }

  async function handleDeleteJournalEntry(entry: JournalEntry) {
    if (window.confirm('Do you really want to delete this entry?')) {
      profile.journals[0].entries = profile.journals[0].entries.filter(e => e.uuid !== entry.uuid);
      await saveProfile(db, profile);
    }
  }
  async function handleEditJournalEntry(entry: JournalEntry) {
    if (entry.text === '') {
      await handleDeleteJournalEntry(entry);
    } else {
      profile.journals[0].entries = profile.journals[0].entries.map(e => (e.uuid === entry.uuid) ? entry : e);
      await saveProfile(db, profile);
    }
  }

</script>

<div class="mb-4">
  <button type="button" onclick={() => isJournalFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Entry</span>
    <IconPlus size={18} />
  </button>
</div>

{#if isJournalFormOpen}
  <JournalForm
    onSave={ handleNewJournalEntry }
    onClose={() => isJournalFormOpen = false}
    onAssetUpload={ onAssetUpload }
    />
{/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each [...journal.entries].sort((a, b) => a.datetime < b.datetime) as entry}
    <JournalEntryCard
      entry={ entry }
      onDelete={ handleDeleteJournalEntry }
      onEdit={ handleEditJournalEntry }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      />
  {/each}
</div>
