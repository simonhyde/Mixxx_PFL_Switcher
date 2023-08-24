# Mixxx PFL Switcher
This project contains a pair of simple scripts designed to trigger relays attached to a Raspberry Pi Pico from Mixxx when a PFL control is activated, so that headphone feed can be switched from the output of an analogue audio mixer, to the Mixxx headphone output.

## Installation
Steps 2 & 3 are only necessary if you're building the device yourself. Assembled devices should have already completed this.
1. Plug the Device into your Mixxx PC by USB.
2. If your Pi Pico is brand new, install CircuitPython, by copying the latest release from https://circuitpython.org/board/raspberry_pi_pico/ (this was tested with v8.1.0), onto the USB Mass Storage device the Pi Pico presents. The Pi Pico will reboot as soon as you've finished uploading the file. If you want to rename your MIDI device, see [these suggestions](https://github.com/adafruit/circuitpython/issues/4191) on how to hack this firmware image with a hex editor before uploading it.
3. Once this has been done (or if you already had CircuitPython), copy the contents of this folder onto the new "CIRCUITPY" USB Mass Storage device that appears (and rename the filesystem if you want).
4. The Pi Pico should flash its LED for 1 second, and then load the code, which will cause both relays to go on for 0.15 seconds, then just the left relay for 0.15 seconds, then off. This is a quick indication that it's booted sucesfully. A red LED lights up next to each relay as it is triggered.
5. Locate the 2 files in the `mixxx` folder on the USB Mass Storage device, and copy them to your [Mixxx Controller Mapping Folder](https://github.com/mixxxdj/mixxx/wiki/Controller-Mapping-File-Locations)
6. Fire up Mixxx, and go to Preferences, Controllers, and select the device (either called "Mixxx PFL Switcher" or "CircuitPython Audio"), Enable it, and Load Preset of "Mixxx PFL Switcher" from the mapping files you just copied over.
7. Immediately that this preset loads, you should hear another quick initialisation sequence, with 0.2 seconds for each of:
   1. Left Relay
   2. Right Relay
   3. Both Relays
8. This will repeat every time you start up Mixxx with this controller attached, showing you quickly that it has been detected and the relevant mapping script has been loaded.
9. Now the relays should be drive by the PFL status on Mixxx:
   1. Try turning PFL on a Deck or Sampler with the Headphone icon, and you should see both relays light up.
   2. If you hit play on an item in your library to play it onto the preview deck, this should also trigger the relays to switch
   3. If you instead select the "SPLIT" control for the headphone feeds, only the left relay should switch when PFL/Preview Play is active. This should allow you to listen to Mono PFL in your left ear and mixer out (right leg only!) in your right ear.
10. Now you've tested all this works as expected, it's time to plug some audio up, suggested connections are as follows:
    1. Mixer Headphone Out -> PFL Switcher Normal Input
    2. Mixxx Headphone Out (from a good soundcard) -> PFL Switcher Alternate Input
    3. PFL Switcher Out -> Headphones (it probably makes most sense to do this via a small headphone amp, to give you volume control).

## How it works
### In Mixx
- Scripted MIDI mapping in Mixxx monitors a set of Channels/Decks, Samplers, and Preview Decks.
- On most groups it monitors the status of the PFL button, but Preview Decks seem to always have PFL active, so on these it activates when they're in play.
- If any of these are active the script sends MIDI commands to the Pi Pico to cause it to switch the relays
- Script also monitors the status of the headSplit parameter to know which relays to activate
- Set of monitored groups is listed in arrays at the top of `mixxx-pfl-switcher.js` and can be adjusted to add more or exclude some channels
### MIDI Comms
The device accepts simple 3-byte MIDI commands, of the form:
- 0x90 - MIDI Note On, Channel 0
- 0x01 - Note 1
- 0x0x - Bitmask indicating which relays should be on 1 for left, 2 for right, ie:
  - 0x00 - Both Relays Off
  - 0x01 - Left Relay only On
  - 0x02 - Right Relay only On
  - 0x03 - Both Relays On
### Pi Pico
- CircuitPython code which loops around polling for MIDI input, and enables GPOs 20 (left) and 21 (right) to cause the relays to close, as instructed by the host.

## Changing the code
You can tweak the code that runs on the Pi (in `code.py`), but more likely to be insteresting is tweaking the Mixxx-end script in `mixxx-pfl-switcher.js`. Changes people may want to look at:
- Only switching headphones when PFL is selected on a channel *and* it's playing.
- Adding a small (100ms?) delay before switching the relays off, so that you don't get a brief off/on again as you play different items on the Preview list.

The Pi Pico will perform a soft reboot every time you save a file to it, reloading its code.

## Notes on very cheap onboard headphone outputs
When experimenting with a very cheap onboard headphone out, I found odd noise introduced onto the other outputs, presumably via weird crosstalk through the ground, so these are probably best avoided. These problems could probably be mitigated by adding a 3rd relay to also switch grounds instead of commoning them between all inputs/outputs and not allowing split headphones.

## Building your own
### Parts
The basic parts are just:
1. A Raspberry Pi Pico (or compatible)
2. A cheap 2-channel relay board, 5V powered, able to trigger off 3.3V logic (eg the 2-channel version of https://www.aliexpress.com/item/33038634587.html which turns relays on with a signal between 0 and 1.2V, and off at higher voltages)
3. 4 lengths of jumper wire
4. If you want to be posh:
    1. A project box to put it in
    2. Jack sockets or RCA sockets to attach to the outside of the box
    3. Some audio wire to connect the sockets to the relays
    4. Some M2 screws/nuts to secure the boards down.
### Wiring
1. Connect 4 jumper wires from your Pi Pic to your Relay board:
    - VBUS (Pi) - VCC (Relay Board)
    - GND (Pi) - GND (Relay Board)
    - GP20 (Pi) - In1 (Relay Board)
    - GP21 (Pi) - In2 (Relay Board)
2. Connect together the grounds of all audio inputs/outputs
3. Connect all left channel inputs to Relay 1, and right channel to Relay 2:
    - NC (Normally Closed) (Relay) - Normal (Audio In)
    - COM (Common) (Relay) - Out (Audio Connector)
    - NO (Normally Open) (Relay) - Alternate (Audio In)
