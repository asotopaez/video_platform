'use strict';

module.exports = function(Subject) {
	Subject.validatesPresenceOf('grade_id', {message: 'Relations cannot be blank'});
};
