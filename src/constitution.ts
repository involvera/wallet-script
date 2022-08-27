import { Inv } from 'wallet-util'
import { MAX_CONSTITUTION_RULE } from "./constant"
import { WRONG_CONSTITUTION_LENGTH } from "./errors"

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
	for (let i = 0; i < consti.length; i++){
		ret += consti[i].title + '\n'
		ret += consti[i].content
		if (i < MAX_CONSTITUTION_RULE-1)
			ret += '\n\n'
	}
	return Inv.InvBuffer.fromRaw(ret)
}

export const DeserializeConstitution = (serialized: Inv.InvBuffer) => {
	const c = NewConstitution()
	const strSerial = serialized.to().string().raw()
	let list = strSerial.split('\n\n')

	if (list.length > MAX_CONSTITUTION_RULE)
		list = list.slice(0, MAX_CONSTITUTION_RULE)
	else if (list.length < MAX_CONSTITUTION_RULE)
		throw WRONG_CONSTITUTION_LENGTH
	
	for (let i = 0; i < MAX_CONSTITUTION_RULE; i++){
		const splited = list[i].split('\n')
		c[i].title = splited[0]
		c[i].content = splited[1]
	}
	return c		
}
