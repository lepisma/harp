<script lang="ts">
  import type { Asset, Report } from '$lib/types';
  import IconPlus from '@lucide/svelte/icons/plus';
  import IconCheck from '@lucide/svelte/icons/check';
  import IconSquareMinus from '@lucide/svelte/icons/square-minus';
  import DocumentForm from '$lib/components/document-form.svelte';
  import DocumentCard from '$lib/components/document-card.svelte';

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

<div class="text-sm mb-5 flex gap-2">
  <label class="relative flex items-center cursor-pointer select-none">
    <input
      type="checkbox"
      onchange={ handleSelectAll }
      checked={ allFilteredSelected }
      indeterminate={ someFilteredSelected }
      class="sr-only peer"
      />
    <span class="rounded-md border-2 w-5 h-5 flex items-center justify-center
		 border-gray-300 dark:border-gray-600
		 text-transparent peer-checked:text-white dark:text-transparent dark:peer-checked:text-white
		 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600
		 peer-checked:border-blue-500 dark:peer-checked:border-blue-600
		 peer-indeterminate:bg-blue-500 dark:peer-indeterminate:bg-blue-600
		 peer-indeterminate:border-blue-500 dark:peer-indeterminate:border-blue-600
		 peer-indeterminate:text-white dark:peer-indeterminate:text-white
		 transition-colors duration-150 ease-in-out">
      {#if allFilteredSelected}
	<IconCheck size={18} />
      {:else if someFilteredSelected}
	<IconSquareMinus size={18} />
      {:else}
	<IconCheck size={18} class="text-transparent" />
      {/if}
    </label>
  <span>Selected { selectedReports.length } {#if selectedReports.length === 1} entry{:else} entries{/if} {#if nHiddenSelection > 0 } ({ nHiddenSelection } hidden) {/if}</span>
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
