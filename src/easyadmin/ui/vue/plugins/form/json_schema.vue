<template>
  <div>
    <admin-skeleton v-if="loading" :rows="3" />
    <form-admin
      v-else-if="definition"
      v-model="form[field.property]"
      embedded
      :entity-conf="{ name: 'JsonSchema' }"
      :fields="definition.fields"
      :structure-override="definition.structure"
    />
    <json-editor v-else-if="failed" :form="form" :field="field" />
  </div>
</template>

<script>
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import FormAdmin from '@/easyadmin/ui/vue/FormAdmin'
import AdminSkeleton from '@/components/AdminSkeleton.vue'
import JsonEditor from './json.vue'
import { applySchemaDefaults, createSchemaForm, valueForSchemaValidation } from '@/utils/json-schema-form'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export default {
  components: { FormAdmin, JsonEditor, AdminSkeleton },
  inject: ['getFormAdmin'],
  props: {
    form: { type: Object, default: () => ({}) },
    field: { type: Object, default: () => ({}) }
  },
  data() {
    return { loading: true, failed: false, definition: null, schema: null, validateValue: null, validatedOnce: false }
  },
  computed: {
    schemaValue() {
      return this.form[this.field.property]
    }
  },
  watch: {
    schemaValue: {
      deep: true,
      handler() {
        // Nested inputs only notify the inner form items, so without an explicit
        // refresh the outer error state would stay red forever after the first
        // failure. Skip pristine fields: only refresh after a validation ran.
        if (!this.validatedOnce) return
        this.triggerValidate()
      }
    }
  },
  async created() {
    try {
      const source = this.field.type_options?.schema
      const admin = this.getFormAdmin?.()
      const schema = typeof source === 'function'
        ? await source({ entity: admin?.em?.name, id: admin?.id, property: this.field.property, form: this.form })
        : source
      const definition = createSchemaForm(schema, this.field.type_options?.fields)
      if (!definition) throw new Error('Unsupported JSON Schema')

      this.definition = definition
      this.schema = schema
      this.form[this.field.property] = applySchemaDefaults(schema, this.form[this.field.property])
      this.validateValue = schema.$id ? ajv.getSchema(schema.$id) || ajv.compile(schema) : ajv.compile(schema)
      admin?.registerFieldValidator(this.field.property, this.validateSchema, 'change')
    } catch (_) {
      this.failed = true
    } finally {
      this.loading = false
    }
  },
  methods: {
    triggerValidate() {
      let formAdmin = null
      if (this.getFormAdmin) {
        try {
          const inst = this.getFormAdmin()
          if (inst && inst.$refs) formAdmin = inst
        } catch (_) {
          // ignore and fall back to the component ancestors
        }
      }
      if (!formAdmin) {
        let parent = this.$parent
        while (parent && !(parent.$refs && parent.$refs.form)) parent = parent.$parent
        formAdmin = parent
      }
      if (!formAdmin || !formAdmin.$refs || !formAdmin.$refs.form) return
      const fieldName = this.field.property
      this.$nextTick(() => {
        try {
          const ret = formAdmin.$refs.form.validateField(fieldName)
          if (ret && typeof ret.catch === 'function') ret.catch(() => {})
        } catch (_) {
          // el-form stub or unmounted: nothing to refresh
        }
      })
    },
    validateSchema(_rule, value, callback) {
      this.validatedOnce = true
      if (value === undefined || value === null || value === '') {
        if (this.field.required) return callback(new Error(`${this.field.property} is required`))
        if (!this.schema?.required?.length || this.validateValue({})) return callback()
        return callback(new Error(ajv.errorsText(this.validateValue.errors, { separator: '; ' })))
      }
      const validationValue = valueForSchemaValidation(this.schema, value)
      if (!this.validateValue || this.validateValue(validationValue)) return callback()
      callback(new Error(ajv.errorsText(this.validateValue.errors, { separator: '; ' })))
    }
  }
}
</script>
