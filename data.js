let dataHandler = null;

//errors
export const NOT_AUTHORIZED = 'not-authorized';
export const NEED_LOGIN = 'need-login';
export const SERVER_ERROR = 'server-error'
export const GENERAL_ERROR = 'general-error'
export const ALREADY_EXISTS = 'already-exists'


export function registerDataHandler(handler){
	dataHandler = handler;
}

export function loadPackage(id){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.loadPackage(id);
}

export function deleteDoc(id){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.deleteDoc(id);
}

export function storeDoc(doc,id){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.storeDoc(doc,id);
}

export function getScriptList(){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.getScriptList();
}

export function getPackageList(){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.getPackageList();
}

export function loadDoc(id){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.loadDoc(id);
}

export function publishDoc(doc){
	if(!dataHandler){
		throw {
			error:'not-initialized',
			message:'data handler was not initialized.'
		}
	}
	return dataHandler.publishDoc(doc);
}
