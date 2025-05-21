<script lang="ts">
  import { eraseDB, loadDB, type Database } from '$lib/db';
  import { createNewProfile, loadProfileSummaries, deleteProfile, isAssetInDB, saveAsset, saveProfile } from '$lib/ops';
  import { onMount } from 'svelte';
  import IconSquarePlus from '@lucide/svelte/icons/square-plus';
  import IconUser from '@lucide/svelte/icons/user';
  import IconTrash from '@lucide/svelte/icons/trash';
  import IconTrash2 from '@lucide/svelte/icons/trash-2';
  import IconUpload from '@lucide/svelte/icons/upload';
  import { goto } from '$app/navigation';
  import type { ProfileSummary } from '$lib/types';
  import { loadArchive, loadAssetDataFromZip, uploadFile } from '$lib/fs';
  import { profileParentAssetPairs } from '$lib/utils';

  let db: Database | null = $state(null);
  let profileSummaries: ProfileSummary[] = $state([]);

  let profileName: string = $state('');

  async function handleNew() {
    if (profileName === '') {
      alert('Please input name of the new profile!');
    } else {
      let profile = await createNewProfile(db, profileName);
      await goto(`/profile/${profile.uuid}`);
    }
  }

  async function handleDelete(profileId: string) {
    if (window.confirm('Do you really want to delete this profile?')) {
      await deleteProfile(db, profileId);
      profileSummaries = profileSummaries.filter(ps => ps.uuid !== profileId);
    }
  }

  async function handleDeleteAll() {
    if (window.confirm('This is a development only feature! Do you really want to reset all data?')) {
      if (window.confirm('Are you sure?')) {
        await eraseDB();
      }
    }
  }

  async function handleImport() {
    const zipFile = await uploadFile('.zip');
    const profile = await loadArchive(zipFile);

    if (!profile) {
      console.error('Error in loading profile from file');
      return;
    }

    const assetPairs = profileParentAssetPairs(profile);
    const presenceFlags = (await Promise.all(assetPairs.map(async ([parentId, asset]) => await isAssetInDB(db!, parentId, asset))));
    if (presenceFlags.some(it => it)) {
      // First we check if any asset is conflicting with any existing item
      const message = `At least one asset already found in database. Aborting import!`;
      console.error(message);
      window.alert(message);
    } else if (profileSummaries.find(ps => ps.uuid === profile.uuid)) {
      // Then we check if the profile already exists
      const message = `Profile with id ${profile.uuid} already exists. Aborting import!`
      console.error(message);
      window.alert(message);
    } else if (profileSummaries.find(ps => ps.name === profile.name)) {
      if (window.confirm(`Profile with name ${profile.name} already exists. Do you still want to import?`)) {
        // We will continue with the import but the same name would be present
        // for two (or more) profiles.
        for (const [parentId, asset] of assetPairs) {
          const data = await loadAssetDataFromZip(zipFile, parentId, asset);
          // TODO: Should add an initial validation step here
          if (data) {
            await saveAsset(db!, parentId, asset, data);
          }
        }

        await saveProfile(db!, profile);
      } else {
        window.alert('Aborting import');
      }
    } else {
      // At this point, we can safely make an import
      for (const [parentId, asset] of assetPairs) {
        const data = await loadAssetDataFromZip(zipFile, parentId, asset);
        if (data) {
          await saveAsset(db!, parentId, asset, data);
        }
      }

      await saveProfile(db!, profile);
    }
  }

  onMount(async () => {
    db = await loadDB();
    profileSummaries = await loadProfileSummaries(db);
  });

</script>

<div class="grid grid-rows-[auto_1fr_auto]">
  <div class="container mx-auto grid grid-cols-1 xl:grid-cols-[200px_minmax(0px,_1fr)_200px]">
    <header class="col-span-1 mt-3 flex items-center gap-5 xl:flex-col xl:items-start">
      <h1 class="h1 p-3"><i>harp</i></h1>
      <div class="flex items-center gap-2">
        <button onclick={ handleDeleteAll } class="btn btn-sm preset-tonal-error">
          <span>Clear DB</span>
          <IconTrash2 size={14} />
        </button>
        <button type="button" onclick={ handleImport } class="btn btn-sm preset-outlined">
          <span>Import</span>
          <IconUpload size={14} />
        </button>
      </div>
    </header>

    <main class="col-span-1 p-4 mt-3">
      <div class="w-full grid grid-cols-2 gap-4 mb-5">
        {#each profileSummaries as summary}
          <a href={ `/profile/${summary.uuid}` }>
            <div class="flex justify-between card p-4 items-center preset-tonal-primary grid-cols-[1fr_auto]">
              <span class="flex gap-3">
                <IconUser /> { summary.name }
              </span>
              <button
                onclick={async (event) => {
                  event.preventDefault();
                  await handleDelete(summary.uuid);
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
        <input class="ig-input" bind:value={ profileName } type="text" placeholder="Profile Name..." />
        <button onclick={ handleNew } class="ig-btn preset-filled rounded-lg">
          <IconSquarePlus size={16} /> Create
        </button>
      </div>
    </main>
  </div>
  <footer>
  </footer>
</div>
