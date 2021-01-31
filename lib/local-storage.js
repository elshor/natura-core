/**
 * simple local storage based store - used for demo purposes
 * @module
 * 
 */
export function query(recordType,filters){
	const all = localStorage.getItem('record:'+recordType) || [];
	//TODO filters
	return all;
}

export function recordCount(collection){
	return Array.isArray(collection)? collection.length : 0;
}

export function conditionFilter(condition,filter){
}

export function filter(field,trait){
}

export function addRecord(recordType,setters){
}

export function updateRecord(record,setters){
}

export function deleteRecord(record){
}

export function fieldSetter(field,value){
}