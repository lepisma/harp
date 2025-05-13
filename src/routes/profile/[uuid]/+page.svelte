<script lang="ts">
  import { page } from '$app/stores';
  import { loadDB } from '$lib/db';
  import { loadAsset, loadProfile, saveAsset, saveProfile } from '$lib/ops';
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
  import type { Asset, JournalEntry, Journal, Metric, MetricValue, Report, Document } from '$lib/types';
  import { profileMetricValues, profileTags } from '$lib/utils';

  import JournalForm from '$lib/components/journal-form.svelte';
  import MetricForm from '$lib/components/metric-form.svelte';
  import ReportForm from '$lib/components/report-form.svelte';
  import DocumentForm from '$lib/components/document-form.svelte';
  import JournalEntryCard from '$lib/components/journal-entry-card.svelte';
  import MetricCard from '$lib/components/metric-card.svelte';
  import ReportCard from '$lib/components/report-card.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';
  import { archiveProfile } from '$lib/fs';
  import saveAs from 'file-saver';

  let profileId = $page.params.uuid;

  let db = $state(null);
  let profile = $state(null);
  let journal: Journal[] = $derived(profile !== null ? profile.journals[0] : []);
  let metrics: Metric[] = $derived(profile !== null ? profile.metadata.metrics : []);
  let reports: Report[] = $derived(profile !== null ? profile.reports : []);
  let documents: Document[] = $derived(profile !== null ? profile.documents : []);
  let metricValues: MetricValue[] = $derived(profile !== null ? profileMetricValues(profile) : []);
  let tags: string[] = $derived(profile !== null ? profileTags(profile) : []);

  let selectedTab = $state('journal');
  let isJournalFormOpen = $state(false);
  let isMetricFormOpen = $state(false);
  let isReportFormOpen = $state(false);
  let isDocumentFormOpen = $state(false);

  async function exportProfile() {
    const blob = await archiveProfile(db, profile);
    saveAs(blob, `archive-${profile.uuid}.${(new Date()).toISOString()}.harp.zip`);
  }

  async function handleNewJournalEntry(entry: JournalEntry) {
    // Entry could be empty. We ignore them here
    if (entry.text !== '') {
      profile.journals[0].entries.push(entry);
      await saveProfile(db, profile);
    }

    isJournalFormOpen = false;
  }

  async function handleNewMetric(metric: Metric) {
    profile.metadata.metrics.push(metric);
    await saveProfile(db, profile);

    isMetricFormOpen = false;
  }

  async function handleNewReport(report: Report) {
    profile.reports.push(report);
    await saveProfile(db, profile);

    isReportFormOpen = false;
  }

  async function handleNewDocument(doc: Document) {
    profile.documents.push(doc);
    await saveProfile(db, profile);

    isDocumentFormOpen = false;
  }

  async function handleDeleteJournalEntry(entry: JournalEntry) {
    if (window.confirm('Do you really want to delete this entry?')) {
      profile.journals[0].entries = profile.journals[0].entries.filter(e => e.uuid !== entry.uuid);
      await saveProfile(db, profile);
    }
  }

  async function handleDeleteReport(report: Report) {
    if (window.confirm('Do you really want to delete this report?')) {
      profile.reports = profile.reports.filter(r => r.uuid !== report.uuid);
      await saveProfile(db, profile);
    }
  }

  async function handleDeleteDocument(doc: Document) {
    if (window.confirm('Do you really want to delete this document?')) {
      profile.documents = profile.documents.filter(d => d.uuid !== document.uuid);
      await saveProfile(db, profile);
    }
  }

  async function handleEditReport(report: Report) {
    profile.reports = profile.reports.map(r => (r.uuid === report.uuid) ? report : r);
    await saveProfile(db, profile);
  }

  async function handleEditDocument(doc: Document) {
    profile.documents = profile.documents.map(d => (d.uuid === doc.uuid) ? doc : d);
    await saveProfile(db, profile);
  }

  async function handleEditJournalEntry(entry: JournalEntry) {
    if (entry.text === '') {
      await handleDeleteJournalEntry(entry);
    } else {
      profile.journals[0].entries = profile.journals[0].entries.map(e => (e.uuid === entry.uuid) ? entry : e);
      await saveProfile(db, profile);
    }
  }

  async function handleAssetUpload(asset: Asset, parentId: string, data: Blob) {
    await saveAsset(db, parentId, asset, data);
  }

  async function readAsset(asset: Asset, parentId: string): Promise<Blob> {
    return await loadAsset(db, parentId, asset);
  }

  async function onNewMetricValue(mv: MetricValue) {
    console.log(mv);
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
              <span>Import & Merge</span>
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
            <Tabs.Control value="documents">
              {#snippet lead()}<IconClipboardPen size={20} />{/snippet}
              Documents
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
                <JournalForm
                  onSave={ handleNewJournalEntry }
                  onClose={() => isJournalFormOpen = false}
                  onAssetUpload={ handleAssetUpload }
                  />
                {/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each [...journal.entries].sort((a, b) => a.datetime < b.datetime) as entry}
    <JournalEntryCard
      entry={ entry }
      onDelete={ handleDeleteJournalEntry }
      onEdit={ handleEditJournalEntry }
      onAssetUpload={ handleAssetUpload }
      readAsset={ readAsset }
      />
    {/each}
  </div>
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              <div class="mb-4">
                <button type="button" onclick={() => isMetricFormOpen = true} class="btn btn-sm preset-outlined">
    <span>Define New Metric</span>
    <IconPlus size={18} />
</button>
</div>

{#if isMetricFormOpen}
  <MetricForm
    onSave={ handleNewMetric }
    onClose={() => isMetricFormOpen = false}
    />
  {/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each metrics as metric}
    <MetricCard metric={metric} metricValues={metricValues} onNewValue={onNewMetricValue} />
  {/each}
</div>
</Tabs.Panel>
<Tabs.Panel value="reports">
  <div class="mb-4">
    <button type="button" onclick={() => isReportFormOpen = true} class="btn btn-sm preset-outlined">
      <span>New Report</span>
      <IconPlus size={18} />
    </button>
  </div>

  {#if isReportFormOpen}
    <ReportForm
      onSave={ handleNewReport }
      onClose={() => isReportFormOpen = false}
      onAssetUpload={ handleAssetUpload }
      readAsset={ readAsset }
      />
    {/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each reports as report}
    <ReportCard
      report={ report }
      onDelete={ handleDeleteReport }
      onEdit={ handleEditReport }
      onAssetUpload={ handleAssetUpload }
      readAsset={ readAsset }
      />
  {/each}
</div>
</Tabs.Panel>
<Tabs.Panel value="documents">
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
      onAssetUpload={ handleAssetUpload }
      />
    {/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each documents as doc}
    <DocumentCard
      doc={ doc }
      onDelete={ handleDeleteDocument }
      onEdit={ handleEditDocument }
      onAssetUpload={ handleAssetUpload }
      readAsset={ readAsset }
      />
  {/each}
</div>
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
