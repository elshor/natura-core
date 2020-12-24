/**
 * Execute an action. The action is an action type where its spec has an exec property with function. The exec function is called with the action object as this.
 * @param {Action} action action type object to perform
 * @param {Object} a context object representing the context of the action. The context would also have properties $location and $dictionary to be accessed by the exec function
 * @param {Object} handlers an object with handler functions that enable communication with the editor.
 * @param {Function} handlers.change a function that takes one argument of newVal - updating the value at context location
 *
 */
export default function exec(action,context,handlers){
	if(!action){
		throw new Error('action was not defined')
	}
	const spec = context.$location.dictionary.getTypeSpec(action.$type);
	if(!spec){
		throw new Error('spec is not defined');
	}
	//TODO need to handle non-function exec
	if(typeof spec.exec !== 'function'){
		console.error('Exec is not defined as function. spec is',spec);
		throw new Error('exec is not defined as function')
	}
	return spec.exec.call( action, context, handlers);
}
