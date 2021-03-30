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
* change - action when entity changes - `@change event-name path-to-object,...?`. path-to-object can be a comma delimited list of paths.
* delete - action when entity is deleted - `@delete event-name path-to-object,...?`. path-to-object can be a comma delimited list of paths.
* create - action when new entity is created - `@create event-name path-to-object,...?`. path-to-object can be a comma delimited list of paths.
* hat - show icon on top of inline-value display. The format is `icon topic  path-to-objects?| description`. path-to-object can be a comma delimited list of paths
* action - show an action button at the end of inline-value display. When user clicks on the action then a message is sent. The format is `icon topic path-to-object?| description`. path-to-object can be a comma delimited list of paths.
* 

## property and param modifiers
* readonly
* expanded
* hideName
* required
* pathOptions - add options based on a path `pathOptions:path/of/options`
* emit - emit the property to context `emit:emit name`
* no insert - selection menu should not show insert option
* no cut - selection menu should not show cut option
* no paste - selection menu should not show paste option
* no copy - selection menu should not show copy option
## additiona topics
* using instance vs. type - $ at the end
* arrays - Type[] or Type$[] for non-instance array
* @returns {Type} the type (emit type with name the type)
* @returns {String} text - the string (emit text property of return value). Several returns are possible in single type definition
* entity can be defined on a function in which case the function is called for the entity object
* 