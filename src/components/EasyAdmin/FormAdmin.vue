<template>
  <div class="app-container">
    <el-row>
      <el-col :span="4">
        <slot name="formTitle">
          <strong style="font-size: 20px;">
            <!-- Title slot here -->
            {{ $route.meta.title }}
            {{ $t('New / Edit') }}
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
      element-loading-text="Loading..."
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
          >
            <template
              v-if="
                (!tabIndex && !Object.keys(field).includes('tab'))
                  || tab == field.tab
              "
            >
              <el-form-item
                v-if="field.property !== 'id' && !isHidden(field)"
                :label="
                  (Object.keys(field).includes('field_options') &&
                    Object.keys(field.field_options).includes('label'))
                    ? field.field_options.label
                    : (structure[field.property] ? structure[field.property]['translation']: field.property)
                "
                :prop="field.property"
                v-bind="field.field_options"
                v-on="field.field_events || {}"
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
                    :struct="structure[field.property]"
                  >
                    <component
                      :is="loadPlugin(resolvePluginType(field, structure[field.property]))"
                      :em-prefix="em.prefix"
                      :form="form"
                      :field="field"
                      :struct="structure[field.property]"
                    />
                  </slot>
                </template>

                <!-- Help text (supports HTML and Markdown: `code`, **bold**, *italic*, [link](url), lists, ```block```) -->
                <template v-if="Object.keys(field).includes('help')">
                  <aside class="help-text">
                    <span class="help-text__icon" aria-hidden="true">
                      <el-icon><el-icon-info /></el-icon>
                    </span>
                    <div class="help-text__content" v-html="renderHelp(field.help)" />
                  </aside>
                </template>
              </el-form-item>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-form-item>
        <slot name="action" :form="form" :submit="onSubmit">
          <el-button type="primary" icon="el-icon-edit-outline" @click="onSubmit()">{{ $t('Save') }}</el-button>
          <!--<el-button type="primary" @click="onSubmit()">Save and Continue Editing</el-button>-->
        </slot>
      </el-form-item>
    </el-form>

  </div>
</template>

<script>
import { defineAsyncComponent, markRaw, toRaw } from 'vue'
import { t } from '@/i18n'
import EntityManage from '@/utils/entity'
import Tinymce from '@/components/Tinymce'
import { createUiFeedback } from './ui/feedback'

const formPlugins = import.meta.glob('./plugins/form/*.vue')
const formPluginCache = {}

const resolveFormPlugin = path => {
  if (!formPluginCache[path]) {
    formPluginCache[path] = defineAsyncComponent(() => formPlugins[path]().then(module => module.default))
  }
  return formPluginCache[path]
}

