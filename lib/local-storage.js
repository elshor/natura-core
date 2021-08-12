/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
 * simple local storage based store - used for demo purposes
 * 
 */

/**
 * @natura entity local storage
 * @returns DataSource
 */
export function LocalStorage(){
	return {
		query(recordType,filters){
			const all = localStorage.getItem('record:'+recordType) || [];
			//TODO filters
			return all;
		},

		recordCount(collection){
			return Array.isArray(collection)? collection.length : 0;
		},
		
		conditionFilter(condition,filter){
		},
		
		filter(field,trait){
		},
		
		addRecord(recordType,setters){
		},
		
		updateRecord(record,setters){
		},
		
		deleteRecord(record){
		},
		
		fieldSetter(field,value){
		}
	}
}

/**
* A data type for entities that are stored in the local storage data source
* @typedef LocalDataType
* @natura entity <<name>>
* @isa DataType
* @property {String$} name name of data type
* @property {LocalField$[]}  fields fields of data type
**/

/**
* Field for local data type
* @typedef LocalField
* @natura entity
* @property {Name} name name of field
* @property {type.LocalFieldType}  CodeName placeholder - description
**/

/**
* description
* @typedef {PossibleType} 
* @natura entity
* @isa LocalFieldType

**/