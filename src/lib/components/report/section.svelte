<script lang="ts">
  import type { Asset, Report } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';
  import SelectAllInput from '$lib/components/select-all-input.svelte';

  interface Props {
    reports: Report[];
    onChange: () => Promise<void>;
    onAssetUpload: (asset: Asset, parentId: string, data: Blob) => Promise<void>;
    readAsset: (asset: Asset, parentId: string) => Promise<Blob>;
    selectedUUIDs: string[];
    selectedTags?: string[];
  };

  let { reports = $bindable(), onAssetUpload, readAsset, onChange, selectedUUIDs = $bindable(), selectedTags = [] }: Props = $props();
  let isReportFormOpen = $state(false);

  reports.sort((a, b) => a.datetim < b.datetime);

  let filteredReports = $derived.by(() => {
    if (selectedTags.length > 0) {
      return reports.filter(report => report.tags.some(tag => selectedTags.includes(tag)));
    } else {
      return reports;
    }
  });

  let selectedReports = $derived.by(() => {
    if (selectedUUIDs.length > 0) {
      return reports.filter(report => selectedUUIDs.includes(report.uuid));
    } else {
      return [];
    }
  })

  let nHiddenSelection = $derived.by(() => {
    // Count selected entries that are NOT in the currently filtered set
    const filteredUUIDs = new Set(filteredReports.map(report => report.uuid));
    return selectedUUIDs.filter(uuid => !filteredUUIDs.has(uuid)).length;
  });

  let allFilteredSelected = $derived.by(() =>
    filteredReports.length > 0 && filteredReports.every(report => selectedUUIDs.includes(report.uuid))
  );

  let someFilteredSelected = $derived.by(() =>
    selectedReports.length > 0 && selectedReports.some(report => filteredReports.map(r => r.uuid).includes(report.uuid)) && !allFilteredSelected
  );

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

  function handleSelectAll() {
    let filteredUUIDs = filteredReports.map(report => report.uuid);
    const allFilteredAreSelected = filteredUUIDs.length > 0 && filteredUUIDs.every(uuid => selectedUUIDs.includes(uuid));

    if (allFilteredAreSelected) {
      selectedUUIDs = selectedUUIDs.filter(uuid => !filteredUUIDs.includes(uuid));
    } else {
      const newSelectedSet = new Set(selectedUUIDs);
      filteredUUIDs.forEach(uuid => newSelectedSet.add(uuid));
      selectedUUIDs = Array.from(newSelectedSet);
    }
  }

  function handleSelection(report: Report, isSelected: boolean) {
    if (isSelected) {
      if (!selectedUUIDs.includes(report.uuid)) {
	selectedUUIDs = [...selectedUUIDs, report.uuid];
      }
    } else {
      selectedUUIDs = selectedUUIDs.filter(uuid => uuid !== report.uuid);
    }
  }
</script>

<div class="mb-4">
  <button type="button" onclick={() => isReportFormOpen = true} class="btn btn-sm preset-outlined">
    <span>New Report</span>
    <IconPlus size={18} />
  </button>
</div>

<div class="text-sm text-gray-500 italic mb-5">
  {#if filteredReports.length < reports.length}
    Showing { filteredReports.length } of total { reports.length } {#if reports.length === 1}report{:else}reports{/if}
  {:else}
    Showing {#if reports.length === 1} the only report{:else}all { reports.length } reports{/if}
  {/if}
</div>

<div class="mb-5">
  <SelectAllInput
    allFilteredSelected={ allFilteredSelected }
    someFilteredSelected={ someFilteredSelected }
    nSelection={ selectedReports.length }
    nHiddenSelection={ nHiddenSelection }
    entityName="report"
    entityNamePlural="reports"
    handleSelectAll={ handleSelectAll }
    />
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
  {#each filteredReports as report}
    <DocumentCard
      title='Report'
      entity={ report }
      onDelete={ handleDeleteReport }
      onEdit={ handleEditReport }
      onAssetUpload={ onAssetUpload }
      readAsset={ readAsset }
      enableMetricValues={ true }
      checked={ selectedUUIDs.includes(report.uuid) }
      onSelectionChange={ (isSelected) => handleSelection(report, isSelected) }
      />
  {/each}
</div>
