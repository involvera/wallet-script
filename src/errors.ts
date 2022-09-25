import { MAX_CONSTITUTION_RULE, MAX_RULE_CONTENT_LENGTH, MAX_RULE_TITLE_LENGTH } from './constant'

export const WRONG_TX_HASH_FORMAT = new Error("the transaction hash has not the right format")
export const WRONG_PUBKH_FORMAT = new Error("not a public key hashed")
export const WRONG_PUBK_FORMAT = new Error("not a public key")
export const WRONG_CONSTITUTION_LENGTH = new Error("the constitution must contains " + MAX_CONSTITUTION_RULE + " rules")
export const WRONG_CONSTITUTION_CONTENT_LENGTH = new Error("a constitution content content length must contains " + MAX_RULE_CONTENT_LENGTH + " characters maximum")
export const WRONG_CONSTITUTION_TITLE_LENGTH = new Error("a constitution title length must contains " + MAX_RULE_TITLE_LENGTH + " characters maximum")


export const NO_CONTENT_NONCE = new Error("no content nonce for this kind of content")
export const WRONG_LOCK_SCRIPT = new Error("wrong lock script")
export const NOT_A_TARGETABLE_CONTENT = new Error("not a targetable content")
export const NOT_A_TARGETING_CONTENT = new Error("not a targeting content")
export const NOT_A_CONSTITUTION_PROPOSAL = new Error("not a constitution proposal script content")
export const NOT_A_COST_PROPOSAL = new Error("not a cost proposal script")
export const NOT_A_LOCK_SCRIPT = new Error("not a lock script")
export const NOT_A_REWARD_SCRIPT = new Error("not a reward script")