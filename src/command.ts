import { Inv } from 'wallet-util'
import _ from 'lodash'
import Opcode from './opcode'
import ContentCode, { T_CODE_NAME } from './content-code'
import { DeserializeConstitution } from './constitution'

export type TCommand = Uint8Array | number[] | Command | Opcode | ContentCode | Inv.InvBuffer

export default class Command extends Inv.InvBuffer {

    static fromBase64 = (str: string) => new Command(Inv.InvBuffer.from64(str))

    static normalize = (e: TCommand) => {
        return new Command(Command.toUint8Array(e))
    }

    static toUint8Array = (elem: TCommand) => {
        if (elem instanceof Inv.InvBuffer){
            return elem.bytes()
        } else if (elem instanceof Command)
            return elem.bytes()
        else if (elem instanceof Uint8Array)
            return elem
        else if (elem instanceof Opcode)
            return elem.bytes()
        else if (elem instanceof ContentCode)
            return elem.bytes()
        else 
            return new Uint8Array(elem)
    }

    constructor(elem: TCommand){
        super(Command.toUint8Array(elem))
    }

    copy = () => new Command(this.bytes())
    
    assert = () => {
        const isCode = () => {
            if (!this.is().code())
                throw new Error("This script command is not a code")
        }
        return {
            isCode
        }
    }

    length = () => this.bytes().length
    codeValue = () => {
        this.assert().isCode()
        return this.bytes()[0]
    }
 
    is = () => {
        return {
            code: () => this.length() === 1,
            opcode: () => {
                if (this.is().code()){
                    try {
                        this.getCodeAs().op()
                        return true
                    } catch (e){
                        return false
                    }
                }
                return false
            },
            contentCode: () => this.is().code() && this.codeValue() > 0 && this.codeValue() <= ContentCode.MaxValue
        }
    }

    constitution = () => DeserializeConstitution(this) 

    getCodeAs = () => {
        return {
            op: () => new Opcode(this.codeValue() as any),
            content: (...motherPath: T_CODE_NAME[]) => {
                const codeValue = this.codeValue()

                if (motherPath.length === 0)
                    return ContentCode.newWithValues(codeValue)
                
                const code = new ContentCode(...motherPath)
                const depth = code.depth()
                if (depth){
                    for (let c of depth){
                        if (c.value === codeValue) {
                            const ret = new ContentCode(...motherPath, c.name)
                            return ret
                        }
                    }
                }
                throw new Error("content opcode not found")
            }
        }
    }

    base64 = () => new Inv.InvBuffer(this.bytes()).to().string().base64()
}
