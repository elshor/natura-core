/**
 * simple local storage based store - used for demo purposes
 * @module
 * 
 */
export function query(recordType,filters){
	const all = localStorage.getItem('record:'+recordType) || [];
	console.log('in query',all,recordType,filters);
	//TODO filters
	return all;
}

export function recordCount(collection){
	return Array.isArray(collection)? collection.length : 0;
}

export function conditionFilter(condition,filter){
	console.log('condition filter',condition,filter);
}

export function filter(field,trait){
	console.log('filter',field,trait);
}

export function addRecord(recordType,setters){
	console.log('addRecord',recordType,setters)
}

export function updateRecord(record,setters){
	console.log('udpaateRecord',record,setters);
}

export function deleteRecord(record){
	console.log('deleteRecord',record);
}

export function fieldSetter(field,value){
	console.log('fieldSetter',field,value);
}