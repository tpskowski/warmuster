# Data processing and schema

## List ingestion

Each army list should provide or inherit the following metadata:

- `ruleSet` — rules system identifier, for example `warmaster-revolution`
- `ruleBook` — source book identifier, for example `warmaster-revolution-armies`
- `version` — normalized source version without a leading `v`, for example `2.2.6`
- `army` — normalized army identifier, for example `chaos`

Basic table input:

| Troop | Type | Attacks | Hits | Armour | Command | Unit Size | Points per Unit | Min/Max | Special |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Chaos Warriors | Infantry | 4 | 4 | 4+ | - | 3 | 140 | 1/- | - |

We need a script that converts the raw Markdown army-list tables into the JSON schema used by the app. Keep the raw `.md` files in the repository; updates should rerun the conversion script to regenerate the JSON.

The normal conversion script only needs to parse the table data, apply standard defaults, and emit the normalized JSON fields described below. Special-rule interpretation and the one-off migration of rule text into structured fields can be handled as a curated data-cleanup step rather than as general natural-language parsing logic in the converter.

The update workflow should also support comparing the current version with the immediately previous version. It should emit a Version diff report — compares the current rules version with the immediately previous version. We only need to retain comparison support for one previous version.

## JSON output schema and normalization rules

Every unit object should use the same field structure:

