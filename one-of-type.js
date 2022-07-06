/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import SuperType from './super-type.js'
export default class OneOf extends SuperType{
	constructor(types,dictionary,collection=false,){
		super('one of',dictionary)
		this.types = types;
		this.collection = collection;
	}
	
	get isCollection(){
		return this.collection;
	}

	get searchString(){
		return this.toString();
	}

	get singular(){
		if(this.collection){
			return new OneOf(this.types,false);
		}else{
			return this;
		}
	}

	toString(){
		return this.types.map(type=>type.toString()).join('|');
	}
	
	get isTypeObject(){
		return true;
	}
	
	getClassMembers(dictionary){
		const ret = this.types.map(type=>dictionary.getClassMembers(type))
		.flat(); 

		//add all types that have spec
		ret.push(...this.types.filter(type=>dictionary.typeHasSpec(type)).map(type=>type.toString()));
		return unique(ret);
	}

	isa(dictionary,type){
		for(let i=0;i<this.types.length;++i){
			if(dictionary.isa(type,this.types[i])){
				return true;
			}
		}
		return false;
	}

	getExpressionsByValueType(dictionary, allowCalc, expectedRole){
		const ret = this.types.map(type=>dictionary.getExpressionsByValueType(type,allowCalc,expectedRole))
		.flat();
		return unique(ret);
	}
}

function unique(arr){
	return arr.filter(function(value, index, self) {
		return self.indexOf(value) === index;
	})
}
