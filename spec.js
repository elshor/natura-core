import { assume } from './error';
import calc,{ isExpression } from './calc';
const DefaultPlaceholder = 'Enter value here';

export function specType(spec){
	return spec? (spec.name || spec.type || specComputedPattern(spec)) : 'any';
}

export function specIsa(spec,className){
	return (spec.isa || []).includes(className);
}

export function specComputedPattern(spec){
	if(isExpression(spec.displayPattern)){
		return calc(spec.displayPattern,spec);
	}
	return spec.displayPattern || spec.pattern;
}

export function specID(spec){
	return spec.$id || specType(spec);
}

export function specHasProperties(spec){
	if(!spec || !spec.properties){
		return false;
	}
	return Object.keys(spec.properties).length > 0;
}

export function valueSpec(value,dictionary){
	assume(dictionary);
	switch(typeof value){
	case 'number':
		return {type:'number'};
	case 'string':
		return {type:'string'};
	case 'boolean':
		return {type:'booldean'};
	case 'object':
		if(value === 'null'){
			return {};
		}else	if(typeof value.$type === 'string'){
			return dictionary.getTypeSpec(value.$type);
		}
	default:
		return {};
	}
}

export function placeholder(spec,propertyName){
	if(!spec){
		return DefaultPlaceholder;
	}
	return spec.placeholder ||
		spec.title ||
		propertyName ||
		specType(spec) ||
		DefaultPlaceholder
}

export function mergeSpec(localSpec, typeSpec){
	return Object.assign({},localSpec,typeSpec);
}

export function computeSpecProperty(spec,location, name,defaultValue){
	let value = spec[name];
	if(isExpression(value)){
		value = calc(value,{$spec:spec,$location:location});
	}
	return value === undefined? defaultValue : value;
}


export function specProperties(spec){
	return spec.properties || {};
}

/**
 * Return true if this spec is a selection of options and not a primitive value
 * @param {Spec} spec
 */
export function specIsSelection(spec){
	return spec.options !== undefined && spec.options !== null;
}
