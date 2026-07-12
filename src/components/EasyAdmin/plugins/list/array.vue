<template>
  <div :style="{ display: 'flex', flexWrap: 'wrap' }">
    <template v-for="(item, index) in visibleItems">
      <el-tag :key="index" :style="{ margin: '2px' }">
        {{ item.__toString || item }}
      </el-tag>
    </template>

    <template v-if="overflowCount > 0">
      <el-tooltip placement="bottom" effect="light">
        <el-tag :style="{ margin: '2px' }">
          ...
        </el-tag>
        <div slot="content">
          <div
            v-for="(item, index) in value"
            :key="index"
            style="max-width: 50vw; overflow-y: scroll; display: flex; flex-wrap: wrap;"
          >
            <el-tag :style="{ margin: '2px' }">
              {{ item.__toString || item }}
            </el-tag>
          </div>
        </div>
      </el-tooltip>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: Array, default: () => [] },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  computed: {
    visibleItems() {
      if (!Array.isArray(this.value)) return []
      return this.value.slice(0, 5)
    },
    overflowCount() {
      if (!Array.isArray(this.value)) return 0
      return Math.max(0, this.value.length - 5)
    }
  }
}
</script>
