# Landroid Card

[![hacs][hacs-image]][hacs-url]
[![Buy Me A Coffee][buymeacoffee-image]][buymeacoffee-url]
[![Downloads for latest release][latest-img]][latest-url]

> Landroid mower card for [Home Assistant][home-assistant] Lovelace UI

By default, Home Assistant does not provide any card for controlling Landroid lawnmower. This card displays the state and allows to control your robot.

![Preview of landroid-card][preview-image]

## Installing

### Landroid Cloud

First of all you need to install a **Landroid Cloud** Integration.

Install [using HACS][hacs] or [see this guide][landroid-cloud].

### HACS

You can manual add this repo to your HACS installation. [Here is manual][hacs-add-repo]

### Manual

1. Download `landroid-card.js` file from the [latest release][latest-url].
2. Put `landroid-card.js` file into your `config/www` folder.
3. Add reference to `landroid-card.js` in Lovelace. There's two way to do that:

   1. **Using UI:**

      - This is done by navigating to the Resources page by following below link:
        [![Open your Home Assistant instance and show your resources.][dashboard-resources-img]][dashboard-resources]

        Or go to _Configuration_ → _Lovelace Dashboards_ → _Resources Tab_

      - Click Plus button
      - Set _Url_ as `/local/landroid-card.js`
      - Set _Resource type_ as `JavaScript Module`.

      **Note:** If you do not see the Resources Tab, you will need to enable _Advanced Mode_ in your _User Profile_

   2. **Using YAML:** Add following code to `lovelace` section.

      ```yaml
      resources:
        - url: /local/landroid-card.js
          type: module
      ```

4. Add `custom:landroid-card` to Lovelace UI as any other card (using either editor or YAML configuration).

## Usage

This card can be configured using Lovelace UI editor.

1. In Lovelace UI, click 3 dots in top left corner.
2. Click _Configure UI_.
3. Click Plus button to add a new card.
4. Find _Custom: Landroid Card_ in the list.
5. Choose `entity`.
6. Now you should see the preview of the card!

_Sorry, no support for `actions`, `shortcuts` and `stats` in visual config yet._

Typical example of using this card in YAML config would look like this:

```yaml
image: default
compact_view: false
show_status: true
show_name: true
show_toolbar: true
type: custom:landroid-card
entity: vacuum.mower
stats:
  default:
    - attribute: blades.total_on
      subtitle: Total blade time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: blades.current_on
      subtitle: Current blade time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: statistics.worktime_blades_on
      subtitle: Work time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: statistics.distance
      value_template: '{{ (value | float(0) / 1000) | round(3) }}'
      unit: km
      subtitle: Distance
  mowing:
    - attribute: orientation.yaw
      subtitle: Yaw
      unit: °
    - attribute: orientation.roll
      subtitle: Roll
      unit: °
    - attribute: orientation.pitch
      subtitle: Pitch
      unit: °
shortcuts:
  - name: Notification
    service: automation.toggle
    icon: mdi:bell
    service_data:
      entity_id: automation.mower_notify_status
```

Here is what every option means:

| Name             |   Type    | Default      | Description                                                                                      |
| ---------------- | :-------: | ------------ | ------------------------------------------------------------------------------------------------ |
| `type`           | `string`  | **Required** | `custom:landroid-card`                                                                           |
| `entity`         | `string`  | **Required** | An entity_id within the `vacuum` domain.                                                         |
| `camera`         | `string`  | Optional     | An entity_id within the `camera` domain, for streaming live landroid camera.                     |
| `camera_refresh` | `integer` | `5`          | Update interval for camera in seconds                                                            |
| `image`          | `string`  | `default`    | Path to image of your mower. Better to have `png` or `svg`.                                      |
| `show_name`      | `boolean` | `true`       | Show friendly name of the mower.                                                                 |
| `show_status`    | `boolean` | `true`       | Show status of the mower.                                                                        |
| `show_toolbar`   | `boolean` | `true`       | Show toolbar with actions.                                                                       |
| `compact_view`   | `boolean` | `false`      | Compact view without image.                                                                      |
| `stats`          | `object`  | Optional     | Custom per state stats for your mower                                                            |
| `actions`        | `object`  | Optional     | Override default actions behavior with service invocations.                                      |
| `shortcuts`      | `object`  | Optional     | List of shortcuts shown at the right bottom part of the card with custom actions for your mower. |

### `stats` object

You can use any attribute of mower or even any entity by `entity_id` to display by stats section:

| Name             |   Type   | Default  | Description                                                                                                                                                                                                             |
| ---------------- | :------: | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity_id`      | `string` | Optional | An entity_id with state, i.e. `sensor.mower`.                                                                                                                                                                           |
| `attribute`      | `string` | Optional | Attribute name of the stat, i.e. `total_blade_time`.                                                                                                                                                                    |
| `value_template` | `string` | Optional | Jinja2 template returning a value [Here is Home Assistant Templating](ha-templating). `value` variable represents the `entity_id` or `attribute` state, i.e. `"{{ as_timedelta((value \| float(0) * 60) \| string) }}"` |
| `unit`           | `string` | Optional | Unit of measure, i.e. `hours`.                                                                                                                                                                                          |
| `subtitle`       | `string` | Optional | Friendly name of the stat, i.e. `Blade time`.                                                                                                                                                                           |

```yaml
stats:
  default:
    - attribute: blades.total_on
      subtitle: Total blade time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: blades.current_on
      subtitle: Current blade time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: statistics.worktime_blades_on
      subtitle: Work time
      value_template: '{{ as_timedelta((value | float(0) * 60) | string) }}'
    - attribute: statistics.distance
      value_template: '{{ (value | float(0) / 1000) | round(3) }}'
      unit: km
      subtitle: Distance
  mowing:
    - attribute: orientation.yaw
      subtitle: Yaw
      unit: °
    - attribute: orientation.roll
      subtitle: Roll
      unit: °
    - attribute: orientation.pitch
      subtitle: Pitch
      unit: °
