# Interactive Madness Table

A dramatic roller for any madness table. As the DM you roll in one window, and your players watch the result arrive on a second screen.

Use it here: https://eosgithub.github.io/interactive-madness-table/

It runs in the browser. There is nothing to install and no account.

## What it does

The DM window is where you play. Pick a table, roll the die (or type in the result of a real one), and if the table uses a second roll, roll that too. A table with one roll gives the effect straight away.

The player screen is a second window of the same browser, meant for a TV or a second monitor. It shows the roll and nothing else. In the Gothic theme the die is a pale moon with the number spinning down on it, then the name of the madness comes out of noise. When the verdict lands, a banner crosses the screen and names it before the effect appears. A bane turns the moon red and sends blood down the edges of the screen. A boon lights it with pale rings.

The DM window has a monitor above the controls that plays the same show, so you see what your players see without turning your head. Under it, "Play it again" restarts the show in every window and "Skip to the end" jumps to the last frame.

If you only have one screen, such as a phone or a tablet on the table, Table mode shows the player view inside the DM window with a small bar of controls under it.

## Themes

Every set of tables has a theme, which says what kind of madness it is about. The theme changes the colours and the lettering of the DM window, and what the player screen shows.

| Theme | What drives someone mad | On the player screen |
|---|---|---|
| Cosmic | Reality is too vast for the mind. | An eclipse with its corona, among slow stars. A bane pulls the stars toward the centre. |
| Gothic | The past, desire and decay poison the individual. | A moon in falling ash. A bane turns it red and blood runs down the glass. |
| Surreal | Reality stops obeying logic. | An eye that floats like a balloon, among coloured bubbles. A bane turns it green and ink runs up from the floor. |
| Occult | Forbidden knowledge corrupts. | A circle with a seven-pointed star, among embers. A bane sets fire along the bottom edge. |
| Societal | The world is mad and the individual follows. | A file card with a case number, under a scan line. A bane stamps it red and strikes bars across the screen. |
| Hellenic | A god sends the madness, as a punishment or for sport. | A gorgon from a painted cup, in falling gold dust. A bane turns it purple and wine runs down the glass. |
| D&D | Horrors and alien planes wear the mind down, by the rules of the fifth edition. | The dragon ampersand, among sparks. A bane turns it green and acid runs down the glass. |

You pick the theme of the open set in the Edit tab, under its name.

## Your own tables

The tool ships with seven sets, one for each theme. Gothic Madness, the Gothic one, has three tables (short-term, long-term and indefinite madness) and 40 entries in all, each with three outcomes on a second roll: a boon, a neutral manifestation and a bane. Five other sets have one table of ten entries each on a d100, with no second roll: the entry itself carries the effect. The Hellenic one takes its madnesses from Greek epic and tragedy: Ajax and the flock, the madness of Heracles, the Furies, the Sirens. The gods go by their titles and are never named. D&D Madness is the three madness tables of the fifth edition (short-term, long-term and indefinite), 34 entries with one roll each and the effects as the SRD 5.1 words them. Apart from that set, no table names a DC. Where an effect calls for a saving throw, you set the DC. The defaults are a starting point: in the Edit tab you can change every title, description, range and outcome, add or remove entries, switch the second roll on or off for each table, and change the dice. The editor tells you when the ranges leave a gap or overlap.

You can keep several sets of tables. The button with the name of the open set, at the top of the DM window, lists them. From there you open another set, start an empty one, start from one of the defaults, copy the open one, or delete one you no longer need. Each set is saved separately, and editing one leaves the others alone.

A set can be exported to a JSON file and imported again, which is also how you move it to another browser. An imported file is added as a new set and never overwrites the one you have open.

## Staging

In Settings you choose how the show moves: three roll styles (Ratchet, Glitch, Plain), the speed, film grain, vignette and camera shake. A monitor beside the settings plays a roll style as soon as you pick it, with or without the player screen open. Animations can be turned off entirely, and the tool respects the system's reduced-motion setting unless you tell it otherwise.

In the Stage tab you can give any entry or outcome its own sound, image or video, which plays when that result comes up. Sound plays from the DM window, so connect that device to your speakers.

## Where your data lives

Everything stays in your browser. Tables and settings are saved in local storage, and the files you add in the Stage tab are saved in IndexedDB. Nothing is uploaded. Clearing the site data in your browser deletes them, so export your tables if you care about them.

## Limits

The player screen has to be a window of the same browser on the same device as the DM window. Two separate devices cannot be linked.

A browser stops drawing a window that nobody can see: one that is minimised, covered by another window, or in a background tab. The show waits while the player screen is hidden and carries on when it is back in view, and the DM window tells you when that is happening. Keep the player screen on its own monitor, or beside the DM window, if you want both to move together.

An iPhone does not let a web page go full screen. Phones in general only start sound after you have touched the page.

## Keyboard

On the Play screen: `1` to `9` pick a table, `Space` or `R` rolls, `Esc` goes back, `T` opens Table mode. On the player screen, `F` or a double-click toggles full screen. The DM shortcuts can be turned off in Settings.

## Running it yourself

You need Node.js.

```
npm install
npm run dev
```

`npm test` runs the tests and `npm run build` builds the site into `dist/`. The stack is Vite, React, TypeScript and Zustand, with Motion for the interface animations.

The default tables are written in `scripts/build-defaults.py`, which generates the two files in `src/content/`. The design notes are in `PIANO.md`, in Italian.

## Licence

The source code and the default tables are under the PolyForm Noncommercial License 1.0.0, in `LICENSE.md`. You can use the tool, read the code, change it and share it for any noncommercial purpose. The fonts, the icons, the images and the SRD 5.1 material keep the licences listed under Credits. The tables you write in the tool are yours.

## Credits

Made by ToolsmithDev. New tools and early builds are on [Patreon](https://www.patreon.com/ToolsmithDev).

The fonts are Bodoni Moda, Geist, EB Garamond, Josefin Sans, Fraunces, IM Fell English, Special Elite, Cinzel and Libre Baskerville, each by its own project authors and all under the SIL Open Font License 1.1. The icons are Phosphor Icons, under the MIT License.

The face of the moon is a photograph of the near side of the Moon by NASA/GSFC/Arizona State University, taken by the Lunar Reconnaissance Orbiter. It is in the public domain.

The corona in the Cosmic theme is a photograph of the total solar eclipse of 21 August 2017 by NASA/Carla Thomas (`2017 Total Solar Eclipse (AFRC2017-0233-007).jpg` on Wikimedia Commons), in the public domain. The eye in the Surreal theme is cut from Odilon Redon's lithograph "The Eye, Like a Strange Balloon, Mounts toward Infinity" (1882), from the copy at the Art Institute of Chicago by way of Wikimedia Commons, also in the public domain. The gorgon in the Hellenic theme is the inside of an Attic black-figure cup by the Leagros Group (Paris, Cabinet des Médailles 322), photographed by Bibi Saint-Pol (`Gorgoneion Cdm Paris 322.jpg` on Wikimedia Commons), in the public domain.

The dragon ampersand in the D&D theme is cut from the logo of the fifth edition of Dungeons & Dragons (`Dungeons & Dragons 5th Edition logo.svg` on English Wikipedia). It is not in the public domain and no licence covers it here: Dungeons & Dragons, D&D and the dragon ampersand are trademarks of Wizards of the Coast LLC. This tool is not affiliated with, endorsed or sponsored by Wizards of the Coast.

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
