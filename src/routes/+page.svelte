<script lang="ts">
  import { browser } from '$app/environment';
  import { loadProfiles, loadLog } from '$lib/fs';

  let profiles = $state([]);
  let logs = $state([]);

  if (browser) {
    const directoryInput = document.getElementById('root-dir');
    directoryInput.addEventListener('change', async (event) => {
      profiles = await loadProfiles(event.target.files);
      logs = await Promise.all(profiles.map(async (p) => await loadLog(p)));
    });
  }
</script>

<h1 class="text-lg">harp</h1>

<input type="file" id="root-dir" webkitdirectory directory>

<ul class="list-disc">
  {#each profiles as profile}
    <li>{profile.name}</li>
  {/each}
</ul>

{#each logs as log}
  <hr>
  <pre>
    { log }
  </pre>
{/each}
