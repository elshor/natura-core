/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { relativeLocations, shadowLocation } from "./location.js";
import { specComputedPattern} from "./spec.js";
import { assume } from "./error.js";
import { generateNewElement } from "src/components/utils.js";
import {calcTemplate} from './template.js'
import { calcValue } from "./calc.js";
import {contextEntries, contextSearch} from './context.js'
import { cloneEntity } from "./entity.js";
import {Role,matchRole} from './role.js'
import Type from './type.js'

const NumberOfUntaggedAtTop = 3;
const MaxSuggestionCount = 7;

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
	if(itsExpectedSpec.options){
		getOptionSuggestions(ret,location,itsExpectedSpec);
		return ret;//when options are set then no need to look further
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
			if(spec.role===Role.abstract){
				//ignore abstract types
				return;
			}
			const value = generateNewElement(type,null,dictionary);
			ret.list.push({
				value: value,
				description: spec.description,
				source:'class',
				text: suggestionText(value,spec,dictionary,true),
				alt:spec.suggest? spec.suggest.alt : undefined,
				tag: spec.suggest? spec.suggest.tag : undefined,
				requiredContext:spec.suggest? spec.suggest.requiredContext : undefined,
				entityScore:entityScore(spec)
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
			description:entry.description,
			alt:entry.alt
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
					description:entry.description,
					alt:entry.alt
				})
			}
		})
	}

	///////////////////
	//context instances
	///////////////////
	if(expectedType){
		contextEntries(
			location,
			expectedType,
			null,//name
			true//useExpected
		).forEach(entry=>{
			//prevent self referencing context entity
			if(entry.path && entry.path === location.path){
				return;
			}
			
			//if role is specified then make sure it matches
			if(role && !matchRole(entry.role,role)){
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
				description:entry.description,
				alt:entry.alt
			})
		});
	}

	////////////////////////
	//dictionary expressions
	////////////////////////
	if(expectedType && !(role && matchRole(role,Role.type))){
		getExpressionSuggestions(ret,expectedType,dictionary,itsExpectedSpec,allowExpressions,role);
	}

	ret.list = filterDuplicates(ret.list);
	ret.list = filterByContext(location,ret.list);

	return ret;
}

/**
 * Filter out any entries that require a context entity that does not exist
 * @param {Location} location 
 * @param {Array} list 
 */
function filterByContext(location,list){
	//first check if there are any suggestions with required context
	let found = false;
	for(let i=0;i<list.length;++i){
		if(list[i].requiredContext){
			found = true;
			break;
		}
	}
	if(!found){
		//no required context - just return the list
		return list;
	}

	//search context and check if required contexts are found
	const contextTypes = {};
	contextSearch(location,entry=>{
		contextTypes[entry.type.toString()] = entry.type;
	});

	//filter list
	const types = Object.values(contextTypes);
	return list.filter(entry=>{
		const requiredContext = entry.requiredContext;
		if(!requiredContext){
			//not context required
			return true;
		}
		return types.some(type=>location.dictionary.isa(type,requiredContext));
	})
}

function filterDuplicates(list){
	const texts = {};
	return list.filter(entry=>{
		if(texts[entry.text]){
			return false;
		}else{
			texts[entry.text] = true;
			return true;
		}
	})
}


export function filterAndSortSuggestions(suggestions,filter,tags=[]){
	const ret = {
		list:suggestions.list.filter(item=>{
			//filter by tags
			if((tags.length >= 1) && !tags.includes(item.tag)){
				return false;
			}
			
			//filter by entry text
			filter = filter.toLowerCase();
			const text = (item.text||'').toLowerCase();
			if(text.includes(filter)){
				item.matchedText = text;
				return true;
			}
			//now check alt texts
			const alt = item.alt || [];
			for(let i=0;i<alt.length;++i){
				if(alt[i].toLowerCase().includes(filter)){
					item.matchedText = alt[i];
					return true;
				}
			}
			return false;
		})
	}
	ret.list.forEach(item=>scoreSuggestion(item,filter));
	ret.list.sort(comp);
	ret.list = groupSuggestions(ret.list);
	return ret;
}

/**
 * group suggestions by tags when there are too many suggestions
 * @param {Array} list 
 */
function groupSuggestions(list){
	const tags = [];
	const ret = [];

		//if there aren't many suggestions then don't need tagging
		if(list.length < MaxSuggestionCount){
			return list;
		}
	
	//copy top suggestions - no grouping
	let pos = 0;
	const count = Math.min(NumberOfUntaggedAtTop,list.length);
	for(;pos<count;++pos){
		ret.push(list[pos]);
	}

	//generate tags
	for(;pos<list.length;++pos){
		if(list[pos].tag){
			//check if already exists
			const tag = tags.find(t=>t.name === list[pos].tag);
			if(tag){
				tag.count++;
			}else{
				tags.push({name:list[pos].tag,count:1});
			}
		}
	}

	const rest = list.length - NumberOfUntaggedAtTop;
	//add tags only if they include more than one entry and less than rest
	for(let i=0;i<tags.length;++i){
		if(tags[i].count > 1 && tags[i].count < rest){
			ret.push({entryType:'tag',text:tags[i].name});
		}
	}

	//insert all entries that are not tagged
	for(let i=NumberOfUntaggedAtTop;i<list.length;++i){
		const entry = list[i];
		if(!ret.find(e=>(e.entryType==='tag' && entry.tag===e.text))){
			//the entry is not tagged (with a valid tag) - insert it at the end
			ret.push(list[i]);
		}
	}

	return ret;
}


function getExpressionSuggestions(suggestions,expectedType,dictionary,itsExpectedSpec,allowExpressions,role){
const types = dictionary.getExpressionsByValueType(expectedType,allowExpressions,role);
types.forEach(type=>{
	const value = generateNewElement(type,null,dictionary);
	const spec = dictionary.getTypeSpec(type);
	suggestions.list.push({
		value: value,
		description: spec.description,
		source:'expression',
		alt: spec.suggest? spec.suggest.alt : undefined,
		tag: spec.suggest? spec.suggest.tag : undefined,
		requiredContext:spec.suggest? spec.suggest.requiredContext : undefined,
		entityScore:entityScore(spec),
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

export function suggestionText(value, spec,dictionary,isNew=false,entry){
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
		((sourceScore[suggestion.source]) * (suggestion.entityScore||0)) +
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

function getOptionSuggestions(ret,location,spec){
	if(!spec.options || typeof spec.options !== 'object'){
		console.error('Error in options format - expected object',spec.options);
		return;
	}
	if(spec.options.$type === 'path options'){
		const locations = relativeLocations(
			shadowLocation(location),
			spec.options.path
		);
		locations.forEach(option=>{
			const value = option.value;
			if(value === undefined || value === null){
				//value does not exist, cannot do anything with it
				return;
			}
			const label = value.name||value.label||value.toString()
			ret.list.push({
				value: {
					$type:'reference',
					label,
					valueType:value.$type,
					description:value.description,
					path:option.path,
					role:'instance'
				},
				description: value.description,
				source:'option',
				text: label
			})
		})
	}else if(Array.isArray(spec.options)){
		spec.options.forEach(option=>{
			ret.list.push({
				value:option,
				label:option,
				valueType:'string',
				path:location.path,
				role:'value'
			})
		})
	}else{
		console.error('Unknown options definition',spec.options);
	}
}

function entityScore(spec){
	if(!spec || !spec.suggest || !spec.suggest.score){
		//no bias
		return 1;
	}
	switch(spec.suggest.score){
		case 'low':
			return 0.8;
		case 'high':
			return 1.2
		case 'medium':
		default:
			return 1;
	}
}