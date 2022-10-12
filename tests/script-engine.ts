import { expect } from 'chai';
import 'mocha';

import Opcode, {T_OPCODE} from '../src/opcode';
import ContentCode, { T_CODE_NAME } from '../src/content-code';
import Script from '../src/script'

import { NOT_A_CONSTITUTION_PROPOSAL, NOT_A_COST_PROPOSAL, NOT_A_LOCK_SCRIPT, NOT_A_REWARD_SCRIPT, NOT_A_TARGETABLE_CONTENT, NOT_A_TARGETING_CONTENT } from '../src/errors';
import { LAST_TX_VERSION, PUBKEY_H_BURNER, TByte } from '../src/constant';
import { DeserializeConstitution, NewConstitution, SerializeConstitution, TConstitution } from '../src/constitution';
import { Inv } from 'wallet-util'
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
const THREAD_PRICE = new Inv.InvBigInt(3_000_000)
const PROPOSAL_PRICE = new Inv.InvBigInt(5_000_000)
const VOUT = new Inv.InvBigInt(1)
const NONCE = new Inv.InvBigInt(5)
const PUBKH_BUFFER = InvBuffer.fromHex('93ce48570b55c42c2af816aeaba06cfee1224fae').bytes()
const PUBK_BUFFER = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
const SIGNATURE_BUFFER = InvBuffer.fromHex('3046022100ceadf41cc9f116107c38f56b4a77b86632b521cd03621ca962fc6e0c8dec3966022100aca63c2a4435f71e4510ff3ba62e285acf1a9c9f49d826ce5c6c9346e08cba77').bytes()

interface Is {
	applicationProposal?:         boolean
	constitutionProposal?:         boolean
	content?:                              boolean
	contentWithAddress    ?:                boolean
	contentWithAddressAndTarget? :         boolean
	contentWithoutAddress      ? :         boolean
	costsProposal               ?:         boolean
	lock                        ?:         boolean
	proposal                    ?:         boolean
	rethreadOnly                ?:         boolean
	reward                      ?:         boolean
	threadOnly                  ?:         boolean
	threadOrRethread            ?:         boolean
	unlock                      ?:         boolean
	vote                        ?:         boolean
	voteAccepted                ?:         boolean
	voteDeclined                ?:         boolean
}

interface Parse {
    contentNonce?: undefined | Inv.InvBigInt
    pubkh?: Inv.PubKH | undefined
    contentPKH?:  Inv.PubKH | undefined
    targetPKH?:  Inv.PubKH | undefined
    constitution?: TConstitution | undefined
    proposalCosts?: {thread: Inv.InvBigInt, proposal: Inv.InvBigInt} | undefined
    distributionVout?: Inv.InvBigInt | undefined
}

interface scriptTesting {
    shouldEq?: Script[]
    shouldNotEq?: Script[]
    type?: TByte
    typeString?: T_CODE_NAME | 'REGULAR'
    hasD3?: boolean
    typeD2?: T_CODE_NAME | null
    size?: number
    parse?: Parse
    is?: Is
    str?: string
}

const newEmptyScriptTesting = (settings: scriptTesting): scriptTesting => {
    const o: scriptTesting = {
        shouldEq: [],
        shouldNotEq: [],
        type: 0,
        typeString: 'REGULAR',
        hasD3: false,
        typeD2: null,
        size: 0,
        parse: {},
        is: {
            applicationProposal:         false,
            constitutionProposal:         false,
            content :                              false,
            contentWithAddress    :                false,
            contentWithAddressAndTarget :         false,
            contentWithoutAddress       :         false,
            costsProposal               :         false,
            lock                        :         false,
            proposal                    :         false,
            rethreadOnly                :         false,
            reward                      :         false,
            threadOnly                  :         false,
            threadOrRethread            :         false,
            unlock                      :         false,
            vote                        :         false,
            voteAccepted                :         false,
            voteDeclined                :         false,
        },
        str: ''
    } as scriptTesting

    const ret = Object.assign({}, o, settings)
    const is = Object.assign({}, o.is, settings.is)
    const parse = Object.assign({}, o.parse, settings.parse)

    ret.is = is
    ret.parse = parse
    return ret
}


