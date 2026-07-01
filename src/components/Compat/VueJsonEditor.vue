<template>
  <el-input
    type="textarea"
    :value="text"
    :rows="8"
    @input="handleInput"
  />
</template>

<script>
export default {
  name: 'VueJsonEditorCompat',
  props: {
    value: {
      type: [String, Number, Object, Array],
      default: null
    }
  },
  computed: {
    text() {
      if (typeof this.value === 'string') return this.value
      return JSON.stringify(this.value, null, 2)
    }
  },
  methods: {
    handleInput(value) {
      try {
        const parsed = value ? JSON.parse(value) : null
        this.$emit('json-change', parsed)
        this.$emit('input', parsed)
      } catch (error) {
        this.$emit('has-error', error)
        this.$emit('input', value)
      }
    }
  }
}
</script>
