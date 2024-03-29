/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
 * See explanation of the different roles in natura-pkg readme file
 */
export const Role = {
	artifact:'artifact',
	value:'value',
	calc:'calc',
	type:'type',
	instance:'instance',
	model:'model',
	group:'group',
	abstract:'abstract',
	entity:'entity'//a document entity
}

export function matchRole(present,required){
	if(!required || !present){
		return true;
	}else if(
		required=== Role.type && 
		[Role.model,Role.group,Role,Role.type].includes(present)
	){
		return true;
	}else if(
		required === Role.instance && 
		[Role.artifact,Role.calc].includes(present)
	){
		return true;
	}else{
		return present === required;
	}
}
