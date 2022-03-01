/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import calc from './calc.js'
import {locationContext} from './context.js'
import {Type} from './type.js'
/**
 * Check if a value is valid at a certain location
 * @param {Location} location 
 * @param {Any} value 
 */
export function isValid(location,value){
	const validators = location.spec.validators;
	if(!isValidType(location,value)){
		return 'type mismatch';
	}

	if(!Array.isArray(validators)){
		//no validators are defined then return true
		return true;
	}
	for(let i=0;i<validators.length;++i){
		const valid = calc(validators[i],locationContext(location,{value}));
		if(valid !==true){
			return valid;
		}
	}
	return true;
}

function isValidType(location,value,expectedType){
	if(value===undefined){
		//undefined is always ok
		return true;
	}
	expectedType = expectedType || location.expectedType;
	if(value && value.$type){
		//check if type isa expected type
		return location.dictionary.isa(Type(value.$type),expectedType);
	}
	if(Array.isArray(value) && expectedType.isCollection){
		//check if all array children match the expected type
		for(let i=0;i<value.length;++i){
			if(!isValidType(location.value[i],expectedType.singular)){
				return false;
			}
		};
		return true;
	}

	//working with primitive values - check typeof
	return location.dictionary.isa(typeof value,expectedType)
}

/**
 * List of validators. This can be inserted into a package.
 */
export const validators = [
	{
		name:'range validator',
		isa:['validator'],
		pattern:'between <<min>> and <<max>>',
		properties:{
			min:{type:'number'},
			max:{type:'number'}
		},
		calc(context){
			const value = context.value;
			if(value===undefined){
				//if the value is undefined then it is ok
				return true;
			}
			if(typeof value !== 'number'){
				return 'should be a number';
			}
			if (value >= this.min && value <= this.max){
				return true;
			}else{
				return `should be between ${this.min} and ${this.max}`;
			};
		}
	},
	{
		name: 'regex validator',
		isa:['validator'],
		pattern:'matches regex <<pattern>>',
		properties:{
			pattern:{type:'string'}
		},
		calc(context){
			const value = context.value;
			const pattern = context.pattern;
			const message = context.message;

			if(typeof value !== 'string'){
				return 'Value should be a string'
			}
			const matched = value.match(new RegExp(pattern));
			if(!matched){
				return message || 'text does not match required pattern';
			}
			return true;
		}
	}
]
