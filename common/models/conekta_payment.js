function CL_Payment(){
	var conekta;
	this.constructor = constructor;
	this.GenerateCharge = GenerateCharge;

	function GenerateCharge(oPayment, callBack){
		conekta.Order.create(oPayment,respond);

		function respond(err, res){
			if(err) callBack(err);
			else callBack(res);
		}
	}

	function constructor(oConekta){
		conekta = oConekta;
	}
}

module.exports.CL_Payment   = CL_Payment;