import { expect } from 'chai';
import 'mocha';

import Opcode, {T_OPCODE} from '../src/opcode';
import ContentCode, { T_CODE_NAME } from '../src/content-code';
import Script from '../src/script'

import { NOT_A_CONSTITUTION_PROPOSAL, NOT_A_COST_PROPOSAL, NOT_A_LOCK_SCRIPT, NOT_A_REWARD_SCRIPT, NOT_A_TARGETABLE_CONTENT, NOT_A_TARGETING_CONTENT } from '../src/errors';
import { PUBKEY_H_BURNER, TByte } from '../src/constant';
import { NewConstitution, SerializeConstitution } from '../src/constitution';

import {Inv } from 'wallet-util'
const {
    InvBuffer,
} = Inv

const {
    OP_CHECKSIG, OP_DUP, OP_EQUALVERIFY, OP_HASH160, OP_CONTENT, T_OPCODE
} = Opcode.list

//utils
const cc = (...path: T_CODE_NAME[]) => new ContentCode(...path).bytes()
const op = (code: T_OPCODE) => new Opcode(code as any).bytes()

//data
const THREAD_PRICE = InvBuffer.fromNumber(3_000_000, 'uint64').bytes()
const PROPOSAL_PRICE = InvBuffer.fromNumber(5_000_000, 'uint64').bytes()
const VOUT = new Inv.InvBigInt(1)
const NONCE = new Inv.InvBigInt(5)
const VOUT_BYTES = VOUT.bytes('int8').bytes()
const NONCE_BYTES = NONCE.bytes('int32').bytes()
const PUBKH_BUFFER = InvBuffer.fromHex('93ce48570b55c42c2af816aeaba06cfee1224fae').bytes()
const PUBK_BUFFER = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
const SIGNATURE_BUFFER = InvBuffer.fromHex('3046022100ceadf41cc9f116107c38f56b4a77b86632b521cd03621ca962fc6e0c8dec3966022100aca63c2a4435f71e4510ff3ba62e285acf1a9c9f49d826ce5c6c9346e08cba77').bytes()


/* --- SCRIPTS --- */
//REGULAR
const LOCK_SCRIPT: Uint8Array[] = [op(OP_DUP), op(OP_HASH160), PUBKH_BUFFER, op(OP_EQUALVERIFY), op(OP_CHECKSIG)]
const UNLOCK_SCRIPT: Uint8Array[] = [SIGNATURE_BUFFER, PUBK_BUFFER]

//CONTENT
//proposal
const APPLICATION_PROPOSAL_SCRIPT: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)]
const COST_PROPOSAL_SCRIPT_PCHANGE: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, PROPOSAL_PRICE, cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)]
const COST_PROPOSAL_SCRIPT_TCHANGE: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, THREAD_PRICE, cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)]
const COST_PROPOSAL_SCRIPT_BOTHCHANGE: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, THREAD_PRICE, cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE, cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)]
const CONSTITUTION_PROPOSAL_SCRIPT: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)]

// //thread
const THREAD_SCRIPT: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)]
const RETHREAD_SCRIPT: Uint8Array[] = [NONCE_BYTES, PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)]

// //rewardx
const REWARD_SCRIPT: Uint8Array[] = [PUBKH_BUFFER, VOUT_BYTES, cc('REWARD'), op(OP_CONTENT)]

// //vote
const ACCEPTED_VOTE_SCRIPT: Uint8Array[] = [PUBKH_BUFFER, cc('VOTE', 'ACCEPTED'), cc('VOTE'), op(OP_CONTENT)]
const DECLINED_VOTE_SCRIPT: Uint8Array[] = [PUBKH_BUFFER, cc('VOTE', 'DECLINED'), cc('VOTE'), op(OP_CONTENT)]

