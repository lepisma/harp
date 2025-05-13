<script lang="ts">
  import type { Metric, MetricValue } from '$lib/types';
  import MetricForm from '$lib/components/metric-form.svelte';
  import MetricCard from '$lib/components/metric-card.svelte';
  import IconPlus from '@lucide/svelte/icons/plus';

  interface Props {
    metrics: Metric[];
    metricValues: MetricValue[];
    onChange: () => Promise<void>;
  }

  let { metrics = $bindable(), metricValues, onChange }: Props = $props();
  let isMetricFormOpen = $state(false);

  async function handleNewMetric(metric: Metric) {
    metrics.push(metric);
    await onChange();

    isMetricFormOpen = false;
  }

  async function handleDeleteMetric(metric: Metric) {
    if (window.confirm('Do you really want to delete this metric?')) {
      metrics = metrics.filter(m => m.id !== metric.id);
      await onChange();
    }
  }

  async function handleEditMetric(metric: Metric) {
    metrics = metrics.map(m => (m.id === metric.id) ? metric : m);
    await onChange();
  }
</script>

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
    <MetricCard
      metric={ metric }
      metricValues={ metricValues }
      onDelete={ handleDeleteMetric }
      onEdit={ handleEditMetric }
      />
  {/each}
</div>
