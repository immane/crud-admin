<template>
  <div>
    <el-select
      v-model="form[field.property]"
      filterable
      clearable
      placeholder="Please select"
      v-bind="field.type_options"
      v-on="field.type_events || {}"
    >
      <el-option
        v-for="item in field.type_options?.options || []"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script>
/**
 * @description Choice field for string or integer fields
 * @example
 */
/*
  { property: 'select',
    type: 'select',
    type_options: {
      'allow-create': true,
      options: [
        { value: 'Value1', label: 'Label1' },
        { value: 'Value2', label: 'Label2' }
      ]
    }
  }
*/
export default {
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  }
}
</script>
