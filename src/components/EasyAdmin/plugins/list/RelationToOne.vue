<template>
  <router-link v-if="detailRoute" class="el-link" :to="detailRoute">{{ displayValue }}</router-link>
  <span v-else>{{ displayValue }}</span>
</template>

<script>
import entities from '@/configs/entities'
import { loadRelationRecords, relationLabel, resolveRelation } from '@/utils/relation'

export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  data() {
    return { resolvedRecord: null }
  },
  computed: {
    displayValue() {
      return relationLabel(this.displayRecord, this.value)
    },
    targetEntity() {
      return this.relation?.name
    },
    relation() {
      return resolveRelation(this.field, this.struct, entities)
    },
    displayRecord() {
      return this.value && typeof this.value === 'object' ? this.value : this.resolvedRecord
    },
    detailRoute() {
      if (this.displayRecord?.id == null || !this.targetEntity) return null
      const name = `${this.targetEntity}Detail`
      return this.$router.hasRoute(name) ? { name, params: { id: this.displayRecord.id }} : null
    }
  },
  watch: {
    value() {
      this.resolveRecord()
    }
  },
  created() {
    this.resolveRecord()
  },
  methods: {
    async resolveRecord() {
      this.resolvedRecord = null
      if (!this.relation || this.relation.valueKey !== 'uuid' || typeof this.value !== 'string' || !this.value) return
      const value = this.value
      const records = await loadRelationRecords(this.relation, this.em?.prefix)
      if (this.value === value) this.resolvedRecord = records.find(record => record.uuid === value) || null
    }
  }
}
</script>

<style scoped>
el-link {
  color: #409eff;
}
</style>
