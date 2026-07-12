export default {
  Specification: {
    form: {
      fields: [
        'name',
        'price',
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' }
          ]
        }},
        { property: 'sort', default_value: 0 }
      ]
    },
    list: {
      list_filter: {
        name: '规格名称',
        status: {
          __label: '状态',
          active: '启用',
          inactive: '停用'
        }
      },
      list_display: [
        'id',
        'name',
        { property: 'price', editable: true },
        { property: 'status', editable: true },
        { property: 'sort', editable: true },
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'name',
        'price',
        'status',
        'sort',
        'product',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
