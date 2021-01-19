<template>
  <div class="app-container">
    <list-admin
      v-model="list"
      :entity-conf="entity"
      :list-display="fields"
      :list-filter="filters"
      :disabled-actions="disabled"
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
      list: [],
      config: {},
      fields: [],
      filters: null,
      entityParam: this.$route.params.entityParam
    }
  },
  created() {
    // Load entities data
    this.entity = inflect.camelize(inflect.underscore(this.entityParam))

    if (!Object.keys(admin.entities).includes(this.entity)) {
      console.log('NO!')
    } else {
      this.config = admin.entities[this.entity]
      this.fields = this.config.list.list_display
      this.filters = this.config.list.list_filter
      this.disabled = this.config.list.disabled_actions
    }
  }
}
</script>
