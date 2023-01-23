//import Dictionary from "./dictionary.js";

export function createDictionary(){
	console.log('should create dictionary here 2')
	let ret =  new Dictionary();
	console.log('dictionary',ret);
	return ret;
}


export class Dictionary{
	constructor(){
		this.grammer = {};
	}
	toString(){
		return 'i am a dictionary'
	}
	addPackageText(text){
		console.log('added text', text);
		this.grammer.a = text;
	}
}