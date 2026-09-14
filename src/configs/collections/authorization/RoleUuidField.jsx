import { defineComponent, h, onMounted } from 'vue'
import { ElInput } from 'element-plus'

const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.random() * 16 | 0
    return (char === 'x' ? value : (value & 0x3 | 0x8)).toString(16)
  })
}

export default defineComponent({
  name: 'RoleUuidField',
  props: { form: { type: Object, default: () => ({}) }, property: { type: String, default: 'uuid' }},
  setup(props) {
    onMounted(() => {
      if (!props.form[props.property]) props.form[props.property] = uuidv4()
    })
    return () => h(ElInput, { modelValue: props.form[props.property] || '', disabled: true, placeholder: 'auto-generated' })
  }
})
