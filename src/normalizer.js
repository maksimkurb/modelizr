import { normalize as Normalize, arrayOf as _arrayOf, valuesOf as _valuesOf, unionOf as _unionOf } from 'normalizr'
import { warn, hasValuesOf } from './utils'
import _ from 'lodash'

const normalize = (response, ...query) => {
    const _query = _.mapKeys(_.mapValues(query, model => model.build()), model => model.key)

    return Normalize(response, _.mapValues(_query, (entity, key) => {

        const model = entity._isUnion ?
            _unionOf(_.mapValues(entity.models, model => model.schema.model), {schemaAttribute: entity.schemaAttribute})
            : entity.model()

        switch (entity._modelType) {
            case "valuesOf":
                return _valuesOf(model)
            case "arrayOf":
                return _arrayOf(model)
        }

        if (Array.isArray(response[key])) return _arrayOf(model)
        if (hasValuesOf(response[key], model)) return _valuesOf(model)

        return model
    }))
}

class Iterable {
    constructor(model, options) {
        if (options) warn("Modelizr's arrayOf and valuesOf definitions don't support schemaAttributes and other options. Rather use unions")

        this.model = model
    }

    define() {
        return _valuesOf(this.model.schema ? this.model.schema.model : this.model.define())
    }
}

class ValuesOf extends Iterable {

}

const arrayOf = (model, options) => new Iterable(model, options)
const valuesOf = (model, options) => new ValuesOf(model, options)

export { normalize as default, normalize, arrayOf, valuesOf, ValuesOf, Iterable }