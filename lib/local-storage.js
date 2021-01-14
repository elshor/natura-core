export function query(recordType,filters){
	console.log('in query',recordType,filters);
}

export function recordCount(collection){
	console.log('recordCount',collection);
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