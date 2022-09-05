import { Inv } from 'wallet-util'
import Command, {TCommand} from './command'
import Opcode, {T_OPCODE} from './opcode'
import ContentCode, { T_CODE_NAME } from './content-code'
import { SerializeConstitution, TConstitution } from './constitution'
import { MAX_CONSTITUTION_RULE, MAX_TX_OUTPUT, MAX_UNIT_WRITING_COST, PUBKEY_H_BURNER, TByte } from './constant'
import { NOT_A_CONSTITUTION_PROPOSAL, NOT_A_COST_PROPOSAL, NOT_A_LOCK_SCRIPT, NOT_A_REWARD_SCRIPT, NOT_A_TARGETABLE_CONTENT, NOT_A_TARGETING_CONTENT } from './errors'
import _ from 'lodash'

const {
    OP_CHECKSIG,
    OP_CONTENT,
    OP_DUP,
    OP_EQUALVERIFY,
    OP_HASH160,
} = Opcode.list

export default class Script extends Array<Command> {

    static new = (array: string[] | Uint8Array[] | Inv.ArrayInvBuffer, stringEncoding: 'base64' | 'hex' | 'raw' = 'base64') => {
        if (array.length === 0)
            return new Script()
        if (typeof array[0] === 'string'){
            if (stringEncoding === 'base64')
                return new Script(...array.map((buf: any) => new Command(Inv.InvBuffer.from64(buf))))
            if (stringEncoding === 'hex')
                return new Script(...array.map((buf: any) => new Command(Inv.InvBuffer.fromHex(buf))))
            if (stringEncoding === 'raw')
                return new Script(...array.map((buf: any) => new Command(Inv.InvBuffer.fromRaw(buf))))
        }
        return new Script(...array.map((buf: any) => new Command(buf)))
    }

    static fromBase64 = (array: string[]) => Script.new(array, 'base64')
    static fromArrayBytes = (array: Uint8Array[]) => Script.new(array)

    static sizes = () => SCRIPT_LENGTH

    static build = () => {

        const lockScript = (pubKeyHash: Inv.PubKH) => {
            const s = new Script().append()
            .opcode(OP_DUP)
            .opcode(OP_HASH160)
            .pubKH(pubKeyHash)
            .opcode(OP_EQUALVERIFY)
            .opcode(OP_CHECKSIG)
            .done()
            return s
        }

        const unlockScript = (signature: Inv.Signature, pubKey: Inv.PubKey) => {
            return new Script().append()
            .signature(signature)
            .pubKey(pubKey)
            .done()
        }

        const applicationProposal = (contentNonce: Inv.InvBigInt, contentPKH: Inv.PubKH) => {
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .contentCode('PROPOSAL', 'APPLICATION')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }

        const costProposalScript = (contentNonce: Inv.InvBigInt, contentPKH: Inv.PubKH, threadCost: Inv.InvBigInt, proposalCost: Inv.InvBigInt) => {
            let s = new Script().append()
            s.targetableContent(contentNonce, contentPKH)
            if (threadCost.gt(0)){
                s = s.amount(threadCost)
                .contentCode('PROPOSAL', 'COSTS', 'THREAD_PRICE')
            }
            if (proposalCost.gt(0)){
                s = s.amount(proposalCost)
                .contentCode('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE')
            }
            return s.contentCode('PROPOSAL', 'COSTS')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }

        const constitutionProposalScript = (contentNonce: Inv.InvBigInt, contentPKH: Inv.PubKH, constitution: TConstitution) =>{
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .constitution(constitution)
            .contentCode('PROPOSAL', 'CONSTITUTION')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }
        
        const threadScript =  (contentNonce: Inv.InvBigInt, contentPKH: Inv.PubKH) => {
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .contentCode('THREAD', 'THREAD')
            .contentCode('THREAD')
            .opcode(OP_CONTENT)
            .done()
        }

        const rethreadScript =  (contentNonce: Inv.InvBigInt, contentPKH: Inv.PubKH, targetedThreadPKH: Inv.PubKH) => {
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .pubKH(targetedThreadPKH)
            .contentCode('THREAD', 'RETHREAD')
            .contentCode('THREAD')
            .opcode(OP_CONTENT)
            .done()
        }

        const rewardScript = (targetedThreadPKH: Inv.PubKH, vout: TByte) => {
            return new Script().append()
            .pubKH(targetedThreadPKH)
            .byte(vout)
            .contentCode('REWARD')
            .opcode(OP_CONTENT)
            .done()
        }

        const voteScript = (targetedProposalPKH: Inv.PubKH, accept: boolean) => {
            return new Script().append()
            .pubKH(targetedProposalPKH)
            .contentCode('VOTE', accept ? 'ACCEPTED' : 'DECLINED')
            .contentCode('VOTE')
            .opcode(OP_CONTENT)
            .done()
        }

        return {
            lockScript, unlockScript, applicationProposal, costProposalScript,
            constitutionProposalScript,
            threadScript, rethreadScript, rewardScript, voteScript
        }
    }
    
