# Normalization report

# Empire

## Skirmishers

Special text: **Skirmishers.** Skirmisher stands are not deployed as independent units. Instead, any infantry unit apart from Flagellants may add one stand of Skirmishers. This brings the size of the unit to 4 stands - 3 regular stands plus the Skirmisher stand. Skirmishers always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Skirmisher casualties never count for Command penalties. Skirmisher stands never cause the parent unit to be in Irregular Formation no matter how they are placed.

Overrides:

- `category` set to "upgrade"
- `points` set to null
- `upgradePoints` set to 20

```json
{
  "specialName": "Skirmishers",
  "eligibleToUpgrade": [
    "empire:halberdiers",
    "empire:crossbowmen",
    "empire:handgunners"
  ],
  "specials": [
    "Skirmisher stands are not deployed as independent units. Instead, any infantry unit apart from Flagellants may add one stand of Skirmishers. This brings the size of the unit to 4 stands - 3 regular stands plus the Skirmisher stand. Skirmishers always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Skirmisher casualties never count for Command penalties. Skirmisher stands never cause the parent unit to be in Irregular Formation no matter how they are placed."
  ],
  "notes": null
}
```

## Steam Tank

Special text: **Steam Tank.** The Steam Tank forms a unit on its own, it moves up to 20cm, and must be given its own orders. The Steam Tank cannot be given a brigade order with other units, not even with other Steams Tanks. A character cannot join with a Steam Tank. A Steam Tank has 360° vision - i.e. it can draw line of sight from all edges of its stand for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy. Steam Tank shooting attacks have a range of 30cm. A Steam Tank therefore shoots to its front, side or rear against the closest enemy target. Count enemy armour values as one worse than normal when shot by a Steam Tank. So, for example, an armour value of 3+ counts as 4+, 5+ counts as 6+, and 6+ can‘t save against a Steam Tank. A Steam Tank can shoot at charging enemy. Because of its exceptionally heavy armour plating, a Steam Tank always counts as defended - so a 5 or 6 is normally required to inflict a hit from shooting or in combat. The Steam Tank fights combat like any other unit. Steam Tanks cannot be driven back or routed by shooting. If the player attempts to issue an order to a Steam Tank and rolls double six then the order is failed as usual and the machine does not move. Ignore the usual Blunder chart for Heroes and Wizards. Roll on the following Malfunction chart. Note that although a General cannot blunder he must still roll for malfunctions. 1. Destroyed. The Steam Tank grinds to a halt rupturing steam and noxious gasses. Remove the Steam Tank as a casualty. 2. Broken Down. The Steam Tank‘s drive has broken. It does not move further this turn and cannot move in future turns. Should it be obliged to move for any reason it is destroyed. Otherwise, the Steam Tank can continue to shoot and fight as normal. 3. Stuck. The Steam tank does not move further this turn. It cannot shoot this turn. Otherwise it is unaffected and can move in future turns as normal. 4. Commander Slain. The Steam Tank does not move further this turn. It can move in future turns but suffers a command penalty of -1 for the remainder of the game. The Steam Tank can shoot as normal. 5. Momentary Halt. The Steam Tank cannot move further this turn but is otherwise unaffected. 6. Steam Overload. The Steam Tank cannot move further this turn but can shoot with double the usual number of Attacks (6) to represent steam being uncontrollably diverted into weaponry.

Overrides:

- `speed` set to 20
- `halfPace` set to 10

```json
{
  "specialName": "Steam Tank",
  "eligibleToUpgrade": [],
  "specials": [
    "The Steam Tank cannot be given a brigade order with other units, not even with other Steams Tanks. A character cannot join with a Steam Tank. A Steam Tank has 360° vision - i.e. it can draw line of sight from all edges of its stand for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy. Steam Tank shooting attacks have a range of 30cm. A Steam Tank therefore shoots to its front, side or rear against the closest enemy target. Count enemy armour values as one worse than normal when shot by a Steam Tank. So, for example, an armour value of 3+ counts as 4+, 5+ counts as 6+, and 6+ can‘t save against a Steam Tank. A Steam Tank can shoot at charging enemy. Because of its exceptionally heavy armour plating, a Steam Tank always counts as defended - so a 5 or 6 is normally required to inflict a hit from shooting or in combat. The Steam Tank fights combat like any other unit. Steam Tanks cannot be driven back or routed by shooting. If the player attempts to issue an order to a Steam Tank and rolls double six then the order is failed as usual and the machine does not move. Ignore the usual Blunder chart for Heroes and Wizards. Roll on the following Malfunction chart. Note that although a General cannot blunder he must still roll for malfunctions. 1. Destroyed. The Steam Tank grinds to a halt rupturing steam and noxious gasses. Remove the Steam Tank as a casualty. 2. Broken Down. The Steam Tank‘s drive has broken. It does not move further this turn and cannot move in future turns. Should it be obliged to move for any reason it is destroyed. Otherwise, the Steam Tank can continue to shoot and fight as normal. 3. Stuck. The Steam tank does not move further this turn. It cannot shoot this turn. Otherwise it is unaffected and can move in future turns as normal. 4. Commander Slain. The Steam Tank does not move further this turn. It can move in future turns but suffers a command penalty of -1 for the remainder of the game. The Steam Tank can shoot as normal. 5. Momentary Halt. The Steam Tank cannot move further this turn but is otherwise unaffected. 6. Steam Overload. The Steam Tank cannot move further this turn but can shoot with double the usual number of Attacks (6) to represent steam being uncontrollably diverted into weaponry."
  ],
  "notes": "The Steam Tank forms a unit on its own, it moves up to 20cm, and must be given its own orders."
}
```

## Griffon

Special text: **Griffons.** Generals, Wizards and Heroes can ride Griffons. The Griffon can fly increasing its rider‘s Movement from 60cm to 100cm. It adds +2 Attacks to those of its rider. A unit that includes a Griffon rider causes terror in its enemies (and one might imagine a great deal of nervousness amongst its own ranks).

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Griffons",
  "eligibleToUpgrade": [
    "empire:general",
    "empire:hero",
    "empire:wizard"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride Griffons. It adds +2 Attacks to those of its rider. A unit that includes a Griffon rider causes terror in its enemies (and one might imagine a great deal of nervousness amongst its own ranks)."
  ],
  "notes": "The Griffon can fly increasing its rider‘s Movement from 60cm to 100cm."
}
```

## War Altar

Special text: **War Altar.** A Wizard may be mounted on a War Altar. A Wizard with a War Altar suffers a movement reduction to 30cm. The army can only ever include one War Altar, and it can only be included if there is at least 1 unit of Flagellants in the army. The War Altar adds +2 attacks to the Wizard and can be used to add +1 to the Wizard‘s dice roll to cast a spell once per battle. The player must announce that the War Altar‘s spell bonus is being used before rolling the dice to determine if the spell is cast.

Overrides:

- `speed` set to 30
- `maxPerArmy` set to true
- `requiresUnit` set to {"unitId":"empire:flagellants","min":1}

```json
{
  "specialName": "War Altar",
  "eligibleToUpgrade": [
    "empire:wizard"
  ],
  "specials": [
    "A Wizard may be mounted on a War Altar. The army can only ever include one War Altar, and it can only be included if there is at least 1 unit of Flagellants in the army. The War Altar adds +2 attacks to the Wizard and can be used to add +1 to the Wizard‘s dice roll to cast a spell once per battle. The player must announce that the War Altar‘s spell bonus is being used before rolling the dice to determine if the spell is cast."
  ],
  "notes": "A Wizard with a War Altar suffers a movement reduction to 30cm."
}
```

# Tomb Kings

## Carrion

Special text: **Carrion.** Carrion can fly. Note that Carrion can always return to a character by homing back at the start of the Command phase.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Carrion",
  "eligibleToUpgrade": [],
  "specials": [
    "Note that Carrion can always return to a character by homing back at the start of the Command phase."
  ],
  "notes": "Carrion can fly."
}
```

## Zombie Dragon

Special text: **Zombie Dragon.** A Tomb King or Liche Priest can ride a Zombie Dragon. A Dragon can fly increasing its rider‘s move from 60 to 100cm and it adds +3 Attacks to those of its rider. Zombie Dragons have a special shooting attack - they can belch corrosive breath! This attack can only be used if the Dragon- riding character has joined a unit but is not engaged in combat. A character that has not joined a unit cannot use the Breath attack. The corrosive breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Zombie Dragon is a terrifying creature - a unit that has been joined by a Dragon-riding character causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Zombie Dragon",
  "eligibleToUpgrade": [
    "tomb-kings:liche-priest",
    "tomb-kings:tomb-king"
  ],
  "specials": [
    "A Tomb King or Liche Priest can ride a Zombie Dragon. Zombie Dragons have a special shooting attack - they can belch corrosive breath! This attack can only be used if the Dragon- riding character has joined a unit but is not engaged in combat. A character that has not joined a unit cannot use the Breath attack. The corrosive breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Zombie Dragon is a terrifying creature - a unit that has been joined by a Dragon-riding character causes terror in its enemies."
  ],
  "notes": "A Dragon can fly increasing its rider‘s move from 60 to 100cm and it adds +3 Attacks to those of its rider."
}
```

## Liche Chariot

Special text: **Liche Chariot.** A Tomb King or Liche Priest can ride a chariot. A character riding a chariot adds +1 to his Attacks.

```json
{
  "specialName": "Liche Chariot",
  "eligibleToUpgrade": [
    "tomb-kings:liche-priest",
    "tomb-kings:tomb-king"
  ],
  "specials": [
    "A Tomb King or Liche Priest can ride a chariot. A character riding a chariot adds +1 to his Attacks."
  ],
  "notes": null
}
```

# Chaos

## Harpies

Special text: **Harpies.** Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly. A unit of harpies cannot be joined by a character.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10
- `facing` set to "long"

```json
{
  "specialName": "Harpies",
  "eligibleToUpgrade": [],
  "specials": [
    "A unit of harpies cannot be joined by a character."
  ],
  "notes": "Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly."
}
```

## Chaos Dragon

Special text: **Chaos Dragon.** Generals, Wizards and Heroes can ride a Chaos Dragon. The Chaos Dragon can fly, increasing the rider‘s move from 60 to 100cm, and it adds +3 Attacks to those of its rider. In addition the Dragon has a special shooting attack. It can breathe fire. This special attack can only be used if the rider has joined a unit and is not engaged in combat. A rider that has not joined a unit cannot use the Dragon‘s fiery breath to attack. The Dragon‘s fire breath works as follows. The fire breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Chaos Dragon is a large terrifying creature. A unit that has been joined by a Chaos Dragon causes terror in its enemies and therefore imposes the usual Combat penalty.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Chaos Dragon",
  "eligibleToUpgrade": [
    "chaos:general",
    "chaos:hero",
    "chaos:sorcerer"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride a Chaos Dragon. In addition the Dragon has a special shooting attack. It can breathe fire. This special attack can only be used if the rider has joined a unit and is not engaged in combat. A rider that has not joined a unit cannot use the Dragon‘s fiery breath to attack. The Dragon‘s fire breath works as follows. The fire breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Chaos Dragon is a large terrifying creature. A unit that has been joined by a Chaos Dragon causes terror in its enemies and therefore imposes the usual Combat penalty."
  ],
  "notes": "The Chaos Dragon can fly, increasing the rider‘s move from 60 to 100cm, and it adds +3 Attacks to those of its rider."
}
```

