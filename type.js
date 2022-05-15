/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { JsonPointer } from 'json-ptr';
import {IllegalType} from './error.js'
import calc from "./calc.js";
import { calcTemplate } from './template.js';
import OneOfType from './one-of-type.js'
import RoleType from './role-type.js'

export default function Type(type,location){
	if(typeof type === 'string'){
		return new BaseType(type);
	}
	if(typeof type === 'function'){
		return Type(calc(type,location.context),location);
	}
	if(type === undefined || type === null){
		return new BaseType(undefined);
	}
	if(type.isTypeObject){
		return type;
	}else if(type !== null && typeof type === 'object'){
		switch(type.$type){
		case 'base type':
			return new BaseType(type.type);
		//use a type specified in a path (like property) from this object
		case 'copy type':
			const pathText = '/' + (type.path||'').replace(/\./g,'/');
			const path = new JsonPointer(pathText);
			const result = path.get(location.contextNoSearch);
			const baseType = typeof result === 'string'? result : Type(result,location);
			return new BaseType(baseType);
		case 'template type':
			const calculatedType = calcTemplate(type.template,location.contextNoSearch);
			return new BaseType(calculatedType);
		case 'role type':
			return new RoleType(Type(type.type,location),type.role);
		case 'specialized type':
			return new BaseType(
				`${
					Type(type.generic,location).toString()
				}<${
					specializedValue(type.specialized,location)
				}>${type.collection?'*' : ''}`
			);
		case 'one of':
			return new OneOfType(type.types.map(type=>Type(type,location)),type.collection);
		default:
			console.error('Using an unknown type',type.$type,type)
			throw new Error(IllegalType);
		}
	}
}

class BaseType{
	constructor(type){
		this.$type='base type',
		this.type = type || 'any';
	}
	get isTypeObject(){
		return true;
	}
	toString(){
		return this.typeString;
	}

	get typeString(){
		return this.type.typeString || this.type.toString();
	}
	/** A search string is always the singular of a type */
	get searchString(){
		return this.isCollection? this.singular.typeString : this.typeString;
	}

	get isCollection(){
		const str = this.typeString;
		return str? str.match(/\*$/) !== null : false;
	}

	get isArray(){
		return this.isCollection;
	}

	get singular(){
		if(this.isCollection){
			return Type(this.typeString.substr(0,this.typeString.length-1));
		}else{
			return this;
		}
	}

}


function specializedValue(val,location){
	//currently only type specialized values are supported (not values)
	return Type(val,location).toString();
}