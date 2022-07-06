/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
 * Used as base to extend other types
 */
export default class SuperType{
	constructor(type,dictionary){
		this.dictionary = dictionary;
		this.$type = type;
	}
	get isTypeObject(){
		return true;
	}
	get spec(){
		return this.dictionary? this.dictionary.getTypeSpec(this) : {}
	}

	get properties(){
		return this.dictionary? this.dictionary.getTypeSpec(this).properties : {};
	}
}

