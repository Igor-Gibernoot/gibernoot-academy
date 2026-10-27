# `feedback-loop`
A thermostat-controlled room (`js/widgets/feedback-loop.js`, plain SVG + HTML, all wording from the config): a time
plot (fixed axes, the window scrolls after `duration`) of the room temperature (blue), the sensed temperature (dashed
blue, only with a delay), the setpoint (orange dashed), the outside temperature (purple) and the heater on/off
(gold shading). Physics, fixed step `dt` (deterministic): $T \mathrel{+}= dt\,[-\text{leak}\,(T-T_{\text{out}}) + \text{power}\cdot\text{heater}]$.
`mode: onoff`: the heater is on when the sensed temperature is below setpoint $-$ band/2, off above setpoint + band/2,
unchanged in between (hysteresis); the sensed value is $T$ from `delay` minutes ago (sensor lag, shows overshoot).
`mode: open`: no sensing; the heater is fixed (`heater: on|off`) and a button toggles it. Controls: Run/Pause, Reset,
speed (x1, x2, x4), sliders for setpoint and outside (live; the lines record the changes), preset buttons.
Config: `mode`, `setpoint` (21), `outside` (5), `temp0` (15), `heater`, `delay` (0, minutes), `band` (0), `leak` (0.04),
`power` (0.8), `dt` (0.5), `duration` (120), `range` ([0,30], fixed), `unit`, `decimals`, `showSetpoint`, `showOutside`,
`showHeater` (shading), `showSensed` (default: only if delay > 0), `readouts` (list from `room, sensed, setpoint,
outside, error, heater`; `[]` = none; error = setpoint $-$ sensed), `sliders` (list from `setpoint, outside`; `[]` = none),
`setpointRange`, `outsideRange`, `legend`, `speed: false`, `speedInit`, `heaterButton: false`, `autoplay`,
`presets: [{label, setpoint, outside, heater, temp0, mode, delay, band}]` (reset the run with those values),
`labels: {room, sensed, setpoint, outside, error, heater, on, off, time, run, pause, reset, speed, slideSetpoint,
slideOutside, heaterToggle}`. Reports nothing to the card. Example: `{mode: onoff, setpoint: 21, outside: 5}`;
overshoot: add `delay: 8, band: 2`.
