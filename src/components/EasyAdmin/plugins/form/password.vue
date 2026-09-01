<template>
  <div class="password-field">
    <div class="password-field__input">
      <el-input
        :model-value="form[field.property]"
        :type="passwordVisible ? 'text' : 'password'"
        :placeholder="field.field_options?.placeholder || $t('Password')"
        :clearable="true"
        autocomplete="new-password"
        v-bind="field.type_options"
        v-on="field.type_events || {}"
        @update:model-value="onUpdate"
      >
        <template #suffix>
          <el-icon class="password-field__toggle" @click="passwordVisible = !passwordVisible">
            <ViewIcon v-if="!passwordVisible" />
            <HideIcon v-else />
          </el-icon>
        </template>
      </el-input>
    </div>

    <div v-if="!passwordVisible" class="password-field__input password-field__confirm">
      <el-input
        :model-value="confirmValue"
        type="password"
        show-password
        :placeholder="confirmPlaceholder"
        autocomplete="new-password"
        clearable
        @update:model-value="onConfirmUpdate"
      />
    </div>

    <div v-if="showHints" class="password-field__hints">
      <div class="password-field__hint" :class="{ 'is-ok': isLengthOk }">
        <el-icon class="password-field__hint-icon"><CircleCheck v-if="isLengthOk" /><CircleClose v-else /></el-icon>
        <span>{{ $t('Password hint length') }}</span>
      </div>
      <div class="password-field__hint" :class="{ 'is-ok': hasLetter }">
        <el-icon class="password-field__hint-icon"><CircleCheck v-if="hasLetter" /><CircleClose v-else /></el-icon>
        <span>{{ $t('Password hint letter') }}</span>
      </div>
      <div class="password-field__hint" :class="{ 'is-ok': hasNumber }">
        <el-icon class="password-field__hint-icon"><CircleCheck v-if="hasNumber" /><CircleClose v-else /></el-icon>
        <span>{{ $t('Password hint number') }}</span>
      </div>
      <div v-if="!passwordVisible" class="password-field__hint" :class="{ 'is-ok': isMatch, 'is-error': confirmValue && !isMatch }">
        <el-icon class="password-field__hint-icon"><CircleCheck v-if="isMatch && confirmValue" /><CircleClose v-else /></el-icon>
        <span>{{ $t('Password hint match') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { View as ViewIcon, Hide as HideIcon, CircleCheck, CircleClose } from '@element-plus/icons-vue'

export default {
  components: { ViewIcon, HideIcon, CircleCheck, CircleClose },
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
  data() {
    return {
      passwordVisible: false,
      confirmValue: ''
    }
  },
  computed: {
    pwd() {
      return this.form[this.field.property] || ''
    },
    confirmPlaceholder() {
      return this.$t('Confirm Password')
    },
    showHints() {
      return this.pwd.length > 0 || this.confirmValue.length > 0
    },
    isLengthOk() {
      return this.pwd.length >= 6
    },
    hasLetter() {
      return /[A-Za-z]/.test(this.pwd)
    },
    hasNumber() {
      return /[0-9]/.test(this.pwd)
    },
    isCompliant() {
      return this.isLengthOk && this.hasLetter && this.hasNumber
    },
    isMatch() {
      if (this.passwordVisible) return true
      return this.confirmValue !== '' && this.pwd === this.confirmValue
    }
  },
  watch: {
    pwd() {
      if (!this.pwd) {
        this.confirmValue = ''
      }
      this.triggerValidate()
    },
    confirmValue() {
      this.triggerValidate()
    },
    passwordVisible() {
      this.triggerValidate()
    }
  },
  mounted() {
    this.registerValidator()
  },
  methods: {
    getFormAdmin() {
      let parent = this.$parent
      while (parent && !parent.rules) {
        parent = parent.$parent
      }
      return parent
    },
    registerValidator() {
      const formAdmin = this.getFormAdmin()
      if (!formAdmin || !formAdmin.rules) return
      const fieldName = this.field.property
      const validator = (rule, value, callback) => {
        const pwd = value || ''
        // Empty allowed on edit (id exists), required on create
        if (!pwd) {
          if (!formAdmin.id) {
            return callback(new Error(this.$t('Password is required')))
          }
          return callback()
        }
        const isLengthOk = pwd.length >= 6
        const hasLetter = /[A-Za-z]/.test(pwd)
        const hasNumber = /[0-9]/.test(pwd)
        if (!isLengthOk || !hasLetter || !hasNumber) {
          return callback(new Error(this.$t('Password does not meet requirements')))
        }
        if (!this.passwordVisible) {
          if (!this.confirmValue) {
            return callback(new Error(this.$t('Please confirm password')))
          }
          if (pwd !== this.confirmValue) {
            return callback(new Error(this.$t('Passwords do not match')))
          }
        }
        callback()
      }
      formAdmin.rules[fieldName] = [
        { validator, trigger: ['blur', 'change'] }
      ]
    },
    triggerValidate() {
      const formAdmin = this.getFormAdmin()
      if (!formAdmin || !formAdmin.$refs || !formAdmin.$refs.form) return
      const fieldName = this.field.property
      // Defer to next tick to avoid recursive validation
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
      const alias = this.field.property === 'plainPassword' ? 'password' : this.field.property === 'password' ? 'plainPassword' : null
      if (alias) {
        this.form[alias] = normalized
      }
      if (!normalized) {
        this.confirmValue = ''
      }
      this.triggerValidate()
    },
    onConfirmUpdate(val) {
      this.confirmValue = val
      this.triggerValidate()
    }
  }
}
</script>

<style scoped>
.password-field {
  width: 100%;
}
.password-field__input {
  width: 100%;
}
.password-field__confirm {
  margin-top: 8px;
}
.password-field__toggle {
  cursor: pointer;
  color: #909399;
}
.password-field__toggle:hover {
  color: #409eff;
}
.password-field__hints {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  line-height: 1.4;
}
.password-field__hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}
.password-field__hint.is-ok {
  color: #67c23a;
}
.password-field__hint.is-error {
  color: #f56c6c;
}
.password-field__hint-icon {
  font-size: 14px;
}
</style>
