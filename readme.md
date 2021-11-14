# Natur Core
This package is used by Natura code for basic handling of Natura entities

## Using generics
In the specialized type: The following properties should be specified:
* $generic - The name of the generic type. When the `generateNewEntity` function is called, this property is copied to the new entity. When the code is generated, the code specified in the generic type `fn` property is called.
* $specialized - The specialized property values. When the `generateNewEntity` function is called, the properties in this object are copied to the new entity.