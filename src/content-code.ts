import _ from 'lodash'
import { TByte } from "./constant"

export type TContentType = 'PROPOSAL' | 'THREAD' | 'VOTE' | 'REWARD'
export type TPubKHContent = 'PROPOSAL' | 'THREAD'
export type TProposalType = 'COSTS' | 'APPLICATION' | 'CONSTITUTION' 
export type TThreadType = 'THREAD' | 'RETHREAD'
export type TVoteType = 'ACCEPTED' | 'DECLINED'
export type TCostProposalType = 'THREAD_PRICE' | 'PROPOSAL_PRICE'

export type T_CODE_NAME = TContentType | TPubKHContent | TProposalType | TThreadType | TVoteType | TCostProposalType

interface TCode {
    name: T_CODE_NAME
    value: TByte
    depth?: TCode[]
}

const CONTENT_CODES: TCode[] = [
    {
        name: 'PROPOSAL',
        value: 1,
        depth: [
            {
                name: 'APPLICATION',
                value: 1
            },
            {
                name: 'COSTS',
                value: 2,
                depth: [
                    {
                        name: 'THREAD_PRICE',
                        value: 1
                    },
                    {
                        name: 'PROPOSAL_PRICE',
                        value: 2
                    }
                ]
            },
            {
                name: 'CONSTITUTION',
                value: 3
            },
        ]
    },
    
    {
        name: 'THREAD',
        value: 2,
        depth: [
            {
                name: 'THREAD',
                value: 1,
            },
            {
                name: 'RETHREAD',
                value: 2,
            },
        ]
    },

    {
        name: 'REWARD',
        value: 3
    },

    {
        name: 'VOTE',
        value: 4,
        depth: [
            {
                name: 'ACCEPTED',
                value: 1,
            },
            {
                name: 'DECLINED',
                value: 2,
            },
        ]
    }
]

export default class ContentCode {

    static CONTENT_CODES = CONTENT_CODES

    static newWithValues = (...path: number[]) => {
        const ret = ContentCode.fromPath(...path)
        return new ContentCode(...ret.map((v: TCode) => v.name))

    }

    static fromPath = (...path: number[] | string[] ) => {
        let book: TCode[] | undefined = ContentCode.CONTENT_CODES
        const ret: TCode[] = []
        for (let i = 0; i < path.length; i++){
            if (!book || book.length === 0)
                break
            const predicate = typeof path[i] === 'string' ? {name: path[i]} : {value: path[i]}
            const e = _.find(book, predicate) as TCode | undefined
            if (!e)
                throw new Error(`predicate ${predicate} (depth: ${i}) doesn't match with any content code`)
            book = _.cloneDeep(e.depth)
            ret.push(e)
        }
        return ret
    }

    static MaxValue = ContentCode.CONTENT_CODES.length

    private _codes: TCode[] = []

    constructor(...path: T_CODE_NAME[]){
        this._codes = ContentCode.fromPath(...path)
    }

    toArrayContentOpcode = () => {
        const ret: ContentCode[] = []
        let current: T_CODE_NAME[] = []
        for (let p of this._codes){
            current.push(p.name)
            ret.push(new ContentCode(...current))
        }
        return ret
    }

    is = () => {
        const inMotherCategory = (...motherCategoryPath: T_CODE_NAME[]) => {
            const children = new ContentCode(...motherCategoryPath).depth()
            if (children){
                const elem = this.getLastElement()
                for (const child of children){
                    if (child.name === elem.name && child.value === elem.value)
                        return true
                }
            }

            return false

        }
        return {
            inMotherCategory
        }
    }

    eq = (...path: T_CODE_NAME[]) => _.isEqual(this.getLastElement(), new ContentCode(...path).getLastElement())

    name = () => this.getLastElement().name
    code = () => this.getLastElement().value
    depth = () => this.getLastElement().depth
    bytes = () => new Uint8Array([this.code()])

    getLastElement = (): TCode => this._codes[this._codes.length-1]
}

