<template>
  <div v-if="visible" class="fixed inset-0 z-50">
    <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
    <div class="flex items-center justify-center w-full h-full">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 relative">
        <h2 class="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">📊 仿真数据报告</h2>
        <div class="text-sm text-gray-700 space-y-2">
          <p>运行耗时: <span class="font-bold">{{ timeSec }}</span> 秒</p>
          <p>完成输送: <span class="font-bold">{{ deliveredCount }}</span> 个货物</p>
          <p class="pt-2 border-t border-gray-200">
            吞吐率: <span class="text-xl font-black text-indigo-600">{{ rate }}</span> 个/秒
          </p>
          <div class="pt-2 border-t border-gray-200">
            <p v-for="r in receiverStats" :key="r.key">📥 收货站({{ r.x }},{{ r.y }}): <span class="font-bold">{{ r.count }}</span> 个</p>
            <p v-if="receiverStats.length === 0" class="text-gray-400">无收货站数据</p>
          </div>
        </div>
        <button class="mt-4 w-full p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors" @click="$emit('close')">确 定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  timeMs: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  receiverStats: { type: Array, default: () => [] }
})
defineEmits(['close'])

const timeSec = computed(() => (props.timeMs / 1000).toFixed(1))
const rate = computed(() => {
  const sec = props.timeMs / 1000
  return sec > 0 ? (props.deliveredCount / sec).toFixed(2) : '0.00'
})
</script>
