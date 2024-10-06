# Landroid Card

[![HACS][hacs-image]][hacs-url]
[![Buy Me A Coffee][buymeacoffee-image]][buymeacoffee-url]
![Latest release][latest-url]
![All releases][downloads]
![Latest release][downloads_latest]

> Landroid mower card for [Home Assistant][home-assistant] Lovelace UI

<!-- ![Preview of landroid-card][preview-image] -->

![Live of landroid-card][preview-gif]

## Requirements

- [Landroid Cloud][landroid-cloud] integration version 4 or above, If you use [Landroid Cloud][landroid-cloud] integration version less than 4, you can install [Landroid Card version 0.3.2][release032]
- Please enable sensors at least `sensor.[mower_name]_rssi`, `sensor.[mower_name]_total_worktime` and `sensor.[mower_name]_battery` for correct work.
- To view the sensor values, you must enable them in the device settings. Most of them are disabled by default

## Installation

### Landroid Cloud

First, you need to install the **Landroid Cloud** Integration.

Install [using HACS][hacs] or [follow this guide][landroid-cloud].

### HACS

You can manually add this repository to your HACS installation. [Here is the manual process][hacs-add-repo].

### Manual

If you prefer not to use HACS, you can manually install the card:

1. Download all `js` files from the [latest release][latest-url].
2. Place them into your `config/www` folder.
3. Add a reference to `landroid-card.js` in Lovelace. There are two ways to do this:

   1. **Using the UI:**

      - Navigate to the Resources page by following the link below:
        [![Open your Home Assistant instance and show your resources.][dashboard-resources-img]][dashboard-resources]

        Or go to "Settings" → "Dashboards" → then click on 3 dots in top right corner and choose "Resources".

      - Click the Plus button.
      - Set _URL_ as `/local/landroid-card.js`.
      - Set _Resource type_ as `JavaScript Module`.

      **Note:** If you do not see the Resources Tab, you will need to enable _Advanced Mode_ in your _User Profile_.

   2. **Using YAML:** Add the following code to the `lovelace` section.

      ```yaml
      resources:
        - url: /local/landroid-card.js
          type: module
      ```

4. Add `custom:landroid-card` to Lovelace UI as you would with any other card (using either the editor or YAML configuration).

## Usage

This card can be configured using the Lovelace UI editor.

1. In Lovelace UI, click the three dots in the top left corner.
2. Click _Configure UI_.
3. Click the Plus button to add a new card.
4. Find _Custom: Landroid Card_ in the list.
5. Choose an `entity`.
6. You should now see a preview of the card!

_Sorry, there is no support for `actions`, `shortcuts`, and `stats` in visual config yet._

A typical example of using this card in a YAML configuration would look like this:

```yaml
image: default
compact_view: false
show_status: true
show_name: true
show_toolbar: true
type: custom:landroid-card
entity: lawn_mower.mower
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
      value_template: '{{ as_timedelta((value | float(0) * 3600) | string ) }}'
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
shortcuts:
  - name: Notification
    service: automation.toggle
    icon: mdi:bell
    service_data:
      entity_id: automation.mower_notify_status
```

Here is an explanation of each option:

| Name             |   Type    | Default                | Description                                                                                      |
| ---------------- | :-------: | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `type`           | `string`  | `custom:landroid-card` | Type of the card `custom:landroid-card`                                                          |
| `entity`         | `string`  | **Required**           | An `entity_id` within the `lawn_mower` domain.                                                   |
| `camera`         | `string`  | Optional               | An `entity_id` within the `camera` domain, for streaming the live Landroid camera.               |
| `camera_refresh` | `integer` | `5`                    | Update interval for the camera in seconds                                                        |
| `image`          | `string`  | `default`              | Path to an image of your mower. It's better to use `png` or `svg` formats.                       |
| `image_size`     | `integer` | `4`                    | Image size. It's an integer from 1 to 8. Each unit is equal to 50px (e.g., 2 \* 50px = 100px )   |
| `image_left`     | `boolean` | `false`                | Show the image on the left side.                                                                 |
| `show_name`      | `boolean` | `false`                | Show the friendly name of the mower.                                                             |
| `show_status`    | `boolean` | `true`                 | Show the status of the mower.                                                                    |
| `show_toolbar`   | `boolean` | `true`                 | Show the toolbar with actions.                                                                   |
| `compact_view`   | `boolean` | `false`                | Use a compact view without an image.                                                             |
| `stats`          | `object`  | Optional               | Custom per-state stats for your mower                                                            |
| `actions`        | `object`  | Optional               | Override default actions behavior with service invocations.                                      |
| `shortcuts`      | `object`  | Optional               | List of shortcuts shown at the right bottom part of the card with custom actions for your mower. |

