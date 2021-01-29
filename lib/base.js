//library containing functions used in expressions and actions defined in base
export function condition(subject,trait){
	return trait(subject);
}

export function is(other){
	return this === other;
}

export function isNot(other){
	return this !== other;
}

export function stringIsEmpty(){
	return typeof this !== 'string' || this.length === 0;
}

export function stringIsNotEmpty(){
	return typeof this === 'string' && this.length > 0;
}

export function stringStartsWith(other){
	return this.startsWith(other);
}

export function gt(other){
	return this > other;
}

export function gte(other){
	return this >= other;
}

export function lt(other){
	return this < other;
}

export function lte(other){
	return this <= other;
}

export function trimmed(subject){
	return subject.trim();
}

export function trimmedStart(subject){
	return subject.trimStart();
}

export function trimmedEnd(subject){
	return subject.trimEnd();
}

export function getTrue(){
	return true;
}

export function getFalse(){
	return false;
}

export function join(elements){
	return elements.join('');
}
  
export function isTrue(){
	return this === true;
}
export function isFalse(){
	return this === false;
}
