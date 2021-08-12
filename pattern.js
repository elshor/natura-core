/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume } from "./error.js";
import {specComputedPattern} from './spec.js'

export function parsePattern(text=''){
	assume(typeof text === 'string','pattern is a' + typeof text + ' - ' + text);
	const numerators = {};
	const ret = {text:text, fields:[],elements:[]};
	const regex = /(([^\<\>]+)|(<<[^\>]+>>))/g;
	const parsed = text.match(regex);
	if(!parsed){
		return ret;
	}
	parsed.forEach(element=>{
		const parsed = element.match(/^<<(.+)>>$/);
		if(parsed){
			//this is a field
			const field = {type:parsed[1]};
			if(numerators[field.type] === undefined){
				numerators[field.type] = 0;
				field.name = field.type;
			}else{
				numerators[field.type]++;
				field.name = field.type + numerators[field.type];
			}
			ret.fields.push(field);
			ret.elements.push(field);
		}else{
			if(ret.elements.length > 0 && typeof ret.elements[ret.elements.length-1] === 'string'){
				ret.elements[ret.elements.length - 1] =
					ret.elements[ret.elements.length - 1] + element;
			}else{
				ret.elements.push(element);
			}
		}
	});
	return ret;
}

export function patternFields(pattern){
	return parsePattern(pattern).fields;
}

/**
 *
 * @param {Location} location
 */
export function patternText(location){
	if(!location){
		return null;
	}
	const spec = location.spec;
	if(!spec){
		const value = location.value === undefined|| location.value === null?'___' : location.value;
		return value.title||value.name||value.label||value.$id||value.toString();
	}
	const pattern = specComputedPattern(spec);
	if(!pattern){
		const value = location.value === undefined|| location.value === null?'___' : location.value;
		return value.title||value.name||value.label||value.$id||value.toString();
	}
	return calcPattern(location,pattern);
}

export function calcPattern(location,pattern){
	return parsePattern(pattern).elements
		.map(el=>{
			if(typeof el === 'string'){
				return el;
			}else{
				return patternText(location.child(el.name));
			}
		})
		.join('');
}
