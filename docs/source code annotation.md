# Source Code Annotation Reference

This describes how to annotate source code so it can be turned into a natura package

## Tags
* natura
* title

## natura types
* event
* type
* expression
* trait
* action
* object

## additional tags
* isa
* title
* inlineExpanded
* change - action when entity changes - `@change event-name path-to-object,...?`
* delete - action when entity is deleted - `@delete event-name path-to-object,...?`
* create - action when new entity is created - `@create event-name path-to-object,...?`
* hat - show icon on top of inline-value display. The format is `icon topic | description`
* action - show an action button at the end of inline-value display. When user clicks on the action then a message is sent. The format is `icon topic | description`
* 

## property and param modifiers
* readonly
* expanded
* hideName
* required
* pathOptions:the path - add options based on a path
## additiona topics
* using instance vs. type - $ at the end
* arrays - Type[] or Type$[] for non-instance array
* @returns {Type} the type (emit type with name the type)
* @returns {String} text - the string (emit text property of return value). Several returns are possible in single type definition
* entity can be defined on a function in which case the function is called for the entity object
* 