// import axios from "axios";

// /* ===============================
//    CONFIGURATION
// ================================ */
// const CONFIG = {
//   BUFFER_HOURS_AFTER_DELIVERY: 24,
//   YARD_HOLDING_THRESHOLD_HOURS: 12,
//   BOOKED_AVAILABILITY_DAYS: 2,
//   CACHE_TTL: 5 * 60 * 1000
// };

// const cache = new Map();

// function getCached(key) {
//   const item = cache.get(key);
//   if (item && Date.now() - item.time < CONFIG.CACHE_TTL) {
//     return item.data;
//   }
//   cache.delete(key);
//   return null;
// }

// function setCache(key, data) {
//   cache.set(key, { data, time: Date.now() });
// }

// /* ===============================
//    UTILITY FUNCTIONS
// ================================ */
// function haversine(lat1, lon1, lat2, lon2) {
//   const R = 6371;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const lat1Rad = (lat1 * Math.PI) / 180;
//   const lat2Rad = (lat2 * Math.PI) / 180;

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// function getIntelligentSpeed(currentSpeed, distanceKm, currentHour) {
//   if (currentSpeed > 60) return currentSpeed * 0.85;
//   if (currentSpeed > 10 && currentSpeed <= 60) return currentSpeed * 0.75;

//   const isPeakHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
//   const isNightTime = currentHour >= 22 || currentHour <= 5;

//   if (distanceKm < 50) {
//     if (isPeakHour) return 35;
//     if (isNightTime) return 55;
//     return 45;
//   }

//   if (distanceKm < 200) {
//     if (isPeakHour) return 60;
//     if (isNightTime) return 80;
//     return 70;
//   }

//   if (isPeakHour) return 70;
//   if (isNightTime) return 85;
//   return 75;
// }

// /* ===============================
//    GOOGLE ROUTES API
// ================================ */
// async function getAccurateRouteInfo(originLat, originLng, destAddress) {
//   try {
//     const res = await axios.post(
//       "https://routes.googleapis.com/directions/v2:computeRoutes",
//       {
//         origin: {
//           location: { latLng: { latitude: originLat, longitude: originLng } }
//         },
//         destination: { address: destAddress },
//         travelMode: "DRIVE",
//         routingPreference: "TRAFFIC_AWARE",
//         computeAlternativeRoutes: false,
//         routeModifiers: { vehicleInfo: { emissionType: "DIESEL" } },
//         languageCode: "en-US",
//         units: "IMPERIAL"
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-Goog-Api-Key": "AIzaSyDL5s9711qsNyZ7zJ4Tu68_np_Vq9lqMH8",
//           "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
//         },
//         timeout: 8000
//       }
//     );

//     const route = res.data?.routes?.[0];
//     if (!route) throw new Error("No route found");

//     const durationSeconds = parseInt(route.duration.replace("s", ""));
//     const distanceKm = route.distanceMeters / 1000;
//     const distanceMiles = distanceKm * 0.621371;

//     return {
//       durationMinutes: Math.round(durationSeconds / 60),
//       durationHours: +(durationSeconds / 3600).toFixed(2),
//       distanceKm: +distanceKm.toFixed(2),
//       distanceMiles: +distanceMiles.toFixed(2),
//       trafficAware: true,
//       source: "GOOGLE_ROUTES"
//     };
//   } catch (error) {
//     return null;
//   }
// }

// async function getIntelligentFallback(originLat, originLng, destLat, destLng, currentSpeed) {
//   const straightDistance = haversine(originLat, originLng, destLat, destLng);
//   const roadDistanceKm = straightDistance * 1.3;
//   const distanceMiles = roadDistanceKm * 0.621371;

//   const currentHour = new Date().getHours();
//   const estimatedSpeed = getIntelligentSpeed(currentSpeed, roadDistanceKm, currentHour);

//   const timeHours = roadDistanceKm / estimatedSpeed;
//   const timeMinutes = Math.round(timeHours * 60);

