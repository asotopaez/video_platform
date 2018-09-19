'use strict';

module.exports = function(Accountplan) {



	var app = require('../../server/server');
	var ObjectID = require('mongodb').ObjectID;

	//---------------conekta-----------------//
	var conekta = require('./conekta_control');
	var plans_conekta = require('./conekta_plan');
	var conektaCL 	= new conekta.CL_Conekta();
	var oConekta = conektaCL.init();
	var oPlans_contekta = new plans_conekta.CL_Plan();
	oPlans_contekta.constructor(oConekta);



	//---------------paypal-----------------//
	var paypal = require('./paypal_control');
	var plans_paypal = require('./paypal_plan');
	var paypalCL 	= new paypal.CL_Paypal();
	var oPaypal = paypalCL.init();
	var oPlans_paypal = new plans_paypal.CL_Plan();
	oPlans_paypal.constructor(oPaypal);





	function createPlanConekta(ctx,cbres){
		var oPlan = {}
		oPlan = ctx.instance
		oPlans_contekta.createPlans(oPlan,respond);
		function respond(oResp){
			if(oResp.object == "error") cbres({error: oResp});
			else if(oResp._json != undefined){
				cbres({"msj":"CreatePlans - Sucess"});
			}
			else cbres({error: "CreatePlans - Error desconocido"});
		}
	}



	function createPlanPaypal(ctx,cbres){
		var oPlan = {
		    "description": ctx.instance['name'],
		    "merchant_preferences": {
		        "auto_bill_amount": "yes",
		        "cancel_url": "http://video_platform.mx/user/#!/guardianAccount",
		        "initial_fail_amount_action": "continue",
		        "max_fail_attempts": "1",
		        "return_url": "http://video_platform.mx/user/#!/guardianAccount",
		        "setup_fee": {
		            "currency": ctx.instance['currency'],
		            "value": ctx.instance['amount']/100
		        }
		    },
		    "name": ctx.instance['name'],
		    "payment_definitions": [
		        {
		            "amount": {
		                "currency": ctx.instance['currency'],
		                "value": ctx.instance['amount']/100
		            },
		            "charge_models": [
		                {
		                    "amount": {
		                        "currency": ctx.instance['currency'],
		                        "value": ctx.instance['amount']/100
		                    },
		                    "type": "SHIPPING"
		                }
		            ],
		            "cycles": "0",
		            "frequency": ctx.instance['interval'],
		            "frequency_interval": ctx.instance['interval_total_count'],
		            "name": ctx.instance['name'],
		            "type": "REGULAR"
		        }
		    ],
		    "type": "INFINITE"
		}

		oPlans_paypal.createPlans(oPlan,respond);
		function respond(oResp){
			//console.log(oResp)
			if(oResp.state=="CREATED"){
				var oPlanActivate = [
					    {
					        "op": "replace",
					        "path": "/",
					        "value": {
					            "state": "ACTIVE"
					        }
					    }
					];
				var idPlan = oResp.id
				oPlans_paypal.updatePlans(idPlan,oPlanActivate,respond);
		
				function respond(oResp2){
					if(oResp2.httpStatusCode!=200){
						cbres({"error":oResp2});
					}else{
						Accountplan.getDataSource().connector.connect(function(err, db) {
				        	var collection = db.collection('AccountPlan');
			            	collection.update({"_id":ObjectID(ctx.instance['id']) },{"$set":{ "paypal_plan_id" : idPlan}}, function(err, data) {
			            	});
			            });
						cbres({"msj":"UpdatePlans & CreatePlans - Sucess"});
					}
				}
				
			}else{
				cbres({"error":oResp});
			}
		}
	}



	function updatePlanConekta(ctx,cbres){
		var oPlan = {}
		var idPlan = ctx.instance['id']
		oPlan = ctx.instance
		delete oPlan['id']
		oPlans_contekta.updatePlans(idPlan,oPlan,respond);
		
		function respond(oResp){
			cbres({"msj":"UpdatePlans - Sucess"});
		}

	}

	function deletePlan(ctx,cbres){
		var oPlan = {}
		oPlan = ctx.where['id']
		oPlans_contekta.deletePlans(oPlan,respond);
		function respond(oResp){
			if(oResp.object == "error") cbres({error: oResp});
			else if(oResp._json != undefined){
				cbres({"msj":"DeletePlan - Sucess"});
			}
			else cbres({"error": "DeletePlan - Error desconocido"});
		}
	}

	// Create and Update Conekta Plans

	Accountplan.observe('after save', function(ctx, next){

	   if(ctx.isNewInstance){
		  createPlanConekta(ctx,function(response){
		  	//console.log(response)
		  });

		  createPlanPaypal(ctx,function(response){
		  	//console.log(response)
		  });

	   }else{
		  updatePlanConekta(ctx,function(response){
		  	//console.log(response)
		  });
	   }
	  next();
	});

	// Delete Conekta Plan

	Accountplan.observe('before delete', function(ctx, next){
	  deletePlan(ctx,function(response){
	  	//console.log(response)
	  });
	  next();
	});

	//--------------------------------------------//
	//-------------plan_number_students------------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: plan_number_students
		Description: Remote Method that find grade and school if it's update. 
	*/

	Accountplan.plan_number_students = function(data, cb) {
		var Student = app.models.Student;
		var CustomerUser = app.models.CustomerUser;
		Accountplan.find({where: {number_students: { "gt": 1 }}}, function(err, accountplandata){
			var results = []
			for (var i=0 ; i < accountplandata.length ; i++){
				results.push({"plan_id":accountplandata[i].id,"plan":accountplandata[i].name,"cantidad":"$"+String(accountplandata[i].amount/100)+" MXN"})
			}
			cb(null,results)
		});
	}


	Accountplan.remoteMethod('plan_number_students', {
		  description: 'count students',
	      accepts: {arg: 'data', type: 'object' , default: '{}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});
};
