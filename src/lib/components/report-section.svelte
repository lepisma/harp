<script lang="ts">
  import type { Database } from '$lib/db';
  import type { Asset, Report, Profile } from '$lib/types';
  import { saveProfile } from '$lib/ops';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

  interface Props {
    db: Database;
    profile: Profile;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
  };

  let { db, profile, onAssetUpload, readAsset }: Props = $props();

  let reports: Report[] = $derived(profile !== null ? profile.reports : []);
  let isReportFormOpen = $state(false);

  async function handleNewReport(report: Report) {
    profile.reports.push(report);
    await saveProfile(db, profile);

    isReportFormOpen = false;
  }

  async function handleDeleteReport(report: Report) {
    if (window.confirm('Do you really want to delete this report?')) {
      profile.reports = profile.reports.filter(r => r.uuid !== report.uuid);
      await saveProfile(db, profile);
    }
  }
  async function handleEditReport(report: Report) {
    profile.reports = profile.reports.map(r => (r.uuid === report.uuid) ? report : r);
    await saveProfile(db, profile);
  }
</script>

<div class="mb-4">
  <button type="button" onclick={() => isReportFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Report</span>
    <IconPlus size={18} />
  </button>
</div>

{#if isReportFormOpen}
  <DocumentForm
    onSave={ handleNewReport }
    onClose={() => isReportFormOpen = false}
    title='New Report'
    onAssetUpload={ onAssetUpload }
    readAsset={ readAsset }
    enableMetricValues={ true }
    />
{/if}

<div class="grid gap-4 md:grid-cols-1">
  {#each reports as report}
    <DocumentCard
      title='Report'
      entity={ report }
      onDelete={ handleDeleteReport }
      onEdit={ handleEditReport }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      enableMetricValues={ true }
      />
  {/each}
</div>