const doTest = (s: Script, st: scriptTesting, version: TByte) => {
    if (st.shouldEq){
        for (const sd of st.shouldEq){
            expect(sd.eq(s)).to.eq(true)
        }
    }
    if (st.shouldNotEq){
        for (const sd of st.shouldNotEq){
            expect(sd.eq(s)).to.eq(false)
        }
    }    

    expect(s.copy().eq(s)).to.eq(true)
    expect(Script.fromBase64(s.base64()).eq(s)).to.eq(true)
    expect(Script.fromArrayBytes(s.bytes()).eq(s)).to.eq(true)
    expect(s.pretty(version)).to.eq(st.str)
    expect(s.type()).to.eq(st.type)
    expect(s.typeString()).to.eq(st.typeString)
    expect(s.has().d3()).to.eq(st.hasD3)
    expect(s.typeD2()).to.eq(st.typeD2)
    expect(s.has().d2()).to.eq(st.typeD2 != null)
    expect(s.fullSizeOctet()).to.eq(st.size)


    const p = s.parse()
    const { parse } = st
    if (parse){

        if (parse.pubkh) 
            expect(p.PKHFromLockScript().hex()).to.eq(parse.pubkh.hex())
        else 
            expect(() => p.PKHFromLockScript()).to.throw(NOT_A_LOCK_SCRIPT.message)
        
        if (parse.constitution)
            expect(p.constitution().toString()).to.eq(parse.constitution.toString())
        else 
            expect(() => p.constitution()).to.throw(NOT_A_CONSTITUTION_PROPOSAL.message)
        
        if (parse.contentNonce)
            expect(p.contentNonce().big()).to.eq(parse.contentNonce.big())
        else
            expect(() => p.contentNonce()).to.throw(NOT_A_TARGETABLE_CONTENT.message)

        if (parse.contentPKH)
            expect(p.PKHFromContentScript().hex()).to.eq(parse.contentPKH.hex())
        else
            expect(() => p.PKHFromContentScript()).to.throw(NOT_A_TARGETABLE_CONTENT.message)

        if (parse.distributionVout)
            expect(p.distributionVout(version).number()).to.eq(parse.distributionVout.number())
        else 
            expect(() => p.distributionVout(version)).to.throw(NOT_A_REWARD_SCRIPT.message)

        if (parse.proposalCosts){
            expect(p.proposalCosts().proposal.big()).to.eq(parse.proposalCosts.proposal.big())
            expect(p.proposalCosts().thread.big()).to.eq(parse.proposalCosts.thread.big())
        } else
            expect(() => p.proposalCosts()).to.throw(NOT_A_COST_PROPOSAL.message)

        if (parse.targetPKH)
            expect(p.targetPKHFromContentScript().hex()).to.eq(parse.targetPKH.hex())
        else
            expect(() => p.targetPKHFromContentScript()).to.throw(NOT_A_TARGETING_CONTENT.message)
    }

    const is = s.is()
    if (st.is){
        const { 
            lock, unlock, content, proposal, costsProposal, 
            applicationProposal, constitutionProposal, rethreadOnly, 
            threadOrRethread, threadOnly, reward, vote, voteAccepted, 
            voteDeclined, contentWithAddress, contentWithAddressAndTarget,
            contentWithoutAddress
        } = st.is    

        expect(is.lockingScript()).to.eq(lock)
        expect(is.unlockingScript()).to.eq(unlock)
        expect(is.contentScript()).to.eq(content)
        expect(is.proposalScript()).to.eq(proposal)
        expect(is.costProposalScript()).to.eq(costsProposal)
        expect(is.applicationProposalScript()).to.eq(applicationProposal)
        expect(is.constitutionProposalScript()).to.eq(constitutionProposal)
        expect(is.threadOrRethreadScript()).to.eq(threadOrRethread)
        expect(is.ThreadOnlyScript()).to.eq(threadOnly)
        expect(is.RethreadOnlyScript()).to.eq(rethreadOnly)
        expect(is.rewardScript(version)).to.eq(reward)
        expect(is.voteScript()).to.eq(vote)
        expect(is.voteAcceptedD2()).to.eq(voteAccepted)
        expect(is.voteDeclinedD2()).to.eq(voteDeclined)
        expect(is.contentWithAddress()).to.eq(contentWithAddress)
        expect(is.contentWithAddressAndTarget()).to.eq(contentWithAddressAndTarget)
        expect(is.contentWithoutAddress()).to.eq(contentWithoutAddress)
    }
} 

