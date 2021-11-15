/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { specComputedPattern, specIsGeneric} from "./spec.js";
import { assume } from "./error.js";
import { generateNewElement } from "src/components/utils.js";
import {calcTemplate} from './template.js'
import { calcValue } from "./calc.js";
import {contextEntries} from './context.js'
import { cloneEntity } from "./entity.js";
import {Role,matchRole} from './role.js'
export function getSuggestions(location,filter='',allowExpressions,externalContext){
	if(filter.startsWith('=')){
		filter = filter.substr(1);
		allowExpressions=true;
	}
	const ret = getUnfilteredSuggestions(location,allowExpressions,externalContext);
	filterAndSortSuggestions(ret,filter);
	return ret;
}

export function getUnfilteredSuggestions(location,allowExpressions,externalContext){
	const dictionary = location.dictionary;
	const ret = {
		state: 'loaded',
		list:[]
	};
	//generate suggestions
	assume(location);
	const itsExpectedSpec = location.expectedSpec;
	if(!itsExpectedSpec){
		//apparently there is no expected spec. This can be because we are in an editor of property name. just return an empty list
		return ret;
	}

	//extract the expected type and role if defined. When role is defined then we want the suggestions to match in role as well as expected type
	const [expectedType,role] = function(location){
		const expectedType = location.expectedType;
		if(typeof expectedType === 'string'){
			const type = calcValue(expectedType,location.context);
			let parsed = type.match(/^(artifact|type|instance)\.(.*)$/);
			return parsed? [parsed[2],parsed[1]] : [type];
		}else{
			//if type is an object with role specified, then use it. Otherwise ignore role (it will be undefined)
			return [expectedType.typeString,expectedType.role];
		}
	}(location);
	
	/////////////////////
	//options suggestions
	/////////////////////
	let options=[];
	if(itsExpectedSpec.options){
		//options are explicitly set - just use it
		options = itsExpectedSpec.options;
	}else{
		const optionsType = expectedType;
		options = dictionary.getTypeSpec(optionsType).options;
	}
	const calculatedOptions = calcValue(options,location.context);
	if(hasFunction(calculatedOptions,'forEach')){
		//the spec has an array options property (or other object that supports forEach function)
		calculatedOptions.forEach(option=>
			ret.list.push({
				value:cloneEntity(option),
				text: suggestionText(option,itsExpectedSpec,dictionary),
				source:'option'
			})
		);
	}
	if(itsExpectedSpec.options){
		//if options are specified then ignore any other suggestion types
		return ret;	
	}

	////////////////////////////
	//category types suggestions
	////////////////////////////
	if(dictionary.isClass(expectedType) && role === Role.type){
		dictionary.getClassMembers(expectedType).forEach(type=>{
			const spec = dictionary.getTypeSpec(type);
			if(matchRole(spec.role,Role.type) && !matchRole(role,Role.type)){
				//ignore types unless specifically requested
				return;
			}
			if(specIsGeneric(spec)){
				//ignore generic types
				return;
			}
			const value = generateNewElement(type,null,dictionary);
			ret.list.push({
				value: value,
				description: dictionary.getTypeSpec(type).description,
				source:'class',
				text: suggestionText(value,itsExpectedSpec,dictionary,true)
			});
		});
	}

	//////////////////////
	//dictionary instances
	//////////////////////
	const entries = dictionary.getInstancesByType(expectedType,role);
	//TODO check scope
	//TODO should only work for instance types
	entries.forEach(entry=>{
		ret.list.push({
			value: cloneEntity(entry),
			text:entry.label,
			source:'instance',
			description:entry.description
		})
	})

	//////////////////
	//external context
	//////////////////
	if(expectedType && externalContext){
		externalContext.forEach(entry=>{
			if(dictionary.isa(entry.valueType,expectedType)){
				ret.list.push({
					value: cloneEntity(entry.value),
					source:'context',
					text:entry.label,
					path:entry.path,
					description:entry.description
				})
			}
		})
	}

	///////////////////
	//context instances
	///////////////////
	if(expectedType){
		contextEntries(location,expectedType).forEach(entry=>{
			//prevent self referencing context entity
			if(entry.path && entry.path === location.path){
				return;
			}
			
			//if expressions are not allowed, expect role of value to be artifact
			if(!allowExpressions && roleIsNotArtifact(entry.value)){
				return;
			}

			//make sure we are not looking for a type
			if(role && matchRole(role,Role.type)){
				return;
			}
			
			ret.list.push({
				value: cloneEntity(entry.value||entry.name),//if value not specified then treat the name as value
				source:'context',
				text:entry.name,
				path:entry.path,
				description:entry.description
			})
		});
	}

	////////////////////////
	//dictionary expressions
	////////////////////////
	if(expectedType && !(role && matchRole(role,Role.type))){
		getExpressionSuggestions(ret,expectedType,dictionary,itsExpectedSpec,allowExpressions,role);
	}

	return ret;
}