//   return {
//     durationMinutes: timeMinutes,
//     durationHours: +timeHours.toFixed(2),
//     distanceKm: +roadDistanceKm.toFixed(2),
//     distanceMiles: +distanceMiles.toFixed(2),
//     trafficAware: false,
//     source: "HAVERSINE_INTELLIGENT",
//     estimatedSpeed
//   };
// }

// /* ===============================
//    GEOCODING
// ================================ */
// async function geocodeAddress(address) {
//   if (!address) throw new Error("Address missing");

//   const cacheKey = `geo:${address}`;
//   const cached = getCached(cacheKey);
//   if (cached) return cached;

//   const res = await axios.get(
//     "https://maps.googleapis.com/maps/api/geocode/json",
//     {
//       params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
//       timeout: 5000
//     }
//   );

//   const result = res.data?.results?.[0];
//   if (!result) throw new Error("Geocode failed");

//   const data = {
//     lat: result.geometry.location.lat,
//     lng: result.geometry.location.lng,
//     formattedAddress: result.formatted_address
//   };

//   setCache(cacheKey, data);
//   return data;
// }

// /* ===============================
//    SAMSARA TRACKING - COMPANY SPECIFIC
// ================================ */

// // 313 LOGISTICS LLC
// async function getSamsaraLocation313(samsaraVehicleId) {
//   if (!samsaraVehicleId) throw new Error("No Samsara ID");
  
//   const res = await axios.get(
//     `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
//     {
//       headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY313}` },
//       params: { vehicleIds: samsaraVehicleId },
//       timeout: 3000
//     }
//   );

//   const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
//   console.log("🚛 313 Vehicle Data:", vehicle);
//   if (!vehicle?.locations?.[0]) throw new Error("No location data");

//   const loc = vehicle.locations[0];
//   return {
//     source: "SAMSARA_313",
//     lat: +loc.latitude,
//     lng: +loc.longitude,
//     speed: +loc.speed || 0,
//     time: loc.time
//   };
// }

// // HA TRANSPORTATION LLC
// async function getSamsaraLocationHA(samsaraVehicleId) {
//   if (!samsaraVehicleId) throw new Error("No Samsara ID");
  
//   const res = await axios.get(
//     `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
//     {
//       headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY}` },
//       params: { vehicleIds: samsaraVehicleId },
//       timeout: 3000
//     }
//   );

//   const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
//   console.log("🚛 HA Vehicle Data:", vehicle);
//   if (!vehicle?.locations?.[0]) throw new Error("No location data");

//   const loc = vehicle.locations[0];
//   return {
//     source: "SAMSARA_HA",
//     lat: +loc.latitude,
//     lng: +loc.longitude,
//     speed: +loc.speed || 0,
//     time: loc.time
//   };
// }

// // Chandi Logistics LLC
// async function getSamsaraLocationChandi(samsaraVehicleId) {
//   if (!samsaraVehicleId) throw new Error("No Samsara ID");
  
//   const res = await axios.get(
//     `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
//     {
//       headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY_CHANDI}` },
//       params: { vehicleIds: samsaraVehicleId },
//       timeout: 3000
//     }
//   );

//   const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
//   console.log("🚛 Chandi Vehicle Data:", vehicle);
//   if (!vehicle?.locations?.[0]) throw new Error("No location data");

//   const loc = vehicle.locations[0];
//   return {
//     source: "SAMSARA_CHANDI",
//     lat: +loc.latitude,
//     lng: +loc.longitude,
//     speed: +loc.speed || 0,
//     time: loc.time

//   };
// }


// async function getVehicleLocation(data) {
//   if (!data.samsaraVehicleId) {
//     throw new Error("No Samsara Vehicle ID");
//   }

//   if (!data.companyName) {
//     throw new Error("Company name missing in load");
//   }

