export default {
  form: {
    fields: '__all__'
  },
  list: {
    query: {
      '@order': 'createdTime|DESC'
    },
    disabled_actions: ['new', 'edit', 'delete', 'lines'],
    list_display: [
      'id',
      'source',
      { property: 'user',
        label: '收款人'
      },
      'type',
      'before',
      { property: 'amount',
        component: {
          props: ['data'],
          render(h) {
            return (
              <span>{this.data >= 0 ? '+' : ''}{this.data}</span>
            )
          }
        }
      },
      'after',
      'comment',
      'createdTime'
    ]
  }
}
