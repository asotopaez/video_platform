function CL_Plan(){
	var conekta;
	this.constructor = constructor;
	this.createPlans = createPlans;
	this.updatePlans = updatePlans;
	this.deletePlans = deletePlans;

	function createPlans(oPlans, callBack){
		conekta.Plan.create(oPlans,respond);

		function respond(err, res){
			if(err) callBack(err);
			else callBack(res);
		}
	}


	function updatePlans(idPlans,oPlans, callBack){
		conekta.Plan.find(idPlans, function (err, plan) {
		  plan.update(oPlans, function(err, res) {
		    	if(err) callBack(err);
				else callBack(res);
		  });
		});
	}


	function deletePlans(idPlans, callBack){
		conekta.Plan.find(idPlans, function (err, plan) {
		  if (plan!=null){
			  plan.delete(function(err, res) {
			    	if(err) callBack(err);
					else callBack(res);
			  });
		  }else{
		  	callBack({"error":"No existe registro."});
		  }
		});
	}




	function constructor(oConekta){
		conekta = oConekta;
	}
}

module.exports.CL_Plan   = CL_Plan;