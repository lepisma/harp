<script lang="ts">
  import { page } from '$app/stores';
  import { loadDB, type Database } from '$lib/db';
  import { loadAsset, loadProfile, saveAsset, saveProfile } from '$lib/ops';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import IconNotepadText from '@lucide/svelte/icons/notepad-text';
  import IconChartScatter from '@lucide/svelte/icons/chart-scatter';
  import IconClipboardPen from '@lucide/svelte/icons/clipboard-pen';
  import IconScanHeart from '@lucide/svelte/icons/scan-heart';
  import IconDownload from '@lucide/svelte/icons/download';
  import IconUpload from '@lucide/svelte/icons/upload';
  import IconFunnelPlus from '@lucide/svelte/icons/funnel-plus';
  import IconScrollText from '@lucide/svelte/icons/scroll-text';
  import { onMount } from 'svelte';
  import type { Asset, Profile, MetricValue } from '$lib/types';
  import { profileTags, profileMetricValues } from '$lib/utils';

  import MetricSection from '$lib/components/metric/section.svelte';
  import ReportSection from '$lib/components/report/section.svelte';
  import DocumentSection from '$lib/components/document/section.svelte';
  import JournalSection from '$lib/components/journal/section.svelte';
  import { exportProfile, shareAsPDF } from '$lib/export';


  let profileId = $page.params.uuid;

  let db: Database | null = $state(null);
  let profile: Profile | null = $state(null);

  let tags: string[] = $derived(profile !== null ? profileTags(profile) : []);
  let metricValues: MetricValue[] = $derived(profile !== null ? profileMetricValues(profile) : []);

  let selectedTags: string[] = $state([]);
  let selectedTab = $state('journal');

  function onTagClick(e: Event, tag: string) {
    let btn = e.target;

    if (btn.classList.contains('selected')) {
      selectedTags = selectedTags.filter(t => t !== tag);
      btn.classList.remove('preset-filled');
      btn.classList.add('preset-tonal');
    } else {
      selectedTags.push(tag);
      btn.classList.remove('preset-tonal');
      btn.classList.add('preset-filled');
    }

    btn.classList.toggle('selected');
  }

  async function handleAssetUpload(asset: Asset, parentId: string, data: Blob) {
    await saveAsset(db, parentId, asset, data);
  }

  async function readAsset(asset: Asset, parentId: string): Promise<Blob> {
    return await loadAsset(db, parentId, asset);
  }

  async function handleProfileSave() {
    await saveProfile(db, profile);
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
            <button type="button" onclick={() => shareAsPDF(profile)} class="btn btn-sm preset-filled">
              <span>View as PDF</span>
              <IconScrollText size={14} />
            </button>
          </div>
          <div>
            <button type="button" onclick={ exportProfile } class="btn btn-sm preset-filled">
              <span>Export</span>
              <IconDownload size={14} />
            </button>
            <button type="button" disabled class="btn btn-sm preset-outlined">
              <span>Import & Merge</span>
              <IconUpload size={14} />
            </button>
          </div>
        </div>

        <hr class="text-gray-300">
        <div class="my-4">
          <p class="flex gap-2 mb-4"><IconFunnelPlus /><span>Filter by tags</span></p>
          <small class="opacity-60">
            {#each tags as tag}
              <button onclick={ (e) => onTagClick(e, tag) } class="btn btn-sm preset-tonal rounded-md font-semibold px-2 py-1 mr-2">#{ tag }</button>
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
            <Tabs.Control value="documents">
              {#snippet lead()}<IconClipboardPen size={20} />{/snippet}
              Documents
            </Tabs.Control>
            {/snippet}
            {#snippet content()}
            <Tabs.Panel value="journal">
              <JournalSection
                bind:journals={ profile.journals }
                onChange={ handleProfileSave }
                onAssetUpload={ handleAssetUpload }
                readAsset={ readAsset }
                selectedTags={ selectedTags }
                />
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              <MetricSection
                bind:metrics={ profile.metadata.metrics }
                metricValues={ metricValues }
                onChange={ handleProfileSave }
                selectedTags={ selectedTags }
                />
            </Tabs.Panel>
            <Tabs.Panel value="reports">
              <ReportSection
                bind:reports={ profile.reports }
                onChange={ handleProfileSave }
                onAssetUpload={ handleAssetUpload }
                readAsset={ readAsset }
                selectedTags={ selectedTags }
                />
            </Tabs.Panel>
            <Tabs.Panel value="documents">
              <DocumentSection
                bind:documents={ profile.documents }
                onChange={ handleProfileSave }
                onAssetUpload={ handleAssetUpload }
                readAsset={ readAsset }
                selectedTags={ selectedTags }
                />
            </Tabs.Panel>
            {/snippet}
          </Tabs>
        </div>
      </main>
    </div>
  </div>
{/if}
