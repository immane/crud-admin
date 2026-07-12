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
            v-model:filter="filter"
            :query="query"
            :fetch-data-func="fetchFilteredData"
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
              size="default"
              type="primary"
              icon="el-icon-download"
              plain
              @click="() => {
                const loading = startLoading({
                  lock: true,
                  text: t('Exporting data'),
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

                  exportExcelCsv(label, data, `export-${em.name}.csv`)
                })
              }"
            >
               {{ $t('Export') }}
            </el-button>
          </template>

          &emsp;

          <!-- New action -->
          <el-button
            v-if="!disabledActions.includes('new')"
            size="default"
            type="primary"
            icon="el-icon-plus"
            plain
            @click="() => {
              dialog.title = t('New Record')
              delete dialog.data.id
              dialog.refresh++
              dialog.show = true
            }"
          >
             {{ $t('New') }} {{ $route.meta.title }}
          </el-button>
        </slot>
      </el-col>
    </el-row>

    <el-row>
        <el-table
          :key="refreshTable"
          v-loading="loading"
          :data="list"
          element-loading-text="Loading..."
          fit
          lazy
          stripe
          highlight-current-row
          v-bind="tableConf"
          table-layout="auto"
          style="width: 100%"
          v-on="tableEvent || {}"
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
          v-on="field.field_events || {}"
        >
          <template #default="scope">

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
                <template v-if="false" />

                <template v-else-if="isEditableField(field, structure[field.property])">
                  <component
                    :is="EditablePlain"
                    :em="em"
                    :scope="scope"
                    :field="field"
                    :struct="structure[field.property]"
                  />
                </template>

                <template v-else-if="getListPluginType(field, structure[field.property], extractFields(scope.row, field.property))">
                  <component
                    :is="loadListPlugin(getListPluginType(field, structure[field.property], extractFields(scope.row, field.property)))"
                    :value="extractFields(scope.row, field.property)"
                    :field="field"
                    :scope="scope"
                    :em="em"
                    :struct="structure[field.property]"
                  />
                </template>

                <span v-else>
                  {{ htmlStrip(extractFields(scope.row, field.property)) }}
                </span>
              </div>
            </slot>
          </template>
        </el-table-column>

        <el-table-column v-if="!disabledActions.includes('lines')" :label="$t('Actions')" width="240" fixed="right">
          <template #default="scope">
            <div class="easy-admin-actions">
              <component
                :is="action.component"
                v-for="action in actions.filter(action => action.position === 'list')"
                :key="action.name"
                :record="scope.row"
                :refresh="fetchData"
              />

              <slot name="extraAction" :data="scope.row" />

              <slot name="action" :data="scope.row">
                <slot name="action:detail" :data="scope.row">
                  <el-button
                    v-if="config && !disabledActions.includes('detail')"
                    size="small"
                    icon="el-icon-view"
                    plain
                    @click="$router.push({ name: `${em.name}Detail`, params: { id: scope.row.id } })"
                  >
                    {{ $t('Details') }}
                  </el-button>
                </slot>

                <slot name="action:edit" :data="scope.row">
                  <el-button
                    v-if="!disabledActions.includes('edit')"
                    size="small"
                    icon="el-icon-edit"
                    plain
                    @click="openEditDialog(scope.row.id)"
                  >
                    {{ $t('Edit') }}
                  </el-button>
                </slot>

                <slot name="action:delete" :data="scope.row">
                  <el-popconfirm v-if="!disabledActions.includes('delete')" :title="$t('Delete this record?')" @confirm="removeAction(scope.row.id)">
                    <template #reference><el-button size="small" type="danger" icon="el-icon-delete" plain>{{ $t('Delete') }}</el-button></template>
                  </el-popconfirm>
                </slot>
              </slot>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-row>

    <el-row v-if="!disabledActions.includes('pager')">
      <div class="block">
        <el-pagination
          v-model:current-page="pager.page"
          v-model:page-size="pager.limit"
          :page-sizes="[20, 50, 100, 300]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagerTotal"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-row>

    <el-dialog
      v-model="dialog.show"
      class="easy-admin-dialog"
      width="80%"
      :title="dialog.title"
      top="0"
      @closed="fetchData"
    >
      <form-admin
        v-if="dialog.show"
        :key="dialog.refresh"
        :id="dialog.data.id"
        :entity-conf="dialog.data.entityConf"
        :fields="dialog.data.fields"
        :config="dialog.data.config"
      >
        <template #formTitle><span /></template>
        <template #action="{ submit }">
          <el-button type="primary" icon="el-icon-edit-outline" @click="submit(closeEditDialog)">{{ $t('Save') }}</el-button>
        </template>
      </form-admin>
    </el-dialog>
  </div>
</template>

<script>
import { defineAsyncComponent, markRaw, toRaw } from 'vue'
import { t } from '@/i18n'
import EntityManage from '@/utils/entity'
import { asyncRoutes } from '@/router'
import SIP from '@/utils/simple-image-process'
import SearchFilter from './SearchFilter.vue'
import FormAdmin from './FormAdmin.vue'
import { createUiFeedback } from './ui/feedback'
import EditablePlain from './plugins/list/editable-plain.vue'

const listPlugins = import.meta.glob('./plugins/list/*.vue')
const listPluginCache = {}

const resolveListPlugin = (path) => {
  if (!listPluginCache[path]) {
    listPluginCache[path] = defineAsyncComponent(() => listPlugins[path]().then(module => module.default))
  }
  return listPluginCache[path]
}

