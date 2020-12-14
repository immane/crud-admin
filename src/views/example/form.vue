<template>
  <div class="app-container">
    <form-admin :id="id" entity-conf="Post" :fields="fields">
      <!-- rewrite parent selector demo -->
      <!--
      <template slot="parent" slot-scope="{ form }">
        <el-select v-model="form['parent']" filterable placeholder="请选择">
          <el-option
            v-for="item in options['parent']"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </template>
      -->
    </form-admin>
  </div>
</template>

<script>
// import EntityManage from '@/utils/entity'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

export default {
  components: { FormAdmin },
  data() {
    return {
      // em: new EntityManage('Taxonomy'),
      id: Number(this.$route.params.id),
      fields: [
        'user',
        'title',
        'category',
        { property: 'cover', type: 'image' },
        { property: 'region', relationFilter: {
          '@filter': 'entity.getParent().getId() == 100000'
        }},
        'video',
        'topped',
        'latitude',
        'longitude',
        'address',
        'neighbourhood',
        'propertyRightPeriod',
        'houseType',
        'area',
        'isDecorated',
        'direction',
        'floor',
        'hasLift',
        'buildingType',
        'years',
        'price',
        'unitPrice',
        'sets'
      ],

      // user defined
      parent: [],
      options: []
    }
  },
  created() {
    // Load parent selector data
    /*
    this.em.list({ '@filter': '!entity.getLevel()' }).then(res => {
      this.parent = res.data
      this.options['parent'] = res.data.map(v => {
        return { value: v.id, label: v.name }
      })
    })
    */
  }
}
</script>
