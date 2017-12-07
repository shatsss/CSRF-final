var records = [
    {id: 1, username: 'jack', password: 'secret',  csrfSecret: ''}
    , {id: 2, username: 'abra', password: '1111',  csrfSecret: 'aaa'}
];

exports.addUser = function (id, username, password, csrfSecret) {
    var size = records.size
    records[size] = {id: id, username: username, password: password, displayName: displayName, csrfSecret: csrfSecret}
}
exports.findById = function (id, cb) {
    process.nextTick(function () {
        var idx = id - 1;
        if (records[idx]) {
            cb(null, records[idx]);
        } else {
            cb(new Error('User ' + id + ' does not exist'));
        }
    });
}

exports.findByUsername = function (username, cb) {
    process.nextTick(function () {
        for (var i = 0, len = records.length; i < len; i++) {
            var record = records[i];
            if (record.username === username) {
                return cb(null, record);
            }
        }
        return cb(null, null);
    });
}
