<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import ReportForm from '$lib/components/report-form.svelte';
  import type { Asset, Report } from '$lib/types';
  import { triggerOpen, transformAttachmentLinks } from '$lib/utils';
  import { formatOrgToHTML } from '$lib/org';


  let { report, onDelete, onEdit, onAssetUpload, readAsset } = $props();
  let content = $derived.by(async () => {
    return transformAttachmentLinks(await formatOrgToHTML(report.annotation));
  });

  let isEditFormOpen = $state(false);

  async function handleContentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'A' && target.hasAttribute('data-filename')) {
      event.preventDefault();

      const fileName = target.getAttribute('data-filename');
      if (fileName) {
        let asset = report.assets.find((a: Asset) => a.fileName === fileName);

        if (!asset) {
          alert(`Asset ${fileName} not found`);
        } else {
          let data = await readAsset(asset, report.uuid);
          triggerOpen(data);
        }
      }
    }
  }

  function handleSave(editedReport: Report) {
    onEdit(editedReport);
    isEditFormOpen = false;
  }
</script>

<div class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 px-5">
        {report.datetime.toLocaleString()}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(report)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <div class="p-5">
      <h3 class="h3 mb-3 flex items-center gap-2">
        <span class="font-normal">{report.name}</span>
      </h3>
      <p class="p-5" onclick={handleContentClick}>
        {#await content then value}
	  {@html value}
        {/await}
      </p>
      <div class="flex items-center justify-between gap-4 mt-3">
        <small class="opacity-60">
          {#each report.tags as tag}
            <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
          {/each}
          {#each report.metricValues as mv}
            <span class="inline-block bg-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 mr-2">{mv.id} = {mv.value}</span>
          {/each}
        </small>
      </div>
    </div>
    <div class="px-5">
    </div>
  </article>
</div>

{#if isEditFormOpen}
  <ReportForm report={ report } title='Edit report' onSave={handleSave} onAssetUpload={onAssetUpload} onClose={() => isEditFormOpen = false } />
{/if}
