<template>
  <div>
    <el-button
      type="primary"
      size="small"
      icon="el-icon-plus"
      @click="
        if(
          form[field.property] === undefined
          || form[field.property] === ''
        ) {
          form[field.property] = []
        }
        form[field.property].push({})
      "
    >
      增加
    </el-button>
    <div
      v-for="(property, index) in form[field.property]"
      :key="index"
    >
      <form-admin
        v-model="form[field.property][index]"
        entity-conf="Option"
        :fields="fields"
      >
        <template v-slot:title><span /></template>
        <template v-slot:action><span /></template>
      </form-admin>

      <p circle style="text-align: right">
        <el-button
          type="danger"
          size="small"
          icon="el-icon-delete"
          circle
          @click="form[field.property].splice(index, 1)"
        />
      </p>
    </div>
  </div>
</template>

<script>
/**
 * @description Array fields
 * @example
 */
/*
  { property: 'pictures',
    type: 'array',     // Auto detected.
    type_options: { fields: [
      { property: 'picture', type: 'image', field_options: { label: 'Picture' }},
      { property: 'link', type: 'input', field_options: { label: 'Url' }},
      { property: 'listOrder', type: 'input', field_options: { label: 'List order' }}
    ] },
    default_value: []  // Default value must be set.
  }
*/

import FormAdmin from '@/components/EasyAdmin/FormAdmin'

export default {
  components: { FormAdmin },
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      fields: this.field?.type_options?.fields ??
        [{ property: 'common', type: 'input', field_options: { label: '默认' }}]
    }
  }
}
</script>
