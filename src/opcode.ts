import _ from "lodash"

export type T_OPCODE = 0x00 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18

const OPCODES: { [key: string]: T_OPCODE } = {
    OP_NULL: 0x00,
    OP_CHECKSIG:    0x14, // 20
    OP_EQUALVERIFY:  0x15, // 21
    OP_HASH160:      0x16, // 22s
    OP_DUP:          0x17, // 23
    OP_CONTENT:  0x18 // 24
}

export default class Opcode {
    
    static list = OPCODES

    constructor(private opcode: T_OPCODE){
        const op = _.get(_.invert(OPCODES), opcode, null)
        if (!op){
            throw new Error("This is not a valid opcode")
        }
        this.opcode = opcode
    }
    get = () => this.opcode
    bytes = () => new Uint8Array([this.get()])

    eq = (code: T_OPCODE) => this.get() === code
    toString = () => _.get(_.invert(OPCODES), this.get(), 'OP_NULL') 
}