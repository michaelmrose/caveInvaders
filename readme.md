# MVP

## Tech to be used

-   JavaScript
-   CSS
-   HTML

## Basic Concept

Riffing off \"Space Invaders\" a simple game made of incredibly simple
pixel graphics where you spawn as a ship adjacent to a base in the heart
of a winding cave system much larger than your single screen view. Alien
invaders continually spawn at increasing speeds at random points towards
the periphery and an proceed immediately towards your home base. If they
reach your base they immediately explode ending the game. Score points
for each alien killed before you yourself bite the dust.

## Mechanics

Pathing is incredibly simplistic. Each alien proceed only up and down
not diagonally if it encounters a wall space it stops within 3 spaces of
the wall and fires it\'s weapon. It is only able to fire every so many
ticks. Each shot upon impacting the wall dissolves that wall space
impacted and each one touching turning it into traversable space. When
no wall is within 5 spaces it continues to advance until a wall is again
within 3 spaces.

If the player comes within a certain number of spaces of the alien it
will fire its weapon at the player. If another alien in the way it wont
fire.

The players weapon is much faster than the alien but does not destroy
walls thus the player is obligated to use the passages or the holes
drilled by aliens to traverse the map and destroy the aliens.

The player earns point for each alien destroyed until the aliens destroy
the base.

The internal tick of the game clock is bounded by the time taken for the
fastest item to travel one square for simplicity of collision detection.

### Speeds

-   Player movement 1 sq every 3 ticks 33

-   Alien movement 1 sq every 2 ticks 50

-   Player shot 1 sq per 1 tick 100

-   Alien shot 1 sq per 2 ticks 50

-   Time to recharge alien shot 9 ticks 9

-   Time to recharge player shot 3 ticks 33

    Overall clock set that players move around 1 sq per 1 second

## Representation

At game beginning a pixel art screen is shown with instructions. Last of
which is press space to start. Incredibly simple units are represented
by a singular block on the map of different colors. Empty Space: Black
Rock: Brown Player: Blue Base: Gold Alien: Dark Green Alien Shot: Bright
Green Player Shot: Yellow Destroyed Rock: Red
<https://www.pixilart.com/art/cave-invaders-sr2bb87eb57af81>
![](file:///usr/home/michael/org/roam/images/66c3bcea-faae-4dca-9bac-1286c9fd771f.png)

4px is one block visible screen is approx 50blocks by 50 blocks Map can
be arbitrarily large scrolling is accomplished by keeping the player in
the center of the screen and drawing a different part of the canvas at a
given time. Happenings off screen need to happen but only the blocks on
screen should be drawn essentially around 50x50 blocks or 2500 elements
around 30 frames per second. Ideally need to do 75,000 ops per second.

At Game End the screen flashes white and shows a pixel art end screen
with an ugly alien and your score.

## Controls

Directional keys: Move that direction at the speed provided Shift +
directional keys point ship in that direction space fire weapon

## Questions

-   How well will naively drawn JavaScript perform for this task?

## Risks/Roadblocks

-   Game turns out to be too complicated to implement within time-frame
-   Getting too bogged down in making extra items instead of focusing on
    MPV functionality
-   Javascript rendering isn\'t fast enough
-   

# Stretch Items

## [TODO]{.todo .TODO} Diagonal movement {#diagonal-movement}

## [TODO]{.todo .TODO} Pathing {#pathing}

Have aliens path through caves when it would be shorter than boring
through or semi randomly to add variety

## [TODO]{.todo .TODO} Have aliens spread out when multiple are in the same space {#have-aliens-spread-out-when-multiple-are-in-the-same-space}

## [TODO]{.todo .TODO} Have aliens decide whether to continue on or follow player semi intelligently/semi randomly {#have-aliens-decide-whether-to-continue-on-or-follow-player-semi-intelligentlysemi-randomly}

## [TODO]{.todo .TODO} Different types of aliens {#different-types-of-aliens}

-   large (2x2)bomb aliens that explode if the player gets within some
    number of spaces taking out a large amount of space. Rather than
    being instant this could be on a fuse allowing the player to dance
    around the perimeter and eliminate the alien and cause it to take
    out its fellows. Flash between green and white to indicate impending
    explosion. Speed 1 sq every 4 ticks/25
-   fast aliens that can\'t shoot or dig but move faster than the player
    1 sq per 2 ticks/50
-   slow large (2x2)pod aliens that can dig and shoot that turn into
    multiple regular aliens when shot.

## [TODO]{.todo .TODO} Life bar/hp {#life-barhp}

Instead of having shots kill have it remove hp with differing number of
hp per entity

## [TODO]{.todo .TODO} Powerups {#powerups}

-   Faster movement
-   Life restoration
-   Faster shooting

## [TODO]{.todo .TODO} Visibility Rules {#visibility-rules}

Don\'t show areas the player can\'t see to heighten tension

## [TODO]{.todo .TODO} Flash rocks between white and brown to indicate nearby rocks blown up {#flash-rocks-between-white-and-brown-to-indicate-nearby-rocks-blown-up}

## [TODO]{.todo .TODO} Aliens that blow up kill other nearby aliens {#aliens-that-blow-up-kill-other-nearby-aliens}

used to indicate a upcoming alien breakthrough

## [TODO]{.todo .TODO} Different alien weapons {#different-alien-weapons}

fast shot and digging weapon
