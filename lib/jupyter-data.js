/**
 * Jupyter script with list of actions. This is a simulation of jupyter actions as would be used within Jupyter notebook
* @typedef JupyterScript
* @natura object
* @property {Action$[]} action specify action to perform (expanded)
**/

/**
* Load data from an external source such as cvs file, sql database or HTML page.
* @natura action load <<sourceDef>>
* @title load data
* @param {SourceDef} sourceDef select data to load - Specify the data source to load into this notebook
* @returns {DataFrame} the data frame 
**/
export function loadData(sourceDef){

}

/**
* show some data or widget in the notebook in the following cell
* @natura action show <<viewerDef>>
* @title show data
* @param {ViewerDef} viewerDef widget or data to show - specify what should be shown in the next cell
* 
**/
export function show(viewerDef){

}

/**
* Specify the web page to load and specification of how to transform the web page to a data frame
* @natura expression html page <<io>>
* @title HTML source
* @param {String}  io url - Specify the url of the web page to load
* @returns {SourceDef}
**/
export function webPageDataSource(){

}

/**
* Read a comma-separated values (csv) file into DataFrame.
* @natura expression csv file <<filepath_or_buffer>>
* @title csv file
* @param {String} filepath_or_buffer file path - Specify the file path of the csv file
* @returns {SourceDef}
**/
export function csvDataSource(){

}

export function sqlSource(){

}

/**
* This is a mock organization table. All users within the organization can choose organization specific data based on their permissions
* @natura expression organization pro users
* @title 

* @returns {SourceDef}
**/
export function orgUserTable(){

}


export function orgWebEventsTable(){

}

export function loadTextSource(){

}

/**
* name a dataframe so it can later be referenced by this name
* @natura action name <<dataFrame>> <<name>>
* @title name a data frame
* @param {DataFrame} dataFrame the data frame to name - select the data frame you want to name. For the last data frame simply select "the data frame"
* @param {String}  name name of data frame - set the name to use when referencing this data frame
* @returns {DataFrame} the data frame named {{name}}
**/
export function nameIt(dataFrame,name){

}

/**
* Show first n rows of a data frame
* @natura expression first <<n>> rows of <<frame>>
* @title first rows
* @param {Number} n number of rows - number of rows to show
* @param {DataFrame} frame data frame to show
* @returns {viewerDef}
**/
export function firstRows(){

}

/**
* Show first n rows of a data frame
* @natura expression last <<n>> rows of <<frame>>
* @title last rows
* @param {Number} n number of rows - number of rows to show
* @param {DataFrame} frame data frame to show
* @returns {viewerDef}
**/
export function lastRows(){

}

/**
* Show a sequence of rows
* @natura expression rows <<start>> to <<end>>
* @title last rows
* @param {Number} start first row to show - the first row to show using 0 based index
* @param {Number} end end row - the end index of the sequence - this is <b>not shown</b>
* @param {DataFrame} frame data frame to show
* @returns {viewerDef}
**/
export function rowSequence(){

}

/**
* show a bar chart of a data frame
* @natura expression bar chart of <<frame>>
* @title bar chart
* @param {DataFrame} frame the data frame to show
* @param {Column} x x axis - select the column to show on the x axis
* @param {Column} y y axis - select the column to show on the y axis
* @returns {ViewerDef}
**/
export function barChart(){
	
}

/**
* show a heat map of a data frame
* @natura expression heat map of <<frame>>
* @title heat map
* @param {DataFrame} frame the data frame to show
* @param {Column} x x axis - select the column to show on the x axis
* @param {Column} y y axis - select the column to show on the y axis
* @param {Column} color color value - select the column to represent the color on the heat map
* @returns {ViewerDef}
**/
export function heatMap(){
	
}

