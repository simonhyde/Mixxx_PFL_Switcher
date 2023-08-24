import usb_hid
#Don't present a USB HID device which we're not using
print("Disabling HID device, we don't use it...")
usb_hid.disable()

