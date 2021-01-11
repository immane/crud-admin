<template>
  <div class="app-container">
    <list-admin
      :query="{
        '@filter': `
          entity.getUser().getToken() == '${token}' ||
          entity.getUser().getRecommendedUser().getToken() == '${token}' ||
          entity.getUser().getRecommendedUser().getRecommendedUser().getToken() == '${token}'
        `
      }"
      :entity-conf="entity"
      :list-display="fields"
      :list-filter="filters"
      :disabled-actions="['new', 'edit', 'delete']"
    />
  </div>
</template>

<script>
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import admin from '@/config'
import { mapGetters } from 'vuex'

export default {
  components: { ListAdmin },
  data() {
    return {
      entity: '',
      config: {},
      fields: [],
      filters: null,
      entityParam: this.$route.params.entityParam
    }
  },
  computed: {
    ...mapGetters([
      'token'
    ])
  },
  created() {
    // Load entities data
    this.entity = 'UserProfile'

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
