<script lang="ts">
  import { page } from '$app/stores';
  import { loadDB } from '$lib/db';
  import { loadProfile, saveProfile } from '$lib/ops';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import IconNotepadText from '@lucide/svelte/icons/notepad-text';
  import IconChartScatter from '@lucide/svelte/icons/chart-scatter';
  import IconClipboardPen from '@lucide/svelte/icons/clipboard-pen';
  import IconScanHeart from '@lucide/svelte/icons/scan-heart';
  import IconPlus from '@lucide/svelte/icons/plus';
  import IconDownload from '@lucide/svelte/icons/download';
  import IconUpload from '@lucide/svelte/icons/upload';
  import IconFunnelPlus from '@lucide/svelte/icons/funnel-plus';
  import IconScrollText from '@lucide/svelte/icons/scroll-text';
  import { onMount } from 'svelte';
  import type { JournalEntry } from '$lib/types';
  import { profileTags } from '$lib/utils';

  import JournalForm from '$lib/components/journal-form.svelte';
  import JournalEntryCard from '$lib/components/journal-entry-card.svelte';
  import { formatProfile } from '$lib/org';

  let profileId = $page.params.uuid;

  let db = $state(null);
  let profile = $state(null);
  let journal = $derived(profile !== null ? profile.journals[0] : []);
  let tags = $derived(profile !== null ? profileTags(profile) : []);

  let selectedTab = $state('journal');
  let isJournalFormOpen = $state(false);

  function exportProfile() {
    // For now just generating a single org file
    const blob = new Blob([formatProfile(profile)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    window.open(url, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  async function handleNewJournalEntry(entry) {
    profile.journals[0].entries.push(entry);

    let clonedProfile = JSON.parse(JSON.stringify(profile));
    clonedProfile.journals[0].entries.forEach(entry => {
      entry.datetime = new Date(entry.datetime);
    })

    await saveProfile(db, clonedProfile);
    isJournalFormOpen = false;
  }

  async function handleDeleteJournalEntry(entry: JournalEntry) {
    if (window.confirm('Do you really want to delete this entry?')) {
      profile.journals[0].entries = profile.journals[0].entries.filter(e => e.uuid !== entry.uuid);

      let clonedProfile = JSON.parse(JSON.stringify(profile));
      clonedProfile.journals[0].entries.forEach(entry => {
        entry.datetime = new Date(entry.datetime);
      })

      await saveProfile(db, clonedProfile);
    }
  }

  async function handleEditJournalEntry(entry: JournalEntry) {
    profile.journals[0].entries = profile.journals[0].entries.map(e => (e.uuid === entry.uuid) ? entry : e);

    let clonedProfile = JSON.parse(JSON.stringify(profile));
    clonedProfile.journals[0].entries.forEach(entry => {
      entry.datetime = new Date(entry.datetime);
    })

    await saveProfile(db, clonedProfile);
  }

  onMount(async () => {
    db = await loadDB();
    profile = await loadProfile(db, profileId);
  });

</script>

{#if profile !== null}
  <div class="grid grid-rows-[auto_1fr_auto]">
    <div class="container mx-auto grid grid-cols-1 xl:grid-cols-[200px_minmax(0px,_1fr)_200px]">
      <header class="mt-3">
        <a href="/"><div class="h3 text-gray-400 pt-3 pl-3"><i>harp</i></div></a>
        <h1 class="h1 p-3">{profile.name}</h1>
      </header>

      <main class="col-span-1 p-4">
        <div class="mb-5 flex items-center justify-between gap-2">
          <div>
            <button type="button" disabled class="btn btn-sm preset-filled">
              <span>Share Selection</span>
              <IconScrollText size={14} />
            </button>
          </div>
          <div>
            <button type="button" onclick={exportProfile} class="btn btn-sm preset-filled">
              <span>Export</span>
              <IconDownload size={14} />
            </button>
            <button type="button" disabled class="btn btn-sm preset-outlined">
              <span>Import</span>
              <IconUpload size={14} />
            </button>
          </div>
        </div>

        <hr class="text-gray-300">
        <div class="my-4">
          <p class="text-semibold flex gap-2 mb-4"><IconFunnelPlus /><span>Filter by tags</span></p>

          <small class="opacity-60">
            {#each tags as tag}
              <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
            {/each}
          </small>
        </div>
        <hr class="text-gray-300">

        <div class="mt-5">
          <Tabs value={selectedTab} onValueChange={(e) => (selectedTab = e.value)}>
            {#snippet list()}
            <Tabs.Control value="journal">
              {#snippet lead()}<IconNotepadText size={20} />{/snippet}
              Journal
            </Tabs.Control>
            <Tabs.Control value="metrics">
              {#snippet lead()}<IconChartScatter size={20} />{/snippet}
              Metrics
            </Tabs.Control>
            <Tabs.Control value="reports">
              {#snippet lead()}<IconScanHeart size={20} />{/snippet}
              Reports
            </Tabs.Control>
            <Tabs.Control value="consultations">
              {#snippet lead()}<IconClipboardPen size={20} />{/snippet}
              Consultations
            </Tabs.Control>
            {/snippet}
            {#snippet content()}
            <Tabs.Panel value="journal">
              <div class="mb-4">
                <button type="button" onclick={() => isJournalFormOpen = true} class="btn btn-sm preset-outlined">
                  <span>New Entry</span>
                  <IconPlus size={18} />
                </button>
              </div>

              {#if isJournalFormOpen}
                <JournalForm onSave={handleNewJournalEntry} onClose={() => isJournalFormOpen = false} />
              {/if}

              <div class="grid gap-4 md:grid-cols-1">
                {#each [...journal.entries].sort((a, b) => a.datetime < b.datetime) as entry}
                  <JournalEntryCard entry={ entry } onDelete={handleDeleteJournalEntry} onEdit={handleEditJournalEntry} />
                {/each}
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              Under Development
            </Tabs.Panel>
            <Tabs.Panel value="reports">
              Under Development
            </Tabs.Panel>
            <Tabs.Panel value="consultations">
              Under Development
            </Tabs.Panel>
            {/snippet}
          </Tabs>
        </div>
      </main>
    </div>
    <footer>
    </footer>
  </div>
{/if}