## Chariot

Special text: **Chariot Mount.** Generals, Sorcerers and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider.

```json
{
  "specialName": "Chariot Mount",
  "eligibleToUpgrade": [
    "chaos:general",
    "chaos:hero",
    "chaos:sorcerer"
  ],
  "specials": [
    "Generals, Sorcerers and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider."
  ],
  "notes": null
}
```

# Orcs

## Giant

Special text: **Giants.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Giants",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Wyvern

Special text: **Wyverns.** Generals, Wizards and Heroes can ride Wyverns. A Wyvern can fly, increasing its rider‘s move from 60 to 100cm, and it adds +2 Attacks to those of its rider. A unit that includes a Wyvern rider causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Wyverns",
  "eligibleToUpgrade": [
    "orcs:goblin-hero",
    "orcs:goblin-shaman",
    "orcs:orc-general",
    "orcs:orc-hero",
    "orcs:orc-shaman"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride Wyverns. A unit that includes a Wyvern rider causes terror in its enemies."
  ],
  "notes": "A Wyvern can fly, increasing its rider‘s move from 60 to 100cm, and it adds +2 Attacks to those of its rider."
}
```

## Chariot

Special text: **Chariots.** A General, Wizard or Hero can ride a Chariot. A character in a chariot adds +1 to his Attacks.

```json
{
  "specialName": "Chariots",
  "eligibleToUpgrade": [
    "orcs:goblin-hero",
    "orcs:goblin-shaman",
    "orcs:orc-general",
    "orcs:orc-hero",
    "orcs:orc-shaman"
  ],
  "specials": [
    "A General, Wizard or Hero can ride a Chariot. A character in a chariot adds +1 to his Attacks."
  ],
  "notes": null
}
```

# High Elves

## Giant Eagles

Special text: **Giant Eagles.** Giant Eagles can fly.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Giant Eagles",
  "eligibleToUpgrade": [],
  "specials": [],
  "notes": "Giant Eagles can fly."
}
```

## Dragon Rider

Special text: **Dragons.** Dragons can fly. Dragon Rider units and any other units that include a Dragon-riding character cause terror in their enemies. Because Dragon Riders have a great many hits (6) which are difficult to inflict even during a lengthy combat engagement, we must consider the possibility of hurting the Dragon and reducing its effectiveness in subsequent turns. Therefore, if a Dragon Rider has accumulated 4-5 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Dragon has been badly hurt all accumulated hits are discounted and its maximum hits value and Attacks are halved for the rest of the battle (to 3 Hits and 3/2 Attacks). Generals, Wizards and Heroes can ride Dragons. A Dragon can fly increasing its rider‘s move from 60 to 100cm. An extra +3 Attacks are added to those of its rider. A Dragon can breathe fire if the character has joined a unit that isn‘t engaged in combat. A Dragon ridden by a character can‘t breathe fire if it is not part of a unit. Dragons can make a fiery breath. This applies both to a unit of Dragon Riders and to Dragons ridden by characters that have joined a unit of troops. Fire Breath works as follows. The fire breath has a range of 20cm. Breath can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way at 4+ to hit.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Dragons",
  "eligibleToUpgrade": [],
  "specials": [
    "Dragon Rider units and any other units that include a Dragon-riding character cause terror in their enemies. Because Dragon Riders have a great many hits (6) which are difficult to inflict even during a lengthy combat engagement, we must consider the possibility of hurting the Dragon and reducing its effectiveness in subsequent turns. Therefore, if a Dragon Rider has accumulated 4-5 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Dragon has been badly hurt all accumulated hits are discounted and its maximum hits value and Attacks are halved for the rest of the battle (to 3 Hits and 3/2 Attacks). Generals, Wizards and Heroes can ride Dragons. An extra +3 Attacks are added to those of its rider. A Dragon can breathe fire if the character has joined a unit that isn‘t engaged in combat. A Dragon ridden by a character can‘t breathe fire if it is not part of a unit. Dragons can make a fiery breath. This applies both to a unit of Dragon Riders and to Dragons ridden by characters that have joined a unit of troops. Fire Breath works as follows. The fire breath has a range of 20cm. Breath can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way at 4+ to hit."
  ],
  "notes": "Dragons can fly. A Dragon can fly increasing its rider‘s move from 60 to 100cm."
}
```

## Giant Eagle

Special text: **Giant Eagle Mount.** Generals, Wizards and Heroes can ride a Giant Eagle. An Eagle can fly increasing its rider‘s move from 60 to 100cm. An extra +2 Attacks are added to those of its rider.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Giant Eagle Mount",
  "eligibleToUpgrade": [
    "high-elves:general",
    "high-elves:hero",
    "high-elves:mage"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride a Giant Eagle. An extra +2 Attacks are added to those of its rider."
  ],
  "notes": "An Eagle can fly increasing its rider‘s move from 60 to 100cm."
}
```

## Dragon

Special text: **Dragons.** Dragons can fly. Dragon Rider units and any other units that include a Dragon-riding character cause terror in their enemies. Because Dragon Riders have a great many hits (6) which are difficult to inflict even during a lengthy combat engagement, we must consider the possibility of hurting the Dragon and reducing its effectiveness in subsequent turns. Therefore, if a Dragon Rider has accumulated 4-5 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Dragon has been badly hurt all accumulated hits are discounted and its maximum hits value and Attacks are halved for the rest of the battle (to 3 Hits and 3/2 Attacks). Generals, Wizards and Heroes can ride Dragons. A Dragon can fly increasing its rider‘s move from 60 to 100cm. An extra +3 Attacks are added to those of its rider. A Dragon can breathe fire if the character has joined a unit that isn‘t engaged in combat. A Dragon ridden by a character can‘t breathe fire if it is not part of a unit. Dragons can make a fiery breath. This applies both to a unit of Dragon Riders and to Dragons ridden by characters that have joined a unit of troops. Fire Breath works as follows. The fire breath has a range of 20cm. Breath can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way at 4+ to hit.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Dragons",
  "eligibleToUpgrade": [
    "high-elves:general",
    "high-elves:hero",
    "high-elves:mage"
  ],
  "specials": [
    "Dragon Rider units and any other units that include a Dragon-riding character cause terror in their enemies. Because Dragon Riders have a great many hits (6) which are difficult to inflict even during a lengthy combat engagement, we must consider the possibility of hurting the Dragon and reducing its effectiveness in subsequent turns. Therefore, if a Dragon Rider has accumulated 4-5 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Dragon has been badly hurt all accumulated hits are discounted and its maximum hits value and Attacks are halved for the rest of the battle (to 3 Hits and 3/2 Attacks). Generals, Wizards and Heroes can ride Dragons. An extra +3 Attacks are added to those of its rider. A Dragon can breathe fire if the character has joined a unit that isn‘t engaged in combat. A Dragon ridden by a character can‘t breathe fire if it is not part of a unit. Dragons can make a fiery breath. This applies both to a unit of Dragon Riders and to Dragons ridden by characters that have joined a unit of troops. Fire Breath works as follows. The fire breath has a range of 20cm. Breath can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way at 4+ to hit."
  ],
  "notes": "Dragons can fly. A Dragon can fly increasing its rider‘s move from 60 to 100cm."
}
```

## Chariot

Special text: **Chariot Mount.** Generals, Wizards and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider.

```json
{
  "specialName": "Chariot Mount",
  "eligibleToUpgrade": [
    "high-elves:general",
    "high-elves:hero",
    "high-elves:mage"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider."
  ],
  "notes": null
}
```

# Dwarfs

## Handgunners

Special text: **Handgunners.** A handgun shot can pierce armour far more easily than an arrow or a crossbow bolt. Therefore, count enemy Armour values as one worse than normal when shot by a handgun. One unit of Handgunners per full 1000 points can replace a unit of Warriors while still counting for the Warrior min/max value. Note that this unit still counts for max value of Handgunners.

Overrides:

- `countsTowardMin` set to {"unitId":"dwarfs:warriors","perThousand":1}

```json
{
  "specialName": "Handgunners",
  "eligibleToUpgrade": [],
  "specials": [
    "A handgun shot can pierce armour far more easily than an arrow or a crossbow bolt. Therefore, count enemy Armour values as one worse than normal when shot by a handgun.",
    "One unit of Handgunners per full 1000 points can replace a unit of Warriors while still counting for the Warrior min/max value. Note that this unit still counts for max value of Handgunners."
  ],
  "notes": null
}
```

## Gyrocopter

Special text: **Gyrocopter.** The Gyrocopter is a flying machine, so all the usual flying rules apply. The model always forms a single unit on its own, must be given orders individually, cannot be brigaded with other units and cannot be joined by a character in combat. The Gyrocopter’s fast-firing gun is light in weight and fires a small calibre shot. It counts Armour values as one worse than normal. The Gyrocopter has 360° vision - the unit can draw line of sight from all edges of its stand for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Gyrocopter",
  "eligibleToUpgrade": [],
  "specials": [
    "The model always forms a single unit on its own, must be given orders individually, cannot be brigaded with other units and cannot be joined by a character in combat. The Gyrocopter’s fast-firing gun is light in weight and fires a small calibre shot. It counts Armour values as one worse than normal. The Gyrocopter has 360° vision - the unit can draw line of sight from all edges of its stand for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy."
  ],
  "notes": "The Gyrocopter is a flying machine, so all the usual flying rules apply."
}
```

