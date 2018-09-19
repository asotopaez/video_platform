'use strict';

module.exports = function(Quiz) {
	Quiz.validatesPresenceOf('topic_id','type_of_exam_id', {message: 'Relations cannot be blank'});
};
