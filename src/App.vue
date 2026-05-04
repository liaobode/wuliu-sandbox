<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <TopToolbar
      :zoomPercent="zoomPercent"
      @resetView="canvasRef?.fitToContent(); canvasRef?.draw()"
      @showHelp="helpVisible = true"
      @applyPreset="applyPreset"
      @stopSim="stopSim"
      @clearBoxes="clearBoxes"
      @clearGrid="clearGrid"
      @reset="resetAll"
    />

    <div class="flex flex-1 overflow-hidden">
      <SidePanel v-show="state.sidebarVisible"
        @save="storage.save()"
        @load="storage.load(); canvasRef?.draw()"
        @exportFile="storage.exportToFile()"
        @importFile="importFile"
      />

      <main class="flex-1 flex items-center justify-center relative bg-gray-900">
        <CanvasView ref="canvasRef" />
      </main>
    </div>

    <HelpModal :visible="helpVisible" @close="helpVisible = false" />
    <StatsModal
      :visible="statsVisible"
      :timeMs="state.activeTimeMs"
      :deliveredCount="state.deliveredCount"
      :receiverStats="receiverStats"
      @close="statsVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import TopToolbar from './components/TopToolbar.vue'
import SidePanel from './components/SidePanel.vue'
import CanvasView from './components/CanvasView.vue'
import HelpModal from './components/HelpModal.vue'
import StatsModal from './components/StatsModal.vue'
import { useSimulationStore } from './stores/useSimulationStore.js'
import { useKeyboard } from './composables/useKeyboard.js'
import { Storage, PresetsManager } from './data/index.js'

const store = useSimulationStore()
const { state } = store
const canvasRef = ref(null)

const helpVisible = ref(false)
const statsVisible = ref(false)
const receiverStats = ref([])

const storage = new Storage(store)
const presets = new PresetsManager(store)

const zoomPercent = computed(() => Math.round(state.view.zoom * 100) + '%')

function applyPreset(key) {
  if (key && presets.apply(key)) {
    canvasRef.value?.fitToContent()
    canvasRef.value?.draw()
  }
}

function stopSim() {
  if (!state.isRunning && state.activeTimeMs === 0) return

  state.isRunning = false

  // Compute receiver stats
  const stats = []
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 64; x++) {
      const cell = state.grid[y][x]
      if (cell && cell.type === 'receiver' && (cell.collected || 0) > 0) {
        stats.push({ key: `${x},${y}`, x, y, count: cell.collected })
      }
    }
  }
  receiverStats.value = stats
  statsVisible.value = true
}

function clearBoxes() {
  store.clearBoxes()
  statsVisible.value = false
  canvasRef.value?.draw()
}

function clearGrid() {
  state.grid = Array.from({ length: 48 }, () => Array(64).fill(0))
  canvasRef.value?.draw()
}

function resetAll() {
  store.reset()
  statsVisible.value = false
  canvasRef.value?.draw()
}

async function importFile(e) {
  const file = e.target.files[0]
  if (!file) return
  await storage.importFromFile(file)
  canvasRef.value?.draw()
  e.target.value = ''
}

onMounted(() => {
  if (storage.load()) {
    canvasRef.value?.draw()
  }
})

// Keyboard shortcuts
useKeyboard({
  esc() {
    helpVisible.value = false
    statsVisible.value = false
    state.currentTool = 'select'
    canvasRef.value?.updateCursor()
  },
  toggleHelp() { helpVisible.value = !helpVisible.value },
  togglePlay() {
    if (state.isRunning) {
      state.isRunning = false
    } else {
      statsVisible.value = false
      state.activeTimeMs = 0
      state.simTime = 0
      state.deliveredCount = 0
      state.heatData = Array.from({ length: 48 }, () => Array(64).fill(0))
      state.isRunning = true
    }
  },
  save() { storage.save() }
})

// Stop simulation when state changes
watch(() => state.isRunning, (val) => {
  if (!val) {
    // Pause handled by togglePlay, stop handled by stopSim
  }
})
</script>

<style>
body { margin: 0; background-color: #111827; }
</style>
