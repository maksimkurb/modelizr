import { base, warn, mapValid, extractMockedObjects, v4 } from './utils'
import jsf from 'json-schema-faker/lib'
import _ from 'lodash'

if (process.env.NODE_ENV !== 'production') {
    jsf.extend('faker', () => require('faker'))
    jsf.extend('chance', () => require('chance'))
} else {
    const message = name => () => warn(`${name} has been stripped from the production build. To continue to use ${name} in production, ` +
        `you can manually pass it to modelizr. See https://julienvincent.github.io/modelizr/docs/usage/Production.html for more information.`)

    jsf.extend('faker', () => message('faker'))
    jsf.extend('chance', () => message('chance'))
}

const RANDOM = "RANDOM"
const INCREMENT = "INCREMENT_ID"
const ID = {
    INCREMENT: INCREMENT,
    RANDOM: RANDOM
}

const mock = base()
mock.Class = class extends mock.Class {

    response() {
        const cache = {}
        const opts = {
            extensions: {},
            formats: {},
            jsfOptions: {},
            quantity: 20,
            error: false,
            delay: 0,
            idType: INCREMENT,
            idGenerator: v4,
            ...this.getModification('mockConfig')
        }
        const gen = opts.idGenerator

        _.forEach(opts.extensions, (extension, name) => {
            jsf.extend(name, extension)
        })
        _.forEach(opts.formats, (format, name) => {
            jsf.format(name, format)
        })
        jsf.option(opts.jsfOptions)

        const mock = models => extractMockedObjects(mapValid(models, model => {
            if (typeof model.build === 'function') {
                model = model.build()
            }

            model._modelType = model._modelType || 'arrayOf'

            const primary = model.primaryKey || 'id'
            const response = {}

            const newId = opts.idType === INCREMENT ? _.size(cache[model.model ? model.model().getKey() : model.key]) + 1
                : gen()
            let id = newId

            if (model._modelType == 'arrayOf' || model._modelType == 'valuesOf') {
                id = opts.idType === INCREMENT ? _.range(newId, newId + opts.quantity)
                    : _.map(_.range(0, opts.quantity), () => gen())
            }

            if (model.params) {
                if (model.params[primary]) {
                    id = model.params[primary]
                }
            }

            const getFromCache = id => {
                let _model = model
                let schemaAttribute = model.schemaAttribute

                if (typeof schemaAttribute === 'function') {
                    schemaAttribute = model.mockAttribute
                }

                /**
                 * If model is a union, pick a random model from the unions collection
                 */
                if (model._isUnion) {
                    const getSchema = model => {
                        const rand = (props, models) => {
                            let result
                            let count = 0

                            for (const prop in props) {
                                if (Math.random() < 1 / ++count) {
                                    if (models) {
                                        let _k = '';
                                        result = _.find(models, (model, key) => {
                                            if (model.getKey() == props[prop].key) {
                                                _k = key
                                                return true
                                            }
                                            return false
                                        })
                                        result.schema._definedAttribute = _k
                                    } else {
                                        result = props[prop]
                                        result.schema._definedAttribute = prop
                                    }
                                }
                            }

                            return result
                        }

                        if (_.size(model.properties)) return rand(model.properties, model.models).schema
                        return rand(model.models).schema
                    }

                    _model = {
                        type: 'object',
                        ...getSchema(model)
                    }
                    if (typeof _model.model !== 'function') {
                        const _m = _model.model
                        _model.model = () => _m
                    }
                }

                /**
                 * Find nested models and mock them
                 */
                const mergeNested = mockedModel => ({
                    ...mockedModel,
                    ...mock(_.map(_.filter(_model.properties, prop => prop._isModel || prop._isUnion), childModel => {
                        childModel._modelType = _model._mockTypes[childModel.key] || 'arrayOf'
                        return childModel
                    }))
                })

                _model.properties = _.pickBy(_.mapValues(_model.properties, (prop, key) => {
                    if (typeof prop.type === 'function') {
                        const gen = prop.type()
                        if (gen._schema.key == model.propertyOf) return undefined
                        return {...gen.build(), propertyOf: key}
                    }
                    return prop
                }), (prop, name) => {
                    if (prop.type == 'schemaAttribute') {
                        schemaAttribute = schemaAttribute || name
                        return false
                    }
                    return prop
                })

                /**
                 * Determine if a model with the same PK is in the cache. Use it if it is.
                 */
                const shouldSetSchema = (model._isUnion && schemaAttribute)
                const _key = _model.model().getKey()
                id = model._isUnion ? (opts.idType === INCREMENT ? _.size(cache[_key]) + 1 : gen()) : id
                if (cache[_key] && cache[_key][id]) {
                    return mergeNested({
                        ...cache[_key][id],
                        ...(shouldSetSchema ? {
                            [schemaAttribute]: _model._definedAttribute
                        } : {})
                    })
                }

                let mocked = _.set(jsf(_model), primary, id)
                if (shouldSetSchema) mocked = _.set(mocked, schemaAttribute, _model._definedAttribute)

                cache[_key] = {...cache[_key], [id]: mocked}

                if (opts.generateFromParams) {
                    _.forEach(_model.params, (param, key) => {
                        _model.properties = _.mapValues(_model.properties, (prop, _key) => {
                            if (_key == key && _key !== primary) {
                                if (prop._isModel || prop._isUnion) {
                                    return {
                                        ...prop,
                                        params: {
                                            ...prop.params,
                                            [prop.primaryKey]: param
                                        }
                                    }
                                }
                                if (prop.type == 'string' || prop.type == 'integer') _.set(mocked, key, param)
                            }
                            return prop
                        })
                    })
                }
                return mergeNested(mocked)
            }

            if (Array.isArray(id)) {
                response[model.key] = _.map(id, id => getFromCache(id))
                if (model._modelType == 'valuesOf') {
                    response[model.key] = _.mapKeys(response[model.key], entity => entity[primary])
                }
            } else {
                response[model.key] = getFromCache(id)
            }

            return response
        }))

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const error = opts.error
                if (error) {
                    if (error == 'throw') {
                        reject(new Error('Mocked Error'))
                    } else {
                        resolve({
                            status: error,
                            body: {}
                        })
                    }
                } else {
                    resolve({
                        status: 200,
                        body: mock(...this._models)
                    })
                }
            }, opts.delay)
        })
    }
}

export { mock as default, mock, ID }