## Hero

Special text: **Hero.** One Hero in the army may be upgraded to carry an Oathstone for +15 pts. Once per game, the Hero may use the Oathstone to inspire one unit that he has joined (except Troll Slayers). Both the Hero, and the unit he has joined, gain +1 attack per stand, and are immune to Terror, until the end of the combat phase.

```json
{
  "specialName": "Hero",
  "eligibleToUpgrade": [],
  "specials": [],
  "notes": "One Hero in the army may be upgraded to carry an Oathstone for +15 pts. Once per game, the Hero may use the Oathstone to inspire one unit that he has joined (except Troll Slayers). Both the Hero, and the unit he has joined, gain +1 attack per stand, and are immune to Terror, until the end of the combat phase."
}
```

## Anvil

Special text: **Anvil.** The army can only include a single anvil and it is incorporated onto the stand of a Runesmith. If a Runesmith stand includes the Anvil, once per battle he can add +1 to his dice roll when he attempts to dispel enemy magic spells using the Dwarf anti-magic ability (see Runesmith). In addition the Runesmith can strike the Anvil during the Shooting phase of his own turn. The anvil‘s plangent rune-song fills the Dwarfs with even greater resolve! Roll a D6. On the score of a 4, 5 or 6 all Dwarf units within 20cm of the Runesmith are unaffected by Terror until the start of the Dwarf player‘s next turn. On a roll of less than 4 there is no effect.

Overrides:

- `maxPerArmy` set to true

```json
{
  "specialName": "Anvil",
  "eligibleToUpgrade": [
    "dwarfs:runesmith"
  ],
  "specials": [
    "The army can only include a single anvil and it is incorporated onto the stand of a Runesmith. If a Runesmith stand includes the Anvil, once per battle he can add +1 to his dice roll when he attempts to dispel enemy magic spells using the Dwarf anti-magic ability (see Runesmith). In addition the Runesmith can strike the Anvil during the Shooting phase of his own turn. The anvil‘s plangent rune-song fills the Dwarfs with even greater resolve! Roll a D6. On the score of a 4, 5 or 6 all Dwarf units within 20cm of the Runesmith are unaffected by Terror until the start of the Dwarf player‘s next turn. On a roll of less than 4 there is no effect."
  ],
  "notes": null
}
```

## Oathstone

Special text: **Oathstone.** One Hero in the army may be upgraded to carry an Oathstone. Once per game, the Hero may use the Oathstone to inspire one unit that he has joined (except Troll Slayers). Both the Hero, and the unit he has joined, gain +1 attack per stand, and are immune to Terror, until the end of the combat phase.

Overrides:

- `maxPerArmy` set to true

```json
{
  "specialName": "Oathstone",
  "eligibleToUpgrade": [
    "dwarfs:hero"
  ],
  "specials": [
    "One Hero in the army may be upgraded to carry an Oathstone. Once per game, the Hero may use the Oathstone to inspire one unit that he has joined (except Troll Slayers). Both the Hero, and the unit he has joined, gain +1 attack per stand, and are immune to Terror, until the end of the combat phase."
  ],
  "notes": null
}
```

# Skaven

## Warp Lightning Cannon

Special text: **Warp Lightning Cannon.** The Warp Lightning Cannon follows the rules for Elven Bolt Throwers as per page 75 of the rulebook, but they can move up to 20cm. A half pace move is 10cm. When making a shooting attack, any roll of double 1s to hit will cause the Warp Lightning Cannon unit to become confused. This includes stand and shoot attacks.

Overrides:

- `speed` set to 20
- `halfPace` set to 10

```json
{
  "specialName": "Warp Lightning Cannon",
  "eligibleToUpgrade": [],
  "specials": [
    "When making a shooting attack, any roll of double 1s to hit will cause the Warp Lightning Cannon unit to become confused. This includes stand and shoot attacks."
  ],
  "notes": "The Warp Lightning Cannon follows the rules for Elven Bolt Throwers as per page 75 of the rulebook, but they can move up to 20cm. A half pace move is 10cm."
}
```

## Doom Wheel

Special text: **Doom Wheel.** When the Doom Wheel charges against targets in the open it receives D6 bonus Attacks in addition to the normal +1 Attack for charging. Note that this bonus applies only when charging - not during pursuits, advances or when the Doom Wheel is charged itself. The Doom Wheel has a move of 20cm and causes terror.

Overrides:

- `speed` set to 20
- `halfPace` set to 10

```json
{
  "specialName": "Doom Wheel",
  "eligibleToUpgrade": [],
  "specials": [
    "When the Doom Wheel charges against targets in the open it receives D6 bonus Attacks in addition to the normal +1 Attack for charging. Note that this bonus applies only when charging - not during pursuits, advances or when the Doom Wheel is charged itself. The Doom Wheel has a move of 20cm and causes terror."
  ],
  "notes": null
}
```

## Screaming Bell

Special text: **Screaming Bell.** A Screaming Bell is a gargantuan device and therefore it uses a 40 x 60mm base, with the short edge being the front. It cannot move of its own accord - but relies upon the great mass of Skaven to push it forward. The Screaming Bell can therefore only move in the Command phase if it forms a brigade with one or more infantry units. It can then move 20cm at infantry pace. It cannot move using initiative and cannot be driven back by shooting and does not roll for drive backs. In combat it is automatically destroyed if forced to retreat but will pursue, advance and fall back so long as it is touching a Skaven infantry unit at the start and end of its move: otherwise it cannot pursue, advance or fall back as it is unable to move of its own accord. All Skaven units touching the Screaming Bell are unaffected by the usual penalty for Terror whilst they remain so. In addition, any Skaven Hero or Warlock within 30cm of the Screaming Bell adds +1 to their Command value. Any enemy character within 30cm of the Screaming Bell deducts -1 from their Command value. A Skaven army can only ever include a maximum of 1 Screaming Bell no matter how large.

Overrides:

- `speed` set to 20
- `halfPace` set to 10
- `maxPerArmy` set to true

```json
{
  "specialName": "Screaming Bell",
  "eligibleToUpgrade": [],
  "specials": [
    "A Screaming Bell is a gargantuan device and therefore it uses a 40 x 60mm base, with the short edge being the front. It cannot move of its own accord - but relies upon the great mass of Skaven to push it forward. The Screaming Bell can therefore only move in the Command phase if it forms a brigade with one or more infantry units. It can then move 20cm at infantry pace. It cannot move using initiative and cannot be driven back by shooting and does not roll for drive backs. In combat it is automatically destroyed if forced to retreat but will pursue, advance and fall back so long as it is touching a Skaven infantry unit at the start and end of its move: otherwise it cannot pursue, advance or fall back as it is unable to move of its own accord. All Skaven units touching the Screaming Bell are unaffected by the usual penalty for Terror whilst they remain so. In addition, any Skaven Hero or Warlock within 30cm of the Screaming Bell adds +1 to their Command value. Any enemy character within 30cm of the Screaming Bell deducts -1 from their Command value. A Skaven army can only ever include a maximum of 1 Screaming Bell no matter how large."
  ],
  "notes": null
}
```

## Rat Ogre Bodyguard

Special text: **Rat Ogre Bodyguard.** The Grey Seer, Heroes and Warlocks can have a Rat Ogre Bodyguard. A character with a bodyguard adds +1 to his Attacks.

```json
{
  "specialName": "Rat Ogre Bodyguard",
  "eligibleToUpgrade": [
    "skaven:grey-seer",
    "skaven:hero",
    "skaven:warlock"
  ],
  "specials": [
    "The Grey Seer, Heroes and Warlocks can have a Rat Ogre Bodyguard. A character with a bodyguard adds +1 to his Attacks."
  ],
  "notes": null
}
```

# Lizardmen

## Salamander

Special text: **Salamander.** Salamander stands are not deployed as independent units. Instead, any Skink infantry unit may add one stand of Salamanders. This brings the size of the unit to 4 stands - 3 regular stands plus the Salamander stand. Salamanders always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Salamander casualties never count for Command penalties. Salamander stands never cause the parent unit to be in Irregular Formation no matter how they are placed. If a Salamander stand is attached to a Skink unit the entire unit, including the Salamander, is considered to employ ‘Salamander Venom‘ shooting attacks. Enemy Armour saving throws suffer a - 1 penalty when hit by Salamander Venom (e.g. 5+ save requires a roll of 6). Salamander stands have 2 shooting attacks, a range of 15cm, and 360° vision in the same way as Skinks. If their unit is charged then Salamanders can shoot in the same way as any other shooting stand.

