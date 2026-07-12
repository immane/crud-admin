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
          {{ $t('entity.modifyRoles') }}
        </el-button>
      </template>
    </list-admin>

    <el-dialog
      :title="$t('entity.modifyRoles')"
      v-model="dialog.visible"
      width="40%"
    >
      <span>
        <el-select v-model="dialog.data" multiple :placeholder="$t('entity.selectRoles')" style="width: 100%;">
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
        <el-button @click="dialog.visible = false">{{ $t('form.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="
            em.update(dialog.pk, { roles: dialog.data })
              .then(res => $message( { type: 'success', message: $t('entity.rolesUpdated') } ) )
              .catch(err => $message( { type: 'error', message: $t('entity.rolesUpdateFailed') } ) )
              .finally(() => { dialog.visible = false; componentRefresh++ } )
          "
        >{{ $t('form.confirm') }}</el-button>
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
          { value: 'ROLE_USER', label: $t('entity.roleUser') },
          { value: 'ROLE_SUPER_ADMIN', label: $t('entity.roleSuperAdmin') },
          { value: 'ROLE_STAFF', label: $t('entity.roleStaff') }
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
