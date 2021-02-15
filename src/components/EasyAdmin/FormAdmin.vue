<template>
  <div class="app-container">
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
      <div
        v-for="field in properties"
        :key="field.property"
        :set="currentStruct = structure[field.property]"
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
            <component :is="field.component" :data="form[field.property]" />
          </template>

          <!-- Normal fields -->
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
              <!-- Dummy -->
              <template v-if="false" />

              <!-- Datetime -->
              <el-date-picker
                v-else-if="field.type == 'datetime' || checkMetadataType(currentStruct, 'datetime')"
                v-model="form[field.property]"
                type="datetime"
                placeholder="选择日期时间"
                v-bind="field.type_options"
                v-on="field.type_events"
              />

              <!-- Date -->
              <el-date-picker
                v-else-if="field.type == 'date' || checkMetadataType(currentStruct, 'date')"
                v-model="form[field.property]"
                type="date"
                placeholder="选择日期"
                v-bind="field.type_options"
                v-on="field.type_events"
              />

              <!-- Integer -->
              <el-input-number
                v-else-if="field.type == 'integer' || checkMetadataType(currentStruct, 'integer')"
                v-model="form[field.property]"
                v-bind="field.type_options"
                v-on="field.type_events"
              />

              <!-- Boolean -->
              <el-checkbox
                v-else-if="field.type == 'boolean' || checkMetadataType(currentStruct, 'boolean')"
                v-model="form[field.property]"
                v-bind="field.type_options"
                v-on="field.type_events"
              />

              <!-- Textarea -->
              <tinymce
                v-else-if="field.type == 'text' || checkMetadataType(currentStruct, 'text')"
                v-model="form[field.property]"
                :height="300"
                v-bind="field.type_options"
                v-on="field.type_events"
              />

              <!-- Uploads -->
              <!-- image -->
              <el-upload
                v-else-if="field.type === 'image'"
                v-bind="field.type_options"
                :action="`${BASE_API}/upload`"
                :limit="1"
                :file-list="
                  form[field.property]
                    ? [{name: form[field.property], url: `${BASE_API}/uploads/images/${form[field.property]}`}]
                    : []
                "
                list-type="picture"
                :on-remove="(file, fileList) => form[field.property] = ''"
                :on-success="(res, file) => { form[field.property] = res.data[0] }"
                v-on="field.type_events"
              >
                <el-button size="small" type="primary">点击选择媒体/文件</el-button>
                <div slot="tip" class="el-upload__tip">JPG或PNG文件必须少于10MB</div>
              </el-upload>

              <!-- file -->
              <el-upload
                v-else-if="field.type === 'file'"
                v-bind="field.type_options"
                :action="`${BASE_API}/upload`"
                :limit="1"
                :file-list="
                  form[field.property]
                    ? [{name: form[field.property], url: `${BASE_API}/uploads/images/${form[field.property]}`}]
                    : []
                "
                list-type="file"
                :on-remove="(file, fileList) => form[field.property] = ''"
                :on-success="(res, file) => { form[field.property] = res.data[0] }"
                v-on="field.type_events"
              >
                <el-button size="small" type="primary">点击选择文件</el-button>
                <div slot="tip" class="el-upload__tip">上传文件必须少于100MB</div>
              </el-upload>

              <!-- ManyToOne or OneToOne -->
              <el-select
                v-else-if="
                  currentStruct && currentStruct.hasOwnProperty('metadata') &&
                    ['ManyToOne', 'OneToOne'].includes(currentStruct.metadata.type)
                "
                v-model="form[field.property]"
                filterable
                placeholder="请选择"
                v-bind="field.type_options"
                v-on="field.type_events"
              >
                <el-option
                  v-for="item in options[field.property]"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>

              <!-- ManyToMany or OneToMany -->
              <el-select
                v-else-if="
                  currentStruct && currentStruct.hasOwnProperty('metadata') &&
                    ['ManyToMany', 'OneToMany'].includes(currentStruct.metadata.type)
                "
                v-model="form[field.property]"
                filterable
                placeholder="请选择"
                v-bind="field.type_options"
                multiple
                v-on="field.type_events"
              >
                <el-option
                  v-for="item in options[field.property]"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>

              <!-- Others -->
              <el-input
                v-else
                v-model="form[field.property]"
                v-bind="field.type_options"
                v-on="field.type_events"
              />
            </slot>
          </template>

        </el-form-item>
      </div>

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

export default {
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
         *     type: 'image',
         *     required: true,
         *     field_options: { label: 'Cover image' },
         *     field_events: { click: () => alert('Clicked') },
         *     type_options: { disabled: true },
         *     type_events: { input: () => alert('Inputed') }
         *   },
         *   { property: 'region',
         *     relation_filter: {
         *       '@filter': 'entity.getLevel() == 0',
         *       '@order': 'name|DESC, id|ASC'
         *     }
         *   },
         *   'name',
         *   'parent',
         *   'enabled'
         * ]
         */
      ]
    }
  },
  data() {
    return {
      // base api
      BASE_API: process.env.VUE_APP_BASE_API,

      // entity manager instance
      em: new EntityManage(this.entityConf),

      // entity structure
      structure: {},

      // all plain fields
      plainFields: [],

      // form data
      form: this.value,

      // field vaildations
      rules: {},

      // m2o or o2o options
      options: {},

      // translated fields
      properties: [],

      // loading
      loading: true
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

          // Selection generate
          if (['ManyToOne', 'OneToOne', 'OneToMany', 'ManyToMany'].includes(metadata.type)) {
            let entityName = metadata.targetEntity.split('\\')
            if (entityName) {
              entityName = entityName.pop()

              try {
                const em = new EntityManage(entityName)
                const currentProperty = this.properties.find(v => v.property === field)
                const targetList = await em.list(
                  typeof currentProperty.relation_filter !== 'undefined'
                    ? currentProperty.relation_filter
                    : null
                )

                this.options[field] =
                  targetList.data.map(v => { return { value: v.id, label: v.__toString || v.name || v.title } })

              // eslint-disable-next-line no-empty
              } catch (e) {}
            }
          }
        }
      }

      // loading update data
      if (this.id) {
        this.fetchData(this.id)
      }

      this.loading = false
    })
  },
  methods: {
    checkMetadataType(currentStruct, type) {
      return currentStruct && Object.keys(currentStruct).includes('metadata') && currentStruct.metadata.type === type
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
              } else if (Array.isArray(value)) {
                // ManyToOne or OneToOne
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

        // emit parent methods
        this.$emit('input', form)
      })
    },
    onSubmit(success = () => {
      this.$message({ message: '数据修改成功', type: 'success' })
      this.$router.replace({ name: `${this.em.name}List` })
    }) {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (this.id) {
            this.em.update(this.id, this.form)
              .then(res => success())
              .catch(err => { this.$message.error(err.message) })
          } else {
            this.em.create(this.form)
              .then(res => success())
              .catch(err => { this.$message.error(err.message) })
          }
        } else {
          this.$message({ message: '验证失败，请检查输入是否正确', type: 'warning' })
          return false
        }
      })
    }
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
</style>

