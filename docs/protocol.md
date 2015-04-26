- **KeepAlive** 0 num S<>C
- **PlayerData**
1 playerId type data S>C OR 1 data pktnr C>S
Types:
0 = welcome, 1 = position, 2 = connect, 3 = disconnect

- **Logon** 3 name C>S
- **Chat** Message 4 msg C<>S

###Entities

- **Spawn object from string** 10 id string S>C
- **Spawn entity by name** 11 id name meta S>C
- **Update entity by id** 12 id meta S>C
- **Kill entity by id** 13 id S>C
- **Spawn many** 14 list
list: array of {id,str/name,meta}

- **Game state** 20 state S>C

###RCON protocol
- **rcon status** 200 - C>S | msg S>C
- **rcon error** 201 msg S>C
- **rcon command** 202 str C>S
- **rcon query** 203 cvarname C>S
- **rcon cvar** 204 cvarname value S>C
- **rcon reversecmd** (sent by server, must not be questioned) 205 cmd S>C
- **rcon authorize** 206 password C>S
- **rcon queryall** 207 C>S
- **rcon consolemessage** 208 msg S>C

Important: messages are not encrypted! Do not reuse the rcon password
for things like email and stuff! Someone getting into your server
should not be a big deal, as you can easily restart it via ssh or whatever