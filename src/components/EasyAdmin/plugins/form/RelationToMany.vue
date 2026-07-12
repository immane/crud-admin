<template>
  <div>
    <el-select
      v-model="form[field.property]"
      filterable
      clearable
      placeholder="请选择"
      v-bind="field.type_options"
      multiple
      v-on="field.type_events || {}"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <router-link
      v-if="field.creationUrl"
      :to="{ path: field.creationUrl }"
    >
      <el-button
        type="success"
        icon="el-icon-plus"
        circle
        size="small"
        style="margin: 0px 10px;"
      />
    </router-link>
  </div>
</template>

<script>
import RelationToOne from './RelationToOne.vue'
export default {
  extends: RelationToOne,
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
  },
  created() {
    if (!Array.isArray(this.form[this.field.property])) {
      this.form[this.field.property] = []
    }
  }
}
</script>