//   const companyName = data.companyName.toUpperCase().trim();

//   console.log(`🚛 Tracking truck: ${data.truckName} | Company: ${companyName}`);

//   // Route to appropriate Samsara function based on company
//   try {
//     if (companyName.includes("313 LOGISTICS")) {
//       return await getSamsaraLocation313(data.samsaraVehicleId);
//     } 
//     else if (companyName.includes("HA TRANSPORTATION")) {
//       return await getSamsaraLocationHA(data.samsaraVehicleId);
//     } 
//     else if (companyName.includes("CHANDI LOGISTICS")) {
//       return await getSamsaraLocationChandi(data.samsaraVehicleId);
//     } 
//     else {
//       throw new Error(`Unknown company: ${companyName}`);
//     }
//   } catch (error) {
//     throw new Error(`Samsara tracking failed for ${companyName}: ${error.message}`);
//   }
// }

// /* ===============================
//    CORE LOGIC: TIME-BASED STATUS CALCULATION
// ================================ */
// async function calculateLoadStatus(load) {
//   const now = new Date();

//   const pickupDate = load.puDateTime ? new Date(load.puDateTime) : null;
//   const deliveryDate = load.delDateTime ? new Date(load.delDateTime) : null;
//   const loadStatus = load.loadStatus?.toUpperCase().trim();

//   if (!deliveryDate) {
//     throw new Error("Missing delivery date");
//   }


//   let liveLocation = null;

//   if (load.samsaraVehicleId) {
//     try {
//       liveLocation = await getVehicleLocation(load);

//       console.log("📍 LIVE LOCATION:", liveLocation);
//     } catch (err) {
//       console.log("⚠️ Location fetch failed:", err.message);
//     }
//   }

//   const trackingPayload = liveLocation
//     ? {
//         currentLocation: {
//           lat: liveLocation.lat,
//           lng: liveLocation.lng
//         },
//         speed: liveLocation.speed,
//         source: liveLocation.source,
//         lastUpdated: liveLocation.time
//       }
//     : null;

//   /* =========================================
//      STEP 2: BOOKED LOADS (LOCATION VISIBLE)
//   ========================================= */
//   if (loadStatus === "BOOKED") {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const delOnly = new Date(deliveryDate);
//     delOnly.setHours(0, 0, 0, 0);

//     const daysUntilDelivery = Math.ceil(
//       (delOnly - today) / (1000 * 60 * 60 * 24)
//     );

//     if (daysUntilDelivery >= CONFIG.BOOKED_AVAILABILITY_DAYS) {
//       return {
//         phase: "BOOKED_FAR_FUTURE",
//         status: "TRUCK_AVAILABLE",
//         truckAvailable: true,
//         tracking: trackingPayload,

//         reason: "Booked load far in future, truck traceable & usable",
//         availableFrom: now.toISOString(),
//         availableUntil: new Date(
//           deliveryDate.getTime() - 48 * 60 * 60 * 1000
//         ).toISOString(),

//         nextAction: "Can book intermediate load"
//       };
//     }

//     return {
//       phase: "BOOKED_NEAR_FUTURE",
//       status: "WAITING_FOR_DELIVERY",
//       truckAvailable: false,
//       tracking: trackingPayload,

//       reason: "Booked load near delivery",
//       nextActionTime: deliveryDate
//     };
//   }

//   /* =========================================
//      STEP 3: PRE-PICKUP (LOCATION STILL VISIBLE)
//   ========================================= */
//   if (pickupDate && now < pickupDate) {
//     return {
//       phase: "PRE_PICKUP",
//       status: "WAITING_FOR_PICKUP",
//       truckAvailable: false,
//       tracking: trackingPayload,

//       pickupInHours: Math.ceil(
//         (pickupDate - now) / (1000 * 60 * 60)
//       ),
//       nextAction: "Pickup scheduled",
//       nextActionTime: pickupDate
//     };
//   }

