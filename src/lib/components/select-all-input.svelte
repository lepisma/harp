<script lang="ts">
  import IconCheck from '@lucide/svelte/icons/check';
  import IconSquareMinus from '@lucide/svelte/icons/square-minus';

  interface Props {
    allFilteredSelected: boolean;
    someFilteredSelected: boolean;
    nSelection: number;
    nHiddenSelection: number;
    entityName: string;
    entityNamePlural: string;
    handleSelectAll: () => void;
  };

  let {
    allFilteredSelected,
    someFilteredSelected,
    nSelection,
    nHiddenSelection,
    entityName,
    entityNamePlural,
    handleSelectAll
  }: Props = $props();
</script>

<div class="text-sm flex gap-2">
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
  <span>Selected { nSelection } {#if nSelection === 1} { entityName }{:else} { entityNamePlural }{/if} {#if nHiddenSelection > 0 } ({ nHiddenSelection } hidden) {/if}</span>
</div>