Overrides:

- `category` set to "upgrade"
- `points` set to null
- `upgradePoints` set to 20

```json
{
  "specialName": "Salamander",
  "eligibleToUpgrade": [
    "lizardmen:skinks"
  ],
  "specials": [
    "Salamander stands are not deployed as independent units. Instead, any Skink infantry unit may add one stand of Salamanders. This brings the size of the unit to 4 stands - 3 regular stands plus the Salamander stand. Salamanders always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Salamander casualties never count for Command penalties. Salamander stands never cause the parent unit to be in Irregular Formation no matter how they are placed. If a Salamander stand is attached to a Skink unit the entire unit, including the Salamander, is considered to employ ‘Salamander Venom‘ shooting attacks. Enemy Armour saving throws suffer a - 1 penalty when hit by Salamander Venom (e.g. 5+ save requires a roll of 6). Salamander stands have 2 shooting attacks, a range of 15cm, and 360° vision in the same way as Skinks. If their unit is charged then Salamanders can shoot in the same way as any other shooting stand."
  ],
  "notes": null
}
```

## Terradons

Special text: **Terradon.** Terradons can fly. Terradon riders have a shooting range of 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Terradon",
  "eligibleToUpgrade": [],
  "specials": [
    "Terradon riders have a shooting range of 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy."
  ],
  "notes": "Terradons can fly."
}
```

## Stegadon

Special text: **Stegadon Mount.** The Slann Mage may ride on top of a Stegadon, adding +3 attacks to its rider. If he rides a Stegadon then any unit he joins will cause terror and the usual Combat modifier will apply. No other character can ride a Stegadon.

```json
{
  "specialName": "Stegadon Mount",
  "eligibleToUpgrade": [
    "lizardmen:slann-mage-palanquin"
  ],
  "specials": [
    "The Slann Mage may ride on top of a Stegadon, adding +3 attacks to its rider. If he rides a Stegadon then any unit he joins will cause terror and the usual Combat modifier will apply. No other character can ride a Stegadon."
  ],
  "notes": null
}
```

## Carnosaur

Special text: **Carnosaur.** A Saurus Hero can ride a Carnosaur. If a character rides a Carnosaur then any unit he joins will cause terror. No other character can ride a Carnosaur.

```json
{
  "specialName": "Carnosaur",
  "eligibleToUpgrade": [
    "lizardmen:saurus-hero"
  ],
  "specials": [
    "A Saurus Hero can ride a Carnosaur. If a character rides a Carnosaur then any unit he joins will cause terror. No other character can ride a Carnosaur."
  ],
  "notes": null
}
```

# Bretonnia

## Pegasus Knights

Special text: **Knights.** A Knight unit will always use its initiative to charge an enemy if possible and cannot be given orders instead. They will never use their initiative to evade. Knights are unaffected by enemy that cause terror in combat and they don’t suffer the usual -1 Attack modifier.<br><br>**Pegasus Knights.** Pegasus Knights can fly.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Knights",
  "eligibleToUpgrade": [],
  "specials": [
    "A Knight unit will always use its initiative to charge an enemy if possible and cannot be given orders instead. They will never use their initiative to evade."
  ],
  "notes": "Knights are unaffected by enemy that cause terror in combat and they don’t suffer the usual -1 Attack modifier.\n**Pegasus Knights.** Pegasus Knights can fly."
}
```

## Unicorn

Special text: **Unicorn.** Only an Enchantress can ride a Unicorn. The Unicorn adds +1 to the Enchantress’s Attacks. Once per battle the Unicorn’s magical power adds +1 to the dice roll when casting a spell. The player must announce that he is using the Unicorn’s magic before rolling to see if the spell works.

```json
{
  "specialName": "Unicorn",
  "eligibleToUpgrade": [
    "bretonnia:enchantress"
  ],
  "specials": [
    "Only an Enchantress can ride a Unicorn. The Unicorn adds +1 to the Enchantress’s Attacks. Once per battle the Unicorn’s magical power adds +1 to the dice roll when casting a spell. The player must announce that he is using the Unicorn’s magic before rolling to see if the spell works."
  ],
  "notes": null
}
```

## Pegasus

Special text: **Pegasus.** The Pegasus can be ridden by a General, Hero or Enchantress and adds +1 Attack to the rider as well as allowing the character to fly.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Pegasus",
  "eligibleToUpgrade": [
    "bretonnia:enchantress",
    "bretonnia:general",
    "bretonnia:hero"
  ],
  "specials": [
    "The Pegasus can be ridden by a General, Hero or Enchantress and adds +1 Attack to the rider as well as allowing the character to fly."
  ],
  "notes": null
}
```

## Hippogriff

Special text: **Hippogriff.** A single General or Hero can ride a Hippogriff. A Hippogriff can fly, increasing its rider‘s move from 60 to 100cm, and it adds +2 Attacks to those of its rider. A unit that includes a Hippogriff rider causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Hippogriff",
  "eligibleToUpgrade": [
    "bretonnia:general",
    "bretonnia:hero"
  ],
  "specials": [
    "A single General or Hero can ride a Hippogriff. A unit that includes a Hippogriff rider causes terror in its enemies."
  ],
  "notes": "A Hippogriff can fly, increasing its rider‘s move from 60 to 100cm, and it adds +2 Attacks to those of its rider."
}
```

## Grail Reliquae

Special text: **Grail Reliquae.** This sacred item can be given to one unit of Peasants only in a whole army. This unit and all Peasant units touching it become Grail Pilgrims (for as long as they keep contact). Grail Pilgrims are immune to terror, don’t get the -1 Command penalty and get +1 Attack (they still keep the restriction that they don‘t get +1 Attacks for charging in the open), they have to attack by initiative if possible and cannot be driven back or confused. Before taking any specific action with a Peasant unit check if they are still touching the unit carrying the Grail Reliquae. If they do so they count as Grail Pilgrims - if not they are simple Peasants.

```json
{
  "specialName": "Grail Reliquae",
  "eligibleToUpgrade": [
    "bretonnia:peasants"
  ],
  "specials": [
    "This sacred item can be given to one unit of Peasants only in a whole army. This unit and all Peasant units touching it become Grail Pilgrims (for as long as they keep contact). Grail Pilgrims are immune to terror, don’t get the -1 Command penalty and get +1 Attack (they still keep the restriction that they don‘t get +1 Attacks for charging in the open), they have to attack by initiative if possible and cannot be driven back or confused. Before taking any specific action with a Peasant unit check if they are still touching the unit carrying the Grail Reliquae. If they do so they count as Grail Pilgrims - if not they are simple Peasants."
  ],
  "notes": null
}
```

# Kislev

## Bear

Special text: **Bear Mount.** Generals, Heroes and Shamans can ride a Bear mount. The Bear adds +1 Attack to that of its rider.

```json
{
  "specialName": "Bear Mount",
  "eligibleToUpgrade": [
    "kislev:general",
    "kislev:hero",
    "kislev:shaman"
  ],
  "specials": [
    "Generals, Heroes and Shamans can ride a Bear mount. The Bear adds +1 Attack to that of its rider."
  ],
  "notes": null
}
```

## Yozhin

Special text: **Yozhin.** This creature lives in swamps near the Praag since the great incursion of Chaos. Yozhin strongly hates any kind of Chaos, being (possibly) chaos-twisted creature itself. Only powerful Shamans may summon a Yozhin and make it to fight on their side. A single Shaman in the army can be assisted by Yozhin. There is no restriction for going into any water/boggy/ swamp terrain for him. A unit that has been joined by a Yozhin riding Shaman causes terror in its enemies. Yozhin adds +1 Attack to Shaman’s attacks value.

Overrides:

- `maxPerArmy` set to true

```json
{
  "specialName": "Yozhin",
  "eligibleToUpgrade": [
    "kislev:shaman"
  ],
  "specials": [
    "This creature lives in swamps near the Praag since the great incursion of Chaos. Yozhin strongly hates any kind of Chaos, being (possibly) chaos-twisted creature itself. Only powerful Shamans may summon a Yozhin and make it to fight on their side. A single Shaman in the army can be assisted by Yozhin. There is no restriction for going into any water/boggy/ swamp terrain for him. A unit that has been joined by a Yozhin riding Shaman causes terror in its enemies. Yozhin adds +1 Attack to Shaman’s attacks value."
  ],
  "notes": null
}
```

## Tzarina

Special text: **Tzarina.** The General may be a Tzarina of the royal blood - perhaps Tzarina Katrina herself. The Tzarina rides a horse- drawn sled - note this is not a chariot! The Tzarina can cast spells like a Wizard and can carry a magic item restricted to a Wizard if desired. Once during the battle the Tzarina can add +1 to the dice when attempting to cast a spell. The player must announce that the Tzarina’s special spell casting bonus is being used before rolling for the spell.

```json
{
  "specialName": "Tzarina",
  "eligibleToUpgrade": [
    "kislev:general"
  ],
  "specials": [
    "The General may be a Tzarina of the royal blood - perhaps Tzarina Katrina herself. The Tzarina rides a horse- drawn sled - note this is not a chariot! The Tzarina can cast spells like a Wizard and can carry a magic item restricted to a Wizard if desired. Once during the battle the Tzarina can add +1 to the dice when attempting to cast a spell. The player must announce that the Tzarina’s special spell casting bonus is being used before rolling for the spell."
  ],
  "notes": null
}
```

# Dark Elves

## Harpies

Special text: **Harpies.** Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly. A unit of harpies cannot be joined by a character.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10
- `facing` set to "long"

