import { expect } from 'chai';
import 'mocha';
import { Inv } from 'wallet-util'
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

    it('Serialize with too big rules', () => {
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

    it('Deserialize with 10 rules', () => {
        const c = NewConstitution()
        let char = 'A'
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            c[i].title = char + '\n'
            c[i].content = char+1
            char += 2
        }
        const serial = SerializeConstitution(c)
        expect(JSON.stringify(DeserializeConstitution(serial))).to.eq(`[{"title":"A","content":"A1"},{"title":"A2","content":"A21"},{"title":"A22","content":"A221"},{"title":"A222","content":"A2221"},{"title":"A2222","content":"A22221"},{"title":"A22222","content":"A222221"},{"title":"A222222","content":"A2222221"},{"title":"A2222222","content":"A22222221"},{"title":"A22222222","content":"A222222221"},{"title":"A222222222","content":"A2222222221"}]`) 
    })

    it('Deserialize with 5 rules', () => {
        let serial: string = ''
        let char = 'A'
        for (let i = 0; i < 5; i++){
            serial += char + '\n'
            serial += char+1
            if (i < 4)
                serial += '\n\n'
            char += 2
        }
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(serial))).to.throw(Error)
    })

    it('Deserialize with 11 rules', () => {
        let serial: string = ''
        let char = 'A'
        for (let i = 0; i < 11; i++){
            serial += char + '\n'
            serial += char+1
            if (i < 10)
                serial += '\n\n'
            char += 2
        }
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(serial))).to.throw(Error)
    })

    it('Deserialize with too big rules', () => {
        let serial: string = ''
        let char = 'A'
        for (let i = 0; i < 10; i++){
            serial += i == 2 ? random(MAX_RULE_TITLE_LENGTH+1) + '\n' : (char + '\n')
            serial += char+1
            if (i < 9)
                serial += '\n\n'
            char += 2
        }
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(serial))).to.throw(Error)
        serial = ''
        char = 'A'
        for (let i = 0; i < 10; i++){
            serial += (char + '\n')
            serial += i == 2 ? random(MAX_RULE_CONTENT_LENGTH+1) + '\n' : (char+1)
            if (i < 9)
                serial += '\n\n'
            char += 2
        }
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(serial))).to.throw(Error)
    })

    it('Deserialize with no endline', () => {
        let serial: string = ''
        let char = 'A'
        for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
            serial += char
            serial += char+1
            char += 2
        }
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(serial))).to.throw(Error)
    })

    it('Deserialize with random', () => {
        expect(() => DeserializeConstitution(Inv.InvBuffer.fromRaw(random(300)))).to.throw(Error)
    })
})