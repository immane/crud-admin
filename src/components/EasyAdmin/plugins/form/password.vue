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
      // keep alias in sync if needed is handled in onUpdate, but watch for external clears
      if (!this.pwd) {
        this.confirmValue = ''
      }
    }
  },
  methods: {
    onUpdate(val) {
      const normalized = val === '' ? null : val
      this.form[this.field.property] = normalized
      const alias = this.field.property === 'plainPassword' ? 'password' : this.field.property === 'password' ? 'plainPassword' : null
      if (alias) {
        this.form[alias] = normalized
      }
      // reset confirm if password cleared
      if (!normalized) {
        this.confirmValue = ''
      }
    },
    onConfirmUpdate(val) {
      this.confirmValue = val
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
