<template>
  <el-transfer
    v-model="form[field.property]"
    class="transfer-field"
    filterable
    :titles="[$t('Available'), $t('Selected')]"
    :filter-placeholder="$t('Please select')"
    :props="{
      key: 'value',
      label: 'label'
    }"
    :data="options"
    v-bind="field.type_options"
    v-on="field.type_events || {}"
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
  --el-transfer-panel-width: 280px;
  --el-transfer-panel-body-height: 240px;

  .el-transfer-panel {
      width: var(--el-transfer-panel-width);
      height: auto;
  }
  .el-transfer-panel__list.is-filterable {
      height: calc(100% - var(--el-transfer-filter-height) - 30px);
  }
  .el-transfer__buttons {
    padding: 0 12px;
  }
  .el-transfer-panel__item.el-checkbox {
    position: relative;
    height: auto;
    min-height: 32px;
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .el-transfer-panel__item.el-checkbox .el-checkbox__input {
    top: 50%;
    transform: translateY(-50%);
  }
  .el-transfer-panel__item.el-checkbox .el-checkbox__label {
    white-space: normal;
    text-overflow: clip;
    overflow: visible;
    min-height: 20px;
    line-height: 1.4;
  }
}
</style>
