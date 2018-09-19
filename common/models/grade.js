'use strict';

module.exports = function(Grade) {
	Grade.validatesPresenceOf('level_id', {message: 'Relations cannot be blank'});
};
