<script lang="ts">
  import type { Asset, Report } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

  interface Props {
    reports: Report[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
  };

  let { reports = $bindable(), onAssetUpload, readAsset, onChange }: Props = $props();
  let isReportFormOpen = $state(false);

  async function handleNewReport(report: Report) {
    reports.push(report);
    await onChange();

    isReportFormOpen = false;
  }

  async function handleDeleteReport(report: Report) {
    if (window.confirm('Do you really want to delete this report?')) {
      reports = reports.filter(r => r.uuid !== report.uuid);
      await onChange();
    }
  }
  async function handleEditReport(report: Report) {
    reports = reports.map(r => (r.uuid === report.uuid) ? report : r);
    await onChange();
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
