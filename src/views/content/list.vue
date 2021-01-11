<template>
  <div class="app-container">
    <el-tabs v-model="category">
      <el-tab-pane v-for="value in categories" :key="value.id" :label="value.name" :name="`${value.id}`" />
    </el-tabs>

    <list-admin
      :key="`${category}-${componentKey}`"
      entity-conf="Content"
      :list-display="listDisplay"
      :list-filter="{
        'category.id': { 1: '咨询', 2: '新能源汽车加盟', 3: '租赁' }
      }"
      :query="{
        '@order': 'id|DESC',
        '@filter': `entity.getCategory().getId() == ${category}`
      }"
    >
      <template v-slot:cover="{ value }">
        <el-image
          class="cover"
          :src="`${BASE_API}/uploads/images/${value}`"
          :preview-src-list="[`${BASE_API}/uploads/images/${value}`]"
        />
      </template>
    </list-admin>
  </div>
</template>

<style scoped>
.cover {
  width: 50px; height: 50px; border: 3px white solid; box-shadow: 1px 1px 5px #ddd;
}
</style>

<script>
import EntityManage from '@/utils/entity'
import ListAdmin from '@/components/EasyAdmin/ListAdmin'

export default {
  components: { ListAdmin },
  data() {
    return {
      // base api
      BASE_API: process.env.VUE_APP_BASE_API,

      categoryManager: new EntityManage('Category'),

      loading: true,
      componentKey: 0,

      listDisplay: ['id', 'cover', 'category', 'title', 'createdTime'],

      query: {},
      category: null,
      categories: []
    }
  },
  created() {
    this.categoryManager.list().then(res => {
      this.categories = res.data
      this.category = `${this.categories[0].id}`
    })
  }
}
</script>
