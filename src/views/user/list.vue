<template>
  <div class="app-container">
    <list-admin
      entity-conf="User"
      :list-display="listDisplay"
      :disabled-actions="['new', 'delete']"
    >
      <template v-slot:extraAction="{ data }">
        <el-button size="small" @click="dialog.data = data.roles; dialog.pk = data.id; dialog.visible = true;">
          修改权限
        </el-button>
      </template>
    </list-admin>

    <el-dialog
      title="修改权限"
      :visible.sync="dialog.visible"
      width="40%"
    >
      <span>
        <el-select v-model="dialog.data" multiple placeholder="请选择权限" style="width: 100%;">
          <el-option
            v-for="item in dialog.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="
            em.update(dialog.pk, { roles: dialog.data })
              .then(res => $message( { type: 'success', message: '权限修改成功' } ) )
              .catch(err => $message( { type: 'error', message: '权限修改失败' } ) )
              .finally(() => dialog.visible = false )
          "
        >确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import EntityManage from '@/utils/entity'
import ListAdmin from '@/components/EasyAdmin/ListAdmin'

export default {
  components: { ListAdmin },
  data() {
    return {
      em: new EntityManage('User'),
      loading: true,
      componentKey: 0,

      listDisplay: ['id', 'username', 'phone', 'createdTime'],
      listFilter: [],
      query: {},

      dialog: {
        visible: false,
        pk: null,
        data: null,
        options: [
          { value: 'ROLE_USER', label: '用户' },
          { value: 'ROLE_ADMIN', label: '管理员' },
          { value: 'ROLE_SUPER_ADMIN', label: '超级管理员' }
        ]
      }
    }
  }
}
</script>
