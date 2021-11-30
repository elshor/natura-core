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
	switch(type.searchString || type){
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
			$type:type.searchString || type,
			$id: uid()
		};

		//if type is registered, look for init values in properties
		const spec = dictionary.getTypeSpec(type);

		if(spec.properties){
			Object.keys(spec.properties).forEach(prop=>{
				if(spec.properties[prop].init !== undefined){
					ret[prop] = cloneEntity(spec.properties[prop].init);
				}
			});
		}
		if(spec.$specialized){
			//if this type is specialized then we need to copy $specialized into the generated object
			Object.assign(ret,spec.$specialized);
		}

		//if a generic type is specified then copy it to the generated object. This will be used to associate a funtion with this object
		if(spec.$generic){
			ret.$generic = spec.$generic;
		}

		return ret;
	}
}

function uid(){
	const ret = '$'+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	return ret;
}

/**
 * Deep clone an entity and generate new $id for each object
 * @param {Object} entity the entity to clone
 */
export function cloneEntity(entity){
	const cloned = clone(entity);
	setID(cloned);
	return cloned;
}

function setID(entity){
	if(entity === null || typeof entity !== 'object'){
		return;
	}
	entity.$id = uid();
	Object.values(entity).forEach(value=>setID(value));
}
