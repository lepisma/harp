<script lang="ts">
  import { loadDB, type Database } from '$lib/db';
  import { createNewProfile, loadProfileSummaries, deleteProfile } from '$lib/ops';
  import { onMount } from 'svelte';
  import IconSquarePlus from '@lucide/svelte/icons/square-plus';
  import IconUser from '@lucide/svelte/icons/user';
  import IconTrash from '@lucide/svelte/icons/trash';
  import { goto } from '$app/navigation';
  import type { ProfileSummary } from '$lib/types';

  let db: Database | null = $state(null);
  let profileSummaries: ProfileSummary[] = $state([]);

  let profileName: string = $state('');

  async function onNew() {
    if (profileName === '') {
      alert('Please input name of the new profile!');
    } else {
      let profile = await createNewProfile(db, profileName);
      await goto(`/profile/${profile.uuid}`);
    }
  }

  async function onDelete(profileId: string) {
    if (window.confirm('Do you really want to delete this profile?')) {
      await deleteProfile(db, profileId);
      profileSummaries = profileSummaries.filter(ps => ps.uuid !== profileId);
    }
  }

  onMount(async () => {
    db = await loadDB();
    profileSummaries = await loadProfileSummaries(db);
  });

</script>

<div class="grid grid-rows-[auto_1fr_auto]">
  <div class="container mx-auto grid grid-cols-1 xl:grid-cols-[200px_minmax(0px,_1fr)_200px]">
    <header class="mt-3">
      <h1 class="h1 p-3"><i>harp</i></h1>
    </header>

    <main class="col-span-1 p-4">
      <div class="w-full grid grid-cols-2 gap-4 mb-5">
        {#each profileSummaries as summary}
          <a href={`/profile/${summary.uuid}`}>
            <div class="flex justify-between card p-4 items-center preset-tonal-primary grid-cols-[1fr_auto]">
              <span class="flex gap-3">
                <IconUser /> {summary.name}
              </span>
              <button
                onclick={async (event) => {
                  event.preventDefault();
                  await onDelete(summary.uuid);
                }}
                class="ig-btn preset-tonal-surface rounded-md"
                >
                <IconTrash size={18} />
              </button>
            </div>
          </a>
        {/each}
      </div>

      <div class="input-group card p-2 preset-outlined-primary-500 flex">
        <input class="ig-input" bind:value={profileName} type="text" placeholder="Profile Name..." />
        <button onclick={onNew} class="ig-btn preset-filled rounded-lg">
          <IconSquarePlus size={16} /> Create
        </button>
      </div>
    </main>
  </div>
  <footer>
  </footer>
</div>
