# Landroid Card

[![HACS][hacs-image]][hacs-url]
[![Buy Me A Coffee][buymeacoffee-image]][buymeacoffee-url]
![Latest release][latest-url]
![All releases][downloads]
![Latest release][downloads_latest]

> 🌿 Landroid mower card for [Home Assistant][home-assistant] Lovelace UI

<!-- ![Preview of landroid-card][preview-image] -->

![Live preview of landroid-card][preview-gif]

## Requirements

- [Landroid Cloud][landroid-cloud] integration **version 4 or above**.
- To view sensor values, you must enable them in the device settings — most are disabled by default.

## Installation

### Landroid Cloud

First, you need to install the **Landroid Cloud** integration.

Install [using HACS][hacs] or [follow this guide][landroid-cloud].

### HACS

Just click this button to add the repository to HACS:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Barma-lej&repository=landroid-card&category=plugin)

**Or** you can manually add this repository to your HACS installation. [Here is the manual process][hacs-add-repo].

<details><summary>Manual</summary>

> **_Do not use this method if you have already installed the card via HACS!_**

If you prefer not to use HACS, you can manually install the card:

1. Download all `js` files from the [latest release][downloads_latest].
2. Place them into your `config/www` folder.
3. Add a reference to `landroid-card.js` in Lovelace. There are two ways to do this:
   1. **Using the UI:**
      - Navigate to the Resources page by following the link below:
        [![Open your Home Assistant instance and show your resources.][dashboard-resources-img]][dashboard-resources]

        Or go to **Settings** → **Dashboards** → click the three dots in the top right corner and choose **Resources**.

      - Click the **Plus** button.
      - Set _URL_ to `/local/landroid-card.js`.
      - Set _Resource type_ to `JavaScript Module`.

      **Note:** If you do not see the Resources tab, you need to enable _Advanced Mode_ in your _User Profile_.

   2. **Using YAML:** Add the following code to the `lovelace` section:

      ```yaml
      resources:
        - url: /local/landroid-card.js
          type: module
      ```

4. Add `custom:landroid-card` to Lovelace UI as you would with any other card (using either the editor or YAML configuration).

</details>

## Usage

This card can be configured using the Lovelace UI editor.

1. In Lovelace UI, click the three dots in the top left corner.
2. Click _Configure UI_.
3. Click the **Plus** button to add a new card.
4. Find _Custom: Landroid Card_ in the list.
5. Choose an `entity`.
6. You should now see a preview of the card! 🎉

> **Note:** `actions`, `shortcuts`, and `stats` are not yet supported in the visual editor — use the YAML/Code editor for these options.

The visual editor is organized into tabs: **General**, **Battery** 🔋, **Info** ℹ️, **Statistics** 📊, and **Settings** ⚙️.

A typical example of using this card in YAML configuration:

```yaml
type: custom:landroid-card
entity: lawn_mower.mower
image: default
image_size: '4'
show_animation: true
show_edgecut: true
show_status: true
show_toolbar: true
shortcuts:
  - name: Notification
    icon: mdi:bell
    action:
      action: perform-action
      perform_action: automation.toggle
      target:
        entity_id: automation.mower_notify_status
stats:
  default:
    - entity_id: sensor.mower_blades_total_on_time
      subtitle: Total blade time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | round(0) | string) }}'
    - entity_id: sensor.mower_blades_current_on_time
      subtitle: Current blade time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | round(0) | string) }}'
    - entity_id: sensor.mower_total_worktime
      subtitle: Work time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | round(0) | string) }}'
    - entity_id: sensor.mower_distance_driven
      value_template: '{{ (value | float(0) / 1000) | round(3) }}'
      unit: km
      subtitle: Distance
  mowing:
    - entity_id: sensor.mower_yaw
      subtitle: Yaw
      unit: °
    - entity_id: sensor.mower_roll
      subtitle: Roll
      unit: °
    - entity_id: sensor.mower_pitch
      subtitle: Pitch
      unit: °
```

Here is an explanation of each option:

