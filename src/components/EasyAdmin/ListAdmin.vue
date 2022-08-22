<template>
  <div>
    <el-row>
      <el-col :span="4">
        <slot name="title">
          <strong style="font-size: 20px;">
            <!-- Title slot here -->
            <slot name="titleText">
              {{ titleText }}
            </slot>
          </strong>
        </slot>
      </el-col>
      <el-col :span="20" align="right">
        <!-- Top filter or searcher slot-->
        <slot name="filter">
          <search-filter
            v-model="listFilterData"
            :query="query"
            :filter.sync="filter"
            :fetch-data-func="fetchData"
            :list-filter="listFilter"
          />
        </slot>

        &emsp;

        <!-- Top button slot, actions here -->
        <slot name="extraTopButton">
          <component
            :is="action.component"
            v-for="action in actions.filter(action => action.position === 'top')"
            :key="action.name"
            style="margin-right: .5em"
            :refresh="fetchData"
          />
        </slot>
        &emsp;
        <slot name="topButton">
          <!-- Export action -->
          <template
            v-if="!disabledActions.includes('export')
              && config && config.list && config.list.export"
          >
            <el-button
              size="medium"
              type="primary"
              icon="el-icon-download"
              plain
              @click="() => {
                const loading = this.$loading({
                  lock: true,
                  text: '数据导出中',
                  spinner: 'el-icon-loading',
                  background: 'rgba(0, 0, 0, 0.7)'
                })

                // default config
                const exportConf = config.list.export
                const confQuery = config.list.query
                let query = {}, label = {}, listQuery = {}
                if(exportConf) {
                  if(exportConf.hasOwnProperty('query'))
                    query = exportConf.query
                  if(exportConf.hasOwnProperty('label'))
                    label = exportConf.label
                }
                if(confQuery) {
                  listQuery = confQuery
                }

                // Use current filter
                query = Object.assign({}, listQuery, filter, query)

                em.list(query).then(res => {
                  loading.close()
                  let keys = []
                  res.data.forEach(datum => {
                    keys = Object.keys(datum)
                    keys.forEach(key => {
                      const value = datum[key]
                      if(typeof datum[key] === 'object' && datum[key] !== null) {
                        datum[key] = datum[key].hasOwnProperty('__toString')
                          ? datum[key].__toString : '[Object]'
                      }
                      else if(Array.isArray(datum[key])) {
                        datum[key] = '[Array]'
                      }
                    })
                  })

                  const data = res.data
                  if(label
                    && Object.keys(label).length === 0
                    && Object.getPrototypeOf(label) === Object.prototype
                  ) {
                    keys.forEach(v => { label[v] = v } )
                  }

                  const exportExcelCsv = require('@/utils/exportExcelCsv').default
                  exportExcelCsv(label, data, `export-${em.name}.csv`)
                })
              }"
            >
              导出
            </el-button>
          </template>

          &emsp;

          <!-- New action -->
          <router-link v-if="!disabledActions.includes('new')" to="create">
            <el-button size="medium" type="primary" icon="el-icon-plus" plain>
              新增{{ $router.currentRoute.meta.title }}
            </el-button>
          </router-link>
        </slot>
      </el-col>
    </el-row>

    <el-row>
      <el-table
        :key="refreshTable"
        v-fit-columns
        v-loading="loading"
        :data="list"
        element-loading-text="加载中..."
        fit
        lazy
        stripe
        highlight-current-row
        v-bind="tableConf"
        style="width: 100%"
        v-on="tableEvent"
        @sort-change="changeSort"
      >

        <slot name="tableSelection" />

        <el-table-column
          label="#"
          type="index"
        />

        <el-table-column
          v-for="(field, index) in properties"
          :key="index"
          :label="field.label ? field.label : (structure[field.property] ? structure[field.property]['translation']: field.property)"
          sortable
          :prop="field.property"
          v-bind="field.field_options"
          v-on="field.field_events"
        >
          <template
            slot-scope="scope"
          >

            <!---------------
            |  Fields slot  |
            ---------------->

            <slot
              :name="field.property"
              :value="extractFields(scope.row, field.property)"
              :record="scope.row"
              :refresh="fetchData"
            >
              <!-- Dynamic components and JSX function -->
              <div v-if="Object.keys(field).includes('component')">
                <component
                  :is="field.component"
                  :data="extractFields(scope.row, field.property)"
                  :scope="scope"
                  :record="scope.row"
                  :refresh="fetchData"
                />
              </div>

              <!-- Normal fields -->
              <div v-else>

                <!-- Dummy -->
                <template v-if="false" />

                <!-- System (have metadata) -->

                <!-- String / Integer / Float / Decimal -->
                <template
                  v-else-if="
                    (field.property != 'id' && field.type != 'image') && (
                      field.type == 'string' || checkMetadataType(structure[field.property], 'string')
                      || field.type == 'integer' || checkMetadataType(structure[field.property], 'integer')
                      || field.type == 'float' || checkMetadataType(structure[field.property], 'float')
                      || field.type == 'decimal' || checkMetadataType(structure[field.property], 'decimal')
                    )
                      && field.editable
                  "
                >
                  <component
                    :is="require(`./plugins/list/editable-plain.vue`).default"
                    :em="em"
                    :scope="scope"
                    :field="field"
                    :struct="structure[field.property]"
                  />
                </template>

                <!-- Boolean -->
                <template
                  v-else-if="
                    field.type == 'boolean' ||
                      checkMetadataType(structure[field.property], 'boolean')
                  "
                >
                  <el-switch
                    v-if="field.editable"
                    v-model="scope.row[field.property]"
                    active-color="#67C23A"
                    inactive-color="#F56C6C"
                    size="medium"
                    @change="() => {
                      em.update(scope.row.id, {[field.property]: scope.row[field.property]})
                        .then(() => $message.success('修改属性成功'))
                    }"
                  />

                  <el-tag
                    v-else
                    :type="scope.row[field.property] | boolFilter"
                  >
                    {{ scope.row[field.property] | boolDisplay }}
                  </el-tag>
                </template>

                <!-- Date -->
                <span
                  v-else-if="
                    field.type == 'date' ||
                      (checkMetadataType(structure[field.property], 'date')
                        && scope.row[field.property])
                  "
                >
                  <i class="el-icon-time" />
                  {{ new Date(extractFields(scope.row, field.property)) | dateFormat('YYYY-MM-DD') }}
                </span>

                <!-- DateTime -->
                <span
                  v-else-if="
                    field.type == 'datetime' ||
                      (checkMetadataType(structure[field.property], 'datetime')
                        && scope.row[field.property])
                  "
                >
                  <i class="el-icon-time" />
                  {{ new Date(extractFields(scope.row, field.property)) | dateFormat('YYYY-MM-DD HH:mm:ss') }}
                </span>

                <!-- Relatived -->
                <span
                  v-else-if="
                    checkMetadataType(structure[field.property], 'ManyToOne')
                      || checkMetadataType(structure[field.property], 'OneToOne')
                  "
                >
                  {{ scope.row[field.property] ? scope.row[field.property].__toString : '' }}
                </span>

                <div
                  v-else-if="
                    checkMetadataType(structure[field.property], 'ManyToMany')
                      || checkMetadataType(structure[field.property], 'OneToMany')
                      || Array.isArray(scope.row[field.property])
                  "
                  :style="{ display: 'flex', flexWrap: 'wrap' }"
                >
                  <template
                    v-for="(relationField, relationIndex) in scope.row[field.property].slice(0, 5)"
                  >
                    <el-tag
                      :key="relationIndex"
                      :style="{ margin: '2px' }"
                    >
                      {{ Object.keys(relationField).includes('__toString') ? relationField.__toString : '' }}
                    </el-tag>
                  </template>

                  <template
                    v-if="scope.row[field.property].length > 5"
                  >
                    <el-tooltip
                      placement="bottom"
                      effect="light"
                    >
                      <el-tag
                        :key="relationIndex"
                        :style="{ margin: '2px' }"
                      >
                        ...
                      </el-tag>

                      <div slot="content">
                        <div
                          v-for="(relationField, relationIndex) in scope.row[field.property]"
                          :key="relationIndex"
                          style="max-width: 50vw; overflow-y: scroll; display: flex; flex-wrap: wrap;"
                        >
                          <el-tag
                            :style="{ margin: '2px' }"
                          >
                            {{ Object.keys(relationField).includes('__toString') ? relationField.__toString : '' }}
                          </el-tag>
                        </div>
                      </div>
                    </el-tooltip>
                  </template>
                </div>

                <!-- Custom (do not have metadata) -->

                <!-- Image -->
                <span
                  v-else-if="field.type == 'image'"
                >
                  <el-image
                    style="width: 50px; height: 50px; border: 3px white solid; box-shadow: 1px 1px 5px #ddd;"
                    :src="getPicture(scope.row[field.property])"
                    :preview-src-list="[getPicture(scope.row[field.property])]"
                  />
                </span>

                <!-- Others -->
                <span v-else>
                  <!-- Relation fields or others -->
                  {{ extractFields(scope.row, field.property) | htmlStrip }}
                </span>
              </div>
            </slot>
          </template>
        </el-table-column>

        <el-table-column v-if="!disabledActions.includes('lines')" label="操作">
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
              <slot name="action:edit" :data="scope.row">
                <!-- Redirect -->
                <router-link v-if="!disabledActions.includes('edit')" :to="`${scope.row.id}/update`">
                  <el-button size="small" icon="el-icon-edit" plain>
                    修改
                  </el-button>
                </router-link>

                <!-- Popup -->
                <!--
                <el-button
                  size="small"
                  icon="el-icon-edit"
                  plain
                  @click="() => {
                    dialog.title = '修改记录'
                    dialog.data.id = scope.row.id
                    dialog.refresh++
                    dialog.show = true
                  }"
                >
                  修改
                </el-button>
                -->
              </slot>

              &nbsp;&nbsp;

              <slot name="action:delete" :data="scope.row">
                <el-popconfirm v-if="!disabledActions.includes('delete')" title="确定删除当前记录？" @onConfirm="removeAction(scope.row.id)">
                  <el-button slot="reference" size="small" type="danger" icon="el-icon-delete" plain>删除</el-button>
                </el-popconfirm>
              </slot>
            </slot>
          </template>
        </el-table-column>
      </el-table>
    </el-row>

    <el-row v-if="!disabledActions.includes('pager')">
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

    <template>
      <el-dialog width="80%" :title="dialog.title" :visible.sync="dialog.show">
        <component
          :is="dialog.component"
          :key="dialog.refresh"
          :data="dialog.data"
        />
      </el-dialog>
    </template>
  </div>
