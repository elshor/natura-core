/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
const DataCollection = {
	name:'data collection',
	role:'type',
	genericProperties:['dataType']
}

const Datasource = {
	name:'data source',
	description:`Define a data source
	- name
	- driver
	- dataTypes
		- name
		- singular
		- plural
		- fields:
			- name
			- label
			- type
			- canFilter
			- canSort
	`,
	register: registerDatasource
}

function registerDatasource(dictionary,_,spec){
	//this is a placeholder for registering a data source based on the above field definition. Currently this does not work
}

export default [DataCollection,Datasource];
