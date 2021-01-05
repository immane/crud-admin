export default {
  entities: {
    Content: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'category', 'title', 'createdTime']
      }
    },
    Category: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'type', 'name', 'parent', 'enabled', 'sequence']
      }
    },
    Option: {
      form: {
        fields: [
          { property: 'name', type_options: { disabled: true }},
          'value'
        ]
      },
      list: {
        disabled_actions: ['new', 'delete'],
        list_display: ['id', 'name', 'value', 'readable']
      }
    },
    Type: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'name', 'slug']
      }
    },
    User: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'username', 'phone', 'createdTime']
      }
    },
    UserProfile: {
      form: {
        fields: '__all__'
      },
      list: {
        disabled_actions: ['new', 'delete'],
        list_display: ['id', 'nickname', 'user', 'region', 'avatarUrl']
      }
    }
  }
}
