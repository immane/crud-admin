import request from '@/utils/request'
const inflect = require('i')(true)

/**
 * When config is a string
 * Sample:
 *   const em = new EntityManage('Taxonomy')
 *
 * When config is an object
 * Sample:
 *   const em = new EntityManage({name: 'TaxonomyEntity'})
 *   const em = new EntityManage({name: 'TaxonomyEntity', plural: 'taxonomy-entities'})
 */
export default class EntityManage {
    name = null
    plural = null

    constructor(conf) {
      // Parameterize text.
      // etc: TaxonomyEntity -> taxonomy-entities
      const parameterize = text =>
        inflect.dasherize(inflect.underscore(inflect.pluralize(text)))

      if (typeof (conf) === 'string') {
        // string
        this.name = conf
        this.plural = parameterize(this.name)
      } else {
        // object
        this.name = conf.name
        if (Object.keys(conf).includes('plural')) {
          this.plural = conf.plural
        } else {
          this.plural = parameterize(this.name)
        }
      }
    }

    // TODO: put struct data into persist layer
    async structure() {
      /**
       * @description Entity list data modal
       * @example
       * {
       *    code: 0,
       *    message: 'SUCCESS',
       *    data: [
       *      "CommonBundle\\Entity\\User",
       *      "CommonBundle\\Entity\\UserProfile"
       *    ],
       *    paginator: {...}
       * }
       *
       * Entity detail data modal
       * {
       *    code: 0,
       *    message: 'SUCCESS',
       *    data: {
       *      id: {
       *        plantext: "Id",
       *        translation: "序号",
       *        metadata: {
       *          columnDefinition: null
       *          length: null
       *          name: null
       *          nullable: false
       *          options: []
       *          precision: 0
       *          scale: 0
       *          type: "integer"
       *          unique: false
       *        }
       *      },
       *      user: {
       *        plantext: "User"
       *        translation: "用户"
       *        metadata: {
       *          type: "ManyToOne",
       *          targetEntity: "CommonBundle\Entity\User"
       *        }
       *      }
       *    },
       *    paginator: {...}
       * }
       */
      const entities = await request.get('/manage/entities')
      const list = entities.data.filter(
        (v, i) => v.match(new RegExp(this.name))
      )

      if (list.length) {
        const structure = await request.get(`/manage/entities/${list[0]}`)
        return structure.data
      } else throw Error('No entity was found.')
    }

    async retrieve(pk) {
      return await request.get(`/manage/${this.plural}/${pk}`)
    }

    async list(parameter) {
      return await request.get(`/manage/${this.plural}`, { params: parameter })
    }

    async create(data) {
      return await request.post(`/manage/${this.plural}`, data)
    }

    async update(pk, data) {
      return await request.put(`/manage/${this.plural}/${pk}`, data)
    }

    async delete(pk) {
      return await request.delete(`/manage/${this.plural}/${pk}`)
    }
}
