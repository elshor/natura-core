/**
 * Log to logger based on verbosity level. Can be one of error, warn, log, debug
 */
export default class Logger{
	constructor(logger, verbosity='error'){
		this.verbosity = verbosity;
		this.logger = logger;
	}
	error(...args){
		if(['error', 'warn', 'log', 'debug'].includes(this.verbosity)){
			this.logger.error(...args);
		}
	}
	warn(...args){
		if(['warn', 'log', 'debug'].includes(this.verbosity)){
			this.logger.warn(...args);
		}
	}
	log(...args){
		if(['log', 'debug'].includes(this.verbosity)){
			this.logger.log(...args);
		}
	}
	debug(...args){
		if([ 'debug'].includes(this.verbosity)){
			this.logger.debug(...args);
		}
	}
}