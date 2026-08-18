<template>
  <div class="flow-root">
    <div class="column">
      <div class="node">Start</div>
      <div class="arrow">↓</div>
      <div class="node">Step A</div>
      <div class="arrow">↓</div>
      <div class="node">Step B</div>
    </div>
    <div class="controls">
      <button @click="toggleDetails">Toggle details</button>
      <p v-if="showDetails">Details are shown for the flow.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowChart',
  data() {
    return { showDetails: false }
  },
  methods: {
    toggleDetails() { this.showDetails = !this.showDetails }
  }
}
</script>

<style scoped>
.flow-root { display:flex; gap:24px; align-items:flex-start }
.column { display:flex; flex-direction:column; align-items:center }
.node { background:#fff; border:1px solid #ccc; padding:16px 24px; border-radius:8px; min-width:140px; text-align:center }
.arrow { margin:8px 0; font-size:20px }
.controls { display:flex; flex-direction:column; gap:8px }
button { padding:8px 12px; border-radius:6px; border:1px solid #888; background:#f6f6f6 }
</style>
