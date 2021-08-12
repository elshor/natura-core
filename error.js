/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
export function assume(condition,...message){
	if(!condition){
		console.error('Assumption Failed:',...message);
		throw new Error('Assumption Failed: ' + message.map(item=>item.toString()).join(' '));
	}
}

export function depracated(){
	console.error('This code is depracated');
	throw new Error('Depracated');

}

export const LoadError = 'load-error';
export const ParamValue = 'param-value';
export const MissingParam ='missing-param';
export const IllegalType = 'illegal-type'