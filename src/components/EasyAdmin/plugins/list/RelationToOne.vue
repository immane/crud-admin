<template>
  <router-link class="el-link" v-if="detailRoute" :to="detailRoute">{{ displayValue }}</router-link>
  <span v-else>{{ displayValue }}</span>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  computed: {
    displayValue() {
      if (this.value && this.value.__toString) {
        return this.value.__toString
      }
      return ''
    },
    targetEntity() {
      return this.field?.type_options?.entity_name?.split('\\').pop()
        || this.struct?.metadata?.targetEntity?.split('\\').pop()
    },
    detailRoute() {
      if (this.value?.id == null || !this.targetEntity) return null
      const name = `${this.targetEntity}Detail`
      return this.$router.hasRoute(name) ? { name, params: { id: this.value.id } } : null
    }
  }
}
</script>

<style scoped>
el-link {
  color: #409eff;
}
</style>