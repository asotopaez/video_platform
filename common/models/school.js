'use strict';

module.exports = function(School) {
	School.validatesPresenceOf('zip_code_id', {message: 'Relations cannot be blank'});

};
