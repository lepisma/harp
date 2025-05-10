<script lang="ts">
  import type { Metric } from '$lib/types';
  import { fly } from 'svelte/transition';

  let { onSave, onClose, title = 'New Metric', metric = null } = $props();

  let id = $state('');
  let name = $state('');
  let unit = $state('');
  let tags: string[] = $state([]);
  let range: [number, number] = $state([0, 0]);
  let healthyRange: [number, number] = $state([0, 0]);

  if (metric !== null) {
    id = metric.id;
    name = metric.name;
    unit = metric.unit;
    tags = metric.tags;
    range = metric.range;
    healthyRange = metric.healthyRange;
  }

  function handleSave() {
    let editedMetric: Metric = {
      id,
      name,
      tags,
      unit,
      range,
      healthyRange
    };
    metric = editedMetric;
    onSave(metric);
  }
</script>

<div
  class="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center"
  transition:fly={{ y: -100, duration: 300 }}
  >
  <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
    <button class="absolute top-2 right-2 btn btn-sm" onclick={onClose}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
        <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <h2 class="h5 mb-5">{ title }</h2>

    <label class="label mb-4">
      <span class="label-text">Metric Name & ID</span>
      <span class="flex gap-2">
        <input type="text" id="name" class="input text-sm" placeholder="Name" bind:value={name} />
        <input type="text" id="id" class="input text-sm" placeholder="Short ID" bind:value={id} />
      </span>
    </label>

    <label class="label mb-4">
      <span class="label-text">Unit & Range</span>
      <span class="flex gap-2 items-center">
        <span class="text-sm">From</span>
        <input type="number" id="tags" class="input text-sm" oninput={(e) => range[0] = parseFloat(e.target.value)} />
        <span class="text-sm">to</span>
        <input type="number" id="tags" class="input text-sm" oninput={(e) => range[1] = parseFloat(e.target.value)} />
        <input type="text" id="unit" class="input text-sm" placeholder="Unit" bind:value={unit} />
      </span>
    </label>

    <label class="label mb-4">
      <span class="label-text">Tags</span>
      <input type="text" id="tags" class="input text-sm" oninput={(e) => {
      tags = e.target.value.split(',').map(text => text.trim()).filter(tag => tag !== '');
      }} />
    </label>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn preset-filled" onclick={handleSave}>Save</button>
      <button type="button" class="btn preset-outlined" onclick={onClose}>Discard</button>
    </div>
  </div>
</div>
