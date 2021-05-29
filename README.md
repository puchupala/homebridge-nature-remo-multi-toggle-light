# Homebridge Nature Remo Multi Toggle Light

This plugin enables Homebridge to control toggle light through [Nature Remo](https://en.nature.global/) IR blaster.

Many ceiling lights in Japan use a single button to toggle between multiple states (e.g. On/Nightlight/Off).
This plugin keep track of the light state so that it could be controlled by Homebridge. In other words, multiple ON-ON or OFF-OFF trigger in a row wouldn't confuse the light.

The state of the light is kept inside Homebridge so if you control the light outside of Homebridge (e.g. physical remote, Nature Remo app), it will be out-of-sync.
To avoid the issue, please connect all of your assistants (e.g. Google Assistant, Alexa) to Homebridge instead of using native Nature Remo app.

I tested the plugin with Nature Remo 3 but it should supports any model so long as they use the same [Nature Remo Cloud API](https://developer.nature.global/en/overview).

IMPORTANT: The light must be added to Nature Remo as "Other" appliance. Native "Light" appliance is not (yet) supported.

![20210528_180311000_iOS_resized](https://user-images.githubusercontent.com/22722/120071555-f027d080-c0ca-11eb-86cc-f88216c109c0.png)
