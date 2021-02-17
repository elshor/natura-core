import { specType, specComputedPattern} from "./spec.js";
import { assume } from "./error.js";
import { generateNewElement } from "src/components/utils.js";
import {calcTemplate} from './template.js'
import { calcValue } from "./calc.js";
import {contextEntries} from './context.js'
import clone from 'clone'

///////////////////////////////////////////////////////////
//Definitions
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
//Actions
///////////////////////////////////////////////////////////
export function getSuggestions(location,filter,spec){
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

	//options suggestions
	const optionsType = dictionary.isInstance(expectedType)? 
		dictionary.typeOfInstance(expectedType) : expectedType;
	const optionsSpec = optionsType === expectedType? itsExpectedSpec : dictionary.getTypeSpec(optionsType);
	const options = calcValue(optionsSpec.options,location.context);
	if(hasFunction(options,'forEach')){
		//the spec has an array options property (or other object that supports forEach function)
		options.forEach(option=>
			ret.list.push({
				value:clone(option),
				text: suggestionText(option,itsExpectedSpec,dictionary),
				source:'option'
			})
		);
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
	entries.forEach(entry=>{
		ret.list.push({
			value: clone(entry),
			text:suggestionText(entry,itsExpectedSpec,dictionary)
		})
	})

	//context instances
	if(expectedType){
		contextEntries(location,expectedType).forEach(entry=>{
			ret.list.push({
				value: clone(entry.value),
				source:'context',
				text:entry.name,
				path:entry.path,
				description:entry.description
			})
		});
	}

	//dictionary expressions
	if(expectedType){
		const types = dictionary.getExpressionsByValueType(expectedType);
		types.forEach(type=>{
			const value = generateNewElement(type,null,dictionary);
			ret.list.push({
				value: value,
				description: dictionary.getTypeSpec(type).description,
				source:'expression',
				text:suggestionText(value,itsExpectedSpec,dictionary,true)
			});
		});
	}
	ret.list = ret.list.filter(item=>
		item.text.toLowerCase().includes(filter.toLowerCase())
	);

	ret.list.forEach(item=>scoreSuggestion(item,filter));
	ret.list.sort(comp)

	return ret;
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
		return JSON.stringify(value);
	}
}

function hasFunction(obj,method){
	 return obj !== null && typeof obj === 'object' && typeof obj[method] === 'function';
}

function scoreSuggestion(suggestion,filter){
	suggestionText.score =
		sourceScore[suggestion.source] +
		suggestion.text.search(filter)===0?0.09:0

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
	context:0.8,
	class:0.6,
	expression:0.5,
	env:0.7
};

function isPrimitive(x){
	return ['boolean','string','number'].includes(typeof x);
}