```

### `actions` object

You can defined service invocations to override default actions behavior. Available actions to override are `start`, `pause`, `resume`, `stop` and `return_to_base`.

| Name           |   Type   | Default                           | Description                                     |
| -------------- | :------: | --------------------------------- | ----------------------------------------------- |
| `service`      | `string` | Optional                          | A service to call, i.e. `script.mowing_zone_2`. |
| `service_data` | `object` | `service_data` for `service` call |

```yaml
actions:
  start:
    service: script.mowing_zone_2
  edgecut:
    service: landroid_cloud.setzone
    service_data:
      entity_id: vacuum.mower
      zone: '1'
  pause:
    service: landroid_cloud.ots
    service_data:
      entity_id: vacuum.mower
      boundary: true
      runtime: 60
```

### `shortcuts` object

You can defined [custom scripts][ha-scripts] for custom actions i.e mowing a zone and add them to this card with `shortcuts` option.

| Name           |   Type   | Default                           | Description                                          |
| -------------- | :------: | --------------------------------- | ---------------------------------------------------- |
| `name`         | `string` | Optional                          | Friendly name of the action, i.e. `Mowing a zone 2`. |
| `service`      | `string` | Optional                          | A service to call, i.e. `script.mowing_zone_2`.      |
| `icon`         | `string` | Optional                          | Any icon for action button.                          |
| `service_data` | `object` | `service_data` for `service` call |

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
| `--vc-background`           | `var(--ha-card-background, var(--card-background-color, white))` | Background of the card               |
| `--vc-primary-text-color`   | `var(--primary-text-color)`                                      | Mower name, stats values, etc        |
| `--vc-secondary-text-color` | `var(--secondary-text-color)`                                    | Status, stats units and titles, etc  |
| `--vc-icon-color`           | `var(--secondary-text-color)`                                    | Colors of icons                      |
| `--vc-toolbar-background`   | `var(--vc-background)`                                           | Background of the toolbar            |
| `--vc-toolbar-text-color`   | `var(--secondary-text-color)`                                    | Color of the toolbar texts           |
| `--vc-toolbar-icon-color`   | `var(--secondary-text-color)`                                    | Color of the toolbar icons           |
| `--vc-divider-color`        | `var(--entities-divider-color, var(--divider-color))`            | Color of dividers                    |
| `--vc-spacing`              | `10px`                                                           | Paddings and margins inside the card |

### Styling via theme

Here is an example of customization via theme. Read more in the [Frontend documentation](https://www.home-assistant.io/integrations/frontend/).

```yaml
my-custom-theme:
  vc-background: '#17A8F4'
  vc-spacing: 5px
```

### Styling via card-mod

You can use [`card-mod`][card-mod] to customize the card on per-card basis, like this:

```yaml
type: 'custom:landroid-card'
style: |
  ha-card {
    --vc-background: #17A8F4;
    --vc-spacing: 5px;
  }
  ...
```

## Animations

**💡 Tip:** Animations are applied only for `image` property. Here's how they look like:

|             Mowing              |                Docking                |
| :-----------------------------: | :-----------------------------------: |
| ![Mowing animation][mowing-gif] | ![Returning animation][returning-gif] |

## Supported languages

This card supports translations. Please, help to add more translations and improve existing ones. Here's a list of supported languages:

- Dansk (Danish)
- Deutsch (German)
- English
- Français (French)
- Italiano (Italian)
- Polski (Polish)
- Русский (Russian)
- Slovenščina (Slovenian)
- Svenska (Swedish)

- [_Your language?_][add-translation]

## Supported models

This card relies on basic landroid services, like `pause`, `start`, `stop`, `return_to_base`, etc. It should work with landroid mower, however I can physically test it only with my own Worx Landroid M500 WR141E.

If this card works with your mower, please open a PR and your model to the list.

- **Worx** Landroid M500 WR141E
- **Worx** Landroid L1000 WR147E
- **Worx** Landroid M500 Plus WR165E
- **Worx** Landroid M1000 WR143E
- [_Your mower?_][edit-readme]

## If your lawnmower has been banned

Services and app stopped working

- Go to [My Landroids][my-landroids]
- Unlink your Landroid
- Open app on mobile device
- Add Landroid

## Development

Want to contribute to the project?

First of all, thanks! Check [contributing guideline](./CONTRIBUTING.md) for more information.

## Inspiration

This project is heavily inspired by:

- [Malene Trab][landroid-cloud] **Landroid Cloud** Integration
- [Denys Dovhan][vacuum-card] **Vacuum card**

Huge thanks for their ideas and efforts 👍

## License

MIT © Barma-lej

**💡 Tip:** If you like this project just buy me a cup of ☕️ or 🥤:

[![Buy Me A Coffee][buymeacoffee-img]][buymeacoffee-url]

<!-- Badges -->

[hacs-url]: https://github.com/hacs/integration
[hacs-image]: https://img.shields.io/badge/hacs-default-orange.svg?style=flat-square
[buymeacoffee-url]: https://www.buymeacoffee.com/barma
[buymeacoffee-image]: https://img.shields.io/badge/donate-Coffee-ff813f.svg
[latest-url]: https://github.com/Barma-lej/landroid-card/releases/latest
[latest-img]: https://img.shields.io/github/v/release/Barma-lej/landroid-card?include_prereleases

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
[preview-image]: https://github.com/Barma-lej/landroid-card/raw/master/media/landroid-card-docked.png
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
