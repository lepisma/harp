<script lang="ts">
  import { fly } from 'svelte/transition';

  let { onSave, onClose } = $props();

  let text = $state('');
  let tagsText = $state('');
  let datetime = $state(formatDateForInput(new Date()));

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleSave() {
    onSave({
      text,
      tags: tagsText.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      datetime: new Date(datetime)
    });
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

    <h2 class="h5 mb-5">New Entry</h2>

    <label class="label mb-4">
      <span class="label-text">Datetime</span>
      <input type="datetime-local" id="datetime" class="input" bind:value={datetime} />
    </label>

    <label class="label mb-4">
      <span class="label-text">Textarea</span>
      <textarea class="textarea" id="text" bind:value={text} rows="4" placeholder="Text goes here"></textarea>
    </label>

    <label class="label mb-4">
      <span class="label-text">Tags (comma-separated)</span>
      <input class="input" type="text" id="tags" bind:value={tagsText} placeholder="Input" />
    </label>

    <div class="flex justify-end">
      <button type="button" class="btn variant-filled-primary" onclick={handleSave}>Save</button>
    </div>
  </div>
</div>
