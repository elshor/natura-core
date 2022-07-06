/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import SuperType from './super-type.js'
import Type from './type.js'

export default class BaseType extends SuperType{
	constructor(type,dictionary){
		super('base type',dictionary)
		this.type = type || 'any';
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
			return Type(this.typeString.substr(0,this.typeString.length-1),null,this.dictionary);
		}else{
			return this;
		}
	}

}
