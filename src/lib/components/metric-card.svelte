<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import IconPlus from '@lucide/svelte/icons/plus';
  import IconArrowRight from '@lucide/svelte/icons/arrow-right';
  import MetricForm from '$lib/components/metric-form.svelte';

  let { metric, metricValuesMap, onNewValue } = $props();

  let latestValue = $derived.by(() => {
    if (metricValuesMap[metric.id]) {
      return metricValuesMap[metric.id].sort((a, b) => a.datetime < b.datetime)[0].value;
    } else {
      return null;
    }
  })

  let isEditFormOpen = $state(false);

  function handleNewValue() {
  }
</script>

<div class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 my-2 p-1 px-5">
        {metric.id}
      </span>
      <span class="pr-2">
        <button disabled type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button disabled type="button" class="btn-icon preset-outlined"><IconTrash size={18} /></button>
      </span>
    </header>
    <div class="p-5">
      <h3 class="h3 mb-3 flex items-center gap-2">
        <span class="font-normal">{metric.name}</span> {#if latestValue !== null} <IconArrowRight /> {latestValue} {metric.unit} {/if}
      </h3>
      <div class="flex items-center justify-between gap-4 mt-3">
        <small class="opacity-60">
          {#each metric.tags as tag}
            <span class="inline-block bg-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-gray-700 mr-2">#{tag}</span>
          {/each}
        </small>
      </div>
      <button disabled type="button" onclick={() => isMetricFormOpen = true} class="mt-4 btn btn-sm preset-tonal">
        <span>New Entry</span>
        <IconPlus size={18} />
      </button>
    </div>
    <div class="px-5">
      {#if metricValuesMap[metric.id]}
        <ul>
          {#each metricValuesMap[metric.id].sort((a, b) => a.datetime < b.datetime) as mv}
            <li>
              <span>{mv.datetime.toLocaleString()}:</span>
              <span class="font-bold">{mv.value} {metric.unit}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <i class="text-gray-400">No entries yet</i>
      {/if}
    </div>
  </article>
</div>

{#if isEditFormOpen}
  <MetricForm metric={ metric } title='Edit metric' onClose={() => isEditFormOpen = false } />
{/if}
