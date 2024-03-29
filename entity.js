/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {assume,MissingParam } from './error.js'
import clone from 'clone'
import locationQuery from './location-query.js';
import Dictionary from './dictionary.js';

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

export function generateNewEntity(location, type){
	const dictionary = (location instanceof Dictionary)
		? location : location.dictionary;
	location = (location instanceof Dictionary)? null : location;
	if(!location){
	}
	type = type || (location? location.expectedType : null)
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
		//if type is registered, look for init values in properties
		const spec = dictionary.getTypeSpec(type);

		const ret = spec.init? cloneEntity(spec.init) : {$id:uid()};
		ret.$type = type.searchString || type;


		if(spec.properties){
			Object.keys(spec.properties).forEach(prop=>{
				if(spec.properties[prop].initType !== undefined){
					ret[prop] = generateNewEntity(
						location? location.child(prop) : dictionary,
						spec.properties[prop].initType
					)
				}
				if(spec.properties[prop].init !== undefined){
					ret[prop] = cloneEntity(spec.properties[prop].init);
				}
				if(spec.properties[prop].unique !== undefined){
					//generate a unique name in the current context for entities of type `type`
					ret[prop] = generateUniqueValue(location,spec.properties[prop].unique);
				}
			});
		}
		if(spec.$specialized){
			//if this type is specialized then we need to copy $specialized into the generated object
			Object.assign(ret,asJSON(spec.$specialized));
		}

		//if a generic type is specified then copy it to the generated object. This will be used to associate a funtion with this object
		if(spec.$generic){
			ret.$generic = spec.$generic;
		}
		return ret;
	}
}

export function uid(){
	const ret = '$'+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	return ret;
}

function generateUniqueValue(location,{base,path,type,query}){
	const names = {}
	assume(location,'Missing location for generating unique values.',path,type);
	assume(query,'Missing query for generating unique values.',path,type);
	//using query to find existing values
	locationQuery(location,query).forEach(l=>{
		names[l.value]=true;
	});
	let newName = base || 'entity';
	if(names[newName]){
		//name already exists - add an integer from 1 to it until name doesn't exist
		for(let i=1;;++i){
			newName = base + ' ' + i;
			if(!names[newName]){
				return newName;
			}
		}
	}else{
		return newName;
	}
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

function asJSON(x){
	if(typeof x !== 'object'){
		return x;
	}
	if(Array.isArray(x)){
		return x.map(asJSON);
	}

	if(typeof x.toJSON === 'function'){
		return x.toJSON();
	}

	return Object.fromEntries(
		Object.entries(x).map(([key,value])=>{
			if(value.isTypeObject){
				//this is a type - return a string version
				return [key,value.toString()];
			}
			return [key,asJSON(value)]
		})
	)
}