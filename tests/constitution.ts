import { expect } from 'chai';
import 'mocha';
import { MAX_CONSTITUTION_RULE } from '../src/constant';
import { DeserializeConstitution, NewConstitution, SerialConstitution } from '../src/constitution';

describe('Testing Constitution', () => {

    it('New', () => {
        const c = NewConstitution()
        expect(c.length).to.eq(MAX_CONSTITUTION_RULE)
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            expect(c[i].content).to.eq(c[i].title).to.eq('\r')
        }
    })

    it('Serialize/Deserialize', () => {
        const c = NewConstitution()
        let char = 'A'
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            c[i].title = char
            c[i].content = char+1
            char += 2
        }
        const copyString = JSON.stringify(c)
        const serial = SerialConstitution(c)
        expect(copyString).to.eq(JSON.stringify(DeserializeConstitution(serial)))
    })
})