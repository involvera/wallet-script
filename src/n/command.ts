import { Inv } from 'wallet-util'
import Opcode from './opcode'
import ContentCode from './content-code'

export type TCommand = Uint8Array | number[] | Command | Opcode | ContentCode | Inv.InvBuffer

export default class Command {

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

    private elem: Uint8Array
    constructor(elem: TCommand){
        this.elem = Command.toUint8Array(elem)
    }

    assert = () => {
        const isCode = () => {
            if (!this.is().code())
                throw new Error("This script command is not a code")
        }
        return {
            isCode
        }
    }

    bytes = () => this.elem
    length = () => this.bytes().length
 
    is = () => {
        return {
            code: () => this.length() === 1,
        }
    }

    getCodeAs = () => {
        return {
            ops: () =>{
                this.assert().isCode()
                new Opcode(this.bytes()[0] as any)
            },
            content: () => {
                this.assert().isCode()
                new ContentCode(this.bytes()[0] as any)
            }
        }
    }

    toBase64 = () => new Inv.InvBuffer(this.bytes()).to().string().base64()
}
