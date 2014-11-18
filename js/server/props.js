define(['ocl', 'arena', 'SeXHR'], function (ocl, arena, Sexhr) {
    var propList = {},
        // Functions
        clone, load, getProp;

    clone = function (obj) {
        /// <summary>Makes an instance copy of an object by calling 
        /// the constructor and copying properties recursively.</summary>
        if (obj === null || typeof (obj) !== 'object')
            return obj;

        if (typeof obj.clone === 'function') {
            return obj.clone();
        }

        var temp = new obj.constructor();

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                temp[key] = clone(obj[key]);
            }
        }
        return temp;
    };

    load = function (name, cb) {
        if (propList[name] === undefined) {
            new Sexhr().req({
                url: arena.propDir + name + ".json",
                done: function (err, res) {
                    if (err) { throw err; }
                    ocl.load(res.text, function (prop) {
                        propList[name] = prop;
                        cb(getProp(name));
                    });
                }
            });
        } else {
            // Make sure the call is delayed
            setTimeout(cb(getProp(name)), 1);
        }
    };

    getProp = function (name) {
        return clone(propList[name]);
    };

    return {
        load: load,
        get: getProp
    };
});