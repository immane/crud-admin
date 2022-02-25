<template>
  <div>
    <el-select
      v-model="form[field.property]"
      filterable
      clearable
      reserve-keyword
      placeholder="请选择"
      :remote-method="remoteSearch"
      v-bind="field.type_options"
      v-on="field.type_events"
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
      tag="a"
      target="_blank"
      :to="{ path: field.creationUrl }"
    >
      <el-button
        type="success"
        icon="el-icon-plus"
        circle
        size="mini"
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
      '@order': 'name|DESC, id|ASC'
    }
  }

  // Full
  {
    property: 'gift',
    type: 'RelationToOne',
    relation_filter: {
      '@filter': 'entity.getCategory().getType().getSlug() == ":value"',
      '@order': 'name|DESC, id|ASC'
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
      options: []
    }
  },

  async created() {
    if (this.field?.type_options?.entity_name) {
      this.entity = this.field?.type_options?.entity_name?.split('\\')?.pop()
    } else {
      this.entity = this.struct?.metadata?.targetEntity?.split('\\')?.pop()
    }

    if (this.entity && !this.field?.type_options?.remote) {
      this.fetchData(this.entity, this.field.relation_filter ?? {})
    }
  },

  methods: {
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
        const em = new EntityManage(entityName)
        em.prefix = this.emPrefix

        const currentFilter = Object.assign({}, relationFilter)

        currentFilter['@display'] = 'reduce'
        currentFilter['limit'] = 1e10

        if (relationFilter['@filter'] && query) {
          currentFilter['@filter'] = relationFilter['@filter'].replaceAll(':value', query)
        }

        const targetList = await em.list(currentFilter)

        this.options =
          targetList.data.map(v => { return { value: v.id, label: v.__toString || v.name || v.title } })

        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }
}
</script>
