'use strict';
const nodemailer = require('nodemailer');
module.exports = function(Customerchargesconekta) {


	/*
		Authors: asotopaez@gmail.com
		Name: get_customer_data_conekta
		Description: 
	*/

	Customerchargesconekta.get_charges_data_conekta = function(data, cb) {
		//console.log(data)

		//Using nodemailer

	    // create reusable transporter object using the default SMTP transport
	    let transporter = nodemailer.createTransport({
    		host: 'smtp.zoho.eu',
    		port: 465,
    		secure: true, //ssl
    		auth: {
            	user:'asotopaez@gmail.com',
            	pass:'A14873603A',
            }
    	});
		 	
		if (data.type == 'charge.paid') {
		    //console.log(data)
		    // setup email data with unicode symbols
		    let mailOptions = {
		        from: '"Fred Foo 👻" <asotopaez@gmail.com>', // sender address
		        to: 'asotopaez@gmail.com', // list of receivers
		        subject: 'Pago comprobado ✔', // Subject line
		        text: 'Tu pago ha sido confirmado.', // plain text body
		        html: '<b>Muchas gracias</b>' // html body
		    };
		  /*
		  transporter.sendMail(mailOptions, function(error, info){
		  	  console.log(info)
		      if(error){ console.log(error); }
		    });
		  */
		  delete data['id']
		  Customerchargesconekta.create(data,function(err,results){
		  	cb(null,{})
		  });
		}else if(data.type == 'charge.created'){
		  delete data['id']
		  Customerchargesconekta.create(data,function(err,results){
		  	cb(null,{})
		  });
		}else{
			  Customerchargesconekta.create(data,function(err,results){
			  	cb(null,{})
			  });
			//console.log(data)
			cb(null,{})
		}
		
	}


	Customerchargesconekta.remoteMethod('get_charges_data_conekta', {
		  description: '',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



};
