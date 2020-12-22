<template>
  <div class="app-container">
    <list-admin
      :entity-conf="entity"
      :list-display="fields"
      :disabled-actions="disabled"
    />
  </div>
</template>

<script>
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import admin from '@/admin'
const inflect = require('i')(true)

export default {
  components: { ListAdmin },
  data() {
    return {
      fields: [],
      entity: '',
      config: {},
      entityParam: this.$route.params.entityParam,

      // user defined
      parent: [],
      options: []
    }
  },
  created() {
    // Load entities data
    this.entity = inflect.camelize(inflect.underscore(this.entityParam))
    console.log('Entity:', this.entity)

    if (!Object.keys(admin.entities).includes(this.entity)) {
      console.log('NO!')
    } else {
      this.config = admin.entities[this.entity]
      this.fields = this.config.list.list_display
      this.disabled = this.config.list.disabled_actions
    }
  }
}
</script>