| Name              |   Type    | Default                | Description                                                                                                               |
| ----------------- | :-------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`            | `string`  | `custom:landroid-card` | Type of the card — must be `custom:landroid-card`                                                                         |
| `entity`          | `string`  | **Required**           | An `entity_id` within the `lawn_mower` domain                                                                             |
| `camera`          | `string`  | Optional               | An `entity_id` within the `camera` domain, for streaming the live Landroid camera                                         |
| `camera_refresh`  | `integer` | `5`                    | Update interval for the camera in seconds                                                                                 |
| `image`           | `string`  | `default`              | Path to an image of your mower. Use `png` or `svg` formats for best results                                               |
| `image_size`      | `integer` | `4`                    | Image size — an integer from 1 to 8, where each unit equals 50 px (e.g., `2` → 100 px)                                    |
| `image_left`      | `boolean` | `false`                | Show the image on the left side                                                                                           |
| `show_animation`  | `boolean` | `true`                 | Show image animation while mowing or returning                                                                            |
| `show_edgecut`    | `boolean` | `true`                 | Show the edgecut button on the toolbar                                                                                    |
| `show_name`       | `boolean` | `false`                | Show the friendly name of the mower                                                                                       |
| `show_status`     | `boolean` | `true`                 | Show the current status of the mower                                                                                      |
| `show_toolbar`    | `boolean` | `true`                 | Show the toolbar with action buttons                                                                                      |
| `compact_view`    | `boolean` | `false`                | Use a compact view without an image                                                                                       |
| `settings_card`   | `object`  | Optional               | List of configuration entities shown when the ⚙️ button is clicked at the bottom of the card. Leave empty to use defaults |
| `battery_card`    | `object`  | Optional               | List of entities shown when the 🔋 button is clicked at the top right corner of the card. Leave empty to use defaults     |
| `info_card`       | `object`  | Optional               | List of entities shown when the 🛜 button is clicked at the top left corner of the card. Leave empty to use defaults      |
| `statistics_card` | `object`  | Optional               | List of entities shown when the ⌚ button is clicked at the top middle of the card. Leave empty to use defaults           |
| `stats`           | `object`  | Optional               | Custom per-state stats displayed below the mower image                                                                    |
| `actions`         | `object`  | Optional               | Override default toolbar button actions with custom service calls                                                         |
| `shortcuts`       | `object`  | Optional               | List of custom shortcut buttons shown at the bottom right of the card                                                     |

### `battery_card`, `info_card`, `statistics_card` objects

Defines which configuration entities are shown when the ⚙️ button is clicked at the bottom of the card. You can find the available entities in your device's **Configuration** section.

```yaml
settings_card:
  - switch.mower_party_mode
  - switch.mower_locked
  - number.mower_raindelay
  - number.mower_time_extension
  - number.mower_torque
  - select.mower_current_zone
  - button.mower_start_cutting_edge
  - button.mower_restart_baseboard
```

### `battery_card`, `info_card`, `statistics_card` objects

Defines which entities are shown when the tip buttons are clicked at the top of the card.

> **Note:** These lists are **optional**. If not specified, the card automatically detects the relevant entities from your device using `translation_key`. Specify them only if you want to override the defaults or change the order.

To remove an entity from a card in the visual editor, simply clear its field — the card will revert to automatic detection.

```yaml
battery_card:
  - sensor.mower_battery
  - sensor.mower_battery_temperature
  - sensor.mower_battery_voltage
  - sensor.mower_battery_charge_cycles

info_card:
  - sensor.mower_rssi
  - sensor.mower_serial_number
  - update.mower_firmware

statistics_card:
  - sensor.mower_total_worktime
  - sensor.mower_blades_total_on_time
  - sensor.mower_blades_current_on_time
  - sensor.mower_distance_driven
```

### `stats` object

You can use any mower attribute or any entity by `entity_id` to display in the stats section:

| Name             |   Type   | Description                                                                                                                                                                                                                  |
| ---------------- | :------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity_id`      | `string` | An `entity_id` with a state, e.g., `sensor.mower`                                                                                                                                                                            |
| `attribute`      | `string` | The attribute name to display, e.g., `total_blade_time`                                                                                                                                                                      |
| `value_template` | `string` | Jinja2 template returning a value. See [Home Assistant Templating][ha-templating]. The `value` variable represents the state of `entity_id` or `attribute`, e.g., `"{{ as_timedelta((value \| float(0) * 60) \| string) }}"` |
| `unit`           | `string` | Unit of measure, e.g., `hours`                                                                                                                                                                                               |
| `subtitle`       | `string` | Friendly label for the stat, e.g., `Blade time`                                                                                                                                                                              |

