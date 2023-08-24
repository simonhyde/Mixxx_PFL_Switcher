var PflSwitcher = {};

PflSwitcher.debugging = false;

//These groups are sources where we want to minitor for the PFL button, and switch when it's pressed
PflSwitcher.pflGroups = [
    '[Channel1]',
    '[Channel2]',
    '[Channel3]',
    '[Channel4]',
    '[Channel5]',
    '[Channel6]',
    '[Channel7]',
    '[Channel8]',
    '[Channel9]',
    '[Channel10]',
    '[Sampler1]',
    '[Sampler2]',
    '[Sampler3]',
    '[Sampler4]',
    '[Sampler5]',
    '[Sampler6]',
    '[Sampler7]',
    '[Sampler8]',
    '[Sampler9]',
    '[Sampler10]',
    '[Sampler11]',
    '[Sampler12]',
    '[Sampler13]',
    '[Sampler14]',
    '[Sampler15]',
    '[Sampler16]',
    '[Sampler17]',
    '[Sampler18]',
    '[Sampler19]',
    '[Sampler20]',
];
//And on these (which seem to be permanently PFL active), switch whenever they're in play
PflSwitcher.pflOnPlayGroups = [
    '[PreviewDeck1]',
    '[PreviewDeck2]',
    '[PreviewDeck3]',
    '[PreviewDeck4]',
    '[PreviewDeck5]',
    '[PreviewDeck6]',

]

PflSwitcher.buttonCache = {};

PflSwitcher.recalcState = function()
{
    print("pfl-switcher: recalculating state")
    var bContinue = true
    for(k in this.buttonCache)
    {
        print("pfl-switcher: checking " + k + ": " + this.buttonCache[k])
        if(bContinue && this.buttonCache[k])
        {
            //Sends a bit mask to the controller, indicating which relays to switch, 0x01 for left leg, 0x02 right or 0x03 both
            if(this.split)
            {
                //If we're split, left leg only
                midi.sendShortMsg(0x90, 1, 0x01);
            }
            else
            {
                //Otherwise both legs (0x02 & 0x01)
                midi.sendShortMsg(0x90, 1, 0x03);
            }
            bContinue = false
            //Only need to hang around and do all the remaining loop iterations if we want to print them out for debug
            if(!this.debugging)
            {
                return
            }
        }
    }
    if(bContinue)
    {
        //No PFL button found active, switch both relays off
        midi.sendShortMsg(0x90, 1, 0x00);
    }
}

//Triggered when PFL button state changes (or play button for pflOnPlayGroup channels), update cache of states and recalculate MIDI state...
PflSwitcher.pflButtonCallback = function(value, group, control) {
    this.buttonCache[group] = value;
	this.recalcState();
}

//Triggered when the "split" headphones button state changes, update cache and recalc state
PflSwitcher.headSplitCallback = function(value, group, control) {
    this.split = value;
    this.recalcState();
}


//Basically just a test run at startup, toggles through the relays to show it's connected
PflSwitcher.initTimer = function()
{
    this.initTimerState++;
    print("pfl-switcher: toggling relays at startup: " + this.initTimerState);
    if(this.initTimerState > 3)
    {
        this.recalcState();
        engine.stopTimer(this.initTimerId);
        return;
    }
    midi.sendShortMsg(0x90, 1, this.initTimerState);
}

PflSwitcher.init = function (id, debugging) {
    this.debugging = debugging
    print("pfl-switcher: initialising");
    //First load the Groups we want to monitor PFL on, then those we want to monitor play on
    var groupList = this.pflGroups;
    var control = 'pfl';
    for (var j = 0; j < 2; j++)
    {
        for (var i = 0; i < groupList.length; i++) {
            chan = groupList[i]
            print("pfl-switcher: Registering: " + chan);
            this.buttonCache[chan] = engine.getValue(chan, control)
            engine.makeConnection(chan, control, this.pflButtonCallback)
        }
        //For these groups we only care about the 'play' status, not PFL
        groupList = this.pflOnPlayGroups;
        control = 'play'
    }
    this.split = engine.getValue('[Master]', 'headSplit')
    engine.makeConnection('[Master]', 'headSplit', this.headSplitCallback)
    this.recalcState()
    //Timer to twiddle the relays for a bit to show this script has connected and is running...
    this.initTimerState = 0
    this.initTimerId = engine.beginTimer(200, this.initTimer, false)
}

PflSwitcher.shutdown = function() {
   // turn off switch on shutdown
   midi.sendShortMsg(0x90, 1, 0x00);
}