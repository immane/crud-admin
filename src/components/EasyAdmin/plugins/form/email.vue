<template>
  <div class="email-field">
    <el-input
      :model-value="form[field.property]"
      type="email"
      :placeholder="field.field_options?.placeholder || 'example@domain.com'"
      clearable
      autocomplete="email"
      v-bind="field.type_options"
      v-on="field.type_events || {}"
      @update:model-value="onUpdate"
    />
    <div v-if="showHint" class="email-field__hint" :class="{ 'is-ok': isValid, 'is-error': !isValid }">
      <el-icon class="email-field__hint-icon"><CircleCheck v-if="isValid" /><CircleClose v-else /></el-icon>
      <span>{{ isValid ? $t('Valid email') : $t('Invalid email format') }}</span>
    </div>
  </div>
</template>

<script>
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { createEmailValidator } from '@/utils/validate'

export default {
  components: { CircleCheck, CircleClose },
  inject: {
    registerFieldValidator: { default: null },
    getFormAdmin: { default: null }
  },
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    },
    struct: {
      type: Object,
      default: () => { return {} }
    }
  },
  computed: {
    val() {
      return this.form[this.field.property] || ''
    },
    showHint() {
      return this.val.length > 0
    },
    isValid() {
      const v = this.val.toString().trim()
      if (!v) return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    }
  },
  mounted() {
    this.registerValidator()
  },
  methods: {
    getFormAdminInstance() {
      if (this.getFormAdmin) {
        try {
          const inst = this.getFormAdmin()
          if (inst && inst.rules) return inst
        } catch (_) {
          // ignore
        }
      }
      let parent = this.$parent
      while (parent && !parent.rules) {
        parent = parent.$parent
      }
      return parent
    },
    registerValidator() {
      const formAdmin = this.getFormAdminInstance()
      if (!formAdmin) return
      const fieldName = this.field.property
      const validator = createEmailValidator(
        () => this.val,
        () => this.field,
        (key) => this.$t(key)
      )
      if (this.registerFieldValidator) {
        this.registerFieldValidator(fieldName, validator, ['blur', 'change'])
      } else if (formAdmin.rules) {
        if (!formAdmin.rules[fieldName]) formAdmin.rules[fieldName] = []
        formAdmin.rules[fieldName].push({ validator, trigger: ['blur', 'change'] })
      }
    },
    triggerValidate() {
      const formAdmin = this.getFormAdminInstance()
      if (!formAdmin || !formAdmin.$refs || !formAdmin.$refs.form) return
      const fieldName = this.field.property
      this.$nextTick(() => {
        try {
          formAdmin.$refs.form.validateField(fieldName)
        } catch (_) {
          // ignore
        }
      })
    },
    onUpdate(val) {
      const normalized = val === '' ? null : val
      this.form[this.field.property] = normalized
      this.triggerValidate()
    }
  }
}
</script>

<style scoped>
.email-field {
  width: 100%;
}
.email-field__hint {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}
.email-field__hint.is-ok {
  color: #67c23a;
}
.email-field__hint.is-error {
  color: #f56c6c;
}
.email-field__hint-icon {
  font-size: 14px;
}
</style>
