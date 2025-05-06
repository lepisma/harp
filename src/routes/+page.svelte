<script lang="ts">
  import { browser } from '$app/environment';
  import { loadProfiles, loadLog } from '$lib/fs';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import IconUser from '@lucide/svelte/icons/user';

  let profiles = $state([]);
  let selected = $state(null);
  let logs = $state([]);

  if (browser) {
    const directoryInput = document.getElementById('root-dir');
    directoryInput.addEventListener('change', async (event) => {
      profiles = await loadProfiles(event.target.files);
      logs = await Promise.all(profiles.map(async (p) => await loadLog(p)));
      selected = profiles[0].name;
    });
  }

</script>

<h1 class="text-lg">harp</h1>
<input type="file" id="root-dir" webkitdirectory directory>

<Tabs value={selected} onValueChange={(e) => (selected = e.value)}>
  {#snippet list()}
  {#each profiles as profile}
    <Tabs.Control value={ profile.name }>
      {#snippet lead()}<IconUser size={20} />{/snippet}
      { profile.name }
    </Tabs.Control>
  {/each}
  {/snippet}
    {#snippet content()}
    {#each profiles as profile, i}
      <Tabs.Panel value={ profile.name }>
        <textarea readonly>{ logs[i] }</textarea>
      </Tabs.Panel>
    {/each}
    {/snippet}
</Tabs>
