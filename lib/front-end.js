export function log(str){
	console.log(str);
}

export function alert(str){
	alert(str)
}

export function elementWithId(id){
	return document.getElementById(id);
}

export function elementMatching(selector){
	return document.querySelector(selector);
}

export function onClick(e){
	this.registerEvent(e,'click',this.handler)
}

export function onUpdate(e){
	this.registerEvent(e,'update',this.handler)
}

export function onDblClick(e){
	this.registerEvent(e,'dblclick',this.handler)
}

export function onType(key,e){
	this.registerEvent(e,'keyup',()=>{
		if(e.key === key){
			this.handler
		}
	})
}

export function onFocus(e){
	this.registerEvent(e,'focus',this.handler)
}

export function onBlur(e){
	this.registerEvent(e,'blur',this.handler)
}
