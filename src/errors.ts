import { MAX_CONSTITUTION_RULE } from './constant'

export const WRONG_TX_HASH_FORMAT = new Error("The transaction hash has not the right format")
export const WRONG_PUBKH_FORMAT = new Error("Not a public key hashed")
export const WRONG_PUBK_FORMAT = new Error("Not a public key")
export const WRONG_CONSTITUTION_LENGTH = new Error("The constitution must contains " + MAX_CONSTITUTION_RULE + " rules.")
export const NO_CONTENT_NONCE = new Error("No content nonce for this kind of content")
export const WRONG_LOCK_SCRIPT = new Error("Wrong lock script")
export const NOT_A_TARGETABLE_CONTENT = new Error("Not a targetable content")
export const NOT_A_TARGETING_CONTENT = new Error("Not a targeting content")
export const NOT_A_CONSTITUTION_PROPOSAL = new Error("Not a constitution proposal script content")
export const NOT_A_COST_PROPOSAL = new Error("Not a cost proposal script")
export const NOT_A_LOCK_SCRIPT = new Error("Not a lock script")
export const NOT_A_REWARD_SCRIPT = new Error("Not a reward script")