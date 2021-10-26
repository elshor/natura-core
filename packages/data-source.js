/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume } from "../error.js"


const Create = {
	name:'create data item',
	pattern:'create a new <<dataType>> as <<newItem>',
	fn:'create@natura/lib/datasource(dataType,newItem)',
	properties:{
		dataType:{type:'record type'},
		newItem:{type:'data item'}
	},
	description:'Insert a new data item into data store',
	isa:['action']
}

const Select = {
	name:'select dataset',
	genericProperties:['dataType'],
	title:'{{plural}}',
	role:'artifact',
	fn:'select@natura/lib/datasource(driver,type,dataset,conditions)',
	valueType:'collection',
	pattern:'{{dataType.plural}} where <<conditions>>',
	properties:{
		dataType:'record type',
		conditions:{
			type:()=>{
				return 'condition*';
			}
		}
	}
}

const Update = {
	name:'update data item',
	isa:['action'],
	pattern:'update <<dataItem>>',
	properties:{
		dataItem:'data item'
	}
}

const Delete = {
	name:'delete data item',
	title:'delete data item',
	pattern:'delete <<dataItem>>',
	isa:['action'],
	properties:{
		dataItem:'data item'
	}
};

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

const DataCollection = {
	name:'data collection',
	role:'type',
	genericProperties:['dataType']
}

function registerDatasource(dictionary,_,spec){
	assume(
		typeof spec.driver === 'string',
		'data source must define its data driver as a string with name of driver'
	);
	assume(spec.name,'data source must have a name specified');
	
	//register data source
	dictionary._registerInstance(
		spec.name,
		'data source',
		spec,
		spec.name,
		spec.description
	)
	spec.driver = {$type:spec.driver};
	
	//add data types
	(spec.dataTypes||[]).forEach(dataType=>{
		
		//create its context
		const context = [];
		context.push({
			$type:'basic emit',
			type:dataType.name,
			name:'the ' + dataType.singular,
			access:'+-item'
		});
		dataType.fields.forEach(field=>{
			context.push({
				$type:'basic emit',
				type:field.type,
				access:'+-item>' + field.name,
				name:`${field.label} of the ${dataType.singular}`
			})
		});
		
		//dataType.fields.forEach(field=>{
		
		//create dataset expression
		dictionary._registerSpecializedType(
			'collection.'+dataType.name,
			'select dataset',
			{
				type:dataType.name,
				dataset:spec.name,
				plural:dataType.plural,
				driver:spec.driver
			},
			{
				title:dataType.plural,
				pattern:`${dataType.plural} where <<conditions>>`,
				context
			}
		)
		
		//create data type plural instance
		dictionary._registerInstance(
			'plural.'+dataType.name,
			'data type plural',
			{dataset:spec.name,type:dataType.name},
			dataType.plural,
			'collection of ' + dataType.plural
		)
		
		//create data type singular instance
		dictionary._registerInstance(
			'singular.'+dataType.name,
			'data type singular',
			{dataset:spec.name,type:dataType.name},
			dataType.singular,
			'the ' + dataType.singular + ' data type'
		)
	})
}

export default [Datasource,Create,Update,Delete,Select,DataCollection];
