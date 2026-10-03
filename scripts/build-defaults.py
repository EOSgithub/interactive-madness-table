"""Builds src/content/defaults.en.json, the tables the app ships with.

Structure (ids, ranges, kinds) comes from source/follie.it.json, the author's
Italian tables. The English text is below, keyed by entry id: a title, a
description, and one text per outcome in the order of the source.

    python scripts/build-defaults.py
"""
import json
import os

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
        "Your scream is loud enough to wound. As a bonus action on each of your turns, you can scream at a creature you can see within 30 feet. If it can hear you, it makes a DC 13 Constitution saving throw, taking 1d12 thunder damage on a failure or half as much on a success.",
        "You cannot speak normally. Screaming is the only way you can make yourself understood.",
        "Every creature within 300 feet hears you when you speak. You cannot form coherent sentences or provide the verbal components of spells.",
    ]),
    "short-term-5": ("Folding Posture", "Your body gives way while you try to make sense of what is in front of you.", [
        "You become hard to pin down. When you are targeted by an attack or by an effect that calls for a Dexterity saving throw, you can use your reaction to weave aside, gaining +1 to AC and advantage on Dexterity saving throws until the start of your next turn.",
        "You look for someone to protect you, a parent of any kind. Once you find them you cling to them and will not leave their side, whatever happens.",
        "You fall prone and cannot stand, because your legs will not answer, and you cannot use any flying speed you have.",
    ]),
    "short-term-6": ("Blasphemous Hands", "You understand what your hands are: instruments of blasphemy.", [
        "Such instruments can break a mind. Once per turn, when you hit a creature with a melee weapon attack, you can deal an extra 1d8 psychic damage to it.",
        "You refuse to use your hands and keep them out of sight. If anyone stares at them you grow uneasy and defensive.",
        "You must not touch anything. You drop whatever you are holding, and you cannot hold objects or grapple creatures.",
    ]),
    "short-term-7": ("The Failing Body", "Your body buckles under the weight of the madness.", [
        "You are immune to the poisoned condition.",
        "You give off a foul smell that sickens even you, and no amount of washing or magic removes it.",
        "You are poisoned, even if you are immune to the condition.",
    ]),
    "short-term-8": ("Horrors Revealed", "The horrors beyond show themselves to you, and fear closes over your head.", [
        "When you gain this madness, each creature within 30 feet of you must succeed on a DC 13 Wisdom saving throw or be frightened of you for 1 minute. A frightened creature repeats the save at the end of each of its turns, ending the effect on a success.",
        "You flinch at every movement and every sound, sure that something is coming.",
        "You are frightened of your allies. On each of your turns you must take the Dash action and move away from them by the fastest route, unless there is nowhere to go. If you start your turn where you can see none of them, you can use your action to end the madness.",
    ]),
    "short-term-9": ("The Broken Mind", "The madness snaps your mind in two.", [
        "Your mind was holding your body back. You have one additional action on each of your turns, which you can use only to Dash, Disengage, Hide, or Use an Object.",
        "You burst out laughing without warning, most often at the worst possible moment.",
        "You are incapacitated. The effect ends early if you take damage equal to twice your level or if greater restoration is cast on you.",
    ]),
    "short-term-10": ("Revelations from Beyond", "Revelations from beyond press in on you.", [
        "Your body ignores pain, because only the truth you were shown matters. You are immune to the stunned condition.",
        "You tell others about the truth you were shown. It is perfectly clear to you and cryptic to anyone who has not seen it.",
        "You are stunned. The effect ends early if you take damage equal to your level or if greater restoration is cast on you.",
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
        "Your heart weakens, literally. You gain one level of exhaustion that cannot be removed until the madness ends. Whenever you become frightened, you gain another level, which can be removed as normal.",
    ]),
    "long-term-9": ("Scars of Madness", "Your useless attempts to hold the madness off have left their marks on your body.", [
        "Scar tissue thickens your skin. You gain +1 to AC.",
        "The scars that cover you are beyond ugly and frighten most people, children above all. You gain +2 to Intimidation checks and take -2 to Persuasion checks.",
        "Deep scars cover much of your body. Whenever you take bludgeoning, piercing, or slashing damage, you take an extra 1d6 damage of that type.",
    ]),
    "long-term-10": ("Rotting Flesh", "Your body cannot withstand the influence and begins to rot.", [
        "Your mind accepts that your body will rot, and welcomes it. Everything withers sooner or later. You are immune to the poisoned condition.",
        "The rot inside you turns your stomach. You feel constant disgust, and whenever you smell something foul you must spend your action retching.",
        "Terrible wounds open in your flesh. Your hit point maximum drops by 1 every 24 hours, and if it reaches 0 you die. During a long rest, you or another creature can tend the wounds with a DC 16 Medicine check, once every 24 hours. After five successes the wounds heal.",
    ]),
    "long-term-11": ("The Beast Unleashed", "The beast inside you wakes and takes the reins.", [
        "Most of your humanity stays, but enough of the beast gets loose. You have advantage on Dexterity saving throws. Each of your hands becomes a claw that you can use as a weapon while it is empty, dealing 1d6 slashing damage on a hit. Once on each of your turns, when you attack with a claw using the Attack action, you can make one additional claw attack as part of the same action.",
        "Your body changes, though a trace of what you were remains. You take on the features of an animal, chosen by the GM. If you have already been changed this way, use the next outcome on this table instead.",
        "Your body becomes a beast or monstrosity of the GM's choice, with a challenge rating equal to half your level, rounded up. The change otherwise follows the rules of the polymorph spell, except that when you drop to 0 hit points you fall unconscious instead of returning to your own form.",
    ]),
    # ------------------------------------------------------------ indefinite
    "indefinite-1": ("Bound to the Bottle", "You lean hard on substances to bear the pointlessness of a painful existence.", [
        "If you have a bad habit, such as drink or drugs, it takes over and you become dependent on it. If you have none, you take to drink. You take a -3 penalty to attack rolls, saving throws, and ability checks. While under the influence, you also gain +3 to saving throws against being frightened and against further madness.",
        "You dose yourself heavily to dull the pain of living. You develop whichever vice suits you best: promiscuity, drugs, drink, or smoking. If you do not indulge at least twice every 24 hours, you subtract 1d6 from Wisdom saving throws until you do.",
        "Drugs, drink, and every other vice stop working on you. Your body throws out whatever you take before it can act, and any carnal thought disgusts you.",
    ]),
    "indefinite-2": ("Ever Worse", "Life is bad and it is only getting worse.", [
        "Whenever you fail an ability check, attack roll, or saving throw, you have disadvantage on your next one.",
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
        "You automatically fail saving throws against being frightened, and no effect can make you immune to fear.",
        "Whenever a situation is tense or social, you close in on yourself. You have disadvantage on Charisma and Dexterity checks, and whatever swagger your character had is gone.",
    ]),
    "indefinite-5": ("Blistered Eyes", "Your eyes blister as the truth shows itself to you.", [
        "You go blind, and your sight does not return while this madness lasts.",
        "You can see into the Ethereal Plane but no longer into the Material Plane. You are blinded with regard to creatures and objects on the Material Plane.",
        "Your eyes darken and you cannot stand the light. In bright sunlight or moonlight, you have disadvantage on attack rolls and on Perception checks that rely on sight.",
    ]),
    "indefinite-6": ("The Call of Pain", "The madness sets your nerves alight, and your mind begins to ask for pain.", [
        "Something in you cries out to be hurt. You have disadvantage on saving throws against effects that deal damage, and attack rolls against you have advantage. In return, you have advantage on saving throws against effects that deal no damage, which your mind considers beneath you.",
        "Whenever you take more than 20 damage in one turn, your body bursts with psychic force. You and each creature within 30 feet of you must succeed on an Intelligence saving throw or take 3d10 psychic damage. You have disadvantage on this save.",
        "Death fascinates you. Whenever a creature you can see is unconscious at 0 hit points, you feel the urge to finish it, and you must use your turn trying to kill it.",
    ]),
    "indefinite-7": ("Ways of Coping", "Strange powers from beyond take hold of you, and you cope however you can.", [
        "You fix on one object you own. If it is not exactly as it should be at all times, it gnaws at your peace of mind. While it is out of order, you have disadvantage on ability checks and attack rolls.",
        "Nothing happens at first. (The rest is for the GM only.) The next time you fall unconscious in battle, the event scars you. If you meet that enemy in battle again while under this madness, you are cursed. While cursed, when you finish a long rest you make a DC 12 Wisdom saving throw. On a failure your mind keeps returning to its failures, and you gain no benefit from the rest.",
        "You develop a strange phobia: of long words, of the dark, or of something else in your life. Work out with the GM which one suits your character.",
    ]),
    "indefinite-8": ("The Lying Heart", "Your heart falters. A reality like this cannot truly exist.", [
        "You lose your grip on what is real. You see people who are not there and hear sounds that were never made, in battle too, where enemies that do not exist crowd the field. Make a DC 18 Wisdom saving throw at the start of each of your turns. On a failure, you must use your action to attack a target of the GM's choice.",
        "You lie compulsively. Whenever you try to tell the truth, make a DC 18 Wisdom saving throw. On a failure you lie, even against your own interest.",
        "You cannot keep your hands off small valuables. When you notice one, make a DC 18 Wisdom saving throw. On a failure you try to steal something nearby, whatever the consequences.",
    ]),
    "indefinite-9": ("Nerves and Mind Adrift", "You begin to lose control of your nerves and your mind.", [
        "Your senses sharpen until they hurt. Lost in the noise of them, you have disadvantage on any ability check that relies on sight, hearing, smell, taste, or touch, and on Wisdom saving throws.",
        "You teleport a short way, 10 to 60 feet, at the worst moments. The GM decides when and where.",
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
    "indefinite-12": ("Tricks of the Mind", "Your mind starts to play tricks on you and feeds you illusions.", [
        "You grow far too sure of yourself and take needless risks. Before you attempt anything cautious or well reasoned, make a DC 18 Wisdom saving throw. On a failure, you act on impulse.",
        "You believe you are a god, a royal, or some other great figure. You have disadvantage on Wisdom and Charisma checks when dealing with others.",
        "You believe you belong to another people. You can speak only their native tongue, and if that is not Common you lose the ability to speak Common. If you never knew their language, you make sounds that resemble it and mean nothing.",
    ]),
    "indefinite-13": ("Unruly Chaos", "You turn against all company and become chaos and madness in person.", [
        "Whenever you roll initiative, you start to dance. At the start of each of your turns, make a DC 18 Constitution saving throw to stop for that turn. On a failure you keep dancing, as with the irresistible dance spell.",
        "Fits of helpless laughter take you at the least fitting moments, and it is hard to speak or to focus. If you are concentrating on a spell, you must succeed on a DC 15 Wisdom saving throw at the start of each of your turns or lose concentration. You also have disadvantage on Stealth checks.",
        "You are ravenous. You must succeed on a DC 15 Wisdom saving throw or eat whatever food you come across, however foul, rancid, or plainly abominable.",
    ]),
    "indefinite-14": ("Hatred Beyond Reason", "A hatred greater than you takes hold.", [
        "You develop a second personality that tries to destroy everything you care for and to feed everything you despise.",
        "You conceive an irrational hatred for one creature, object, or situation chosen by the GM. When you meet it, you must succeed on a DC 15 Wisdom saving throw or turn hostile toward it for 1 hour, or until it is out of your sight or destroyed.",
        "The thought of betrayal delights you. Whenever more than one creature is in range of an attack you are about to make, roll a d20. On a 10 or lower, you target another creature at random instead of the one you meant.",
    ]),
    "indefinite-15": ("The Strange Body", "Your body starts to behave in odd ways.", [
        "Your Strength and Dexterity scores are swapped.",
        "You are convinced you have a grave illness, which may or may not be real. You have disadvantage on Constitution checks and Constitution saving throws.",
        "Your creature type becomes undead. Magical healing has no effect on you.",
    ]),
    "indefinite-16": ("The Wound in the Mind", "What you lived through lodges in your mind.", [
        "Nightmares hound you and leave you worn out. If you have fewer than 2 levels of exhaustion when you finish a long rest, you wake with 2.",
        "You develop an intense fear of one kind of creature, chosen by the GM. If you are within 10 feet of such a creature on your turn, you must use your movement and your action to Dash away from it. Creatures of that kind have advantage on opportunity attacks against you.",
        "The horrors you saw bind your tongue and throat. You cannot speak or make any sound, including the verbal components of spells.",
    ]),
    "indefinite-17": ("The Call from Beyond", "Something beyond is calling you back.", [
        "The moon calls to you in all its shapes. You have disadvantage on saving throws caused by lunar effects, direct or indirect, and advantage on ability checks about lunar lore.",
        "Your ascension fails. Your speed is halved, and you can no longer teleport. If you are teleported against your will, for example by the banishment spell, you take 3d10 force damage as the cosmos takes its due from your flesh.",
        "Your ascension half succeeds. Your creature type becomes aberration. You gain resistance to psychic damage and advantage on saving throws against telepathy, but you lose all empathy and have disadvantage on Insight and Persuasion checks. You also understand Deep Speech and have disadvantage on saving throws against charm effects that come from aberrations.",
    ]),
    "indefinite-18": ("The Beast Triumphant", "The beast inside you wakes and takes over.", [
        "The beast gnaws at your mind, and you must stay alert to hold it back. Whenever you fall unconscious, roll 1d2. On a 1, your mind loses its hold, and the next time you wake the beast is in control of your body. Until you fall unconscious again, the GM controls you, while the chaotic evil beast inside you seeks out other beasts and tries to drive you out of your own body. On a 2, you keep or regain your sanity when you wake.",
        "Your body changes, though a trace of what you were remains. You take on the features of an animal for good; decide with the GM which ones suit your character. Nothing short of a wish spell can undo the change. If you have already been changed this way, treat this result as a 10 and apply that outcome instead.",
        "You become a beast or monstrosity of the GM's choice, with a challenge rating equal to half your level, rounded up, and your mind is lost. You are a creature under the GM's control.",
    ]),
}


def main():
    source = json.load(open(os.path.join(ROOT, "source", "follie.it.json"), encoding="utf-8"))
    out = {"name": "Madness Tables", "categories": []}
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
    target = os.path.join(ROOT, "src", "content", "defaults.en.json")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    assert "—" not in text and "–" not in text, "dash in the default text"
    open(target, "w", encoding="utf-8", newline="\n").write(text)
    entries = sum(len(c["entries"]) for c in out["categories"])
    print(f"{target}: {len(out['categories'])} categories, {entries} entries")


if __name__ == "__main__":
    main()
