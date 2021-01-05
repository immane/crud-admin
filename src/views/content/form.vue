<template>
  <div class="app-container">
    <form-admin
      :id="Number($route.params.id)"
      entity-conf="Content"
      :fields="fields"
    />
  </div>
</template>

<script>
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

export default {
  components: { FormAdmin },
  data() {
    return {
      fields: [
        'id',
        'title',
        'category',
        { property: 'cover', type: 'image' },
        'enabled',
        'content'
      ]
    }
  }
}
</script>
