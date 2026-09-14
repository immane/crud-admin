import { defineComponent, h } from 'vue'
import { ElInput } from 'element-plus'

export default defineComponent({
  name: 'RoleSystemLockedInput',
  props: {
    form: { type: Object, default: () => ({}) },
    property: { type: String, default: '' },
    field: { type: Object, default: () => ({}) }
  },
  setup(props) {
    return () => h(ElInput, {
      modelValue: props.form[props.property] || '',
      'onUpdate:modelValue': (value) => { props.form[props.property] = value },
      disabled: !!(props.form.system ?? props.form.isSystem),
      placeholder: props.field.field_options?.placeholder || ''
    })
  }
})