export default {
  name: 'FormAdmin',
  components: { Tinymce },
  provide() {
    return {
      registerFieldValidator: this.registerFieldValidator,
      getFormAdmin: () => this
    }
  },
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
    modelValue: {
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
      tabs: new Set([t('Default')]),
      activeTab: '0',

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

        this.$emit('update:modelValue', { ...this.modelValue, ...this.form })
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
      const configuredFields = this.fields === '__all__' ? [] : this.fields
      const explicitFields = configuredFields.filter(field => typeof field !== 'string')
      const explicitProperties = new Set(explicitFields.map(field => field.property))
      const fields = this.fields === '__all__'
        ? Object.keys(this.structure)
        : configuredFields.includes('__all__')
          ? [...explicitFields, ...Object.keys(this.structure).filter(field => !explicitProperties.has(field))]
          : configuredFields

      for (const field of fields) {
        const normalized = typeof field === 'string' ? { property: field } : field
        if (this.isHidden(normalized)) continue
        if (typeof field === 'string') {
          this.properties.push({
            property: field
          })
          this.plainFields.push(field)
        } else {
          this.properties.push(field.component ? { ...field, component: markRaw(toRaw(field.component)) } : field)
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

        // Merge custom validation from field config
        // Supports `field.rules` (array) and `field.validator` (function)
        const customRules = []
        if (property.rules) {
          const arr = Array.isArray(property.rules) ? property.rules : [property.rules]
          customRules.push(...arr)
        }
        if (property.validator) {
          const validators = Array.isArray(property.validator) ? property.validator : [property.validator]
          validators.forEach(fn => {
            customRules.push({ validator: fn, trigger: 'blur' })
          })
        }
        if (customRules.length) {
          if (!this.rules[field]) this.rules[field] = []
          // Normalize: ensure each rule has trigger
          const normalized = customRules.map(r => {
            if (r.validator && !r.trigger) return { ...r, trigger: 'blur' }
            return r
          })
          this.rules[field].push(...normalized)
        }

        // Ensure required rule exists even without structure
        if (!this.rules[field] && Object.keys(property).includes('required') && property.required) {
          this.rules[field] = [{ required: true, message: `${field} is required`, trigger: 'blur' }]
        }
        // Tab for fields without structure
        if (!structure && Object.keys(property).includes('tab')) {
          this.tabs.add(property.tab)
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

    isHidden(field) {
      const h = field.hidden
      if (h === undefined || h === null) return false
      if (typeof h === 'boolean') return h
      if (Array.isArray(h)) {
        if (h.length === 0) return false
        const isCreate = !this.id
        const isUpdate = !!this.id
        if (h.includes('create') && isCreate) return true
        if ((h.includes('update') || h.includes('edit')) && isUpdate) return true
        return false
      }
      if (typeof h === 'function') {
        try {
          return !!h(this.form, this.id)
        } catch (_) {
          return false
        }
      }
      if (typeof h === 'string') {
        if (h === 'create' && !this.id) return true
        if ((h === 'update' || h === 'edit') && !!this.id) return true
      }
      return false
    },

    registerFieldValidator(fieldName, validator, trigger = 'blur') {
      if (!fieldName || typeof validator !== 'function') return
      if (!this.rules[fieldName]) this.rules[fieldName] = []
      // Avoid duplicate registration for same validator reference
      const exists = this.rules[fieldName].some(r => r.validator === validator)
      if (!exists) {
        this.rules[fieldName].push({ validator, trigger })
      }
    },

    uiFeedback() {
      return createUiFeedback(this)
    },

    loadPlugin(type) {
      const typeMapping = {
        'images': 'image',
        'datetime_immutable': 'datetime',
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

    resolvePluginType(field, currentStruct) {
      // Select needs explicit options. Metadata alone must not turn a normal
      // scalar into an empty select control.
      if (field.type) return field.type

      const type = currentStruct?.metadata?.type || ''
      const normalized = String(type).replace(/[_-]/g, '').toLowerCase()
      const relationTypes = {
        manytoone: 'ManyToOne',
        onetoone: 'OneToOne',
        manytomany: 'ManyToMany',
        onetomany: 'OneToMany'
      }
      if (relationTypes[normalized]) return relationTypes[normalized]

      const supportedMetadataTypes = new Set([
        'array', 'boolean', 'code', 'date', 'datetime',
        'datetime_immutable', 'file', 'image', 'images', 'integer',
        'json', 'text', 'textarea', 'transfer'
      ])
      return supportedMetadataTypes.has(type) ? type : 'input'
    },

    getMetadataType(currentStruct) {
      return currentStruct?.metadata?.type
    },

    setDefaultData() {
      // default value process
      const form = Object.assign({}, this.modelValue)
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
        const jsonFields = new Set(
          this.properties
            .filter(p => p.type === 'json')
            .map(p => p.property)
        )

        for (const key of this.plainFields) {
          if (Object.keys(data).includes(key)) {
            const value = data[key]
            if (value != null) {
              if (jsonFields.has(key)) {
                form[key] = value
              } else if (typeof value === 'object' &&
                    Object.keys(value).includes('id')
              ) {
                form[key] = value.id
              } else if (Array.isArray(value) && value.every(v => Object.keys(v).includes('id'))) {
                try {
                  form[key] = value.map(v => v.id)
                } catch (e) {
                  // nothing
                }
              } else {
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
      this.uiFeedback().success(this.$t('Data saved successfully'))

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
          this.uiFeedback().warning(this.$t('Validation failed \u2014 please check your input'))
          return false
        }
      })
    },

    /**
     * Render help text supporting both HTML and Markdown.
     * - HTML (existing `<code>` etc.) is preserved
     * - Markdown: `code`, ```block```, **bold**, *italic* / _italic_, [link](url), - list
     */
    renderHelp(help) {
      if (!help) return ''
      let html = String(help)

      // Fenced code blocks ```...```
      html = html.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre><code>${p1.trim()}</code></pre>`)

      // Inline code `...`  (avoid already converted <code> tags)
      html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>')

      // Bold **...**
      html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')

      // Italic *...* and _..._
      html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
      html = html.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>')

      // Links [text](url)
      html = html.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

      // Headings # ... (simple bold)
      html = html.replace(/^#{1,6}\s+(.*)$/gm, '<strong>$1</strong>')

      // Unordered lists: lines starting with - or * -> bullet
      html = html.replace(/^\s*[-*]\s+(.*)$/gm, '• $1')

      // Preserve existing <br> and convert bare newlines to <br> if needed
      if (html.includes('\n') && !html.includes('<br')) {
        html = html.split(/\n{2,}/).map(block => block.replace(/\n/g, '<br>')).join('<br><br>')
      }

      return html
    }
  }
}
</script>

<style lang="scss" scoped>
.help-text {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  flex: 0 0 100%;
  align-items: flex-start;
  column-gap: 8px;
  background: linear-gradient(90deg, #f0f7ff 0%, #fafcff 100%);
  border: 1px solid #d9ecff;
  border-radius: 5px;
  padding: 7px 10px;
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.55;
  color: #5f6b7a;
  word-break: break-word;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    color: #409eff;
    background: #fff;
    border: 1px solid #c6e2ff;
    border-radius: 50%;

    .el-icon {
      font-size: 12px;
    }
  }

  &__content {
    min-width: 0;
  }

  :deep(p) {
    margin: 0;
    color: inherit;
  }

  :deep(code) {
    display: inline;
    background: rgb(64 158 255 / 9%);
    color: #337ecc;
    padding: 0 3px;
    border-radius: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 11px;
    word-break: break-all;
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  :deep(br) {
    content: '';
    display: block;
    margin-top: 3px;
  }

  :deep(strong) {
    font-weight: 600;
    color: #303133;
  }

  :deep(em) {
    font-style: italic;
    color: #606266;
  }

  :deep(pre) {
    margin: 6px 0 0;
    padding: 8px 10px;
    background: #f6f8fa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: auto;
    font-size: 11px;
    line-height: 1.5;
  }

  :deep(pre code) {
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
  }

  :deep(ul),
  :deep(ol) {
    margin: 4px 0 0 18px;
    padding: 0;
  }

  :deep(li) {
    margin: 2px 0;
  }

  :deep(blockquote) {
    margin: 6px 0 0;
    padding-left: 8px;
    border-left: 2px solid #d9ecff;
    color: #909399;
  }
}

.line {
  text-align: center;
}
</style>
