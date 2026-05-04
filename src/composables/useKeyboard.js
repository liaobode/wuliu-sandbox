import { onMounted, onUnmounted } from 'vue'
import { useSimulationStore } from '../stores/useSimulationStore.js'

export function useKeyboard(emits) {
  const store = useSimulationStore()
  const { state } = store

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault()
      store.undo()
      return
    }

    if (e.key === 'Escape') {
      emits.esc()
      return
    }

    if (e.key === '?') {
      emits.toggleHelp()
      return
    }

    switch (e.key) {
      case '1': state.currentTool = 'conveyor-1'; state.lastConveyorDir = 1; break
      case '2': state.currentTool = 'conveyor-2'; state.lastConveyorDir = 2; break
      case '3': state.currentTool = 'conveyor-3'; state.lastConveyorDir = 3; break
      case '4': state.currentTool = 'conveyor-4'; state.lastConveyorDir = 4; break
      case '!': state.currentTool = 'chain-1'; state.lastConveyorDir = 1; break
      case '@': state.currentTool = 'chain-2'; state.lastConveyorDir = 2; break
      case '#': state.currentTool = 'chain-3'; state.lastConveyorDir = 3; break
      case '$': state.currentTool = 'chain-4'; state.lastConveyorDir = 4; break
      case 'e': case 'E': state.currentTool = 'eraser'; break
      case 'b': case 'B': state.currentTool = 'box'; break
      case 't': case 'T': state.currentTool = 'chain-transfer'; break
      case 'p': case 'P': state.currentTool = 'pallet'; break
      case 'f': case 'F': state.currentTool = 'spawner'; break
      case 'r': case 'R': state.currentTool = 'receiver'; break
      case 'd': case 'D': state.currentTool = 'diverter'; break
      case ' ':
        if (!state.spaceHeld) {
          e.preventDefault()
          state.spaceHeld = true
          state._spaceDragged = false
        }
        break
      case 's': case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          emits.save()
        }
        break
    }
  }

  function onKeyUp(e) {
    if (e.key === ' ') {
      if (!state._spaceDragged) {
        emits.togglePlay()
      }
      state.spaceHeld = false
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
  })
}
