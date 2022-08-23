import { Inv } from 'wallet-util'
import Command, {TCommand} from './command'
import Opcode, {T_OPCODE} from './opcode'
import ContentCode, { T_CODE_NAME } from './content-code'
import { OP_CHECKSIG, OP_CONTENT, OP_DUP, OP_EQUALVERIFY, OP_HASH160 } from '../opcode'
import { SerializeConstitution, TConstitution } from '../constitution'
import { TByte } from '../constant'

export default class Script extends Array<Command> {

    static build = () => {

        const lockScript = (pubKeyHash: Inv.PubKH) => {
            return new Script().append()
            .opcode(OP_DUP)
            .opcode(OP_HASH160)
            .pubKH(pubKeyHash)
            .opcode(OP_EQUALVERIFY)
            .opcode(OP_CHECKSIG)
            .done()
        }

        const unlockScript = (signature: Inv.Signature, pubKey: Inv.PubKey) => {
            return new Script().append()
            .signature(signature)
            .pubKey(pubKey)
            .done()
        }

        const applicationProposal = (contentNonce: number, contentPKH: Inv.PubKH) => {
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .contentCode('PROPOSAL', 'APPLICATION')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }

        const costProposalScript = (contentNonce: number, contentPKH: Inv.PubKH, threadCost: Inv.InvBigInt, proposalCost: Inv.InvBigInt) => {
            let s = new Script().append()
            s.targetableContent(contentNonce, contentPKH)
            if (threadCost.big() > BigInt(0)){
                s = s.amount(threadCost)
                .contentCode('PROPOSAL', 'COSTS', 'THREAD_PRICE')
            }
            if (proposalCost.big() > BigInt(0)){
                s = s.amount(proposalCost)
                .contentCode('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE')
            }
            return s.contentCode('PROPOSAL', 'COSTS')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }

        const constitutionProposalScript = (contentNonce: number, contentPKH: Inv.PubKH, constitution: TConstitution) =>{
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .constitution(constitution)
            .contentCode('PROPOSAL', 'CONSTITUTION')
            .contentCode('PROPOSAL')
            .opcode(OP_CONTENT)
            .done()
        }
        
        const threadScript =  (contentNonce: number, contentPKH: Inv.PubKH) => {
            return new Script().append()
            .targetableContent(contentNonce, contentPKH)
            .contentCode('THREAD', 'THREAD')
            .contentCode('THREAD')
            .opcode(OP_CONTENT)
            .done()
        }

        const rethreadScript =  (contentNonce: number, contentPKH: Inv.PubKH, targetedThreadPKH: Inv.PubKH) => {
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
        const targetableContent = (nonce: number, pkh: Inv.PubKH) => _push(Inv.InvBigInt.fromNumber(nonce).to().bytes('uint32')).pubKH(pkh)
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

    toBase64 = () => this.map((e: Command) => e.toBase64())
    toBytes = () => this.map((e: Command) => e.bytes())
}