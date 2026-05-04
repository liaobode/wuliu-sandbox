<template>
  <header class="bg-white border-b border-gray-200 z-20 shadow-sm flex-shrink-0">
    <div class="flex items-center h-12 px-4 gap-4">
      <h1 class="text-lg font-bold text-gray-800 flex items-center gap-2 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        物流仿真沙盒
      </h1>

      <div class="flex items-center gap-2">
        <button v-if="!state.isRunning" class="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-sm shadow-md transition-colors" @click="startSim">
          ▶️ 开始运行
        </button>
        <button v-else class="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold text-sm shadow-md transition-colors" @click="pauseSim">
          ⏸️ 暂停运行
        </button>
        <button v-if="state.isRunning || state.activeTimeMs > 0" class="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-sm shadow-md transition-colors" @click="stopSim">
          ⏹️ 结束并统计
        </button>
      </div>

      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span>速度:</span>
        <input type="range" min="0.1" max="50" step="0.1" :value="state.speed" @input="state.speed = +$event.target.value" class="w-20 accent-green-500">
        <input type="number" min="0.1" max="1000" step="0.1" :value="state.speed" @change="state.speed = +$event.target.value" class="w-14 px-1 text-right border border-gray-200 rounded text-green-600 font-medium text-xs focus:outline-none focus:border-green-500 bg-white">
        <span class="text-green-600 font-medium text-xs">x</span>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-gray-500 min-w-[3rem] text-right tabular-nums">{{ zoomPercent }}</span>
        <button class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 text-xs text-gray-500 transition-colors" title="重置视图" @click="$emit('resetView')">⟲</button>
        <button class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 text-xs text-gray-500 transition-colors" title="侧边栏" @click="state.sidebarVisible = !state.sidebarVisible">☰</button>
        <button class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 text-sm font-bold text-gray-500 transition-colors" title="快捷键帮助" @click="$emit('showHelp')">?</button>
      </div>
    </div>

    <div class="flex items-center h-12 px-4 gap-3 border-t border-gray-100 bg-gray-50">
      <div class="flex items-center gap-1">
        <template v-for="tool in tools" :key="tool.key">
          <div v-if="tool.separator" class="w-px h-6 bg-gray-300 mx-1"></div>
          <button v-else
            :class="['tool-btn flex flex-col items-center justify-center px-3 py-1 border rounded-lg text-xs', tool.key === state.currentTool ? 'active bg-blue-500 text-white border-blue-500' : tool.group === 'chain' ? 'border-zinc-300 hover:bg-zinc-50' : 'border-gray-200 hover:bg-gray-100']"
            @click="state.currentTool = tool.key; updateLastDir(tool.key)"
          >
            <span class="text-base leading-none">{{ tool.icon }}</span>
            <span class="text-[10px] leading-tight mt-0.5">{{ tool.label }}</span>
          </button>
        </template>
      </div>

      <div class="flex items-center gap-2 border-l border-gray-300 pl-3">
        <span class="text-xs text-gray-500 flex-shrink-0">预设:</span>
        <select class="text-xs p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400" @change="$emit('applyPreset', $event.target.value); $event.target.value = ''">
          <option value="">— 选择预设模板 —</option>
          <optgroup label="皮带机">
            <option value="straight">→ 直线输送</option>
            <option value="l-turn">↳ L型转弯</option>
            <option value="u-turn">↩ U型回绕</option>
            <option value="split">🔀 分流合流</option>
          </optgroup>
          <optgroup label="链条机">
            <option value="chain-straight">🔗 直线输送</option>
            <option value="chain-l-turn">🔗 L型转运</option>
            <option value="chain-wharf">🔗 双线月台</option>
          </optgroup>
        </select>
      </div>

      <div class="flex items-center gap-2 border-l border-gray-300 pl-3">
        <button class="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors"
          :class="state.showHeatMap ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-orange-100 text-orange-600 hover:bg-orange-50'"
          @click="state.showHeatMap = !state.showHeatMap">
          🗺️ 热力图: <span :class="state.showHeatMap ? 'text-green-600 font-bold' : ''">{{ state.showHeatMap ? '开' : '关' }}</span>
        </button>
        <button class="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100 transition-colors" @click="clearBoxes">📦 清理货物</button>
        <button class="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors" @click="clearGrid">🛤️ 清理输送机</button>
        <button class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors" @click="reset">🗑️ 清空全部</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useSimulationStore } from '../stores/useSimulationStore.js'

const store = useSimulationStore()
const { state } = store

const props = defineProps({ zoomPercent: { type: String, default: '100%' } })
const emit = defineEmits(['resetView', 'showHelp', 'applyPreset'])

const tools = [
  { key: 'conveyor-1', icon: '➡️', label: '向右', group: 'belt' },
  { key: 'conveyor-2', icon: '⬇️', label: '向下', group: 'belt' },
  { key: 'conveyor-3', icon: '⬅️', label: '向左', group: 'belt' },
  { key: 'conveyor-4', icon: '⬆️', label: '向上', group: 'belt' },
  { key: '__sep1__', separator: true },
  { key: 'chain-1', icon: '🔗→', label: '向右', group: 'chain' },
  { key: 'chain-2', icon: '🔗↓', label: '向下', group: 'chain' },
  { key: 'chain-3', icon: '🔗←', label: '向左', group: 'chain' },
  { key: 'chain-4', icon: '🔗↑', label: '向上', group: 'chain' },
  { key: 'chain-transfer', icon: '🔽', label: '移载', group: 'chain' },
  { key: '__sep2__', separator: true },
  { key: 'diverter', icon: '🔀', label: '分流', group: 'other' },
  { key: 'spawner', icon: '🏭', label: '发货', group: 'other' },
  { key: 'receiver', icon: '📥', label: '收货', group: 'other' },
  { key: 'box', icon: '📦', label: '放货', group: 'other' },
  { key: 'pallet', icon: '🟦', label: '托盘', group: 'other' },
  { key: 'eraser', icon: '🧹', label: '移除', group: 'other' }
]

function updateLastDir(tool) {
  if ((tool.startsWith('conveyor-') || tool.startsWith('chain-')) && tool !== 'chain-transfer') {
    state.lastConveyorDir = parseInt(tool.split('-')[1])
  }
}

function startSim() {
  store._hideStats?.()
  state.activeTimeMs = 0
  state.simTime = 0
  state.deliveredCount = 0
  state.heatData = Array.from({ length: 48 }, () => Array(64).fill(0))
  store.startSimulation()
}

function pauseSim() {
  store.pauseSimulation()
}

function stopSim() {
  // Will be handled by the parent's watcher
  emit('stopSim')
}

function clearBoxes() { emit('clearBoxes') }
function clearGrid() { emit('clearGrid') }
function reset() { emit('reset') }
</script>

<style scoped>
.tool-btn { transition: all 0.2s; cursor: pointer; }
</style>
