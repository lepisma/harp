<script lang="ts">
  import { loadDB, loadProfileList, saveProfile } from '$lib/db';
  import { onMount } from 'svelte';
  import IconSquarePlus from '@lucide/svelte/icons/square-plus';
  import IconUser from '@lucide/svelte/icons/user';
    import { newProfile } from '$lib/utils';
    import { goto } from '$app/navigation';

  let db = $state({});
  let profileList: string[][] = $state([]);

  let profileName: string = $state('');

  async function onNew() {
    if (profileName === '') {
      alert('Please input name of the new profile!');
    } else {
      let profile = newProfile(profileName);
      await saveProfile(db, profile);
      await goto(`/profile/${profile.uuid}`);
    }
  }

  onMount(async () => {
    db = await loadDB();
    profileList = await loadProfileList(db);
  });

</script>

<div class="grid grid-rows-[auto_1fr_auto]">
  <div class="container mx-auto grid grid-cols-1 xl:grid-cols-[200px_minmax(0px,_1fr)_200px]">
    <header class="mt-3">
      <h1 class="h1 p-3"><i>harp</i></h1>
    </header>

    <main class="col-span-1 p-4">
      <div class="w-full grid grid-cols-2 gap-4 mb-5">
        {#each profileList as profile}
          <a href={`/profile/${profile[0]}`}>
            <div class="flex gap-3 card p-4 preset-filled-primary-500 grid-cols-[1fr_auto]"><IconUser /> {profile[1]}</div>
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
