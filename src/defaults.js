export const DEFAULT_LANG = 'en';

export const defaultConfig = {
  image: 'default',
  image_size: '4',

  show_animation: true,
  show_status: true,
  show_toolbar: true,
};

export const defaultAttributes = {
  accessories: null,
  locked: false,
  party_mode_enabled: false,
  torque: 0,
  zone: {
    current: 0,
    index: 7,
    indicies: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    starting_point: [0, 0, 0, 0],
  },
  supported_landroid_features: 16383,
  api_connected: false,
  device_class: 'landroid_cloud__state',
  friendly_name: 'Mower',
  supported_features: 12500,
  // battery_level: 100,
  // battery_icon: 'mdi:battery',
  // battery: {
  //   cycles: {
  //     total: 0,
  //     current: 0,
  //     reset_at: null,
  //     reset_time: null,
  //   },
  //   temperature: 20,
  //   voltage: 20,
  //   percent: 100,
  //   charging: false,
  // },
  // blades: {
  //   total_on: 0,
  //   reset_at: 0,
  //   reset_time: '1970-01-01T00:00:00+00:00',
  //   current_on: 0,
  // },
  // error: {
  //   id: 0,
  //   description: 'no error',
  // },
  // firmware: {
  //   auto_upgrade: false,
  //   version: '0',
  // },
  // mac_address: '000000000000',
  // model: 'Landroid Cloud',
  // online: false,
  // orientation: {
  //   pitch: 0,
  //   roll: 0,
  //   yaw: 0,
  // },
  rain_sensor: {
    delay: 0,
    triggered: false,
    remaining: 0,
  },
  // rssi: -99,
  // schedule: {
  //   next_schedule_start: '1970-01-01T00:00:00+00:00',
  //   time_extension: 0,
  //   active: false,
  //   auto_schedule: {
  //     settings: {
  //       boost: 2,
  //       exclusion_scheduler: {
  //         days: [
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //           {
  //             slots: [
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //               {
  //                 reason: 'irrigation',
  //                 duration: 0,
  //                 start_time: 0,
  //               },
  //             ],
  //             exclude_day: false,
  //           },
  //         ],
  //         exclude_nights: true,
  //       },
  //       grass_type: 'mixed_species',
  //       irrigation: true,
  //       nutrition: {
  //         k: 8,
  //         n: 20,
  //         p: 5,
  //       },
  //       soil_type: 'sand',
  //     },
  //     enabled: true,
  //   },
  //   primary: {
  //     monday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     tuesday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     wednesday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     thursday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     friday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     saturday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     sunday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //   },
  //   secondary: {
  //     monday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     tuesday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     wednesday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     thursday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     friday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     saturday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //     sunday: {
  //       start: '00:00',
  //       end: '00:00',
  //       duration: 0,
  //       boundary: false,
  //     },
  //   },
  // },
  // serial_number: '12345679012345678901',
  // statistics: {
  //   worktime_blades_on: 0,
  //   distance: 0,
  //   worktime_total: 0,
  // },
  // status_info: {
  //   id: 1,
  //   description: 'home',
  // },
  // time_zone: 'UTC',
  // state_updated_at: '1970-01-01T00:00:00+00:00',
  // capabilities: [],
  // daily_progress: 0,
  // next_scheduled_start: '1970-01-01T00:00:00+00:00',
};
