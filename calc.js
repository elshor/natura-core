/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
export default function calc(expression, context={}){
	if(typeof expression === 'function'){
		return expression(context);
	}else if(typeof expression === 'object' && expression !== null && expression.$type && context.$dictionary){
		const spec = context.$dictionary.getTypeSpec(expression.$type);
		if(typeof spec.calc === 'function'){
			return spec.calc.call(expression,context);
		}
	}
	return expression;
}

export function isExpression(value,context={}){
	if(typeof value === 'function'){
		return true;
	};
	if(value && typeof value === 'object' && value.$type && context.$dictionary){
		const spec = context.$dictionary.getTypeSpec(value.$type);
		if(typeof spec.calc === 'function'){
			return true;
		}
	}
	return false;
}

/**
 * If value is an expression then return the value of  the expression, otherwise just return the value
 * @param {Any} value value or expression
 * @param {Object} context context of calculation
 */
export function calcValue(value,context={}){
	if(isExpression(value,context)){
		return calc(value,context);
	}else{
		return value
	}
}
