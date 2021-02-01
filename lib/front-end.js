export function alert(str){
	window.alert(str)
}

export function elementWithId(id){
	return document.getElementById(id);
}

export function elementMatching(selector){
	return document.querySelector(selector);
}


export function changeStyle(e,name,value){
	if(e && typeof e === 'object' && e.style){
		e.style[name] = value;
	}
}