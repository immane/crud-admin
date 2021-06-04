export default {
  Balance: {
    form: {
      fields: '__all__'
    },
    list: {
      list_display: [
        'id', 'user', 'amount', 'lastModifiedTime'
      ]
    }
  }
}
