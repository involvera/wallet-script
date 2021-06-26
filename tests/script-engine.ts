import { expect } from 'chai';
import 'mocha';

import ScriptEngine from '../src/engine'
import { EncodeInt, EncodeInt64 } from 'wallet-util'
import { OP_CHECKSIG, OP_DUP, OP_EQUALVERIFY, OP_HASH160, OP_CONTENT } from '../src/opcode';

import { 
    PROPOSAL_COST_PROPOSAL__CAT_DEPTH_3,
    PROPOSAL_APPLICATION__CAT_DEPTH_2, PROPOSAL__CAT_DEPTH_1, 
    PROPOSAL_COST__CAT_DEPTH_2, PROPOSAL_CONSTITUTION__CAT_DEPTH_2,
    THREAD_THREAD__CAT_DEPTH_2, THREAD__CAT_DEPTH_1,
    THREAD_RETHREAD__CAT_DEPTH_2, REWARD__CAT_DEPTH_1,
    VOTE_DECLINED__CAT_DEPTH_2, VOTE_ACCEPTED__CAT_DEPTH_2,
    VOTE__CAT_DEPTH_1,
    PROPOSAL_CODE,
    PROPOSAL_COST_THREAD__CAT_DEPTH_3,
    THREAD_CODE,
    REWARD_CODE,
    VOTE_CODE
} from '../src/content'
import { EMPTY_CODE } from '../src/content';
import { NOT_A_CONSTITUTION_PROPOSAL, NOT_A_COST_PROPOSAL, NOT_A_REWARD_SCRIPT, NOT_A_TARGETABLE_CONTENT, NOT_A_TARGETING_CONTENT, WRONG_LOCK_SCRIPT } from '../src/errors';
import { PUBKEY_H_BURNER } from '../src/constant';
import { NewConstitution, SerialConstitution } from '../src/constitution';


const THREAD_PRICE = 3_000_000
const PROPOSAL_PRICE = 5_000_000

const VOUT = 1
const NONCE = 5
const VOUT_BYTES = Buffer.from([VOUT])
const NONCE_BYTES = EncodeInt(BigInt(NONCE))
const PUBKH_BUFFER = Buffer.from('93ce48570b55c42c2af816aeaba06cfee1224fae', 'hex')
const PUBK_BUFFER = Buffer.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
const SIGNATURE_BUFFER = Buffer.from('3046022100ceadf41cc9f116107c38f56b4a77b86632b521cd03621ca962fc6e0c8dec3966022100aca63c2a4435f71e4510ff3ba62e285acf1a9c9f49d826ce5c6c9346e08cba77', 'hex')


/* --- SCRIPTS --- */

//REGULAR
const LOCK_SCRIPT: Buffer[] = [Buffer.from([OP_DUP]), Buffer.from([OP_HASH160]), PUBKH_BUFFER, Buffer.from([OP_EQUALVERIFY]), Buffer.from([OP_CHECKSIG])]
const UNLOCK_SCRIPT: Buffer[] = [SIGNATURE_BUFFER, PUBK_BUFFER]

