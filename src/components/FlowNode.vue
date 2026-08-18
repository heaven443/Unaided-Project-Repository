<template>
  <div class="flow-node" :style="style">
    <div class="node-title">{{ node.title }}</div>
  </div>
</template>

<script setup>
const props = defineProps({ node: Object })
const style = computed(() => ({ left: props.node.x + 'px', top: props.node.y + 'px' }))
</script>

<style scoped>
.flow-node { position:absolute; width:160px; padding:12px; background:linear-gradient(180deg,#fff,#f8fafc); border-radius:8px; box-shadow:0 6px 18px rgba(2,6,23,0.12); border:1px solid rgba(2,6,23,0.06) }
.node-title { font-weight:600 }
</style>
