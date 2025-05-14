<script lang="ts">
  import IconTrash from '@lucide/svelte/icons/trash-2';
  import IconPencil from '@lucide/svelte/icons/pencil';
  import IconArrowRight from '@lucide/svelte/icons/arrow-right';
  import MetricForm from '$lib/components/metric/form.svelte';
  import type { Metric, MetricValue } from '$lib/types';
  import { formatDatetime } from '$lib/utils';

  interface CardProps {
    metric: Metric;
    metricValues: MetricValue[];
    onEdit: (metric: Metric) => void;
    onDelete: (metric: Metric) => void;
  };

  let { metric, metricValues, onDelete, onEdit }: CardProps = $props();

  let relevantMetricValues: MetricValue[] = $derived.by(() => {
    let mvs = metricValues.filter(mv => mv.id === metric.id)
    mvs.sort((a, b) => (a.datetime < b.datetime));
    return mvs;
  });

  let latestValue: number | null = $derived.by(() => {
    if (relevantMetricValues.length > 0) {
      return relevantMetricValues[0].value;
    } else {
      return null;
    }
  });

  let isEditFormOpen = $state(false);

  function handleSave(editedMetric: Metric) {
    onEdit(editedMetric);
    isEditFormOpen = false;
  }
</script>

<div class="rounded-md shadow-md py-5">
  <article class="space-y-2">
    <header class="flex items-center justify-between">
      <span class="text-sm bg-gray-100 dark:bg-gray-800 my-2 p-1 px-5">
        {metric.id}
      </span>
      <span class="pr-2">
        <button type="button" onclick={() => isEditFormOpen = true} class="btn-icon preset-filled"><IconPencil size={18} /></button>
        <button type="button" onclick={() => onDelete(metric)} class="btn-icon preset-outlined"><IconTrash size={18} /></button>
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
    </div>
    <div class="px-5">
      {#if relevantMetricValues}
        <ul>
          {#each relevantMetricValues as mv}
            <li>
              <span>{ formatDatetime(mv.datetime) }:</span>
              <span class="font-bold">{ mv.value } { metric.unit }</span>
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
  <MetricForm
    metric={ metric }
    title='Edit metric'
    onClose={() => isEditFormOpen = false }
    onSave={ handleSave }
    />
{/if}
