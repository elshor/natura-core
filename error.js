export function assume(condition,message,description){
	if(!condition){
		console.error('Assumption Failed',message,description);
	}

}



export const LoadError = 'load-error';
export const ParamValue = 'param-value';
export const MissingParam ='missing-param'