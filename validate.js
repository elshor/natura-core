/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import calc from './calc.js'
import {locationContext} from './context.js'
import { Role } from './role.js';
import Type from './type.js';
import getType from './type.js'
/**
 * Check if a value is valid at a certain location
 * @param {Location} location 
 * @param {Any} value 
 */
export function isValid(location,value){
	const validators = location.spec.validators;
	if(typeof value === 'object' && !isValidType(location,value)){
		//only validate objects for performance reasons
		return `type mismatch. Expected ${location.expectedType} but got ${valueType(value,location.dictionary)}`;
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
	//disabling type validation because we fail many types and this is too expensive. Should only be applied when copying or pasting etc.
	//TODO work out when to validate type
	return true;
	if(value===undefined){
		//undefined is always ok
		return true;
	}
	expectedType = expectedType || location.expectedType;
	if(value && value.$type){
		const actualType = (expectedType.role === Role.type)?
			value.$type : 
			valueType(value,location.dictionary);
		
		//check if type isa expected type
		return location.dictionary.isa(actualType,expectedType);
	}
	if(Array.isArray(value) && expectedType.isCollection){
		//check if all array children match the expected type
		for(let i=0;i<value.length;++i){
			if(!isValidType(location.child(i),location.value[i],expectedType.singular)){
				return false;
			}
		};
		return true;
	}

	//working with primitive values - always allow
	return true;
}

function valueType(value,dictionary){
	if(value && value.$type === 'reference' ){
		return getType(value.valueType);
	}
	if(value && value.$type){
		const spec = dictionary.getTypeSpec(value.$type);
		return getType(spec.valueType || value.$type);
	}
	if(value && value.$type){
		//get valueType of spec
	}
	return Type(typeof value);
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

export function isValidBasicType(location,type){
	const expectedType = location.expectedType;
	if(expectedType.typeString === type.toString()){
		return true;
	}
	const dictionary = location.dictionary;
	const spec = dictionary.getTypeSpec(expectedType);
	if(spec && spec.basicType === type){
		return true;
	}
	const members = dictionary.getClassMembers(location.expectedType);
	const match = members.find(item=>dictionary.getTypeSpec(item).basicType === type);
	return match !== undefined;
}