### `stats` object

You can use any attribute of the mower or even any entity by `entity_id` to display in the stats section:

| Name             |   Type   | Description                                                                                                                                                                                                                   |
| ---------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity_id`      | `string` | An `entity_id` with a state, e.g., `sensor.mower`.                                                                                                                                                                            |
| `attribute`      | `string` | The attribute name of the stat, e.g., `total_blade_time`.                                                                                                                                                                     |
| `value_template` | `string` | Jinja2 template returning a value. [Here is Home Assistant Templating][ha-templating]. The `value` variable represents the `entity_id` or `attribute` state, e.g., `"{{ as_timedelta((value \| float(0) * 60) \| string) }}"` |
| `unit`           | `string` | The unit of measure, e.g., `hours`.                                                                                                                                                                                           |
| `subtitle`       | `string` | The friendly name of the stat, e.g., `Blade time`.                                                                                                                                                                            |

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
      value_template: '{{ as_timedelta((value | float(0) * 3600) | string ) }}'
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

You can define service invocations to override default actions behavior. Available actions to override are `start_mowing`, `edgecut`, `pause` and `dock`.

| Name           |   Type   | Description                                      |
| -------------- | :------: | ------------------------------------------------ |
| `service`      | `string` | A service to call, e.g., `script.mowing_zone_2`. |
| `service_data` | `object` | `service_data` for the `service` call            |

```yaml
actions:
  start_mowing:
    service: script.mowing_zone_2
  edgecut:
    service: landroid_cloud.setzone
    service_data:
      entity_id: lawn_mower.mower
      zone: '1'
  pause:
    service: landroid_cloud.ots
    service_data:
      entity_id: lawn_mower.mower
      boundary: true
      runtime: 60
```

### `shortcuts` object

You can define [custom scripts][ha-scripts] for custom actions, such as mowing a zone, and add them to this card with the `shortcuts` option.

| Name           |   Type   | Description                                               |
| -------------- | :------: | --------------------------------------------------------- |
| `name`         | `string` | The friendly name of the action, e.g., `Mowing a zone 2`. |
| `service`      | `string` | A service to call, e.g., `script.mowing_zone_2`.          |
| `icon`         | `string` | Any icon for the action button.                           |
| `service_data` | `object` | `service_data` for the `service` call                     |

```yaml
shortcuts:
  - name: Notification
    service: automation.toggle
    icon: mdi:bell
    service_data:
      entity_id: automation.mower_notify_status
```

## Theming

This card can be styled by changing the values of these CSS properties (globally or per-card via [`card-mod`][card-mod]):

| Variable                    | Default value                                                    | Description                          |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `--lc-background`           | `var(--ha-card-background, var(--card-background-color, white))` | Background of the card               |
| `--lc-primary-text-color`   | `var(--primary-text-color)`                                      | Mower name, stats values, etc        |
| `--lc-secondary-text-color` | `var(--secondary-text-color)`                                    | Status, stats units and titles, etc  |
| `--lc-icon-color`           | `var(--secondary-text-color)`                                    | Colors of icons                      |
| `--lc-toolbar-background`   | `var(--lc-background)`                                           | Background of the toolbar            |
| `--lc-toolbar-text-color`   | `var(--secondary-text-color)`                                    | Color of the toolbar texts           |
| `--lc-toolbar-icon-color`   | `var(--secondary-text-color)`                                    | Color of the toolbar icons           |
| `--lc-divider-color`        | `var(--entities-divider-color, var(--divider-color))`            | Color of dividers                    |
| `--lc-spacing`              | `10px`                                                           | Paddings and margins inside the card |

### Styling via a theme

Here is an example of customization via a theme. Read more in the [Frontend documentation](https://www.home-assistant.io/integrations/frontend/).

```yaml
my-custom-theme:
  lc-background: '#17A8F4'
  lc-spacing: 5px
