/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
* Web Project is used to define a web project with data sources, web pages and assets that are part of the deployment
* @property {String} name name of project - Specify the name of the project
* @property {richtext$}  description description of the package - specify here the description of the package. This will be displayed in the package list
* @property {DataSource[]} dataSources data source to use in project - specify the data soruce to use in this project (expanded)
* @property {WebPage[]} pages project web page - specify the web page definition for this project (expanded)
* @natura entity
**/
export function WebProject(name,description,dataSources,pages){
	console.log('web project',name,description,dataSources,pages);
new Vue({
	el:'#app',
	data:{
		message:'hello world'
	}
})
}
