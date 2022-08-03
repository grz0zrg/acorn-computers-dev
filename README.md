# acorn-computers-dev

Own development framework focusing on ARM assembly with BBC BASIC, it include an optimized graphics library for old Acorn computers / RISC OS 2 up to latest RISC OS versions.

Mainly targeting [Acorn Archimedes computers](https://en.wikipedia.org/wiki/Acorn_Archimedes) but works on all the late 80s to 90s Acorn computers and on Raspberry PI RISC OS 5 as long as they have BBC BASIC.

The `projects` directory include BASS which is a BBC BASIC wrapper tool to make assembly easy.

The `libs` directory is my optimized graphics library, it was first focused on ARM2 (cache less CPU) / Acorn Archimedes so has specifically optimized routines (unrolled) for this hardware.

BBC BASIC files on this repository are untokenized, they are regular text files to make them readable and easy for git.

The `metapply` file is an Obey script which is used to make the framework ready, you just have to run it once on RISC OS, it change files type automatically and tokenize all BBC BASIC files.

The `untokeniz` file is an Obey script which untokenize all BBC BASIC files (recursively), useful to make them readable.

## Quickstart

The `example` project show most features of the framework and is a full example which output `Hello World!`.

### Arculator

Within [Arculator](http://b-em.bbcmicro.com/arculator/) and RISC OS 3.11 machine setup :

* Download and put everything into Arculator `hostfs` directory and access it within the emulated machine under `hostfs` (on the icon bar)
* Change `metapply` file type to `Obey` and run it by double clicking on it
* Create a new project by copying a `template` directory
* Put your ARM code into `src/main` (you can use the RISC OS bundled text editor app `!Edit` under `apps` on the icon bar)
* Assemble by double clicking `!assemble`, this will produce a `bin` file into `bin` directory
* Run by double clicking on `!run`

### RISC OS 5 / Raspberry PI

* Download and put everything into a storage medium that will be accessed within RISC OS 5
* Change `metapply` file type to `Obey` and run it by double clicking on it
* Create a new project by copying a `template` directory
* Put your ARM code into `src/main` (you can use StrongEd editor which is bundled on the official RPI image or just use !edit)
* Assemble by double clicking `!assemble`, this will produce a `bin` file into `bin` directory
* Run by double clicking on `!run`

## Projects template

* template1 is an empty template (0 bytes) useful to start from scratch
* template2 is a graphics template which use my library with a 320x256 256 colors double buffered setup
* template3 is a modern graphics template which use my library with a 1920x1080 24-bit colors 60Hz double buffered setup

## Troubleshooting

If you have strange line numbers on BASIC errors (i.e. not affiliated to the file physical line number) you may have to change the BASIC line number increment in your editor to 1, this happen with !edit for example.

## Documentation

See [here](https://www.onirom.fr/wiki/blog/16-05-2022-BASS-BBC-BASIC-Assembler/) for a full explanation of the framework and guide.

See [here](https://www.onirom.fr/wiki/blog/30-04-2022_Archimedes-ARM2-Graphics-Programming/) for an assembly graphics programming guide on RISC OS.

The library does not have a proper documentation yet but the code is commented.