```

### Styling via card-mod

You can use [`card-mod`][card-mod] to customize the card on a per-card basis, like this:

```yaml
type: 'custom:landroid-card'
style: |
  ha-card {
    --lc-background: #17A8F4;
    --lc-spacing: 5px;
  }
  ...
```

## Animations

**💡 Tip:** Animations are applied only to the `image` property. Here's how they look:

|             Mowing              |                Docking                |
| :-----------------------------: | :-----------------------------------: |
| ![Mowing animation][mowing-gif] | ![Returning animation][returning-gif] |

## Supported languages

This card supports translations. Please help add more translations and improve existing ones. Here's a list of supported languages:

- Čeština (Czech)
- Dansk (Danish)
- Deutsch (German)
- English
- Estonian
- Français (French)
- Italiano (Italian)
- Nederlands (Dutch)
- Polski (Polish)
- Русский (Russian)
- Slovenščina (Slovenian)
- Svenska (Swedish)
- Español (Spanish)

- [_Your language?_][add-translation]

## Supported models

This card relies on basic Landroid services, like `pause`, `start`, `stop`, `return_to_base`, etc. It should work with Landroid lawnmowers; however, I can physically test it only with my own Worx Landroid M500 WR141E.

If this card works with your lawnmower, please open a PR and add your model to the list.

| Vendor                       | Model   | Name               | Max. Rain Delay |
| :--------------------------- | :------ | :----------------- | :-------------- |
| Worx                         | WR130E  | Landroid S300      | 23 hr 30 min    |
| Worx                         | WR141E  | Landroid M500      | 12 hr 30 min    |
| Worx                         | WR143E  | Landroid M1000     |                 |
| Worx                         | WR147E  | Landroid L1000     |                 |
| Worx                         | WR155E  | Landroid L2000     | 23 hr 30 min    |
| Worx                         | WR165E  | Landroid M500 Plus | 23 hr 30 min    |
| Worx                         | WR167E  | Landroid M700 Plus | 23 hr 30 min    |
| Worx                         | WR105SI | Landroid S500      |                 |
| Worx                         | WR206E  | Landroid M600      |                 |
| Kress                        | Mission | KR112              | 12 hr 00 min    |
| [_Your mower?_][edit-readme] |         |                    |                 |

## If your lawnmower has been banned

If services and the app have stopped working:

- Go to [My Landroids][my-landroids].
- Unlink your Landroid.
- Open the app on a mobile device.
- Add your Landroid again.

## Development

Want to contribute to the project?

First of all, thanks! Check the [contributing guidelines](./CONTRIBUTING.md) for more information.

## Inspiration

This project is heavily inspired by:

- [Malene Trab][landroid-cloud] **Landroid Cloud** Integration
- [Denys Dovhan][vacuum-card] **Vacuum card**

Huge thanks for their ideas and efforts 👍

## Thanks to all contributors

Please see the list of [contributors](https://github.com/Barma-lej/landroid-card/graphs/contributors) who participated in this project.

## License

[MIT License](./LICENSE)

**💡 Tip:** If you like this project just buy me a cup of ☕️ or 🥤:

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

<!-- [preview-image]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-card-docked.png -->

[preview-gif]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-card.gif
[release032]: https://github.com/Barma-lej/landroid-card/releases/tag/0.3.2
[returning-gif]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-returning.gif
[vacuum-card]: https://github.com/denysdovhan/vacuum-card/

<!-- Old text
- Català (Catalan)
- 简体中文 (Simplified Chinese)
- 正體中文 (Traditional Chinese)
- Čeština (Czech)
- Nederlands (Dutch)
- Suomi (Finnish)
- עִבְרִית (Hebrew)
- Magyar (Hungarian)
- Italiano (Italian)
- 한국어 (Korean)
- Lietuvių (Lithuanian)
- Norsk bokmål (Norwegian)
- Norsk nynorsk (Norwegian)
- Polski (Polish)
- Português (Portuguese)
- Português Brasileiro (Brazilian Portuguese)
- Română (Romanian)
- Español (Spanish)
- Українська (Ukrainian)
- Việt Nam (Vietnamese)
-->
