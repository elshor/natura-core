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
 * @param {Number} distance Distance to shake - distance to shake the element in pixels.
 * @param {Number} times Times to shake.
 * @param {Number} duration duration - duration of animation in milliseconds
 */
export function shake(element,direction='left',distance=20,times=3,duration=400){
	effect(element,'shake',{direction,distance,times},duration);
}

/**
 * Pulsate an element by showing and hidint an element several times pulsing it in and out
 * @natura action pulsate <<element>>
 * @title pulsate an element
 * @param {Element} element the element to pulsate
 * @param {Color} color color - set the color of the pulse
 * @param {Number} reach reach in px - how far the pulse goes in px
 * @param {Number} speed speed - how long one pulse takes in ms
 * @param {pause} pause pause ms - how long the pause between pulses is in ms
 * @param {Boolean$} glow glow - if the glow should be shown too
 * @param {Number} repeat - number of times to repeat the pulst
 * @param {Boolean$} onHover on hover - only repeat if user hovers over the element
 * @param {Number} duration duration - duration of animation in milliseconds
 */
export function pulsate(element,color,reach,speed,pause,glow,repeat,onHover,duration){
	effect(element,'pulsate',{color,reach,speed,pause,glow,repeat,onHover},duration);
}

/************************************************************************
 * General front-end events
 ************************************************************************/


/**
 * An element receives a click event when a pointing device button (such as a mouse's primary mouse button) is both pressed and released while the pointer is located inside the element.
 * @param {Element} element
 * @title click event
 * @natura event user clicks on <<element>>
 * @type MouseEvent
 */
export function onClick(element){
	this.registerEvent(element,'click',this.handler)
}

/**
 * The dblclick event fires when a pointing device button (such as a mouse's primary button) is double-clicked; that is, when it's rapidly clicked twice on a single element within a very short span of time.
 * @param {Element} element
 * @title double click event
 * @natura event user double clicks on  <<element>>
 * @type MouseEvent
 */
export function onDblclick(element){
	this.registerEvent(element,'dblclick',this.handler)
}

/**
 * The contextmenu event fires when the user attempts to open a context menu. This event is typically triggered by clicking the right mouse button, or by pressing the context menu key. In the latter case, the context menu is displayed at the bottom left of the focused element, unless the element is a tree, in which case the context menu is displayed at the bottom left of the current row.
 * @param {Element} element
 * @title context menu event
 * @natura event user opens context menu on <<element>>
 * @type MouseEvent
 */
export function onContextmenu(element){
	this.registerEvent(element,'contextmenu',this.handler)
}

/**
 * The mouseleave event is fired at an Element when the cursor of a pointing device (usually a mouse) is moved out of it.
 * @param {Element} element
 * @title mouse leave event
 * @natura event mouse leaves <<element>>
 * @type MouseEvent
 */
export function onMouseleave(element){
	this.registerEvent(element,'mouseleave',this.handler)
}

/**
 * mouse or other pointing device enters the element. This event can be use to visually signal when mouse is over an element.
 * @param {Element} element
 * @title mouse enter
 * @natura event mouse enters <<element>>
 * @type MouseEvent
 */
export function onMouseenter(element){
	this.registerEvent(element,'mouseenter',this.handler)
}

/**
 * @typedef {String|"Enter"|"Alt"|"AltGraph"|"CapsLock"|"Control"|"Fn"|"FnLock"|"Hyper"|"Meta"|"NumLock"|"ScrollLock"|"Shift"|"Super"|"SymbolLock"|"Enter"|"Tab"|"ArrowDown"|"ArrowLeft"|"ArrowRight"|"ArrowUp"|"End"|"Home"|"PageDown"|"PageUp"|"Backspace"|"Clear"} Key
 * @natura entity
 */

/**
 * @typedef KeyState
 * @natura entity
 * 
 */

 /**
	* @typedef ButtonNumber
	* @natura entity
	*/

	/**
	 * @natura trait is the main button
	 * @this ButtonNumber
	 */
function isMainButton(){
		return this === 0;
}
	
	/**
	 * The button is the auxillary button, usually the middle button or wheel button 
	 * @natura trait is the auxillary button
	 * @this ButtonNumber
	 */
function isAuxButton(){
	return this === 1;
}

	/**
	 * The button is the secondary button, usually the left button
	 * @natura trait is the secondary button
	 * @this ButtonNumber
	 */
function isSecondaryButton(){
		return this === 2;
}
	
	/**
	 * The button is the fourth button, usually the browser back button
	 * @natura trait is the fourth button
	 * @this ButtonNumber
	 */
function isFourthButton(){
	return this === 0;
}

	/**
	 * The pressed button is the fifth button, usually the browser forward button
	 * @natura trait is the fifth button
	 * @this ButtonNumber
	 */
	function isFifthButton(){
		return this === 0;
	}
	
	/**
 * @typedef MouseEvent
 * @natura entity
 * @property {KeyState} altKey - the alt key
 * @property {KeyState} ctrlKey - the control key
 * @property {KeyState} metaKey - the meta key
 * @property {KeyState} shiftKey - the shift key
 * @property {ButtonNumber} button - the pressed button
 * @property {Number} clientX - the client x coordinate - The X coordinate of the mouse pointer in local (DOM content) coordinates.
 * @property {Number} clientY - the client y coordinates - The Y coordinate of the mouse pointer in local (DOM content) coordinates.
 */

 /**
 * test if the key is pressed
 * @natura trait is pressed
 * @this KeyState
 */
 export function isPressed(){
	 return this;
 }

 /**
  * test if the key is not pressed
 * @natura trait is not pressed
 * @this KeyState
 */
export function isNotPressed(){
	return !this;
}

