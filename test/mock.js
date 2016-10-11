import { describe, it } from "mocha";
import { expect } from 'chai'
import { model, union, query } from '../src'
import _ from 'lodash'

const m1 = model('m1', {
    m1_p: {type: 'primary'},
    m1_f1: {type: "string"}
})

const m2 = model('m2', {
    m2_p: {type: 'primary'},
    m2_f1: {type: 'string'}
})

const u1 = union("u1", {
    m1: m1,
    m2: m2
})

m1.define({
    m2: [m2]
})

describe("mocking a single model in a query", () => {
    it("Should produce 20 entities.", done => {
        query(m1()).mock().then(res => {
            const {body} = res
            expect(body).to.have.property("m1")
            expect(body.m1).to.be.instanceof(Array)
            expect(body.m1).to.have.length.of(20)

            describe("body.m1", () => {
                it("should have [string] fields m1_f1", done => {
                    _.forEach(body.m1, entity => {
                        expect(entity).to.have.property("m1_f1")
                        expect(entity.m1_f1).to.be.a('string')
                    })
                    done()
                })
            })

            done()
        }).catch(done)
    })
})

describe("mocking nested models in a query", () => {
    it("Should produce 20 -> 20 entities.", done => {
        query(m1(m2())).mock().then((res, normalize) => {
            const {body} = res
            const {m1} = body

            describe("normalized response", () => {
                const {entities} = normalize(body)

                it("Should have properties m1 [20] and m2 [400]", () => {
                    expect(entities).to.have.property("m1")
                    expect(entities).to.have.property("m2")

                    expect(_.size(entities.m1)).to.equal(20)
                    expect(_.size(entities.m2)).to.equal(400)

                    describe("m2", () => {
                        it("should have incrementing ids from 1 -> 400", done => {
                            let next = 1
                            _.forEach(entities.m2, entity => {
                                expect(entity.m2_p).to.equal(next)
                                next += 1
                            })

                            done()
                        })
                    })
                })
                done()
            })
        }).catch(done)
    })
})

describe("mocking unions", () => {
    it("")
})

describe("mocking value of", () => {

})