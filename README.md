# Interactive Madness Table

A dramatic roller for any madness table, made for the DM who wants the roll to be a moment at the table. You roll in one window, and your players watch the result arrive on a second screen.

Use it here: https://eosgithub.github.io/interactive-madness-table/

It runs in the browser. There is nothing to install and no account.

## What it does

The DM window is where you play. Pick a table, roll the die (or type in the result of a real one), and if the table uses a second roll, roll that too. Every verdict of the session stays in a list on the side.

The player screen is a second window of the same browser, meant for a TV or a second monitor. It shows the roll and nothing else. The die is a pale moon with the number spinning down on it, then the name of the madness comes out of noise. When the verdict lands, a banner crosses the screen and names it before the effect appears. A bane turns the moon red and sends blood down the edges of the screen. A boon lights it with pale rings.

The DM window has a monitor above the controls that plays the same show, so you see what your players see without turning your head. Under it, "Play it again" restarts the show in every window and "Skip to the end" jumps to the last frame.

If you only have one screen, such as a phone or a tablet on the table, Table mode shows the player view inside the DM window with a small bar of controls under it.

## Your own tables

The tool ships with three tables (short-term, long-term and indefinite madness), 40 entries in all, each with three outcomes: a boon, a neutral manifestation and a bane. They are a starting point. In the Edit tab you can change every title, description, range and outcome, add or remove entries, switch the second roll on or off for each table, and change the dice. The editor tells you when the ranges leave a gap or overlap.

You can keep several sets of tables. The button with the name of the open set, at the top of the DM window, lists them. From there you open another set, start an empty one, start from the defaults, copy the open one, or delete one you no longer need. Each set is saved separately, and editing one leaves the others alone.

A set can be exported to a JSON file and imported again, which is also how you move it to another browser. An imported file is added as a new set and never overwrites the one you have open.

## Staging

In Settings you choose how the show looks: three roll styles (Ratchet, Glitch, Plain), three verdict styles (Flash, Burn, Fade), the speed, film grain, vignette and camera shake. A monitor beside the settings previews each choice, with or without the player screen open. Animations can be turned off entirely, and the tool respects the system's reduced motion setting unless you tell it otherwise.

In the Stage tab you can give any entry or outcome its own sound, image or video, which plays when that result comes up. Sound plays from the DM window, so connect that device to your speakers.

## Where your data lives

Everything stays in your browser. Tables and settings are saved in local storage, and the files you add in the Stage tab are saved in IndexedDB. Nothing is uploaded. Clearing the site data in your browser deletes them, so export your tables if you care about them.

## Limits

The player screen has to be a window of the same browser on the same device as the DM window. Two separate devices cannot be linked.

A browser stops drawing a window that nobody can see: one that is minimised, covered by another window, or in a background tab. The show waits while the player screen is hidden and carries on when it is back in view, and the DM window tells you when that is happening. Keep the player screen on its own monitor, or beside the DM window, if you want both to move together.

An iPhone does not let a web page go full screen. Phones in general only start sound after you have touched the page.

## Keyboard

On the Play screen: `1` to `9` pick a table, `Space` or `R` rolls, `Esc` goes back, `B` blacks out the player screen, `T` opens Table mode. On the player screen, `F` or a double-click toggles full screen. The DM shortcuts can be turned off in Settings.

## Running it yourself

You need Node.js.

```
npm install
npm run dev
```

`npm test` runs the tests and `npm run build` builds the site into `dist/`. The stack is Vite, React, TypeScript and Zustand, with Motion for the interface animations.

The default tables are written in `scripts/build-defaults.py`, which generates `src/content/defaults.en.json`. The design notes are in `PIANO.md`, in Italian.

## Credits

Made by ToolsmithDev. New tools and early builds are on [Patreon](https://www.patreon.com/ToolsmithDev).

The fonts are Cormorant Garamond, by The Cormorant Project Authors, and EB Garamond, by The EB Garamond Project Authors, both under the SIL Open Font License 1.1. The icons are Phosphor Icons, under the MIT License.

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
