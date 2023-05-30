/**
 * Log to logger based on verbosity level. Can be one of error, warn, log, debug
 */
export default class Logger{
	constructor(logger, verbosity='error'){
		this.verbosity = verbosity;
		this.logger = logger;
	}
	error(...args){
		if(['error', 'warn','info', 'log', 'debug'].includes(this.verbosity)){
			this.logger.error(...args);
		}
	}
	warn(...args){
		if(['warn','info', 'log', 'debug'].includes(this.verbosity)){
			this.logger.warn(...args);
		}
	}
	log(...args){
		if(['log','info', 'debug'].includes(this.verbosity)){
			this.logger.log(...args);
		}
	}
	info(...args){
		if(['log', 'debug','info'].includes(this.verbosity)){
			this.logger.info(...args);
		}
	}
	debug(...args){
		if([ 'debug'].includes(this.verbosity)){
			this.logger.debug(...args);
		}
	}
}