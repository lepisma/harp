<script lang="ts">
  let { datetime = $bindable() }: { datetime: Date } = $props();

  function formatDateForInput(dt: Date): string {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTimeForInput(dt: Date): string {
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');

    if (hours === '00' && minutes === '00') {
      return '';
    } else {
      return `${hours}:${minutes}`;
    }
  }

  function updateDateFromInput(input: string) {
    const [year, month, day] = input.split('-').map(Number);
    datetime = new Date(year, month - 1, day, datetime.getHours(), datetime.getMinutes(), datetime.getSeconds(), datetime.getMilliseconds());
  }

  function updateTimeFromInput(input: string) {
    if (input !== '') {
      const [hours, minutes] = input.split(':').map(Number);
      datetime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), hours, minutes, datetime.getSeconds(), datetime.getMilliseconds());
    }
  }
</script>

<div class="flex gap-2">
  <input
    type="date"
    required
    class="input text-sm"
    bind:value={() => formatDateForInput(datetime), updateDateFromInput}
  />

  <input
    type="time"
    class="input text-sm"
    bind:value={() => formatTimeForInput(datetime), updateTimeFromInput}
  />
</div>