    copy = () => Script.new(this.bytes())

    append = () => {
        const _push = (a: TCommand) => {
            this.push(new Command(a))
            return this.append()
        }

        const amount = (n: Inv.InvBigInt) => _push(n.to().bytes('uint64'))
        const byte = (byte: TByte) => _push(new Uint8Array([byte]))

        const opcode = (code: T_OPCODE) => _push(new Opcode(code))
        const contentCode = (...path: T_CODE_NAME[]) => _push(new ContentCode(...path))
        const pubKH = (pubKH: Inv.PubKH) => _push(pubKH)
        const signature = (sig: Inv.Signature) => _push(sig)
        const pubKey = (pubk: Inv.PubKey) => _push(pubk)
        const targetableContent = (nonce: Inv.InvBigInt, pkh: Inv.PubKH) => _push(nonce.to().bytes('uint32')).pubKH(pkh)
        const constitution = (constitution: TConstitution) => _push(SerializeConstitution(constitution))

        const done = (): Script => {
            return this
        }

        return {
            amount,
            opcode,
            contentCode,
            byte,
            pubKH,
            signature,
            pubKey,
            targetableContent,
            done,
            constitution
        }
    }

    fullSizeOctet = () => Inv.InvBuffer.FromUint8s(...(this.map((c: Command) => c.bytes()))).length() + this.length

    parse = () => {
        const contentNonce = () => {
            if (this.is().targetableScript())
                return this[0].to().int()
            throw NOT_A_TARGETABLE_CONTENT
        }

        const PKHFromLockScript = (): Inv.PubKH => {
            if(this.is().lockingScript())
                return this[2].format().pubKH()
            if (this.is().contentScript())
                return Inv.PubKH.fromHex(PUBKEY_H_BURNER)
            throw NOT_A_LOCK_SCRIPT
        }

        const PKHFromContentScript = (): Inv.PubKH => {
            if (this.is().targetableScript())
                return this[1].format().pubKH()
            throw NOT_A_TARGETABLE_CONTENT
        }

        const targetPKHFromContentScript = (): Inv.PubKH => {
            if (this.is().onlyTargetingContentScript())
                return this[0].format().pubKH()
            if (this.is().targetingAndTargetableContentScript())
                return this[2].format().pubKH()
            throw NOT_A_TARGETING_CONTENT
        }

        const constitution = () => {
            if (this.is().constitutionProposalScript())
                return this[2].constitution()
            throw NOT_A_CONSTITUTION_PROPOSAL
        }

        const proposalCosts = () => {
            if (this.is().costProposalScript()){
                let thread = new Inv.InvBigInt(-1)
                let proposal = new Inv.InvBigInt(-1)
                let i = 2
                while (this[i].length() === 8){
                    const price = this[i].to().int()
                    const cat = this[i+1].getCodeAs().content('PROPOSAL', 'COSTS')
                    if (cat.eq('PROPOSAL', 'COSTS', "PROPOSAL_PRICE"))
                        proposal = new Inv.InvBigInt(price)
                    if (cat.eq('PROPOSAL', 'COSTS', 'THREAD_PRICE'))
                        thread = new Inv.InvBigInt(price)
                    i += 2
                }
                return { thread, proposal}
            }
            throw NOT_A_COST_PROPOSAL
        }

        const distributionVout = () => {
            if (this.is().rewardScript())
                return this[1].to().int()
            throw NOT_A_REWARD_SCRIPT
        }

        return {
            contentNonce,
            PKHFromLockScript,
            PKHFromContentScript,
            targetPKHFromContentScript,
            constitution,
            proposalCosts,
            distributionVout
        }
    }

