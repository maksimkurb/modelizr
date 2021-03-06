// @flow
import { Schema, arrayOf, unionOf } from 'normalizr'
import _ from 'lodash'

import CreateModel from './ModelBuilder'
import RequestBuilder from './RequestBuilder'
import { isValidType } from '../tools/Filters'
import { FETCH_API } from '../tools/Fetch'

import { ModelFunction, ClientStateType, UnionDataType, ModelDataType } from '../types'

export default class Modelizr {

    ClientState: ClientStateType;
    models: {[key:string]: ModelFunction} = {};

    constructor(InitialClientState: ClientStateType) {
        if (!InitialClientState) throw new Error("Modelizr expects a Client State as its first parameter")

        this.ClientState = {...InitialClientState}

        /* order is important, all model schemas must exist before union schemas are created */
        this.generateModelFunctions()
        this.buildUnionSchemas()
        this.defineModelRelationships()

        const defaultConfig = {
            mock: false,
            debug: false,
            api: FETCH_API,
            throwOnErrors: true
        }

        this.ClientState.config = {
            ...defaultConfig,
            ...InitialClientState.config || {}
        }
        if (!this.ClientState.config.endpoint)
            throw new Error("Please provide a base endpoint to make queries to")
    }

    /* Create ModelFunctions from the given model Data.
     *
     * If the DataType is a model (and not a union) then build
     * its normalizr schema. We do not create schemas' for unions until
     * after _all_ model schemas are present.
     * */
    generateModelFunctions() {
        const {models} = this.ClientState

        _.forEach(models, (data, name) => {
            const ModelData: ModelDataType | UnionDataType = {...data}

            if (!ModelData.normalizeAs) ModelData.normalizeAs = name
            if (!ModelData.primaryKey) ModelData.primaryKey = "id"

            if (!ModelData._unionDataType) ModelData.normalizrSchema = new Schema(ModelData.normalizeAs, {
                idAttribute: ModelData.primaryKey,
                ...ModelData.normalizrOptions || {}
            })

            this.ClientState.models[name] = ModelData
            this.models[name] = CreateModel(name)
        })
    }

    /* Build all normalizr schemas for union DataTypes. A check
     * to make sure the union is nor referencing imaginary models
     * is performed.
     * */
    buildUnionSchemas() {
        const {models} = this.ClientState

        _.forEach(models, (ModelData: ModelDataType | UnionDataType, modelName: string) => {
            if (ModelData._unionDataType) {
                /* filter out all non-existing models and warn about them */
                const ExistingModels = _.filter(ModelData.models, model => {
                    if (models[model]) return true
                    // eslint-disable-next-line no-console
                    console.warn(`Model "${model}" on union ${modelName} points to an unknown model`)
                })

                /* create a normalizr union */
                ModelData.normalizrSchema = unionOf(_.mapValues(_.mapKeys(ExistingModels, model => model), model =>
                        models[model].normalizrSchema
                    ), {schemaAttribute: ModelData.schemaAttribute}
                )
            }
        })
    }

    /* Recursively populate relationship information of each models
     * normalizr schema
     * */
    defineModelRelationships() {
        const {models} = this.ClientState

        type UnwrappedField = {
            field: string,
            isArray: boolean
        }

        /* Utility that flattens a field wrapped in an array */
        const unWrapArray = (field: Array<string> | string): UnwrappedField =>
            Array.isArray(field) ? {isArray: true, field: field[0]} :
            {isArray: false, field}

        _.forEach(models, (ModelData: ModelDataType | UnionDataType, modelName: string) => {
            if (!ModelData._unionDataType) {
                /* Filter out any model references that do not exist in our data set */
                const ModelFields = _.pickBy(ModelData.fields, (wrappedField, fieldName: string) => {
                    const {isArray, field} = unWrapArray(wrappedField)
                    if (typeof field === 'string' && !isValidType(field)) {
                        if (models[field]) return true
                        // eslint-disable-next-line no-console
                        console.warn(
                            `Field { ${fieldName}: ${isArray ? "[" : ""}"${field}"${isArray ? "]" : ""} } on '${modelName}' points to an unknown model`
                        )
                    }
                })

                /* Recursively define all model relationships on
                 * Model normalizr schemas
                 * */
                ModelData.normalizrSchema.define(
                    _.mapValues(ModelFields, wrappedField => {
                            const {isArray, field} = unWrapArray(wrappedField)
                            const ChildModel: ModelDataType | UnionDataType = models[field]

                            if (isArray) return arrayOf(ChildModel.normalizrSchema)
                            return ChildModel.normalizrSchema
                        }
                    )
                )
            }
        })
    }

    query = (...args: Array<any>) => RequestBuilder(this.ClientState, "query")(...args)
    mutate = (...args: Array<any>) => RequestBuilder(this.ClientState, "mutation")(...args)
    fetch = (...args: Array<any>) => RequestBuilder(this.ClientState, "fetch")(...args)
}