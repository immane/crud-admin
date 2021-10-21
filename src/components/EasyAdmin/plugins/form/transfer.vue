<template>
  <el-transfer
    v-model="form[field.property]"
    class="transfer-field"
    filterable
    :titles="['待选列表', '已选列表']"
    filter-placeholder="请选择"
    :props="{
      key: 'value',
      label: 'label'
    }"
    :data="options"
    v-bind="field.type_options"
    v-on="field.type_events"
  />
</template>

<script>
import RelationToMany from './RelationToMany.vue'
export default {
  extends: RelationToMany,
  props: {
    emPrefix: {
      type: String,
      default: ''
    },
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    },
    struct: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      // m2o or o2o options
      options: []
    }
  }
}
</script>

<style lang="scss">
.transfer-field {
  .el-transfer-panel {
      width: 300px;
      height: 400px;
  }
  .el-transfer-panel__list.is-filterable {
      height: 290px;
  }
}
</style>