//   /* =========================================
//      STEP 4: IN-TRANSIT (ROUTE + ETA)
//   ========================================= */
//   if (pickupDate && now >= pickupDate && now < deliveryDate) {
//     if (!liveLocation) {
//       throw new Error("No live location for in-transit load");
//     }

//     const destination = await geocodeAddress(load.receiver);

//     let routeInfo = await getAccurateRouteInfo(
//       liveLocation.lat,
//       liveLocation.lng,
//       load.receiver
//     );

//     if (!routeInfo) {
//       routeInfo = await getIntelligentFallback(
//         liveLocation.lat,
//         liveLocation.lng,
//         destination.lat,
//         destination.lng,
//         liveLocation.speed
//       );
//     }

//     const eta = new Date(
//       now.getTime() + routeInfo.durationMinutes * 60 * 1000
//     );

//     const hoursEarly =
//       (deliveryDate - eta) / (1000 * 60 * 60);

//     if (hoursEarly >= CONFIG.YARD_HOLDING_THRESHOLD_HOURS) {
//       return {
//         phase: "IN_TRANSIT_EARLY_ARRIVAL",
//         status: "EN_ROUTE_TO_YARD",
//         truckAvailable: false,
//         tracking: trackingPayload,

//         yardHolding: {
//           willHold: true,
//           estimatedArrival: eta.toISOString(),
//           holdingHours: +hoursEarly.toFixed(2)
//         },

//         nextActionTime: deliveryDate
//       };
//     }

//     return {
//       phase: "IN_TRANSIT_ON_TIME",
//       status: "EN_ROUTE_DIRECT_DELIVERY",
//       truckAvailable: false,
//       tracking: {
//         ...trackingPayload,
//         distanceMiles: routeInfo.distanceMiles,
//         eta: eta.toISOString()
//       },

//       onTimeStatus: eta <= deliveryDate ? "ON_TIME" : "DELAYED",
//       nextActionTime: deliveryDate
//     };
//   }

//   /* =========================================
//      STEP 5: POST DELIVERY
//   ========================================= */
//   if (now >= deliveryDate) {
//     const bufferEnd = new Date(
//       deliveryDate.getTime() +
//         CONFIG.BUFFER_HOURS_AFTER_DELIVERY * 60 * 60 * 1000
//     );

//     if (now < bufferEnd) {
//       return {
//         phase: "POST_DELIVERY_BUFFER",
//         status: "BUFFER_ACTIVE",
//         truckAvailable: false,
//         tracking: trackingPayload,

//         truckAvailableFrom: bufferEnd.toISOString()
//       };
//     }

//     return {
//       phase: "COMPLETED",
//       status: "TRUCK_AVAILABLE",
//       truckAvailable: true,
//       tracking: trackingPayload,

//       availableFrom: bufferEnd.toISOString(),
//       availableLocation: load.receiver
//     };
//   }
// }


// /* ===============================
//    MAIN PROCESSING FUNCTION
// ================================ */
// export async function processTimeBasedTracking(loads, truckDataMap) {
//   const results = {
//     summary: {
//       total: 0,
//       availableTrucks: 0,
//       inTransit: 0,
//       yardHolding: 0,
//       inBuffer: 0,
//       waitingPickup: 0,
//       bookedButAvailable: 0
//     },
//     trucks: {
//       available: [],
//       unavailable: []
//     },
//     yardOperations: {
//       loadsAtYard: [],
//       pendingLocalDelivery: []
//     }
//   };

//   const promises = Object.entries(loads).map(async ([recordId, load]) => {
//     try {
//       results.summary.total++;

//       // Add recordId to load object for tracking
//       load.recordId = recordId;

//       const status = await calculateLoadStatus(load, truckDataMap);

//       const truckData = {
//         recordId,
//         loadNumber: load.loadNumber,
//         truck: load.truck,
//         trailer: load.trailer,
//         client: load.client,
//         ...status
//       };

