<template>
  <div v-if="visible" class="fixed inset-0 z-50">
    <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
    <div class="flex items-center justify-center w-full h-full">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative">
        <h2 class="text-lg font-bold text-gray-800 mb-4">⌨️ 快捷键</h2>
        <div class="space-y-3 text-sm">
          <div>
            <h3 class="font-semibold text-gray-500 text-xs mb-1">建设工具</h3>
            <div class="grid grid-cols-2 gap-1">
              <div><span class="kbd">1</span> 向右输送</div>
              <div><span class="kbd">2</span> 向下输送</div>
              <div><span class="kbd">3</span> 向左输送</div>
              <div><span class="kbd">4</span> 向上输送</div>
              <div><span class="kbd">D</span> 分流器</div>
              <div><span class="kbd">F</span> 发货机</div>
              <div><span class="kbd">R</span> 收货站</div>
              <div><span class="kbd">B</span> 放货</div>
              <div><span class="kbd">E</span> 移除</div>
            </div>
          </div>
          <div>
            <h3 class="font-semibold text-gray-500 text-xs mb-1">仿真控制</h3>
            <div class="grid grid-cols-2 gap-1">
              <div><span class="kbd">Space</span> 暂停/继续</div>
              <div><span class="kbd">S</span> 保存</div>
              <div><span class="kbd">⌘Z</span> 撤销</div>
              <div><span class="kbd">?</span> 打开/关闭本面板</div>
              <div><span class="kbd">ESC</span> 回到观察模式</div>
            </div>
          </div>
        </div>
        <button class="mt-4 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors" @click="$emit('close')">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ visible: Boolean })
defineEmits(['close'])
</script>

<style scoped>
.kbd { display: inline-block; padding: 1px 5px; font-size: 10px; font-family: monospace; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; color: #374151; }
</style>
