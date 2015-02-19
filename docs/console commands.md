Built-in commands
=================
Every command environment should implement the following commands according to this specification.

echo
----
Syntax: `echo <str> [args]`

Print `str` to the console. Replace any placeholders in the format `{n}`, where n is a non-negative integer,
with the n-th argument in args.

Params:

* str (string): A format string
* args (*,optional): arguments to insert into the format string. Values will automatically be converted to strings.

value
-----
Syntax: `value [-sv] <arg>`

Parse `arg` and print the result. Returns `arg`.

Params:

* arg (*): Any object
* -s: Silent. Do not print the value.
* -v: Verbose. Explicitly print the value. Overrides -s.

cvar
----
Syntax: `cvar create|delete|list|handle`

###create
Syntax: `cvar create <name> [-v value][-h handler]`

Create a new cvar with the name `name`. The value will be set to `undefined`.

Params:

* name (string): The name of the cvar.
* -v value (*): Assign value to the cvar.
* -h get set (func, func): Assign get as the getter and set as the setter functions for this cvar.

###delete
Syntax: `cvar delete [-G] <name>`

Delete the cvar `name`. This operation does not actually delete the value, it only unregisters the name.
Invokes the cvars getter and returns the result.

Params:

* name (string): The name of the cvar to delete.
* -G: Do not invoke the getter, returns undefined.

###list
Syntax: `cvar list [-s --silent] [-v --verbose]`

Print and return a list of all cvars as key-value pairs, one pair per line, seperated by spaces.
Returns an array of objects `{key:key, value:value}`.

Params:

* -s: Do not print the list.
* -v: Do print the list. Overrides -s.

###handle
Syntax: `cvar handle <name> <getter> <setter>`

Register the given handlers for the cvar `name`.

Params:

* name (string): The name of the cvar
* getter (func): The getter function. Will be invoked to get the cvar with no arguments.
* setter (func): The setter function. Will be invoked to set the cvar with the value as the only argument (`$1`)

throw
-----
Syntax: `throw <value>`

Throw `value` in javascript.

Params:

* value (*): The value to throw.

array
-----
Syntax: `array <values ...>`

Return an array of all the values.

Params:

* values (*,...): The values starting at index 0.

json
----
Syntax: `json <str> [reviver]`

Parse `str` as JSON and return the result.
If `str` is not valid JSON, an error will be thrown.

Params:

* str (string): A JSON string.
* reviver (func, optional): A reviver function. Will be called for each key-value pair with the arguments $1=key, $2=value

true
----
Returns `true`. No parameters.

false
----
Returns `false`. No parameters.

null
----
Returns `null`. No parameters.

undefined
----
Returns `undefined`. No parameters.
