<template>
  <div
    :key="editing['refresh']"
    @dblclick="startEdit"
  >
    <template
      v-if="editing['editable'] == `${scope.row.id}-${field.property}`"
    >
      <el-input
        v-model="editing['value']"
        v-focus="editing['editable'] == `${scope.row.id}-${field.property}`"
        resize="horizontal"
        prefix-icon="el-icon-edit"
        @blur="cancelEdit"
        @keyup.esc="cancelEdit"
        @keyup.enter="saveEdit"
      />
    </template>

    <div v-else :title="$t('Double-click to edit')">
      {{ scope.row[field.property] }}
    </div>
  </div>
</template>

<script>
export default {
  directives: {
    focus: {
      mounted(el) {
        el.querySelector('input')?.focus()
      }
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
  },
  methods: {
    startEdit() {
      this.editing = {
        refresh: this.editing.refresh + 1 || 1,
        value: this.scope.row[this.field.property],
        editable: `${this.scope.row.id}-${this.field.property}`
      }
    },
    cancelEdit() {
      this.editing = { refresh: 0, value: null }
    },
    saveEdit() {
      this.em.update(this.scope.row.id, { [this.field.property]: this.editing.value })
        .then(() => {
          this.$message.success(this.$t('Property updated successfully'))
          this.scope.row[this.field.property] = this.editing.value
          this.cancelEdit()
        })
        .catch(() => this.$message.error(this.$t('Failed to update property')))
    }
  }
}
</script>
