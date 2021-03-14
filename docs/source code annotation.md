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

## property and param modifiers
* readonly
* expanded
* hideName
* required
## additiona topics
* using instance vs. type - $ at the end
* arrays - Type[] or Type$[] for non-instance array
* @returns {Type} the type (emit type with name the type)
* @returns {String} text - the string (emit text property of return value). Several returns are possible in single type definition
* entity can be defined on a function in which case the function is called for the entity object
* 