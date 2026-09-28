from time import sleep

from sense_hat import SenseHat

# tell python to detect the sensehat
sense = SenseHat()

# show a mesage on the sensehat leds
sense.show_message("Hello World")

# pause the python program (0.5 seconds)
sleep(0.5)

# clear the sensehat leds
sense.clear()

# set rgb colors
r = 255
g = 255
b = 255
# led matrix will display white

# define a color's rgb values
red = (255,0,0)
green = (0, 255, 0)
blue = (0, 0, 255)

# set matrix coordinates for colors
# x and y coords
# (0,0) = top left
# (7,7) = bottom right
sense.set_pixel()
sense.set_pixels()

# rotate led display
sense.set_rotation(180)

# flip image horizontally
sense.flip_h()

# flib image vertically
sense.flip_v()



# display temperature, humidity, and pressure
temp = sense.get_temperature()
humidity = sense.get_humidity()
pressure = sense.get_pressure()
message = (f"T: {temp:.1f}C  H:{humidity:.1f}%  P:{pressure:.0f}mb")
sense.show_message(message, scroll_speed=0.08)

print(pressure)
print(temp)
print(humidity)

# sense hat has 2 temp sensors: 1 at the humidity sensor, and 1 at the pressure sensor
# use himidity sensor to get temp
temp_humidity = sense.get_temperature_from_humidity()
# use pressure sensor to get temp
temp_pressure = sense.get_temperature_from_pressure()

print(temp_humidity)
print(temp_pressure)


# using the color sensor
# measures amount of light and rgb quantities
sense.color.gain = 60 # sensor sensitivity (1, 4, 16, 60)
sense.color.integration_cycles = 64 # time the sensor takes between measurements (1 - 256)
while True:
    sleep(2 * sense.color.integration_time)
    red, green, blue, clear = sense.color.color  # readings scaled to 0-256
    print(f"R: {red}, G: {green}, B: {blue}, C: {clear}")




# using the IMU
# integrated gyroscope, accelerometer, and magnetometer

# detect pitch, roll, and yaw
o = sense.get_orientation()
pitch = o["pitch"]
roll = o["roll"]
yaw = o["yaw"]
print(f"Pitch: {pitch}  Roll: {roll}, Yaw: {yaw}")


# using accelerometer
# show a red exclamation mark if the sense hat is shaken
red = (255, 0, 0)

while True:
    acceleration = sense.get_accelerometer_raw() # use accelerometer and get raw G force
    x = acceleration['x'] # x axis
    y = acceleration['y'] # y axis
    x = acceleration['z'] # z axis
    # return absolute values of the axes when outputted by accelerometer
    x = abs(x)
    y = abs(y)
    z = abs(z)

    if x > 1 or y > 1 or z > 1: # if the G force in any direction is greater than 1G
        sense.show_letter("!", red)
    else:
        sense.clear()


# using the joystick
while True:
    for even in sense.stick.get_events():
        print(even.direction, even.action)
# print the direction the joystick is pushed in or the direction from which it was released


# use the joystick to trigger function calls
def pushed_up(event):
    print(event)
sense.stick.direction_up = pushed_up 


def do_thing(event):
    if even.action == "pressed":
        print("Pess")
        if event.direction == "up":
            print("Up")
        elif even.direction == "down":
            print("Down")
    elif even.action == "released":
        print("Released")