/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { generateNewEntity } from "./entity.js";
import { assume } from "./error.js";
import {specComputedPattern} from './spec.js'
import TemplateType from "./template-type.js";
import Type from './type.js'

export function parsePattern(text='', def){
	assume(typeof text === 'string','pattern is a' + typeof text + ' - ' + text);
	const numerators = {};
	const ret = {text:text, fields:[],elements:[]};
	const regex = /(([^\<\>]+)|(<<[^\>]+>>))/g;
	const parsed = text.match(regex);
	if(!parsed){
		return ret;
	}
	parsed.forEach(element=>{
		const parsed = element.match(/^<<([^:]+)(?:\:(.+))?>>$/);
		if(parsed){
			//this is a field

			//by default expect the field to be a type
			const field = {type:parsed[1]};
			if(parsed[2]){
				//a separate name is defined
				field.name = parsed[2];
			}else	if(numerators[field.type] === undefined){
				numerators[field.type] = 0;
				field.name = field.type;
				
				//if properties are defined, check if the field is property name
				if(def && def.properties && def.properties[field.name]){
					field.type = def.properties[field.name].type;
				}
			}else{
				numerators[field.type]++;
				field.name = field.type + numerators[field.type];
			}
			if(typeof field.type === 'function'){
				debugger;
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

export function patternProperties(pattern){
	return Object.fromEntries(patternFields(pattern).map(field=>([field.name,{type:field.type}])));
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

export function patternAsGrammer(
	target, 
	pattern, 
	spec, 
	tokenizer, 
	dictionary, 
	packageName,
	isPartial=false){
	const props = spec.properties;
	const parts = pattern
		.split(/(?<!\\),/)
		.map(item=>item.trim().replace(/\\,/g,','));
	const parsed = parsePattern(parts[0], spec);
	const typeName = spec.name;
	parts.forEach((part, index) =>{
		if(index > 0){
			//this is a pattern fragment. It can either appear or not with or without a preceding comma
			const parsedPart = parsePattern(part, spec);
			const name = spec.name + '$' + index + (spec.specializedFor? '<t>' : '');
			parsed.elements.push({
				name,
				type: 'fragment',
				rules: patternAsGrammer(
					name, 
					part, 
					spec, 
					tokenizer, 
					dictionary, 
					packageName,
					true
				)
			})
		}
	})
	
	const base = {
		name: typeAsString(target), 
		symbols: [],
		description: spec.description,
		source: spec.name
	};
	const rules = [base];
	const converterData = {};
	parsed.elements.forEach(el=>{
		if(typeof el === 'string'){
			tokenizer(el).forEach(token=>{
				if(token === ' '){
					base.symbols.push('_');
				}else{
					base.symbols.push({literal: token});
				}
			})
		}else if(el.type === 'fragment'){
			rules.push(... el.rules);
			rules.push({
				name: el.name + '?',
				symbols: ['FRAGMENT_SEP', el.name],
				source: spec.name + '*',
				postprocess(data){
					return data[1];
				}
			},{
				name: el.name + '?',
				symbols: [],
				source: spec.name + '*'
			})
			base.symbols.push(el.name + '?');
		}else{
			converterData[base.symbols.length] = el.name;
			let type = typeAsString(el.type);
			if(props[el.name] && props[el.name].examples){
				//this type has examples - generate a specific type for this and add examples
				type = `${type}<${base.name}.${el.name}>`;
				rules.push({
					name: type,
					symbols:[typeAsString(el.type)],
					source: `${base.name}.${el.name}`,
					postprocess: takeFirst
				})

				props[el.name].examples.forEach(example=>{
					rules.push({
						name: type,
						symbols:[{literal: JSON.stringify(example)}],
						source: `${base.name}.${el.name}$example`,
						postprocess: takeFirst
					})
				})
			}
			base.symbols.push(type);
		}
	})
	base.postprocess = generateConverter(converterData, isPartial? null : typeName, dictionary, spec);
	return rules;
}

function typeAsString(type){
	const typeObject = Type(type);
	if(typeObject instanceof TemplateType){
		console.error('Template types are not supported', type);
	}
	const ret = typeObject.toString();
	return ret;
}

function generateConverter(converterData, typeName, dictionary, spec){
	const packageName = spec.$package._id;
	let ret = function(data, reference, fail){
		const ret = typeName? generateNewEntity(dictionary, typeName) : {$partial:true}
		Object.entries(converterData).forEach(([key, value])=>{
			ret[value] = data[key];
		})

		//integrate partials
		data.forEach(item=>{
			if(!item || !item.$partial){
				return;
			}
			Object.entries(item).forEach(([key,value])=>{
				if(['$pkg','$partial'].includes(key)){
					return;
				}
				ret[key] = value;
			})
		})
		ret.$pkg = packageName;
		if(!processConstraint(spec, ret)){
			return fail;
		}
		return ret;
	}
	ret.typeName = typeName;
	return ret;
}

function takeFirst(data){
	return data[0];
}

function processConstraint(spec, data){
	if(!testConstraint(spec.constraint, data)){
		return false;
	}
	const entries = Object.entries(spec.properties);
	for(let i=0;i<entries.length;++i){
		if(!testConstraint(entries[i][1].constraint, data[entries[i][0]])){
			return false;
		}
	}
	return true;
}

function testConstraint(constraint, data){
	if(!constraint){
		return true;
	}
	const props = Object.entries(constraint);
	for(let i=0;i<props.length;++i){
		switch(props[i][0]){
			case 'noRepeatType':
				if(!testNoRepeatType(data)){
					return false;
				}
				break;
			default:
				//unknown constraint - fail
				return false;
		}
	}
	return true;
}

function testNoRepeatType(data){
	const seen = {};
	if(!Array.isArray(data)){
		return true;
	}
	for(let i=0;i<data.length;++i){
		if(!data[i]){
			continue;
		}
		const current = data[i].$type;
		if(!current){
			continue;
		}
		if(seen[current]){
			return false;
		}
		seen[current] = true;
	}
	return true;
}