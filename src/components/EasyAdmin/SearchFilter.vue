<template>
  <span>
    <span v-for="(v, k) in filters" :key="k" style="margin-right: .5em">
      <!-- Dynamic components and JSX function -->
      <div v-if="Object.keys(v).includes('component')">
        <component
          :is="v.component"
          v-model="value[k]"
        />
      </div>

      <!-- Datetime -->
      <el-date-picker
        v-if="v.type === 'datetime' || v.type === 'date' || v.type === 'time'"
        v-model="value[k]"
        :type="v.type"
        :placeholder="`${v.label ? v.label : k}`"
        style="width: 150px;"
        size="medium"
        :value-format="{
          datetime: 'yyyy-MM-dd HH:mm:ss',
          date: 'yyyy-MM-dd',
          time: 'HH:mm:ss',
        }[v.type]
        "
      />

      <!-- Input -->
      <el-input
        v-else-if="v.type === 'input'"
        v-model="value[k]"
        :placeholder="`${v.label ? v.label : k}`"
        style="width: 150px;"
        size="medium"
        clearable
      >
        <i slot="prefix" class="el-input__icon el-icon-search" />
      </el-input>

      <!-- Boolean -->
      <el-switch
        v-else-if="v.type === 'boolean'"
        v-model="value[k]"
        :inactive-text="`${v.label ? v.label : k}`"
        size="medium"
      />

      <!-- Select -->
      <el-select
        v-else
        v-model="value[k]"
        filterable
        clearable
        :placeholder="`${v.label ? v.label : k}`"
        style="width: 150px;"
        size="medium"
      >
        <el-option
          v-for="item in v.data"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </span>

    <el-button
      v-if="Object.keys(filters).length"
      size="medium"
      icon="el-icon-search"
      style="margin-right: 1em"
      circle
      @click="filterGenerate(); fetchData();"
    />

  </span>
</template>

<script>
export default {
  name: 'SearchFilter',

  props: {
    // v-model
    value: {
      type: Object,
      default: () => []
    },

    query: {
      type: Object,
      default: () => {}
    },

    filter: {
      type: Object,
      default: () => {}
    },

    fetchDataFunc: {
      type: Function,
      default: () => () => {}
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
         * @example
         * {
         *    //////////////////
         *    // Reduce style //
         *    //////////////////
         *
         *    // 1. Selection
         *    status: {
         *      __label: 'Status',
         *      __default: 0,
         *      0: 'Pending', 1: 'Paid', 2: 'Completed'
         *    }
         *
         *    // 2. Input
         *    status: 'Label here'
         *
         *    ////////////////
         *    // Full style //
         *    ////////////////
         *
         *    // 1. Selection
         *    'category': {
         *      expression: 'entity.getCategory().getId() == ":value"',
         *      label: 'Please Provide Category',
         *      type: 'select', // Types: select, input, datetime, date, time
         *      data: [
         *        { value: 'book', label: 'Book' },
         *        { value: 'paper', label: 'Paper' },
         *      ],
         *      default: 'book'
         *    }
         *
         *    // 2. Input
         *    'user.username': {
         *      expression: 'entity.getUser().getUsername() matches ":value"',
         *      label: 'Please Provide Username',
         *      type: 'input',
         *      default: 'Rin'
         *    }
         *
         *    // 3. Input
         *    'userEnabled': {
         *      expression: 'entity.getUser().getIsEnabled() == :value',
         *      label: 'User enabled',
         *      type: 'boolean',
         *      default: true
         *    }
         *
         *    // 4. DateTime / Date / Time
         *    beforeCreatedTime: {
         *      expression: 'entity.getCreatedTime() >= datetime.get(":value")',
         *      label: 'Before Time',
         *      type: 'datetime'
         *    }
         *
         *    //////////////////
         *    // Async sample //
         *    //////////////////
         *
         *    'category.id': () => {
         *      return axios
         *        .get('/api/categories',
         *          { params: { '@filter': 'entity.getType().getSlug() == "content"' }})
         *        .then(res =>
         *          Object.assign(
         *            { __label: 'Category', __default: 1 },
         *            ...res.data.map(v => { return { [v.id]: v.name } })
         *          )
         *        )
         *    }
         * }
         */
      }
    }
  },

  data() {
    return {
      // Table data source
      list: [],

      // Translated filter config
      filters: {}
    }
  },

  watch: {
    value: {
      handler: function(value) {
        this.list = value
        // this.refreshTable++
      },
      deep: true
    }
  },

  async created() {
    // Process filter
    await this.filterProcess()

    // Generate filter
    this.filterGenerate()

    /**
     * Fetch base data, like entity structure and validations
     */
    this.fetchData()
  },

  methods: {
    /* Debug */
    _console() {
      return console
    },

    /* Filter process */

    async filterProcess() {
      const filter = {}
      const isFunction = functionToCheck => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
      const transform = (field, key) => {
        if (
          field === null || typeof field === 'string' ||
          !Object.keys(field).includes('expression')
        ) {
          // transform
          let expression = ''
          const relationKeys = key.split('.')

          relationKeys.forEach((value, index) => {
            const capitalizeKey = value.charAt(0).toUpperCase() + value.slice(1)
            expression += `.get${capitalizeKey}()`
          })

          filter[key] = {
            data: typeof field === 'string' || field === null ? null : [],
            type: typeof field === 'string' || field === null ? 'input' : 'select',
            label: typeof field === 'string' ? field : '',
            default: null,
            expression: typeof field === 'string' || field === null
              ? `entity${expression} matches ':value'`
              : `entity${expression} == ':value'`
          }

          if (typeof field === 'object') {
            for (const k in field) {
              if (k === '__label') {
                filter[key]['label'] = field[k]
              } else if (k === '__default') {
                filter[key]['default'] = field[k]
              } else {
                filter[key]['data'].push(
                  { value: k, label: field[k] }
                )
              }
            }
          }
        } else {
          // full style
          filter[key] = field
        }

        // ///////////////////////////////////////////////////////
        // Set default value
        // DO NOT USE non-responsive set value
        // this.value[key] = filter[key]['default']
        //
        // Responsive set
        this.$set(this.value, key, filter[key]['default'])
      }

      for (const key in this.listFilter) {
        let field = this.listFilter[key]

        // receive async function
        if (isFunction(field)) {
          const promise = this.listFilter[key]()
          if (promise instanceof Promise) {
            const res = await this.listFilter[key]()
            field = res
            transform(res, key)
          } else throw Error('Async filter must return promise object!')
        } else {
          // receive normal value
          transform(field, key)
        }
      }

      this.filters = filter
    },

    filterGenerate() {
      const filter = {}
      if (this.query && Object.keys(this.query).includes('@filter')) {
        filter['@filter'] = this.query['@filter']
      }

      for (const key in this.value) {
        const value = this.value[key]
        if (value) {
          const expression = this.filters[key].expression.replaceAll(':value', value)
          if (filter['@filter']) {
            filter['@filter'] += ` && (${expression})`
          } else {
            filter['@filter'] = `(${expression})`
          }
        }
      }
      this.$emit('update:filter', filter)
    },

    fetchData() {
      // data process callback
      this.fetchDataFunc(this)
    }
  }
}
</script>
