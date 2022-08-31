export default {
  "packages": [
    "base"
  ],
  "name": "ga",
  "entrypoint": "main.js",
  "umdName": "ga",
  "$type": "package definition",
  "dataTypes": [
    {
      "name": "product",
      "plural": "products",
      "sql": "select id from products",
      "properties": {
        "id": {
          "name": "id",
          "type": "string",
          "sql": "select item_id from products where id = :this",
          "title": "id"
        },
        "name": {
          "name": "name",
          "type": "string",
          "sql": "select item_name from products where id = :this",
          "title": "name"
        },
        "title": {
          "name": "title",
          "type": "string",
          "sql": "select item_name from products where id = :this",
          "title": "title"
        },
        "category": {
          "name": "category",
          "type": "string",
          "sql": "select item_category from products where id = :this",
          "title": "category"
        }
      },
      "isa": [
        "data item"
      ],
      "title": "product",
      "pattern": "product",
      "show": [
        "id",
        "name",
        "title",
        "category"
      ]
    },
    {
      "name": "category",
      "plural": "categories",
      "sql": "select distinct item_category from products",
      "properties": {
        "name": {
          "name": "name",
          "type": "string",
          "sql": "select :this",
          "title": "name"
        }
      },
      "isa": [
        "data item"
      ],
      "title": "category",
      "pattern": "category",
      "show": [
        "name"
      ]
    },
    {
      "name": "transaction",
      "plural": "transactions",
      "sql": "select extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64))) from transactions where transaction_id=:this",
      "properties": {
        "date": {
          "name": "date",
          "valueType": "date",
          "type": "json",
          "title": "date"
        },
        "label": {
          "name": "label",
          "valueType": "string",
          "sql": "select concat('transaction ',transaction_id,' from ', extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)))) from transactions where transaction_id = :this",
          "type": "json",
          "title": "label"
        },
        "timestamp": {
          "name": "timestamp",
          "valueType": "datetime",
          "sql": "select TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)) from transactions where transaction_id=:this",
          "type": "json",
          "title": "timestamp"
        }
      },
      "semantics": {
        "defaultOrderProperty": "timestamp",
        "labelProperty": "label",
        "dateProperty": "date"
      },
      "isa": [
        "data item",
        "type that has default order",
        "type that has date"
      ],
      "title": "transaction",
      "pattern": "transaction",
      "show": [
        "date",
        "label",
        "timestamp"
      ]
    }
  ],
  "expressions": [
    {
      "name": "the first",
      "title": "the first ...",
      "genericProperties": [
        "type"
      ],
      "pattern": "the first of all <<dataset>>",
      "valueType": "type that has default order",
      "args": [
        "dataset"
      ],
      "isa": [],
      "properties": {
        "dataset": {
          "name": "dataset",
          "type": {
            "$type": "template type",
            "template": "dataset<{{$parent.$spec.type}}>"
          },
          "title": "dataset"
        }
      },
      "show": []
    },
    {
      "name": "the last",
      "title": "the last ...",
      "genericProperties": [
        "type"
      ],
      "pattern": "the last of all <<dataset>>",
      "valueType": "type that has default order",
      "args": [
        "dataset"
      ],
      "isa": [],
      "properties": {
        "dataset": {
          "name": "dataset",
          "type": {
            "$type": "template type",
            "template": "dataset<{{$parent.$spec.type}}>"
          },
          "title": "dataset"
        }
      },
      "show": []
    },
    {
      "name": "product.id",
      "type": "string",
      "sql": "select item_id from products where id = :this",
      "title": "id",
      "pattern": "id",
      "valueType": "string",
      "isa": [
        "property.product"
      ]
    },
    {
      "name": "get product.id",
      "title": "id of a product",
      "valueType": "string",
      "pattern": "id of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "product",
          "placeholder": "product",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "product.name",
      "type": "string",
      "sql": "select item_name from products where id = :this",
      "title": "name",
      "pattern": "name",
      "valueType": "string",
      "isa": [
        "property.product"
      ]
    },
    {
      "name": "get product.name",
      "title": "name of a product",
      "valueType": "string",
      "pattern": "name of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "product",
          "placeholder": "product",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "product.title",
      "type": "string",
      "sql": "select item_name from products where id = :this",
      "title": "title",
      "pattern": "title",
      "valueType": "string",
      "isa": [
        "property.product"
      ]
    },
    {
      "name": "get product.title",
      "title": "title of a product",
      "valueType": "string",
      "pattern": "title of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "product",
          "placeholder": "product",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "product.category",
      "type": "string",
      "sql": "select item_category from products where id = :this",
      "title": "category",
      "pattern": "category",
      "valueType": "string",
      "isa": [
        "property.product"
      ]
    },
    {
      "name": "get product.category",
      "title": "category of a product",
      "valueType": "string",
      "pattern": "category of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "product",
          "placeholder": "product",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "products",
      "title": "products",
      "pattern": "products <<specifiers>>",
      "sql": "select id from products",
      "valueType": "dataset<product>",
      "args": [
        "specifiers"
      ],
      "isa": [],
      "properties": {
        "specifiers": {
          "name": "specifiers",
          "type": "specifier<product>*",
          "placeholder": "which products",
          "title": "specifiers"
        }
      },
      "show": []
    },
    {
      "name": "category.name",
      "type": "string",
      "sql": "select :this",
      "title": "name",
      "pattern": "name",
      "valueType": "string",
      "isa": [
        "property.category"
      ]
    },
    {
      "name": "get category.name",
      "title": "name of a category",
      "valueType": "string",
      "pattern": "name of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "category",
          "placeholder": "category",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "categories",
      "title": "categories",
      "pattern": "categories <<specifiers>>",
      "sql": "select distinct item_category from products",
      "valueType": "dataset<category>",
      "args": [
        "specifiers"
      ],
      "isa": [],
      "properties": {
        "specifiers": {
          "name": "specifiers",
          "type": "specifier<category>*",
          "placeholder": "which categories",
          "title": "specifiers"
        }
      },
      "show": []
    },
    {
      "name": "transaction.date",
      "title": "date",
      "pattern": "date",
      "isa": [
        "property.transaction"
      ]
    },
    {
      "name": "get transaction.date",
      "title": "date of a transaction",
      "pattern": "date of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "transaction",
          "placeholder": "transaction",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "transaction.label",
      "sql": "select concat('transaction ',transaction_id,' from ', extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)))) from transactions where transaction_id = :this",
      "title": "label",
      "pattern": "label",
      "isa": [
        "property.transaction"
      ]
    },
    {
      "name": "get transaction.label",
      "title": "label of a transaction",
      "pattern": "label of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "transaction",
          "placeholder": "transaction",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "transaction.timestamp",
      "sql": "select TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)) from transactions where transaction_id=:this",
      "title": "timestamp",
      "pattern": "timestamp",
      "isa": [
        "property.transaction"
      ]
    },
    {
      "name": "get transaction.timestamp",
      "title": "timestamp of a transaction",
      "pattern": "timestamp of <<subject>>",
      "isa": [
        "data item query"
      ],
      "properties": {
        "subject": {
          "type": "transaction",
          "placeholder": "transaction",
          "name": "subject",
          "title": "subject"
        }
      }
    },
    {
      "name": "transactions",
      "title": "transactions",
      "pattern": "transactions <<specifiers>>",
      "sql": "select extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64))) from transactions where transaction_id=:this",
      "valueType": "dataset<transaction>",
      "args": [
        "specifiers"
      ],
      "isa": [],
      "properties": {
        "specifiers": {
          "name": "specifiers",
          "type": "specifier<transaction>*",
          "placeholder": "which transactions",
          "title": "specifiers"
        }
      },
      "show": []
    }
  ],
  "categories": {
    "data query": [
      "data item query"
    ]
  },
  "types": [
    {
      "name": "specifier",
      "genericProperties": [
        "type"
      ],
      "title": "specifier",
      "pattern": "specifier",
      "isa": []
    },
    {
      "name": "between dates",
      "title": "between dates",
      "pattern": "between <<date>> and <<date>>",
      "isa": [
        "specifier<type that has date>"
      ]
    },
    {
      "name": "product",
      "plural": "products",
      "sql": "select id from products",
      "properties": {
        "id": {
          "name": "id",
          "type": "string",
          "sql": "select item_id from products where id = :this",
          "title": "id"
        },
        "name": {
          "name": "name",
          "type": "string",
          "sql": "select item_name from products where id = :this",
          "title": "name"
        },
        "title": {
          "name": "title",
          "type": "string",
          "sql": "select item_name from products where id = :this",
          "title": "title"
        },
        "category": {
          "name": "category",
          "type": "string",
          "sql": "select item_category from products where id = :this",
          "title": "category"
        }
      },
      "isa": [
        "data item"
      ],
      "title": "product",
      "pattern": "product",
      "show": [
        "id",
        "name",
        "title",
        "category"
      ]
    },
    {
      "name": "category",
      "plural": "categories",
      "sql": "select distinct item_category from products",
      "properties": {
        "name": {
          "name": "name",
          "type": "string",
          "sql": "select :this",
          "title": "name"
        }
      },
      "isa": [
        "data item"
      ],
      "title": "category",
      "pattern": "category",
      "show": [
        "name"
      ]
    },
    {
      "name": "transaction",
      "plural": "transactions",
      "sql": "select extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64))) from transactions where transaction_id=:this",
      "properties": {
        "date": {
          "name": "date",
          "valueType": "date",
          "type": "json",
          "title": "date"
        },
        "label": {
          "name": "label",
          "valueType": "string",
          "sql": "select concat('transaction ',transaction_id,' from ', extract(date from TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)))) from transactions where transaction_id = :this",
          "type": "json",
          "title": "label"
        },
        "timestamp": {
          "name": "timestamp",
          "valueType": "datetime",
          "sql": "select TIMESTAMP_SECONDS(CAST(CAST(event_timestamp as INT64)/1000000 as INT64)) from transactions where transaction_id=:this",
          "type": "json",
          "title": "timestamp"
        }
      },
      "semantics": {
        "defaultOrderProperty": "timestamp",
        "labelProperty": "label",
        "dateProperty": "date"
      },
      "isa": [
        "data item",
        "type that has default order",
        "type that has date"
      ],
      "title": "transaction",
      "pattern": "transaction",
      "show": [
        "date",
        "label",
        "timestamp"
      ]
    }
  ],
  "$files": [
    "index.js",
    "main.js",
    "query.js",
    "test.js",
    "tets.js"
  ]
}