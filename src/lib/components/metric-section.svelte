<script lang="ts">
  import type { Database } from '$lib/db';
  import { saveProfile } from '$lib/ops';
  import type { Metric, MetricValue } from '$lib/types';
  import type { Profile } from '$lib/types';
  import MetricForm from '$lib/components/metric-form.svelte';
  import MetricCard from '$lib/components/metric-card.svelte';
  import { profileMetricValues } from '$lib/utils';
  import IconPlus from '@lucide/svelte/icons/plus';

  interface Props {
    db: Database;
    profile: Profile;
  }

  let { db, profile }: Props = $props();

  let metrics: Metric[] = $derived(profile !== null ? profile.metadata.metrics : []);
  let metricValues: MetricValue[] = $derived(profile !== null ? profileMetricValues(profile) : []);
  let isMetricFormOpen = $state(false);

  async function handleNewMetric(metric: Metric) {
    profile.metadata.metrics.push(metric);
    await saveProfile(db, profile);

    isMetricFormOpen = false;
  }

  async function handleDeleteMetric(metric: Metric) {
    if (window.confirm('Do you really want to delete this metric?')) {
      profile.metadata.metrics = profile.metadata.metrics.filter(m => m.id !== metric.id);
      await saveProfile(db, profile);
    }
  }

  async function handleEditMetric(metric: Metric) {
    profile.metadata.metrics = profile.metadata.metrics.map(m => (m.id === metric.id) ? metric : m);
    await saveProfile(db, profile);
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
