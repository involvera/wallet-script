import _ from 'lodash'
import { TByte } from "../constant"

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

    private _path: T_CODE_NAME[]
    constructor(...path: T_CODE_NAME[]){
        this._path = path
        //asserting errors if there are
        this._getFullPath()

    }

    toArrayContentOpcode = () => {
        const ret: ContentCode[] = []
        let current: T_CODE_NAME[] = []
        for (let p of this._path){
            current.push(p)
            ret.push(new ContentCode(...current))
        }
        return ret
    }

    name = () => this.getLastElement().name
    code = () => this.getLastElement().value
    depth = () => this.getLastElement().depth
    bytes = () => new Uint8Array([this.code()])

    getLastElement = (): TCode => {
        const fullpath = this._getFullPath()
        return fullpath[fullpath.length-1]
    }

    private _getFullPath = (): TCode[] => {
        let book = CONTENT_CODES
        const ret: TCode[] = []

        for (let i = 0; i < this._path.length; i++){
            const name = this._path[i]
            if (!book)
                throw new Error(`name ${name} (depth: ${i}) doesn't match with any content code`)
            const e = _.find(book, {name}) as TCode | undefined
            if (!e)
                throw new Error(`name ${name} (depth: ${i}) doesn't match with any content code`)
            if (e.depth)
                book = _.cloneDeep(e.depth)
            delete e.depth
            ret.push(e)
        }
        return ret
    }
}