//       if (status.truckAvailable) {
//         results.summary.availableTrucks++;
//         results.trucks.available.push(truckData);

//         if (status.phase === "BOOKED_FAR_FUTURE") {
//           results.summary.bookedButAvailable++;
//         }
//       } else {
//         results.trucks.unavailable.push(truckData);

//         if (status.phase === "IN_TRANSIT_EARLY_ARRIVAL") {
//           results.summary.yardHolding++;
//           results.yardOperations.loadsAtYard.push({
//             loadNumber: load.loadNumber,
//             truck: load.truck,
//             estimatedYardArrival: status.yardHolding.estimatedYardArrivalTime,
//             holdingHours: status.yardHolding.yardHoldingDuration,
//             localDriverNeededOn: status.yardHolding.localDriverAssignmentDate
//           });
//         } else if (status.phase === "IN_TRANSIT_ON_TIME") {
//           results.summary.inTransit++;
//         } else if (status.phase === "POST_DELIVERY_BUFFER") {
//           results.summary.inBuffer++;
//         } else if (status.phase === "PRE_PICKUP") {
//           results.summary.waitingPickup++;
//         }
//       }

//       return truckData;

//     } catch (error) {
//       return {
//         recordId,
//         loadNumber: load.loadNumber,
//         truck: load.truck,
//         error: error.message,
//         truckAvailable: false
//       };
//     }
//   });

//   await Promise.all(promises);

//   results.trucks.available.sort((a, b) => 
//     new Date(a.availableFrom) - new Date(b.availableFrom)
//   );

//   results.yardOperations.loadsAtYard.sort((a, b) =>
//     new Date(a.estimatedYardArrival) - new Date(b.estimatedYardArrival)
//   );

//   return results;
// }
import axios from "axios";

/* ===============================
   UTILITY: Distance calculation
================================ */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ===============================
   HELPER: Extract first value from array or return string
================================ */
function extractValue(field) {
  if (Array.isArray(field) && field.length > 0) {
    return field[0];
  }
  return field || '';
}

/* ===============================
   SAMSARA: Company-specific tracking
================================ */
async function getSamsaraLocationHA(samsaraVehicleId) {
  const res = await axios.get(
    `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
    {
      headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY}` },
      params: { vehicleIds: samsaraVehicleId },
      timeout: 3000
    }
  );

  const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
  if (!vehicle?.locations?.[0]) throw new Error("No location data");

  const loc = vehicle.locations[0];
  return {
    lat: +loc.latitude,
    lng: +loc.longitude,
    speed: +loc.speed || 0,
    time: loc.time,
    source: "SAMSARA_HA"
  };
}

async function getSamsaraLocation313(samsaraVehicleId) {
  const res = await axios.get(
    `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
    {
      headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY313}` },
      params: { vehicleIds: samsaraVehicleId },
      timeout: 3000
    }
  );

  const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
  if (!vehicle?.locations?.[0]) throw new Error("No location data");

  const loc = vehicle.locations[0];
  return {
    lat: +loc.latitude,
    lng: +loc.longitude,
    speed: +loc.speed || 0,
    time: loc.time,
    source: "SAMSARA_313"
  };
}

async function getSamsaraLocationChandi(samsaraVehicleId) {
  const res = await axios.get(
    `${process.env.SAMSARA_BASE_URL}/fleet/vehicles/locations/feed`,
    {
      headers: { Authorization: `Bearer ${process.env.SAMSARA_API_KEY_CHANDI}` },
      params: { vehicleIds: samsaraVehicleId },
      timeout: 3000
    }
  );

  const vehicle = res.data?.data?.find(v => v.id === samsaraVehicleId);
  if (!vehicle?.locations?.[0]) throw new Error("No location data");

  const loc = vehicle.locations[0];
  return {
    lat: +loc.latitude,
    lng: +loc.longitude,
    speed: +loc.speed || 0,
    time: loc.time,
    source: "SAMSARA_CHANDI"
  };
}