```json
{
  "specialName": "Harpies",
  "eligibleToUpgrade": [],
  "specials": [
    "A unit of harpies cannot be joined by a character."
  ],
  "notes": "Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly."
}
```

## Manticore

Special text: **Manticore.** Generals, Heroes and the Sorceress can ride a Manticore. The Manticore can fly increasing the rider‘s movement to 100cm. An extra +2 Attacks are added to those of the rider. A unit joined by the character causes Terror.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Manticore",
  "eligibleToUpgrade": [
    "dark-elves:general",
    "dark-elves:hero",
    "dark-elves:sorceress"
  ],
  "specials": [
    "Generals, Heroes and the Sorceress can ride a Manticore. An extra +2 Attacks are added to those of the rider. A unit joined by the character causes Terror."
  ],
  "notes": "The Manticore can fly increasing the rider‘s movement to 100cm."
}
```

## Chariot

Special text: (none)

```json
{
  "specialName": null,
  "eligibleToUpgrade": [
    "dark-elves:general",
    "dark-elves:hero",
    "dark-elves:sorceress"
  ],
  "specials": [],
  "notes": null
}
```

## Cauldron of Blood

Special text: **Cauldron of Blood.** A Sorceress can have a Cauldron of Blood. A Sorceress with a Cauldron of Blood suffers a movement reduction to 30cm. The army can only ever include one Cauldron of Blood and it can only be included if there is at least 1 unit of Witch Elves in the army. The Cauldron of Blood adds +2 Attacks to the Sorceress and can be used to add +1 to the Sorceress‘s dice roll to cast a spell once per battle. The player must announce that the Cauldron of Blood‘s spell bonus is being used before rolling the dice to determine if the spell is cast.

Overrides:

- `speed` set to 30
- `maxPerArmy` set to true
- `requiresUnit` set to {"unitId":"dark-elves:witch-elves","min":1}

```json
{
  "specialName": "Cauldron of Blood",
  "eligibleToUpgrade": [
    "dark-elves:sorceress"
  ],
  "specials": [
    "A Sorceress can have a Cauldron of Blood. The army can only ever include one Cauldron of Blood and it can only be included if there is at least 1 unit of Witch Elves in the army. The Cauldron of Blood adds +2 Attacks to the Sorceress and can be used to add +1 to the Sorceress‘s dice roll to cast a spell once per battle. The player must announce that the Cauldron of Blood‘s spell bonus is being used before rolling the dice to determine if the spell is cast."
  ],
  "notes": "A Sorceress with a Cauldron of Blood suffers a movement reduction to 30cm."
}
```

# Daemons

## Daemon Flyers

Special text: **Daemon Flyers.** These can fly. Daemon Flyers are an exception to the normal conventions for basing monsters in that they face the long edge of the stand in the same way as infantry rather than the short edge as most other monsters.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10
- `facing` set to "long"

```json
{
  "specialName": "Daemon Flyers",
  "eligibleToUpgrade": [],
  "specials": [],
  "notes": "These can fly. Daemon Flyers are an exception to the normal conventions for basing monsters in that they face the long edge of the stand in the same way as infantry rather than the short edge as most other monsters."
}
```

## Greater Daemon

Special text: **Greater Daemons.** Greater Daemons can fly regardless of whether the actual model has wings – aerial propulsion is deemed feasible by sheer effort of will. Greater Daemons cause terror in their enemies. A Greater Daemon that has accumulated 4-5 hits at the end of the Shooting or Combat phase and is no longer engaged in combat is deemed to have been badly hurt. Once a Greater Daemon is badly hurt accumulated hits are discounted and its Hits and Attacks values are halved for the rest of the battle (to 3 Hits and 4 Attacks).

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Greater Daemons",
  "eligibleToUpgrade": [],
  "specials": [
    "Greater Daemons cause terror in their enemies. A Greater Daemon that has accumulated 4-5 hits at the end of the Shooting or Combat phase and is no longer engaged in combat is deemed to have been badly hurt. Once a Greater Daemon is badly hurt accumulated hits are discounted and its Hits and Attacks values are halved for the rest of the battle (to 3 Hits and 4 Attacks)."
  ],
  "notes": "Greater Daemons can fly regardless of whether the actual model has wings – aerial propulsion is deemed feasible by sheer effort of will."
}
```

## Daemonic Wings

Special text: **Daemonic Wings.** Some of the creatures of the deep vaults of hell may have wings, some of them fly on hovering discs and some even have the ability of disappearing and reappearing wherever they want on the battlefield. Daemon characters may be given the ability of flying.

Overrides:

- `subType` set to "Flying"

```json
{
  "specialName": "Daemonic Wings",
  "eligibleToUpgrade": [
    "daemons:daemon-overlord",
    "daemons:daemon-lord-hero",
    "daemons:daemon-sorcerer"
  ],
  "specials": [],
  "notes": "Some of the creatures of the deep vaults of hell may have wings, some of them fly on hovering discs and some even have the ability of disappearing and reappearing wherever they want on the battlefield. Daemon characters may be given the ability of flying."
}
```

## Favour of the Gods

Special text: **Favour of the Gods.** Demon Overlord, Lord Heroes or Sorcerers can be given the Favour of the Gods. The character gains then +1 extra Attack and causes terror in its enemies as described in the Warmaster rulebook.

```json
{
  "specialName": "Favour of the Gods",
  "eligibleToUpgrade": [
    "daemons:daemon-overlord",
    "daemons:daemon-lord-hero",
    "daemons:daemon-sorcerer"
  ],
  "specials": [
    "Demon Overlord, Lord Heroes or Sorcerers can be given the Favour of the Gods. The character gains then +1 extra Attack and causes terror in its enemies as described in the Warmaster rulebook."
  ],
  "notes": null
}
```

## Chariot

Special text: **Chariot Mount.** Generals, Wizards and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider.

```json
{
  "specialName": "Chariot Mount",
  "eligibleToUpgrade": [
    "daemons:daemon-lord-hero",
    "daemons:daemon-overlord",
    "daemons:daemon-sorcerer"
  ],
  "specials": [
    "Generals, Wizards and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider."
  ],
  "notes": null
}
```

# Vampire Counts

## Fell Bats

Special text: **Fell Bats.** Fell Bats can fly. Although they cannot use initiative they are allowed to home back as described in the Warmaster rulebook. No order is required to home back. Fell Bats are an exception to the normal rules for basing monsters, in that they are based along the long base edge in the same way as infantry, rather than the short edge like other monsters.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Fell Bats",
  "eligibleToUpgrade": [],
  "specials": [
    "Although they cannot use initiative they are allowed to home back as described in the Warmaster rulebook. No order is required to home back. Fell Bats are an exception to the normal rules for basing monsters, in that they are based along the long base edge in the same way as infantry, rather than the short edge like other monsters."
  ],
  "notes": "Fell Bats can fly."
}
```

## Winged Nightmare

Special text: **Winged Nightmare.** Any character can ride a Winged Nightmare. A Winged Nightmare can fly increasing its rider‘s move to 100cm and adding +2 to its rider‘s attacks. A unit joined by a character riding a Winged Nightmare causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Winged Nightmare",
  "eligibleToUpgrade": [
    "vampire-counts:necromancer",
    "vampire-counts:vampire",
    "vampire-counts:vampire-lord"
  ],
  "specials": [
    "Any character can ride a Winged Nightmare. A unit joined by a character riding a Winged Nightmare causes terror in its enemies."
  ],
  "notes": "A Winged Nightmare can fly increasing its rider‘s move to 100cm and adding +2 to its rider‘s attacks."
}
```

## Black Coach

Special text: **Black Coach.** A Vampire Lord or Vampire can be mounted within a Black Coach adding +1 to its occupant‘s attacks. A unit joined by a character riding in the Black Coach causes terror in its enemies.

```json
{
  "specialName": "Black Coach",
  "eligibleToUpgrade": [
    "vampire-counts:vampire",
    "vampire-counts:vampire-lord"
  ],
  "specials": [
    "A Vampire Lord or Vampire can be mounted within a Black Coach adding +1 to its occupant‘s attacks. A unit joined by a character riding in the Black Coach causes terror in its enemies."
  ],
  "notes": null
}
```

# Araby

## Magic Carpets

Special text: **Magic Carpets.** Magic carpets can fly – they have been rated as aerial ‘cavalry‘ as this is the closest categorisation to their type. Because they are awkward flyers, they can be pursued by any type of enemy troops. They have a shooting range of 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Magic Carpets",
  "eligibleToUpgrade": [],
  "specials": [
    "Because they are awkward flyers, they can be pursued by any type of enemy troops. They have a shooting range of 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from it‘s front edge to charge an enemy."
  ],
  "notes": "Magic carpets can fly – they have been rated as aerial ‘cavalry‘ as this is the closest categorisation to their type."
}
```

## Flying Carpet

Special text: **Flying Carpet.** This is considered to be a flying chariot mount.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Flying Carpet",
  "eligibleToUpgrade": [
    "araby:general",
    "araby:hero",
    "araby:wizard"
  ],
  "specials": [],
  "notes": "This is considered to be a flying chariot mount."
}
```

## Elephant

Special text: **Elephant.** The Elephant mount is a standard monster mount except that a character mounted on an Elephant cannot join a unit of friendly cavalry. A unit joined by a character riding an Elephant causes Terror.

```json
{
  "specialName": "Elephant",
  "eligibleToUpgrade": [
    "araby:general",
    "araby:hero",
    "araby:wizard"
  ],
  "specials": [
    "The Elephant mount is a standard monster mount except that a character mounted on an Elephant cannot join a unit of friendly cavalry. A unit joined by a character riding an Elephant causes Terror."
  ],
  "notes": null
}
```

## Djinn

