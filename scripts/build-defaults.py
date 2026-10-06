"""Builds the table sets the app ships with, one for each theme.

src/content/defaults.en.json is the Gothic set, "Bloodborne Madness". Its
structure (ids, ranges, kinds) comes from source/follie.it.json, the author's
Italian tables. The English text is below, keyed by entry id: a title, a
description, and one text per outcome in the order of the source.

src/content/themed.en.json holds the sets of the other themes. Each is one
table on a d100 with no second roll, so every entry carries its own effect.

    python scripts/build-defaults.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATEGORIES = {
    "short-term": ("Short-Term", "A passing shadow that crawls through the mind.", {"kind": "dice", "die": 4, "unit": "minutes"}),
    "long-term": ("Long-Term", "A stain that will not wash out.", {"kind": "dice", "die": 4, "unit": "weeks"}),
    "indefinite": ("Indefinite", "A mark cut into the soul.", {"kind": "fixed", "text": "From now on:"}),
}

TEXT = {
    # ------------------------------------------------------------ short-term
    "short-term-1": ("The Unmade Self", "Your mind slips free of every notion of who you are.", [
        "With no self left to flatter, you are immune to the charmed condition.",
        "You copy the manner, bearing and speech of whichever creature stood nearest when the madness took you.",
        "You would believe anything that promised to give you back to yourself. You automatically fail saving throws against being charmed.",
    ]),
    "short-term-2": ("The Sound of the Cosmos", "The cosmos is loud, and now it is inside your head.", [
        "After the din in your skull, no noise can hurt you. You are immune to thunder damage.",
        "Whispers scratch at the back of your mind, and voices brush past your shoulder when nobody is there.",
        "The cosmos drowns out the world. You are deafened and have disadvantage on saving throws to maintain concentration.",
    ]),
    "short-term-3": ("Splintered Sight", "You saw too much. Your mind cannot hold it, and your eyes stop being trustworthy.", [
        "Your sight widens as if you were under the see invisibility spell.",
        "Pale shapes flit at the edge of your vision and are gone when you turn your head.",
        "You are blinded, and no special sense such as blindsight or tremorsense lets you see.",
    ]),
    "short-term-4": ("The Haunting Screams", "The madness finds a way out through your throat.", [
        "Your scream is loud enough to wound. As a bonus action on each of your turns, you can scream at a creature you can see within 30 feet. If it can hear you, it makes a Constitution saving throw, taking 1d12 thunder damage on a failure or half as much on a success.",
        "You cannot speak normally. Screaming is the only way you can make yourself understood.",
        "Your screams carry so far that every creature within 300 feet hears you when you speak. You cannot form coherent sentences or provide the verbal components of spells.",
    ]),
    "short-term-5": ("Folding Posture", "Your body gives way while you try to make sense of what is in front of you.", [
        "Your slack body folds out of the way of blows. When you are targeted by an attack or by an effect that calls for a Dexterity saving throw, you can use your reaction to weave aside, gaining +1 to AC and advantage on Dexterity saving throws until the start of your next turn.",
        "You hunch like a frightened child and look for someone to protect you, a parent of any kind. Once you find them you cling to them and will not leave their side, whatever happens.",
        "You fall prone and cannot stand, because your legs will not answer, and you cannot use any flying speed you have.",
    ]),
    "short-term-6": ("Blasphemous Hands", "You understand what your hands are: instruments of blasphemy.", [
        "Such instruments can break a mind. Once per turn, when you hit a creature with a melee weapon attack, you can deal an extra 1d8 psychic damage to it.",
        "You refuse to use your hands and keep them out of sight. If anyone stares at them you grow uneasy and defensive.",
        "You must not touch anything. You drop whatever you are holding, and you cannot hold objects or grapple creatures.",
    ]),
    "short-term-7": ("The Failing Body", "Your body buckles under the weight of the madness.", [
        "There is little left in you for poison to ruin. You are immune to the poisoned condition.",
        "You give off a foul smell that sickens even you, and no amount of washing or magic removes it.",
        "Your body turns on itself. You are poisoned, even if you are immune to the condition.",
    ]),
    "short-term-8": ("Horrors Revealed", "The horrors beyond show themselves to you, and fear closes over your head.", [
        "Something of what you saw shows in your face. When you gain this madness, each creature within 30 feet of you must succeed on a Wisdom saving throw or be frightened of you for 1 minute. A frightened creature repeats the save at the end of each of its turns, ending the effect on a success.",
        "You flinch at every movement and every sound, sure that something is coming.",
        "You see the horrors in the faces of your allies, and you are frightened of them. On each of your turns you must take the Dash action and move away from them by the fastest route, unless there is nowhere to go. If you start your turn where you can see none of them, you can use your action to end the madness.",
    ]),
    "short-term-9": ("The Broken Mind", "The madness snaps your mind in two.", [
        "Your mind was holding your body back. You have one additional action on each of your turns, which you can use only to Dash, Disengage, Hide, or Use an Object.",
        "You burst out laughing without warning, most often at the worst possible moment.",
        "You are incapacitated. The effect ends early if you take damage equal to twice your level or if greater restoration is cast on you.",
    ]),
    "short-term-10": ("Revelations from Beyond", "Truths from beyond force their way into your head.", [
        "Your body ignores pain, because only the truth you were shown matters. You are immune to the stunned condition.",
        "You tell others about the truth you were shown. It is perfectly clear to you and cryptic to anyone who has not seen it.",
        "The truth holds you where you stand. You are stunned. The effect ends early if you take damage equal to your level or if greater restoration is cast on you.",
    ]),
    "short-term-11": ("The Beast Stirs", "The beast inside you wakes and reaches for the reins.", [
        "Your body follows its animal instincts with no mind to restrain them. You are under the effect of the haste spell, which requires no concentration and lasts until the madness ends.",
        "Your speech slurs as if you were drunk, and animal noises slip in between your sentences.",
        "You fall unconscious while your mind fights with all it has to keep you from becoming a beast. The effect ends early if you take damage equal to your level or if greater restoration is cast on you.",
    ]),
    # ------------------------------------------------------------- long-term
    "long-term-1": ("The Weakened Body", "The corruption has hollowed out your strength.", [
        "Your frail body is thrown clear of danger. Whenever you take damage, you are pushed back 10 feet.",
        "You tire quickly and exertion costs you dearly. You need 4 hours more than usual to finish a long rest.",
        "Your legs barely carry you. Whenever you take damage, you fall prone.",
    ]),
    "long-term-2": ("Magic from Beyond the Grave", "An unearthly magic wakes inside you.", [
        "Your brush with the beyond leaves you a gift. You learn one random cantrip from the warlock spell list. Charisma is your spellcasting ability for it.",
        "The magic of this world disgusts you. Whenever you cast a spell or are subjected to one, you retch and stagger, and you lose your reaction until the start of your next turn.",
        "You cannot contain the new magic, and it leaks out when you are hurt. Whenever you take 15 or more damage from a single attack, you erupt in arcane force. You and each creature within 10 feet of you must succeed on a Constitution saving throw or take 2d10 force damage. This cannot happen again for 1d6 rounds.",
    ]),
    "long-term-3": ("Shattered Self-Worth", "Your sense of your own worth breaks apart.", [
        "Paranoia keeps you watching everyone and everything, guarding the little you have left. You add 1d4 to any Perception or Insight check you make.",
        "You are sullen and grim, and you run yourself down in every conversation.",
        "The feeling of uselessness gets into everything you do and wears away what skill you had. You subtract 1d4 from every ability check.",
    ]),
    "long-term-4": ("Power Without Measure", "You lose all sense of how strong you are.", [
        "Unaware of your limits, you push past them. Whenever you deal damage, add one more roll of the smallest damage die used.",
        "You cannot judge your own strength. Your handshake is either a vice or a dead fish, your embraces go the same way, and any physical task is a gamble.",
        "Afraid of tearing yourself apart, you hold back without meaning to. Whenever you deal damage, subtract one roll of the smallest damage die used, to a minimum of 0.",
    ]),
    "long-term-5": ("The Truth Unveiled", "The truth behind the world shows itself to you.", [
        "You can grasp it. You gain proficiency in one random Intelligence skill chosen by the GM, and you add double your proficiency bonus to checks made with it.",
        "What lies beyond fascinates you. Whenever you notice or hear of something otherworldly, you drop what you are doing to investigate and to get closer to it, in body or otherwise.",
        "The revelations call to you, urging you to know more and to be more. You have disadvantage on saving throws against madness.",
    ]),
    "long-term-6": ("Burning Nerves", "The madness sets fire to your nerves and eats them away.", [
        "Pain no longer reaches you. You are immune to being stunned, and you fall unconscious only when you drop to 0 hit points.",
        "Your ruined nerves itch without pause. The itch stops only while bare metal touches your skin.",
        "The pain never lets up, and it keeps you from focusing or fighting at your best. You cannot add your Dexterity modifier to your Armor Class, and you have disadvantage on Dexterity checks and Dexterity saving throws.",
    ]),
    "long-term-7": ("Powers from Beyond", "Powers from beyond take hold of you and fuse with your flesh.", [
        "You bring them to heel. You have advantage on Constitution saving throws to maintain concentration. In addition, when you fail a saving throw you can choose to succeed instead. If you do, you roll again on the long-term table and gain a new effect.",
        "Trying to understand what has joined with you, you drift loose from your surroundings. Everything around you feels unreal, and any touch startles you.",
        "The new powers are too much and they drain your mind. You have disadvantage on Intelligence, Wisdom, and Charisma checks, and on Constitution saving throws to maintain concentration.",
    ]),
    "long-term-8": ("The Faltering Heart", "Your heart falters. A reality like this cannot exist.", [
        "Your racing pulse sharpens you. You gain +3 to your passive Wisdom (Perception) score and to your initiative rolls.",
        "You cannot bear the unexpected. Whenever you are surprised, you scream at the top of your lungs. If you are surprised in combat, you fall unconscious until the start of your next turn.",
        "Your heart weakens in your chest. You gain one level of exhaustion that cannot be removed until the madness ends. Whenever you become frightened, you gain another level, which can be removed as normal.",
    ]),
    "long-term-9": ("Scars of Madness", "Your useless attempts to hold the madness off have left their marks on your body.", [
        "Scar tissue thickens your skin. You gain +1 to AC.",
        "The scars that cover you are beyond ugly and frighten most people, children above all. You gain +2 to Intimidation checks and take -2 to Persuasion checks.",
        "Deep scars cover much of your body, and they split open under any blow. Whenever you take bludgeoning, piercing, or slashing damage, you take an extra 1d6 damage of that type.",
    ]),
    "long-term-10": ("Rotting Flesh", "Your body cannot withstand the influence and begins to rot.", [
        "Your mind accepts that your body will rot, and welcomes it. Everything withers sooner or later. You are immune to the poisoned condition.",
        "The rot inside you turns your stomach. You feel constant disgust, and whenever you smell something foul you must spend your action retching.",
        "Terrible wounds open in your flesh. Your hit point maximum drops by 1 every 24 hours, and if it reaches 0 you die. During a long rest, you or another creature can tend the wounds with a Wisdom (Medicine) check, once every 24 hours. After five successes the wounds heal.",
    ]),
    "long-term-11": ("The Beast Unleashed", "The beast inside you wakes and takes the reins.", [
        "Most of your humanity stays, but enough of the beast gets loose. You have advantage on Dexterity saving throws. Each of your hands becomes a claw that you can use as a weapon while it is empty, dealing 1d6 slashing damage on a hit. Once on each of your turns, when you attack with a claw using the Attack action, you can make one additional claw attack as part of the same action.",
        "Your body changes, though a trace of what you were remains. You take on the features of an animal, chosen by the GM. If you have already been changed this way, treat this result as a 10 and apply that outcome instead.",
        "Your body becomes a beast or monstrosity of the GM's choice, with a challenge rating equal to half your level, rounded up. The change otherwise follows the rules of the polymorph spell, except that when you drop to 0 hit points you fall unconscious instead of returning to your own form.",
    ]),
    # ------------------------------------------------------------ indefinite
    "indefinite-1": ("Chained to Vice", "You need something to dull a painful, pointless existence, and you lean on it hard.", [
        "If you have a bad habit, such as drink or drugs, it takes over and you become dependent on it. If you have none, you take to drink. You take a -3 penalty to attack rolls, saving throws, and ability checks. While under the influence, you also gain +3 to saving throws against being frightened and against further madness.",
        "You dose yourself heavily to dull the pain of living. You develop whichever vice suits you best: promiscuity, drugs, drink, or smoking. If you do not indulge at least twice every 24 hours, you subtract 1d6 from Wisdom saving throws until you do.",
        "You reach for drink, drugs, and every other vice, and none of them works on you any more. Your body throws out whatever you take before it can act, and any carnal thought disgusts you.",
    ]),
    "indefinite-2": ("Ever Worse", "Life is bad and it is only getting worse.", [
        "One failure drags the next behind it. Whenever you fail an ability check, attack roll, or saving throw, you have disadvantage on your next one.",
        "You feel the world rotting and you trust only what has worked before. You flatly refuse anything you had not tried before the madness took you, be it a new spell, a new feature, or a new tavern.",
        "You may have shown promise once, but those days are far behind you. You lose all your skill proficiencies, and you take a penalty equal to your proficiency bonus on the skills you used to be proficient in. Features that grant a bonus to a check, such as Expertise or Jack of All Trades, no longer work for you.",
    ]),
    "indefinite-3": ("Hatred of the Flesh", "You come to hate your own body.", [
        "This madness stays hidden until you are alone with a blade for 10 seconds or more. Then, in a fit of rage, you cut off one of your limbs and destroy it.",
        "You bury yourself under layers of clothing and refuse to show an inch of skin to anyone. If you notice your skin is exposed, you have disadvantage on ability checks and attack rolls until you cover it again.",
        "Perhaps your soul would be better off leaving this wretched body. When you are reduced to 0 hit points, you start with two failed death saving throws, and you automatically fail any further death saving throw.",
    ]),
    "indefinite-4": ("No Way to Bear It", "You can no longer cope with strain.", [
        "Whenever you are under strain, you fly into a rage and attack its source without restraint until it is dead or you are knocked unconscious. The GM decides when you are under strain.",
        "Fear goes straight through you. You automatically fail saving throws against being frightened, and no effect can make you immune to fear.",
        "Whenever a situation is tense or social, you close in on yourself. You have disadvantage on Charisma and Dexterity checks, and whatever swagger you had is gone.",
    ]),
    "indefinite-5": ("Blistered Eyes", "Your eyes blister as the truth shows itself to you.", [
        "You go blind, and your sight does not return while this madness lasts.",
        "You can see into the Ethereal Plane but no longer into the Material Plane. You are blinded with regard to creatures and objects on the Material Plane.",
        "Your eyes darken and you cannot stand the light. In bright sunlight or moonlight, you have disadvantage on attack rolls and on Perception checks that rely on sight.",
    ]),
    "indefinite-6": ("The Call of Pain", "The madness sets your nerves alight, and your mind begins to ask for pain.", [
        "Something in you cries out to be hurt. You have disadvantage on saving throws against effects that deal damage, and attack rolls against you have advantage. In return, you have advantage on saving throws against effects that deal no damage, which your mind considers beneath you.",
        "Whenever you take more than 20 damage in one turn, the pain bursts out of you as psychic force. You and each creature within 30 feet of you must succeed on an Intelligence saving throw or take 3d10 psychic damage. You have disadvantage on this save.",
        "Death fascinates you. Whenever a creature you can see is unconscious at 0 hit points, you feel the urge to finish it, and you must use your turn trying to kill it.",
    ]),
    "indefinite-7": ("Ways of Coping", "Strange powers from beyond take hold of you, and you cope however you can.", [
        "You fix on one object you own. If it is not exactly as it should be at all times, it gnaws at your peace of mind. While it is out of order, you have disadvantage on ability checks and attack rolls.",
        "Nothing happens at first. (The rest is for the GM only.) The next time you fall unconscious in battle, the event scars you. If you meet that enemy in battle again while under this madness, you are cursed. While cursed, when you finish a long rest you make a Wisdom saving throw. On a failure your mind keeps returning to its failures, and you gain no benefit from the rest.",
        "You develop a strange phobia: of long words, of the dark, or of something else in your life. Work out with the GM which one suits your character.",
    ]),
    "indefinite-8": ("The Lying Heart", "Your heart will not accept a reality like this, so it stops dealing honestly with it.", [
        "You lose your grip on what is real. You see people who are not there and hear sounds that were never made, in battle too, where enemies that do not exist crowd the field. Make a Wisdom saving throw at the start of each of your turns. On a failure, you must use your action to attack a target of the GM's choice.",
        "You lie compulsively. Whenever you try to tell the truth, make a Wisdom saving throw. On a failure you lie, even against your own interest.",
        "You cannot keep your hands off small valuables. When you notice one, make a Wisdom saving throw. On a failure you try to steal something nearby, whatever the consequences.",
    ]),
    "indefinite-9": ("Nerves and Mind Adrift", "You begin to lose control of your nerves and your mind.", [
        "Your senses sharpen until they hurt. Lost in the noise of them, you have disadvantage on any ability check that relies on sight, hearing, smell, taste, or touch, and on Wisdom saving throws.",
        "You lose your hold on where you are, and you teleport a short way, 10 to 60 feet, at the worst moments. The GM decides when and where.",
        "Your thoughts carry to every creature within 60 feet of you. You cannot keep a secret from them or surprise them.",
    ]),
    "indefinite-10": ("The Body Rewritten", "Your body changes in ways that do you no good.", [
        "You become painfully sensitive to one kind of harm: fire, cold, lightning, acid, poison, or thunder. You are vulnerable to that damage type, and you lose any resistance or immunity you had to it.",
        "You are a living lightning rod. Any lightning, or any effect that deals lightning damage, within 120 feet of you bends toward you and strikes you as well. You automatically fail saving throws against effects that deal lightning damage.",
        "All your body hair falls out, and you can no longer keep warm or cool. You have disadvantage on saving throws against extreme cold and extreme heat, and against disease and poison, and you lose any resistance to poison damage.",
    ]),
    "indefinite-11": ("Reality Askew", "Your body takes in reality the wrong way.", [
        "You flicker in and out of the world, and parts of you pass through objects and creatures. When you make an attack or cast a spell, there is a 50 percent chance that it slips into the Ethereal Plane and passes through its targets without harming them.",
        "You misjudge distances: things look nearer or farther than they are. You have disadvantage on ranged attack rolls and on Perception checks that rely on sight.",
        "Time moves unevenly for you, stretching and bunching without warning. You have disadvantage on initiative rolls. At the start of each of your turns, roll a d6 to see what you can do: on 1-2, only one of an action, a bonus action, or movement; on 3-4, movement and either an action or a bonus action; on 5-6, a normal turn.",
    ]),
    "indefinite-12": ("Tricks of the Mind", "Your mind starts telling you things about yourself that are not true.", [
        "You grow far too sure of yourself and take needless risks. Before you attempt anything cautious or well reasoned, make a Wisdom saving throw. On a failure, you act on impulse.",
        "You believe you are a god, a royal, or some other great figure. You have disadvantage on Wisdom and Charisma checks when dealing with others.",
        "You believe you belong to another people. You can speak only their native tongue, and if that is not Common you lose the ability to speak Common. If you never knew their language, you make sounds that resemble it and mean nothing.",
    ]),
    "indefinite-13": ("Past All Restraint", "You lose all restraint, and your body does as it pleases whatever the company.", [
        "Whenever you roll initiative, you start to dance. At the start of each of your turns, make a Constitution saving throw to stop for that turn. On a failure you keep dancing, as with the irresistible dance spell.",
        "Fits of helpless laughter take you at the least fitting moments, and it is hard to speak or to focus. If you are concentrating on a spell, you must succeed on a Wisdom saving throw at the start of each of your turns or lose concentration. You also have disadvantage on Stealth checks.",
        "You are ravenous. You must succeed on a Wisdom saving throw or eat whatever food you come across, however foul, rancid, or plainly abominable.",
    ]),
    "indefinite-14": ("Hatred Beyond Reason", "A hatred greater than you takes hold.", [
        "The hatred grows a will of its own. You develop a second personality that tries to destroy everything you care for and to feed everything you despise.",
        "You conceive an irrational hatred for one creature, object, or situation chosen by the GM. When you meet it, you must succeed on a Wisdom saving throw or turn hostile toward it for 1 hour, or until it is out of your sight or destroyed.",
        "The thought of betrayal delights you. Whenever more than one creature is in range of an attack you are about to make, roll a d20. On a 10 or lower, you target another creature at random instead of the one you meant.",
    ]),
    "indefinite-15": ("The Strange Body", "Your body starts to behave in odd ways.", [
        "Your muscles forget which of them were strong and which were quick. Your Strength and Dexterity scores are swapped.",
        "You are convinced you have a grave illness, which may or may not be real. You have disadvantage on Constitution checks and Constitution saving throws.",
        "Your body goes on without being alive. Your creature type becomes undead. Magical healing has no effect on you.",
    ]),
    "indefinite-16": ("The Wound in the Mind", "What you lived through lodges in your mind.", [
        "Nightmares hound you and leave you worn out. If you have fewer than 2 levels of exhaustion when you finish a long rest, you wake with 2.",
        "You develop an intense fear of one kind of creature, chosen by the GM. If you are within 10 feet of such a creature on your turn, you must use your movement and your action to Dash away from it. Creatures of that kind have advantage on opportunity attacks against you.",
        "The horrors you saw bind your tongue and throat. You cannot speak or make any sound, including the verbal components of spells.",
    ]),
    "indefinite-17": ("The Call from Beyond", "Something beyond is calling you.", [
        "The moon calls to you in all its shapes. You have disadvantage on saving throws caused by lunar effects, direct or indirect, and advantage on ability checks about lunar lore.",
        "You answer the call and try to ascend, and you fail. Your speed is halved, and you can no longer teleport. If you are teleported against your will, for example by the banishment spell, you take 3d10 force damage as the cosmos takes its due from your flesh.",
        "You answer the call, and your ascension half succeeds. Your creature type becomes aberration. You gain resistance to psychic damage and advantage on saving throws against telepathy, but you lose all empathy and have disadvantage on Insight and Persuasion checks. You also understand Deep Speech and have disadvantage on saving throws against charm effects that come from aberrations.",
    ]),
    "indefinite-18": ("The Beast Triumphant", "The beast inside you wakes and takes over.", [
        "The beast gnaws at your mind, and you must stay alert to hold it back. Whenever you fall unconscious, roll 1d2. On a 1, your mind loses its hold, and the next time you wake the beast is in control of your body. Until you fall unconscious again, the GM controls you, while the chaotic evil beast inside you seeks out other beasts and tries to drive you out of your own body. On a 2, you keep or regain your sanity when you wake.",
        "Your body changes, though a trace of what you were remains. You take on the features of an animal for good; decide with the GM which ones suit your character. Nothing short of a wish spell can undo the change. If you have already been changed this way, treat this result as a 10 and apply that outcome instead.",
        "You become a beast or monstrosity of the GM's choice, with a challenge rating equal to half your level, rounded up, and your mind is lost. You are a creature under the GM's control.",
    ]),
}


# In the Hellenic set no god is called by name: each goes by a title.
# The other themes: (set name, theme, table name, line under it, duration, entries).
# An entry is a title, a description read aloud, and the effect. The entries share
# the d100 evenly, in the order written. No effect names a DC: where a roll decides,
# it is a plain die.
THEMED = [
    ("Cosmic Madness", "cosmic", "Under the Open Sky", "You looked up for too long.", {"kind": "dice", "die": 10, "unit": "minutes"}, [
        ("The Scale of Things", "You have just worked out how far away the nearest star is, and the number will not leave you alone.",
         "You are frightened of the open sky and cannot willingly leave cover while you can see it."),
        ("A Colour With No Name", "There is a new colour at the edge of things. It is on your hands as well.",
         "Anything more than 30 feet from you is heavily obscured by it."),
        ("Too Many Corners", "You count the corners of the room twice and get a different number each time.",
         "Your speed is halved, and you have disadvantage on Dexterity saving throws."),
        ("The Slow Voice", "Something very far off is speaking. One word of it takes longer than your whole life, and you are stuck listening to a syllable.",
         "Roll a d6 at the start of each of your turns. On a 1, you are stunned until your next turn starts."),
        ("Seen From Above", "You are watching the top of your own head from a great height.",
         "You cannot be surprised and you have advantage on Wisdom (Perception) checks. Your attack rolls have disadvantage."),
        ("Old Light", "Starlight is thousands of years old by the time it arrives. You start to wonder how old the light from your friends is.",
         "You trust only what you can touch. You have disadvantage on attack rolls against any target more than 5 feet from you, and you cannot target a creature with a spell unless you are touching it."),
        ("The Quiet Is Listening", "It has gone very quiet, the way a room does when someone has stopped to listen at the door.",
         "You will not speak above a whisper, so you cannot cast spells that have a verbal component. You have advantage on Dexterity (Stealth) checks."),
        ("Sums", "Distances, orbits and the weight of the sea go through your head faster than you can write them down. A few of the answers are about the fight you are in.",
         "Once on each of your turns you can add 1d4 to an attack roll, ability check or saving throw you make. You take 1d4 psychic damage each time."),
        ("The Thin Place", "The world here is worn like the elbow of a coat, and you can see what it was covering.",
         "You can see 30 feet into the Ethereal Plane. Everything on your own plane is lightly obscured for you."),
        ("It Looked Back", "You always assumed that whatever is out there had never heard of you.",
         "You have vulnerability to psychic damage. You cannot hide, and creatures within 60 feet of you know where you are even when you are invisible."),
    ]),
    ("Surreal Madness", "surreal", "Waking Dreams", "You woke up, and the dream carried on.", {"kind": "dice", "die": 10, "unit": "minutes"}, [
        ("The Way Out", "The way out of here is through a jar, a boot or a teacup. You only have to find the right one.",
         "At the start of each of your turns, roll a d6. On a 1 or 2, you spend your action trying to climb into the nearest container, whatever its size."),
        ("Borrowed Gravity", "The floor has started to feel like a wall you are leaning against.",
         "You can walk on walls and ceilings at your normal speed with your hands free. If you end your turn on the floor, you fall prone."),
        ("The Clocks Disagree", "Your pulse is running ahead of your footsteps, and the candle flames are a little behind both.",
         "At the start of each of your turns, roll a d6. On a 1 or 2 your speed is halved and you can take an action or a bonus action this turn, but not both. On a 5 or 6 your speed is doubled until the turn ends."),
        ("Wrong Faces", "Your friends have been swapped for people who look just like them. Whoever did it got the ears slightly wrong.",
         "You are never a willing target for another creature's spells or effects. You cannot take the Help action, and nobody can use it on you."),
        ("Birdsong", "People are opening their mouths and making noise. The sparrows are the ones talking sense.",
         "You cannot speak, read or understand any language. You can talk with beasts as if you had cast speak with animals."),
        ("Near and Far", "The far wall is against your shoulder, and your own hand takes a minute's walk to reach.",
         "You have disadvantage on attack rolls against targets within 10 feet of you. Long range does not give you disadvantage on ranged attack rolls."),
        ("Unpainted", "Whoever made this place ran out of paint near the walls, and you would rather not step on the bare patches.",
         "Any space within 5 feet of a wall is difficult terrain for you. You have advantage on saving throws against illusion spells."),
        ("The Joke", "You have just understood the joke. It is about the moon, and you cannot explain it.",
         "Whenever you take damage, roll a d6. On a 1 or 2, you fall prone laughing and cannot stand up until the end of your next turn."),
        ("Your Shadow Goes First", "Your shadow has stopped waiting for you. It walks ahead, looks round the corner and comes back.",
         "You cannot be surprised and you have advantage on initiative rolls. You have disadvantage on Dexterity (Stealth) checks."),
        ("Only a Dream", "You have realised you are asleep, which is a relief, because it means none of this can hurt you.",
         "You are immune to the frightened condition and have advantage on saving throws against being charmed. You cannot take the Dodge or Disengage action."),
    ]),
    ("Occult Madness", "occult", "Forbidden Reading", "You opened the book you were told to leave shut.", {"kind": "fixed", "text": "Until the next dawn:"}, [
        ("The Name", "You know a name you were never taught. It is on your tongue every time you open your mouth.",
         "Whenever you cast a spell that has a verbal component, roll a d6. On a 1 or 2 you say the name instead. The spell fails, the spell slot is not used, and you take 1d6 psychic damage."),
        ("Marked", "A sign came up on your forearm overnight, like a bruise in the shape of writing. It is warm.",
         "Fiends and undead within 60 feet of you know where you are and have advantage on attack rolls against you. You have resistance to necrotic damage."),
        ("The Debt", "Years ago something helped you without being asked. It has been keeping count since then.",
         "Whenever you regain hit points, you regain half as many."),
        ("Candle Sight", "You can read in a dark room now. Daylight hurts.",
         "You have darkvision out to 60 feet and can see invisible creatures within 10 feet of you. In sunlight you have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight."),
        ("The Old Tongue", "You meant to say good morning. What came out was older and a good deal ruder.",
         "Infernal is the only language you can speak, read or write. You have advantage on Charisma (Intimidation) checks."),
        ("The Circle", "You cannot sleep until you have drawn the circle, and you already know every mark that goes in it.",
         "You must spend 10 minutes drawing a circle around yourself before you can take a short or long rest. Inside a circle you drew, you have advantage on saving throws against being charmed or frightened."),
        ("A Second Voice", "When you pray, another voice says the words with you, half a beat late.",
         "Whenever you cast a spell of 1st level or higher, roll a d6. On a 1 the GM picks its targets from those in range. On a 6 the spell is cast as if from a slot one level higher."),
        ("The Hungry Page", "You read one page of it. Since then every scrap of writing looks like it might be the next one.",
         "The first time you see a piece of writing within 30 feet of you, you must use your next action to read it. You have advantage on Intelligence (Arcana) and Intelligence (Religion) checks."),
        ("Salt and Iron", "Your grandmother was right about doorways.",
         "You will not go through a doorway unless there is salt across it or iron in your hand. While you are holding iron, you have advantage on saving throws against being charmed."),
        ("The Offer", "A polite voice offers you help, once, at a price it calls small.",
         "Once, after you roll a d20, you can treat the roll as a 20. If you do, your hit point maximum drops by 2d6 until you finish a long rest."),
    ]),
    ("Societal Madness", "societal", "Under Review", "Your case is being processed. Please wait.", {"kind": "dice", "die": 4, "unit": "days"}, [
        ("The Missing Form", "You were meant to hand in a form before today. Nobody at the desk can tell you which form, or which desk.",
         "You have disadvantage on initiative rolls and you cannot take the Ready action."),
        ("The Number", "They gave you a number at the door. You turn round faster for it now than for your own name.",
         "You cannot say or write your name. You have disadvantage on Charisma saving throws."),
        ("Watched", "Somebody is at every window: the neighbours, the baker, and a pigeon you have seen three times today.",
         "You have advantage on Wisdom (Perception) checks to notice hidden creatures. A short rest does nothing for you if anyone could have seen you taking it."),
        ("Guilty", "The court has found you guilty and will let you know the charge in due course.",
         "You cannot knowingly lie to a guard, an official, a priest or anyone else who speaks with authority. You have disadvantage on saving throws against being charmed or frightened by them."),
        ("The Queue", "There is a queue. You are in it, and people who push in make you feel ill.",
         "You take your turn last in every round of combat. You have advantage on Constitution saving throws to maintain concentration."),
        ("Loyal Citizen", "You read the slogan on the wall this morning and found nothing in it to argue with.",
         "When a creature gives you a spoken order of one or two words, roll a d6. On a 1, 2 or 3 you follow it on your next turn, as if under the command spell. While you are following an order you are immune to the frightened condition."),
        ("Spare Part", "You have seen the list of people who could do your job, and it is long.",
         "You can take the Help action as a bonus action. You do not add your proficiency bonus to Charisma checks."),
        ("Two Truths", "You believe two things that cannot both be true, and it has stopped bothering you.",
         "Magic cannot tell whether you are lying, and you have advantage on Charisma (Deception) checks. You have disadvantage on Wisdom (Insight) checks."),
        ("Awaiting Instructions", "Somewhere a machine is working out what you should do next. It is usually right, so you wait.",
         "When you roll initiative, also roll a d4. On a 1 you must take the Dodge action on your first turn. On a 4 you have advantage on the first attack roll or ability check you make in that combat."),
        ("The Crowd", "Everyone is walking the same way and you are walking with them. You could not say where.",
         "While two or more of your allies are within 10 feet of you, you are immune to the frightened condition. While none are, you have disadvantage on Wisdom saving throws."),
    ]),
    ("Hellenic Madness", "hellenic", "Divine Madness", "A god has taken an interest in you.", {"kind": "fixed", "text": "Until the next sunrise:"}, [
        ("The Flock", "The Goddess of Wisdom has put a mist over your eyes. The men who wronged you are standing right in front of you, bleating.",
         "You take beasts for your enemies. While a beast is within 30 feet of you, you must use your action on each of your turns to attack it."),
        ("The Goad", "Madness herself did not want this errand. The Queen of the Gods sent her anyway, and now you cannot tell your friends from the people you came to kill.",
         "When you make an attack, the GM picks the target at random from the creatures within your reach or range, your allies included. You have advantage on melee weapon attack rolls."),
        ("The Kindly Ones", "Three women with snakes in their hair are following you. Nobody else can see them, and they are in no hurry.",
         "You cannot take a short or long rest. You keep looking behind you, so you cannot be surprised, and you have disadvantage on Wisdom (Perception) checks."),
        ("Two Suns", "There are two suns over the city this morning and two cities under them. The stranger walking ahead of you has horns.",
         "You see double and have disadvantage on attack rolls against targets more than 5 feet from you. The god's strength is in your arms: you have advantage on Strength checks and Strength saving throws."),
        ("Cassandra's Gift", "The God of Prophecy gave you the truth about what is coming. He also arranged that nobody would believe a word of it.",
         "You cannot be surprised and you have advantage on initiative rolls. You have disadvantage on Charisma (Persuasion) checks, and your allies gain nothing from your Help action."),
        ("The Song", "Someone is singing out past the rocks. The song is about you, and it knows things you have told no one.",
         "You are deafened. On each of your turns you must spend at least half your movement going toward the place the song comes from, which the GM chooses."),
        ("Lotus", "You ate the fruit. Home is a word you remember hearing.",
         "You are immune to the frightened condition and have resistance to psychic damage. You cannot take the Dash action, and you have disadvantage on initiative rolls."),
        ("The Gadfly", "The Queen of the Gods has set her fly on you. It drove Io across three continents and it is not tired.",
         "At the start of each of your turns you take 1 piercing damage, and you must move at least 10 feet before the turn ends. Your speed increases by 10 feet."),
        ("The Pool", "You have caught sight of your reflection, and it is the best thing you have seen in years.",
         "If you can see your reflection at the start of your turn, your speed is 0 until your next turn starts. You have advantage on saving throws against being charmed by anyone else."),
        ("The Wrath", "The anger the poets sing about has got into you, the kind that chokes a river with the dead.",
         "You have advantage on melee weapon attack rolls, and attack rolls against you have advantage. You cannot willingly end your turn farther from the nearest enemy than you began it."),
    ]),
]


def themed():
    sets = []
    for name, theme, label, blurb, duration, rows in THEMED:
        size = 100 // len(rows)
        assert size * len(rows) == 100, name
        entries = [{
            "id": f"{theme}-{i + 1}",
            "range": [i * size + 1, (i + 1) * size],
            "title": title,
            "description": description,
            "text": text,
            "outcomes": [],
        } for i, (title, description, text) in enumerate(rows)]
        sets.append({"name": name, "theme": theme, "categories": [{
            "id": theme, "label": label, "blurb": blurb, "duration": duration,
            "die": 100, "subRoll": False, "subDie": 10, "entries": entries,
        }]})
    return sets


def write(name, data):
    target = os.path.join(ROOT, "src", "content", name)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    assert "—" not in text and "–" not in text, "dash in the default text"
    assert not re.search(r"\bDC \d", text), "a DC in the default text: the GM sets it"
    open(target, "w", encoding="utf-8", newline="\n").write(text)
    return target


def main():
    source = json.load(open(os.path.join(ROOT, "source", "follie.it.json"), encoding="utf-8"))
    out = {"name": "Bloodborne Madness", "theme": "gothic", "categories": []}
    for c in source["categories"]:
        label, blurb, duration = CATEGORIES[c["id"]]
        entries = []
        for e in c["entries"]:
            title, description, texts = TEXT[e["id"]]
            assert len(texts) == len(e["outcomes"]), e["id"]
            entries.append({
                "id": e["id"],
                "range": e["range"],
                "title": title,
                "description": description,
                "outcomes": [{"id": o["id"], "range": o["range"], "kind": o["kind"], "text": t} for o, t in zip(e["outcomes"], texts)],
            })
        out["categories"].append({
            "id": c["id"], "label": label, "blurb": blurb, "duration": duration,
            "die": c["die"], "subRoll": c["subRoll"], "subDie": c["subDie"], "entries": entries,
        })
    target = write("defaults.en.json", out)
    entries = sum(len(c["entries"]) for c in out["categories"])
    print(f"{target}: {len(out['categories'])} categories, {entries} entries")
    others = themed()
    print(f"{write('themed.en.json', others)}: {len(others)} sets, {sum(len(x['categories'][0]['entries']) for x in others)} entries")


if __name__ == "__main__":
    main()