//CONTENT
//proposal
const APPLICATION_PROPOSAL_SCRIPT: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, Buffer.from([PROPOSAL_APPLICATION__CAT_DEPTH_2]), Buffer.from([PROPOSAL__CAT_DEPTH_1]), Buffer.from(Buffer.from([OP_CONTENT]))]
const COST_PROPOSAL_SCRIPT_PCHANGE: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, EncodeInt64(BigInt(PROPOSAL_PRICE)), Buffer.from([PROPOSAL_COST_PROPOSAL__CAT_DEPTH_3]), Buffer.from([PROPOSAL_COST__CAT_DEPTH_2]), Buffer.from([PROPOSAL__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]
const COST_PROPOSAL_SCRIPT_TCHANGE: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, EncodeInt64(BigInt(THREAD_PRICE)), Buffer.from([PROPOSAL_COST_THREAD__CAT_DEPTH_3]), Buffer.from([PROPOSAL_COST__CAT_DEPTH_2]), Buffer.from([PROPOSAL__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]
const COST_PROPOSAL_SCRIPT_BOTHCHANGE: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, EncodeInt64(BigInt(THREAD_PRICE)), Buffer.from([PROPOSAL_COST_THREAD__CAT_DEPTH_3]), EncodeInt64(BigInt(PROPOSAL_PRICE)), Buffer.from([PROPOSAL_COST_PROPOSAL__CAT_DEPTH_3]), Buffer.from([PROPOSAL_COST__CAT_DEPTH_2]), Buffer.from([PROPOSAL__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]

const CONSTITUTION_PROPOSAL_SCRIPT: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, SerialConstitution(NewConstitution()), Buffer.from([PROPOSAL_CONSTITUTION__CAT_DEPTH_2]), Buffer.from([PROPOSAL__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]

//thread
const THREAD_SCRIPT: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, Buffer.from([THREAD_THREAD__CAT_DEPTH_2]), Buffer.from([THREAD__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]
const RETHREAD_SCRIPT: Buffer[] = [NONCE_BYTES, PUBKH_BUFFER, PUBKH_BUFFER, Buffer.from([THREAD_RETHREAD__CAT_DEPTH_2]), Buffer.from([THREAD__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]

//reward
const REWARD_SCRIPT: Buffer[] = [PUBKH_BUFFER, VOUT_BYTES, Buffer.from([REWARD__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]

//vote
const ACCEPTED_VOTE_SCRIPT: Buffer[] = [PUBKH_BUFFER, Buffer.from([VOTE_ACCEPTED__CAT_DEPTH_2]), Buffer.from([VOTE__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]
const DECLINED_VOTE_SCRIPT: Buffer[] = [PUBKH_BUFFER, Buffer.from([VOTE_DECLINED__CAT_DEPTH_2]), Buffer.from([VOTE__CAT_DEPTH_1]), Buffer.from([OP_CONTENT])]

//Scripts
describe('Testing script-engine', () => {

    it('Lock', () => {
        const s = new ScriptEngine([]).append().lockScript(PUBKH_BUFFER)
        expect(s.bytes().toString()).to.eq(LOCK_SCRIPT.toString())
        expect(s.scriptType()).to.eq(EMPTY_CODE)
        expect(s.scriptTypeString()).to.eq('REGULAR')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.PKHFromLockScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(true)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(false)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(false)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Unlocking', () => {
        const s = new ScriptEngine([]).append().unlockScript(SIGNATURE_BUFFER, PUBK_BUFFER)
        expect(s.bytes().toString()).to.eq(UNLOCK_SCRIPT.toString())
        expect(s.scriptType()).to.eq(EMPTY_CODE)
        expect(s.scriptTypeString()).to.eq('REGULAR')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.PKHFromLockScript()).to.throw(WRONG_LOCK_SCRIPT.message)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(true)
        expect(is.contentScript()).to.eq(false)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(false)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Application Proposal', () => {
        const s = new ScriptEngine([]).append().applicationProposalScript(NONCE, PUBKH_BUFFER)
        expect(s.bytes().toString()).to.eq(APPLICATION_PROPOSAL_SCRIPT.toString())
        expect(s.scriptType()).to.eq(PROPOSAL_CODE)
        expect(s.scriptTypeString()).to.eq('PROPOSAL')
        expect(s.proposalContentTypeString()).to.eq('APPLICATION')
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(true)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Proposal Cost - Thread price update', () => {
        const s = new ScriptEngine([]).append().costProposalScript(NONCE, PUBKH_BUFFER, BigInt(THREAD_PRICE), BigInt(-1))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_TCHANGE.toString())
        expect(s.scriptType()).to.eq(PROPOSAL_CODE)
        expect(s.scriptTypeString()).to.eq('PROPOSAL')
        expect(s.proposalContentTypeString()).to.eq('COSTS')
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex')).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().proposal).to.eq(BigInt(-1))
        expect(parse.proposalCosts().thread).to.eq(BigInt(THREAD_PRICE))
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Proposal Cost - Proposal price update', () => {
        const s = new ScriptEngine([]).append().costProposalScript(NONCE, PUBKH_BUFFER, BigInt(-1), BigInt(PROPOSAL_PRICE))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_PCHANGE.toString())
        expect(s.scriptType()).to.eq(PROPOSAL_CODE)
        expect(s.scriptTypeString()).to.eq('PROPOSAL')
        expect(s.proposalContentTypeString()).to.eq('COSTS')
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex')).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().proposal).to.eq(BigInt(PROPOSAL_PRICE))
        expect(parse.proposalCosts().thread).to.eq(BigInt(-1))
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Proposal Cost - Proposal & Thread price update', () => {
        const s = new ScriptEngine([]).append().costProposalScript(NONCE, PUBKH_BUFFER, BigInt(THREAD_PRICE), BigInt(PROPOSAL_PRICE))
        expect(s.bytes().toString()).to.eq(COST_PROPOSAL_SCRIPT_BOTHCHANGE.toString())
        expect(s.scriptType()).to.eq(PROPOSAL_CODE)
        expect(s.scriptTypeString()).to.eq('PROPOSAL')
        expect(s.proposalContentTypeString()).to.eq('COSTS')
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex')).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(parse.proposalCosts().proposal).to.eq(BigInt(PROPOSAL_PRICE))
        expect(parse.proposalCosts().thread).to.eq(BigInt(THREAD_PRICE))
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(true)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Proposal Constitution', () => {
        const s = new ScriptEngine([]).append().constitutionProposalScript(NONCE, PUBKH_BUFFER, NewConstitution())
        expect(s.bytes().toString()).to.eq(CONSTITUTION_PROPOSAL_SCRIPT.toString())
        expect(s.scriptType()).to.eq(PROPOSAL_CODE)
        expect(s.scriptTypeString()).to.eq('PROPOSAL')
        expect(s.proposalContentTypeString()).to.eq('CONSTITUTION')
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex')).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(parse.constitution().toString()).to.eq(NewConstitution().toString())
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)


        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(true)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(true)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Thread', () => {
        const s = new ScriptEngine([]).append().threadScript(NONCE, PUBKH_BUFFER)
        expect(s.bytes().toString()).to.eq(THREAD_SCRIPT.toString())
        expect(s.scriptType()).to.eq(THREAD_CODE)
        expect(s.scriptTypeString()).to.eq('THREAD')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(true)
        expect(is.threadDepth2Script()).to.eq(true)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(false)
    });

    it('Re-Thread', () => {
        const s = new ScriptEngine([]).append().rethreadScript(NONCE, PUBKH_BUFFER, PUBKH_BUFFER)
        expect(s.bytes().toString()).to.eq(RETHREAD_SCRIPT.toString())
        expect(s.scriptType()).to.eq(THREAD_CODE)
        expect(s.scriptTypeString()).to.eq('THREAD')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(parse.contentNonce()).to.eq(NONCE)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(parse.PKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(parse.targetPKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(true)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(true)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(true)
        expect(is.targetedContent()).to.eq(true)
    });

    it('Reward', () => {
        const s = new ScriptEngine([]).append().rewardScript(PUBKH_BUFFER, VOUT)
        expect(s.bytes().toString()).to.eq(REWARD_SCRIPT.toString())
        expect(s.scriptType()).to.eq(REWARD_CODE)
        expect(s.scriptTypeString()).to.eq('REWARD')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(parse.distributionVout()).to.eq(VOUT)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(true)
        expect(is.voteScript()).to.eq(false)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(false)
        expect(is.targetedContent()).to.eq(true)
    });

    it('Accepted Vote', () => {
        const s = new ScriptEngine([]).append().voteScript(PUBKH_BUFFER, true)
        expect(s.bytes().toString()).to.eq(ACCEPTED_VOTE_SCRIPT.toString())
        expect(s.scriptType()).to.eq(VOTE_CODE)
        expect(s.scriptTypeString()).to.eq('VOTE')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(true)
        expect(is.acceptedVoteScript()).to.eq(true)
        expect(is.declinedVoteScript()).to.eq(false)
        expect(is.targetableContent()).to.eq(false)
        expect(is.targetedContent()).to.eq(true)
    });

    it('Declined Vote', () => {
        const s = new ScriptEngine([]).append().voteScript(PUBKH_BUFFER, false)
        expect(s.bytes().toString()).to.eq(DECLINED_VOTE_SCRIPT.toString())
        expect(s.scriptType()).to.eq(VOTE_CODE)
        expect(s.scriptTypeString()).to.eq('VOTE')
        expect(s.proposalContentTypeString()).to.eq(null)
    
        const parse = s.parse()
        expect(() => parse.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT)
        expect(parse.PKHFromLockScript().toString('hex') ).to.eq(PUBKEY_H_BURNER)
        expect(() => parse.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)
        expect(parse.targetPKHFromContentScript()).to.eq(PUBKH_BUFFER)
        expect(() => parse.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        expect(() => parse.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)
        expect(() => parse.distributionVout()).to.throw(NOT_A_REWARD_SCRIPT.message)

        const is = s.is()
        expect(is.lockScript()).to.eq(false)
        expect(is.unlockingScript()).to.eq(false)
        expect(is.contentScript()).to.eq(true)
        expect(is.proposalScript()).to.eq(false)
        expect(is.costProposalScript()).to.eq(false)
        expect(is.applicationProposalScript()).to.eq(false)
        expect(is.constitutionProposalScript()).to.eq(false)
        expect(is.threadDepth1Script()).to.eq(false)
        expect(is.threadDepth2Script()).to.eq(false)
        expect(is.rethreadScript()).to.eq(false)
        expect(is.rewardScript()).to.eq(false)
        expect(is.voteScript()).to.eq(true)
        expect(is.acceptedVoteScript()).to.eq(false)
        expect(is.declinedVoteScript()).to.eq(true)
        expect(is.targetableContent()).to.eq(false)
        expect(is.targetedContent()).to.eq(true)
    });



})