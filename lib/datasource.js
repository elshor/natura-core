/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
export function create(dataType,newItem){
	console.log('datasource create',dataType,newItem);
}

export function select(driver,type,conditions,sort){
	if(typeof driver.select === 'function'){
		return driver.select(type,conditions,sort);
	}
	return [
		{description:'first test item'},
		{description:'second test item'}
	]
}

