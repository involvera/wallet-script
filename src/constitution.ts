import { Inv } from 'wallet-util'
import { MAX_CONSTITUTION_RULE, MAX_RULE_CONTENT_LENGTH, MAX_RULE_TITLE_LENGTH } from "./constant"
import { WRONG_CONSTITUTION_CONTENT_LENGTH, WRONG_CONSTITUTION_LENGTH, WRONG_CONSTITUTION_TITLE_LENGTH } from "./errors"

export interface IConstitutionRule {
    title: string
    content: string
}

export type TConstitution = IConstitutionRule[]

export const NewConstitution = (): TConstitution => {
    const consti: TConstitution = []
    for (let i = 0; i < MAX_CONSTITUTION_RULE; i++)
        consti.push({ title: "\r", content: "\r" })
	return consti
}

export const SerializeConstitution = (consti: TConstitution): Inv.InvBuffer => {
	let ret: string = ''

	const con = NewConstitution()
	consti = consti.filter((rule: IConstitutionRule) => rule.title.trim() != "")
	if (consti.length > MAX_CONSTITUTION_RULE)
		throw WRONG_CONSTITUTION_LENGTH
	for (let i = 0; i < consti.length; i++){
		if (consti[i].content.trim().length > MAX_RULE_CONTENT_LENGTH)
			throw WRONG_CONSTITUTION_CONTENT_LENGTH
		if (consti[i].title.trim().length > MAX_RULE_TITLE_LENGTH)
			throw WRONG_CONSTITUTION_TITLE_LENGTH
			
		con[i].content = consti[i].content.trim() || '\r'
		con[i].title = consti[i].title.trim() || '\r'
	}
	for (let i = 0; i < con.length; i++){
		ret += con[i].title + '\n'
		ret += con[i].content
		if (i < MAX_CONSTITUTION_RULE-1)
			ret += '\n\n'
	}
	return Inv.InvBuffer.fromRaw(ret)
}

export const DeserializeConstitution = (serialized: Inv.InvBuffer) => {
	const c = NewConstitution()
	const strSerial = serialized.to().string().raw()
	let list = strSerial.split('\n\n')
	if (list.length != MAX_CONSTITUTION_RULE)
		throw WRONG_CONSTITUTION_LENGTH

	let done = false
	for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
		const splited = list[i].split('\n')
		c[i].title = splited[0].trim() || '\r'
		c[i].content = splited[1].trim() || '\r'
		if (!c[i].title.trim() && !!c[i].content.trim())
			throw WRONG_CONSTITUTION_LENGTH
		if (!c[i].title.trim())
			done = true
		if (done && (!!c[i].title.trim() || !!c[i].content.trim()))
			throw WRONG_CONSTITUTION_LENGTH
		if (c[i].content.trim().length > MAX_RULE_CONTENT_LENGTH)
			throw WRONG_CONSTITUTION_CONTENT_LENGTH
		if (c[i].title.trim().length > MAX_RULE_TITLE_LENGTH)
			throw WRONG_CONSTITUTION_TITLE_LENGTH
	}
	return c		
}