    eq = (s: Script) => {
        if (s.length == this.length){
            const b1 = this.bytes()
            const b2 = this.bytes()
            for (let i = 0; i < this.length; i++){
                if (b1[i].toLocaleString() !== b2[i].toLocaleString())
                    return false
            }
        }
        return true
    }

    has = () => {
        const d2 = () => this.is().proposalScript() || this.is().threadD1Script() ||this.is().voteScript()
        const d3 = () => this.is().costProposalScript()
        return { d2, d3 }
    }

    is = () => {
        const lockingScript = () => {
             try {
                return this.length === Script.sizes().LOCK && 
                this[0].getCodeAs().op().eq(OP_DUP) && 
                this[1].getCodeAs().op().eq(OP_HASH160) && 
                this[2].format().pubKH() && 
                this[3].getCodeAs().op().eq(OP_EQUALVERIFY) && 
                this[4].getCodeAs().op().eq(OP_CHECKSIG)
             } catch (e){
                return false
             }
        }

        const unlockingScript = () => {
            try {
                return this.length === Script.sizes().UNLOCK && 
                !!this[0].format().signature() &&
                !!this[1].format().pubK()
            } catch (e){
               return false
            }
       }
       
       const targetableScript = () => this.is().onlyTargetableContentScript() || this.is().targetingAndTargetableContentScript()
       const targetingcript = () => this.is().onlyTargetingContentScript() || this.is().targetingAndTargetableContentScript()

       const targetingAndTargetableContentScript = () => {
            try {
                return this.is().contentScript() && 
                this[0].to().int(false).gt(0) &&
                !!this[1].format().pubKH() &&
                !!this[2].format().pubKH()                 
            } catch (e){
                return false
            }
       }

       const onlyTargetingContentScript = () => {
            try {
                return !targetingAndTargetableContentScript() &&
                this.is().contentScript() &&
                !!this[0].format().pubKH()
            } catch(e){
                return false
            }
       }

       const onlyTargetableContentScript = () => {
            try {
                return !targetingAndTargetableContentScript() &&
                this.is().contentScript() && 
                this[0].to().int(false).gt(0) &&
                !!this[1].format().pubKH()
            } catch (e){
                return false
            }
       }

       const contentScript = () => {
            try {
                return this[this.length-1].getCodeAs().op().eq(OP_CONTENT)
            } catch (e){
                return false
            }
       }

       const proposalScript = (): boolean => {
            try {
                return this.is().onlyTargetableContentScript() &&
                this.length >= Script.sizes().APPLICATION_PROPOSAL &&
                this.length <= Script.sizes().COST_PROPOSAL_MAX && 
                this[this.length - 2].getCodeAs().content().eq('PROPOSAL')
            } catch (e){
                return false
            }
        }

        const applicationProposalScript = (): boolean => {
            try {
                return this.is().proposalScript() &&
                this.length === Script.sizes().APPLICATION_PROPOSAL &&
                this[2].getCodeAs().content('PROPOSAL').eq('PROPOSAL', 'APPLICATION')
            } catch (e){
                return false
            }
        }

        const costProposalScript = (): boolean => {
            try {
                if (this.is().proposalScript() && this.length === Script.sizes().COST_PROPOSAL_MIN || this.length === Script.sizes().COST_PROPOSAL_MAX){
                    let i = 2
                    while (this[i].length() === 8){
                        const cost = this[i].to().int()
                        if (cost.lwe(0) || cost.gt(MAX_UNIT_WRITING_COST) || !this[i+1].getCodeAs().content('PROPOSAL', 'COSTS'))
                             return false
                        i += 2
                    }
                    return this[i].getCodeAs().content('PROPOSAL').eq('PROPOSAL', 'COSTS')
                }
                return false
            } catch (e){
                return false
            }
        }

        const constitutionProposalScript = (): boolean => {
            try {
                return this.is().proposalScript() &&
                this.length === Script.sizes().CONSTITUTION_PROPOSAL &&
                this[2].constitution().length === MAX_CONSTITUTION_RULE
            } catch (e){
                return false
            }
        }

        const threadD1Script = (): boolean => {
            try {
                return this.is().targetableScript() &&
                (this.length === Script.sizes().THREAD || this.length === Script.sizes().RETHREAD) &&
                this[this.length-2].getCodeAs().content().eq('THREAD')
            } catch (e){
                return false
            }
        }

        const threadD2Script = (): boolean => {
            try {
                return this.is().threadD1Script() &&
                this.length === Script.sizes().THREAD && 
                this[this.length-3].getCodeAs().content('THREAD').eq('THREAD', 'THREAD')                 
            } catch (e){
                return false
            }
        }

        const rethreadD2Script = (): boolean => {
            try {
                return this.is().threadD1Script() &&
                this.length === Script.sizes().RETHREAD && 
                !!this[2].format().pubKH() &&
                this[this.length-3].getCodeAs().content('THREAD').eq('THREAD', 'RETHREAD')                 
            } catch (e){
                return false
            }
        }

        const rewardScript = (): boolean => {
            try {
                const voutRedistribution = this[1].to().int()
                return this.is().onlyTargetingContentScript() &&
                this.length === Script.sizes().REWARD &&
                voutRedistribution.gte(0) && voutRedistribution.lwe(MAX_TX_OUTPUT-1) &&
                this[2].getCodeAs().content().eq('REWARD')
            } catch(e){ 
                return false
            }
        }

        const voteScript = (): boolean => {
            try {
                return this.is().onlyTargetingContentScript() &&
                this.length === Script.sizes().VOTE &&
                this[1].getCodeAs().content('VOTE') &&
                !!this[2].getCodeAs().content().eq('VOTE')
            } catch(e){ 
                return false
            }
        }

        const voteAcceptedD2 = () => this.typeD2() === 'ACCEPTED'
        const voteDeclinedD2 = () => this.typeD2() === 'DECLINED'

        return {
            lockingScript,
            unlockingScript,
            contentScript,
            targetableScript,
            targetingcript,
            onlyTargetableContentScript,
            onlyTargetingContentScript,
            targetingAndTargetableContentScript,
            proposalScript,
            applicationProposalScript,
            costProposalScript,
            constitutionProposalScript,
            threadD1Script,
            threadD2Script,
            rethreadD2Script,
            rewardScript,
            voteScript,
            voteAcceptedD2,
            voteDeclinedD2
        }
    }

