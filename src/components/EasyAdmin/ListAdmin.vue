<template>
  <div>
    <el-row>
      <el-col :span="4">
        <slot name="title">
          <strong style="font-size: 20px;">
            <!-- Title slot here -->
            <slot name="titleText">
              {{ $router.currentRoute.meta.title }}
            </slot>
          </strong>
        </slot>
      </el-col>
      <el-col :span="20" align="right">
        <!-- Top filter or searcher slot-->
        <slot name="filter">
          <el-select
            v-for="(v, k) in filters"
            :key="k"
            v-model="listFilterData[k]"
            filterable
            clearable
            :placeholder="v.label"
          >
            <el-option
              v-for="item in v.data"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          &emsp;
          <el-button
            v-if="Object.keys(filters).length"
            size="medium"
            icon="el-icon-search"
            circle
            @click="
              filterGenerate();
              fetchData();
            "
          />
        </slot>

        &emsp;

        <!-- Top button slot, actions here -->
        <slot name="extraTopButton" />
        &emsp;
        <slot name="topButton">
          <router-link v-if="!disabledActions.includes('new')" :to="{name: `${em.name}Create`}">
            <el-button size="medium" type="primary" icon="el-icon-plus" plain>
              新增{{ $router.currentRoute.meta.title }}
            </el-button>
          </router-link>
        </slot>
      </el-col>
    </el-row>

    <el-row>
      <el-table
        v-fit-columns
        v-loading="loading"
        :data="list"
        element-loading-text="加载中..."
        fit
        lazy
        stripe
        highlight-current-row
        v-bind="tableConf"
        v-on="tableEvent"
        @sort-change="changeSort"
      >

        <slot name="tableSelection" />

        <el-table-column
          v-for="(field, index) in properties"
          :key="index"
          :label="field.label ? field.label : (structure[field.property] ? structure[field.property]['translation']: field.property)"
          sortable
          :prop="field.property"
        >
          <template slot-scope="scope">

            <!---------------
            |  Fields slot  |
            ---------------->

            <slot :name="field.property" :value="extractFields(scope.row, field.property)" :record="scope.row">
              <!-- Dynamic components and JSX function -->
              <div v-if="Object.keys(field).includes('component')">
                <component :is="field.component" :data="extractFields(scope.row, field.property)" />
              </div>

              <!-- Normal fields -->
              <div v-else-if="Object.keys(structure).includes(field.property)">

                <div v-for="(struct, i) in [structure[field.property]]" :key="i">
                  <!-- Dummy -->
                  <template v-if="false" />

                  <!-- Boolean -->
                  <span
                    v-else-if="
                      struct && struct.metadata &&
                        'boolean' == struct.metadata.type"
                  >
                    <el-tag :type="scope.row[field.property] | boolFilter">
                      {{ scope.row[field.property] | boolDisplay }}
                    </el-tag>
                  </span>

                  <!-- DateTime -->
                  <span
                    v-else-if="
                      struct && struct.metadata &&
                        'datetime' == struct.metadata.type && scope.row[field.property]"
                  >
                    <i class="el-icon-time" />
                    {{ new Date(scope.row[field.property]) | dateFormat('YYYY-MM-DD HH:mm:ss') }}
                  </span>

                  <!-- Date -->
                  <span
                    v-else-if="
                      struct && struct.metadata &&
                        'date' == struct.metadata.type && scope.row[field.property]"
                  >
                    <i class="el-icon-time" />
                    {{ new Date(scope.row[field.property]) | dateFormat('YYYY-MM-DD') }}
                  </span>

                  <!-- Relatived -->
                  <span
                    v-else-if="
                      struct && struct.metadata &&
                        ('ManyToOne' == struct.metadata.type ||
                          'OneToOne' == struct.metadata.type)
                    "
                  >
                    {{ scope.row[field.property] ? scope.row[field.property].__toString : '' }}
                  </span>

                  <!-- Others -->
                  <span v-else>
                    {{ scope.row[field.property] | htmlStrip }}
                  </span>
                </div>
              </div>

              <div v-else>
                <!-- Relation fields or others -->
                {{ extractFields(scope.row, field.property) }}
              </div>
            </slot>
          </template>
        </el-table-column>

        <el-table-column label="动作">
          <template slot-scope="scope">
            <component
              :is="action.component"
              v-for="action in actions.filter(action => action.position === 'list')"
              :key="action.name"
              :record="scope.row"
              :refresh="fetchData"
            />

            <slot name="extraAction" :data="scope.row" />

            &emsp;

            <slot name="action" :data="scope.row">
              <router-link v-if="!disabledActions.includes('edit')" :to="{ name: `${em.name}Update`, params: { id: scope.row.id }}">
                <el-button size="small" icon="el-icon-edit" plain>
                  修改
                </el-button>
              </router-link>
              &nbsp;&nbsp;
              <el-popconfirm v-if="!disabledActions.includes('delete')" title="确定删除当前记录？" @onConfirm="removeAction(scope.row.id)">
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
          :total="paginator ? paginator.totalCount : 0"
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
import { asyncRoutes } from '@/router'