export function filterAndSortSuggestions(suggestions,filter){
	const ret = {
		list:suggestions.list.filter(item=>
			typeof item.text === 'string' && item.text.toLowerCase().includes(filter.toLowerCase())
		)
	}
	ret.list.forEach(item=>scoreSuggestion(item,filter));
	ret.list.sort(comp);
	return ret;
}

function getExpressionSuggestions(suggestions,expectedType,dictionary,itsExpectedSpec,allowExpressions,role){
const types = dictionary.getExpressionsByValueType(expectedType,allowExpressions);
types.forEach(type=>{
	const value = generateNewElement(type,null,dictionary);
	suggestions.list.push({
		value: value,
		description: dictionary.getTypeSpec(type).description,
		source:'expression',
		text:suggestionText(value,itsExpectedSpec,dictionary,true)
	});
});
}

export function hasExpressionSuggestions(location){
	const expectedType = calcValue(location.expectedType,location.context);
	const types = location.dictionary.getExpressionsByValueType(expectedType);
	return types.length > 0;
}



export function hasSuggestions(location, filter){
	return getSuggestions(location,filter).list.length > 0;
}

export function suggestionText(value, spec,dictionary,isNew=false){
	assume(spec);
	assume(dictionary);
	if(value !== null && typeof value === 'object' && value.$type !== undefined){
		//if there is an explicit type then replace it
		spec = dictionary.getTypeSpec(value.$type);
	}

	if(isNew && spec.title){
		return spec.title;
	}else	if(spec.template){
		return calcTemplate(spec.template,value);
	}else if(isPrimitive(value)){
		return value.toString();
	}else if(specComputedPattern(spec)){
		return specComputedPattern(spec);
	}else{
		const ret =  
			value.title || 
			value.label || 
			value.name || 
			value.description || 
			(value.$type? (value.$type + ' '+ (value.ref||value.id||'')) :null)|| 
			'no title';
		return ret;
	}
}

function hasFunction(obj,method){
	 return obj !== null && typeof obj === 'object' && typeof obj[method] === 'function';
}

function scoreSuggestion(suggestion,filter){
	suggestion.score =
		(sourceScore[suggestion.source]) +
		(suggestion.text.search(filter)===0?0.09:0)
}

function comp(a,b){
	if(a.score === b.score){
		if(a.text < b.text){
			return -1;
		}else if(a.text > b.text){
			return 1;
		}else{
			return 0;
		}
	}else{
		return b.score - a.score;
	}
}

const sourceScore = {
	option:0.9,
	instance:0.9,
	context:0.8,
	class:0.6,
	expression:0.5,
	env:0.7
};

function isPrimitive(x){
	return ['boolean','string','number'].includes(typeof x);
}

function roleIsNotArtifact(entity){
	if(entity === null || typeof entity !== 'object'){
		//we don't know the answer
		return null;
	}
	if(typeof entity.role !== 'string'){
		return null;
	}
	return !matchRole(entity.role,Role.artifact);
}

