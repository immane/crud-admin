<template>
  <div class="app-container">
    <el-row>
      <el-col :span="4">
        <slot name="formTitle">
          <strong style="font-size: 20px;">
            <!-- Title slot here -->
            {{ $router.currentRoute.meta.title }}
            新增 / 修改
          </strong>
        </slot>
      </el-col>
      <el-col :span="20" align="right">
        <!-- Top filter or searcher slot-->
        <slot name="filter" />

        &emsp;

        <!-- Top button slot, actions here -->
        <slot name="topButton" />
      </el-col>
    </el-row>

    <el-form
      ref="form"
      v-loading="loading"
      :model="form"
      :rules="rules"
      label-width="120px"
      element-loading-text="加载中..."
    >
      <el-tabs
        v-model="activeTab"
      >
        <el-tab-pane
          v-for="(tab, tabIndex) in tabs"
          :key="tabIndex"
          :label="tab"
          :name="String(tabIndex)"
        >
          <div
            v-for="field in properties"
            :key="field.property"
            :set="currentStruct = structure[field.property]"
          >
            <template
              v-if="
                (!tabIndex && !Object.keys(field).includes('tab'))
                  || tab == field.tab
              "
            >
              <el-form-item
                v-if="field.property !== 'id'"
                :label="
                  (Object.keys(field).includes('field_options') &&
                    Object.keys(field.field_options).includes('label'))
                    ? field.field_options.label
                    : (currentStruct ? currentStruct['translation']: field.property)
                "
                :prop="field.property"
                v-bind="field.field_options"
                v-on="field.field_events"
              >
                <!---------------
                |  Fields slot  |
                ---------------->

                <!-- Dynamic components and JSX function -->
                <template v-if="Object.keys(field).includes('component')">
                  <component
                    :is="field.component"
                    :data="form[field.property]"
                    :form="form"
                    :property="field.property"
                    :fields="properties"
                    :field="field"
                  />
                </template>

                <!-- Plugin fields -->
                <template
                  v-else-if="
                    !['id'].includes(field.property)
                  "
                >
                  <slot
                    :name="field.property"
                    :form="form"
                    :value="form[field.property]"
                    :struct="currentStruct"
                  >
                    <component
                      :is="loadPlugin(field.type ? field.type : getMetadataType(currentStruct))"
                      :em-prefix="em.prefix"
                      :form="form"
                      :field="field"
                      :struct="structure[field.property]"
                    />
                  </slot>
                </template>

                <!-- Help text -->
                <template v-if="Object.keys(field).includes('help')">
                  <div class="help-text" style="display: flex;">
                    <div>
                      <p class="el-icon-info" />
                    </div>
                    <div>
                      <p v-html="field.help" />
                    </div>
                  </div>
                </template>
              </el-form-item>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-form-item>
        <slot name="action" :form="form" :submit="onSubmit">
          <el-button type="primary" icon="el-icon-edit-outline" @click="onSubmit()">保存</el-button>
          <!--<el-button type="primary" @click="onSubmit()">保存并继续编辑</el-button>-->
        </slot>
      </el-form-item>
    </el-form>

  </div>
</template>

<script>
import EntityManage from '@/utils/entity'
import Tinymce from '@/components/Tinymce'
import { createUiFeedback } from './ui/feedback'

const formPlugins = import.meta.glob('./plugins/form/*.vue')
const formPluginCache = {}

const resolveFormPlugin = path => {
  if (!formPluginCache[path]) {
    formPluginCache[path] = () => formPlugins[path]().then(module => module.default)
  }
  return formPluginCache[path]
}

