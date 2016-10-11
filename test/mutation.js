import { describe, it } from "mocha";
import { assert, expect } from "chai";
import { mutation, model } from "../src";

describe("mutation", () => {
    const _mutation = mutation('test');
    let params = {};
    it("should parameterize scalars", () => {
        params = {p1: "p1", p2: 1, "p3": 'p3', "p4": 0.5};
        expect(_mutation.makeParams(params))
            .to.equal('(p1: "p1",p2: 1,p3: "p3",p4: 0.5)')
    })
    it("should parameterize arrays", () => {
        params = {p1: [1, 2, 3], p2: ["a", "b"]};
        expect(_mutation.makeParams(params))
            .to.equal('(p1: [1,2,3],p2: ["a","b"])')
    })
    it("should parameterize objects", () => {
        params = {p1: {"p1": "p1", "p2": 2}};
        expect(_mutation.makeParams(params))
            .to.equal('(p1: {p1:"p1",p2:2})')
    })
    it("should parameterize arrays of objects", () => {
        params = {p1: [{"p1": "p1", "p2": 2}, {"p3": "p3", "p4": 3}]};
        expect(_mutation.makeParams(params))
            .to.equal('(p1: [{p1:"p1",p2:2},{p3:"p3",p4:3}])')
    })
    it("should parameterize nested objects", () => {
        params = {p1: {"p1": "p1", "p2": {"p1": "p1", "p2": 2}}};
        expect(_mutation.makeParams(params))
            .to.equal('(p1: {p1:"p1",p2:{p1:"p1",p2:2}})')
    })
})