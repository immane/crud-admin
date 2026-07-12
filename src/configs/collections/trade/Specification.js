export default {
  Specification: {
    form: {
      fields: [
        'name',
        'price',
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }},
        { property: 'sort', default_value: 0 }
      ]
    },
    list: {
      list_filter: {
        name: 'Spec Name',
        status: {
          __label: 'Status',
          active: 'Active',
          inactive: 'Inactive'
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
