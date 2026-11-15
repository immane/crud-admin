<template>
  <div class="record-dialog-host" :style="layoutStyle">
    <el-dialog
      v-bind="$attrs"
      :model-value="modelValue"
      :title="title"
      class="record-dialog"
      modal-class="record-dialog-overlay"
      @update:model-value="$emit('update:modelValue', $event)"
      @open="observeBounds"
      @closed="resetLayout"
    >
      <template #header="{ titleId, titleClass }">
        <span :id="titleId" :class="titleClass">{{ title }}</span>
        <button
          type="button"
          class="record-dialog-expand"
          :aria-label="$t(expanded ? 'Restore dialog size' : 'Expand to main area')"
          :title="$t(expanded ? 'Restore dialog size' : 'Expand to main area')"
          :aria-pressed="expanded"
          @click="expanded = !expanded"
        >
          <el-icon><CopyDocument v-if="expanded" /><FullScreen v-else /></el-icon>
        </button>
      </template>
      <div class="record-dialog-content">
        <div class="record-dialog-scroll">
          <slot />
        </div>
      </div>
      <button
        v-if="!expanded"
        type="button"
        class="record-dialog-resize"
        :aria-label="$t('Resize dialog')"
        :title="$t('Resize dialog')"
        @pointerdown="startResize"
        @keydown="resizeWithKeyboard"
      >◢</button>
      <template #footer>
        <slot name="footer" />
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { CopyDocument, FullScreen } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

export default {
  name: 'RecordDialog',
  components: { CopyDocument, FullScreen, ElIcon },
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    title: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  data() {
    return { expanded: false, size: null, bounds: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }}
  },
  computed: {
    layoutStyle() {
      const { left, top, width, height } = this.bounds
      const maxWidth = Math.max(0, width - 24)
      const maxHeight = Math.max(0, height - 24)
      return {
        '--record-left': `${left}px`,
        '--record-top': `${top}px`,
        '--record-area-width': `${width}px`,
        '--record-area-height': `${height}px`,
        '--record-width': `${this.expanded ? width : Math.min(this.size?.width ?? 1040, maxWidth)}px`,
        '--record-height': this.expanded ? `${height}px` : this.size ? `${Math.min(this.size.height, maxHeight)}px` : 'auto',
        '--record-max-height': `${this.expanded ? height : maxHeight}px`,
        '--record-radius': this.expanded ? '0' : '12px'
      }
    }
  },
  beforeUnmount() {
    this.stopObserving()
  },
  methods: {
    updateBounds() {
      const rect = document.querySelector('.app-main')?.getBoundingClientRect()
      const left = Math.max(0, Math.min(rect?.left ?? 0, window.innerWidth))
      const top = Math.max(0, Math.min(rect?.top ?? 0, window.innerHeight))
      this.bounds = {
        left, top,
        width: Math.max(0, Math.min(rect?.right ?? window.innerWidth, window.innerWidth) - left),
        height: Math.max(0, Math.min(rect?.bottom ?? window.innerHeight, window.innerHeight) - top)
      }
    },
    observeBounds() {
      this.stopObserving()
      this.updateBounds()
      window.addEventListener('resize', this.updateBounds)
      window.addEventListener('scroll', this.updateBounds, true)
      document.addEventListener('transitionend', this.updateBounds)
      const main = document.querySelector('.app-main')
      if (main && typeof ResizeObserver !== 'undefined') {
        this.boundsObserver = new ResizeObserver(this.updateBounds)
        this.boundsObserver.observe(main)
      }
    },
    stopObserving() {
      this.endResize?.()
      this.boundsObserver?.disconnect()
      window.removeEventListener('resize', this.updateBounds)
      window.removeEventListener('scroll', this.updateBounds, true)
      document.removeEventListener('transitionend', this.updateBounds)
    },
    resetLayout() {
      this.stopObserving()
      this.expanded = false
      this.size = null
    },
    setSize(width, height) {
      this.size = {
        width: Math.min(Math.max(360, width), Math.max(0, this.bounds.width - 24)),
        height: Math.min(Math.max(240, height), Math.max(0, this.bounds.height - 24))
      }
    },
    startResize(event) {
      if (event.button !== 0 || this.expanded) return
      event.preventDefault()
      const rect = event.currentTarget.closest('.el-dialog').getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      const move = e => {
        if (e.pointerId !== event.pointerId) return
        // Both edges move equally to keep the dialog centered.
        this.setSize(rect.width + 2 * (e.clientX - startX), rect.height + 2 * (e.clientY - startY))
      }
      const end = e => {
        if (e.pointerId === event.pointerId) this.endResize()
      }
      this.endResize?.()
      this.endResize = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
        window.removeEventListener('blur', this.endResize)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', end)
      window.addEventListener('blur', this.endResize)
    },
    resizeWithKeyboard(event) {
      const directions = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }
      const delta = directions[event.key]
      if (!delta || this.expanded) return
      event.preventDefault()
      const rect = event.currentTarget.closest('.el-dialog').getBoundingClientRect()
      this.setSize(rect.width + delta[0], rect.height + delta[1])
    }
  }
}
</script>

<style>
.record-dialog-overlay.el-overlay {
  inset: var(--record-top) auto auto var(--record-left);
  width: var(--record-area-width);
  height: var(--record-area-height);
}
.record-dialog-overlay .el-overlay-dialog {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.record-dialog-overlay .el-dialog.record-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--record-width) !important;
  height: var(--record-height);
  max-height: var(--record-max-height);
  margin: auto !important;
  overflow: hidden;
  border-radius: var(--record-radius);
}
.record-dialog-overlay .el-dialog.record-dialog .el-dialog__header {
  flex-shrink: 0;
  padding-right: 96px;
}
.record-dialog-overlay .el-dialog.record-dialog .el-dialog__body {
  /* Anchor the resize grip to the dialog frame, not the body or footer. */
  position: static;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.record-dialog-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.record-dialog-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.record-dialog-overlay .el-dialog.record-dialog .el-dialog__footer {
  flex-shrink: 0;
  /* Keep footer actions clear of the outer corner grip, including on mobile. */
  padding-right: 24px;
}
.record-dialog .record-dialog-expand {
  position: absolute;
  top: 18px;
  right: 58px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 18px;
}
.record-dialog-expand:hover {
  background: var(--el-fill-color-light);
}
.record-dialog .record-dialog-resize {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 11;
  display: block;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: nwse-resize;
  touch-action: none;
  user-select: none;
}
</style>
