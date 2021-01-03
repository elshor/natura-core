export function assume(condition,message,description){
	if(!condition){
		const message = 'Assumption Failed: ' + description;
		console.error(message);
		throw new Error(message);
	}
}



export const LoadError = 'load-error';
export const ParamValue = 'param-value';
export const MissingParam ='missing-param';
export const IllegalType = 'illegal-type'