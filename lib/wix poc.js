/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
//package for wix poc

/**
 * Easing function options
 * @enum {Easing}
 * @natura options
 */
const xyz = {
	/**The interpolation starts slowly, and then progressively speeds up until the end, at which point it stops abruptly. This keyword represents the easing function cubic-bezier(0.42, 0.0, 1.0, 1.0). */
	'Ease In':'ease-in',
	/**The interpolation starts abruptly, and then progressively slows down towards the end. This keyword represents the easing function cubic-bezier(0.0, 0.0, 0.58, 1.0). */
	'Ease Out':'ease-out',
	/**The interpolation starts slowly, speeds up, and then slows down towards the end. This keyword represents the easing function cubic-bezier(0.42, 0.0, 0.58, 1.0). At the beginning, it behaves like the ease-in function; at the end, it is like the ease-out function. */
	"Ease In & Out":'ease-in-out',
	/**The interpolation is done at a constant rate from beginning to end. This keyword represents the easing function cubic-bezier(0.0, 0.0, 1.0, 1.0). */
	"Linear (None)":'linear',
	/**The interpolation starts slowly, accelerates sharply, and then slows gradually towards the end. This keyword represents the easing function cubic-bezier(0.25, 0.1, 0.25, 1.0). It is similar to ease-in-out, though it accelerates more sharply at the beginning. */
	"Ease":'ease'
}

/**
* description
* @typedef WixPoc
* @natura entity
* @property {Interactions$} interactions interactions - the list of interactions
**/

/**
* an editor x component
* @typedef Component
* @natura entity
* @temp component named {{ref}}
* @hat visibility show | show component in editor

/**
* an editor x button
* @typedef Button
* @natura entity
* @isa Component
* @temp button ({{ref}})
* @hat visibility show | show button in editor

/**
* description
* @typedef RichTextComponent
* @temp rich text component ({{ref}})
* @natura entity

**/
/**
* interactions script
* @typedef  Interactions
* @property {EventHandler$[]} handlers list of event handlers - put here list of events (hideName,expanded)
* @natura entity
**/

/**
* get notified by email automation
* @natura action send notification to <<email>>
* @title get notified by email
* @param {Text$} email to email - email to send notification to
* @param {Text$} title email title - email title to send
* @param {Richtext$} body body of message - the content of your email
**/
export function sendEmail(){

}
/**
* This event is triggered when the user hovers over a container
* @natura event user hovers over <<container>>
* @title hover over container
* @delete delete-interaction container
* @param {Container} container select container - when user hovers over this container then the action is triggered (emit:the container)
**/
export function hover(frame){

}

/**
* This event is triggered when the user clicks on a button
* @natura event user clicks on <<button>>
* @title click button
* @param {Button} button button to click - when the user clicks the button then the action is triggered
**/
export function clickButton(button){

}

/**
* animate children of the container. Each child component of the container can change at a different timing
* @natura action animate children of the container
* @action play_circle_outline play /location/parent/value/event/container/id | play the animation
* @title tranform children
* @inlineExpanded
* @param {ComponentTransformation$[]}  transformations placeholder - transformation of a component (expanded)
**/
export function transformChildren(){

}
/**
* hide a component
* @natura action hide <<component>>
* @title hide component
* @param {Component} component component to hide (pathOptions:/the container/children)
**/
export function hideComponent(){

}

/**
* component transformation
* @typedef  ComponentTransformation
* @natura entity  <<component>> from <<start>> sec. for <<duration>> sec. using <<easing>> function
* @change change-transformation /,/component,the container
* @delete delete-transformation /component,/the container
* @property {Component}  component component to transform - the component that is the child of the container to animate (pathOptions:/the container/children)
* @property {Number} duration duration - how long this transformation takes in seconds
* @property {Number} start start time - when to start this transformation defined in seconds from the event occurance
* @property {Easing$} easing easing function - easing function to use for this tranformation
* @property {Rotate$} rotate angle to rotate - a number representing the angle of the rotation. A positive angle denotes a clockwise rotation, a negative angle a counter-clockwise one.
* @property {Opacity$}  opacity alpha value - A number in the range 0.0 to 1.0, inclusive, representing the opacity of the channel (that is, the value of its alpha channel). Any value outside the interval, though valid, is clamped to the nearest limit in the range. 
* @property {Scale$}  scale scale - Scale defines a transformation that resizes an element on the 2D plane.
* @property {Skew$}  skew skew - The skew function is specified with either one or two values, which represent the amount of skewing to be applied in each direction. If you only specify one value it is used for the x-axis and there will be no skewing on the y-axis.
* @property {Translate$} translate trasnlate - Repositions an element in the horizontal and/or vertical directions.
**/

/*
* easing function
* @typedef {"Ease In"|"Ease In & Out"|"Ease Out"|"Linear (None)"} Easing
* @natura entity
**/

/**
* The opacity CSS property sets the opacity of an element. Opacity is the degree to which content behind an element is hidden, and is the opposite of transparency.
* @typedef {Number$} Opacity
* @natura entity
* @isa TransformationProperty
**/

/**
* The rotate property defines a transformation that rotates an element around a fixed point on the 2D plane, without deforming it.
* @typedef {Number$} Rotate
* @natura entity
* @isa TransformationProperty
**/

/**
* description
* @typedef Skew
* @natura entity x <<x>> y <<y>>
* @property {Number} x x angle - An angle representing the angle to use to distort the element along the x-axis (or abscissa).
* @property {Number} y y angle - the angle to use to distort the element along the y-axis (or ordinate). If not defined, its default value is 0, resulting in a purely horizontal skewing.
**/

/**
* description
* @typedef Scale
* @natura entity x: <<x>> y: <<y>>
* @property {Number} x x scale -     A number representing the abscissa of the scaling vector.
* @property {Number} y y scale -     A number representing the ordinate of the scaling vector. If not defined, its default value is same as x, resulting in a uniform scaling that preserves the element's aspect ratio.
**/

/**
* description
* @typedef Translate
* @natura entity x: <<x>> y: <<y>>
* @property {LengthPercentage$} x x translate - This value is a length or percentage representing the abscissa (horizontal, x-coordinate) of the translating vector. The ordinate (vertical, y-coordinate) of the translating vector will be set to 0. For example, translate(2px) is equivalent to translate(2px, 0). A percentage value refers to the width of the reference box defined by the transform-box property. 
* @property {LengthPercentage$} y y translate - This value describes two length or percentage values representing both the abscissa (x-coordinate) and the ordinate (y-coordinate) of the translating vector. A percentage as first value refers to the width, as second part to the height of the reference box defined by the transform-box property.
**/

/**
* description
* @typedef LengthPercentage
* @natura entity <<value>> <<type>>
* @property {Number$} value value of length
* @property {"px"|"%"}  type type of value

**/

