import { Schema as NormalizerSchema } from 'normalizr'
import { arrayOf, ValuesOf, Iterable } from './normalizer'
import { ModelBase } from './bases'
import { alias } from './utils'
import _ from 'lodash'

class Model extends ModelBase {
    constructor(schema, params, ...models) {
        super()
        if (params && params instanceof ModelBase) {
            models.unshift(params)
            params = {}
        }

        this._models = _.filter(models, model => model)
        this._schema = {
            ...schema,
            model: () => schema.model,
            params
        }
    }

    without = exclusion => this.applyModification('properties', _.omit(this._schema.properties, exclusion))
    only = selection => this.applyModification('properties', _.pick(this._schema.properties, selection))
    onlyIf = statement => this.applyModification('continue', statement === undefined ? true : statement)

    normalizeAs(key) {
        const model = this._schema.model()
        model._key = key
        return this.applyModification('model', () => model)
    }

    properties(props, overwrite) {
        if (Array.isArray(props)) {
            props = _.mapValues(_.mapKeys(props, prop => prop), () => ({type: 'string'}))
        }

        return this.applyModification('properties', overwrite ? props : {
            ...this._schema.properties,
            ...props
        })
    }
}

const model = (name, schema, options) => {
    schema = schema || {}

    const _model = (...models) => {
        let _key
        if (typeof models[0] === 'string') {
            _key = _.pullAt(models, 0)[0]
        }

        const params = _.pullAt(models, 0)[0]

        return new Model((_key ? alias(_model, _key) : _model).schema, params, ...models)
    }

    const formatSchema = (schema, options) => {
        if (!schema.properties && !schema.required) {
            schema = {
                properties: schema
            }
        }

        schema.properties = _.mapValues(schema.properties, (definition, name) => {
            if (definition.type == 'primary') {
                const _type = definition.type.split("|")
                schema.primaryKey = name

                return {
                    ...definition,
                    type: _type[1] || 'integer'
                }
            }

            return definition
        })

        schema = {
            key: name,
            primaryKey: 'id',
            model: new NormalizerSchema(name, {idAttribute: entity => entity[schema.primaryKey || 'id'], ...options}),
            additionalProperties: false,
            _isModel: true,
            _mockTypes: {},
            ..._model.schema || {},
            required: _.map(_.omitBy(schema.properties, prop => prop.model || typeof prop.type === 'function'), (prop, key) => key),
            ...schema
        }

        return schema
    }
    schema = formatSchema(schema, options)

    _model.schema = schema
    _model.define = definitions => {
        _model.schema._mockTypes = {}

        _model.schema.model.define(_.mapValues(definitions, (definition, key) => {
            _model.schema._mockTypes[key] = 'arrayOf'
            if (Array.isArray(definition)) return arrayOf(definition[0]).define()
            if (definition.schema) {
                _model.schema._mockTypes[key] = 'single'
                return definition.schema.model
            }

            if (definition.unionOf) {
                _model.schema._mockTypes[key] = 'single'
                return definition.define()
            }

            if (definition instanceof Iterable) {
                if (definition instanceof ValuesOf) {
                    _model.schema._mockTypes[key] = 'valuesOf'
                }
                return definition.define()
            }

            return definition
        }))
    }
    _model.getKey = () => _model.schema.key
    _model.primaryKey = key => _model.schema.primaryKey = key
    _model.setSchema = (schema, options) => {
        _model.schema = formatSchema(schema, options)
    }

    return _model
}

export { model as default, model, Model }