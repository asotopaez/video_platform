function CL_Plan(){
	var paypal;
	this.constructor = constructor;
	this.createPlans = createPlans;
	this.updatePlans = updatePlans;

	function createPlans(oPlans, callBack){
		paypal.billingPlan.create(oPlans,respond);

		function respond(err, res){
			if(err) callBack(err);
			else callBack(res);
		}
	}


	function updatePlans(idPlans,oPlans, callBack){
		paypal.billingPlan.get(idPlans, function (err, plan) {
			if(err){
				callBack(err);
			}else{
			  paypal.billingPlan.update(idPlans,oPlans, function(err, res) {
			    	if(err) callBack(err);
					else callBack(res);
			  });
			} 
		});
	}


	function constructor(oPaypal){
		paypal = oPaypal;
	}
}

module.exports.CL_Plan   = CL_Plan;