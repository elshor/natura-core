/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { specType, specComputedPattern} from "./spec.js";
import { assume } from "./error.js";
import { generateNewElement } from "src/components/utils.js";
import {calcTemplate} from './template.js'
import { calcValue } from "./calc.js";
import {contextEntries} from './context.js'
import clone from 'clone'


export function getSuggestions(location,filter='',spec,allowExpressions,externalContext){
	const dictionary = location.dictionary;
	const ret = {
		state: 'loaded',
		list:[]
	};
	//generate suggestions
	assume(location);
	const itsExpectedSpec = spec || location.expectedSpec;
	if(!itsExpectedSpec){
		//apparently there is no expected spec. This can be because we are in an editor of property name. just return an empty list
		return ret;
	}
	const expectedType = calcValue(itsExpectedSpec.type,location.context);
	const isInstance = dictionary.isInstance(expectedType);

	//options suggestions
	let options=[];
	if(itsExpectedSpec.options){
		//options are explicitly set - just use it
		options = itsExpectedSpec.options;
	}else{
		const optionsType = dictionary.isInstance(expectedType)?
			dictionary.typeOfInstance(expectedType) : expectedType;
		options = dictionary.getTypeSpec(optionsType).options;
	}
	const calculatedOptions = calcValue(options,location.context);
	if(hasFunction(calculatedOptions,'forEach')){
		//the spec has an array options property (or other object that supports forEach function)
		calculatedOptions.forEach(option=>
			ret.list.push({
				value:clone(option),
				text: suggestionText(option,itsExpectedSpec,dictionary),
				source:'option'
			})
		);
	}
	if(itsExpectedSpec.options){
		//if options are specified then ignore any other suggestion types
		filterSuggestions(ret,filter);
		sortSuggestions(ret,filter);
		return ret;	
	}

	//category types suggestions
	if(dictionary.isClass(expectedType)){
		dictionary.getClassMembers(expectedType).forEach(type=>{
			if(expectedType===type){
				//ignore the class itself
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

	//dictionary instances
	const entries = dictionary.getInstancesByType(expectedType);
	//TODO check scope
	//TODO should only work for instance types
	entries.forEach(entry=>{
		ret.list.push({
			value: clone(entry),
			text:entry.label,
			source:'instance',
			description:entry.description
		})
	})

	//external context
	if(expectedType && externalContext){
		externalContext.forEach(entry=>{
			if(entry.valueType===expectedType){
				ret.list.push({
					value: clone(entry.value),
					source:'context',
					text:entry.label,
					path:entry.path,
					description:entry.description
				})
			}
		})
	}

	//context instances - only relevant if the type is an instance
	if(expectedType && isInstance){
		contextEntries(location,expectedType).forEach(entry=>{
			ret.list.push({
				value: clone(entry.value||entry.name),//if value not specified then treat the name as value
				source:'context',
				text:entry.name,
				path:entry.path,
				description:entry.description
			})
		});
	}

	//dictionary expressions - only relevant if the type is an instance
	if(expectedType && allowExpressions && isInstance){
		getExpressionSuggestions(ret,expectedType,dictionary,itsExpectedSpec);
	}

	filterSuggestions(ret,filter);
	sortSuggestions(ret,filter);
	return ret;
}

function filterSuggestions(suggestions,filter){
	suggestions.list = suggestions.list.filter(item=>
		item.text.toLowerCase().includes(filter.toLowerCase())
	);
}

function getExpressionSuggestions(suggestions,expectedType,dictionary,itsExpectedSpec){
	const searchType = dictionary.isInstance(expectedType)?
		expectedType :
		dictionary.instanceType(expectedType);
const types = dictionary.getExpressionsByValueType(searchType);
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
	const itsExpectedSpec = location.expectedSpec;
	const expectedType = calcValue(itsExpectedSpec.type,location.context);
	const searchType = location.dictionary.isInstance(expectedType)?
		expectedType :
		location.dictionary.instanceType(expectedType);
	const types = location.dictionary.getExpressionsByValueType(searchType);
	return types.length > 0;
}

function sortSuggestions(suggestions,filter){
	suggestions.list.forEach(item=>scoreSuggestion(item,filter));
	suggestions.list.sort(comp)	
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
