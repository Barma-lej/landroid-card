// Card editor constants
export const MOWER_ENTITY_DOMAINS = ['select', 'switch', 'number', 'button'];

// Card constants
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

// Entities
export const BUTTON_EDGECUT_SUFFIX = 'edge_cut';

// export const NUMBER_TIME_EXTENSION_SUFFIX = 'time_extension';
// export const NUMBER_TORQUE_SUFFIX = 'torque';

export const SELECT_CURRENT_ZONE_SUFFIX = 'zone';
// export const SELECT_RAINDELAY_SUFFIX = 'raindelay';

export const SENSOR_ERROR_SUFFIX = 'error';
export const SENSOR_DAILY_PROGRESS_SUFFIX = 'daily_progress';
export const SENSOR_NEXT_SCHEDULED_START_SUFFIX = 'next_schedule'; // ранее: next_scheduled_start
export const SENSOR_RAINSENSOR_REMAINING_SUFFIX = 'rain_delay_remaining'; // ранее: rainsensor_remaining
export const SENSOR_WIFI_SUFFIX = 'signal_strength'; // ранее: rssi

export const SWITCH_LOCK_SUFFIX = 'lock';
export const SWITCH_PARTY_SUFFIX = 'party_mode';

// Settings
export const BATTERYCARD = 'battery';
export const INFOCARD = 'info';
export const STATISTICSCARD = 'statistics';

export const CARD_MAP = {
  [BATTERYCARD]: {
    labelPosition: 1,
    entities: [
      'battery', // sensor.mower_battery
      'battery_charge_cycles_total', // ранее: battery_total_charge_cycles
      'battery_charge_cycles_since_reset',
      'battery_temperature', // sensor.mower_battery_temperature
      'battery_voltage', // sensor.mower_battery_voltage
      'charging', // binary_sensor.mower_charging
    ],
  },
  [INFOCARD]: {
    labelPosition: 2,
    entities: [
      SENSOR_WIFI_SUFFIX,
      SENSOR_RAINSENSOR_REMAINING_SUFFIX,
      'rain_sensor', // ранее: rainsensor_triggered
      SENSOR_NEXT_SCHEDULED_START_SUFFIX,
      'pitch',
      'roll',
      'yaw',
      SENSOR_ERROR_SUFFIX,
      'last_update',
      'daily_progress',
    ],
  },
  [STATISTICSCARD]: {
    labelPosition: 0,
    entities: [
      'mower_runtime_total', // ранее: total_worktime
      'distance_driven_total', // ранее: distance_driven
      'blade_runtime_total', // ранее: blades_total_on_time
      'blade_runtime_since_reset', // ранее: blades_current_on_time
      'blade_runtime_at_last_reset', // ранее: blades_reset_at_hours
      'blade_runtime_reset_time', // ранее: blades_reset_at (timestamp)
    ],
  },
};

// States

// Landroid Cloud States
export const STATE_EDGECUT = 'edgecut';
export const STATE_ESCAPED_DIGITAL_FENCE = 'escaped_digital_fence';
export const STATE_INITIALIZING = 'initializing';
export const STATE_IDLE = 'idle';
export const STATE_OFFLINE = 'offline';
export const STATE_RAINDELAY = 'rain_delay';
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