```yaml
stats:
  default:
    - entity_id: sensor.mower_blades_total_on_time
      subtitle: Total blade time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | string) }}'
    - entity_id: sensor.mower_blades_current_on_time
      subtitle: Current blade time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | string) }}'
    - entity_id: sensor.mower_total_worktime
      subtitle: Work time
      value_template: '{{ as_timedelta((value | float(0) * 3600) | string) }}'
    - entity_id: sensor.mower_distance_driven
      value_template: '{{ (value | float(0) / 1000) | round(3) }}'
      unit: km
      subtitle: Distance
  mowing:
    - entity_id: sensor.mower_yaw
      subtitle: Yaw
      unit: °
    - entity_id: sensor.mower_roll
      subtitle: Roll
      unit: °
    - entity_id: sensor.mower_pitch
      subtitle: Pitch
      unit: °
```

### `actions` object

Override the default behavior of toolbar buttons. Available keys: `start_mowing`, `edgecut`, `pause`, `dock`.

| Name             |   Type   | Description                                     |
| ---------------- | :------: | ----------------------------------------------- |
| `perform_action` | `string` | An action to call, e.g., `script.mowing_zone_2` |
| `target`         | `object` | Target for the action call                      |
| `data`           | `object` | Optional data payload                           |

```yaml
actions:
  start_mowing:
    action: perform-action
    perform_action: script.mowing_zone_2
  edgecut:
    action: perform-action
    perform_action: landroid_cloud.setzone
    target:
      entity_id: lawn_mower.mower
    data:
      zone: '1'
```

### `shortcuts` object

Add custom shortcut buttons to the toolbar using any [Home Assistant action][ha-actions].

| Name     |   Type   | Description                                         |
| -------- | :------: | --------------------------------------------------- |
| `name`   | `string` | Friendly name of the shortcut, e.g., `Mow zone 2`   |
| `icon`   | `string` | Any MDI icon, e.g., `mdi:bell`                      |
| `action` | `object` | A Home Assistant action object (see examples below) |

```yaml
shortcuts:
  # perform-action (recommended)
  - name: Notification
    icon: mdi:bell
    action:
      action: perform-action
      perform_action: automation.toggle
      target:
        entity_id: automation.mower_notify_status

  # navigate to a dashboard view
  - name: Garden
    icon: mdi:flower
    action:
      action: navigate
      navigation_path: /lovelace/garden

  # open a URL
  - name: Manual
    icon: mdi:book-open
    action:
      action: url
      url_path: https://worx.com/manual.pdf

  # open more-info dialog
  - name: Mower info
    icon: mdi:information
    action:
      action: more-info
      entity: lawn_mower.mower
```

> **Backward compatibility:** The old `service` / `service_data` format is still supported but deprecated. Please migrate to the `action` format above.

## Theming 🎨

This card can be styled by changing the values of these CSS variables (globally or per-card via [`card-mod`][card-mod]):

| Variable                    | Default value                                                    | Description                          |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `--lc-background`           | `var(--ha-card-background, var(--card-background-color, white))` | Background of the card               |
| `--lc-primary-text-color`   | `var(--primary-text-color)`                                      | Mower name, stats values, etc.       |
| `--lc-secondary-text-color` | `var(--secondary-text-color)`                                    | Status, stats units and titles, etc. |
| `--lc-icon-color`           | `var(--secondary-text-color)`                                    | Color of icons                       |
| `--lc-toolbar-background`   | `var(--lc-background)`                                           | Background of the toolbar            |
| `--lc-toolbar-text-color`   | `var(--secondary-text-color)`                                    | Color of toolbar text                |
| `--lc-toolbar-icon-color`   | `var(--secondary-text-color)`                                    | Color of toolbar icons               |
| `--lc-divider-color`        | `var(--entities-divider-color, var(--divider-color))`            | Color of dividers                    |
| `--lc-spacing`              | `10px`                                                           | Padding and margin inside the card   |

### Styling via a theme