Special text: **Djinn.** The Djinn accompanies its master and can transform both of them into a whirlwind enabling the stand to fly as for a normal flying mount. If the Wizard has a Djinn he can also cast the Curse of the Djinn spell with a +1 casting bonus (see spells). Note that unusually the Djinn has +2 shooting attacks - these are added to a stand from a unit that the character has joined and can only be used when the character joins a unit. If the Wizard is accompanied by a Djinn then any unit he joins causes Terror.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Djinn",
  "eligibleToUpgrade": [
    "araby:wizard"
  ],
  "specials": [
    "If the Wizard has a Djinn he can also cast the Curse of the Djinn spell with a +1 casting bonus (see spells). Note that unusually the Djinn has +2 shooting attacks - these are added to a stand from a unit that the character has joined and can only be used when the character joins a unit. If the Wizard is accompanied by a Djinn then any unit he joins causes Terror."
  ],
  "notes": "The Djinn accompanies its master and can transform both of them into a whirlwind enabling the stand to fly as for a normal flying mount."
}
```

# Dogs of War

## Giant

Special text: **Giants.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Giants",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Griffon

Special text: **Griffon.** Generals, Wizards and Heroes may ride Griffons. The Griffon combines the appearance of a lion and an eagle. These creatures are hatched from stolen eggs and hand-reared to serve as mounts for favoured individuals. The Griffon can fly, increasing the rider’s movement to 100cm and it adds +2 Attacks to those of the rider. A unit which includes a Griffon causes terror in its enemies.<br><br>and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Griffon",
  "eligibleToUpgrade": [
    "dogs-of-war:general",
    "dogs-of-war:hero",
    "dogs-of-war:paymaster",
    "dogs-of-war:wizard"
  ],
  "specials": [
    "Generals, Wizards and Heroes may ride Griffons. The Griffon combines the appearance of a lion and an eagle. These creatures are hatched from stolen eggs and hand-reared to serve as mounts for favoured individuals. A unit which includes a Griffon causes terror in its enemies.\nand he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase."
  ],
  "notes": "The Griffon can fly, increasing the rider’s movement to 100cm and it adds +2 Attacks to those of the rider."
}
```

## Pay Wagon

Special text: **Paymaster, Pay Wagon.** There may only ever be one Paymaster in the army. Only the Paymaster may use the Wagon. If the Pay Wagon is used the Paymaster may bribe the units around him to fight harder. He may add +1 to all of his Command checks for a single turn only.

```json
{
  "specialName": "Paymaster, Pay Wagon",
  "eligibleToUpgrade": [
    "dogs-of-war:paymaster"
  ],
  "specials": [
    "There may only ever be one Paymaster in the army. Only the Paymaster may use the Wagon. If the Pay Wagon is used the Paymaster may bribe the units around him to fight harder. He may add +1 to all of his Command checks for a single turn only."
  ],
  "notes": null
}
```

# Ogre Kingdoms

## Slave Giant

Special text: **Slave Giant.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Slave Giant",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Bull Rhinox

Special text: **Bull Rhinox.** Tyrant, Bruisers and Butchers may ride the Bull Rhinox. A unit that is joined with a character mounted on this huge beast causes terror in enemies.

```json
{
  "specialName": "Bull Rhinox",
  "eligibleToUpgrade": [
    "ogre-kingdoms:bruiser",
    "ogre-kingdoms:butcher",
    "ogre-kingdoms:tyrant"
  ],
  "specials": [
    "Tyrant, Bruisers and Butchers may ride the Bull Rhinox. A unit that is joined with a character mounted on this huge beast causes terror in enemies."
  ],
  "notes": null
}
```

# Albion

## Giant

Special text: **Giant.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Giant",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Giant Eagles

Special text: **Giant Eagle.** Giant Eagles can fly.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Giant Eagle",
  "eligibleToUpgrade": [],
  "specials": [],
  "notes": "Giant Eagles can fly."
}
```

## Giant Eagle

Special text: **Giant Eagle Mount.** Giant Eagles can be ridden by Druids only. An Eagle can fly increasing its rider’s move from 60 to 100cm, and it adds +2 Attacks to those of its rider.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Giant Eagle Mount",
  "eligibleToUpgrade": [
    "albion:druid"
  ],
  "specials": [
    "Giant Eagles can be ridden by Druids only."
  ],
  "notes": "An Eagle can fly increasing its rider’s move from 60 to 100cm, and it adds +2 Attacks to those of its rider."
}
```

## Chariot

Special text: **Chariot Mount.** Generals, Druids and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider.

```json
{
  "specialName": "Chariot Mount",
  "eligibleToUpgrade": [
    "albion:druid",
    "albion:general",
    "albion:hero"
  ],
  "specials": [
    "Generals, Druids and Heroes can ride Chariots. An extra +1 Attack is added to those of its rider."
  ],
  "notes": null
}
```

# Goblins

## Giant

Special text: **Giant.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Giant",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Chariot

Special text: **Wolf Chariot.** A General, Hero or Wizard can ride a Wolf Chariot. The character riding a chariot adds +1 to his Attacks.

```json
{
  "specialName": "Wolf Chariot",
  "eligibleToUpgrade": [
    "goblins:goblin-hero",
    "goblins:goblin-shaman",
    "goblins:goblin-warboss"
  ],
  "specials": [
    "A General, Hero or Wizard can ride a Wolf Chariot. The character riding a chariot adds +1 to his Attacks."
  ],
  "notes": null
}
```

## Wyvern

Special text: **Wyvern.** Characters may ride Wyverns. A Wyvern can fly increasing its rider’s movement from 60cm to 100cm, and it adds +2 Attacks to those of its rider. A unit that includes a Wyvern rider causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Wyvern",
  "eligibleToUpgrade": [
    "goblins:goblin-warboss",
    "goblins:goblin-hero",
    "goblins:goblin-shaman"
  ],
  "specials": [
    "Characters may ride Wyverns. A unit that includes a Wyvern rider causes terror in its enemies."
  ],
  "notes": "A Wyvern can fly increasing its rider’s movement from 60cm to 100cm, and it adds +2 Attacks to those of its rider."
}
```

# Witch Hunters

## Warhounds

Special text: **Warhounds.** Warhound stands are not deployed as independent units. Instead, any infantry unit may add one stand of Warhounds. This brings the size of the unit to 4 stands; 3 regular stands plus the Warhound stand. Warhounds always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Warhound casualties never count for Command penalties. Warhound stands never cause the parent unit to be in Irregular Formation no matter how they are placed. An Infantry unit containing a Warhound stand gains the ability to pursue Cavalry and Chariots.

Overrides:

- `category` set to "upgrade"
- `points` set to null
- `upgradePoints` set to 20

```json
{
  "specialName": "Warhounds",
  "eligibleToUpgrade": [
    "witch-hunters:zealots",
    "witch-hunters:halberdiers",
    "witch-hunters:crossbowmen",
    "witch-hunters:handgunners",
    "witch-hunters:flagellants"
  ],
  "specials": [
    "Warhound stands are not deployed as independent units. Instead, any infantry unit may add one stand of Warhounds. This brings the size of the unit to 4 stands; 3 regular stands plus the Warhound stand. Warhounds always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Warhound casualties never count for Command penalties. Warhound stands never cause the parent unit to be in Irregular Formation no matter how they are placed. An Infantry unit containing a Warhound stand gains the ability to pursue Cavalry and Chariots."
  ],
  "notes": null
}
```

## War Altar

Special text: **War Altar.** A Warrior Priest may be mounted on a War Altar. A Warrior Priest with a War Altar suffers a movement reduction to 30cm. The army can only ever include one War Altar, and it can only be included if there is at least 1 unit of Flagellants in the army. The War Altar adds +2 attacks to the Warrior Priest and can be used to add +1 to the Warrior Priest‘s dice roll to cast a spell once per battle. The player must announce that the War Altar‘s spell bonus is being used before rolling the dice to determine if the spell is cast.

Overrides:

- `speed` set to 30
- `maxPerArmy` set to true
- `requiresUnit` set to {"unitId":"witch-hunters:flagellants","min":1}

```json
{
  "specialName": "War Altar",
  "eligibleToUpgrade": [
    "witch-hunters:warrior-priest"
  ],
  "specials": [
    "A Warrior Priest may be mounted on a War Altar. The army can only ever include one War Altar, and it can only be included if there is at least 1 unit of Flagellants in the army. The War Altar adds +2 attacks to the Warrior Priest and can be used to add +1 to the Warrior Priest‘s dice roll to cast a spell once per battle. The player must announce that the War Altar‘s spell bonus is being used before rolling the dice to determine if the spell is cast."
  ],
  "notes": "A Warrior Priest with a War Altar suffers a movement reduction to 30cm."
}
```

# Chaos Dwarfs

## Great Taurus

Special text: **Great Taurus.** Any character may be mounted on a Great Taurus. This mighty beast is fearsome to face on the battlefield. The Great Taurus causes terror and is able to fly.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Great Taurus",
  "eligibleToUpgrade": [
    "chaos-dwarfs:general",
    "chaos-dwarfs:hero",
    "chaos-dwarfs:sorcerer"
  ],
  "specials": [
    "Any character may be mounted on a Great Taurus. This mighty beast is fearsome to face on the battlefield. The Great Taurus causes terror and is able to fly."
  ],
  "notes": null
}
```

## Lammasu

