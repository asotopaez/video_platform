'use strict';

module.exports = function(Video) {
	Video.validatesPresenceOf('topic_id', {message: 'Relations cannot be blank'});
};