/**
* show an organization predefined plot. For example, this can be predefined to show a graph of weekly active users
* @natura expression weekly active users
* @title weekly active users
* @returns {ViewerDef}
**/
export function predefinedViewer(){

}
/**
 * This is a mock list of columns. In actual system it will be derived from actual data in notebook
 * @typedef {"Year"|"Rank"|"Company"|"Revenue (in millions)"|"Profit (in millions)"} Column
 * @natura entity
 */

 /**
 * Simple display first rows of the last data frame. This is a short name for show first 5 rows of the data frame
 * @natura action show head of last data frame
 * @title show head of last data frame
 **/
export function head(){

 }

  /**
 * Simple display last rows of the last data frame. This is a short name for show last 5 rows of the data frame
 * @natura action tail last data frame
 * @title show tail of last data frame
 **/
export function tail(){
}

/**
* filter out rows where at least one of the specified conditions is true
* @natura action filter out rows in <<frame>> matching:
* @title filter out rows
* @inlineExpanded
* @param {DataFrame}  frame data frame - data frame to filter
* @param {RowCondition$[]} conditions select row condition - specify the conditions where any row matching at least one condition will be filtered out of the data frame (expanded,hideName)
**/
export function filterOut(){

}

/**
* conditions applied to rows, referencing fields of the row
* @typedef RowCondition
* @natura entity <<column>> <<trait>>
* @property {Column$} column the column to test - specify the column you would like to evaluate
* @property {trait.column$}  trait trait of the field 
* @title condition to test for
**/

/**
 * @natura trait is <<mood>>
 * @this Column
 * @title is ...
 */
export function isMood(){

}

/**
 * @natura trait is not <<mood>>
 * @this Column
 * @title is not ...
 */
export function isNotMood(){

}

/**
 * @typedef {"happy"|"sad"|"angry"} Mood
 * @natura entity
 */

 /**
  * @typedef Email
  * @natura entity
  * @isa string
  */

 /**
  * @natura action print <<objects>>
  * @title print to cell output
  * @param {any[]} objects object - Any object, and as many as you like. Will be converted to string before printed
  * @param {String$} sep separator text - Optional. Specify how to separate the objects, if there is more than one. Default is ' '
  * @param {String$} end end text - Optional. Specify what to print at the end. Default is '\n' (line feed)
  * @param {Boolean$} flush Optional. A Boolean, specifying if the output is flushed (True) or buffered (False). Default is False
  */
 export function print(objects,sep,end,flush){

 }


 /**
 * the recently created plot
 * @natura expression the plot
 * @title the plot
 * @returns {HTMLEntity}
  **/
 export function thePlot(){

 }

 /**
  * @natura action send <<attachment>> to <<to>>
  * @param {String$} to recipient email - email of the mail recipient
  * @param {String} subject subject of the mail
  * @param {HTMLEntity} attachment the file to send
  * @param {Richtext} body mail body - the body of the mail to send.
  */
 export function sendMail(to,subject,attachment,body){

 }


 /**
 * description
 * @natura expression scatter plot of <<data>>
 * @title scatter plot
 * @param {DataFrame} data the data - specify the data frame to plot
 * @param {Column} x x data column - The column name to be used as horizontal coordinates for each point.
 * @param {Column} y y data column - he column name to be used as vertical coordinates for each point.
 * @returns {ViewerDef}
 **/
 export function scatterPlot(data,x,y,title){

 }

 /**
 * the recently created data frame
 * @natura expression the data frame
 * @title the data frame
 * @returns {DataFrame}
 **/
 export function theDataFrame(){

 }
/**
* description
* @typedef {"fail whole operataion"|"ignore"|"set to NaN"} OnNUmericError
* @natura entity

**/

 /**
 * convert data type of a column to number
 * @natura action convert column <<column>> to numeric
 * @title convert column to numeric
 * @param {Column}  column column name
 * @param {OnNUmericError}  whenCannotConvert what to do if cannot convert - specify the behavior when failed to convert a field
 **/
 export function convertColumn(){

 }