<template>
  <div class="detail-json-schema">
    <admin-skeleton v-if="loading" :rows="3" />
    <json-detail v-else-if="failed" :value="value" :field="field" :scope="scope" :em="em" :struct="struct" />
    <div v-else-if="definition && parsed && typeof parsed === 'object' && !Array.isArray(parsed)">
      <div v-if="!rows.length" class="detail-json-schema__empty">-</div>
      <dl v-else class="detail-json-schema__list">
        <div v-for="row in rows" :key="row.property" class="detail-json-schema__item">
          <dt>{{ row.label }}</dt>
          <dd>{{ formatValue(row.value) }}</dd>
        </div>
      </dl>
    </div>
    <div v-else class="detail-json-schema__empty">-</div>
  </div>
</template>

<script>
import { t } from '@/i18n'
import JsonDetail from './json.vue'
import AdminSkeleton from '@/components/AdminSkeleton.vue'
import { createSchemaForm } from '@/utils/json-schema-form'

function parseValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch (_) { return value }
}

function labelFor(property) {
  return t(property
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, char => char.toUpperCase()))
}

export default {
  components: { JsonDetail, AdminSkeleton },
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  data() {
    return { loading: true, failed: false, definition: null }
  },
  computed: {
    parsed() {
      return parseValue(this.value)
    },
    rows() {
      if (!this.definition || !this.parsed || typeof this.parsed !== 'object' || Array.isArray(this.parsed)) return []
      const knownFields = this.definition.fields
        .filter(item => Object.hasOwn(this.parsed, item.property))
        .map(item => ({ property: item.property, label: item.field_options.label, value: this.parsed[item.property] }))
      const knownProperties = new Set(knownFields.map(item => item.property))
      const unknownFields = Object.keys(this.parsed)
        .filter(property => !knownProperties.has(property))
        .map(property => ({ property, label: labelFor(property), value: this.parsed[property] }))
      return [...knownFields, ...unknownFields]
    }
  },
  async created() {
    try {
      const source = this.field.type_options?.schema
      const schema = typeof source === 'function'
        ? await source({ entity: this.em?.name, id: this.scope?.row?.id, property: this.field.property, form: this.scope?.row })
        : source
      const definition = createSchemaForm(schema, this.field.type_options?.fields)
      if (!definition) throw new Error('Unsupported JSON Schema')
      this.definition = definition
    } catch (_) {
      this.failed = true
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatValue(value) {
      if (value === null || value === undefined || value === '') return '-'
      if (Array.isArray(value)) return value.map(this.formatValue).join(', ')
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }
  }
}
</script>

<style scoped>
.detail-json-schema__empty { color: var(--text-secondary); }

.detail-json-schema__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.detail-json-schema__item {
  min-width: 0;
  min-height: 68px;
  padding: 12px 14px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.detail-json-schema__item dt {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.detail-json-schema__item dd {
  min-width: 0;
  margin: 5px 0 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-word;
}

@media screen and (max-width: 768px) {
  .detail-json-schema__list { grid-template-columns: 1fr; }
}
</style>
