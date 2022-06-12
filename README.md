# acorn-computers-dev

Own development framework (including ARM2 library) for old Acorn computers and related

Mainly targeting [Acorn Archimedes computers](https://en.wikipedia.org/wiki/Acorn_Archimedes), probably works on all the late 80s to 90s Acorn computers and on Raspberry PI RISC OS (didn't test) as long as they have BBC BASIC.

The projects directory include BASS which is my BBC BASIC assembler framework, it is made for coding on the hardware or in an emulator like Arculator. See [here](https://www.onirom.fr/wiki/blog/16-05-2022-BASS-BBC-BASIC-Assembler/) for a full explanation and guide.

The libs directory is my ARM2 library mainly targeting Acorn Archimedes. (probably works for any Acorn computers and modern RISC OS)

*.ffb are tokenized BBC BASIC files, they are runnable / editable directly on Arculator emulator hostfs folder due to the extension. On the hardware you will likely want to change the filetype to BBC BASIC.

## Quickstart

Within [Arculator](http://b-em.bbcmicro.com/arculator/) and RISC OS 3.11 machine setup :

* Download and put everything into Arculator `hostfs` directory and access it within the emulated machine under `hostfs` (on the icon bar)
* Create a new project by copying a `template` directory (template1 is an empty template, template2 is a graphics template which use my library with a 320x256 256 colors double buffered setup)
* Put your ARM code into `src/main` (you can use the RISC OS bundled text editor app `!Edit` under `apps` on the icon bar)
* Assemble by double clicking `!assemble`, this will produce a `bin` file into `bin` directory
* Run by double clicking on `!run`

The `example` project show most features of the framework and is a full example which output `Hello World!`.