export default {
  filters: {
    boolFilter(status) { return { false: 'danger', true: 'success' }[status] },
    boolDisplay(status) { return { false: '否', true: '是' }[status] },
    htmlStrip(text) { return text ? String(text).replace(/<[^>]*>/g, '') : '' }
  },
  props: {
    // Entity config or entity name
    entityConf: {
      type: [Object, String],
      default: () => {}
    },

    // Table config
    tableConf: {
      type: [Object],
      default: () => {}
    },

    // Table events
    tableEvent: {
      type: [Object],
      default: () => {}
    },

    // v-model
    value: {
      type: Array,
      default: () => []
    },

    // Default query including filter, sorter and pager.
    query: {
      type: Object,
      default: () => {
        /**
         * @description
         *  Entity query
         *
         * @example
         * {
         *   '@filter': 'entity.getId() in [1,3,4] && entity.getUser().getProfile().getAge() > 18',
         *   '@sort': 'id|ASC, createdTime|DESC',
         *   page: 1, limit: 20,
         * }
         */
      }
    },

    // Default show fields
    listDisplay: {
      type: Array,
      default: () => [
        /**
         * @description
         *  List display example
         *  property can including nasted call
         *
         * @example
         * [
         *   'id',
         *   'user',
         *   { property: 'name', label: 'Name',
         *     component: {
         *        props: ['data'],
         *        render(h) {
         *          return <p>{this.data}</p>
         *        }
         *   }},
         *   { property: 'user.__metadata.profile.phone', label: 'Phone' },
         *   'createdTime'
         * ]
         */
      ]
    },

    // Default list filters
    listFilter: {
      type: Object,
      default: () => {
        /**
         * @description
         *  List filter example
         *
         * @example
         * {
         *    // Reduce style
         *    status: {
         *      0: 'Pending', 1: 'Paid', 2: 'Completed'
         *    }
         *
         *    // Full style
         *    'category.id': {
         *      expression: 'entity.getCategory().getId() == ":value"',
         *      label: 'Please select',
         *      data: [
         *        { value: 'book', label: 'Book' },
         *        { value: 'paper', label: 'Paper' },
         *      ]
         *    }
         *
         *    // Async sample
         *    'category.id': () => {
         *      return axios
         *        .get('/api/categories',
         *          { params: { '@filter': 'entity.getType().getSlug() == "content"' }})
         *        .then(res =>
         *          Object.assign({}, ...res.data.map(v => { return { [v.id]: v.name } })))
         *    }
         * }
         */
      }
    },

    // Actions
    actions: {
      type: Array,
      default: () => [
        /**
         * @description
         *  Actions sample
         *  property can including nasted call
         *
         * @example
         * [
         *  { name: 'recycle',
         *    position: 'list',
         *    component: {
         *      props: ['record', 'refresh'],
         *      methods: {
         *        recycleContent(id) {
         *          axios
         *            .put(`/manage/contents/${id}`, { isDeleted: true })
         *            .then(() => {
         *              this.$message('Move to recycle bin success.')
         *              this.refresh()
         *            })
         *        }
         *      },
         *      render(h) {
         *        return (
         *          <el-button nativeOnClick={ () => this.recycleContent(this.record.id) }
         *            slot='reference' size='small' type='danger' icon='el-icon-delete' plain>
         *              Recycle
         *          </el-button>
         *        )
         *      }
         *    }
         *  }
         * ]
         */
      ]
    },

    // Disable default actions
    // sample: ['new', 'edit', 'delete']
    disabledActions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // Entity manager and entity structure
      // sample: 'Category'
      em: new EntityManage(this.entityConf),
      structure: {},

      // Translated fields
      properties: [],

      // Table data source
      list: this.value,
      paginator: null,

      // Translated filter config
      filters: {},

      // List filters or seacher
      listFilterData: [],
      searcherData: [],

      // Sort query: {'@sort': 'id|ASC, createdTime|DESC'}
      sort: {},
      // Filter: {'@filter': 'entity.getId() == 1'}
      filter: {},
      // Pager: {page: 1, limit: 20}
      pager: {
        page: 1,
        limit: 20
      },

      // Other
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
    this.propertieProcess()
    this.filterProcess()

    /**
     * Fetch base data, like entity structure and validations
     */
    this.fetchData()
  },
  methods: {
    /* Property process */
    propertieProcess() {
      // fields transform
      const fields =
        this.listDisplay !== '__all__'
          ? this.listDisplay
          : Object.keys(this.structure)

      for (const field of fields) {
        if (typeof field === 'string') {
          this.properties.push({
            property: field
          })
        } else {
          this.properties.push(field)
        }
      }
    },

    /* Filter process */

    filterProcess() {
      const filter = {}
      const isFunction = functionToCheck => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
      const transform = (field, key) => {
        // transform
        let expression = ''
        const relationKeys = key.split('.')

        relationKeys.forEach((value, index) => {
          const capitalizeKey = value.charAt(0).toUpperCase() + value.slice(1)
          expression += `.get${capitalizeKey}()`
        })

        filter[key] = {
          data: [],
          label: '请选择',
          expression: `entity${expression} == ':value'`
        }

        for (const k in field) {
          filter[key]['data'].push(
            { value: k, label: field[k] }
          )
        }
      }

      for (const key in this.listFilter) {
        let field = this.listFilter[key]

        // receive async function
        if (isFunction(field)) {
          const promise = this.listFilter[key]()
          if (promise instanceof Promise) {
            this.listFilter[key]().then(res => {
              field = res
              transform(field, key)
            })
          } else throw Error('Async filter must return promise object!')
        }

        // receive normal value
        if (!(Object.keys(field).includes('data') &&
          this.listFilter.data instanceof Array
        )) {
          transform(field, key)
        }
      }
      this.filters = filter
    },

    filterGenerate() {
      this.filter = {}
      if (this.query && Object.keys(this.query).includes('@filter')) {
        this.filter['@filter'] = this.query['@filter']
      }

      for (const key in this.listFilterData) {
        const value = this.listFilterData[key]
        if (value) {
          const expression = this.filters[key].expression.replaceAll(':value', value)
          if (this.filter['@filter']) {
            this.filter['@filter'] += ` && ${expression}`
          } else {
            this.filter['@filter'] = expression
          }
        }
      }
    },

    /* Restore redirected route */
    routeProcess() {
      let redirectRoute = null

      // Find router by name recursively
      for (const mainRoute of asyncRoutes) {
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
          {},
          this.query ? this.query : {},
          this.filter,
          this.pager,
          this.sort
        )).then(res => {
          this.list = res.data
          this.paginator = res.paginator

          // emit parent methods
          this.$emit('input', res.data)
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
        this.$message({ message: '删除成功', type: 'success' })
        this.fetchData()
      })
    },

    // Extract relation field
    extractFields(dataObject, field) {
      // TODO: check if valid expression
      // Relation format 'a.b.c'

      try {
        let data = dataObject
        const relationArray = field.split('.')

        relationArray.forEach((value, index) => {
          if (Object.keys(data).includes(value)) {
            data = data[value]
          } else {
            data = null
          }
        })

        return data
      } catch (e) {
        return null
      }
    }
  }
}
</script>
