const entityCollections = require.context('@/configs/collections', true, /\.js$/)

/**
 * You do not need `import entities from './entities/Entity'`
 * it will auto require all entity module from entities file
 *
 * Directory structure, supports nested entities
 * Note:
 * 1. Collection js only appear in the first level directory;
 * 2. AVOID using the SAME ENTITY NAMES, or the entity may be overwritten by some another entities.
 *
 * |---collections
 * |   |-- collection1.js
 * |   |-- collection2.js
 * |   |-- collection3
 * |       |-- Entity1.js
 * |       |-- Entity2.js
 * |   |-- collection4
 * |       |-- collection5
 * |       |   |-- Entity3.js
 * |       |-- Entity4.js
 *
 */
export default entityCollections.keys().reduce((entities, entityPath) => {
  const entityName = entityPath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const pathArray = entityName.split('/')
  if (pathArray.length === 1) {
    // Collections
    // set './collection.js' => '{}'
    // collections has no name
    // const [collectionName] = pathArray.slice(-1)
    // console.log('collection name:', collectionName)
    const value = entityCollections(entityPath)
    Object.assign(entities, value.default)
  } else {
    // Entities
    // set './Collection/Entity.js' => 'Entity'
    const [entityName] = pathArray.slice(-1)
    // console.log('Entity name:', entityName)
    const value = entityCollections(entityPath)
    entities[entityName] = value.default
  }
  return entities
}, {})