</template>

<style>
.el-row {
    margin-bottom: 1rem;
}
.el-table td, .el-table th {
    padding: 8px 0;
}
.el-dialog body {
    padding: 0;
}
</style>

<script>
import EntityManage from '@/utils/entity'
import { asyncRoutes } from '@/router'
import SIP from '@/utils/simple-image-process'
import SearchFilter from './SearchFilter.vue'

export default {
  name: 'ListAdmin',
  components: { SearchFilter },

  filters: {
    boolFilter(status) { return { false: 'danger', true: 'success' }[status] },
    boolDisplay(status) { return { false: '否', true: '是' }[status] },
    htmlStrip(text) { return text ? String(text).replace(/<[^>]*>/g, '') : '' }
  },

  props: {
    /**
     * Main config
     * {
     *    form: [...],
     *    list: [...]
     * }
     */
    config: {
      type: [Object],
      default: () => {}
    },

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

    // Export dummy (not extra used)
    export: {
      type: [Object],
      default: () => {
        return {
        /**
         * @description
         *  Export dummy
         *
         * @example
         *  export: {
         *    query: {
         *      '@display': '["id", "name"]'
         *    },
         *    label: {
         *      'id': 'ID',
         *      'name': '名称'
         *    }
         *  }
         */
        }
      }
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
         *   '@sort': 'entity.id|ASC, entity.createdTime|DESC',
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
         *   { property: 'enabled', type: 'boolean', editable: true }
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
         *  Selection filter or Searcher
         *  List filter example
         *
         * @reference
         *  @/components/EasyAdmin/SearchFilter.vue
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
    // sample: ['new', 'edit', 'delete', 'lines', 'pager']
    disabledActions: {
      type: Array,
      default: () => []
    },

    // Data processor
    dataProcessor: {
      type: Function,
      default: (context, dataProcessor = {}) => {
        // Loading start
        context.list = []
        context.loading = true

        const promise = [
          // Fetch Structure
          context.em.structure().then(res => { context.structure = res }),

          // Fetch Data
          context.em.list(Object.assign(
            /**
             * Combine default constant query to dynamic pager and sort
             * Pager and sort object will change in the page
             */
            {},
            context.query ? context.query : {},
            context.filter,
            context.pager,
            context.sort
          )).then(res => {
            // Assign data
            context.list = res.data
            context.paginator = res.paginator
          })
        ]

        Promise.all(promise.map(p => p.catch(e => e)))
          .then(res => { context.loading = false })
      }
    }
  },

  data() {
    return {
      // Entity manager and entity structure
      // sample: 'Category'
      em: new EntityManage(this.entityConf),
      structure: {},

      // Table refresh key
      refreshTable: 0,

      // Page title
      titleText: '',

      // Translated fields
      properties: [],

      // Table data source
      list: [],
      paginator: null,

      // Translated filter config
      filters: {},

      // List filters or seacher
      listFilterData: {},

      // Editable object
      editing: {
        refresh: 0 // refresh key
      },

      // Sort query: {'@sort': 'id|ASC, createdTime|DESC'}
      sort: {},
      // Filter: {'@filter': 'entity.getId() == 1'}
      filter: {},
      // Pager: {page: 1, limit: 20}
      pager: {
        page: 1,
        limit: 20
      },

      // Dialog
      dialog: {
        title: 'Dialog',
        show: false,
        component: null,
        refresh: 0,
        data: {},

        defaultComponents: {
          formEdit: {
            /*
            components: { FormAdmin },
            props: ['data'],
            data() {
              return {
                submit: null
              }
            },
            // Use scope-slot in JSX
            render(h) {
              return (
                <form-admin
                  id={this.data?.id}
                  entity-conf={this.data?.entityConf}
                  fields={this.data?.fields}
                  config={this.data?.config}

                  { ... {
                    scopedSlots: {
                      title: () => { return <span/> },
                      action: scope => {
                        return (
                          <el-button
                            type='primary' icon='el-icon-edit-outline'
                            onclick={() => {
                              scope.submit(() => {
                                this.$message({ message: '数据修改成功', type: 'success' })
                                this.data.dialog.show = false
                              })
                            }}>
                            保存
                          </el-button>
                        )
                      }
                    }
                  }}
                />
              )
            }
            */
          }
        }
      },

      // Other
      loading: true
    }
  },

  watch: {
    value: {
      handler: function(value) {
        this.list = value
        // this.refreshTable++
      },
      deep: true
    },
    list: {
      handler: function(value) {
        this.$emit('input', value)
      },
      deep: true
    }
  },

  async created() {
    // Process router convert
    this.routeProcess()

    // Process entity and structure properties
    this.propertieProcess()

    // Load dialog component
    this.loadDialogComponent(
      {
        entityConf: this.entityConf,
        fields: this.config?.form.fields,
        config: this.config
      },
      this.dialog.defaultComponents.formEdit
    )

    /**
     * Fetch base data, like entity structure and validations
     * Used filter fetch data instead.
     */
    // this.fetchData()
  },

  methods: {
    /* Debug */
    _console() {
      return console
    },

    /* Check if metadata presented */
    checkMetadataType(currentStruct, type) {
      return currentStruct && Object.keys(currentStruct).includes('metadata') && currentStruct.metadata.type === type
    },

    loadDialogComponent(data, component = null) {
      if (component) {
        this.dialog.component = component
      }
      this.dialog.data = data
      data.dialog = this.dialog
      this.dialog.refresh++
    },

    // Get picture
    getPicture(url) {
      return SIP.getPicture(url)
    },

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

    /* Restore redirected route */
    routeProcess() {
      let redirectRoute = null

      // Find router by name recursively
      for (const mainRoute of asyncRoutes) {
        if (redirectRoute === null && Object.keys(mainRoute).includes('children')) {
          for (const childrenRoute of mainRoute.children) {
            if (childrenRoute.redirect === this.$route.path) {
              redirectRoute = childrenRoute
              break
            }
          }
        }
      }
      if (redirectRoute) {
        this.titleText = redirectRoute.meta.title
      }
    },

    // Get data from web apis.
    fetchData() {
      // data process callback
      this.dataProcessor(this)
    },

    // Sorter changed
    changeSort(val) {
      const orderMap = { ascending: 'ASC', descending: 'DESC' }
      this.sort['@order'] = val.order ? `entity.${val.prop}|${orderMap[val.order]}` : ''

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
