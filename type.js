/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { JsonPointer } from 'json-ptr';
import {IllegalType} from './error.js'
import calc from "./calc.js";

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
			//HACK not sure why json pointer not working here
			const result = follow(location.contextNoSearch,path.path);
			const baseType = typeof result === 'string'? result : Type(result,location);
			return new BaseType(baseType);
		case 'role type':
			return new RoleType(Type(type.type,location),type.role);
		case 'template type':
			return new BaseType(
				`${
					Type(type.generic,location).toString()
				}<${
					specializedValue(type.specialized,location)
				}>${type.collection?'*' : ''}`
			);
		default:
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

class RoleType{
	constructor(type,role){
		this.$type="role type",
		this.type = Type(type);
		this.role = role;
	}
	
	toString(){
		return this.role + '.' + this.type.toString();
	}
	get isTypeObject(){
		return true;
	}
	get typeString(){
		return this.type.typeString;
	}

	get searchString(){
		return this.type.searchString;
	}
	
	get singular(){
		return new RoleType(this.type.singular.typeString,this.role);
	}

	get isCollection(){
		return this.type.isCollection;
	}

	get isArray(){
		return this.type.isArray;
	}
}

function follow(source,path){
	let current = source;
	for(let i=0;i<path.length;++i){
		if(current === null || current === undefined){
			return undefined;
		}
		current = current[path[i]];
	}
	return current;
}
function specializedValue(val,location){
	//currently only type specialized values are supported (not values)
	return Type(val,location).toString();
}