describe('Testing script-engine', () => {
    
    it('Lock', () => {
        const LOCK_SCRIPT = Script.new([op(OP_DUP), op(OP_HASH160), PUBKH_BUFFER, op(OP_EQUALVERIFY), op(OP_CHECKSIG)])
        const s = Script.build().lockScript(new Inv.PubKH(PUBKH_BUFFER))

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(s, newEmptyScriptTesting({
                shouldEq: [LOCK_SCRIPT],
                type: 0,
                size: 29,
                parse: {
                    pubkh: new Inv.PubKH(PUBKH_BUFFER),
                },
                is: {
                    lock: true,
                },
                str: 'OP_DUP OP_HASH160 93ce48570b55c42c2af816aeaba06cfee1224fae OP_EQUALVERIFY OP_CHECKSIG',            
            }), ver as TByte)
        }
    })

    it('Unlocking', () => {
        const UNLOCK_SCRIPT = Script.new([SIGNATURE_BUFFER, PUBK_BUFFER])
        const s = Script.build().unlockScript(new Inv.Signature(SIGNATURE_BUFFER), new Inv.PubKey(PUBK_BUFFER))
        
        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(s, newEmptyScriptTesting({
                shouldEq: [UNLOCK_SCRIPT],
                type: 0,
                size: 107,
                is: {
                    unlock: true,
                },
                str: 'SIGNATURE:3046022100ceadf41cc9f116107c38f56b4a77b86632b521cd03621ca962fc6e0c8dec3966022100aca63c2a4435f71e4510ff3ba62e285acf1a9c9f49d826ce5c6c9346e08cba77 PUBLIC_KEY:000000000000000000000000000000000000000000000000000000000000000000',            
            }), ver as TByte)
        }
    })

    it('Application Proposal', () => {
        const APPLICATION_PROPOSAL_SCRIPT = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])
        const s = Script.build().applicationProposal(NONCE, new Inv.PubKH(PUBKH_BUFFER))
        
        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(s, newEmptyScriptTesting({
                shouldEq: [APPLICATION_PROPOSAL_SCRIPT],
                type: 1,
                typeString: 'PROPOSAL',
                typeD2: 'APPLICATION',
                size: 32,
                is: {
                    proposal: true,
                    applicationProposal: true,
                    content: true,
                    contentWithAddress: true
                },
                parse: {
                    pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                    contentPKH: new Inv.PubKH(PUBKH_BUFFER),
                    contentNonce: NONCE,
                },
                str: 'NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae APPLICATION PROPOSAL OP_CONTENT',
            }), ver as TByte)
        }
    })

    it('Proposal Cost', () => {
        const COST_PROPOSAL_SCRIPT_PCHANGE = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
        const COST_PROPOSAL_SCRIPT_TCHANGE = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
        const COST_PROPOSAL_SCRIPT_BOTHCHANGE = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])

        let testing = newEmptyScriptTesting({
            type: 1,
            typeString: 'PROPOSAL',
            typeD2: 'COSTS',
            hasD3: true,
            is: {
                proposal: true,
                costsProposal: true,
                content: true,
                contentWithAddress: true
            },
            parse: {
                pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                contentPKH: new Inv.PubKH(PUBKH_BUFFER),
                contentNonce: NONCE,
            },
        })

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            testing = Object.assign(testing, {shouldEq: [COST_PROPOSAL_SCRIPT_TCHANGE], size: 43, str: "NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 3000000 THREAD_PRICE COSTS PROPOSAL OP_CONTENT"})
            testing.parse = Object.assign({}, testing.parse, {proposalCosts: { proposal: new Inv.InvBigInt(0), thread: THREAD_PRICE } } )
            doTest(
                Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), THREAD_PRICE, new Inv.InvBigInt(0)),
                testing,
                ver as TByte
            )
            testing = Object.assign(testing, {shouldEq: [COST_PROPOSAL_SCRIPT_PCHANGE], size: 43, str: "NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 5000000 PROPOSAL_PRICE COSTS PROPOSAL OP_CONTENT"})
            testing.parse = Object.assign({}, testing.parse, {proposalCosts: { proposal: PROPOSAL_PRICE, thread: new Inv.InvBigInt(0) } } )
            doTest(
                Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new Inv.InvBigInt(0), PROPOSAL_PRICE),
                testing,
                ver as TByte
            )
            testing = Object.assign(testing, {shouldEq: [COST_PROPOSAL_SCRIPT_BOTHCHANGE], size: 54, str: "NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae 3000000 THREAD_PRICE 5000000 PROPOSAL_PRICE COSTS PROPOSAL OP_CONTENT"})
            testing.parse = Object.assign({}, testing.parse, {proposalCosts: { proposal: PROPOSAL_PRICE, thread: THREAD_PRICE } } )
            doTest(
                Script.build().costProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), THREAD_PRICE, PROPOSAL_PRICE),
                testing,
                ver as TByte
            )
        }
    })

    it('Proposal Constitution', () => {
        const CONSTITUTION_PROPOSAL_SCRIPT = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])

        const s = Script.build().constitutionProposalScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), NewConstitution())

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(s, newEmptyScriptTesting({
                shouldEq: [CONSTITUTION_PROPOSAL_SCRIPT],
                type: 1,
                typeString: 'PROPOSAL',
                typeD2: 'CONSTITUTION',
                size: 81,
                is: {
                    proposal: true,
                    constitutionProposal: true,
                    content: true,
                    contentWithAddress: true
                },
                parse: {
                    pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                    contentPKH: new Inv.PubKH(PUBKH_BUFFER),
                    contentNonce: NONCE,
                    constitution: NewConstitution()
                },
                str: `NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae CONSTITUTION:${JSON.stringify(NewConstitution())} CONSTITUTION PROPOSAL OP_CONTENT`,
            }), ver as TByte)
        }
    })

    it('Thread', () => {
        const THREAD_SCRIPT = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])

        let testing = newEmptyScriptTesting({
            type: 2,
            size: 32,
            shouldEq: [THREAD_SCRIPT],
            typeString: 'THREAD',
            typeD2: 'THREAD',
            is: {
                threadOrRethread: true,
                threadOnly: true,
                content: true,
                contentWithAddress: true
            },
            parse: {
                pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                contentPKH: new Inv.PubKH(PUBKH_BUFFER),
                contentNonce: NONCE
            },
            str: "NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae THREAD THREAD OP_CONTENT",
        })
        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(
                Script.build().threadScript(NONCE, new Inv.PubKH(PUBKH_BUFFER)),
                testing,
                ver as TByte
            )
        }
    })

    it('Rethread', () => {
        const RETHREAD_SCRIPT = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])
        let testing = newEmptyScriptTesting({
            type: 2,
            size: 53,
            shouldEq: [RETHREAD_SCRIPT],
            typeString: 'THREAD',
            typeD2: 'RETHREAD',
            is: {
                threadOrRethread: true,
                rethreadOnly: true,
                content: true,
                contentWithAddress: true,
                contentWithAddressAndTarget: true
            },
            parse: {
                pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                contentPKH: new Inv.PubKH(PUBKH_BUFFER),
                contentNonce: NONCE,
                targetPKH: new Inv.PubKH(PUBKH_BUFFER),
            },
            str: "NONCE:5 PKH:93ce48570b55c42c2af816aeaba06cfee1224fae TARGET_CONTENT_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae RETHREAD THREAD OP_CONTENT",
        })

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            doTest(
                Script.build().rethreadScript(NONCE, new Inv.PubKH(PUBKH_BUFFER), new Inv.PubKH(PUBKH_BUFFER)),
                testing,
                ver as TByte
            )
        }
    })

    it('Reward', () => {
        let testing = newEmptyScriptTesting({
            shouldEq: [Script.new([PUBKH_BUFFER, VOUT.bytes('int16').bytes(), cc('REWARD'), op(OP_CONTENT)])],
            type: 3,
            size: 2,
            typeString: 'REWARD',
            typeD2: null,
            is: {
                content: true,
                reward: true,
                contentWithoutAddress: true
            },
            parse: {
                pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                targetPKH: new Inv.PubKH(PUBKH_BUFFER),
                distributionVout: VOUT
            },
            str: "THREAD_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae VOUT_REDIS:1 REWARD OP_CONTENT",
        })

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            const s = Script.build().rewardScript(new Inv.PubKH(PUBKH_BUFFER), VOUT, ver as TByte)
            doTest(s, Object.assign(testing, {size: s.fullSizeOctet()}), ver as TByte)
        }
    })

    it('Vote', () => {
        const ACCEPTED_VOTE_SCRIPT = Script.new([PUBKH_BUFFER, cc('VOTE', 'ACCEPTED'), cc('VOTE'), op(OP_CONTENT)])
        const DECLINED_VOTE_SCRIPT = Script.new([PUBKH_BUFFER, cc('VOTE', 'DECLINED'), cc('VOTE'), op(OP_CONTENT)])

        let testing = newEmptyScriptTesting({
            type: 4,
            size: 2,
            typeString: 'VOTE',
            is: {
                content: true,
                vote: true,
                contentWithoutAddress: true,
            },
            parse: {
                pubkh: Inv.PubKH.fromHex(PUBKEY_H_BURNER),
                targetPKH: new Inv.PubKH(PUBKH_BUFFER),
            },
        })

        for (let ver = 0; ver <= LAST_TX_VERSION; ver++){
            testing = Object.assign(testing, {typeD2: 'ACCEPTED', shouldEq: [ACCEPTED_VOTE_SCRIPT], size: 27, str: "PROPOSAL_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae ACCEPTED VOTE OP_CONTENT"})
            testing.is = Object.assign({}, testing.is, { voteAccepted: true, voteDeclined: false })
            doTest(Script.build().voteScript(new Inv.PubKH(PUBKH_BUFFER), true), testing, ver as TByte)
            testing = Object.assign(testing, {typeD2: 'DECLINED', shouldEq: [DECLINED_VOTE_SCRIPT], size: 27, str: "PROPOSAL_PKH:93ce48570b55c42c2af816aeaba06cfee1224fae DECLINED VOTE OP_CONTENT"})
            testing.is = Object.assign({}, testing.is, { voteAccepted: false, voteDeclined: true })
            doTest(Script.build().voteScript(new Inv.PubKH(PUBKH_BUFFER), false), testing, ver as TByte)
        }
    })

    describe('version 0 -- type testing', () => {
        it('Lock', () => {
            const LOCK_SCRIPT = Script.new([op(OP_DUP), op(OP_HASH160), new Inv.InvBuffer([0,1,2,3,4,5,6,7]).bytes(), op(OP_EQUALVERIFY), op(OP_CHECKSIG)])
            expect(LOCK_SCRIPT.is().lockingScript()).to.eq(false)
        })

        it('Unlock', () => {
            const UNLOCK_SCRIPT = Script.new([PUBK_BUFFER, SIGNATURE_BUFFER])
            expect(UNLOCK_SCRIPT.is().unlockingScript()).to.eq(false)
        })

        it('Application Proposal', () => {
            const APPLICATION_PROPOSAL_SCRIPT_1 = Script.new([NONCE.bytes('int8').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const APPLICATION_PROPOSAL_SCRIPT_2 = Script.new([NONCE.bytes('int16').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const APPLICATION_PROPOSAL_SCRIPT_3 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const APPLICATION_PROPOSAL_SCRIPT_4 = Script.new([NONCE.bytes('int64').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const APPLICATION_PROPOSAL_SCRIPT_5 = Script.new([NONCE.bytes('int32').bytes(), new Inv.InvBuffer([0,1,2,3,4,5,6,7]).bytes(), cc('PROPOSAL', 'APPLICATION'), cc('PROPOSAL'), op(OP_CONTENT)])

            expect(APPLICATION_PROPOSAL_SCRIPT_1.is().applicationProposalScript()).to.eq(false)
            expect(APPLICATION_PROPOSAL_SCRIPT_2.is().applicationProposalScript()).to.eq(false)
            expect(APPLICATION_PROPOSAL_SCRIPT_3.is().applicationProposalScript()).to.eq(true)
            expect(APPLICATION_PROPOSAL_SCRIPT_4.is().applicationProposalScript()).to.eq(true)
            expect(APPLICATION_PROPOSAL_SCRIPT_5.is().applicationProposalScript()).to.eq(false)
            expect(APPLICATION_PROPOSAL_SCRIPT_3.fullSizeOctet()).to.eq(32)
            expect(APPLICATION_PROPOSAL_SCRIPT_4.fullSizeOctet()).to.eq(36)
        })

        it('Costs Proposal', () => {
            const COST_PROPOSAL_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_2 = Script.new([NONCE.bytes('int64').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_3 = Script.new([NONCE.bytes('int16').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_4 = Script.new([NONCE.bytes('int8').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_5 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int32').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_6 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  PROPOSAL_PRICE.bytes('int32').bytes(), cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            const COST_PROPOSAL_SCRIPT_7 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, THREAD_PRICE.bytes('int64').bytes(), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'), op(0),  cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])

            expect(COST_PROPOSAL_SCRIPT_1.is().costProposalScript()).to.eq(true)
            expect(COST_PROPOSAL_SCRIPT_2.is().costProposalScript()).to.eq(true)
            expect(COST_PROPOSAL_SCRIPT_3.is().costProposalScript()).to.eq(false)
            expect(COST_PROPOSAL_SCRIPT_4.is().costProposalScript()).to.eq(false)
            expect(COST_PROPOSAL_SCRIPT_5.is().costProposalScript()).to.eq(false)
            expect(COST_PROPOSAL_SCRIPT_6.is().costProposalScript()).to.eq(false)
            expect(COST_PROPOSAL_SCRIPT_7.is().costProposalScript()).to.eq(false)

            const WRONG_COST_PROPOSAL_SCRIPT = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER,  cc('PROPOSAL', 'COSTS', 'PROPOSAL_PRICE'), cc('PROPOSAL', 'COSTS', 'THREAD_PRICE'),  cc('PROPOSAL', 'COSTS'), cc('PROPOSAL'), op(OP_CONTENT)])
            expect(WRONG_COST_PROPOSAL_SCRIPT.is().costProposalScript()).to.eq(false)
        })

        it('Constitution Proposal', () => {
            const CONSTITUTION_PROPOSAL_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const CONSTITUTION_PROPOSAL_SCRIPT_2 = Script.new([NONCE.bytes('int64').bytes(), PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const CONSTITUTION_PROPOSAL_SCRIPT_3 = Script.new([NONCE.bytes('int16').bytes(), PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
            const CONSTITUTION_PROPOSAL_SCRIPT_4 = Script.new([NONCE.bytes('int8').bytes(), PUBKH_BUFFER, SerializeConstitution(NewConstitution()).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
           
            expect(CONSTITUTION_PROPOSAL_SCRIPT_1.is().constitutionProposalScript()).to.eq(true)
            expect(CONSTITUTION_PROPOSAL_SCRIPT_2.is().constitutionProposalScript()).to.eq(true)
            expect(CONSTITUTION_PROPOSAL_SCRIPT_3.is().constitutionProposalScript()).to.eq(false)
            expect(CONSTITUTION_PROPOSAL_SCRIPT_4.is().constitutionProposalScript()).to.eq(false)
            
            let serial: string = ''
            let char = 'A'
            for (let i = 0; i < 9; i++){
                serial += char
                serial += char+1
                char += 2
            }
            const CONSTITUTION_PROPOSAL_SCRIPT_5 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, Inv.InvBuffer.fromRaw(serial).bytes(), cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
            expect(CONSTITUTION_PROPOSAL_SCRIPT_5.is().constitutionProposalScript()).to.eq(false)
        })

        it('Unregistered Proposal', () => {
            const FAKE_PROPOSAL_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, new Uint8Array([4]), cc('PROPOSAL'), op(OP_CONTENT)])
            const FAKE_PROPOSAL_SCRIPT_2 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, cc('PROPOSAL', 'CONSTITUTION'), cc('PROPOSAL'), op(OP_CONTENT)])
            expect(FAKE_PROPOSAL_SCRIPT_1.is().proposalScript()).to.eq(false)
            expect(FAKE_PROPOSAL_SCRIPT_2.is().proposalScript()).to.eq(true)
            expect(FAKE_PROPOSAL_SCRIPT_2.is().constitutionProposalScript()).to.eq(false)
        })

        it('(Re)Thread', () => { 
            const THREAD_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])
            const THREAD_SCRIPT_2 = Script.new([NONCE.bytes('int64').bytes(), PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])
            const THREAD_SCRIPT_3 = Script.new([NONCE.bytes('int16').bytes(), PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])
            const THREAD_SCRIPT_4 = Script.new([NONCE.bytes('int8').bytes(), PUBKH_BUFFER, cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])
            
            expect(THREAD_SCRIPT_1.is().ThreadOnlyScript()).to.eq(true)
            expect(THREAD_SCRIPT_2.is().ThreadOnlyScript()).to.eq(true)
            expect(THREAD_SCRIPT_3.is().ThreadOnlyScript()).to.eq(false)
            expect(THREAD_SCRIPT_4.is().ThreadOnlyScript()).to.eq(false)

            const RETHREAD_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])
            const RETHREAD_SCRIPT_2 = Script.new([NONCE.bytes('int64').bytes(), PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])
            const RETHREAD_SCRIPT_3 = Script.new([NONCE.bytes('int16').bytes(), PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])
            const RETHREAD_SCRIPT_4 = Script.new([NONCE.bytes('int8').bytes(), PUBKH_BUFFER, PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])

            expect(RETHREAD_SCRIPT_1.is().RethreadOnlyScript()).to.eq(true)
            expect(RETHREAD_SCRIPT_2.is().RethreadOnlyScript()).to.eq(true)
            expect(RETHREAD_SCRIPT_3.is().RethreadOnlyScript()).to.eq(false)
            expect(RETHREAD_SCRIPT_4.is().RethreadOnlyScript()).to.eq(false)

            const WRONG_THREAD_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), PUBKH_BUFFER, new Uint8Array([3]), cc('THREAD'), op(OP_CONTENT)])
            expect(WRONG_THREAD_SCRIPT_1.is().threadOrRethreadScript()).to.eq(false)
            const WRONG_THREAD_SCRIPT_2 = Script.new([NONCE.bytes('int32').bytes(), new Uint8Array([1,2,3,4,5,6,35,43,1,12]), cc('THREAD', 'THREAD'), cc('THREAD'), op(OP_CONTENT)])
            expect(WRONG_THREAD_SCRIPT_2.is().threadOrRethreadScript()).to.eq(false)
            const WRONG_RETHREAD_SCRIPT_1 = Script.new([NONCE.bytes('int32').bytes(), new Uint8Array([1,2,3,4,5,6,35,43,1,12]), PUBKH_BUFFER, cc('THREAD', 'RETHREAD'), cc('THREAD'), op(OP_CONTENT)])
            expect(WRONG_RETHREAD_SCRIPT_1.is().threadOrRethreadScript()).to.eq(false)
        })

        it('Reward', () => { 
            const REWARD_1 = Script.new([PUBKH_BUFFER, VOUT.bytes('int8').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_2 = Script.new([PUBKH_BUFFER, VOUT.bytes('int16').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_3 = Script.new([PUBKH_BUFFER, VOUT.bytes('int32').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_4 = Script.new([PUBKH_BUFFER, VOUT.bytes('int64').bytes(), cc('REWARD'), op(OP_CONTENT)])

            expect(REWARD_1.is().rewardScript(0)).to.eq(true)
            expect(REWARD_2.is().rewardScript(0)).to.eq(true)
            expect(REWARD_3.is().rewardScript(0)).to.eq(true)
            expect(REWARD_4.is().rewardScript(0)).to.eq(true)

            const WRONG_REWARD_1 = Script.new([PUBKH_BUFFER, new Uint8Array([1,2,3,4,5,6,7,8,9]), cc('REWARD'), op(OP_CONTENT)])
            expect(WRONG_REWARD_1.is().rewardScript(0)).to.eq(false)
            const WRONG_REWARD_2 = Script.new([new Uint8Array([1,2,3,4,5,6,7]), VOUT.bytes('int16').bytes(), cc('REWARD'), op(OP_CONTENT)])
            expect(WRONG_REWARD_2.is().rewardScript(0)).to.eq(false)
        })

        it('Vote', () => {
            const WRONG_VOTE_SCRIPT_1 = Script.new([PUBKH_BUFFER, new Uint8Array([3]), cc('VOTE'), op(OP_CONTENT)])
            expect(WRONG_VOTE_SCRIPT_1.is().voteScript()).to.eq(false)
            const WRONG_VOTE_SCRIPT_2 = Script.new([new Uint8Array([1,2,3,4,5,6,7]), new Uint8Array([2]), cc('VOTE'), op(OP_CONTENT)])
            expect(WRONG_VOTE_SCRIPT_2.is().voteDeclinedD2()).to.eq(false)
        })
    })

    describe('version 1 -- type testing', () => {

        it('Reward', () => { 
            const REWARD_1 = Script.new([PUBKH_BUFFER, VOUT.bytes('int8').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_2 = Script.new([PUBKH_BUFFER, VOUT.bytes('int16').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_3 = Script.new([PUBKH_BUFFER, VOUT.bytes('int32').bytes(), cc('REWARD'), op(OP_CONTENT)])
            const REWARD_4 = Script.new([PUBKH_BUFFER, VOUT.bytes('int64').bytes(), cc('REWARD'), op(OP_CONTENT)])

            expect(REWARD_1.is().rewardScript(1)).to.eq(false)
            expect(REWARD_2.is().rewardScript(1)).to.eq(true)
            expect(REWARD_3.is().rewardScript(1)).to.eq(true)
            expect(REWARD_4.is().rewardScript(1)).to.eq(true)

            const WRONG_REWARD_1 = Script.new([PUBKH_BUFFER, new Uint8Array([1,2,3,4,5,6,7,8,9]), cc('REWARD'), op(OP_CONTENT)])
            expect(WRONG_REWARD_1.is().rewardScript(1)).to.eq(false)
            const WRONG_REWARD_2 = Script.new([new Uint8Array([1,2,3,4,5,6,7]), VOUT.bytes('int16').bytes(), cc('REWARD'), op(OP_CONTENT)])
            expect(WRONG_REWARD_2.is().rewardScript(1)).to.eq(false)
        })
    })
})