Special text: **Lammasu.** The Lammasu is a magical creature trained to serve the Chaos Dwarfs. A Chaos Dwarf Sorcerer may be mounted on a Lammasu. A Lammasu is able to fly. In addition once per turn you can attempt to dispel one hostile spell cast on one friendly unit within 30cm of the Lammasu on a roll of 4+ on a D6. There can only be one Lammasu in the army.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Lammasu",
  "eligibleToUpgrade": [
    "chaos-dwarfs:sorcerer"
  ],
  "specials": [
    "The Lammasu is a magical creature trained to serve the Chaos Dwarfs. A Chaos Dwarf Sorcerer may be mounted on a Lammasu. A Lammasu is able to fly. In addition once per turn you can attempt to dispel one hostile spell cast on one friendly unit within 30cm of the Lammasu on a roll of 4+ on a D6. There can only be one Lammasu in the army."
  ],
  "notes": null
}
```

## Sorcerer Lord

Special text: **Sorcerer Lord.** The General may be a true Sorcerer Lord, maybe even one of the living ancestors from Zharr-Naggrund. A Sorcerer Lord can cast spells like a Wizard and can carry a magic item restricted to a Wizard if desired. Once during the battle a Sorcerer Lord can add +1 to the dice when attempting to cast a spell. The player must announce that the Sorcerer Lord’s special spell casting bonus is being used before rolling for the spell.

```json
{
  "specialName": "Sorcerer Lord",
  "eligibleToUpgrade": [
    "chaos-dwarfs:general"
  ],
  "specials": [
    "The General may be a true Sorcerer Lord, maybe even one of the living ancestors from Zharr-Naggrund. A Sorcerer Lord can cast spells like a Wizard and can carry a magic item restricted to a Wizard if desired. Once during the battle a Sorcerer Lord can add +1 to the dice when attempting to cast a spell. The player must announce that the Sorcerer Lord’s special spell casting bonus is being used before rolling for the spell."
  ],
  "notes": null
}
```

# Wood Elves

## Wardancers

Special text: **Wardancers.** Wardancer stands are not deployed as independent units. Instead, any Glade Guard or Eternal Guard unit may add one stand of Wardancers. This brings the size of the unit to 4 stands - 3 regular stands plus the Wardancers stand. Wardancers always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Wardancers casualties never count for Command penalties. Wardancers stands never cause the parent unit to be in Irregular Formation no matter how they are placed.

Overrides:

- `category` set to "upgrade"
- `points` set to null
- `upgradePoints` set to 25
- `unitSize` set to null
- `unitSizeModifier` set to 1

```json
{
  "specialName": "Wardancers",
  "eligibleToUpgrade": [
    "wood-elves:glade-guard",
    "wood-elves:eternal-guard"
  ],
  "specials": [
    "Wardancer stands are not deployed as independent units. Instead, any Glade Guard or Eternal Guard unit may add one stand of Wardancers. This brings the size of the unit to 4 stands - 3 regular stands plus the Wardancers stand. Wardancers always have the same Armour value as the rest of their unit. They fight as part of their unit and can be removed as a unit casualty if the player wishes. Wardancers casualties never count for Command penalties. Wardancers stands never cause the parent unit to be in Irregular Formation no matter how they are placed."
  ],
  "notes": null
}
```

## Warhawk Riders

Special text: **Warhawk Riders.** Warhawk Riders can fly. They have a shooting range of only 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from its front edge to charge an enemy.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Warhawk Riders",
  "eligibleToUpgrade": [],
  "specials": [
    "They have a shooting range of only 15cm and 360° vision - stands in this unit can draw line of sight from all edges for the purpose of evading and shooting, including shooting at charging enemies. Note that this unit still needs Line of Sight from its front edge to charge an enemy."
  ],
  "notes": "Warhawk Riders can fly."
}
```

## Giant Stag

Special text: **Giant Stag.** General, Nobles and Spellweavers may ride a Giant Stag. The Stag adds +1 Attack to those of its rider.

```json
{
  "specialName": "Giant Stag",
  "eligibleToUpgrade": [
    "wood-elves:general",
    "wood-elves:noble",
    "wood-elves:spellweaver"
  ],
  "specials": [
    "General, Nobles and Spellweavers may ride a Giant Stag. The Stag adds +1 Attack to those of its rider."
  ],
  "notes": null
}
```

## Unicorn

Special text: **Unicorn.** This mount can be ridden by Spellweaver only. The Unicorn adds +1 Attack to those of its rider. Once per battle the Unicorn’s magical power adds +1 to the dice when casting a spell. The player must announce that the Unicorn’s magic before rolling to see if the spell works. There can be only one Unicorn in the army.

```json
{
  "specialName": "Unicorn",
  "eligibleToUpgrade": [
    "wood-elves:spellweaver"
  ],
  "specials": [
    "This mount can be ridden by Spellweaver only. The Unicorn adds +1 Attack to those of its rider. Once per battle the Unicorn’s magical power adds +1 to the dice when casting a spell. The player must announce that the Unicorn’s magic before rolling to see if the spell works. There can be only one Unicorn in the army."
  ],
  "notes": null
}
```

## Warhawk

Special text: **Warhawk.** General, Nobles and Spellweavers may ride a Warhawk. The Warhawk can fly, increasing its rider’s move from 60cm to 100cm, and it adds +1 Attack to those of its rider.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Warhawk",
  "eligibleToUpgrade": [
    "wood-elves:general",
    "wood-elves:noble",
    "wood-elves:spellweaver"
  ],
  "specials": [
    "General, Nobles and Spellweavers may ride a Warhawk."
  ],
  "notes": "The Warhawk can fly, increasing its rider’s move from 60cm to 100cm, and it adds +1 Attack to those of its rider."
}
```

## Forest Dragon

Special text: **Forest Dragon.** Generals, Nobles and Spell Weavers may ride Forest Dragons. A Forest Dragon can fly, increasing its rider’s move to 100cm, and adds +3 Attacks to those of its rider. Any unit joined by a character riding a Forest Dragon cause terror in their enemies and so long as the Dragon is attached to a unit, it can use its Corrosive Breath attack. This is a shooting attack with a range of 20cm, which can be directed against one target as normal. The breath has 3 Attacks, which are worked out in the usual way.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Forest Dragon",
  "eligibleToUpgrade": [
    "wood-elves:general",
    "wood-elves:noble",
    "wood-elves:spellweaver"
  ],
  "specials": [
    "Generals, Nobles and Spell Weavers may ride Forest Dragons. Any unit joined by a character riding a Forest Dragon cause terror in their enemies and so long as the Dragon is attached to a unit, it can use its Corrosive Breath attack. This is a shooting attack with a range of 20cm, which can be directed against one target as normal. The breath has 3 Attacks, which are worked out in the usual way."
  ],
  "notes": "A Forest Dragon can fly, increasing its rider’s move to 100cm, and adds +3 Attacks to those of its rider."
}
```

# Beastmen

## Tuskgor Chariot

Special text: **Tuskgor Chariot.** Beastlord or Wargors can ride a Tuskgor Chariot. A character riding a chariot adds +1 to his Attacks.

```json
{
  "specialName": "Tuskgor Chariot",
  "eligibleToUpgrade": [
    "beastmen:beastlord",
    "beastmen:wargor"
  ],
  "specials": [
    "Beastlord or Wargors can ride a Tuskgor Chariot. A character riding a chariot adds +1 to his Attacks."
  ],
  "notes": null
}
```

# Norse

## Storm Giant

Special text: **Storm Giant.** Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies. Giant Goes Wild Chart D6 Oh no! What‘s he doing now! 1. The Giant will neither move nor fight this turn but simply stands rooted to the spot looking dopey. 2. Move the Giant directly towards the nearest table edge. If he moves into another unit he will charge it regardless of which side it is on. If victorious in combat the Giant will hold his ground. 3. The Giant throws an object at the closest visible unit (friend or foe) within 5xD6 cm, inflicting 3 Attacks. If the target is in combat, the attacks contribute to the combat result; otherwise, resolve them in the Shooting phase. 4. The Giant moves straight forward at full pace in the direction he is facing in. If he reaches an enemy unit he will charge. If he reaches a friendly unit he will walk straight through and out the other side if there is room and he has sufficient move. If he reaches a friendly unit and does not have sufficient move or enough room to walk all the way through then he halts on contact. A friendly unit that is walked through or contacted in this way instantly becomes confused as a result. 5. The Giant moves towards the nearest enemy unit that he can see as fast as he can. If he reaches the foe he will charge. If friends are in the way he will walk through them causing confusion as described above. If there is no visible enemy the Giant does nothing this Command phase. 6. The Giant gives a mighty bellow and rushes straight at the nearest enemy unit that he can see. Move the Giant at double his normal full pace move. If he reaches an enemy unit, he charges it and fights by jumping up and down on the foe, furiously doubling his Attacks value in the first round of combat. If there is no visible enemy the Giant does nothing this Command phase.

```json
{
  "specialName": "Storm Giant",
  "eligibleToUpgrade": [],
  "specials": [
    "Giants must always be given a separate order. They cannot be brigaded with other troops, although several Giants can be brigaded together if you so wish. If you attempt to give an order to a Giant and fail then you must take a test to see what it does. Ignore potential blunders - these are taken into account by the following rules. Roll a dice and consult the Giant Goes Wild chart. Where Giants are brigaded together roll for each separately. Giants have a great many hits, 8 in fact, which are almost impossible to inflict during even a fairly lengthy combat engagement. Because Giants have so many hits we must consider the possibility of hurting the Giant and reducing its effectiveness in subsequent turns. Therefore, if a Giant has accumulated 5-7 hits by the end of the Shooting phase or Combat phase and is no longer engaged in combat it is deemed to have been badly hurt. Once a Giant is badly hurt all accumulated hits are discounted and its maximum Hits value and Attacks are halved for the rest of the battle (to 4 Hits and 4 Attacks). A Giant causes terror in its enemies."
  ],
  "notes": null
}
```

## Valkyries

