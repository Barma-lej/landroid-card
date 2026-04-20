// Services
export const LAWNMOWER_SERVICE = 'lawn_mower';
export const ACTION_MOWING = 'start_mowing';
export const ACTION_PAUSE = 'pause';
export const ACTION_DOCK = 'dock';
export const ACTION_EDGECUT = 'edgecut';

export const ACTION_BUTTONS = {
  [ACTION_MOWING]: {
    icon: 'mdi:play',
    action: LAWNMOWER_SERVICE + '.' + ACTION_MOWING,
  },
  [ACTION_EDGECUT]: {
    icon: 'mdi:motion-play',
    action: 'button.press',
  },
  [ACTION_PAUSE]: {
    icon: 'mdi:pause',
    action: LAWNMOWER_SERVICE + '.' + ACTION_PAUSE,
  },
  [ACTION_DOCK]: {
    icon: 'mdi:home-import-outline',
    action: LAWNMOWER_SERVICE + '.' + ACTION_DOCK,
  },
};

// Settings
export const BATTERYCARD = 'battery';
export const INFOCARD = 'info';
export const STATISTICSCARD = 'statistics';

// ─── Translation keys (из MTrab/landroid_cloud) ──────────────────────────────
// Используются для поиска сущностей через hass.entities[id].translation_key
// Не зависят от языка и переименований пользователем

// Toolbar / status
export const TK_BUTTON_EDGECUT = 'edge_cut';
export const TK_SELECT_ZONE = 'zone';
export const TK_SWITCH_LOCK = 'lock';
export const TK_SWITCH_PARTY = 'party_mode';
export const TK_SENSOR_RAINDELAY = 'rain_delay_remaining';
export const TK_SENSOR_NEXT_SCHEDULE = 'next_schedule';
export const TK_SENSOR_WIFI = 'rssi';
export const TK_SENSOR_DAILY_PROGRESS = 'daily_progress';
export const TK_SENSOR_ERROR = 'error';
export const TK_SENSOR_LAST_UPDATE = 'last_update';

// Battery card
export const TK_SENSOR_BATTERY = 'battery';
export const TK_SENSOR_BATTERY_CYCLES_TOTAL = 'battery_charge_cycles_total';
export const TK_SENSOR_BATTERY_CYCLES_RESET = 'battery_charge_cycles_current';
export const TK_SENSOR_BATTERY_TEMP = 'battery_temperature';
export const TK_SENSOR_BATTERY_VOLTAGE = 'battery_voltage';
export const TK_SENSOR_CHARGING = 'charging';

// Info card
export const TK_SENSOR_RAIN_SENSOR = 'rain_sensor';
export const TK_SENSOR_PITCH = 'pitch';
export const TK_SENSOR_ROLL = 'roll';
export const TK_SENSOR_YAW = 'yaw';

// Statistics card
export const TK_SENSOR_RUNTIME_TOTAL = 'mower_runtime_total';
export const TK_SENSOR_DISTANCE_TOTAL = 'distance_driven_total';
export const TK_SENSOR_BLADE_TOTAL = 'blade_runtime_total';
export const TK_SENSOR_BLADE_CURRENT = 'blade_runtime_current';
export const TK_SENSOR_BLADE_RESET_AT = 'blade_runtime_reset_at';
export const TK_SENSOR_BLADE_RESET_TIME = 'blade_runtime_reset_time';

// CARD_MAP with translation_key
export const CARD_MAP = {
  [BATTERYCARD]: {
    labelPosition: 1,
    translationKeys: [
      TK_SENSOR_BATTERY,
      TK_SENSOR_BATTERY_CYCLES_TOTAL,
      TK_SENSOR_BATTERY_CYCLES_RESET,
      TK_SENSOR_BATTERY_TEMP,
      TK_SENSOR_BATTERY_VOLTAGE,
      TK_SENSOR_CHARGING,
    ],
  },
  [INFOCARD]: {
    labelPosition: 2,
    translationKeys: [
      TK_SENSOR_WIFI,
      TK_SENSOR_RAINDELAY,
      TK_SENSOR_RAIN_SENSOR,
      TK_SENSOR_NEXT_SCHEDULE,
      TK_SENSOR_PITCH,
      TK_SENSOR_ROLL,
      TK_SENSOR_YAW,
      TK_SENSOR_ERROR,
      TK_SENSOR_LAST_UPDATE,
      TK_SENSOR_DAILY_PROGRESS,
    ],
  },
  [STATISTICSCARD]: {
    labelPosition: 0,
    translationKeys: [
      TK_SENSOR_RUNTIME_TOTAL,
      TK_SENSOR_DISTANCE_TOTAL,
      TK_SENSOR_BLADE_TOTAL,
      TK_SENSOR_BLADE_CURRENT,
      TK_SENSOR_BLADE_RESET_AT,
      TK_SENSOR_BLADE_RESET_TIME,
    ],
  },
};

// Fallback grouping for integrations that don't use Landroid Cloud translation
// keys (e.g. Mammotion, Husqvarna Automower, Navimow).
// When translation_key lookup returns no entities, card slots are filled by
// matching sensor device_class against these lists.
export const DEVICE_CLASS_MAP = {
  [BATTERYCARD]: [
    'battery', // battery level %
    'voltage', // battery voltage
    'current', // charging current
  ],
  [INFOCARD]: [
    'signal_strength', // wifi / ble rssi
    'duration', // elapsed_time, total_time, blade runtime, etc.
    'timestamp', // next_schedule, error timestamps
    'distance', // blade height, maintenance distance
    'speed', // mowing speed
  ],
  [STATISTICSCARD]: [
    // Statistics sensors rarely have a standard device_class;
    // users are expected to configure this card manually via statistics_card.
  ],
};

// States
// Landroid Cloud States
export const STATE_EDGECUT = 'edgecut';
export const STATE_ESCAPED_DIGITAL_FENCE = 'escaped_digital_fence';
export const STATE_IDLE = 'idle';
export const STATE_RAINDELAY = 'rain_delayed';
export const STATE_RETURNING = 'returning';
export const STATE_SEARCHING_ZONE = 'searching_zone';
export const STATE_STARTING = 'starting';
export const STATE_ZONING = 'zoning';

// Lawn Mower States
export const STATE_ERROR = 'error';
export const STATE_PAUSED = 'paused';
export const STATE_MOWING = 'mowing';
export const STATE_DOCKED = 'docked';

// Default States
export const UNAVAILABLE = 'unavailable';
