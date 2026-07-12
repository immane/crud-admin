import { orderByIdDesc } from '../helpers'

export default {
  Order: {
    form: {
      fields: [
        { property: 'notes', type: 'text', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: 'Status',
          draft: 'Draft',
          pending: 'Pending',
          confirmed: 'Confirmed',
          paid: 'Paid',
          fulfilled: 'Fulfilled',
          completed: 'Completed',
          cancelled: 'Cancelled',
          refunded: 'Refunded'
        }
      },
      list_display: [
        'id',
        'uuid',
        'user',
        'totalAmount',
        'currency',
        'status',
        'paymentMethod',
        'paidAt',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'uuid',
        'user',
        'totalAmount',
        'currency',
        'status',
        'paymentMethod',
        'paidAt',
        'cancelledAt',
        'completedAt',
        'refundedAt',
        { property: 'items', full_width: true },
        { property: 'notes', type: 'text', full_width: true },
        { property: 'metadata', type: 'json', full_width: true },
        'shippingAddress',
        'billingAddress',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
