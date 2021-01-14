import Vue from 'vue';
import {uid} from '../components/utils'

const entities = [
	{
		type: 'load html',
		isa: ['editor action'],
		exec: async function(context,{change}){
			const file = await loadFiles({
				title:'Select HTML template file',
				accept:'.html'
			});
			if(this.parse){
				const doc = new DOMParser().parseFromString(file,'text/html');
				const json = htmlToJSON(doc,this.asTemplate);
				change(json);
			}else{
				change(file);
			}
		}
	}
]

async function loadFiles({title='Load File',accept=undefined,multiple=false}){
	return new Promise((resolve)=>{
		const id = uid();
		if(accept && !accept.match(/^[\w\.\,\/\*]+$/)){
			throw new Error('Load file accept contains unacceptable characters');
		}
		Vue.prototype.$q.dialog({
			title: title,
			message: `<input id="${id}" type="file" ${multiple?'multiple':''} ${accept? 'accept="'+accept+'"':''}/>`,
			html: true
		}).onOk(() => {
			const allFiles = document.getElementById(id).files;
			resolve(Promise.all(Array.from(allFiles).map(file=>{
				return new Promise((resolve)=>{
					const reader = new FileReader();
					reader.onloadend = function(e) {
						resolve( e.currentTarget.result||null);
					};
					reader.readAsText(file);//TODO handle different types
				});
			})).then(files=>{
				if(multiple){
					return files;
				}else{
					return files[0];
				}
			}))
		}).onCancel(()=>{
			resolve([]);
		});
	});
}

/**
 * Converts an HTML document as text into an html document object or html template object in case `asTemplate` is true.
 * <br>This function generates the following objects
 * <li><code>html document</code> or <code>html template</code> as top element. If asTemplate is true then the top element is body, otherwise the top element is html
 * <li>Each element is created as type <code>html element</code> or <code>template element</code>
 * text noded are outputed as a trimmed string. Empty strings are ignored.
 * <li>attributes are translated into an array of attribute objects excluding classes
 * <li>Classes are translated into an array of class strings
 * <li>style is translated into an array of html style objects
 * <li><code>dom node</code> objects are generated for any other type when asTemplate is false. If it is true then other dom nodes are ignored


 * @param {String} html html text
 * @param {Boolean} asTemplate true to indicate that the loaded object should be a template
 */
function htmlToJSON(html, asTemplate = false){
	const top = asTemplate? html.body : html;
	return {
		$type: asTemplate? 'html template' : 'html document',
		classes: classesToJSON(top.attributes['class']),
		attributes: attributesToJSON(top.attributes),
		style:styleToJSON(top.attributes['style']),
		children: Array
			.from(top.childNodes)
			.map(node=>nodeToJSON(node,asTemplate))
			.filter(child=>child!==null)
	};
}

function classesToJSON(classes){
	if(!classes || !classes.value){
		return [];
	}
	return classes.value.split(' ').map(item=>item.trim());
}

function styleToJSON(style){
	if(!style || !style.value){
		return [];
	}
	return style
		.value
		.split(';')
		.map(item=>{
			const split = item.trim().split(':').map(item=>item.trim());
			return {$type:'html style',name:split[0],value:split[1]}
		});
}

function attributesToJSON(attbt){
	const ret = [];
	if(!attbt || !attbt.length){
		return ret;
	}
	for(let i=0;i<attbt.length;++i){
		if(['class','style'].includes(attbt[i].name)){
			//ignore class and style attribute
			continue;
		}
		ret.push({
			$type: 'html attribute',
			name: attbt[i].name,
			value: attbt[i].value
		});
	}
	return ret;
}

function nodeToJSON(node, asTemplate){
	switch(node.nodeType){
	case node.ELEMENT_NODE:
		return {
			$type:asTemplate? 'template element': 'html element',
			display:asTemplate?{$type:'display element'}:undefined,
			tag:node.nodeName,
			attributes:attributesToJSON(node.attributes),
			classes: classesToJSON(node.attributes['class']),
			style:styleToJSON(node.attributes['style']),
			children: Array
				.from(node.childNodes)
				.map(node=>nodeToJSON(node,asTemplate))
				.filter(node=>node!==null)
		};
	case node.TEXT_NODE:
		const txt = node.nodeValue.trim();
		return txt.length===0?null:txt;
	default:
		return asTemplate? null : {
			$type: 'dom node',
			name:node.nodeName,
			value:node.nodeValue,
			children:Array.from(node.childNodes).map(nodeToJSON)
		}
	}
}

export default {
	name:'loaders',
	entities:{
		$type:'entity definition group',
		members:entities,
		model:{isa:[]}
	}
}
