<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xs font-semibold text-gray-500 mb-3">皮带输送机设置</h2>
      <div class="flex flex-col gap-3">
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>铺设长度 (m)</span>
            <span class="font-medium">{{ state.buildLength }}</span>
          </label>
          <input type="range" min="1" max="16" :value="state.buildLength" @input="state.buildLength = +$event.target.value" class="w-full mt-1 accent-blue-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between items-center">
            <span>输送机速度 (m/min)</span>
            <input type="number" min="1" max="600" step="1" :value="state.buildSpeed" @change="state.buildSpeed = +$event.target.value" class="w-14 px-1 text-right border border-gray-200 rounded text-amber-600 font-medium text-xs focus:outline-none focus:border-amber-500 bg-white">
          </label>
          <input type="range" min="10" max="240" step="10" :value="state.buildSpeed" @input="state.buildSpeed = +$event.target.value" class="w-full mt-1 accent-amber-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between items-center">
            <span>自动发货间隔 (秒)</span>
            <div class="flex items-center gap-1">
              <input type="number" min="0.1" max="60" step="0.1" :value="state.buildInterval" @change="state.buildInterval = +$event.target.value" class="w-14 px-1 text-right border border-gray-200 rounded text-emerald-600 font-medium text-xs focus:outline-none focus:border-emerald-500 bg-white">
              <span class="text-emerald-600 font-medium text-xs">s</span>
            </div>
          </label>
          <input type="range" min="0.1" max="20" step="0.1" :value="state.buildInterval" @input="state.buildInterval = +$event.target.value" class="w-full mt-1 accent-emerald-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between items-center">
            <span>转向移载时间 (秒)</span>
            <div class="flex items-center gap-1">
              <input type="number" min="0.0" max="10" step="0.5" :value="state.buildTransferTime" @change="state.buildTransferTime = +$event.target.value" class="w-14 px-1 text-right border border-gray-200 rounded text-purple-600 font-medium text-xs focus:outline-none focus:border-purple-500 bg-white">
              <span class="text-purple-600 font-medium text-xs">s</span>
            </div>
          </label>
          <input type="range" min="0" max="10" step="0.5" :value="state.buildTransferTime" @input="state.buildTransferTime = +$event.target.value" class="w-full mt-1 accent-purple-500">
        </div>
      </div>
    </div>

    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xs font-semibold text-gray-500 mb-3">链条输送机设置</h2>
      <div class="flex flex-col gap-3">
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>铺设长度 (m)</span>
            <span class="font-medium">{{ state.chainBuildLength }}</span>
          </label>
          <input type="range" min="1" max="16" :value="state.chainBuildLength" @input="state.chainBuildLength = +$event.target.value" class="w-full mt-1 accent-zinc-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">链条速度</label>
          <div class="flex gap-2">
            <button class="flex-1 py-1.5 text-xs rounded-lg border transition-colors"
              :class="state.chainBuildSpeed === 12 ? 'bg-zinc-500 text-white border-zinc-500' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
              @click="state.chainBuildSpeed = 12">12 m/min</button>
            <button class="flex-1 py-1.5 text-xs rounded-lg border transition-colors"
              :class="state.chainBuildSpeed === 30 ? 'bg-zinc-500 text-white border-zinc-500' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
              @click="state.chainBuildSpeed = 30">30 m/min</button>
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between items-center">
            <span>移载时间 (秒)</span>
            <div class="flex items-center gap-1">
              <input type="number" min="0.5" max="10" step="0.5" :value="state.chainBuildTransferTime" @change="state.chainBuildTransferTime = +$event.target.value" class="w-14 px-1 text-right border border-gray-200 rounded text-purple-600 font-medium text-xs focus:outline-none focus:border-purple-500 bg-white">
              <span class="text-purple-600 font-medium text-xs">s</span>
            </div>
          </label>
          <input type="range" min="0.5" max="10" step="0.5" :value="state.chainBuildTransferTime" @input="state.chainBuildTransferTime = +$event.target.value" class="w-full mt-1 accent-purple-500">
        </div>
      </div>
    </div>

    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xs font-semibold text-gray-500 mb-3">货物尺寸 (1px = 20mm)</h2>
      <div class="flex flex-col gap-3">
        <div class="text-[10px] text-amber-600 font-medium">📦 纸箱</div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>宽</span>
            <span class="font-medium">{{ state.boxWidth }}px ({{ (state.boxWidth * 20).toFixed(0) }}mm)</span>
          </label>
          <input type="range" min="8" max="70" step="2" :value="state.boxWidth" @input="state.boxWidth = +$event.target.value" class="w-full mt-1 accent-amber-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>长</span>
            <span class="font-medium">{{ state.boxHeight }}px ({{ (state.boxHeight * 20).toFixed(0) }}mm)</span>
          </label>
          <input type="range" min="8" max="70" step="2" :value="state.boxHeight" @input="state.boxHeight = +$event.target.value" class="w-full mt-1 accent-amber-500">
        </div>
        <div class="text-[10px] text-blue-600 font-medium mt-2">🟦 托盘</div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>宽</span>
            <span class="font-medium">{{ state.palletWidth }}px ({{ (state.palletWidth * 20).toFixed(0) }}mm)</span>
          </label>
          <input type="range" min="8" max="70" step="2" :value="state.palletWidth" @input="state.palletWidth = +$event.target.value" class="w-full mt-1 accent-blue-500">
        </div>
        <div>
          <label class="text-xs text-gray-500 flex justify-between">
            <span>长</span>
            <span class="font-medium">{{ state.palletHeight }}px ({{ (state.palletHeight * 20).toFixed(0) }}mm)</span>
          </label>
          <input type="range" min="8" max="70" step="2" :value="state.palletHeight" @input="state.palletHeight = +$event.target.value" class="w-full mt-1 accent-blue-500">
        </div>
      </div>
    </div>

    <div class="p-4">
      <h2 class="text-xs font-semibold text-gray-500 mb-3">数据管理</h2>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <button class="flex-1 flex items-center justify-center gap-1 p-2 text-xs text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-100 transition-colors" @click="$emit('save')">💾 保存</button>
          <button class="flex-1 flex items-center justify-center gap-1 p-2 text-xs text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-100 transition-colors" @click="$emit('load')">📂 加载</button>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 flex items-center justify-center gap-1 p-2 text-xs text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-100 transition-colors" @click="$emit('exportFile')">📤 导出</button>
          <button class="flex-1 flex items-center justify-center gap-1 p-2 text-xs text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-100 transition-colors" @click="importFileRef?.click()">📥 导入</button>
        </div>
        <input type="file" accept=".json" class="hidden" ref="importFileRef" @change="$emit('importFile', $event)">
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useSimulationStore } from '../stores/useSimulationStore.js'

const store = useSimulationStore()
const { state } = store
const emit = defineEmits(['save', 'load', 'exportFile', 'importFile'])

const importFileRef = ref(null)
</script>
