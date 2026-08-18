<template>
  <div class="flow-canvas">
    <svg class="connectors" :width="width" :height="height">
      <line v-for="(c, i) in connectors" :key="i"
            :x1="getCenter(findNode(c.from)).x"
            :y1="getCenter(findNode(c.from)).y"
            :x2="getCenter(findNode(c.to)).x"
            :y2="getCenter(findNode(c.to)).y"
            stroke="#64748b" stroke-width="2" stroke-linecap="round" />
    </svg>

    <FlowNode v-for="n in nodes" :key="n.id" :node="n" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import FlowNode from './FlowNode.vue'
const props = defineProps({ nodes: Array, connectors: Array })
const nodes = props.nodes
const connectors = props.connectors

const width = ref(1200)
const height = ref(800)

function findNode(id){
  return nodes.find(n=>n.id===id) || { x:0, y:0 }
}

function getCenter(node){
  // node width 160, height approx 48
  return { x: node.x + 80, y: node.y + 28 }
}

onMounted(()=>{
  // could compute canvas bounds from nodes
})
</script>

<style scoped>
.flow-canvas { position:relative; flex:1; background:linear-gradient(180deg,#0f172a, #071022); overflow:hidden }
.connectors { position:absolute; left:0; top:0 }
</style>
