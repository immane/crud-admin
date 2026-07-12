<template>
  <div class="app-container">
    <detail-admin
      v-if="fields"
      :id="$route.params.id"
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