export default {
  name: 'ListAdmin',
  components: { FormAdmin, SearchFilter },

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

    modelValue: {
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
         *      'name': 'Name'
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
    // sample: ['new', 'detail', 'edit', 'delete', 'lines', 'pager']
    disabledActions: {
      type: Array,
      default: () => []
    },

    // Data processor
    dataProcessor: {
      type: Function,
      default: (context, dataProcessor = {}) => {
        // Loading start
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
            context.paginator = context.normalizePaginator(res.paginator)
          })
        ]

        Promise.all(promise.map(p => p.catch(e => e)))
          .then(res => { context.loading = false })
      }
    }
  },

  data() {
    return {
      EditablePlain: markRaw(EditablePlain),

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

      // Sort query: {'@sort': 'entity.id|ASC, entity.createdTime|DESC'}
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
        refresh: 0,
        data: {}
      },

      // Other
      loading: true
    }
  },

  computed: {
    pagerTotal() {
      if (!this.paginator) return 0
      return Number(this.paginator.totalCount ?? this.paginator.total ?? 0)
    }
  },

  watch: {
    modelValue: {
      handler: function(value) {
        this.list = value
        // this.refreshTable++
      },
      deep: true
    },
    list: {
      handler: function(value) {
        this.$emit('update:modelValue', value)
      },
      deep: true
    }
  },

  async created() {
    // Process router convert
    this.routeProcess()

    // Process entity and structure properties
    this.propertieProcess()

    // Initialize the reusable edit dialog data.
    this.loadDialogComponent(
      {
        entityConf: this.entityConf,
        fields: this.config?.form.fields,
        config: this.config
      }
    )

    /**
     * Fetch base data, like entity structure and validations
     * Used filter fetch data instead.
     */
    // this.fetchData()
  },

  methods: {
    uiFeedback() {
      return createUiFeedback(this)
    },

    htmlStrip(text) {
      return text ? String(text).replace(/<[^>]*>/g, '') : ''
    },

    startLoading(options = {}) {
      return this.uiFeedback().loading(options)
    },

    notifySuccess(message) {
      this.uiFeedback().success(message)
    },

    /* Debug */
    _console() {
      return console
    },

    /* Check if metadata presented */
    checkMetadataType(currentStruct, type) {
      return currentStruct && Object.keys(currentStruct).includes('metadata') && currentStruct.metadata.type === type
    },

    isEditableField(field, struct) {
      if (field.property === 'id') return false
      if (field.type === 'image') return false
      if (!field.editable) return false
      const editableTypes = ['string', 'integer', 'float', 'decimal']
      if (field.type && editableTypes.includes(field.type)) return true
      if (!field.type && struct?.metadata?.type && editableTypes.includes(struct.metadata.type)) return true
      return false
    },

    getListPluginType(field, struct, value) {
      const type = field.type || struct?.metadata?.type
      if (!type) {
        if (Array.isArray(value)) return 'RelationToMany'
        return null
      }
      if (['boolean', 'date', 'datetime', 'datetime_immutable', 'image', 'array'].includes(type)) return type
      if (['ManyToOne', 'OneToOne'].includes(type)) return 'RelationToOne'
      if (['ManyToMany', 'OneToMany'].includes(type)) return 'RelationToMany'
      return null
    },

    loadListPlugin(type) {
      const typeMapping = {
        'ManyToOne': 'RelationToOne',
        'OneToOne': 'RelationToOne',
        'ManyToMany': 'RelationToMany',
        'OneToMany': 'RelationToMany',
        'datetime_immutable': 'datetime'
      }
      const targetType = typeMapping[type] || type
      const path = `./plugins/list/${targetType}.vue`
      return resolveListPlugin(path)
    },

    loadDialogComponent(data) {
      this.dialog.data = data
      this.dialog.refresh++
    },

    openEditDialog(id) {
      this.dialog.title = this.$t('Edit Record')
      this.dialog.data.id = id
      this.dialog.refresh++
      this.dialog.show = true
    },

    closeEditDialog() {
      this.notifySuccess(this.$t('Data saved successfully'))
      this.dialog.show = false
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
          this.properties.push(field.component ? { ...field, component: markRaw(toRaw(field.component)) } : field)
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

    fetchFilteredData() {
      this.pager.page = 1
      this.fetchData()
    },

    normalizePaginator(paginator = {}) {
      return {
        ...paginator,
        totalCount: Number(paginator.totalCount ?? paginator.total ?? 0)
      }
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
      this.pager.page = 1
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
        this.notifySuccess(this.$t('Deleted successfully'))
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

<style scoped>
.el-row {
    margin-bottom: 1rem;
}
.el-table td, .el-table th {
    padding: 8px 0;
}

.easy-admin-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
  white-space: nowrap;
}

.easy-admin-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

::v-deep(.el-overlay-dialog:has(.easy-admin-dialog)) {
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep(.easy-admin-dialog) {
  display: flex;
  flex-direction: column;
  width: min(80vw, 1200px) !important;
  max-height: 80vh;
  margin: auto !important;
}

::v-deep(.easy-admin-dialog .el-dialog__header) {
  flex-shrink: 0;
  margin-right: 0;
  padding: 20px 24px 14px;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep(.easy-admin-dialog .el-dialog__title) {
  display: block;
  padding-right: 32px;
}

::v-deep(.easy-admin-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}

::v-deep(.easy-admin-dialog .app-container) {
  padding: 0;
}

::v-deep(.easy-admin-dialog .el-dialog__footer) {
  flex-shrink: 0;
}
</style>
