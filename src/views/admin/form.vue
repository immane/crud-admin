<template>
  <div class="app-container">
    <form-admin
      :id="identifier"
      v-model="form"
      :entity-conf="entity"
      :fields="fields"
      :config="config"
    />
  </div>
</template>

<script>
import FormAdmin from '@/easyadmin/ui/vue/FormAdmin'
import admin from '@/config'
import inflectFactory from 'i'

const inflect = inflectFactory(true)

export default {
  components: { FormAdmin },
  data() {
    return {
      entityParam: this.$route.params.entityParam,
      fields: null,
      form: this.$route.query,
      entity: '',
      alias: '',
      config: {}
    }
  },
  computed: {
    identifier() {
      return this.$route.params.uuid || this.$route.params.id || 0
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
