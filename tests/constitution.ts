import { expect } from 'chai';
import 'mocha';
import { MAX_CONSTITUTION_RULE, MAX_RULE_CONTENT_LENGTH, MAX_RULE_TITLE_LENGTH } from '../src/constant';
import { DeserializeConstitution, NewConstitution, SerializeConstitution } from '../src/constitution';

const random = (n: number) => new Array(n).join().replace(/(.|$)/g, function(){return ((Math.random()*36)|0).toString(36);})

describe('Testing Constitution', () => {

    it('New', () => {
        const c = NewConstitution()
        expect(c.length).to.eq(MAX_CONSTITUTION_RULE)
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            expect(c[i].content).to.eq(c[i].title).to.eq('\r')
        }
    })

    it('Serialize with 10 rules', () => {
        const c = NewConstitution()
        let char = 'A'
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            c[i].title = char
            c[i].content = char+1
            char += 2
        }
        const serial = SerializeConstitution(c)
        expect(serial.toString().replace(/\s+/g, '')).to.eq(`AA1A2A21A22A221A222A2221A2222A22221A22222A222221A222222A2222221A2222222A22222221A22222222A222222221A222222222A2222222221`) 
    })

    it('Serialize with 5 rules', () => {
        const c = NewConstitution()
        let char = 'A'
        for (let i = 0; i < 5; i++){
            c[i].title = char
            c[i].content = char+1
            char += 2
        }
        const serial = SerializeConstitution(c)
        expect(serial.toString().replace(/\s+/g, '')).to.eq(`AA1A2A21A22A221A222A2221A2222A22221`) 
    })

    it('Serialize with 11 rules', () => {
        const c: any[] = []
        let char = 'A'
        for (let i = 0; i < 11; i++){
            c.push({
                title: char,
                content: char+1
            })
            char += 2
        }
        expect(() => SerializeConstitution(c)).to.throw(Error)
    })

    it('Serialize with 10 rules', () => {
        const c = NewConstitution()
        let char = 'A'
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            c[i].title = char
            c[i].content = char+1
            char += 2
        }
        c[4].content = random(MAX_RULE_CONTENT_LENGTH+1)
        expect(() => SerializeConstitution(c)).to.throw(Error)
        c[4].content = "yes"
        c[4].title = random(MAX_RULE_TITLE_LENGTH+1)
        expect(() => SerializeConstitution(c)).to.throw(Error)
        c[4].title = "yes"
        expect(() => SerializeConstitution(c)).to.not.throw(Error)
    })
})