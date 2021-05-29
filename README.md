# Homebridge Nature Remo Multi Toggle Light

This plugin enables Homebridge to control toggle light through [Nature Remo](https://en.nature.global/) IR blaster.

Many ceiling lights in Japan use a single button to toggle between multiple states (e.g. On/Nightlight/Off).
This plugin keep track of the light state so that it could be controlled by Homebridge. In other words, multiple ON-ON or OFF-OFF trigger in a row wouldn't confuse the light.

The state of the light is kept inside Homebridge so if you control the light outside of Homebridge (e.g. physical remote, Nature Remo app), it will be out-of-sync.
To avoid the issue, please connect all of your assistants (e.g. Google Assistant, Alexa) to Homebridge instead of using the native Nature Remo app.

I tested the plugin with Nature Remo 3 but it should support any model so long as they use the same [Nature Remo Cloud API](https://developer.nature.global/en/overview).

## Features

* ON/OFF light state
* Configurable toggle count for switching light state
* Configurable delay between each toggling
* Dummy brightness, hue, color temperature, and satuaration settings

## Config

![Homebridge_E481](https://user-images.githubusercontent.com/22722/120080546-7278ba80-c0f4-11eb-9fa8-dd1da32e92b5.png)

## Installation

Just search for "Nature Remo" from the plugin tab of Homebridge web interface.
You can also install the plugin via the command-line.

```$ npm install @puchupala/homebridge-nature-remo-multi-togglelight -g```

## Important Note

The light must be added to Nature Remo as "Other" appliance. Native "Light" appliance is not (yet) supported.

![20210528_180311000_iOS_resized](https://user-images.githubusercontent.com/22722/120071555-f027d080-c0ca-11eb-86cc-f88216c109c0.png)
