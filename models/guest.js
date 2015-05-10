var _ = require('underscore');

function Guest(op) {
    _.extend(this, op);
}

module.exports = Guest;