export default {
  name: 'FormAdmin',
  components: { Tinymce },
  props: {
    /**
     * @description Form admin initialize properties.
     * @param {Object} value v-modal value
     * @param {Object, String} entityConf Entity name or config
     * @param {Array, String} fields Load main fields of entity
     * @param {Number} id Entity ID
     */

    id: {
      type: Number,
      default: () => 0
    },
    value: {
      type: Object,
      default: () => { return {} }
    },
    entityConf: {
      type: [Object, String],
      default: () => {}
    },
    fields: {
      type: [Array, String],
      default: () => [
        /**
         * @description Fields and Relation filter example
         * @example
         * [
         *   'id',
         *   { property: 'cover',
         *     // types: datatime, date, integer, boolean, textarea, text, image, images, file, transfer
         *     type: 'image',
         *     required: true,
         *     field_options: { label: 'Cover image' },
         *     field_events: { click: () => alert('Clicked') },
         *     type_options: { disabled: true },
         *     type_events: { input: () => alert('Inputed') },
         *     help: 'This is a help text'
         *   },
         *   { property: 'region',
         *     relation_filter: {
         *       '@filter': 'entity.getLevel() == 0',
         *       '@order': 'entity.name|DESC, entity.id|ASC'
         *     }
         *   },
         *   'name',
         *   'parent',
         *   { property: 'enabled',
         *     default_value: true  // Default only appear in create mode, update mode form will replace by retrieved data.
         *   }
         * ]
         */
      ]
    }
  },
  data() {
    return {
      // base api
      BASE_API: process.env.VITE_BASE_API,

      // entity manager instance
      em: new EntityManage(this.entityConf),

      // entity structure
      structure: {},

      // all plain fields
      plainFields: [],

      // form data
      form: {},

      // field vaildations
      rules: {},

      // tabs
      tabs: new Set(['默认']),
      activeTab: 0,

      // translated fields
      properties: [],

      // loading
      loading: true
    }
  },
  watch: {
    form: {
      handler: function(value) {
        // TODO: Is here need cleaning blank values?
        // this.cleanBlankAttributes(this.form)

        // Merge this.form => this.value
        Object.assign(this.value, this.form)
      },
      deep: true
    }
  },
  created() {
    this.loading = true

    // get structure
    this.em.structure().then(async res => {
      this.structure = res

      // fields transform
      const fields =
        this.fields !== '__all__'
          ? this.fields
          : Object.keys(this.structure)

      for (const field of fields) {
        if (typeof field === 'string') {
          this.properties.push({
            property: field
          })
          this.plainFields.push(field)
        } else {
          this.properties.push(field)
          this.plainFields.push(field.property)
        }
      }

      // fields process
      for (const field of this.plainFields) {
        const structure = this.structure[field]
        const property = this.properties.find(prop => field === prop.property)

        // Auto generate from structure
        if (structure && Object.keys(structure).includes('metadata')) {
          const metadata = structure.metadata

          // Rule generate
          this.rules[field] = [
            {
              // TODO: metadata type is different from rule types
              // type: metadata.type,
              required:
                Object.keys(property).includes('required')
                  ? property.required
                  : !metadata.nullable
            }
          ]

          // Tab
          if (Object.keys(property).includes('tab')) {
            this.tabs.add(property.tab)
          }
        }
      }

      if (this.id) {
        // Load update data
        this.fetchData(this.id)
      } else {
        // Load default data
        this.setDefaultData()
      }

      this.loading = false
    })
  },
  methods: {
    log(...arg) {
      return console.log(...arg)
    },

    uiFeedback() {
      return createUiFeedback(this)
    },

    loadPlugin(type) {
      const typeMapping = {
        'images': 'image',
        'ManyToOne': 'RelationToOne',
        'OneToOne': 'RelationToOne',
        'ManyToMany': 'RelationToMany',
        'OneToMany': 'RelationToMany'
      }

      const targetType = typeMapping[type] || type || 'input'
      const path = formPlugins[`./plugins/form/${targetType}.vue`]
        ? `./plugins/form/${targetType}.vue`
        : './plugins/form/input.vue'
      return resolveFormPlugin(path)
    },

    getMetadataType(currentStruct) {
      return currentStruct?.metadata?.type
    },

    setDefaultData() {
      // default value process
      const form = Object.assign({}, this.value)
      for (const field of this.plainFields) {
        const property = this.properties.find(prop => field === prop.property)
        // All fields

        // Set default value
        if (Object.keys(property).includes('default_value')) {
          form[field] = property.default_value
        } else {
          if (typeof form[field] === 'undefined') {
            form[field] = null
          }
        }
      }

      // set form
      this.form = form

      // Emit parent methods
      this.$emit('input', this.form)
    },

    fetchData(id) {
      this.em.retrieve(id).then(res => {
        const data = res.data
        const form = {}

        // replace relation fields
        for (const key of this.plainFields) {
          if (Object.keys(data).includes(key)) {
            const value = data[key]
            if (value != null) {
              if (typeof value === 'object' &&
                    Object.keys(value).includes('id')
              ) {
                // ManyToOne or OneToOne
                form[key] = value.id
              } else if (Array.isArray(value) && value.every(v => Object.keys(v).includes('id'))) {
                // ManyToMany or OneToMany
                try {
                  form[key] = value.map(v => v.id)
                } catch (e) {
                  // nothing
                }
              } else {
                // Others
                form[key] = value
              }
            }
          }
        }

        // set form
        this.form = form

        // Emit parent methods
        // this.$emit('input', this.form)
      })
    },

    cleanBlankAttributes(data) {
      for (var propName in data) {
        if (data[propName] === null || data[propName] === undefined) {
          delete data[propName]
        }
      }
    },

    onSubmit(success = (res) => {
      this.uiFeedback().success('数据修改成功')

      // Router go back default
      // this.$router.replace({ name: `${this.em.name}List` })
      this.$router.go(-1)
    }) {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          // Remove blank attributes
          this.cleanBlankAttributes(this.form)

          if (this.id) {
            this.em.update(this.id, this.form)
              .then(res => success(res))
              .catch(err => { this.uiFeedback().error(err.message) })
          } else {
            this.em.create(this.form)
              .then(res => success(res))
              .catch(err => { this.uiFeedback().error(err.message) })
          }
        } else {
          this.uiFeedback().warning('验证失败，请检查输入是否正确')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.help-text {
  display: flex;
  p {
    color: gray;
    line-height: 1.3em;
  }
  div {
    padding: 0 3px;
  }
}

.line {
  text-align: center;
}
</style>
