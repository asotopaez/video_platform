'use strict';

module.exports = function(Subjectexamstudentadvance) {
	Subjectexamstudentadvance.validatesPresenceOf('subject_id','student_id', {message: 'Relations cannot be blank'});
};