    public typeD2 = () => {
        if (this.has().d2()){
            const i = this.length-1
            try {
                const D1 = this[i-1].getCodeAs().content()
                const D2 = this[i-2].getCodeAs().content(D1.name())
                return D2.name()
            } catch(e){
                console.log(e)
                return null
            }
        }
        return null
    }

    public type = () => {
        if (this.is().contentScript()){
            return new ContentCode(this[this.length-2].getCodeAs().content().name()).code()
        }
        return 0
    }

    public typeString = () => {
        if (this.type() === 0)
            return 'REGULAR'
        return ContentCode.newWithValues(this.type()).name()
    }
    
    base64 = (): string[] => {
        const ret: string[] = []
        this.forEach((e: Command) => ret.push(e.base64()))
        return ret
    }
    bytes = (): Uint8Array[] => {
        const ret: Uint8Array[] = []
        this.forEach((e: Command) => ret.push(e.bytes()))
        return ret
    }

    pretty(): string {

        const nonce = (index: number) => this[index].to().int().number()
        const contentCode = (index: number, motherCategoryPath: T_CODE_NAME[]) => this[index].getCodeAs().content(...motherCategoryPath).name()
        const opcode = (index: number) => this[index].getCodeAs().op().toString()
        const pkh = (index:number) => this[index].format().pubKH().to().string().hex()
        const sig = (index:number) => this[index].format().signature().to().string().hex()
        const pubk = (index:number) => this[index].format().pubK().to().string().hex()
        const amount = (index: number) => this[index].to().int().big().valueOf()


        if (this.is().contentScript()){
            let i = 0
            let str = ''
            if (this.is().proposalScript()){
                str = `NONCE:${nonce(0)} PKH:${pkh(1)} `
                i = 2
                if (this.is().costProposalScript()){
                    while (this[i].length() === 8){
                        str += `${amount(i)} ${contentCode(i+1, ['PROPOSAL', 'COSTS'])} `
                        i += 2
                    }
                } else if (this.is().constitutionProposalScript()){
                    str += `CONSTITUTION:${JSON.stringify(this[i].constitution())}`
                    i++
                }
                str += `${contentCode(i, ['PROPOSAL'])} `
                i++
            } else if (this.is().threadD1Script()){
                str = `NONCE:${nonce(0)} PKH:${pkh(1)} `
                i = 2
                if (this.is().rethreadD2Script()){
                    str += `TARGET_CONTENT_PKH:${pkh(i)} ` 
                    i++
                }
                str += `${contentCode(i, ['THREAD'])} `
                i++
            } else if (this.is().rewardScript()){
                str = `THREAD_PKH:${pkh(0)} VOUT_REDIS:${nonce(1)} `
                i = 2
            } else if (this.is().voteScript()){
                str = `PROPOSAL_PKH:${pkh(0)}`
                str += ` ${contentCode(1, ['VOTE'])} `
                i = 2
            }

            str += `${contentCode(i, [])} `
            i++
            str += opcode(i)
            return str
        }

        if (this.is().lockingScript()){
            return `${opcode(0)} ${opcode(1)} ${pkh(2)} ${opcode(3)} ${opcode(4)}`
        }

        if (this.is().unlockingScript()){
            return `SIGNATURE:${sig(0)} PUBLIC_KEY:${pubk(1)}`
        }

        return  ''
    }
}

