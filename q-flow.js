var q = require('q');

/**
 * Call `fn`, which returns a promise, on each item in `array`.
 */
q.each = function (array, fn) {
    return array.reduce(function (promise, each) {
        return promise.then(function () {
            return fn(each);
        });
    }, q()).then(function () {
        // mask last value
    });
};

/**
 * Call `fn`, which returns a promise, on each item in `array`, returning new
 * array.
 */
q.map = function (array, fn) {
    var mappedArray = [];
    q.each(array, function (each) {
        return fn(each).then(function (item) {
            mappedArray.push(item);
        });
    }, q()).then(function () {
        return mappedArray;
    });
};

var find = function (array, fn, current) {
    return q.until(function () {
        return fn(array[current]).then(function (result) {
            if (result) {
                return array[current];
            }

            current += 1;
            if (current >= array.length) {
                return true; // break the loop
            }
        });
    });
};

/**
 * Find first object in `array` satisfying the condition returned by the
 * promise returned by `fn`.
 */
q.find = function (array, fn) {
    return find(array, fn, 0).then(function (result) {
        if (result === true) {
            return undefined;
        }

        return result;
    });
};

/**
 * Loop until the promise returned by `fn` returns a truthy value.
 */
q.until = function (fn) {
    return fn().then(function (result) {
        if (result) {
            return result;
        }

        return q.until(fn);
    });
};

/**
 * Allow one to place node-styled callback onto promise. This exits the promise
 * run-loop so that it no longer catches exceptions.
 */
q.makePromise.prototype.addBack = function (callback) {
    return this.then(function (result) {
        process.nextTick(function () {
            callback(null, result);
        });
    }, function (err) {
        process.nextTick(function () {
            callback(err);
        });
    });
};
