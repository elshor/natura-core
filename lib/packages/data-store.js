"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
var entities = [{
  name: 'data store',
  description: 'Data Store is a package used to define all data sources in a project',
  show: ['data sources'],
  properties: {
    'data sources': {
      type: 'data source*',
      expanded: true
    }
  },
  register: function register(dictionary, _, spec) {
    (spec['data sources'] || []).forEach(function (source) {
      dictionary._registerType('a data source', source);
      //TODO change to registerInstance
    });
  }
}];
var _default = {
  name: 'data store',
  entities: {
    $type: 'entity definition group',
    members: entities,
    model: {
      isa: []
    }
  }
};
exports["default"] = _default;