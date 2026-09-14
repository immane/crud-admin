<template>
  <div :style="{ display: 'flex', flexWrap: 'wrap' }">
    <template v-for="(item, index) in visibleItems" :key="index">
      <router-link v-if="detailRoute(item)" :to="detailRoute(item)">
        <el-tag :style="{ margin: '2px' }">{{ displayValue(item) }}</el-tag>
      </router-link>
      <el-tag v-else :style="{ margin: '2px' }">{{ displayValue(item) }}</el-tag>
    </template>

    <template v-if="overflowCount > 0">
      <el-tooltip placement="bottom" effect="light">
        <el-tag :style="{ margin: '2px' }">
          ...
        </el-tag>
        <template #content>
          <div
            v-for="(item, index) in value"
            :key="index"
            style="max-width: 50vw; overflow-y: scroll; display: flex; flex-wrap: wrap;"
          >
            <router-link v-if="detailRoute(item)" :to="detailRoute(item)">
              <el-tag :style="{ margin: '2px' }">{{ displayValue(item) }}</el-tag>
            </router-link>
            <el-tag v-else :style="{ margin: '2px' }">{{ displayValue(item) }}</el-tag>
          </div>
        </template>
      </el-tooltip>
    </template>
  </div>
</template>

<script>
import entities from '@/configs/entities'
import { loadRelationRecords, relationLabel, relationValue, resolveRelation } from '@/utils/relation'

export default {
  props: {
    value: { type: Array, default: () => [] },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  data() {
    return { resolvedRecords: [] }
  },
  computed: {
    visibleItems() {
      if (!Array.isArray(this.value)) return []
      return this.value.slice(0, 5)
    },
    overflowCount() {
      if (!Array.isArray(this.value)) return 0
      return Math.max(0, this.value.length - 5)
    },
    targetEntity() {
      return this.relation?.name
    },
    relation() {
      return resolveRelation(this.field, this.struct, entities)
    }
  },
  watch: {
    value() {
      this.resolveRecords()
    }
  },
  created() {
    this.resolveRecords()
  },
  methods: {
    displayValue(item) {
      return relationLabel(this.resolveRecord(item), item)
    },
    resolveRecord(item) {
      if (item && typeof item === 'object') return item
      return this.resolvedRecords.find(record => relationValue(record, this.relation) === item) || null
    },
    detailRoute(item) {
      const record = this.resolveRecord(item)
      if (record?.id == null || !this.targetEntity) return null
      const name = `${this.targetEntity}Detail`
      return this.$router.hasRoute(name) ? { name, params: { id: record.id }} : null
    },
    async resolveRecords() {
      this.resolvedRecords = []
      if (!this.relation || this.relation.valueKey !== 'uuid' || !Array.isArray(this.value)) return
      const source = this.value
      const values = this.value.filter(value => typeof value === 'string')
      if (!values.length) return
      const records = await loadRelationRecords(this.relation, this.em?.prefix)
      if (this.value === source) this.resolvedRecords = records.filter(record => values.includes(record.uuid))
    }
  }
}
</script>
