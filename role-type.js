/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import Type from './type.js'
import SuperType from './super-type.js'

export default class RoleType extends SuperType{
	constructor(type,role,dictionary){
		super('role type',dictionary);
		this.type = Type(type,null,dictionary);
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
		return new RoleType(this.type.singular,this.role,this.dictionary);
	}

	get isCollection(){
		return this.type.isCollection;
	}

	isa(dictionary,type){
		return dictionary.isa(type,this.type)
	}

	getClassMembers(dictionary){
		return dictionary.getClassMembers(this.type);
	}

	get isArray(){
		return this.type.isArray;
	}
}
