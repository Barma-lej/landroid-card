// Services
export const SERVICE_DOMAINS = ['landroid_cloud', 'lawn_mower'];
export const LAWNMOWER_SERVICE = 'lawn_mower';
export const ACTION_MOWING = 'start_mowing';
export const ACTION_PAUSE = 'pause';
export const ACTION_DOCK = 'dock';
export const ACTION_EDGECUT = 'edgecut';

export const ACION_BUTTONS = {
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
export const BUTTON_EDGECUT_SUFFIX = 'start_cutting_edge';

// export const NUMBER_TIME_EXTENSION_SUFFIX = 'time_extension';
// export const NUMBER_TORQUE_SUFFIX = 'torque';

export const SENSOR_ERROR_SUFFIX = 'error';
export const SENSOR_DAILY_PROGRESS_SUFFIX = 'daily_progress';
export const SENSOR_NEXT_SCHEDULED_START_SUFFIX = 'next_scheduled_start';
export const SENSOR_RAINSENSOR_REMAINING_SUFFIX = 'rainsensor_remaining';

export const SELECT_CURRENT_ZONE_SUFFIX = 'current_zone';
// export const SELECT_RAINDELAY_SUFFIX = 'raindelay';

export const SWITCH_LOCK_SUFFIX = 'locked';
export const SWITCH_PARTY_SUFFIX = 'party_mode';

// Settings
export const BATTERYCARD = 'battery';
export const INFOCARD = 'info';
export const STATISTICSCARD = 'statistics';

export const CARD_MAP = {
  [BATTERYCARD]: {
    labelPosition: 1,
    visibility: false,
    entities: [
      'battery',
      'battery_total_charge_cycles',
      'battery_temperature',
      'battery_voltage',
      'battery_charging',
    ],
  },
  [INFOCARD]: {
    labelPosition: 2,
    visibility: false,
    entities: [
      'rssi',
      'rainsensor_remaining',
      'rainsensor_triggered',
      'next_scheduled_start',
      'pitch',
      'roll',
      'yaw',
      'online',
      'last_update',
    ],
  },
  [STATISTICSCARD]: {
    labelPosition: 0,
    visibility: false,
    entities: [
      'total_worktime',
      'distance_driven',
      'blades_total_on_time',
      'blades_current_on_time',
      'blades_reset_at',
      'blades_reset_at_hours',
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
export const UNKNOWN = 'unknown';
export const ON = 'on';
export const OFF = 'off';

export const UNAVAILABLE_STATES = [UNAVAILABLE, UNKNOWN];
export const OFF_STATES = [UNAVAILABLE, UNKNOWN, OFF];

const arrayLiteralIncludes = (array, searchElement, fromIndex) => {
  return array.includes(searchElement, fromIndex);
};

export const isUnavailableState = arrayLiteralIncludes.bind(
  null,
  UNAVAILABLE_STATES,
);
export const isOffState = arrayLiteralIncludes(OFF_STATES);

/**
 * States
 *
 * error
 * paused
 * mowing
 * docked
 * unavailable
 * unknown
 */

/**
 * Sensors
 *
 * Mower        lawn_mower.mower        offline
 *
 * Mower Battery Charging             binary_sensor.mower_battery_charging      off
 * Mower Online                       binary_sensor.mower_online                off
 * Mower Rainsensor Triggered         binary_sensor.mower_rainsensor_triggered  off
 * Mower Battery                      sensor.mower_battery                      97
 * Mower Battery Temperature          sensor.mower_battery_temperature          7.4
 * Mower Battery Total Charge Cycles  sensor.mower_battery_total_charge_cycles  1312
 * Mower Battery Voltage              sensor.mower_battery_voltage              18.9
 * Mower Blades Current On Time       sensor.mower_blades_current_on_time       304.0
 * Mower Blades Reset At              sensor.mower_blades_reset_at              2023-05-29T19:51:50+00:00
 * Mower Blades Reset At Hours        sensor.mower_blades_reset_at_hours        1599.0
 * Mower Blades Total On Time         sensor.mower_blades_total_on_time         1903.0
 * Mower Daily Progress               sensor.mower_daily_progress               100
 * Mower Distance Driven              sensor.mower_distance_driven              1851.0
 * Mower Error                        sensor.mower_error                        wire missing
 * Mower Last Update                  sensor.mower_last_update                  2023-12-13T12:08:32+00:00
 * Mower Next Scheduled Start         sensor.mower_next_scheduled_start         unknown
 * Mower Pitch                        sensor.mower_pitch                        -0.8
 * Mower Rainsensor Delay             sensor.mower_rainsensor_delay             120
 * Mower Rainsensor Remaining         sensor.mower_rainsensor_remaining         0
 * Mower Roll                         sensor.mower_roll                         -0.9
 * Mower Rssi                         sensor.mower_rssi                         -47
 * Mower Total Worktime               sensor.mower_total_worktime               1993.0
 * Mower Yaw                          sensor.mower_yaw                          359.9
 * Mower Locked                       switch.mower_locked                       off
 * Mower Party Mode                   switch.mower_party_mode                   off
 */

/**
 * Services
 *
 * landroid_cloud: {
 *   "config": {
 *     "name": "Set zone",
 *     "description": "Set device config parameters",
 *     "fields": {
 *       "raindelay": {
 *         "name": "Rain delay",
 *         "description": "Set rain delay. Time in minutes ranging from 0 to 300. 0 = Disabled",
 *         "example": 30,
 *         "selector": {
 *           "number": {
 *             "min": 0,
 *             "max": 300,
 *             "step": 1,
 *             "unit_of_measurement": "minutes",
 *             "mode": "slider"
 *           }
 *         }
 *       },
 *       "timeextension": {
 *         "name": "Time extension",
 *         "description": "Set time extension. Extension in % ranging from -100 to 100",
 *         "example": -23,
 *         "selector": {
 *           "number": {
 *             "min": -100,
 *             "max": 100,
 *             "step": 1,
 *             "unit_of_measurement": "%",
 *             "mode": "slider"
 *           }
 *         }
 *       },
 *       "multizone_distances": {
 *         "name": "Multi zone distances",
 *         "description": "Set multizone distance array in meters. 0 = Disabled. Format: 15, 80, 120, 155",
 *         "example": "15, 80, 120, 155",
 *         "selector": {
 *           "text": null
 *         }
 *       },
 *       "multizone_probabilities": {
 *         "name": "Multi zone probabilities",
 *         "description": "Set multizone probabilities array. Format: 50, 10, 20, 20",
 *         "example": "50, 10, 20, 20",
 *         "selector": {
 *           "text": null
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "setzone": {
 *     "name": "Set zone",
 *     "description": "Set which zone to be mowed next",
 *     "fields": {
 *       "zone": {
 *         "name": "Zone",
 *         "description": "Sets the zone number, ranging from 0 to 3, to be mowed next",
 *         "example": 1,
 *         "required": true,
 *         "default": "0",
 *         "selector": {
 *           "select": {
 *             "options": [
 *               "0",
 *               "1",
 *               "2",
 *               "3"
 *             ]
 *           }
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "restart": {
 *     "name": "Restart device",
 *     "description": "Restarts or reboots device",
 *     "fields": {},
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "edgecut": {
 *     "name": "Border-/Edgecut",
 *     "description": "Start edgecut (if supported)",
 *     "fields": {},
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "ots": {
 *     "name": "One-Time-Schedule",
 *     "description": "Start One-Time-Schedule (if supported)",
 *     "fields": {
 *       "boundary": {
 *         "name": "Boundary",
 *         "description": "Do boundary (Edge/Border cut)",
 *         "example": true,
 *         "required": true,
 *         "default": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "runtime": {
 *         "name": "Run time",
 *         "description": "Run time in minutes before returning to charging station",
 *         "example": 60,
 *         "required": true,
 *         "default": 30,
 *         "selector": {
 *           "number": {
 *             "min": 1,
 *             "max": 120,
 *             "step": 1,
 *             "unit_of_measurement": "minutes",
 *             "mode": "slider"
 *           }
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "schedule": {
 *     "name": "Set or update schedule",
 *     "description": "Set or change the schedule of the mower",
 *     "fields": {
 *       "type": {
 *         "name": "Schedule type",
 *         "description": "Change primary or secondary schedule?",
 *         "example": "primary",
 *         "required": true,
 *         "default": "primary",
 *         "selector": {
 *           "select": {
 *             "options": [
 *               "primary",
 *               "secondary"
 *             ]
 *           }
 *         }
 *       },
 *       "monday_start": {
 *         "name": "Monday, Start",
 *         "description": "Starting time for mondays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "monday_end": {
 *         "name": "Monday, End",
 *         "description": "When should the schedule stop on mondays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "monday_boundary": {
 *         "name": "Monday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "tuesday_start": {
 *         "name": "Tuesday, Start",
 *         "description": "Starting time for tuesdays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "tuesday_end": {
 *         "name": "Tuesday, End",
 *         "description": "When should the schedule stop on tuesdays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "tuesday_boundary": {
 *         "name": "Tuesday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "wednesday_start": {
 *         "name": "Wednesday, Start",
 *         "description": "Starting time for wednesdays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "wednesday_end": {
 *         "name": "Wednesday, End",
 *         "description": "When should the schedule stop on wednesdays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "wednesday_boundary": {
 *         "name": "Wednesday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "thursday_start": {
 *         "name": "Wednesday, Start",
 *         "description": "Starting time for thursdays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "thursday_end": {
 *         "name": "Thursday, End",
 *         "description": "When should the schedule stop on thursdays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "thursday_boundary": {
 *         "name": "Thursday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "friday_start": {
 *         "name": "Friday, Start",
 *         "description": "Starting time for fridays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "friday_end": {
 *         "name": "Friday, End",
 *         "description": "When should the schedule stop on fridays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "friday_boundary": {
 *         "name": "Friday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "saturday_start": {
 *         "name": "Saturday, Start",
 *         "description": "Starting time for saturdays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "saturday_end": {
 *         "name": "Saturday, End",
 *         "description": "When should the schedule stop on saturdays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "saturday_boundary": {
 *         "name": "Saturday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       },
 *       "sunday_start": {
 *         "name": "Sunday, Start",
 *         "description": "Starting time for sundays",
 *         "example": "11:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "sunday_end": {
 *         "name": "Sunday, End",
 *         "description": "When should the schedule stop on sundays?",
 *         "example": "16:00",
 *         "selector": {
 *           "time": null
 *         }
 *       },
 *       "sunday_boundary": {
 *         "name": "Sunday, Boundary",
 *         "description": "Should we start this schedule by cutting the boundary (edge/border cut)?",
 *         "example": false,
 *         "selector": {
 *           "boolean": null
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "torque": {
 *     "name": "Torque",
 *     "description": "Set wheel torque (if supported)",
 *     "fields": {
 *       "torque": {
 *         "name": "Wheel torque",
 *         "description": "Set wheel torque. Ranging from -50% to 50%",
 *         "example": 22,
 *         "required": true,
 *         "default": 0,
 *         "selector": {
 *           "number": {
 *             "min": -50,
 *             "max": 50,
 *             "step": 1,
 *             "unit_of_measurement": "%",
 *             "mode": "slider"
 *           }
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "send_raw": {
 *     "name": "Send RAW command",
 *     "description": " Send a raw JSON command to the device",
 *     "fields": {
 *       "json": {
 *         "name": "JSON data",
 *         "description": "Data to send, formatted as valid JSON",
 *         "example": "{'cmd': 1}",
 *         "required": true,
 *         "selector": {
 *           "text": null
 *         }
 *       }
 *     },
 *     "target": {
 *       "entity": [
 *         {
 *           "integration": "landroid_cloud",
 *           "domain": [
 *             "lawn_mower"
 *           ]
 *         }
 *       ]
 *     }
 *   }
 * },
 * lawn_mower:{
 *   "start_mowing": {
 *     "name": "Start mowing",
 *     "description": "Starts the mowing task.",
 *     "fields": {},
 *     "target": {
 *       "entity": [
 *         {
 *           "domain": [
 *             "lawn_mower"
 *           ],
 *           "supported_features": [
 *             1
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "pause": {
 *     "name": "Pause",
 *     "description": "Pauses the mowing task.",
 *     "fields": {},
 *     "target": {
 *       "entity": [
 *         {
 *           "domain": [
 *             "lawn_mower"
 *           ],
 *           "supported_features": [
 *             2
 *           ]
 *         }
 *       ]
 *     }
 *   },
 *   "dock": {
 *     "name": "Return to dock",
 *     "description": "Stops the mowing task and returns to the dock.",
 *     "fields": {},
 *     "target": {
 *       "entity": [
 *         {
 *           "domain": [
 *             "lawn_mower"
 *           ],
 *           "supported_features": [
 *             4
 *           ]
 *         }
 *       ]
 *     }
 *   }
 * }
 */
