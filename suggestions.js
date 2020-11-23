import { specType, valueSpec, specComputedPattern, mergeSpec} from "./spec";
import { assume } from "./error";
import { generateNewElement } from "src/components/utils";
import {calcTemplate} from './template'
import { calcValue } from "./calc";

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
	const options = calcValue(itsExpectedSpec.options,location.context)
	if(hasFunction(options,'forEach')){
		//the spec has an array options property (or other object that supports forEach function)
		options.forEach(option=>
			ret.list.push({
				value:option,
				text: suggestionText(option,itsExpectedSpec,dictionary),
				source:'option'
			})
		);
	}

	//category types suggestions
	if(dictionary.isClass(expectedType)){
		dictionary.getClassMembers(expectedType).forEach(type=>{
			const value = generateNewElement(type,null,dictionary);
			ret.list.push({
				value: value,
				source:'class',
				text: suggestionText(value,itsExpectedSpec,dictionary)
			});
		});
	}

	//context entities
	const context = location.contextSpec;
	context.forEach(entry=>{
		if(entry.type === expectedType){
			ret.list.push({
				value: {
					$type:'reference',
					label:entry.label,
					valueType: entry.type,
					path:entry.path,
				},
				source:'context',
				text:entry.label,
				path:entry.path
			});
		}
	});

	//dictionary expressions
	if(location.canUseExpressions){
		const types = dictionary.getExpressionsByValueType(expectedType);
		types.forEach(type=>{
			const value = generateNewElement(type,null,dictionary);
			ret.list.push({
				value: value,
				source:'expression',
				text:suggestionText(value,itsExpectedSpec,dictionary)
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

export function suggestionText(value, spec,dictionary){
	assume(spec);
	assume(dictionary);
	if(value !== null && typeof value === 'object' && value.$type !== undefined){
		//if there is an explicit type then merge it
		spec = mergeSpec(spec,dictionary.getTypeSpec(value.$type));
	}
	if(spec.template){
		return calcTemplate(spec.template,value);
	}else if(spec.title){
		return spec.title;
	}else if(spec.label){
		return spec.label;
	}else if(isPrimitive(value)){
		return value.toString();
	}else if(specComputedPattern(spec)){
		return specComputedPattern(spec);
	}else{
		return specType(valueSpec(value,dictionary));
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
	class:0.7,
	expression:0.6
};

function isPrimitive(x){
	return ['boolean','string','number'].includes(typeof x);
}
