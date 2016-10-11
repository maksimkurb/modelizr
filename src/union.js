import { ModelBase } from './bases'
import { unionOf } from 'normalizr'
import _ from 'lodash'

class Union extends ModelBase {
    constructor(schema, models) {
        super()
        this._models = _.filter(models, model => model)
        this._schema = schema
    }

    params = params => this.applyModification('params', params)
}

const union = (key, models, options) => {
    options = options || {}

    let attribute = options.schemaAttribute ? {
        schemaAttribute: options.schemaAttribute
    } : {}

    attribute = options.mockAttribute ? {
        ...attribute,
        mockAttribute: options.mockAttribute
    } : {...attribute}

    const union = (..._models) => {
        if (typeof _models[0] === 'string') {
            key = _.pullAt(_models, 0)[0]
        }

        let params = _.pullAt(_models, 0)[0]

        if (params && params instanceof ModelBase) {
            _models.unshift(params)
            params = {}
        }

        let valid = true
        _.forEach(_models, val => {
            if (!_.find(models, model => model.schema.model == val._schema.model())) valid = false
        })
        if (!valid) {
            throw new Error("A union must be given models that have already been defined.")
        }

        const schema = {
            ...options,
            models,
            key,
            params,
            _isUnion: true
        }

        return new Union(schema, _models)
    }
    union.models = models
    union.options = options
    union.unionOf = _.mapValues(models, model => model.schema.model)
    union.define = () => unionOf(_.mapValues(models, model => model.schema.model), attribute)

    return union
}

export { union }