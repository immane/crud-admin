<template>
  <div class="app-container">
    <detail-admin
      v-if="fields"
      :id="identifier"
      :entity-conf="entity"
      :fields="fields"
      :title="$route.meta.title || alias"
      :editable="!disabledActions.includes('edit')"
    />
  </div>
</template>

<script>
import DetailAdmin from '@/components/EasyAdmin/DetailAdmin'
import admin from '@/config'
import inflectFactory from 'i'

const inflect = inflectFactory(true)

export default {
  components: { DetailAdmin },
  props: {
    entityParam: { type: String, default: '' }
  },
  data() {
    return { entity: '', alias: '', fields: null, disabledActions: [] }
  },
  computed: {
    identifier() {
      return this.$route.params.uuid || this.$route.params.id
    }
  },
  created() {
    const entityParam = this.entityParam || this.$route.params.entityParam
    this.alias = inflect.camelize(inflect.underscore(entityParam))
    const config = admin.entities[this.alias]
    if (!config) return
    this.entity = config.entity || this.alias
    const detail = config.detail || {}
    this.fields = detail.detail_display || detail.fields || config.list?.list_display || config.form?.fields || '__all__'
    this.disabledActions = detail.disabled_actions || config.list?.disabled_actions || []
  }
}
</script>
