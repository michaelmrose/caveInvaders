// let R = require("ramda");
/* need a Game and Entity class if I can't figure out how to more completely separate these pass game to entity
 or call static methods on Game if it doesn't need specific parameters. Different types of entities will subclass Entity
 Entity will include player, aliens, shots fired, solid objects, possible subclasses include enemy, wall, bullet, player
 Each entity will have a render method which will draw it on the canvas, a destroy method which will remove it 
 from the list of active entities. An onCollision method which shall desribe how it response to a collision which 
 may in turn call the destroy method if need be. 

 There shall be a board component OR a board class that describing a grid of positions aprox 60x45 "blocks" 
 aprox 2700 represented as a 2D array each representing a row.  When an entity moves into a space what it 
 will do is write a reference to itself to the board.
 
 Each entity that moves will not deliberately move into a position that is occupied by any other entity.  If it does try 
 to do so it will end up calling onCollsion with the  pre-existing entity as an argument. The simplest thing to do is 
 probably initially just destroy both either on pre-existing square or by destroying first the item at the square then 
 moving into the square and being destroyed in turn. Updates shall be processed sequentally starting with the player, 
 so that logic remains consistent. Eg a missile advances nothing is in that space so nothing further happens. Then 
 the player is advanced by virtue of having pressed an arrow key and finds itself moving to the same space as the 
 missile. The missile is destoryed. The player is moved into the position formerly occupied by the missile and is 
 destroyed. The game end logic happens.

As soon as all logic happens everything is rendered by calling render on the background and then all entities.

Control of player happens by plugging actions into a buffer to be evaluated next tick to be evaluated in turn. 
Notably hitting up 17 times really fast doesn't mean the player can move further or fire faster  in one turn. 
They should be asyncstuffed into the buffer and emptied each tick. If direction exists move in the first direction hit
If space exists fire, if escape exists pause at beginning of tick.
 */