Special text: **Valkyries.** Valkyries can fly. Valkyries will always use their initiative to charge an enemy if possible and cannot be given orders instead. They will never use their initiative to evade. Valkyries are unaffected by enemy that cause terror in combat and they don’t suffer the usual -1 Attack modifier.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10

```json
{
  "specialName": "Valkyries",
  "eligibleToUpgrade": [],
  "specials": [
    "Valkyries will always use their initiative to charge an enemy if possible and cannot be given orders instead. They will never use their initiative to evade. Valkyries are unaffected by enemy that cause terror in combat and they don’t suffer the usual -1 Attack modifier."
  ],
  "notes": "Valkyries can fly."
}
```

## Were Kin

Special text: **Were Kin.** The Were Kin special mount option may be taken by any character in Norse army. It is not actually a mount as such, more an upgrade. A unit that is joined by the character with the Were Kin upgrade causes terror in its enemies. No terrain restriction apply for Were Kin - just treat the character as having +1 extra Attack and causing terror.

```json
{
  "specialName": "Were Kin",
  "eligibleToUpgrade": [
    "norse:hero",
    "norse:jarl",
    "norse:shaman"
  ],
  "specials": [
    "The Were Kin special mount option may be taken by any character in Norse army. It is not actually a mount as such, more an upgrade. A unit that is joined by the character with the Were Kin upgrade causes terror in its enemies. No terrain restriction apply for Were Kin - just treat the character as having +1 extra Attack and causing terror."
  ],
  "notes": null
}
```

## Horn of Resounding

Special text: **Horn of Resounding.** A single Shaman in the army may be given this chariot upgrade granting the Shaman standard +1 Attack. Once per battle, the Horn can be used by the Shaman to inspire the units around him to fight harder. If the horn is used the Saman may add +1 to all of his Command checks for that single turn only.

```json
{
  "specialName": "Horn of Resounding",
  "eligibleToUpgrade": [
    "norse:shaman"
  ],
  "specials": [
    "A single Shaman in the army may be given this chariot upgrade granting the Shaman standard +1 Attack. Once per battle, the Horn can be used by the Shaman to inspire the units around him to fight harder. If the horn is used the Saman may add +1 to all of his Command checks for that single turn only."
  ],
  "notes": null
}
```

# Cathay

## Chariot

Special text: (none)

```json
{
  "specialName": null,
  "eligibleToUpgrade": [
    "cathay:general",
    "cathay:hero",
    "cathay:sorcerer"
  ],
  "specials": [],
  "notes": null
}
```

## Celestial Dragon

Special text: **Celestial Dragon.** One Sorcerer per army can be upgraded to become a dragon which flies, gives orders, casts spells, and causes terror. The dragon cannot give orders to Terracotta Warriors.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Celestial Dragon",
  "eligibleToUpgrade": [
    "cathay:sorcerer"
  ],
  "specials": [
    "The dragon cannot give orders to Terracotta Warriors."
  ],
  "notes": "One Sorcerer per army can be upgraded to become a dragon which flies, gives orders, casts spells, and causes terror."
}
```

## Tiger

Special text: **Tiger.** Tigers cannot be ridden by Sorcerers.

```json
{
  "specialName": "Tiger",
  "eligibleToUpgrade": [
    "cathay:general",
    "cathay:hero"
  ],
  "specials": [
    "Tigers cannot be ridden by Sorcerers."
  ],
  "notes": null
}
```

## Qilin

Special text: **Qilin.** Only a Sorcerer can ride a Qilin. Once per battle the Qilin’s magical power adds +1 to the dice roll when casting a spell. The player must announce that they are using the Qilin’s magic before rolling to see if the spell works.

```json
{
  "specialName": "Qilin",
  "eligibleToUpgrade": [
    "cathay:sorcerer"
  ],
  "specials": [
    "Only a Sorcerer can ride a Qilin. Once per battle the Qilin’s magical power adds +1 to the dice roll when casting a spell. The player must announce that they are using the Qilin’s magic before rolling to see if the spell works."
  ],
  "notes": null
}
```

# Nippon

## Tengu

Special text: **Temple Daemons.** Temple Daemons are immune to terror and cannot be given magic items. They also suffer from Daemonic Instability. At the start of the Nippon player’s own Command phase, before making any initiatives moves, all friendly Daemon units that have taken at least 1 casualty (i.e. lost at least 1 stand out of 3) must make a ‘Daemonic Instability’ test. Roll a D6. If the unit has lost 2 stands (i.e. has only 1 stand remaining from 3) deduct 1 from the roll. 0-1 One stand is destroyed – the daemons fade away and are absorbed back into the heaven from which they came. Remove one stand from play. If a character is with the unit and the last stand is removed the character is destroyed too. 2-3 The unit becomes confused - if not already confused the stand becomes confused as it is torn between this world and the next. 4-5 No effect – unless the unit is confused in which case it ceases to be confused as it is favoured with the invigorating power of the Temple. 6 The unit regains one stand. The regained stand is placed in formation with the rest of the unit. If it is impossible to position the stand in formation with its unit then the stand cannot be added.<br><br>**Tengu.** Tengu can fly. They are an exception to the normal conventions for basing monsters in that they face the long edge of the stand in the same way as infantry rather than the short edge as most other monsters. Tengu are affected by Instability and Immune to Terror like other Temple Daemons.

Overrides:

- `subType` set to "Flying"
- `speed` set to 60
- `halfPace` set to 10
- `facing` set to "long"

```json
{
  "specialName": "Temple Daemons",
  "eligibleToUpgrade": [],
  "specials": [
    "Temple Daemons are immune to terror and cannot be given magic items. They also suffer from Daemonic Instability. At the start of the Nippon player’s own Command phase, before making any initiatives moves, all friendly Daemon units that have taken at least 1 casualty (i.e. lost at least 1 stand out of 3) must make a ‘Daemonic Instability’ test. Roll a D6. If the unit has lost 2 stands (i.e. has only 1 stand remaining from 3) deduct 1 from the roll. 0-1 One stand is destroyed – the daemons fade away and are absorbed back into the heaven from which they came. Remove one stand from play. If a character is with the unit and the last stand is removed the character is destroyed too. 2-3 The unit becomes confused - if not already confused the stand becomes confused as it is torn between this world and the next. 4-5 No effect – unless the unit is confused in which case it ceases to be confused as it is favoured with the invigorating power of the Temple. 6 The unit regains one stand. The regained stand is placed in formation with the rest of the unit. Tengu are affected by Instability and Immune to Terror like other Temple Daemons."
  ],
  "notes": "If it is impossible to position the stand in formation with its unit then the stand cannot be added.\n**Tengu.** Tengu can fly. They are an exception to the normal conventions for basing monsters in that they face the long edge of the stand in the same way as infantry rather than the short edge as most other monsters."
}
```

## Tatsu

Special text: **Tatsu.** Generals and Heroes can ride Tatsu, a kind of dragon native to Nippon. Tatsu can fly and cause terror in their enemies. An extra +2 Attacks are added to those of its rider.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Tatsu",
  "eligibleToUpgrade": [
    "nippon:daimyo",
    "nippon:shogun",
    "nippon:shugenja"
  ],
  "specials": [
    "Generals and Heroes can ride Tatsu, a kind of dragon native to Nippon. An extra +2 Attacks are added to those of its rider."
  ],
  "notes": "Tatsu can fly and cause terror in their enemies."
}
```

## Shrine

Special text: **Shrine.** The army can only include a single Shrine and it is incorporated onto the stand of a Shugenja. If a Shugenja stand includes the Shrine, once per battle he can add +1 to his dice roll when he attempts to dispel enemy magic spells using the Shrine anti-magic ability (see Shugenja). In addition, the Shugenja can invoke the gods using the Shrine during the Shooting phase of his own turn. The shrine’s invocation fills the Nippon army with even greater resolve! Roll a D6. On the score of a 4, 5 or 6 all Nippon units within 20cm of the Shugenja are unaffected by Terror until the start of the Nippon player‘s next turn. On a roll of less than 4 there is no effect.

```json
{
  "specialName": "Shrine",
  "eligibleToUpgrade": [
    "nippon:shugenja"
  ],
  "specials": [
    "The army can only include a single Shrine and it is incorporated onto the stand of a Shugenja. If a Shugenja stand includes the Shrine, once per battle he can add +1 to his dice roll when he attempts to dispel enemy magic spells using the Shrine anti-magic ability (see Shugenja). In addition, the Shugenja can invoke the gods using the Shrine during the Shooting phase of his own turn. The shrine’s invocation fills the Nippon army with even greater resolve! Roll a D6. On the score of a 4, 5 or 6 all Nippon units within 20cm of the Shugenja are unaffected by Terror until the start of the Nippon player‘s next turn. On a roll of less than 4 there is no effect."
  ],
  "notes": null
}
```

# Regiments of Renown

## Asarnil The Dragonlord

Special text: **Dragons.** Asarnil rides a Dragon. The Dragon can fly increasing its rider‘s move to 100cm. An extra +3 Attacks are added (included in Asarnil‘s profile). The Dragon can breath fire if the character has joined a unit that isn‘t engaged in combat. The fire breath has a range of 20cm and can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way. Additionally Asarnil causes terror in its enemies.

Overrides:

- `subType` set to "Flying"
- `speed` set to 100

```json
{
  "specialName": "Dragons",
  "eligibleToUpgrade": [],
  "specials": [
    "Asarnil rides a Dragon. An extra +3 Attacks are added (included in Asarnil‘s profile). The Dragon can breath fire if the character has joined a unit that isn‘t engaged in combat. The fire breath has a range of 20cm and can be directed against one target as for normal shooting and has 3 Attacks that are worked out in the usual way. Additionally Asarnil causes terror in its enemies."
  ],
  "notes": "The Dragon can fly increasing its rider‘s move to 100cm."
}
```
