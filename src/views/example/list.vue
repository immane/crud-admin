<template>
  <div class="app-container">
    <list-admin
      entity-conf="Post"
      :list-display="listDisplay"
    >
      <!-- field slot to image demo -->
      <template slot="cover" slot-scope="{ value }">
        <el-image
          style="width: 50px; height: 50px; border: 3px white solid; box-shadow: 1px 1px 5px #ddd;"
          :src="`${BASE_API}/uploads/images/${value}`"
          :preview-src-list="[`${BASE_API}/uploads/images/${value}`]"
        />
      </template>

      <!-- action slot demo, write your own action here -->
      <!--
          <template slot="action" slot-scope="{ data }">
            <el-button>
              <router-link :to="{ name: 'TaxonomyUpdate', params: { id: data.id }}">修改</router-link>
            </el-button>
              &nbsp;&nbsp;
            <el-popconfirm title="确定删除当前分类？" @onConfirm="remove(data.id)">
              <el-button slot="reference" type="danger">删除</el-button>
            </el-popconfirm>
          </template>
      -->

      <!-- replace column demo, slot name is equal to field name -->
      <!--
          // eslint-disable-next-line vue/no-unused-vars
          <template slot="level" slot-scope="{ value, record }">
            {{ value }} = {{ record.level }}
          </template>
      -->
    </list-admin>
  </div>
</template>

<script>
import ListAdmin from '@/components/EasyAdmin/ListAdmin'

export default {
  components: { ListAdmin },
  data() {
    return {
      // base api
      BASE_API: process.env.VUE_APP_BASE_API,
      loading: true,

      // The fields that going to display in the tables
      listDisplay: ['id', 'user', 'title', 'category', 'cover', 'createdTime'],
      listFilter: [],

      // taxonomy parent
      parent: null
    }
  },
  watch: {
    $route(to, from) {
      this.fetchData()
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    /*
    remove(pk) {
      this.em.delete(pk).then(res => {
        this.$message('删除成功')
        this.fetchData()
      })
    },
    */
    fetchData() {
      this.parent = this.$route.query.parent
    }
  }
}
</script>
