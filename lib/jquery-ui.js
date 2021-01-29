function effect(element,effectName,options,duration=20){
	return new Promise((resolve)=>{
		$(element).effect(effectName,options,duration,()=>resolve());
	})
}

/**
 * Shakes the element multiple times, vertically or horizontally.
 * @natura action shake <<element>>
 * @title shake an element
 * @param {Element} element the element to shake
 * @param {"left"|"right"|"up"|"down"} direction shake direction - A value of "left" or "right" will shake the element horizontally, and a value of "up" or "down" will shake the element vertically. The value specifies which direction the element should move along the axis for the first step of the effect.
 * @param {Number} distance Distance to shake.
 * @param {Number} times Times to shake.
 */
export function shake(element,direction='left',distance=20,times=3,duration=400){
	effect(element,'shake',{direction,distance,times},duration);
}

/**
 * Pulsate an element by showing and hidint an element several times pulsing it in and out
 * @natura action pulsate <<element>>
 * @title pulsate an element
 * @param {Element} element the element to pulsate
 */
export function pulsate(element){
	$(element).effect('pulsate');
}

/**
 * mouse or other pointing device enters the element. This event can be use to visually signal when mouse is over an element.
 * @param {Element} element
 * @title mouse enter
 * @natura event mouse enters <<element>>
 */
export function onMouseenter(element){
	this.registerEvent(element,'mouseenter',this.handler)
}
