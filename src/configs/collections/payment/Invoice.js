import { orderByIdDesc } from '../helpers'

export default {
  Invoice: {
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete'],
      list_display: [
        'id',
        'payer',
        'amount',
        'currency',
        'status',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
