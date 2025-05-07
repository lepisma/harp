<script lang="ts">
  import { browser } from '$app/environment';
  import { loadProfile, loadLog } from '$lib/fs';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import IconNotepadText from '@lucide/svelte/icons/notepad-text';
  import IconChartScatter from '@lucide/svelte/icons/chart-scatter';
  import IconClipboardPen from '@lucide/svelte/icons/clipboard-pen';
  import IconScanHeart from '@lucide/svelte/icons/scan-heart';
  import { FileUpload } from '@skeletonlabs/skeleton-svelte';
  import IconUpload from '@lucide/svelte/icons/upload';

  let profile = $state({});
  let log = $state('');
  let selectedTab = $state('journal');

  async function onFileSelection(event) {
    profile = await loadProfile(event.files[0]);
    log = await loadLog(profile);
  }
</script>

<div class="grid grid-rows-[auto_1fr_auto]">
  <div class="container mx-auto grid grid-cols-1 xl:grid-cols-[200px_minmax(0px,_1fr)_200px]">
    <header class="mt-3">
      <h1 class="h1 p-3">harp {#if profile.name} / {profile.name} {:else}{/if}</h1>
      <FileUpload name="root-dir" onFileAccept={onFileSelection} maxFiles={1}>
        <button class="m-3 btn preset-filled">
          <IconUpload class="size-4" />
          <span>Open file</span>
        </button>
      </FileUpload>
    </header>

    <main class="col-span-1 p-4">
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
          journal
        </Tabs.Panel>
        <Tabs.Panel value="metrics">
          metrics
        </Tabs.Panel>
        <Tabs.Panel value="reports">
          reports
        </Tabs.Panel>
        <Tabs.Panel value="consultations">
          consultations
        </Tabs.Panel>
        {/snippet}
      </Tabs>
    </main>
  </div>
  <footer>
  </footer>
</div>