//Scripts
describe('Testing script-engine', () => {

    it('Lock', () => {
        const s = Script.build().lockScript(new Inv.PubKH(PUBKH_BUFFER))
        expect(s.bytes().toLocaleString()).to.eq(LOCK_SCRIPT.toLocaleString())
        expect(s.type()).to.eq(0)
        expect(s.typeString()).to.eq('REGULAR')
        expect(s.typeD2()).to.eq(null)
        expect(s.fullSizeOctet()).to.eq(29)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.PKHFromLockScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(true)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(false)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(false)
        expect(is.targetingcript()).to.eq(false)
        expect(`OP_DUP OP_HASH160 93ce48570b55c42c2af816aeaba06cfee1224fae OP_EQUALVERIFY OP_CHECKSIG`).to.eq(s.pretty())


        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(false)
        expect(s.has().d3()).to.eq(false)
    });

    it('Unlocking', () => {
        const s = Script.build().unlockScript(new Inv.Signature(SIGNATURE_BUFFER), new Inv.PubKey(PUBK_BUFFER))
        expect(s.bytes().toString()).to.eq(UNLOCK_SCRIPT.toString())
        expect(s.type()).to.eq(0)
        expect(s.typeString()).to.eq('REGULAR')
        expect(s.typeD2()).to.eq(null)
        expect(s.fullSizeOctet()).to.eq(107)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.PKHFromLockScript()).to.throw(NOT_A_LOCK_SCRIPT.message)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(true)
        expect(is.contentScript()).to.eq(false)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(false)
        expect(is.targetingcript()).to.eq(false)
        expect(`SIGNATURE:3046022100ceadf41cc9f116107c38f56b4a77b86632b521cd03621ca962fc6e0c8dec3966022100aca63c2a4435f71e4510ff3ba62e285acf1a9c9f49d826ce5c6c9346e08cba77 PUBLIC_KEY:000000000000000000000000000000000000000000000000000000000000000000`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(false)
        expect(s.has().d3()).to.eq(false)
    });


    it('Application Proposal', () => {
        const s = Script.build().applicationProposal(NONCE, new Inv.PubKH(PUBKH_BUFFER))
        expect(s.bytes().toString()).to.eq(APPLICATION_PROPOSAL_SCRIPT.toString())
        expect(s.type()).to.eq(1)
        expect(s.typeString()).to.eq('PROPOSAL')
        expect(s.typeD2()).to.eq('APPLICATION')
        expect(s.fullSizeOctet()).to.eq(32)
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex() ).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(true)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)
        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae APPLICATION PROPOSAL OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)
    });

    it('Proposal Cost - Thread price update', () => {
        const s = Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new InvBuffer(THREAD_PRICE).to().int(false), new Inv.InvBigInt(-1))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_TCHANGE.toString())
        expect(s.type()).to.eq(1)
        expect(s.typeString()).to.eq('PROPOSAL')
        expect(s.typeD2()).to.eq('COSTS')
        expect(s.fullSizeOctet()).to.eq(43)
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().proposal.number()).to.eq(-1)
        expect(parse.proposalCosts().thread.big()).to.eq(new InvBuffer(THREAD_PRICE).to().int(false).big())
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)
        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 3000000 THREAD_PRICE COSTS PROPOSAL OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(true)
    });

    it('Proposal Cost - Proposal price update', () => {
        const s = Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new Inv.InvBigInt(-1), new InvBuffer(PROPOSAL_PRICE).to().int(false))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_PCHANGE.toString())
        expect(s.type()).to.eq(1)
        expect(s.typeString()).to.eq('PROPOSAL')
        expect(s.typeD2()).to.eq('COSTS')
        expect(s.fullSizeOctet()).to.eq(43)
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().thread.number()).to.eq(-1)
        expect(parse.proposalCosts().proposal.big()).to.eq(new InvBuffer(PROPOSAL_PRICE).to().int(false).big())
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)
        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 5000000 PROPOSAL_PRICE COSTS PROPOSAL OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(true)
    });


    it('Proposal Cost - Proposal & Thread price update', () => {
        const s = Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new InvBuffer(THREAD_PRICE).to().int(false), new InvBuffer(PROPOSAL_PRICE).to().int(false))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_BOTHCHANGE.toString())
        expect(s.type()).to.eq(1)
        expect(s.typeString()).to.eq('PROPOSAL')
        expect(s.typeD2()).to.eq('COSTS')
        expect(s.fullSizeOctet()).to.eq(54)
    
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().thread.big()).to.eq(new InvBuffer(THREAD_PRICE).to().int(false).big())
        expect(parse.proposalCosts().proposal.big()).to.eq(new InvBuffer(PROPOSAL_PRICE).to().int(false).big())
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)

        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 3000000 THREAD_PRICE 5000000 PROPOSAL_PRICE COSTS PROPOSAL OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(true)
    });
    
    it('Proposal Constitution', () => {
        const s = Script.build().constitutionProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), NewConstitution())
        expect(s.bytes().toString()).to.eq(CONSTITUTION_PROPOSAL_SCRIPT.toString())
        expect(s.type()).to.eq(1)
        expect(s.typeString()).to.eq('PROPOSAL')
        expect(s.typeD2()).to.eq('CONSTITUTION')
        expect(s.fullSizeOctet()).to.eq(81)

        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(parse.constitution().toString()).to.eq(NewConstitution().toString())
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(true)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)
    });

    it('Thread', () => {
        const s = Script.build().threadScript(NONCE, new Inv.PubKH(PUBKH_BUFFER))
        expect(s.bytes().toString()).to.eq(THREAD_SCRIPT.toString())
        expect(s.type()).to.eq(2)
        expect(s.typeString()).to.eq('THREAD')
        expect(s.typeD2()).to.eq('THREAD')
        expect(s.fullSizeOctet()).to.eq(32)
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(true)
        expect(is.threadD2Script()).to.eq(true)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(true)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(false)
        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae THREAD THREAD OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)
    });


    it('Re-Thread', () => {
        const s = Script.build().rethreadScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new Inv.PubKH(PUBKH_BUFFER))
        expect(s.bytes().toString()).to.eq(RETHREAD_SCRIPT.toString())
        expect(s.type()).to.eq(2)
        expect(s.typeString()).to.eq('THREAD')
        expect(s.typeD2()).to.eq('RETHREAD')
        expect(s.fullSizeOctet()).to.eq(53)
    
        const parse = s.parse()
        expect(parse.contentNonce().big()).to.eq(NONCE.big())
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(parse.targetPKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(true)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(true)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(false)
        expect(is.targetingAndTargetableContentScript()).to.eq(true)
        expect(is.targetableScript()).to.eq(true)
        expect(is.targetingcript()).to.eq(true)
        expect(`NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae TARGET_CONTENT_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae RETHREAD THREAD OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)
    });


    it('Reward', () => {
        const s = Script.build().rewardScript(new Inv.PubKH(PUBKH_BUFFER), VOUT.number() as TByte)
        expect(s.bytes().toString()).to.eq(REWARD_SCRIPT.toString())
        expect(s.type()).to.eq(3)
        expect(s.typeString()).to.eq('REWARD')
        expect(s.typeD2()).to.eq(null)
        expect(s.fullSizeOctet()).to.eq(27)

        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(parse.distributionVout().number()).to.eq(VOUT.number())

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(true)
        expect(is.voteScript()).to.eq(false)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(true)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(false)
        expect(is.targetingcript()).to.eq(true)
        expect(`THREAD_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae VOUT_REDIS:1 REWARD OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(false)
        expect(s.has().d3()).to.eq(false)

    });


    it('Accepted Vote', () => {
        const s = Script.build().voteScript(new Inv.PubKH(PUBKH_BUFFER), true)
        expect(s.bytes().toString()).to.eq(ACCEPTED_VOTE_SCRIPT.toString())
        expect(s.type()).to.eq(4)
        expect(s.typeString()).to.eq('VOTE')
        expect(s.typeD2()).to.eq('ACCEPTED')
        expect(s.fullSizeOctet()).to.eq(27)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(true)
        expect(is.voteAcceptedD2()).to.eq(true)
        expect(is.voteDeclinedD2()).to.eq(false)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(true)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(false)
        expect(is.targetingcript()).to.eq(true)
        expect(`PROPOSAL_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae ACCEPTED VOTE OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)

    });

    it('Declined Vote', () => {
        const s = Script.build().voteScript(new Inv.PubKH(PUBKH_BUFFER), false)
        expect(s.bytes().toString()).to.eq(DECLINED_VOTE_SCRIPT.toString())
        expect(s.type()).to.eq(4)
        expect(s.typeString()).to.eq('VOTE')
        expect(s.typeD2()).to.eq('DECLINED')
        expect(s.fullSizeOctet()).to.eq(27)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().to().string().hex()).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript().bytes()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockingScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadD1Script()).to.eq(false)
        expect(is.threadD2Script()).to.eq(false)
        expect(is.rethreadD2Script()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(true)
        expect(is.voteAcceptedD2()).to.eq(false)
        expect(is.voteDeclinedD2()).to.eq(true)
        expect(is.onlyTargetableContentScript()).to.eq(false)
        expect(is.onlyTargetingContentScript()).to.eq(true)
        expect(is.targetingAndTargetableContentScript()).to.eq(false)
        expect(is.targetableScript()).to.eq(false)
        expect(is.targetingcript()).to.eq(true)
        expect(`PROPOSAL_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae DECLINED VOTE OP_CONTENT`).to.eq(s.pretty())

        expect(s.copy().eq(s)).to.eq(true)
        expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
        expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
        expect(s.has().d2()).to.eq(true)
        expect(s.has().d3()).to.eq(false)
    });



})