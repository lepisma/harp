<script lang="ts">
  import type { Metric } from '$lib/types';
  import { fly } from 'svelte/transition';
  import IconX from '@lucide/svelte/icons/x';

  interface FormProps {
    onSave: (metric: Metric) => void;
    onClose: () => void;
    title?: string;
    metric?: Metric | null;
  };

  let { onSave, onClose, title = 'New Metric', metric = null }: FormProps = $props();

  let id: string = $state('');
  let name: string = $state('');
  let unit: string = $state('');
  let tags: string[] = $state([]);
  let range: [number | undefined, number | undefined] | undefined = $state([undefined, undefined]);
  let healthyRange: [number | undefined, number | undefined] | undefined = $state([undefined, undefined]);

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
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
    <button class="absolute top-2 right-2 btn btn-sm" onclick={onClose}>
      <IconX />
    </button>

    <h2 class="h5 mb-5">{ title }</h2>

    <form onsubmit={ handleSave }>
      <label class="label mb-4">
        <span class="label-text">Metric Name & ID</span>
        <span class="flex gap-2">
          <input type="text" required id="name" class="input text-sm" placeholder="Name" bind:value={name} />
          <input type="text" required id="id" class="input text-sm" placeholder="Short ID" bind:value={id} />
        </span>
      </label>

      <label class="label mb-4">
        <span class="label-text">Unit & Range</span>
        <span class="flex gap-2 items-center">
          <span class="text-sm">From</span>
          <input type="number" value={range[0] === undefined ? '' : range[0]} class="input text-sm" oninput={(e) => {
            let num = parseFloat(e.target.value);
            let val = isNan(num) ? undefined : num;
            if (range !== undefined) {
              range[0] = val;
            } else {
              range = [val, undefined];
            }
          }} />
          <span class="text-sm">to</span>
          <input type="number" value={range[1] === undefined ? '' : range[1]} class="input text-sm" oninput={(e) => {
            let num = parseFloat(e.target.value);
            let val = isNan(num) ? undefined : num;
            if (range !== undefined) {
              range[1] = val;
            } else {
              range = [undefined, val];
            }
          }} />
          <input type="text" id="unit" required class="input text-sm" placeholder="Unit" bind:value={unit} />
        </span>
      </label>

      <label class="label mb-4">
        <span class="label-text">Tags</span>
        <input type="text" id="tags" class="input text-sm" oninput={(e) => {
        tags = e.target.value.split(',').map(text => text.trim()).filter(tag => tag !== '');
        }} />
      </label>

      <div class="flex justify-end gap-2">
        <button type="submit" class="btn preset-filled">Save</button>
        <button type="button" class="btn preset-outlined" onclick={ onClose }>Discard</button>
      </div>
    </form>
  </div>
</div>