- `ruleSet`
- `ruleBook`
- `version`
- `army`
- `unitId`
- `troop`
- `type`
- `subType`
- `category`
- `scoutingPoints` — generated integer from 0 to 3 for the optional Scouting deployment rules
- `facing`
- `speed`
- `halfPace`
- `eligibleToUpgrade`
- `meleeAttacks`
- `rangedAttacks`
- `bonusAttacks`
- `meleeAttackProfile`
- `rangedAttackProfile`
- `hits`
- `armour`
- `command`
- `bonusCommand` — a Command modifier written as `+N` (e.g. Cathay's Celestial Dragon upgrade); `command` stays `null`
- `unitSize`
- `unitSizeModifier`
- `points`
- `upgradePoints`
- `min`
- `max`
- `specialName`
- `specials`
- `notes`

Use `null` for scalar values that do not apply. Use an empty array for `eligibleToUpgrade` or `specials` when there are no values. Likewise for any other values like `armour` use null in place of 0 or - for armour. If a scalar structured field has multiple conditional resolved values thatcannot be represented by a dedicated profile field, store the primary value and preserve the condition and alternate values in `specials`.

### 0. UnitID & Category

#### UnitId

Assign `unitId` as `army`:`troop`, these should be unique

#### Category
Assign `category` based on following logic:

General, Hero, Wizard
→ character

Monstrous Mount, Chariot Mount
→ upgrade

All other rows
→ unit by default

### 1. Facing and unit size

#### Facing

Every unit must have a `facing` value. This describes which base edge faces forward.

Apply these defaults:

- Infantry: `long`
- Cavalry, Monster, Chariot, Artillery, Machine: `short`
- General, Hero, Wizard: `round`
- Mount and upgrade rows should have null for `facing` unless special rules say otherwise. Do not infer the rider's facing from the mount row.

If a special rule changes a unit's normal facing, store the resulting value in `facing`. Remove that sentence from `specials` and preserve the removed source text in `notes`.

Example: Harpies are Monsters, but their rule changes their facing to `long`.

#### Unit size

`unitSize` should be used for any numeric values. Characters should be null.

#### Unit size modifiers

`unitSizeModifier` stores a unit-size modifier written as `+N` or `-N`. Store the numeric signed modifier. Normal fixed unit-size values remain in `unitSize`.

Examples:

- `3` → `"unitSize": 3`, `"unitSizeModifier": null`
- `+1` → `"unitSize": null`, `"unitSizeModifier": 1`

The exact rule depends on what values actually occur in the source.

### 2. Speed, half-pace, and sub-types

Every unit must have an explicit numeric `speed`.

Apply these normal movement defaults:

- Infantry: `20`
- Cavalry, Monster, Chariot: `30`
- Artillery: `10`
- Machine: varies; determine from the special rule
- General, Hero, Wizard: `60`
- Flying subType: `60`

Store movement values as numbers only; the unit is centimeters and should not be included in the JSON value.

`subType` is `null` unless the unit has an additional normalized classification such as `Flying`.

Do not derive `speed` solely from `subType`. Special rules can override the normal movement value, and the final resolved value must be stored directly in `speed`. In the sample data, Harpies are stored as `subType: "Flying"`, `speed: 60`, and `halfPace: 10`, while the Chaos Dragon upgrade is stored as `subType: "Flying"` and `speed: 100`.

Store the resolved half-pace value in `halfPace` when applicable. Otherwise use `null`.

When movement or flying text has been converted into `subType`, `speed`, or `halfPace`, remove that text from `specials` and preserve the original text in `notes`.

#### Half Pace

Apply these normal movement defaults:

- Infantry: `10`
- Cavalry, Monster, Chariot: `15`
- Artillery: `5`
- Machine: varies; determine from the special rule
- General, Hero, Wizard: `null`
- Flying subType: `10`

General, Hero, Wizard should never have a half-pace value

### 3. Character mounts and other upgrades

Rules that define who can take a mount or upgrade should be represented in structured data rather than repeated in `specials`.

For a mount or upgrade row:

- `eligibleToUpgrade` is an array of `unitIds` allowed to take the upgrade.
- A movement change is stored in `speed`, and any classification such as Flying is stored in `subType`.
- An attack bonus such as `+3 Attacks` is stored in `bonusAttacks`.
- A shooting attack granted by the upgrade is stored in `rangedAttacks` when the rule provides a numeric attack value.
- A points value written as `+100` is an upgrade cost: store `points: null` and `upgradePoints: 100`.
- Text absorbed into these structured fields must be removed from `specials` and copied into `notes`.
- Any remaining behavioral rules stay in `specials`.

For the Chaos Dragon sample:

- `eligibleToUpgrade` is `["chaos:general", "chaos:hero", "chaos:wizard"]`.
- `subType` is `"Flying"`.
- `speed` is `100`.
- `bonusAttacks` is `3`.
- The Dragon's fire breath gives `rangedAttacks: 3`.
- `upgradePoints` is `100` and `points` is `null`.
- The eligible riders, flying/movement change, and `+3 Attacks` source text are preserved in `notes`, not `specials`.
- The fire-breath restrictions and terror rule remain in `specials`.

4. Special rules and curated normalization

Special-rule handling is split into three stages: Markdown ingestion, persistent curated normalization, and final JSON generation.

Markdown ingestion

During initial Markdown ingestion:

Preserve the complete Special column text exactly as source text.
Do not attempt to interpret, split, or structurally normalize special-rule behavior.
If the Special column is -, store no special-rule source text.
Store the raw Special text in an intermediate parsed record rather than directly generating the final specialName, specials, and notes fields.

The intermediate parsed data must retain enough source text for curated normalization to run without referring back to the original Markdown table.

Example intermediate data:

{
  "troop": "Harpies",
  "rawSpecial": "**Harpies.** Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly. A unit of harpies cannot be joined by a character."
}

rawSpecial is an intermediate ingestion field only. It is not included in the final app JSON.

The conversion pipeline should be:

Markdown source
    ↓
Parsed intermediate data
    ↓
Persistent curated normalization
    ↓
Final app JSON
Persistent curated normalization

Special-rule interpretation should be stored as persistent curated normalization data in the repository.

The curated normalization data must be reapplied every time the source Markdown is converted. Rerunning the converter for a new rules version must not discard previous structured interpretations of special-rule text.

Curated normalization may:

extract specialName
split behavioral rules into separate specials entries
set or override structured fields such as facing, subType, speed, and half-pace
define upgrade eligibility
populate bonusAttacks or rangedAttacks
classify a row by category
move source wording represented by structured fields into notes

Curated entries should target a stable unit identifier rather than matching only on display text.

Conceptual example:

{
  "chaos:harpies": {
    "specialName": "Harpies",
    "overrides": {
      "facing": "long",
      "subType": "Flying",
      "speed": 60,
      "halfPace": 10
    },
    "specials": [
      "A unit of harpies cannot be joined by a character."
    ],
    "notes": "Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly."
  }
}

The exact storage format of the curated normalization data may differ, but it must be version-controlled and reusable by subsequent conversion runs.

When source text changes between rules versions, the converter or change-report process should flag the affected curated entry for review rather than silently applying a potentially outdated normalization.

Special-name extraction

During curated normalization, extract the first bold rule heading from rawSpecial and store it as specialName.

Examples:

**Harpies.** → "specialName": "Harpies"
**Chaos Dragon.** → "specialName": "Chaos Dragon"

Remove the bold heading itself from the rule text.

When the source contains no bold rule heading, use:

"specialName": null
Behavioral special rules

Review the remaining source text and separate logically independent behavioral rules into individual entries in the specials array.

There is no fixed limit on the number of special rules.

Example source text:

When trying to issue an order to a unit of Trolls or to a brigade that contains a unit of Trolls, any Command penalty applied for distance between the character and the Troll unit is always doubled. So at 20cm no penalty applies, at 40cm -2, at 60cm -4, and so on. Trolls can regenerate wounds - in each round of combat after whole stands have been removed Trolls automatically regenerate one outstanding hit. If no hits are left over after removing whole stands then regeneration has no effect. Regenerated hits still count towards the combat result for the round.

Should be normalized as:

"specials": [
  "When trying to issue an order to a unit of Trolls or to a brigade that contains a unit of Trolls, any Command penalty applied for distance between the character and the Troll unit is always doubled. So at 20cm no penalty applies, at 40cm -2, at 60cm -4, and so on.",
  "Trolls can regenerate wounds - in each round of combat after whole stands have been removed Trolls automatically regenerate one outstanding hit. If no hits are left over after removing whole stands then regeneration has no effect. Regenerated hits still count towards the combat result for the round."
]

If source text is represented by structured fields such as facing, subType, speed, half-pace, upgrade eligibility, bonusAttacks, or rangedAttacks, remove the corresponding source wording from the visible behavioral rules when practical and preserve that wording in notes.

Only behavioral rule text that has not been fully represented by structured fields should remain in specials.

When no behavioral special-rule text remains after normalization, use:

"specials": []

This resolves the gap in the current version where the ingestion step is required to preserve the complete Special text but the final schema has nowhere to hold it before curated normalization.


### 5. Notes

`notes` stores original source text that has been removed from the visible special rules because its effect is now represented by structured JSON fields.

Use `notes` for source text absorbed into fields such as:

- `facing`
- `subType`
- `speed`
- `halfPace`
- `eligibleToUpgrade`
- `bonusAttacks`
- `rangedAttacks`

Preserve the removed wording as source text rather than rewriting it into a new rule explanation.

Use `null` when no source text was removed.

### 6. Attacks

Normalize the Attacks field into five fields:

- `meleeAttacks` — the normal numeric attack value from the unit's Attacks field.
- `rangedAttacks` — a numeric ranged or shooting attack value, including a numeric shooting attack defined by a special rule.
- `bonusAttacks` — an attack modifier written as `+N`.
- `meleeAttackProfile` —  non-standard melee attack numbers such as 2D6, 8-4-2, a unit should not have both `meleeAttackProfile` and `meleeAttacks` values
- `rangedAttackProfile` — non-standard ranged attack numbers such as 2D6, 8-4-2, 1/2+bounce a unit should not have both `rangedAttackProfile` and `rangedAttacks` values

Examples:

- `4` → `"meleeAttacks": 4`
- `+2` → `"bonusAttacks": 2`, with `"meleeAttacks": null`
- `2/1`→ `"meleeAttacks": 2`, `"rangedAttacks": 1`
- Chaos Dragon `+3` → `"bonusAttacks": 3`
- Chaos Dragon fire breath with 3 Attacks → `"rangedAttacks": 3`

Use `null` when a given attack mode does not apply.

### 7. Points and upgrade points

Normal point costs are stored in `points`.

A point value with a leading `+` is an upgrade cost and is stored in `upgradePoints`.

Examples:

- `140` → `"points": 140`, `"upgradePoints": null`
- `+100` → `"points": null`, `"upgradePoints": 100`

### 8. Min/Max

Split the source Min/Max field into `min` and `max`.

Convert `-` to `null`.

Examples:

- `1/-` → `"min": 1`, `"max": null`
- `-/1` → `"min": null`, `"max": 1`
- A single fixed value such as `1` → `"min": 1`, `"max": 1`

### 8a. Hiring (Regiments of Renown only)

Regiments of Renown are both a buildable army and a pool of mercenaries any other army may hire.
Each regiment carries a `hire` block describing the terms; it is authored in
`data/curation/regiments-of-renown.json` except for `armies`, which the generator folds in from
`data/allies-table.json` (the rulebook's Allies Table, one `+`/`/` row per army).

    "hire": {
      "armies": ["empire", "dwarfs"],
      "countsAs": {
        "rule": "limited-infantry",
        "byArmy": { "tomb-kings": "group:Monster", "dwarfs": "dwarfs:rangers" },
        "also": ["monstrous-mount-terror"]
      },
      "conflicts": ["regiments-of-renown:gotrek-and-felix"],
      "conflictUnits": { "dogs-of-war": ["dogs-of-war:dwarfs"] }
    }

`countsAs.rule` describes the allowance a hired regiment eats into. The rulebook phrases these as
descriptions of the hiring army's own list ("count as one highest point value limited infantry type
unit"), so the target is resolved against that army's data at runtime rather than hand-paired:
`none`, `limited-infantry`, `limited-shooting-infantry`, `limited-cavalry-or-chariot`, `artillery`,
`hero`, `flying-3-stands`, `monstrous-mount-terror`. Where no candidate exists, hiring places no
restriction. `byArmy` overrides the rule for one army, either with a unitId or with
`group:<type>` for a player's-choice pool. `conflicts` must be symmetric.

Every regiment also carries `maxPerArmy: true` — only one of each per army, at any army size.

### 9. Change-report output

Normalization report — documents curated conversion of raw special-rule text into structured fields, notes, and behavioral specials.

Use a format similar to:

# Chaos

## Harpies

Special text: **Harpies.** Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly. A unit of harpies cannot be joined by a character.

Changes:

~~Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters.~~

<!-- facing set to "long" -->

~~Harpies can fly.~~

<!-- subType set to "Flying"; speed and halfPace set to resolved values -->

```json
"specialName": "Harpies",
"specials": [
  "A unit of harpies cannot be joined by a character."
],
"notes": "Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly."
```

## Chaos Dragon

Special text: **Chaos Dragon.** Generals, Wizards and Heroes can ride a Chaos Dragon. The Chaos Dragon can fly, increasing the rider's move from 60 to 100cm, and it adds +3 Attacks to those of its rider. In addition the Dragon has a special shooting attack. It can breathe fire. This special attack can only be used if the rider has joined a unit and is not engaged in combat. A rider that has not joined a unit cannot use the Dragon's fiery breath to attack. The Dragon's fire breath works as follows. The fire breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Chaos Dragon is a large terrifying creature. A unit that has been joined by a Chaos Dragon causes terror in its enemies and therefore imposes the usual Combat penalty.

The report should show the rider eligibility, flying/movement change, bonus attacks, and ranged-attack value being moved into structured data and `notes`. The remaining fire-breath behavior and terror rule should be shown as separate entries in `specials`.

--- example conversion---

Input:
Chaos 
| Troop | Type | Attacks | Hits | Armour | Command | Unit Size | Points per Unit | Min/Max | Special |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Chaos Warriors | Infantry | 4 | 4 | 4+ | - | 3 | 140 | 1/- | - |
| Ogres | Infantry | 4 | 4 | 5+ | - | 3 | 105 | -/1 | **Ogres.** If an Ogre unit can use its initiative to charge an enemy unit of humans at the start of the Command phase then it must do so. This happens automatically and their commander can do nothing about it. ‘Humans’ encompasses all ‘men’ including Chaos Warriors and Marauders, but not Dwarfs, Elves etc. |
| Harpies | Monster | 2 | 3 | 6+ | - | 3 | 65 | -/1 | **Harpies.** Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly. A unit of harpies cannot be joined by a character. |
| General | General | +2 | - | - | 9 | 1 | 125 | 1 | - |
| Chaos Dragon | Monstrous Mount | +3 | - | - | - | - | +100 | -/1 | **Chaos Dragon.** Generals, Wizards and Heroes can ride a Chaos Dragon. The Chaos Dragon can fly, increasing the rider's move from 60 to 100cm, and it adds +3 Attacks to those of its rider. In addition the Dragon has a special shooting attack. It can breathe fire. This special attack can only be used if the rider has joined a unit and is not engaged in combat. A rider that has not joined a unit cannot use the Dragon's fiery breath to attack. The Dragon's fire breath works as follows. The fire breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way. The Chaos Dragon is a large terrifying creature. A unit that has been joined by a Chaos Dragon causes terror in its enemies and therefore imposes the usual Combat penalty. |


Output:

[
  {
    "ruleSet": "warmaster-revolution",
    "ruleBook": "warmaster-revolution-armies",
    "version": "2.2.6",
    "army": "chaos",
    "unitId": "chaos:chaos-warriors",
    "troop": "Chaos Warriors",
    "type": "Infantry",
    "subType": null,
    "category": "unit",
    "facing": "long",
    "speed": 20,
    "halfPace": 10,
    "eligibleToUpgrade": [],
    "meleeAttacks": 4,
    "rangedAttacks": null,
    "bonusAttacks": null,
    "meleeAttackProfile": null,
    "rangedAttackProfile": null,
    "hits": 4,
    "armour": "4+",
    "command": null,
    "unitSize": 3,
    "unitSizeModifier": null,
    "points": 140,
    "upgradePoints": null,
    "min": 1,
    "max": null,
    "specialName": null,
    "specials": [],
    "notes": null
  },
  {
    "ruleSet": "warmaster-revolution",
    "ruleBook": "warmaster-revolution-armies",
    "version": "2.2.6",
    "army": "chaos",
    "unitId": "chaos:ogres",
    "troop": "Ogres",
    "type": "Infantry",
    "subType": null,
    "category": "unit",
    "facing": "long",
    "speed": 20,
    "halfPace": 10,
    "eligibleToUpgrade": [],
    "meleeAttacks": 4,
    "rangedAttacks": null,
    "bonusAttacks": null,
    "meleeAttackProfile": null,
    "rangedAttackProfile": null,
    "hits": 4,
    "armour": "5+",
    "command": null,
    "unitSize": 3,
    "unitSizeModifier": null,
    "points": 105,
    "upgradePoints": null,
    "min": null,
    "max": 1,
    "specialName": "Ogres",
    "specials": [
      "If an Ogre unit can use its initiative to charge an enemy unit of humans at the start of the Command phase then it must do so. This happens automatically and their commander can do nothing about it. ‘Humans’ encompasses all ‘men’ including Chaos Warriors and Marauders, but not Dwarfs, Elves etc."
    ],
    "notes": null
  },
  {
    "ruleSet": "warmaster-revolution",
    "ruleBook": "warmaster-revolution-armies",
    "version": "2.2.6",
    "army": "chaos",
    "unitId": "chaos:harpies",
    "troop": "Harpies",
    "type": "Monster",
    "subType": "Flying",
    "category": "unit",
    "facing": "long",
    "speed": 60,
    "halfPace": 10,
    "eligibleToUpgrade": [],
    "meleeAttacks": 2,
    "rangedAttacks": null,
    "bonusAttacks": null,
    "meleeAttackProfile": null,
    "rangedAttackProfile": null,
    "hits": 3,
    "armour": "6+",
    "command": null,
    "unitSize": 3,
    "unitSizeModifier": null,
    "points": 65,
    "upgradePoints": null,
    "min": null,
    "max": 1,
    "specialName": "Harpies",
    "specials": [
      "A unit of harpies cannot be joined by a character."
    ],
    "notes": "Harpies are based facing the long edge of the base in the same way as infantry, rather than the short edge like other monsters. Harpies can fly."
  },
  {
    "ruleSet": "warmaster-revolution",
    "ruleBook": "warmaster-revolution-armies",
    "version": "2.2.6",
    "army": "chaos",
    "unitId": "chaos:general",
    "troop": "General",
    "type": "General",
    "category": "character",
    "subType": null,
    "facing": "round",
    "speed": 60,
    "halfPace": null,
    "eligibleToUpgrade": [],
    "meleeAttacks": null,
    "rangedAttacks": null,
    "bonusAttacks": 2,
    "meleeAttackProfile": null,
    "rangedAttackProfile": null,
    "hits": null,
    "armour": null,
    "command": 9,
    "unitSize": 1,
    "unitSizeModifier": null,
    "points": 125,
    "upgradePoints": null,
    "min": 1,
    "max": 1,
    "specialName": null,
    "specials": [],
    "notes": null
  },
  {
    "ruleSet": "warmaster-revolution",
    "ruleBook": "warmaster-revolution-armies",
    "version": "2.2.6",
    "army": "chaos",
    "unitId": "chaos:chaos-dragon",
    "troop": "Chaos Dragon",
    "type": "Monstrous Mount",
    "subType": "Flying",
    "category": "upgrade",
    "facing": null,
    "speed": 100,
    "halfPace": null,
    "eligibleToUpgrade": [
      "chaos:general",
      "chaos:hero",
      "chaos:wizard"
    ],
    "meleeAttacks": null,
    "rangedAttacks": 3,
    "bonusAttacks": 3,
    "meleeAttackProfile": null,
    "rangedAttackProfile": null,
    "hits": null,
    "armour": null,
    "command": null,
    "unitSize": null,
    "unitSizeModifier": null,    
    "points": null,
    "upgradePoints": 100,
    "min": null,
    "max": 1,
    "specialName": "Chaos Dragon",
    "specials": [
      "The Dragon has a special shooting attack. It can breathe fire. This special attack can only be used if the rider has joined a unit and is not engaged in combat. A rider that has not joined a unit cannot use the Dragon's fiery breath to attack. The Dragon's fire breath works as follows. The fire breath has a range of 20cm. It can be directed against one target as normal and has 3 Attacks worked out in the usual way.",
      "The Chaos Dragon is a large terrifying creature. A unit that has been joined by a Chaos Dragon causes terror in its enemies and therefore imposes the usual Combat penalty."
    ],
    "notes": "Generals, Wizards and Heroes can ride a Chaos Dragon. The Chaos Dragon can fly, increasing the rider's move from 60 to 100cm, and it adds +3 Attacks to those of its rider."
  }
]

When a structured value is only valid under behavioral conditions described by the source rule, the source wording may remain in `specials`. In this case the structured field acts as the resolved numeric value, while `specials` preserves the conditions under which it applies. Text that remains in `specials` does not also need to be duplicated in `notes`.

## Saved List Schema

Take this as a baseline but make any changes needed:

{
  "schemaVersion": 1,
  "ruleSet": "warmaster-revolution",
  "ruleVersion": "2.2.6",
  "army": "chaos",
  "name": "My Chaos Army",
  "pointsLimit": 2000,
  "units": [
    {
      "unitId": "chaos:chaos-warriors",
      "quantity": 4,
      "upgrades": [],
      "scoutingCommitted": false
    }
  ],
  "characters": [
    {
      "id": "character-1",
      "unitId": "chaos:general",
      "upgrades": [
        "chaos:chaos-dragon"
      ],
      "scoutingCommitted": true
    }
  ],
  "notes": null
}

Characters and units should both be defined by quantity, however represent any units with upgrades as a seperate entry. 

Unit and character entries may include `scoutingCommitted`. It is optional and absent values read
as `false`. Commitment is part of a unit stack's identity, so otherwise identical committed and
uncommitted units remain as separate entries.


| Field           | Purpose                               |
| --------------- | ------------------------------------- |
| `schemaVersion` | Version of the saved-list JSON format |
| `ruleSet`       | Ruleset the list was built against    |
| `ruleVersion`   | Version of rules data used            |
| `army`          | Army ID                               |
| `name`          | User's list name                      |
| `pointsLimit`   | Intended list size                    |
| `units`         | Selected units                        |
| `characters`    | Selected characters                   |
| `notes`         | Optional user notes                   |
| `allowMercenaries` | Whether the catalog offers Regiments of Renown for hire (optional; absent reads as off) |
| `folderId`      | Folder the list is filed under (optional; absent or null means the rail's top level) |
| `sortIndex`     | Position among the lists in the same folder (optional; lists without one sort last, in saved order) |

## Folder Schema

Folders organise the list rail. They hold no lists themselves — a list names its folder through `folderId` — and they belong to a rule set, like the lists they hold, so each rule set keeps its own organisation. Folders are saved in their own localStorage key (`warmuster.folders.v1`), separate from the lists.

    {
      "id": "folder-8fq2k1xa",
      "ruleSet": "warmaster-revolution",
      "name": "Tournament",
      "sortIndex": 0
    }

| Field       | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `id`        | Stable id referenced by a list's `folderId`                     |
| `ruleSet`   | Rule set whose rail shows this folder                           |
| `name`      | User's folder name. `Imports` is created on demand by share-link imports and reused by later ones |
| `sortIndex` | Position among the rule set's folders                           |

Deleting a folder deletes the lists filed under it. A list whose folder is missing — a corrupt store, or a backup carrying the list but not its folder — is shown at the top level rather than disappearing.

## Backup File Schema

A backup is the browser's whole collection in one file — every saved list, from every rule set, plus the folders they are filed under. Importing one *replaces* the collection rather than merging into it, so a backup taken on one computer restores onto another as an exact mirror. List and folder `id`s are therefore preserved (unlike share codes, which regenerate ids because they add a single list to an existing collection).

    {
      "kind": "warmuster/backup",
      "backupVersion": 1,
      "exportedAt": "2026-08-06T12:00:00.000Z",
      "lists": [],
      "folders": []
    }

The `lists` array contains `SavedList` objects and the `folders` array `Folder` objects, exactly as described above. `folders` is absent from backups taken before folders existed; those restore as a flat collection.

| Field           | Purpose                                                       |
| --------------- | ------------------------------------------------------------- |
| `kind`          | Marks the file as a Warmuster backup; anything else is rejected |
| `backupVersion` | Version of the backup envelope; a file from a newer version is rejected rather than half-read |
| `exportedAt`    | When the backup was taken (informational)                     |
| `lists`         | Every saved list; an empty array is valid and clears the collection |

Entries in `lists` that aren't recognisable saved lists are dropped and the rest still restore.
