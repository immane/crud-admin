<template>
  <div>
    <el-row>
      <el-col :span="4">
        <slot name="title">
          <strong>
            <!-- Title slot here -->
            {{ $router.currentRoute.meta.title }}
          </strong>
        </slot>
      </el-col>
      <el-col :span="20" align="right">
        <!-- Top filter or searcher slot-->
        <slot name="filter" />

        &emsp;

        <!-- Top button slot, actions here -->
        <slot name="topButton">
          <router-link :to="{ name: `${em.name}Create`}">
            <el-button size="medium" type="primary" icon="el-icon-plus" plain>
              新增{{ $router.currentRoute.meta.title }}
            </el-button>
          </router-link>
        </slot>
      </el-col>
    </el-row>

    <el-row>
      <el-table
        v-loading="loading"
        :data="list"
        element-loading-text="加载中..."
        border
        fit
        lazy
        highlight-current-row
        @sort-change="changeSort"
      >
        <el-table-column
          v-for="field in listDisplay"
          :key="field.plantext"
          :label="structure[field] ? structure[field]['translation']: field"
          sortable
          :prop="field"
        >
          <template slot-scope="scope">

            <!---------------
            |  Fields slot  |
            ---------------->

            <slot :name="field" :value="scope.row[field]" :record="scope.row">
              <div v-for="(struct, index) in [structure[field]]" :key="index">
                <!-- Boolean -->
                <span
                  v-if="
                    struct && struct.metadata &&
                      'boolean' == struct.metadata.type"
                >
                  <el-tag :type="scope.row[field] | boolFilter">
                    {{ scope.row[field] | boolDisplay }}
                  </el-tag>
                </span>

                <!-- DateTime -->
                <span
                  v-else-if="
                    struct && struct.metadata &&
                      'datetime' == struct.metadata.type"
                >
                  {{ new Date(scope.row[field]) | dateFormat('YYYY-MM-DD hh:mm:ss') }}
                </span>

                <!-- Relatived -->
                <span
                  v-else-if="
                    struct && struct.metadata &&
                      ('ManyToOne' == struct.metadata.type ||
                        'OneToOne' == struct.metadata.type)
                  "
                >
                  {{ scope.row[field] ? scope.row[field].__toString : '' }}
                </span>

                <!-- Others -->
                <span v-else>
                  {{ scope.row[field] | htmlStrip }}
                </span>
              </div>
            </slot>
          </template>
        </el-table-column>

        <el-table-column label="动作" min-width="100">
          <template slot-scope="scope">
            <slot name="action" :data="scope.row">
              <router-link :to="{ name: `${em.name}Update`, params: { id: scope.row.id }}">
                <el-button size="small" icon="el-icon-edit" plain>
                  修改
                </el-button>
              </router-link>
              &nbsp;&nbsp;
              <el-popconfirm title="确定删除当前分类？" @onConfirm="removeAction(scope.row.id)">
                <el-button slot="reference" size="small" type="danger" icon="el-icon-delete" plain>删除</el-button>
              </el-popconfirm>
            </slot>
          </template>
        </el-table-column>
      </el-table>
    </el-row>

    <el-row>
      <div class="block">
        <el-pagination
          :current-page.sync="pager.page"
          :page-sizes="[20, 50, 100, 300]"
          :page-size="pager.limit"
          layout="total, sizes, prev, pager, next, jumper"
          :total="paginator ? paginator.pageCount : 0"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-row>
  </div>
</template>

<style>
.el-row {
    margin-bottom: 1rem;
}
.el-table td, .el-table th {
    padding: 8px 0;
}
</style>

<script>
import EntityManage from '@/utils/entity'

export default {
  filters: {
    boolFilter(status) { return { false: 'danger', true: 'success' }[status] },
    boolDisplay(status) { return { false: '否', true: '是' }[status] },
    htmlStrip(text) { return text ? String(text).replace(/<[^>]*>/g, '') : '' }
  },
  props: {
    // entity config or entity name
    entityConf: {
      type: [Object, String],
      default: () => {}
    },
    // default query including filter, sorter and pager.
    query: {
      type: Object,
      default: () => {}
    },
    // default show fields
    listDisplay: {
      type: Array,
      default: () => []
    },
    // default list filters
    listFilter: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // entity manager and entity structure
      em: new EntityManage(this.entityConf),
      structure: {},

      // table data source
      list: [],
      paginator: null,

      // sort query: {'@sort': 'id|ASC, createdTime|DESC'}
      sort: {},
      // entity filter: {'@filter': 'entity.getId() in [1,3,4] && entity.getUser().getProfile().getAge() > 18'}
      filter: {},
      // pager: {page: 1, limit: 20}
      pager: {
        page: 1,
        limit: 20
      },

      // other
      loading: true
    }
  },
  watch: {
    $route(to, from) {
      this.fetchData()
    }
  },
  created() {
    this.routeProcess()

    /**
     * Fetch base data, like entity structure and validations
     */
    this.fetchData()
  },
  methods: {
    /* Restore redirected route */
    routeProcess() {
      let redirectRoute = null

      // Find router by name recursively
      for (const mainRoute of this.$router.options.routes) {
        if (redirectRoute === null && Object.keys(mainRoute).includes('children')) {
          for (const childrenRoute of mainRoute.children) {
            if (childrenRoute.name === `${this.em.name}List`) {
              redirectRoute = childrenRoute
              break
            }
          }
        }
      }
      if (redirectRoute) {
        this.$route.meta.title = redirectRoute.meta.title
      }
    },

    // Get data from web apis.
    fetchData() {
      this.loading = true

      const promise = [
        this.em.structure().then(res => { this.structure = res }),

        this.em.list(Object.assign(
          /**
           * Combine default constant query to dynamic pager and sort
           * Pager and sort object will change in the page
           */
          this.query ? this.query : {},
          this.pager,
          this.sort
        )).then(res => {
          this.list = res.data
          this.paginator = res.paginator
        })
      ]

      Promise.all(promise.map(p => p.catch(e => e)))
        .then(res => { this.loading = false })
    },

    // Sorter changed
    changeSort(val) {
      const orderMap = { ascending: 'ASC', descending: 'DESC' }
      this.sort['@order'] = val.order ? `${val.prop}|${orderMap[val.order]}` : ''

      // Reload data
      this.fetchData()
    },

    // Pager size changed
    handleSizeChange(val) {
      this.pager.limit = val
      this.fetchData()
    },

    // Pager page changed
    handleCurrentChange(val) {
      this.pager.page = val
      this.fetchData()
    },

    // Remove action
    removeAction(pk) {
      this.em.delete(pk).then(res => {
        this.$message('删除成功')
        this.fetchData()
      })
    }
  }
}
</script>