Read more in the [Frontend documentation](https://www.home-assistant.io/integrations/frontend/).

```yaml
my-custom-theme:
  lc-background: '#17A8F4'
  lc-spacing: 5px
```

### Styling via card-mod

```yaml
type: 'custom:landroid-card'
style: |
  ha-card {
    --lc-background: #17A8F4;
    --lc-spacing: 5px;
  }
```

## Animations 🎬

Animations are applied only to the `image` property. Here's how they look:

|             Mowing              |                Docking                |
| :-----------------------------: | :-----------------------------------: |
| ![Mowing animation][mowing-gif] | ![Returning animation][returning-gif] |

## Supported languages 🌍

This card supports translations. Please help add more translations and improve existing ones. Here's a list of supported languages:

- Čeština (Czech)
- Dansk (Danish)
- Deutsch (German)
- English
- Español (Spanish)
- Eesti (Estonian)
- Français (French)
- Italiano (Italian)
- Magyar (Hungarian)
- Nederlands (Dutch)
- Polski (Polish)
- Русский (Russian)
- Slovenščina (Slovenian)
- Svenska (Swedish)

- [_Your language?_][add-translation]

## Supported models 🤖

This card relies on standard Landroid services such as `pause`, `start`, `stop`, and `return_to_base`. It should work with all Landroid lawnmowers; however, it has only been physically tested with a Worx Landroid M500 WR141E.

If this card works with your lawnmower, please open a PR and add your model to the list.

| Vendor                       | Model   | Name               | Max. Rain Delay |
| :--------------------------- | :------ | :----------------- | :-------------- |
| Worx                         | WR130E  | Landroid S300      | 23 hr 30 min    |
| Worx                         | WR100SI | Landroid S390      |                 |
| Worx                         | WR141E  | Landroid M500      | 12 hr 30 min    |
| Worx                         | WR142E  | Landroid M700      |                 |
| Worx                         | WR143E  | Landroid M1000     |                 |
| Worx                         | WR147E  | Landroid L1000     |                 |
| Worx                         | WR155E  | Landroid L2000     | 23 hr 30 min    |
| Worx                         | WR165E  | Landroid M500 Plus | 23 hr 30 min    |
| Worx                         | WR167E  | Landroid M700 Plus | 23 hr 30 min    |
| Worx                         | WR105SI | Landroid S500      |                 |
| Worx                         | WR206E  | Landroid M600      |                 |
| Kress                        | Mission | KR112              | 12 hr 00 min    |
| [_Your mower?_][edit-readme] |         |                    |                 |

## If your lawnmower has been banned 🚫

If services and the app have stopped working:

- Go to [My Landroids][my-landroids].
- Unlink your Landroid.
- Open the app on a mobile device.
- Add your Landroid again.

## Development 🛠️

Want to contribute to the project?

First of all, thanks! 🙏 Check the [contributing guidelines](./CONTRIBUTING.md) for more information.

## Inspiration

This project is heavily inspired by:

- [Malene Trab][landroid-cloud] — **Landroid Cloud** Integration
- [Denys Dovhan][vacuum-card] — **Vacuum card**

Huge thanks for their ideas and efforts 👍

## Thanks to all contributors 🤝

Please see the list of [contributors](https://github.com/Barma-lej/landroid-card/graphs/contributors) who participated in this project.

## License

[MIT License](./LICENSE)

**💡 Tip:** If you like this project, buy me a cup of ☕️ or 🥤:

[![Buy Me A Coffee][buymeacoffee-img]][buymeacoffee-url]

<!-- Badges -->

[hacs-url]: https://github.com/hacs/integration
[hacs-image]: https://img.shields.io/badge/hacs-default-orange.svg?style=flat-square
[buymeacoffee-url]: https://www.buymeacoffee.com/barma
[buymeacoffee-image]: https://img.shields.io/badge/donate-Coffee-ff813f.svg
[latest-url]: https://img.shields.io/github/v/release/Barma-lej/landroid-card
[downloads]: https://img.shields.io/github/downloads/Barma-lej/landroid-card/total
[downloads_latest]: https://img.shields.io/github/downloads/Barma-lej/landroid-card/latest/total

<!-- References -->

[add-translation]: https://github.com/Barma-lej/landroid-card/blob/master/CONTRIBUTING.md#how-to-add-translation
[buymeacoffee-img]: https://www.buymeacoffee.com/assets/img/custom_images/white_img.png
[card-mod]: https://github.com/thomasloven/lovelace-card-mod
[dashboard-resources]: https://my.home-assistant.io/redirect/lovelace_resources/
[dashboard-resources-img]: https://my.home-assistant.io/badges/lovelace_resources.svg
[edit-readme]: https://github.com/Barma-lej/landroid-card/edit/master/README.md
[ha-scripts]: https://www.home-assistant.io/docs/scripts/
[ha-templating]: https://www.home-assistant.io/docs/configuration/templating/
[hacs]: https://hacs.xyz
[hacs-add-repo]: https://hacs.xyz/docs/faq/custom_repositories
[home-assistant]: https://www.home-assistant.io/
[landroid-cloud]: https://github.com/MTrab/landroid_cloud
[mowing-gif]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-mowing.gif
[my-landroids]: https://account.worxlandroid.com/product-items
[preview-gif]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-card.gif
[release032]: https://github.com/Barma-lej/landroid-card/releases/tag/0.3.2
[returning-gif]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-returning.gif
[vacuum-card]: https://github.com/denysdovhan/vacuum-card/
