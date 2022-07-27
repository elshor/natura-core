/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { JsonPointer } from 'json-ptr';
import {IllegalType} from './error.js'
import calc from "./calc.js";
import OneOfType from './one-of-type.js'
import BaseType from './base-type.js';
import RoleType from './role-type.js'
import TemplateType from './template-type.js';

export default function Type(type,location=null,dictionary=null){
	dictionary = dictionary || (location? location.dictionary : null);
	if(typeof type === 'string'){
		return new BaseType(type,dictionary);
	}
	if(typeof type === 'function'){
		return Type(calc(type,location.context),location,dictionary);
	}
	if(type === undefined || type === null){
		return new BaseType(undefined);
	}
	if(type.isTypeObject){
		return type;
	}else if(type !== null && typeof type === 'object'){
		switch(type.$type){
		case 'base type':
			return new BaseType(type.type,dictionary);
		//use a type specified in a path (like property) from this object
		case 'copy type':
			const pathText = '/' + (type.path||'').replace(/\./g,'/');
			const path = new JsonPointer(pathText);
			const result = path.get(location.contextNoSearch);
			const baseType = typeof result === 'string'? result : Type(result,location);
			return new BaseType(baseType,dictionary);
		case 'template type':
			return new TemplateType(type.template,location,dictionary);
		case 'role type':
			return new RoleType(Type(type.type,location,dictionary),type.role,dictionary);
		case 'specialized type':
			return new BaseType(
				`${
					Type(type.generic,location,dictionary).toString()
				}<${
					specializedValue(type.specialized,location)
				}>${type.collection?'*' : ''}`,
			dictionary);
		case 'one of':
			return new OneOfType(type.types.map(type=>Type(type,location,dictionary)),dictionary,type.collection);
		default:
			console.error('Using an unknown type',type.$type,type)
			throw new Error(IllegalType);
		}
	}
}



function specializedValue(val,location){
	//currently only type specialized values are supported (not values)
	return Type(val,location,dictionary).toString();
}