/**
 * Execute an action.
 */
export default function exec(action,context){
	if(!action){
		throw new Error('action was not defined')
	}
	const spec = context.$location.dictionary.getTypeSpec(action.$type);
	if(!spec){
		throw new Error('spec is not defined');
	}
	//TODO need to handle non-function exec
	if(typeof spec.exec !== 'function'){
		throw new Error('exec is not defined as function')
	}
	return spec.exec.call(action,context);
}