const SCRIPT_LENGTH = {
    LOCK: Script.build().lockScript(Inv.PubKH.random()).length,
    UNLOCK: Script.build().unlockScript(Inv.Signature.random(), Inv.PubKey.random()).length,
    APPLICATION_PROPOSAL: Script.build().applicationProposal(new Inv.InvBigInt(1), Inv.PubKH.random()).length,
    COST_PROPOSAL_MIN: Script.build().costProposalScript(new Inv.InvBigInt(1), Inv.PubKH.random(), new Inv.InvBigInt(-1), new Inv.InvBigInt(5000)).length,
    COST_PROPOSAL_MAX: Script.build().costProposalScript(new Inv.InvBigInt(1), Inv.PubKH.random(), new Inv.InvBigInt(5000), new Inv.InvBigInt(5000)).length,
    CONSTITUTION_PROPOSAL: Script.build().constitutionProposalScript(new Inv.InvBigInt(1), Inv.PubKH.random(), [{title: 'Title', content: 'Rule'}]).length,
    THREAD: Script.build().threadScript(new Inv.InvBigInt(1), Inv.PubKH.random()).length,
    RETHREAD: Script.build().rethreadScript(new Inv.InvBigInt(1), Inv.PubKH.random(), Inv.PubKH.random()).length,
    REWARD: Script.build().rewardScript(Inv.PubKH.random(), 3).length,
    VOTE: Script.build().voteScript(Inv.PubKH.random(), true).length
}