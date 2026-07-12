<template>
  <section v-loading="loading" class="detail-admin" element-loading-text="Loading...">
    <header class="detail-admin__header">
      <div>
        <p class="detail-admin__eyebrow">RECORD DETAIL</p>
        <h1>{{ title }}</h1>
        <p class="detail-admin__subtitle">#{{ id }}</p>
      </div>
      <div class="detail-admin__actions">
        <slot name="actions" :record="record" :refresh="fetchData">
          <el-button icon="el-icon-arrow-left" @click="$router.go(-1)">{{ $t('Back') }}</el-button>
          <el-button v-if="editable" type="primary" icon="el-icon-edit" @click="goToUpdate">{{ $t('Edit') }}</el-button>
        </slot>
      </div>
    </header>

    <div class="detail-admin__grid">
      <article v-for="field in properties" :key="field.property" class="detail-admin__field" :class="{ 'detail-admin__field--wide': field.span === 2 || field.full_width }">
        <div class="detail-admin__label">{{ getLabel(field) }}</div>
        <div class="detail-admin__value">
          <slot :name="field.property" :value="extractField(record, field.property)" :record="record" :refresh="fetchData">
            <component
              :is="field.component"
              v-if="field.component"
              :data="extractField(record, field.property)"
              :record="record"
              :scope="{ row: record }"
              :refresh="fetchData"
            />
            <component
              :is="loadPlugin(getListPluginType(field, structure[field.property], extractField(record, field.property)))"
              v-else-if="getListPluginType(field, structure[field.property], extractField(record, field.property))"
              :value="extractField(record, field.property)"
              :field="field"
              :scope="{ row: record }"
              :em="em"
              :struct="structure[field.property]"
            />
            <span v-else>{{ formatValue(extractField(record, field.property)) }}</span>
          </slot>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import { defineAsyncComponent, markRaw, toRaw } from 'vue'
import EntityManage from '@/utils/entity'
import { createUiFeedback } from './ui/feedback'

const detailPlugins = import.meta.glob('./plugins/detail/*.vue')
const listPlugins = import.meta.glob('./plugins/list/*.vue')
const pluginCache = {}

const resolvePlugin = path => {
  if (!pluginCache[path]) {
    pluginCache[path] = defineAsyncComponent(() => {
      const loader = detailPlugins[path] || listPlugins[path]
      return loader().then(module => module.default)
    })
  }
  return pluginCache[path]
}

export default {
  name: 'DetailAdmin',
  props: {
    id: { type: [Number, String], required: true },
    entityConf: { type: [Object, String], required: true },
    fields: { type: [Array, String], default: () => [] },
    title: { type: String, default: '' },
    editable: { type: Boolean, default: true }
  },
  data() {
    return {
      em: new EntityManage(this.entityConf),
      structure: {},
      record: {},
      properties: [],
      loading: true
    }
  },
  created() {
    this.properties = (this.fields === '__all__' ? [] : this.fields).map(field =>
      typeof field === 'string' ? { property: field } : (field.component ? { ...field, component: markRaw(toRaw(field.component)) } : field)
    )
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.loading = true
      Promise.all([this.em.structure(), this.em.retrieve(this.id)])
        .then(([structure, response]) => {
          this.structure = structure
          this.record = response.data
          if (this.fields === '__all__') {
            this.properties = Object.keys(structure).map(property => ({ property }))
          }
        })
        .catch(error => createUiFeedback(this).error(error.message || this.$t('Failed to load record')))
        .finally(() => { this.loading = false })
    },
    getLabel(field) {
      return field.label || field.field_options?.label || this.structure[field.property]?.translation || field.property
    },
    getListPluginType(field, struct, value) {
      const type = field.type || struct?.metadata?.type
      if (!type) return Array.isArray(value) ? 'RelationToMany' : null
      if (['boolean', 'date', 'datetime', 'datetime_immutable', 'image', 'array', 'json'].includes(type)) return type
      if (['ManyToOne', 'OneToOne'].includes(type)) return 'RelationToOne'
      if (['ManyToMany', 'OneToMany'].includes(type)) return 'RelationToMany'
      return null
    },
    loadPlugin(type) {
      const typeMapping = {
        ManyToOne: 'RelationToOne', OneToOne: 'RelationToOne',
        ManyToMany: 'RelationToMany', OneToMany: 'RelationToMany', datetime_immutable: 'datetime'
      }
      const resolvedType = typeMapping[type] || type
      const detailPath = `./plugins/detail/${resolvedType}.vue`
      const listPath = `./plugins/list/${resolvedType}.vue`
      return detailPlugins[detailPath] ? resolvePlugin(detailPath) : resolvePlugin(listPath)
    },
    extractField(data, property) {
      return property.split('.').reduce((value, key) => value != null ? value[key] : null, data)
    },
    formatValue(value) {
      if (value === null || typeof value === 'undefined' || value === '') return '-'
      if (typeof value === 'object') return value.__toString || JSON.stringify(value)
      return String(value).replace(/<[^>]*>/g, '')
    },
    goToUpdate() {
      this.$router.push({ name: `${this.em.name}Update`, params: { id: this.id }})
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-admin {
  min-height: 360px;
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(49, 78, 112, 0.08);
  overflow: hidden;
}

.detail-admin__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  color: #fff;
  background: linear-gradient(125deg, #213c72, #3c6dc4);
}

.detail-admin__eyebrow, .detail-admin__subtitle { margin: 0; opacity: .72; }
.detail-admin__eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.detail-admin__header h1 { margin: 6px 0 3px; font-size: 24px; font-weight: 600; }
.detail-admin__subtitle { font-size: 13px; }
.detail-admin__actions { flex-shrink: 0; }

.detail-admin__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: #e8edf5;
  border-top: 1px solid #e8edf5;
}

.detail-admin__field { min-height: 96px; padding: 20px 28px; background: #fff; }
.detail-admin__field--wide { grid-column: span 2; }
.detail-admin__label { margin-bottom: 10px; color: #8a97a8; font-size: 12px; font-weight: 600; }
.detail-admin__value { color: #27364a; line-height: 1.6; word-break: break-word; }

@media screen and (max-width: 768px) {
  .detail-admin__header { align-items: flex-start; flex-direction: column; padding: 24px; }
  .detail-admin__grid { grid-template-columns: 1fr; }
  .detail-admin__field, .detail-admin__field--wide { grid-column: span 1; padding: 18px 20px; }
}
</style>
