export function assume(condition,...message){
	if(!condition){
		console.error('Assumption Failed:',...message);
		throw new Error('Assumption Failed: ' + message.map(item=>item.toString()).join(' '));
	}
}



export const LoadError = 'load-error';
export const ParamValue = 'param-value';
export const MissingParam ='missing-param';
export const IllegalType = 'illegal-type'