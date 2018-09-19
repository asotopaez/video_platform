'use strict';

module.exports = function(Topic) {
	Topic.validatesPresenceOf('chapter_id', {message: 'Relations cannot be blank'});
};
