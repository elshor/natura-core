/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
/**
* Web Project is used to define a web project with data sources, web pages and assets that are part of the deployment
* @property {String} name name of project - Specify the name of the project
* @property {richtext$}  description description of the package - specify here the description of the package. This will be displayed in the package list
* @property {DataSource[]} dataSources data source to use in project - specify the data soruce to use in this project (expanded)
* @property {WebPage$[]} pages project web page - specify the web page definition for this project (expanded)
* @property {File$[]}  stylesheets stylesheet file - add here stylesheets to use when rendering project pages
* @natura entity
**/
export function WebProject(name,description,dataSources,pages){
	console.log('Web Project starting ...',pages);
	//Vue.use(VueRouter);
	const router = buildRouter(pages);
	//const app = new Vue({router}).$mount('#app');
	const app = new Vue(Page(pages[0])).$mount('#app');
}

function buildRouter(pages){
	//const routes = pages.map(page=>({path:page.path||'/',component:Page(page)}));
	const Foo = { template: '<div>foo</div>' }//db
	const Bar = { template: '<div>bar</div>' }//db
	const routes = [
		{ path: '/', component: Foo },
		{ path: '/bar', component: Bar }
	]	
	console.log('routes',routes);
	const router = new VueRouter({routes});

	return router;
}

function Page(page){
	return  {
		name:'page',
		mounted(){
		},
		render(createElement){
			if(!page.template){
				//make sure we don't get a null template
				page.template == {};
			}
			const ret = createElement(
				'div',
				generateData(page.template),
				(page.template.children||[]).map(el=>renderElement(createElement,el))
			);
			console.log('generated',ret);
			return ret;
		}
	}
}

function renderElement(createElement,entity){
	if(typeof entity === 'string'){
		return entity;
	}
	return createElement(
		entity.tag,
		generateData(entity),
		(entity.children||[]).map(el=>renderElement(createElement,el))
	)
}

function generateData(entity){
	return {
		ref:entity.ref,
		class:(entity.classes||[]),
		style:generateStyle(entity.style),
		attrs:generateAttributes(entity.attributes)
	};
}

function generateStyle(style=[]){
	const ret = {};
	style.forEach(item=>ret[item.name]=item.value);
	return ret;
}

function generateAttributes(attributes=[]){
	const ret = {};
	attributes.forEach(item=>ret[item.name]=item.value);
	return ret;
}

/**
* description
* @typedef WebPage
* @natura entity this is a web page at <<path>>
* @property {Path$} path the page path - The path to this page. The path string can include parameters such as /path/to/:id
* @property {HtmlTemplate$}  template page template - the template defines the visual structure of the page. 
**/

/**
* path to page within website
* @typedef {String$} Path
* @natura entity
**/

/**
* web template
* @typedef  HtmlTemplate
* @natura entity html template
* @action file_upload load-template /$value | upload an html template
* @prop {TemplateElement[]}  children child elements - list of child elements (expanded)
**/

/**
* description
* @typedef HtmlElement
* @natura entity element <<tag>> referenced as <<ref>>
* @isa TemplateElement
* @property {Tag} tag html tag name
* @property {Name} ref reference name - name used to reference this element
* @property {HtmlAttribute$[]}  attributes list of attributes
* @property {HtmlClass[]} classes html class
* @property {HtmlStyle$[]} styles css style
* @property {TemplateElement[]} children child elements
**/

/**
* An HTML attribute
* @typedef HtmlAttribute
* @natura entity <<name>> : <<value>>
* @property {AttributeName}  name attribute name
* @property {String} value attribute value
**/
/**
* attribute name
* @typedef {String} AttributeName
* @natura entity
**/

/**
* A reference to a file. 
* @typedef File
* @property {String} name file name
* @property {String} path path from source
* @property {String} url file url
* @property {String} type type of file - the mime type of the file
* @action file_upload upload-file | Upload a file to server
* @natura entity file named <<name>>

**/

/**
* description
* @typedef {Text} HtmlClass
* @natura entity
**/

/**
* css style definition
* @typedef HtmlStyle
* @natura entity <<name>> : <<value>>
* @property {StyleName} name css style name
* @property {Text} value css style value
**/

/**
* style name
* @typedef {Text} StyleName
* @natura entity
**/
