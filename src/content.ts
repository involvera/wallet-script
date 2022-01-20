export type TContentType = 'PROPOSAL' | 'THREAD' | 'VOTE' | 'REWARD'
export type TProposalType = 'COSTS' | 'APPLICATION' | 'CONSTITUTION' 
export type TThreadType = 'THREAD' | 'RETHREAD'
export type TVoteType = 'ACCEPTED' | 'DECLINED'
export type TCostProposalType = 'THREAD_PRICE' | 'PROPOSAL_PRICE'

//Kind
export const EMPTY_CODE = 0x00    //0
export const THREAD_CODE = 0x01   //1
export const PROPOSAL_CODE = 0x02 //2
export const VOTE_CODE = 0x03     //3
export const REWARD_CODE = 0x04   //upvote and reaction

//Length
export const CONTENT_DEPTH_1_LENGTH = 4
export const TOTAL_MAX_LENGTH = CONTENT_DEPTH_1_LENGTH
export const PROPOSAL_DEPTH_2_LENGTH = 3
export const COST_PROPOSAL_DEPTH_3_LENGTH = 2
export const THREAD_DEPTH_2_LENGTH = 2
export const VOTE_DEPTH_2_LENGTH = 2

// Proposal
////// depth 1
export const PROPOSAL__CAT_DEPTH_1 = 1

////// depth 2
export const PROPOSAL_APPLICATION__CAT_DEPTH_2 = 1
export const PROPOSAL_COST__CAT_DEPTH_2 = 2
export const PROPOSAL_CONSTITUTION__CAT_DEPTH_2 = PROPOSAL_DEPTH_2_LENGTH

export const N_COST_PROPOSAL_TYPE = 2


////// depth 3
export const PROPOSAL_COST_THREAD__CAT_DEPTH_3 = 1
export const PROPOSAL_COST_PROPOSAL__CAT_DEPTH_3 = COST_PROPOSAL_DEPTH_3_LENGTH

export const COST_PROPOSAL_CAT_LIST: number[] = [PROPOSAL_COST_PROPOSAL__CAT_DEPTH_3, PROPOSAL_COST_THREAD__CAT_DEPTH_3]

// Thread
export const THREAD__CAT_DEPTH_1 = 2
export const THREAD_THREAD__CAT_DEPTH_2 = 1
export const THREAD_RETHREAD__CAT_DEPTH_2 = THREAD_DEPTH_2_LENGTH

// Reward
export const REWARD__CAT_DEPTH_1 = 3

// Vote
export const VOTE__CAT_DEPTH_1 = CONTENT_DEPTH_1_LENGTH
export const VOTE_ACCEPTED__CAT_DEPTH_2 = 1
export const VOTE_DECLINED__CAT_DEPTH_2 = VOTE_DEPTH_2_LENGTH