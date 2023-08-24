import board
import digitalio
import time
import usb_midi
import adafruit_midi
import adafruit_midi.note_on
import adafruit_midi.note_off

midi = adafruit_midi.MIDI(midi_in=usb_midi.ports[0])

pinLeft = digitalio.DigitalInOut(board.GP20)
pinRight = digitalio.DigitalInOut(board.GP21)
pinExtra = digitalio.DigitalInOut(board.GP19)
pinLeft.direction = pinRight.direction = pinExtra.direction = digitalio.Direction.OUTPUT

def setRelays(state):
    #The incoming value is a bit mask, with bit 1 indicating that left relay should be switched, and bit 2 indicating the next relay
    #Calculate values before assigning to minimise any lag between left and right legs, this is probably not needed but no harm in doing it
    #Note we're inverting the logic state in this calculation too, because we write out a logic 0 to turn the relays on, and a logic 1 to turn them off
    leftSet = (state &  1) == 0
    rightSet = (state & 2) == 0
    extraSet = (state & 4) == 0
    pinLeft.value = leftSet
    pinRight.value = rightSet
    pinExtra.value = extraSet

#Simple test loop to test without Mixxx or any other MIDI input, just change line below to True
if False:
    while True:
        setRelays(7)
        time.sleep(3)
        setRelays(3)
        time.sleep(3)
        setRelays(1)
        time.sleep(3)
        setRelays(0)
        time.sleep(5)
print("Startup, testing relays")
setRelays(7)
time.sleep(0.15)
print("Startup, setting only l&r relays")
setRelays(3)
time.sleep(0.15)
print("Startup, setting only left relay")
setRelays(1)
time.sleep(0.15)
print("Startup, setting relays off")
setRelays(0)

while True:
    #We only really care about "note on" messages, but no harm in printing out a bit of debug info about other messages.
    #Note that we currently use a "note on" message, with a "velocity" of 0 to turn the indication off
    #This seems a bit odd, but the various Mixxx examples indicated this was how most hardware controllers worked
    msg = midi.receive()
    if isinstance(msg, adafruit_midi.note_on.NoteOn):
        print("MIDI Note On: channel=" + str(msg.channel) +", note=" + str(msg.note) + ", velocity=" + str(msg.velocity))
        if msg.channel == 0 and msg.note == 1:
            setRelays(msg.velocity)
    elif isinstance(msg, adafruit_midi.midi_message.MIDIBadEvent):
        print("Bad MIDI Event received")
    elif isinstance(msg, adafruit_midi.midi_message.MIDIUnknownEvent):
        print("Unknown MIDI Event received: " + str(msg.status))
    elif isinstance(msg, adafruit_midi.note_off.NoteOff):
        print("MIDI Note Off, ignoring: channel=" + str(msg.channel) +", note=" + str(msg.note) + ", velocity=" + str(msg.velocity))
    elif msg is not None:
        print("Other type of MIDI message!")
        print(msg.__class__.__module__ + "." + msg.__class__.__qualname__ )
