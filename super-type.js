/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
 * Used as base to extend other types
 */
import Type from "./type.js";
export default class SuperType{
	constructor(type,dictionary){
		this.dictionary = dictionary;
		this.$type = type;
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

	get isTypeObject(){
		return true;
	}
	get spec(){
		console.log('get spec',dictionary,type);
		return this.dictionary? this.dictionary.getTypeSpec(this) : {}
	}

	get properties(){
		return this.dictionary? this.dictionary.getTypeSpec(this).properties : {};
	}
}

