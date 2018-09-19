var conekta = require('conekta');

function CL_Conekta(dafaultName){
	var api_Key;
	var isProduccion = false;
	
	this.init = init;

	function init(){
		var key_test = "key_test";
		var key_release = "key_release";
		
		if(isProduccion) api_Key = key_release;
		else api_Key = key_test;
		conekta.api_key = api_Key;
		conekta.locale = 'es';
		conekta.api_version = '2.0.0';
		return conekta;
	}
}

module.exports.CL_Conekta   = CL_Conekta;
