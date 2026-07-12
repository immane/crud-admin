<template>
  <div class="app-container">
    <list-admin
      :key="componentRefresh"
      v-model="listData"
      :entity-conf="entity"
      :list-display="fields"
      :list-filter="filters"
      :disabled-actions="disabled"
      :query="query"
    >
      <template v-slot:extraAction="{ data }">
        <el-button size="small" @click="dialog.data = data.roles; dialog.pk = data.id; dialog.visible = true;">
          {{ $t('Modify Roles') }}
        </el-button>
      </template>
    </list-admin>

    <el-dialog
      :title="$t('Modify Roles')"
      v-model="dialog.visible"
      width="40%"
    >
      <span>
        <el-select v-model="dialog.data" multiple :placeholder="$t('Select roles')" style="width: 100%;">
          <el-option
            v-for="item in dialog.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </span>
      <template #footer>
        <span class="dialog-footer">
        <el-button @click="dialog.visible = false">{{ $t('Cancel') }}</el-button>
        <el-button
          type="primary"
          @click="
            em.update(dialog.pk, { roles: dialog.data })
              .then(res => $message( { type: 'success', message: $t('Roles updated successfully') } ) )
              .catch(err => $message( { type: 'error', message: $t('Failed to update roles') } ) )
              .finally(() => { dialog.visible = false; componentRefresh++ } )
          "
        >{{ $t('Confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import admin from '@/config'
import EntityManage from '@/utils/entity'

export default {
  components: { ListAdmin },
  data() {
    return {
      em: new EntityManage('User'),
      entity: '',
      config: {},
      fields: [],
      filters: null,
      listData: [],
      componentRefresh: 0,

      dialog: {
        visible: false,
        pk: null,
        data: null,
        options: [
          { value: 'ROLE_USER', label: $t('User') },
          { value: 'ROLE_SUPER_ADMIN', label: $t('Super Admin') },
          { value: 'ROLE_STAFF', label: $t('Staff') }
        ]
      }
    }
  },
  created() {
    // Load entities data
    this.entity = 'User'

    if (!Object.keys(admin.entities).includes(this.entity)) {
      console.log('NO!')
    } else {
      this.config = admin.entities[this.entity]
      this.fields = this.config.list.list_display
      this.filters = this.config.list.list_filter
      this.query = this.config.list.query
      this.disabled = this.config.list.disabled_actions
    }
  }
}
</script>
