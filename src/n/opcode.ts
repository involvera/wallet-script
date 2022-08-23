export const OP_NULL = 0x00 //0
export const OP_CHECKSIG    = 0x14 // 20
export const OP_EQUALVERIFY = 0x15 // 21
export const OP_HASH160     = 0x16 // 22
export const OP_DUP         = 0x17 // 23
export const OP_CONTENT     = 0x18 // 24

export type T_OPCODE = 0x00 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18
export type T_OPCODE_STR = 'OP_NULL' | 'OP_CHECKSIG' | 'OP_EQUALVERIFY' | 'OP_HASH160' | 'OP_DUP' | 'OP_CONTENT'
export const OPCODE_LIST: T_OPCODE[] = [OP_NULL, OP_CHECKSIG, OP_EQUALVERIFY, OP_HASH160, OP_DUP, OP_CONTENT]

export default class Opcode {
    
    constructor(private opcode: T_OPCODE){
        if (OPCODE_LIST.indexOf(opcode) === -1){
            throw new Error("This is not a valid opcode")
        }
        this.opcode = opcode
    }
    get = () => this.opcode
    bytes = () => new Uint8Array([this.get()])

    toString = (): T_OPCODE_STR => {
        switch (this.get()) {
            case OP_CHECKSIG:
                return "OP_CHECKSIG"
            case OP_EQUALVERIFY:
                return "OP_EQUALVERIFY"
            case OP_HASH160:
                return "OP_HASH160"
            case OP_DUP:
                return "OP_DUP"
            case OP_CONTENT:
                return "OP_CONTENT"
            default:
                return "OP_NULL"
        }
    }
}