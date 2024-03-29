/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
export default {
	"_id": "public:interact@dev",
	"_rev": "7-0179ff6779bb7deab1e461748fe44d22",
	"packages": ["base"],
	"name": "interact",
	"entrypoint": "umd.js",
	"umdName": "interact",
	"$type": "package definition",
	"types": [{
		"name": "notebook",
		"properties": {
			"interactions": {
				"name": "interactions",
				"type": "interaction*",
				"title": "interactions"
			}
		},
		"title": "notebook",
		"isa": [],
		"show": ["interactions"]
	}, {
		"name": "interaction",
		"pattern": "<<action>>",
		"properties": {
			"action": {
				"name": "action",
				"type": "action",
				"placeholder": "How can I help",
				"title": "action"
			}
		},
		"title": "interaction",
		"isa": [],
		"show": []
	},{
		"name":"test template",
		"properties":{
			"a":{type:'xyz'},
			"b":{
				type:{
					$type:'template type',
					template:'{{$parent.a.$type}}'
				}
			},
			"c":{
				type:{
					$type:'template type',
					template:'{{$parent.a.$type}}*'
				}
			}
		}
	}],
	"actions": [{
		"name": "show chart",
		"title": "show a chart",
		"pattern": "show <<def>>",
		"args": ["def"],
		"isa": ["action"],
		"valueType": "show chart",
		"properties": {
			"def": {
				"name": "def",
				"type": {
					"$type": "role type",
					"type": "chart definition",
					"role": "type"
				},
				"placeholder": "chart definition",
				"title": "def"
			}
		},
		"show": []
	}],
	"$files": [],
	"tag": "dev",
	"$updated": "2022-07-24T19:26:42.238Z",
	"$owner": "auth0|61c8c14378b4bd006ac64602"
}