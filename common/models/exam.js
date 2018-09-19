'use strict';

module.exports = function(Exam) {
	Exam.validatesPresenceOf('subject_id','type_of_exam_id', {message: 'Relations cannot be blank'});
};