/* ===============================
   GEOCODING: Receiver address to coordinates
================================ */
async function geocodeAddress(address) {
  if (!address) throw new Error("Address missing");

  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: { 
        address, 
        key: process.env.GOOGLE_MAPS_API_KEY 
      },
      timeout: 5000
    }
  );

  const result = res.data?.results?.[0];
  if (!result) throw new Error("Geocode failed");

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address
  };
}

/* ===============================
   GOOGLE ROUTES: Traffic-aware ETA
================================ */
async function getGoogleRoutesETA(originLat, originLng, destAddress) {
  try {
    const res = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: {
          location: { latLng: { latitude: originLat, longitude: originLng } }
        },
        destination: { address: destAddress },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: { vehicleInfo: { emissionType: "DIESEL" } },
        languageCode: "en-US",
        units: "IMPERIAL"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": "AIzaSyDL5s9711qsNyZ7zJ4Tu68_np_Vq9lqMH8",
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
        },
        timeout: 8000
      }
    );

    const route = res.data?.routes?.[0];
    if (!route) return null;

    const durationSeconds = parseInt(route.duration.replace("s", ""));
    const distanceKm = route.distanceMeters / 1000;
    const distanceMiles = distanceKm * 0.621371;

    return {
      durationMinutes: Math.round(durationSeconds / 60),
      durationHours: +(durationSeconds / 3600).toFixed(2),
      distanceMiles: +distanceMiles.toFixed(2),
      source: "GOOGLE_ROUTES"
    };
  } catch (error) {
    console.log("⚠️ Google Routes failed:", error.message);
    return null;
  }
}

/* ===============================
   FALLBACK: Haversine + Speed-based ETA
================================ */
function getIntelligentSpeed(currentSpeed, distanceKm) {
  if (currentSpeed > 60) return currentSpeed * 0.85;
  if (currentSpeed > 10) return currentSpeed * 0.75;
  
  if (distanceKm < 50) return 45;
  if (distanceKm < 200) return 70;
  return 75;
}

function getFallbackETA(originLat, originLng, destLat, destLng, currentSpeed) {
  const straightDistance = haversine(originLat, originLng, destLat, destLng);
  const roadDistanceKm = straightDistance * 1.3;
  const distanceMiles = roadDistanceKm * 0.621371;

  const estimatedSpeed = getIntelligentSpeed(currentSpeed, roadDistanceKm);
  const timeHours = roadDistanceKm / estimatedSpeed;
  const timeMinutes = Math.round(timeHours * 60);

  return {
    durationMinutes: timeMinutes,
    durationHours: +timeHours.toFixed(2),
    distanceMiles: +distanceMiles.toFixed(2),
    source: "HAVERSINE_FALLBACK",
    estimatedSpeed
  };
}



