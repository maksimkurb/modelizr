import { describe, it } from "mocha";
import { assert, expect } from 'chai'
import { Schema } from 'normalizr'
import { model } from '../src'

describe("model", () => {

    const key = 'tests'

    const _model = model(key)
    describe("model instance with initial key 'tests'", () => {
        it("Should be a function", () => {
            assert.isFunction(_model)
        })

        const {schema} = _model

        describe("schema", () => {
            it("Should have a model property that should be an instance of Schema", () => {
                assert.property(schema, "key")
                assert.instanceOf(schema.model, Schema)
            })

            it("Should have a 'key' property of type string", () => {
                assert.property(schema, "key")
                assert.isString(schema.key)

                assert.equal(schema.key, "tests")
            })
        })

        describe("define()", () => {
            const __model = model('second')

            it("Should change the models schema by adding or adding to _mockTypes", () => {
                expect(() => {
                    _model.define({
                        second: __model
                    })
                }).to.change(_model.schema, "_mockTypes")
            })
        })

        describe("getKey()", () => {
            it("Should return the models key", () => {
                expect(_model.getKey()).to.equal(key)
            })
        })

        describe("primaryKey()", () => {
            it("Should mutate the primaryKey property", () => {
                const nextKey = "tests_key"

                expect(() => {
                    _model.primaryKey(nextKey)
                }).to.change(_model.schema, "primaryKey")
                expect(_model.schema.primaryKey).to.equal(nextKey)
            })
        })

        describe("setSchema()", () => {
            it("Should update the schema", () => {
                // expect(() => {
                //     _model.setSchema({
                //         firstName: {type: 'string'}
                //     })
                // }).to.change(_model.schema, "properties")
            })
        })
    })
})
