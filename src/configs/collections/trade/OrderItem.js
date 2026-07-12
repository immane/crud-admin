import { orderByIdDesc } from '../helpers'

export default {
  OrderItem: {
    form: {
      fields: [
        'quantity',
        { property: 'unitPrice', required: false },
        { property: 'price', required: false },
        { property: 'cost', required: false },
        { property: 'profit', required: false },
        { property: 'specSnapshot', type: 'json', required: false },
        { property: 'productSnapshot', type: 'json', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete'],
      list_display: [
        'id',
        'specificationTitle',
        'quantity',
        'unitPrice',
        'price',
        'profit',
        'createdAt'
      ]
    }
  }
}
