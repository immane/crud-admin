<template>
  <div
    :key="editing['refresh']"
    @dblclick="
      editing = { refresh: 0, value: null }
      editing['value'] = scope.row[field.property]
      editing['editable'] = `${scope.row.id}-${field.property}`
      editing['refresh']++
    "
  >
    <template
      v-if="editing['editable'] == `${scope.row.id}-${field.property}`"
    >
      <el-input
        v-model="editing['value']"
        v-focus="editing['editable'] == `${scope.row.id}-${field.property}`"
        resize="horizontal"
        prefix-icon="el-icon-edit"
        @blur="editing = { refresh: 0, value: null }"
        @keyup.esc.native="editing = { refresh: 0, value: null }"
        @keyup.enter.native="
          // update fields
          em.update(scope.row.id, {[field.property]: editing['value']})
            .then(() => $message.success('修改属性成功'), scope.row[field.property] = editing['value'])
            .catch(() => $message.error('修改属性失败'))
          // refresh edit status
          editing = { refresh: 0, value: null }
        "
      />
    </template>

    <div v-else title="双击修改属性">
      {{ scope.row[field.property] }}
    </div>
  </div>
</template>

<script>
export default {
  directives: {
    focus: el => {
      el.querySelector('input').focus()
    }
  },
  props: {
    em: {
      type: Object,
      default: () => { return {} }
    },
    scope: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      // Editable object
      origin: {
        refresh: 0, // refresh key
        value: null
      },
      editing: {}
    }
  }
}
</script>
