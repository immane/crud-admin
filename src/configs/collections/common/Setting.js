export default {
  Setting: {
    form: {
      fields: [
        { property: 'key', field_options: { label: '键名' }},
        'value',
        'type',
        'groupName',
        { property: 'label', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'sortOrder', required: false, default_value: 0 }
      ]
    },
    list: {
      query: {
        '@order': 'entity.groupName|ASC, entity.sortOrder|ASC, entity.id|DESC'
      },
      list_filter: {
        key: '键名',
        groupName: '分组'
      },
      list_display: [
        'id',
        'key',
        'value',
        'type',
        'groupName',
        'label',
        'sortOrder'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'key',
        'value',
        'type',
        'groupName',
        'label',
        { property: 'description', type: 'text', full_width: true },
        'sortOrder',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
