<template>
  <div class="app-container">
    <form-admin
      :id="Number($route.params.id)"
      :entity-conf="entity"
      :fields="fields"
    />
  </div>
</template>

<script>
import FormAdmin from '@/components/EasyAdmin/FormAdmin'
import admin from '@/config'
const inflect = require('i')(true)

export default {
  components: { FormAdmin },
  data() {
    return {
      id: Number(this.$route.params.id),
      entityParam: this.$route.params.entityParam,
      fields: null,
      entity: '',
      alias: '',
      config: {}
    }
  },
  created() {
    // Load entities data
    this.alias = inflect.camelize(inflect.underscore(this.entityParam))

    if (!Object.keys(admin.entities).includes(this.alias)) {
      console.log('Wrong!')
    } else {
      this.config = admin.entities[this.alias]
      this.entity = Object.keys(this.config).includes('entity') ? this.config.entity : this.alias
      this.fields = this.config.form.fields
    }
  }
}
</script>