/**
 * 
 * @typedef InputEvent
 * @natura entity
 * @property {String} data the element data that changed
 * @property {String} target.value the new value
 */

/**
 * The input event fires when the value of an <input>, <select>, or <textarea> element has been changed. 
 * @param {Element} element
 * @natura event user updates <<element>>
 * @title input event
 * @type InputEvent
 */
export function onUpdate(element){
	this.registerEvent(element,'input',this.handler)
}

/**
 * @typedef {String} KeyCode the code of the physical key that caused the event
 * @natura entity
 */


/**
 * An event emitted with a keyboard event such as keyup and keydown
 * @typedef KeyboardEvent
 * @natura entity
 * @property {KeyState} altKey - {@readonly} the alt key
 * @property {KeyState} ctrlKey - the control key
 * @property {KeyState} metaKey - the meta key
 * @property {KeyState} shiftKey - the shift key
 * @property {Key} key - the key triggering the event - this is the character entered or the key type in case of special keys such as Enter and Esc
 * @property {KeyCode} code - the key code triggering the event - this represents the physical key code based on the keyboard layout used.
 * @property {*} element 	
 */


/**
 * User types a specific key in the element. This event is triggered when the keyup event is fired and the key is the specified key
 * @param {Key} key 
 * @param {Element} element
 * @type KeyboardEvent
 * @natura event user types <<key>> in <<element>>
 */
export function onType(key,element){
	this.registerEvent(element,'keyup',(event)=>{
		if(event.key === key){
			this.handler(event)
		}
	})
}

/**
 * The focus event fires when an element has received focus.
 * @param {Element} element
 * @natura event <<element>> is focused
 */
export function onFocus(element){
	this.registerEvent(element,'focus',this.handler)
}

/**
 * The blur event fires when an element has lost focus
 * @param {Element} element
 * @natura event <<element>>  is blurred'
 */
export function onBlur(element){
	this.registerEvent(element,'blur',this.handler)
}

/**
 * 
 * @param {any[]} objects object - list of objects to print to console
 * @title log message
 * @natura action log <<objects>>
 */
export function log(objects=[]){
	console['log'](...objects);
}

/**
 * Display an alert dialog with the concatenation of the specified text strings
 * @param {String[]} strings
 * @natura action alert <<strings>>
 * @title alert message
 */
export function alert(strings=[]){
	window.alert(strings.join(''));
}

/**
 * @memberof KeyboardEvent
 */
export function testFunction(){

}

/**
 * @typedef {"none"|"hidden"|"dotted"|"dashed"|"solid"|"double"|"groove"|"ridge"|"inset"|"outset"} BorderStyle
 * @natura entity
 */

 /**
	* @typedef {"black"|"silver"|"gray"|"white"|"maroon"|"red"|"purple"|"fuchsia"|"green"|"lime"|"olive"|"yellow"|"navy"|"blue"|"teal"|"aqua"|"orange"|"aliceblue"|"antiquewhite"|"aquamarine"|"azure"|"beige"|"bisque"|"blanchedalmond"|"blueviolet"|"brown"|"burlywood"|"cadetblue"|"chartreuse"|"chocolate"|"coral"|"cornflowerblue"|"cornsilk"|"crimson"|"cyan"|"darkblue"|"darkcyan"|"darkgoldenrod"|"darkgray"|"darkgreen"|"darkgrey"|"darkkhaki"|"darkmagenta"|"darkolivegreen"|"darkorange"|"darkorchid"|"darkred"|"darksalmon"|"darkseagreen"} Color
	* @natura entity
  */

 /**
	* @title width in pixels
	* @natura expression <<number>>px
	* @param {Number} number width defined as number of pixels
	* @returns {BorderWidth}
  */
 export function borderWidthInPixels(number){
	 return number + 'px'
 }

 /**
	* @typedef {String} Length
	* @natura entity
  */

/**
 * @natura expression <<r>> <<g>> <<b>> <<a>>
 * @param {Number} r red - a number between 0 and 255
 * @param {Number} g green - a number between 0 and 255
 * @param {Number} b blue - a number between 0 and 255
 * @param {Number} a transparency - a number between 0 and 1 where the number 1 corresponds to 100% (full opacity)
 * @returns {Color}
 */
export function rgbaColor(r,g,b,a){
	return `rgba(${[r,g,b,a].join(',')})`
}
/**
 * Define border properties, including width, style and color. Use this to specify all properties of the border in one statement.
 * @natura expression <<width>> <<style>> <<color>>
 * @title border properties
 * @param {BorderWidth} width
 * @param {BorderStyle} style
 * @param {Color} color
 * @returns {Border}
 */
export function border(width,style,color){
	return [width,style,color].join(' ');
}

/**
 * An html DOM element.
 * @typedef Element
 * @natura object
 * @property {String} value value - the value of an input element
 * @property {BorderStyle} style.borderStyle border style - Can be one of none, hidden, dotted, dashed, solid,double,groove, ridge inset, outset 
 * @property {Color} style.backgroundColor background color
 * @property {Color} style.color font color
 * @property {Color} style.borderColor border color
 * @property {BorderWidth} style.borderWidth border width
 * @property {Length} style.width width
 * @property {Border} style.border border
 * 
 */

/**
 * Returns the element with id
 * @param {String} id 
 * @returns {Element}
 * @natura expression element with id <<id>>
 */ 
export function elementWithId(id){
	return document.getElementById(id);
}

/**
 * Returns the first element matching the selector
 * @param {String} selector 
 * @returns {Element}
 * @natura expression element matching <<selector>>
 */
export function elementMatching(selector){
	return typeof selector === 'string'?document.querySelector(selector) : null;
}

/**
 * The document body element
 * @natura expression body
 * @returns {Element}
 */
export function body(){
	return document.body;
}