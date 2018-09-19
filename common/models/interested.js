'use strict';
var isEmail = require('isemail');
module.exports = function(Interested) {
	function emailValidator(err, done) {
	  var value = this.email;
	  if (value == null)
	    return;
	  if (typeof value !== 'string')
	    return err('string');
	  if (value === '') return;
	  if (!isEmail.validate(value))
	    return err('email');
	}

	Interested.validatesUniquenessOf('email', {message: 'Relations cannot be blank'});
	Interested.validate('email', emailValidator, {message: 'Must provide a valid email'});
};
