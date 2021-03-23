/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume } from "./error.js"

export default function reference(label,valueType,path){
	assume(label,'label of reference must be specified');
	assume(valueType,'value type for reference must be specified');
	return {
		$type:'reference',
		label,
		valueType,
		path
	}
};