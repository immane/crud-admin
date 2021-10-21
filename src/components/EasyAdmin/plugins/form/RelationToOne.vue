<template>
  <div>
    <el-select
      v-model="form[field.property]"
      filterable
      clearable
      placeholder="请选择"
      v-bind="field.type_options"
      v-on="field.type_events"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <router-link
      v-if="field.creationUrl"
      tag="a"
      target="_blank"
      :to="{ path: field.creationUrl }"
    >
      <el-button
        type="success"
        icon="el-icon-plus"
        circle
        size="mini"
        style="margin: 0px 10px;"
      />
    </router-link>
  </div>
</template>

<script>
import EntityManage from '@/utils/entity'
export default {
  props: {
    emPrefix: {
      type: String,
      default: ''
    },
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    },
    struct: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      // m2o or o2o options
      options: []
    }
  },
  async created() {
    let entityName = this.struct?.metadata?.targetEntity?.split('\\')
    if (entityName) {
      entityName = entityName.pop()
      try {
        const em = new EntityManage(entityName)
        em.prefix = this.emPrefix

        const targetList = await em.list(
          this.field.relation_filter ?? { '@display': 'reduce' }
        )

        this.options =
          targetList.data.map(v => { return { value: v.id, label: v.__toString || v.name || v.title } })

        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }
}
</script>
