Command line System
===================
Version 1.0

1. Command lines
----------------
A command line is a string of commands and/or command blocks. When executed, the commands/blocks must be
executed in sequence.

If no return value is given, the value of the last command in the sequence must be returned.

2. Commands
-----------
A command is an instruction in the format `name args`.

`name` is a string of one or more characters.
The first character must be a letter, the rest can additionally be numbers, or the underscore.

`args` is a list of values, seperated by spaces (see 'Values').

When executed, the engine must first interpret the arguments, then lookup the command name,
then execute the assigned command with the given arguments.

The semicolon character is also a command, representing no operation.
Its intended purpose is to act as a delimiter between commands.

A command can optionally start with an 'arrow' (`->`) to act as a return statement.
When executed, the engine must assign the value returned by the command to the 'retval' variable in the current context.
Any remaining commands in the current sequence must be discarded, therefore popping the context.

3. Command blocks
-----------------
A command block is a sequence of commands inside round brackets (`()`). The execution context is pushed at the
beginning of the block and popped at the end.

If the context inside the block has a return value, that value is the return value of the block. Otherwise, the
return value of the last command in the sequence is the return value of the block.

4. Command contexts
-------------------
A command context, or execution context contains all variables specific to that context, including function parameters.
The context may be changed by command code.

5. Variables
------------
Variables are assigned by an instruction in the format `$name = value`.

`name` is a string of one or more characters.
The first character must be a letter, the rest can additionally be numbers, or the underscore.

`value` is a value after section 'Values'.

Variables must always be assigned to the inner most context, and the assigned value is only valid for that context.
When a context is popped, all its variables are no longer valid and should be discarded.

6. Values
---------
Values should immediately processed by the engine, meaning variable lookups and expression evaluation should not
be delayed.

###6.1 Variables###
Variables can be used as values by referencing them through their name preceded by a dollar sign (`$name`).
The referenced variable must be immediately looked up by the engine, starting in the inner most context.
If the referenced variable is not found, an error should be thrown.

###6.2 Strings###
A string of characters is evaluated as a String value, if

1. it contains only letters, or
2. it is surrounded by double quotation marks (`"`)

###6.3 Numbers###
A number is a set of decimal digits.
It may optionally:

* be preceded by a plus or minus sign
* be followed by a period and one or more additional decimal digits

A number string must be converted to a floating point number in evaluation.

###6.4 Functions###
A command function is a sequence of commands inside swirly brackets (`{}`).
The commands inside the function body may be evaluated, but must not be executed before execution of the function.

###6.5 Expressions###
An expression is one of

* a command line
* a logical operation
* an arithmetic operation
* a unary operation (logical or arithmetic negation)
* a value

inside square brackets (`[]`).

Logical operations take precedence over equality operations, which take precedence over additive operations, which
take precedence over multiplicative operations, which take precedence over unary operations.

7. Whitespaces and Comments
---------------------------
Whitespace, tabulator, line feed and carriage return characters, as well as comments can be placed around any token
in the command linen in any number of repetitions. These tokens are:

* all brackets
* 'arrows' (`->`)
* command names
* variable names and the assigment operator (`=`)
* values
* operators

Comments start and end with the pound character (`#`) and cannot contain this character.
Comments cannot start nor end inside string literals.

8. Command environments
-----------------------
The command environment must provide feedback options for commands, such as logging capabilities and context information.
