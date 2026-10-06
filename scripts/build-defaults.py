"""Builds the table sets the app ships with, one for each theme.

src/content/defaults.en.json is the Gothic set, "Gothic Madness". Its
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
    "short-term-1": ("The Unmade Self", "Everything you knew about who you are drops out of your mind.", [
        "There is no self left in you to win over. You cannot be charmed: you are immune to the charmed condition.",
        "You take on the speech, posture and habits of the creature that was closest to you when the madness struck.",
        "Anything that offers to return you to yourself has your trust. Every saving throw you make against being charmed fails automatically.",
    ]),
    "short-term-2": ("The Sound of the Cosmos", "The roar of the cosmos has moved into your skull.", [
        "No sound can harm you after the noise you carry in your head. Thunder damage does nothing to you: you are immune to it.",
        "You hear whispers at the back of your mind, and voices pass close behind you when no one is near.",
        "The world goes silent under the roar of the cosmos. You are deafened, and saving throws you make to maintain concentration have disadvantage.",
    ]),
    "short-term-3": ("Splintered Sight", "You have seen more than a mind can keep, and your eyes can no longer be trusted.", [
        "You see more than you did before, as though the see invisibility spell were on you.",
        "Pale figures move at the corner of your eye and vanish as soon as you look at them.",
        "You are blinded. Special senses such as blindsight or tremorsense do not let you see either.",
    ]),
    "short-term-4": ("The Haunting Screams", "The madness leaves you through your throat.", [
        "Your scream can wound. On each of your turns you can use a bonus action to scream at a creature within 30 feet that you can see. If the creature can hear you, it makes a Constitution saving throw. It takes 1d12 thunder damage if it fails, and half as much if it succeeds.",
        "Normal speech is beyond you. You can make yourself understood only by screaming.",
        "When you speak, your screams reach every creature within 300 feet. Coherent sentences are beyond you, and so are the verbal components of spells.",
    ]),
    "short-term-5": ("Folding Posture", "While you struggle to understand what you are looking at, your body goes limp.", [
        "Your limp body bends away from blows. When an attack targets you, or an effect that calls for a Dexterity saving throw, you can use your reaction to sway aside. Until the start of your next turn you have +1 to AC and advantage on Dexterity saving throws.",
        "You curl up like a scared child and search for a protector, anyone who could stand in for a parent. When you have found one, you hold on to them and stay at their side no matter what happens.",
        "Your legs stop obeying you. You fall prone and cannot get up, and any flying speed you have is no use to you.",
    ]),
    "short-term-6": ("Blasphemous Hands", "You see your hands for what they are, tools of blasphemy.", [
        "Tools like these can shatter a mind. Once per turn, when a melee weapon attack of yours hits a creature, you can deal 1d8 psychic damage to it on top of the rest.",
        "You will not use your hands, and you hide them from view. When someone looks at them for long, you become nervous and defensive.",
        "You cannot bear to touch anything. Whatever you are holding falls from your hands, and you cannot hold objects or grapple creatures.",
    ]),
    "short-term-7": ("The Failing Body", "The madness is more than your body can carry.", [
        "Poison finds almost nothing left in you to spoil. The poisoned condition cannot affect you: you are immune to it.",
        "A stench comes off you that makes even you feel ill. Neither washing nor magic gets rid of it.",
        "Your own body works against you. You are poisoned, and being immune to the condition does not protect you.",
    ]),
    "short-term-8": ("Horrors Revealed", "You are shown the horrors from beyond, and fear swallows you.", [
        "Your face carries a trace of what you saw. When this madness comes over you, every creature within 30 feet of you makes a Wisdom saving throw, and on a failure it is frightened of you for 1 minute. A frightened creature makes the save again at the end of each of its turns, and a success ends the effect for it.",
        "Every sound and every movement makes you start, because you are certain something is on its way.",
        "The horrors look out at you from the faces of your allies, and you are frightened of your allies. On each of your turns you must take the Dash action and get away from them by the fastest route, unless you have nowhere to go. If none of them is in sight when your turn starts, you can use your action to end the madness.",
    ]),
    "short-term-9": ("The Broken Mind", "Your mind breaks in half under the madness.", [
        "Your body moves more freely without your mind in the way. On each of your turns you get one additional action, and you can use it only to Dash, Disengage, Hide, or Use an Object.",
        "Laughter bursts out of you with no warning, usually at the worst moment it could.",
        "You are incapacitated. Taking damage equal to twice your level ends the effect early, and so does a greater restoration spell cast on you.",
    ]),
    "short-term-10": ("Revelations from Beyond", "Truths from beyond push their way into your mind.", [
        "Only the truth you were shown matters now, and your body pays no attention to pain. You cannot be stunned: you are immune to the stunned condition.",
        "You talk to others about the truth you were shown. To you it could not be plainer, and to anyone who has not seen it your words are riddles.",
        "The truth pins you in place. You are stunned. Taking damage equal to your level ends the effect early, and so does a greater restoration spell cast on you.",
    ]),
    "short-term-11": ("The Beast Stirs", "The beast in you opens its eyes and tries to take the reins.", [
        "No mind holds your body back from its animal instincts. The haste spell takes effect on you. It needs no concentration and stays until the madness ends.",
        "You slur your words like a drunk, and animal sounds come out between one sentence and the next.",
        "Your mind puts everything it has into stopping you from turning into a beast, and you fall unconscious. Taking damage equal to your level ends the effect early, and so does a greater restoration spell cast on you.",
    ]),
    # ------------------------------------------------------------- long-term
    "long-term-1": ("The Weakened Body", "The corruption has eaten the strength out of you.", [
        "Your frail body gets knocked out of harm's way. Every time you take damage, it pushes you back 10 feet.",
        "You get tired fast, and any effort takes a heavy toll. A long rest takes you 4 hours more than usual to finish.",
        "Your legs can hardly hold you up. Every time you take damage, you fall prone.",
    ]),
    "long-term-2": ("Magic from Beyond the Grave", "A magic that is not of this world stirs in you.", [
        "Touching the beyond has left you with a gift. You learn one cantrip from the warlock spell list, picked at random, and you cast it with Charisma as your spellcasting ability.",
        "This world's magic sickens you. Every time you cast a spell or have one cast on you, you gag and stumble, and your reaction is gone until the start of your next turn.",
        "The new magic is more than you can hold in, and it spills out when you are wounded. When a single attack deals 15 or more damage to you, arcane force bursts from you. You and every creature within 10 feet of you make a Constitution saving throw, and those who fail take 2d10 force damage. After that it cannot happen again for 1d6 rounds.",
    ]),
    "long-term-3": ("Shattered Self-Worth", "Whatever you thought you were worth falls to pieces.", [
        "Paranoia has you watching everything and everyone, to protect what little you still have. Add 1d4 to every Perception or Insight check you make.",
        "You are gloomy and bitter, and in every conversation you put yourself down.",
        "Feeling useless seeps into all you do and erodes the skill you once had. Subtract 1d4 from every ability check you make.",
    ]),
    "long-term-4": ("Power Without Measure", "You no longer have any idea how strong you are.", [
        "You do not know where your limits are, so you go beyond them. Every time you deal damage, roll the smallest damage die used once more and add it.",
        "Your own strength is a mystery to you. Your handshake either crushes or hangs limp, your hugs are no better, and every physical task is a matter of luck.",
        "You are afraid of pulling yourself to pieces, and you hold back without wanting to. Every time you deal damage, roll the smallest damage die used once more and subtract it, to a minimum of 0.",
    ]),
    "long-term-5": ("The Truth Unveiled", "You are shown the truth that lies behind the world.", [
        "You are able to take it in. The GM picks one Intelligence skill at random. You become proficient in it, and checks you make with it add double your proficiency bonus.",
        "The beyond holds your interest like nothing else. Whenever you notice or hear of something otherworldly, you leave whatever you were doing to investigate it and get nearer to it, in body or in some other way.",
        "The revelations keep calling, pressing you to learn more and to become more. Your saving throws against madness have disadvantage.",
    ]),
    "long-term-6": ("Burning Nerves", "Your nerves burn under the madness until little is left of them.", [
        "You are past the reach of pain. You cannot be stunned, and the only thing that knocks you unconscious is dropping to 0 hit points.",
        "What is left of your nerves itches all the time. Only bare metal against your skin stops the itch, for as long as it touches you.",
        "The pain does not stop, and you cannot concentrate or fight as well as you could. Your Armor Class no longer includes your Dexterity modifier, and your Dexterity checks and Dexterity saving throws have disadvantage.",
    ]),
    "long-term-7": ("Powers from Beyond", "Powers from beyond seize you and grow into your flesh.", [
        "You master them. Your Constitution saving throws to maintain concentration have advantage. Also, when you fail a saving throw, you can decide that you succeed instead. If you do, roll again on the long-term table and take on a new effect.",
        "While you try to make sense of what is now part of you, you come adrift from the world around you. Nothing near you feels real, and you jump whenever something touches you.",
        "The new powers are more than you can carry, and they wear your mind down. Your Intelligence, Wisdom, and Charisma checks have disadvantage, and so do your Constitution saving throws to maintain concentration.",
    ]),
    "long-term-8": ("The Faltering Heart", "Your heart stumbles, because a reality like this should not be possible.", [
        "Your pulse races and keeps you sharp. Your passive Wisdom (Perception) score and your initiative rolls go up by 3.",
        "Anything unexpected is too much for you. Every time you are surprised, you scream as loudly as you can. If it happens in combat, you fall unconscious until the start of your next turn.",
        "Your heart grows weak. You gain one level of exhaustion, and nothing removes it until the madness ends. Every time you become frightened you gain another level, and that one can be removed in the normal way.",
    ]),
    "long-term-9": ("Scars of Madness", "You tried to keep the madness away and failed, and your body bears the marks.", [
        "Your skin has grown thick with scar tissue. Your AC goes up by 1.",
        "You are covered in scars far past ugly, and most people are afraid of them, children most of all. You have +2 to Intimidation checks and -2 to Persuasion checks.",
        "Much of your body is covered in deep scars that tear open whenever you are struck. Every time you take bludgeoning, piercing, or slashing damage, you take 1d6 more damage of the same type.",
    ]),
    "long-term-10": ("Rotting Flesh", "The influence is too strong for your body, which starts to rot.", [
        "Your mind makes peace with the rot in your body and is glad of it, since everything decays in the end. The poisoned condition cannot affect you: you are immune to it.",
        "You can feel the rot inside you and it makes you sick. Your disgust never lifts, and every time you smell something foul you have to spend your action retching.",
        "Dreadful wounds open across your body. Every 24 hours your hit point maximum goes down by 1, and you die if it reaches 0. Once every 24 hours, during a long rest, you or another creature can tend the wounds with a Wisdom (Medicine) check. The wounds heal after five successes.",
    ]),
    "long-term-11": ("The Beast Unleashed", "The beast in you opens its eyes and takes the reins.", [
        "You keep most of your humanity, though enough of the beast breaks free. Your Dexterity saving throws have advantage. Each of your hands turns into a claw. While a hand is empty you can use its claw as a weapon that deals 1d6 slashing damage on a hit. Once on each of your turns, when you take the Attack action and attack with a claw, you can make one more claw attack as part of that action.",
        "Your body is altered, and something of your old shape is still there. The GM chooses an animal, and you take on its features. If this change has already happened to you, count this result as a 10 and apply that outcome instead.",
        "Your body turns into a beast or monstrosity that the GM chooses. Its challenge rating is half your level, rounded up. In every other way the change follows the rules of the polymorph spell, with one exception: when you drop to 0 hit points you fall unconscious and do not return to your own form.",
    ]),
    # ------------------------------------------------------------ indefinite
    "indefinite-1": ("Chained to Vice", "Existence hurts and means nothing, so you find something to numb it and rely on it heavily.", [
        "A bad habit you already have, such as drink or drugs, takes control, and you come to depend on it. If you have none, you start drinking. Your attack rolls, saving throws, and ability checks take a -3 penalty. While you are under the influence, you also have +3 to saving throws against being frightened and against further madness.",
        "You take large doses of something to numb the pain of being alive. You pick up the vice that suits you best: promiscuity, drugs, drink, or smoking. Unless you indulge at least twice every 24 hours, you subtract 1d6 from your Wisdom saving throws until you do.",
        "You try drink, drugs, and every other vice, and not one of them has any effect on you now. Your body rejects whatever you take before it can work, and any carnal thought disgusts you.",
    ]),
    "indefinite-2": ("Ever Worse", "Life is bad, and each day it gets worse.", [
        "Each failure pulls another one after it. After any ability check, attack roll, or saving throw that you fail, your next one has disadvantage.",
        "The world feels rotten to you, and you rely only on what has worked in the past. You flatly refuse anything you had not tried before the madness took you, whether it is a new spell, a new feature, or a new tavern.",
        "Maybe you were promising once, but that was a long time ago. All your skill proficiencies are gone, and on the skills you used to be proficient in you take a penalty equal to your proficiency bonus. Features that add a bonus to a check, such as Expertise or Jack of All Trades, stop working for you.",
    ]),
    "indefinite-3": ("Hatred of the Flesh", "Your own body becomes hateful to you.", [
        "This madness lies hidden until you have been alone with a blade for 10 seconds or more. Then a fit of rage takes you, and you cut off one of your limbs and destroy it.",
        "You wrap yourself in layers of clothing and will not let anyone see an inch of your skin. From the moment you notice that your skin is exposed until you cover it again, your ability checks and attack rolls have disadvantage.",
        "Your soul might do better to leave this miserable body behind. When you drop to 0 hit points, you begin with two failed death saving throws, and every death saving throw you make after that fails automatically.",
    ]),
    "indefinite-4": ("No Way to Bear It", "Strain is more than you can handle now.", [
        "Every time you are under strain, rage takes you. You attack the source of the strain without restraint until it is dead or you are knocked unconscious. The GM decides when you are under strain.",
        "You have no defence against fear. Every saving throw you make against being frightened fails automatically, and no effect can make you immune to fear.",
        "In any tense or social situation you withdraw into yourself. Your Charisma and Dexterity checks have disadvantage, and any swagger you once had is gone.",
    ]),
    "indefinite-5": ("Blistered Eyes", "The truth appears before you, and your eyes blister at the sight.", [
        "You lose your sight, and it does not come back for as long as this madness lasts.",
        "The Ethereal Plane is visible to you, and the Material Plane no longer is. For creatures and objects on the Material Plane, you count as blinded.",
        "Your eyes turn dark and light becomes unbearable. In bright sunlight or moonlight, your attack rolls have disadvantage, and so do your Perception checks that rely on sight.",
    ]),
    "indefinite-6": ("The Call of Pain", "Your nerves catch fire under the madness, and your mind starts to crave pain.", [
        "A part of you begs to be harmed. Your saving throws against effects that deal damage have disadvantage, and attack rolls against you have advantage. In exchange, your saving throws against effects that deal no damage have advantage, because your mind finds such effects unworthy of its attention.",
        "When you take more than 20 damage in one turn, the pain breaks out of you as psychic force. You and every creature within 30 feet of you make an Intelligence saving throw, and those who fail take 3d10 psychic damage. Your own save has disadvantage.",
        "You are drawn to death. When you can see a creature that is unconscious at 0 hit points, you feel the urge to finish it, and you must spend your turn trying to kill it.",
    ]),
    "indefinite-7": ("Ways of Coping", "Strange powers from beyond get a grip on you, and you manage in whatever way you can.", [
        "One object you own becomes your fixation. Unless it is exactly as it should be at all times, you get no peace. For as long as it is out of order, your ability checks and attack rolls have disadvantage.",
        "At first nothing happens. (The rest is for the GM only.) The next time you fall unconscious in battle, the event leaves a scar on your mind. If you meet the same enemy in battle again while this madness lasts, you are cursed. While you are cursed, you make a Wisdom saving throw every time you finish a long rest. If you fail, your mind goes back over its failures again and again, and the rest gives you no benefit.",
        "You develop an odd phobia, of long words, of the dark, or of something else in your life. Decide with the GM which one fits your character.",
    ]),
    "indefinite-8": ("The Lying Heart", "Your heart refuses a reality like this, and it stops being honest about it.", [
        "Your hold on what is real slips. You see people who are not there and hear sounds nobody made. It happens in battle too, where the field fills with enemies that do not exist. At the start of each of your turns you make a Wisdom saving throw. If you fail, you must use your action to attack a target that the GM chooses.",
        "Lying becomes a compulsion. Every time you try to tell the truth, you make a Wisdom saving throw. If you fail, you lie, even when it works against you.",
        "Small valuables are more than your hands can resist. When you notice one, you make a Wisdom saving throw. If you fail, you try to steal something nearby, whatever the consequences.",
    ]),
    "indefinite-9": ("Nerves and Mind Adrift", "Your nerves and your mind start slipping out of your control.", [
        "Your senses grow so sharp that they hurt, and you are lost in the flood of them. Any ability check that relies on sight, hearing, smell, taste, or touch has disadvantage for you, and so do your Wisdom saving throws.",
        "Your grip on where you are loosens, and at the worst moments you teleport a short way, 10 to 60 feet. When and where is up to the GM.",
        "Every creature within 60 feet of you hears your thoughts. You cannot keep a secret from those creatures, and you cannot surprise them.",
    ]),
    "indefinite-10": ("The Body Rewritten", "Your body changes, and none of the changes help you.", [
        "One kind of harm becomes agony to you: fire, cold, lightning, acid, poison, or thunder. You are vulnerable to that damage type, and any resistance or immunity you had to it is gone.",
        "You draw lightning the way a rod does. Any lightning within 120 feet of you, and any effect there that deals lightning damage, bends toward you and strikes you as well. Every saving throw you make against an effect that deals lightning damage fails automatically.",
        "You lose all your body hair, and your body can no longer keep itself warm or cool. Your saving throws against extreme cold and extreme heat have disadvantage, as do those against disease and poison. Any resistance to poison damage you had is gone.",
    ]),
    "indefinite-11": ("Reality Askew", "Your body no longer takes reality in the right way.", [
        "You blink in and out of the world, and parts of you slip through objects and creatures. Every attack you make and every spell you cast has a 50 percent chance of slipping into the Ethereal Plane, where it passes through its targets and does them no harm.",
        "Distances deceive you, and things seem closer or farther away than they are. Your ranged attack rolls have disadvantage, and so do your Perception checks that rely on sight.",
        "For you time runs unevenly, and it stretches or bunches up with no warning. Your initiative rolls have disadvantage. At the start of each of your turns, roll a d6 to learn what you can do. On 1-2, you get only one of these: an action, a bonus action, or movement. On 3-4, you get movement and either an action or a bonus action. On 5-6, you take a normal turn.",
    ]),
    "indefinite-12": ("Tricks of the Mind", "Your mind begins to tell you false things about yourself.", [
        "You become much too confident and run risks you have no need to run. Before you try anything cautious or well reasoned, you make a Wisdom saving throw. If you fail, you act on impulse.",
        "You are convinced that you are a god, a royal, or some other great figure. When you deal with other people, your Wisdom and Charisma checks have disadvantage.",
        "You are convinced that you belong to another people. Their native tongue is the only language you can speak, and unless that tongue is Common you can no longer speak Common. If you never knew their language, you make sounds that resemble it and mean nothing.",
    ]),
    "indefinite-13": ("Past All Restraint", "All restraint leaves you, and your body does what it likes in any company.", [
        "Every time you roll initiative, you begin to dance. At the start of each of your turns you make a Constitution saving throw, and a success stops the dance for that turn. If you fail, you go on dancing, as with the irresistible dance spell.",
        "Helpless laughter seizes you at the least suitable moments, and speaking or focusing becomes hard. While you concentrate on a spell, you make a Wisdom saving throw at the start of each of your turns, and you lose concentration if you fail. Your Stealth checks also have disadvantage.",
        "Your hunger has no bottom. When you come across food, however foul, rancid, or plainly abominable, you make a Wisdom saving throw, and you eat it if you fail.",
    ]),
    "indefinite-14": ("Hatred Beyond Reason", "A hatred bigger than you are gets hold of you.", [
        "The hatred develops a will of its own. A second personality forms in you, and it tries to destroy everything you care for and to feed everything you despise.",
        "The GM chooses one creature, object, or situation, and you come to hate it beyond reason. When you meet it, you make a Wisdom saving throw. If you fail, you are hostile toward it for 1 hour, or until it is out of your sight or destroyed.",
        "You take pleasure in the idea of betrayal. When you are about to make an attack and more than one creature is in its range, roll a d20. On a 10 or lower, the attack goes at another creature chosen at random instead of the one you meant.",
    ]),
    "indefinite-15": ("The Strange Body", "Your body begins doing things it should not.", [
        "Your muscles lose track of which were the strong ones and which the quick ones. Swap your Strength score with your Dexterity score.",
        "You are sure that you have a serious illness, and it may or may not be real. Your Constitution checks and Constitution saving throws have disadvantage.",
        "Your body carries on though it is no longer alive. Your creature type is now undead, and magical healing does nothing for you.",
    ]),
    "indefinite-16": ("The Wound in the Mind", "What you went through stays lodged in your mind.", [
        "Nightmares pursue you and you wake exhausted. When you finish a long rest with fewer than 2 levels of exhaustion, you wake with 2.",
        "The GM chooses one kind of creature, and it fills you with intense fear. If such a creature is within 10 feet of you on your turn, you must spend your movement and your action to Dash away from it. Creatures of that kind make opportunity attacks against you with advantage.",
        "The horrors you saw tie up your tongue and throat. You cannot speak or make any sound at all, and that rules out the verbal components of spells.",
    ]),
    "indefinite-17": ("The Call from Beyond", "Something on the other side is calling you.", [
        "Every shape of the moon calls to you. Saving throws caused by lunar effects, direct or indirect, have disadvantage for you, and your ability checks about lunar lore have advantage.",
        "You follow the call and attempt to ascend, and the attempt fails. Your speed is halved, and teleporting is no longer possible for you. If something teleports you against your will, the banishment spell for example, you take 3d10 force damage as the cosmos collects what it is owed from your flesh.",
        "You follow the call, and your ascension succeeds by half. Your creature type is now aberration. You have resistance to psychic damage and advantage on saving throws against telepathy. All your empathy is gone, and your Insight and Persuasion checks have disadvantage. You also understand Deep Speech, and your saving throws against charm effects that come from aberrations have disadvantage.",
    ]),
    "indefinite-18": ("The Beast Triumphant", "The beast in you opens its eyes and takes control.", [
        "The beast chews at your mind, and only by staying alert can you keep it down. Every time you fall unconscious, roll 1d2. On a 1, your mind loses its hold, and when you next wake the beast controls your body. The GM controls you from then until you fall unconscious again. In that time the chaotic evil beast inside you looks for other beasts and tries to drive you out of your own body. On a 2, you wake with your sanity kept or restored.",
        "Your body is altered, and something of your old shape is still there. You take on the features of an animal, and they are permanent. Decide with the GM which features suit your character. Only a wish spell can undo the change. If this change has already happened to you, count this result as a 10 and apply that outcome instead.",
        "You turn into a beast or monstrosity that the GM chooses. Its challenge rating is half your level, rounded up. Your mind is lost, and you are a creature under the GM's control.",
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
    out = {"name": "Gothic Madness", "theme": "gothic", "categories": []}
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
