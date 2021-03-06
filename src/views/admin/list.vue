<template>
  <div class="app-container">
    <list-admin
      v-model="list"
      :entity-conf="entity"
      :list-display="fields"
      :list-filter="filters"
      :disabled-actions="disabled"
      :actions="actions"
      :query="query"
      :data-processor="dataProcessor"
    />
  </div>
</template>

<script>
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import admin from '@/config'
const inflect = require('i')(true)

export default {
  components: { ListAdmin },
  data() {
    return {
      entity: '',
      alias: '',
      list: [],
      config: {},
      fields: [],
      filters: null,
      entityParam: this.$route.params.entityParam
    }
  },
  created() {
    // Load entities data
    this.alias = inflect.camelize(inflect.underscore(this.entityParam))

    if (!Object.keys(admin.entities).includes(this.alias)) {
      console.log('NO!')
    } else {
      this.config = admin.entities[this.alias]
      this.entity = Object.keys(this.config).includes('entity') ? this.config.entity : this.alias
      this.fields = this.config.list.list_display
      this.filters = this.config.list.list_filter
      this.actions = this.config.list.actions
      this.disabled = this.config.list.disabled_actions
      this.query = this.config.list.query
      this.dataProcessor = this.config.list.data_processor
    }
  }
}
</script>
