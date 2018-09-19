function CL_Suscription(){
	var conekta;
	this.constructor = constructor;
	this.createSuscriptionCardCustomer = createSuscriptionCardCustomer;
	this.updateSuscriptionCardCustomer = updateSuscriptionCardCustomer;
	this.pauseSuscriptionCardCustomer = pauseSuscriptionCardCustomer;
	this.resumeSuscriptionCardCustomer = resumeSuscriptionCardCustomer;
	this.cancelSuscriptionCardCustomer = cancelSuscriptionCardCustomer;

	function constructor(oConekta){
		conekta = oConekta;
	}



	function createSuscriptionCardCustomer(planCustomer,idCustomer,callBack){
		//console.log("params",planCustomer,idCustomer)
		//console.log("Cus",conekta.Customer)
		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			//console.log("1",err,customer)
			if(err) end(err);
			else customer.createSubscription({ plan: planCustomer },respond);
		}

		function respond(err, res){
			//console.log("2",err,res)
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function updateSuscriptionCardCustomer(planCustomer,CardCustomer,idCustomer,callBack){

		var updated = {}
		if (planCustomer){
			updated['plan'] =  planCustomer
		}
		if(CardCustomer){
			updated['card'] = CardCustomer
		}

		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.subscription.update(updated,respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function pauseSuscriptionCardCustomer(idCustomer,callBack){

		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.subscription.pause(respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function resumeSuscriptionCardCustomer(idCustomer,callBack){

		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.subscription.resume(respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function cancelSuscriptionCardCustomer(idCustomer,callBack){

		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.subscription.cancel(respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


}

module.exports.CL_Suscription  = CL_Suscription;