<template>
  <div>
    <el-select
      v-model="form[field.property]"
      filterable
      clearable
      reserve-keyword
      :placeholder="$t('Please select')"
      :remote-method="remoteSearch"
      :loading="loading"
      v-bind="field.type_options"
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
/**
 * @description Many to one relations
 * @example
 */
/*
  // Reduce
  { property: 'region',
    relation_filter: {
      '@filter': 'entity.getLevel() == ":value"',
      '@order': 'entity.name|DESC, entity.id|ASC'
    }
  }

  // Full
  {
    property: 'gift',
    type: 'RelationToOne',
    relation_filter: {
      '@filter': 'entity.getCategory().getType().getSlug() == ":value"',
      '@order': 'entity.name|DESC, entity.id|ASC'
    }
    field_options: {
      label: 'Present'
    },
    type_options: {
      entity_name: 'Specification',
      remote: true  // Enable remote search with filter's ":value"
    }
  }
*/
import EntityManage from '@/utils/entity'
import entities from '@/configs/entities'
import { loadRelationRecords, relationLabel, relationValue, resolveRelation } from '@/utils/relation'
export default {
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
      // component option
      loading: false,

      // m2o or o2o options
      entity: null,
      relation: null,
      options: []
    }
  },

  computed: {
    selectedValues() {
      const value = this.form[this.field.property]
      return Array.isArray(value) ? value : [value]
    }
  },

  watch: {
    selectedValues: {
      handler() {
        // Edit forms receive their values after relation fields have mounted.
        this.addSelectedOptions()
        this.hydrateSelectedOptions()
      },
      deep: true
    }
  },

  async created() {
    this.relation = resolveRelation(this.field, this.struct, entities)
    this.entity = this.relation?.name || null

    this.addSelectedOptions()
    this.hydrateSelectedOptions()

    if (this.entity && !this.field?.type_options?.remote) {
      this.fetchData(this.entity, this.field.relation_filter ?? {})
    }
  },

  methods: {
    addSelectedOptions() {
      const options = new Map(this.options.map(option => [option.value, option]))
      this.selectedValues
        .filter(value => value !== null && typeof value !== 'undefined' && value !== '')
        .forEach(value => {
          if (!options.has(value)) options.set(value, { value, label: String(value) })
        })
      this.options = [...options.values()]
    },

    async hydrateSelectedOptions() {
      if (this.relation?.valueKey !== 'uuid') return
      const selected = new Set(this.selectedValues.filter(value => typeof value === 'string' && value))
      if (!selected.size) return
      const records = await loadRelationRecords(this.relation, this.emPrefix)
      const options = records
        .filter(record => selected.has(relationValue(record, this.relation)))
        .map(record => ({ value: relationValue(record, this.relation), label: relationLabel(record) }))
      const existing = new Map(this.options.map(option => [option.value, option]))
      options.forEach(option => existing.set(option.value, option))
      this.options = [...existing.values()]
    },

    async remoteSearch(query) {
      if (query !== '') {
        this.loading = true
        await this.fetchData(this.entity, this.field.relation_filter ?? {}, query)
        this.loading = false
      } else {
        this.options = []
      }
    },

    async fetchData(entityName, relationFilter, query = null) {
      try {
        const em = new EntityManage({
          name: entityName,
          plural: this.relation?.plural,
          prefix: this.relation?.prefix || this.emPrefix || undefined
        })

        const currentFilter = Object.assign({}, relationFilter)

        currentFilter['@display'] = 'reduce'
        currentFilter['limit'] = 1e10

        if (relationFilter['@filter'] && query) {
          currentFilter['@filter'] = relationFilter['@filter'].replaceAll(':value', query)
        }

        const targetList = await em.list(currentFilter)

        const fetched = targetList.data.map(record => ({
          value: relationValue(record, this.relation),
          label: relationLabel(record)
        })).filter(option => option.value !== null && typeof option.value !== 'undefined')
        const existing = new Map(this.options.map(option => [option.value, option]))
        fetched.forEach(option => existing.set(option.value, option))
        this.options = [...existing.values()]

        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }
}
</script>
