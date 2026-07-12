<template>
  <span>
    <el-switch
      v-if="field.editable"
      v-model="scope.row[field.property]"
      active-color="#67C23A"
      inactive-color="#F56C6C"
      @change="onChange"
    />
    <el-tag v-else :type="value ? 'success' : 'danger'">
      {{ value ? 'Yes' : 'No' }}
    </el-tag>
  </span>
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
  methods: {
    onChange() {
      this.em.update(this.scope.row.id, {
        [this.field.property]: this.scope.row[this.field.property]
      }).then(() => {
        this.$message.success('Property updated successfully')
      })
    }
  }
}
</script>
