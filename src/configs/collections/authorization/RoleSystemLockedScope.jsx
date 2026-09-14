import { defineComponent, h } from 'vue'
import { ElOption, ElSelect } from 'element-plus'

export default defineComponent({
  name: 'RoleSystemLockedScope',
  props: {
    form: { type: Object, default: () => ({}) },
    property: { type: String, default: 'scopeType' },
    field: { type: Object, default: () => ({}) }
  },
  setup(props) {
    return () => h(ElSelect, {
      modelValue: props.form[props.property] || '',
      'onUpdate:modelValue': (value) => { props.form[props.property] = value },
      disabled: !!(props.form.system ?? props.form.isSystem),
      placeholder: props.field.field_options?.placeholder || '',
      style: 'width:100%'
    }, () => (props.field.type_options?.options || []).map((option) => h(ElOption, option)))
  }
})
