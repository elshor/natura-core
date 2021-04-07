/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {IllegalType} from './error.js'
import calc from "./calc.js";

export default function Type(type,location){
	if(typeof type === 'string'){
		return new BaseType(type);
	}
	if(typeof type === 'function'){
		return new BaseType(calc(type,location.context));
	}
	if(type === undefined || type === null){
		return new BaseType(undefined);
	}
	if(type instanceof BaseType){
		return type;
	}else if(type !== null && typeof type === 'object'){
		switch(type.$type){
			case 'copy type':
				const val = location.parent.value;
				if(val && typeof val === 'object' && val[type.property]){
					return new BaseType(val[type.property]);
				}else{
					return new BaseType('any');
				}
			default:
				throw new Error(IllegalType);
		}
	}
}

class BaseType{
	constructor(type){
		this.type = type;
	}
	toString(){
		return this.type? this.type.toString() : 'any';
	}
	
	get isCollection(){
		const str = this.toString();
		return str? str.match(/\*$/) !== null : false;
	}

	get singular(){
		if(this.isCollection){
			return this.toString().substr(0,this.toString().length-1);
		}else{
			return this.toString();
		}
	}

}

