<template>
  <div>
    <div v-if="!fields">
      <el-select
        v-model="form[field.property]"
        multiple
        filterable
        allow-create
        default-first-option
        clearable
        :placeholder="$t('Type and press Enter to add')"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div v-else>
      <el-button
        type="primary"
        size="small"
        icon="el-icon-plus"
        @click="
          if (
            form[field.property] === undefined ||
            form[field.property] == ''
          ) {
            form[field.property] = [];
          }
          form[field.property].push({});
        "
      >
        {{ $t('Add') }}
      </el-button>

      <div
        v-for="(property, index) in form[field.property]"
        :key="`${property}-${index}`"
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
    type_options: {
      // Single fields
      options: [
        { value: 'value_1', label: 'Label_1' },
        { value: 'value_2', label: 'Label_2' },
        { value: 'value_n', label: 'Label_n' }
      ]
      // Complex fields
      fields: [
        { property: 'picture', type: 'image', field_options: { label: 'Picture' }},
        { property: 'link', type: 'input', field_options: { label: 'Url' }},
        { property: 'listOrder', type: 'input', field_options: { label: 'List order' }}
      ]
    },
    default_value: []  // Default value must be set.
  }
*/

import FormAdmin from '@/components/EasyAdmin/FormAdmin'

export default {
  components: { FormAdmin },
  props: {
    form: {
      type: Object,
      default: () => {
        return {}
      }
    },
    field: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      fields: this.field?.type_options?.fields,
      options: this.field?.type_options?.options ?? []
    }
  },
  created() {
    if (!Array.isArray(this.form[this.field.property])) {
      this.form[this.field.property] = []
    }
  }
}
</script>
