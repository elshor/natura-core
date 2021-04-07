/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {assume,MissingParam } from './error.js'
import clone from 'clone'
import calc from './calc.js'

export function entityType(data){
	if(typeof data === 'object' && data !== null && data.$isProxy===true){
		return typeof data.$value;
	}else{
		return typeof data;
	}
}

export function entityIsArray(data){
	if(Array.isArray(data)){
		return true;
	}
	if(typeof data === 'object' && data !== null && data.$isProxy===true){
		return Array.isArray(data.$value);
	}
	return false;
}

export function entityValue(entity){
	if(typeof entity === 'object' && entity !== null && entity.$isProxy===true){
		return entityValue(entity.$value);
	}else{
		return entity;
	}
}

export function generateNewEntity(type,context={},dictionary){
	assume(dictionary,MissingParam,'dictionary');
	switch(type){
	case 'string':
	case 'calc':
		return '';
	case 'boolean':
		return false;
	case 'any':
	case null:
	case undefined:
		return '';//default new entity is text
	default:
		const ret = {
			$type:type,
			$id: uid()
		};

		//if type is registered, look for init values in properties
		const spec = dictionary.getTypeSpec(type);
		if(spec.properties){
			Object.keys(spec.properties).forEach(prop=>{
				if(spec.properties[prop].init !== undefined){
					ret[prop] = clone(calc(spec.properties[prop].init,context));
				}
			});
		}
		return ret;
	}
}

function uid(){
	const ret = '$'+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	return ret;
}
