'use strict';

module.exports = function(Chapterstudentadvance) {
	Chapterstudentadvance.validatesPresenceOf('chapter_id','student_id', {message: 'Relations cannot be blank'});
};
