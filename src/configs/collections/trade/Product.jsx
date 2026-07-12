import { t } from '@/i18n'
import { orderByIdDesc, statusFilterLabel } from '../helpers'
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'
import specificationConfig from './Specification'

const SpecificationManager = {
  components: { ListAdmin, FormAdmin },
  props: ['form', 'data', 'property', 'fields', 'field'],
  data() {
    return {
      dialogShow: false,
      specId: null,
      refreshKey: 0,
      specForm: {}
    }
  },
  computed: {
    productId() {
      let parent = this.$parent
      while (parent) {
        if (parent.$options.name === 'FormAdmin') {
          return Number(parent.id) || 0
        }
        parent = parent.$parent
      }
      return Number(this.$route?.params?.id) || 0
    },
    specEntityConf() {
      return {
        name: 'Specification',
        prefix: `/api/v1/manage/products/${this.productId}`,
        plural: 'specifications'
      }
    },
    inlineFields() {
      return specificationConfig.Specification.form.fields.filter(f =>
        typeof f === 'string' ? ['name', 'price', 'sort'].includes(f) : ['name', 'price', 'sort'].includes(f.property)
      )
    }
  },
  created() {
    if (!Array.isArray(this.form.specifications)) {
      this.form.specifications = []
    }
  },
  render() {
    const spec = specificationConfig.Specification

    if (!this.productId) {
      return (
        <div>
          <el-button
            size={'default'} type={'primary'} icon={'el-icon-plus'} plain
            onClick={() => { this.form.specifications.push({}) }}
          >{t('easyAdmin.add')}</el-button>
          {this.form.specifications.map((item, index) => (
            <div key={index}>
              <FormAdmin
                modelValue={this.form.specifications[index]}
                {...{ 'onUpdate:modelValue': v => { this.form.specifications[index] = v } }}
                entity-conf={'Specification'}
                fields={this.inlineFields}
                v-slots={{ action: () => <span /> }}
              />
              <p style={{ textAlign: 'right' }}>
                <el-button
                  type={'danger'} icon={'el-icon-delete'} circle
                  onClick={() => { this.form.specifications.splice(index, 1) }}
                />
              </p>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div>
        <ListAdmin
          key={this.refreshKey}
          entity-conf={this.specEntityConf}
          list-display={spec.list.list_display}
          list-filter={spec.list.list_filter}
          query={{ '@order': 'entity.sort|ASC, entity.id|DESC' }}
          v-slots={{
            topButton: () => (
              <el-button
                size={'default'} type={'primary'} icon={'el-icon-plus'} plain
                onClick={() => {
                  this.specId = null
                  this.specForm = { product: this.productId }
                  this.refreshKey++
                  this.dialogShow = true
                }}
              >{t('easyAdmin.new')}</el-button>
            ),
            'action:edit': ({ data }) => (
              <el-button
                size={'small'} icon={'el-icon-edit'} plain
                onClick={() => {
                  this.specId = data.id
                  this.specForm = { product: this.productId }
                  this.refreshKey++
                  this.dialogShow = true
                }}
              >{t('easyAdmin.edit')}</el-button>
            )
          }}
        />

        <el-dialog
          title={this.specId ? t('entity.updateSpec') : t('entity.newSpec')}
          modelValue={this.dialogShow}
          {...{
            'onUpdate:modelValue': v => { this.dialogShow = v },
            onClosed: () => { this.refreshKey++ }
          }}
          width={'40%'}
        >
          <FormAdmin
            key={this.refreshKey}
            id={this.specId}
            modelValue={this.specForm}
            {...{ 'onUpdate:modelValue': v => { this.specForm = v } }}
            entity-conf={this.specEntityConf}
            fields={spec.form.fields}
            v-slots={{
              action: ({ submit }) => (
                <el-button
                  type={'primary'} icon={'el-icon-edit-outline'}
                  onClick={() => {
                    submit(() => {
                      this.$message({ message: t('easyAdmin.saved'), type: 'success' })
                      this.refreshKey++
                      this.dialogShow = false
                      this.specForm = { product: this.productId }
                    })
                  }}
                >{t('easyAdmin.save')}</el-button>
              )
            }}
          />
        </el-dialog>
      </div>
    )
  }
}

export default {
  Product: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: t('entity.active') },
            { value: 'inactive', label: t('entity.inactive') }
          ]
        }},
        { property: 'metadata', type: 'json', required: false },
        {
          property: 'specifications',
          tab: t('entity.specifications'),
          component: SpecificationManager
        }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: t('entity.productName'),
        status: statusFilterLabel()
      },
      list_display: ['id', 'name', 'status', 'isDeleted', 'createdAt', 'updatedAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
