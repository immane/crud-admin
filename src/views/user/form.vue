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

export default {
  components: { FormAdmin },
  data() {
    return {
      id: Number(this.$route.params.id),
      entityParam: this.$route.params.entityParam,
      fields: null,
      entity: '',
      config: {}
    }
  },
  created() {
    // Load entities data
    this.entity = 'User'

    if (!Object.keys(admin.entities).includes(this.entity)) {
      console.log('Wrong!')
    } else {
      this.config = admin.entities[this.entity]
      this.fields = this.config.form.fields
    }
  }
}
</script>