/* ===============================
   MAIN: Process In-Transit Loads + Available Trucks
================================ */
export async function processInTransitLoads(loads, truckDataMap) {


  console.log("🚚 Starting In-Transit Loads Processing...",truckDataMap);
  const pstOptions = { timeZone: 'America/Los_Angeles' };
  const nowPST = new Date(new Date().toLocaleString('en-US', pstOptions));
  
  const todayPST = new Date(nowPST);
  todayPST.setHours(0, 0, 0, 0);
  
  const twoDaysLater = new Date(todayPST);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const results = {
    inTransit: {
      today: [],
      tomorrow: [],
      future: []
    },
    availableTrucks: {
      condition1_DeliveredTodayNoNextLoad: [],
      condition2_BookedButFarFuture: [],
      condition3_NotInLoadsList: []
    },
    errors: []
  };

  const inTransitTrucks = new Map();
  const bookedTrucks = new Map();

  // ==========================================
  // STEP 1: Process IN TRANSIT loads
  // ==========================================
  for (const [recordId, load] of Object.entries(loads)) {
    const status = load.loadStatus;
    console.log(`🚛 Load ${load.loadNumber} status: ${status}`)``;
    

    try {
      // Extract truck ID from array
      const truckId = extractValue(load.truck);
      if (!truckId) {
        throw new Error("No truck ID found");
      }

      const truckData = truckDataMap.get(truckId);
      if (!truckData) {
        throw new Error(`Truck data not found for ID: ${truckId}`);
      }

      const companyName = truckData.companyName?.toUpperCase().trim();
      
      console.log(`🚛 Processing load: ${load.loadNumber} | Truck: ${truckData.truckName} | Company: ${companyName}`);
      // Extract samsaraVehicleId from array
      const samsaraVehicleId = extractValue(load.samsaraVehicleId);
      
      if (!companyName || !samsaraVehicleId) {
        throw new Error("Missing company or Samsara ID");
      }

      // Get live location
      let liveLocation;
      if (companyName.includes("HA TRANSPORTATION")) {
        liveLocation = await getSamsaraLocationHA(samsaraVehicleId);
      } else if (companyName.includes("313 LOGISTICS")) {
        liveLocation = await getSamsaraLocation313(samsaraVehicleId);
      } else if (companyName.includes("CHANDI LOGISTICS")) {
        liveLocation = await getSamsaraLocationChandi(samsaraVehicleId);
      } else {
        throw new Error(`Unknown company: ${companyName}`);
      }

      const destination = await geocodeAddress(load.receiver);

      let routeInfo = await getGoogleRoutesETA(
        liveLocation.lat,
        liveLocation.lng,
        load.receiver
      );

      if (!routeInfo) {
        routeInfo = getFallbackETA(
          liveLocation.lat,
          liveLocation.lng,
          destination.lat,
          destination.lng,
          liveLocation.speed
        );
      }

      const arrivalTime = new Date(
        nowPST.getTime() + routeInfo.durationMinutes * 60 * 1000
      );

      const arrivalDayStart = new Date(arrivalTime);
      arrivalDayStart.setHours(0, 0, 0, 0);

      const tomorrowPST = new Date(todayPST);
      tomorrowPST.setDate(tomorrowPST.getDate() + 1);

      let deliveryDay = "FUTURE";
      if (arrivalDayStart.getTime() === todayPST.getTime()) {
        deliveryDay = "TODAY";
      } else if (arrivalDayStart.getTime() === tomorrowPST.getTime()) {
        deliveryDay = "TOMORROW";
      }

      // Track truck with its ID
      inTransitTrucks.set(truckId, {
        deliveryDay,
        arrivalDate: arrivalDayStart,
        truckName: truckData.truckName
      });

      const result = {
        id: recordId,
        truckId: truckId,
        load: load.loadNumber,
        truck: truckData.truckName,
        trailer: extractValue(load.trailer),
        client: extractValue(load.client),
        receiver: load.receiver,
        
        currentLocation: {
          lat: liveLocation.lat,
          lng: liveLocation.lng,
          speed: liveLocation.speed
        },
        
        destination: {
          address: destination.formattedAddress,
          lat: destination.lat,
          lng: destination.lng
        },
        
        estimatedArrival: arrivalTime.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Los_Angeles'
        }),
        
        eta: routeInfo.durationHours,
        distance: routeInfo.distanceMiles,
        deliveryDay,
        company: companyName
      };

      if (deliveryDay === "TODAY") {
        results.inTransit.today.push(result);
      } else if (deliveryDay === "TOMORROW") {
        results.inTransit.tomorrow.push(result);
      } else {
        results.inTransit.future.push(result);
      }

    } catch (error) {
      console.error(`❌ Error processing ${load.loadNumber}:`, error.message);
      results.errors.push({
        id: recordId,
        load: load.loadNumber,
        truck: extractValue(load.truck),
        error: error.message
      });
    }
  }

  // ==========================================
  // STEP 2: Process BOOKED loads
  // ==========================================
  for (const [recordId, load] of Object.entries(loads)) {
    const status = load.loadStatus?.toUpperCase().trim();
    
    if (status !== 'BOOKED') continue;
    
    const truckId = extractValue(load.truck);
    if (!truckId) continue;
    
    const puDate = load.puDateTime ? new Date(load.puDateTime) : null;
    if (puDate) {
      const truckData = truckDataMap.get(truckId);
      bookedTrucks.set(truckId, {
        puDateTime: puDate,
        loadNumber: load.loadNumber,
        recordId,
        truckName: truckData?.truckName || truckId
      });
    }
  }

  // ==========================================
  // CONDITION 1: In-Transit delivering TODAY + No next load
  // ==========================================
  for (const [truckId, info] of inTransitTrucks.entries()) {
    if (info.deliveryDay === "TODAY") {
      const hasNextLoad = bookedTrucks.has(truckId);
      
      if (!hasNextLoad) {
        results.availableTrucks.condition1_DeliveredTodayNoNextLoad.push({
          truckId: truckId,
          truck: info.truckName,
          reason: "Delivering today, no next load booked",
          availableFrom: "Today after delivery",
          deliveryDay: info.deliveryDay
        });
      } else {
        // Check if next pickup is same day as delivery
        const nextLoad = bookedTrucks.get(truckId);
        const nextPickupDate = new Date(nextLoad.puDateTime);
        nextPickupDate.setHours(0, 0, 0, 0);
        
        if (nextPickupDate.getTime() === info.arrivalDate.getTime()) {
          results.availableTrucks.condition1_DeliveredTodayNoNextLoad.push({
            truckId: truckId,
            truck: info.truckName,
            reason: "Delivering today, next pickup same day (available for intermediate load)",
            availableFrom: "Today after delivery",
            nextLoad: nextLoad.loadNumber,
            deliveryDay: info.deliveryDay
          });
        }
      }
    }
  }

  // ==========================================
  // CONDITION 2: Booked but puDateTime 2+ days later
  // ==========================================
  for (const [truckId, bookingInfo] of bookedTrucks.entries()) {
    const puDate = new Date(bookingInfo.puDateTime);
    puDate.setHours(0, 0, 0, 0);
    
    if (puDate >= twoDaysLater) {
      const daysUntilPickup = Math.ceil((puDate - todayPST) / (1000 * 60 * 60 * 24));
      
      results.availableTrucks.condition2_BookedButFarFuture.push({
        truckId: truckId,
        truck: bookingInfo.truckName,
        reason: "Booked load far in future (2+ days)",
        availableFrom: "Now",
        availableUntil: puDate.toLocaleDateString('en-US', { 
          timeZone: 'America/Los_Angeles' 
        }),
        daysUntilNextLoad: daysUntilPickup,
        nextLoad: bookingInfo.loadNumber
      });
    }
  }

  // ==========================================
  // CONDITION 3: Trucks NOT in loads list
  // ==========================================
  const trucksInLoads = new Set();
  
  for (const load of Object.values(loads)) {
    const truckId = extractValue(load.truck);
    if (truckId) {
      trucksInLoads.add(truckId);
    }
  }

  for (const [truckId, truckData] of truckDataMap.entries()) {
    if (!trucksInLoads.has(truckId)) {
      results.availableTrucks.condition3_NotInLoadsList.push({
        truckId: truckId,
        truck: truckData.truckName,
        company: truckData.companyName,
        reason: "Not assigned to any load (completely available)",
        availableFrom: "Now",
        status: "FREE"
      });
    }
  }

  // Sort results
  results.inTransit.today.sort((a, b) => a.eta - b.eta);
  results.inTransit.tomorrow.sort((a, b) => a.eta - b.eta);
  results.inTransit.future.sort((a, b) => a.eta - b.eta);

  return results;
}