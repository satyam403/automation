// import axios from "axios";

// function extractSingleValue(field) {
//   if (Array.isArray(field)) {
//     return field.length > 0 ? String(field[0]).trim() : null;
//   }
//   if (field === undefined || field === null) return null;
//   return String(field).trim();
// }

// /* ===============================
//    UTILITY: Distance calculation
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

// function getPSTNow() {
//   return new Date(
//     new Date().toLocaleString("en-US", {
//       timeZone: "America/Los_Angeles"
//     })
//   );
// }

// /* ===============================
//    SAMSARA API
// ================================ */
// async function fetchSamsaraLocation(samsaraVehicleId, apiKey, companySource) {
//   if (!samsaraVehicleId || !apiKey) {
//     throw new Error(`Missing credentials - VehicleID: ${!!samsaraVehicleId}, APIKey: ${!!apiKey}`);
//   }

//   try {
//     const url = `https://api.samsara.com/fleet/vehicles/locations/feed`;
    
//     const res = await axios.get(url, {
//       headers: { 
//         Authorization: `Bearer ${apiKey}`,
//         'Accept': 'application/json'
//       },
//       params: { vehicleIds: samsaraVehicleId },
//       timeout: 15000,
//       validateStatus: function (status) {
//         return status < 500;
//       }
//     });

//     if (res.status === 401) {
//       throw new Error(`Unauthorized - Invalid API key for ${companySource}`);
//     }
    
//     if (res.status === 403) {
//       throw new Error(`Forbidden - No access to vehicle ${samsaraVehicleId}`);
//     }

//     if (res.status === 404) {
//       throw new Error(`Vehicle ${samsaraVehicleId} not found in Samsara`);
//     }

//     if (res.status >= 400) {
//       throw new Error(`Samsara API error ${res.status}`);
//     }

//     if (!res.data?.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
//       throw new Error(`Empty data array`);
//     }

//     const vehicle = res.data.data.find(v => v.id === samsaraVehicleId);
    
//     if (!vehicle) {
//       throw new Error(`Vehicle ${samsaraVehicleId} not in response`);
//     }

//     if (!vehicle.locations || vehicle.locations.length === 0) {
//       throw new Error(`No location data for vehicle ${samsaraVehicleId}`);
//     }

//     const loc = vehicle.locations[0];
    
//     if (!loc.latitude || !loc.longitude) {
//       throw new Error(`Invalid coordinates`);
//     }

//     return {
//       lat: +loc.latitude,
//       lng: +loc.longitude,
//       speed: +(loc.speed || 0),
//       time: loc.time,
//       source: 'SAMSARA'
//     };

//   } catch (error) {
//     if (error.response) {
//       throw new Error(`Samsara API ${error.response.status}`);
//     } else if (error.request) {
//       throw new Error(`No response from Samsara - timeout or network issue`);
//     } else {
//       throw error;
//     }
//   }
// }

// /* ===============================
//    SKYBITZ API with Auth
// ================================ */
// let skybitzToken = null;
// let skybitzTokenExpiry = null;

// async function getSkybitzToken() {
//   const username = process.env.SKYBITZ_USER;
//   const password = process.env.SKYBITZ_PASS;

//   if (!username || !password) {
//     throw new Error('SKYBITZ_USERNAME or SKYBITZ_PASSWORD not set');
//   }

//   // Check if token is still valid (with 5 min buffer)
//   if (skybitzToken && skybitzTokenExpiry && Date.now() < skybitzTokenExpiry - 300000) {
//     return skybitzToken;
//   }

//   try {
//     const res = await axios.post(
//       'https://api.skybitz.com/auth/login',
//       {
//         username: username,
//         password: password
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         timeout: 10000
//       }
//     );

//     if (!res.data?.token) {
//       throw new Error('No token in Skybitz auth response');
//     }

//     skybitzToken = res.data.token;
//     // Token usually valid for 24 hours, store expiry
//     skybitzTokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours

//     return skybitzToken;

//   } catch (error) {
//     skybitzToken = null;
//     skybitzTokenExpiry = null;
//     throw new Error(`Skybitz auth failed: ${error.message}`);
//   }
// }

// async function fetchSkybitzLocation(truckNumber) {
//   if (!truckNumber) {
//     throw new Error('Missing truck number for Skybitz');
//   }

//   try {
//     const token = await getSkybitzToken();

//     const url = `https://api.skybitz.com/v1/assets/${truckNumber}/location`;
    
//     const res = await axios.get(url, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/json'
//       },
//       timeout: 15000
//     });

//     if (!res.data || !res.data.latitude || !res.data.longitude) {
//       throw new Error('Invalid Skybitz response');
//     }

//     return {
//       lat: +res.data.latitude,
//       lng: +res.data.longitude,
//       speed: +(res.data.speed || 0),
//       time: res.data.timestamp,
//       source: 'SKYBITZ'
//     };

//   } catch (error) {
//     // If auth error, reset token and retry once
//     if (error.response?.status === 401 && skybitzToken) {
//       skybitzToken = null;
//       skybitzTokenExpiry = null;
      
//       try {
//         const newToken = await getSkybitzToken();
//         const retryRes = await axios.get(
//           `https://api.skybitz.com/v1/assets/${truckNumber}/location`,
//           {
//             headers: {
//               'Authorization': `Bearer ${newToken}`,
//               'Accept': 'application/json'
//             },
//             timeout: 15000
//           }
//         );

//         if (!retryRes.data || !retryRes.data.latitude || !retryRes.data.longitude) {
//           throw new Error('Invalid Skybitz response on retry');
//         }

//         return {
//           lat: +retryRes.data.latitude,
//           lng: +retryRes.data.longitude,
//           speed: +(retryRes.data.speed || 0),
//           time: retryRes.data.timestamp,
//           source: 'SKYBITZ'
//         };
//       } catch (retryError) {
//         throw new Error(`Skybitz retry failed: ${retryError.message}`);
//       }
//     }

//     throw new Error(`Skybitz error: ${error.message}`);
//   }
// }

// /* ===============================
//    SAMSARA: Company routing
// ================================ */
// async function getVehicleLocation(companyName, samsaraVehicleId, truckNumber) {
//   if (!companyName) {
//     throw new Error("Missing company name");
//   }

//   const normalized = companyName.toUpperCase().trim();

//   // Agar Samsara ID hai, try Samsara first
//   if (samsaraVehicleId) {
//     try {
//       // HA TRANSPORTATION
//       if (normalized.includes("HA TRANSPORTATION") || 
//           normalized.includes("HA TRANS") ||
//           normalized === "HA TRANSPORTATION LLC") {
        
//         const apiKey = process.env.SAMSARA_API_KEY;
//         if (apiKey) {
//           return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_HA");
//         }
//       }
      
//       // 313 LOGISTICS
//       if (normalized.includes("313 LOGISTICS") || 
//           normalized.includes("313LOGISTICS") ||
//           normalized.includes("313 TRANSPORT") ||
//           normalized === "313 LOGISTICS LLC" ||
//           normalized === "313 TRANSPORT LLC") {
        
//         const apiKey = process.env.SAMSARA_API_KEY313;
//         if (apiKey) {
//           return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_313");
//         }
//       }
      
//       // CHANDI LOGISTICS
//       if (normalized.includes("CHANDI LOGISTICS") || 
//           normalized.includes("CHANDILOGISTICS") ||
//           normalized === "CHANDI LOGISTICS LLC") {
        
//         const apiKey = process.env.SAMSARA_API_KEY_CHANDI;
//         if (apiKey) {
//           return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_CHANDI");
//         }
//       }
//     } catch (samsaraError) {
//     }
//   }

//   if (truckNumber) {
//     return await fetchSkybitzLocation(truckNumber);
//   }

//   throw new Error(`Cannot get location - no Samsara ID or truck number`);
// }

// /* ===============================
//    GEOCODING
// ================================ */
// async function geocodeAddress(address) {
//   if (!address) throw new Error("Address missing");

//   try {
//     const res = await axios.get(
//       "https://maps.googleapis.com/maps/api/geocode/json",
//       {
//         params: { 
//           address, 
//           key: process.env.GOOGLE_MAPS_API_KEY 
//         },
//         timeout: 8000
//       }
//     );

//     if (res.data.status === 'ZERO_RESULTS') {
//       throw new Error("Address not found");
//     }

//     if (res.data.status !== 'OK') {
//       throw new Error(`Geocoding failed: ${res.data.status}`);
//     }

//     const result = res.data?.results?.[0];
//     if (!result) throw new Error("No geocoding results");

//     return {
//       lat: result.geometry.location.lat,
//       lng: result.geometry.location.lng,
//       formattedAddress: result.formatted_address
//     };
//   } catch (error) {
//     throw error;
//   }
// }

// /* ===============================
//    GOOGLE ROUTES ETA
// ================================ */
// async function getGoogleRoutesETA(originLat, originLng, destAddress) {
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
//           "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
//           "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
//         },
//         timeout: 10000
//       }
//     );

//     const route = res.data?.routes?.[0];
//     if (!route) return null;

//     const durationSeconds = parseInt(route.duration.replace("s", ""));
//     const distanceKm = route.distanceMeters / 1000;
//     const distanceMiles = distanceKm * 0.621371;

//     return {
//       durationMinutes: Math.round(durationSeconds / 60),
//       durationHours: +(durationSeconds / 3600).toFixed(2),
//       distanceMiles: +distanceMiles.toFixed(2),
//       source: "GOOGLE_ROUTES"
//     };
//   } catch (error) {
//     return null;
//   }
// }

// /* ===============================
//    FALLBACK ETA
// ================================ */
// function getIntelligentSpeed(currentSpeed, distanceKm) {
//   if (currentSpeed > 60) return currentSpeed * 0.85;
//   if (currentSpeed > 10) return currentSpeed * 0.75;
  
//   if (distanceKm < 50) return 45;
//   if (distanceKm < 200) return 70;
//   return 75;
// }

// function getFallbackETA(originLat, originLng, destLat, destLng, currentSpeed) {
//   const straightDistance = haversine(originLat, originLng, destLat, destLng);
//   const roadDistanceKm = straightDistance * 1.3;
//   const distanceMiles = roadDistanceKm * 0.621371;

//   const estimatedSpeed = getIntelligentSpeed(currentSpeed, roadDistanceKm);
//   const timeHours = roadDistanceKm / estimatedSpeed;
//   const timeMinutes = Math.round(timeHours * 60);

//   return {
//     durationMinutes: timeMinutes,
//     durationHours: +timeHours.toFixed(2),
//     distanceMiles: +distanceMiles.toFixed(2),
//     source: "HAVERSINE_FALLBACK",
//     estimatedSpeed
//   };
// }

// /* ===============================
//    DELIVERY DAY - FIXED VERSION
// ================================ */
// function getDeliveryDay(etaHours, nowPST, scheduledDeliveryPST) {       
//   const estimatedDeliveryTime = new Date(nowPST);
//   estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + etaHours);
  
//   const todayStart = new Date(nowPST);
//   todayStart.setHours(0, 0, 0, 0);
  
//   const tomorrowStart = new Date(todayStart);
//   tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  
//   const tomorrowEnd = new Date(tomorrowStart);
//   tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  
//   // Already in PST, just convert to Date object
//   const scheduledDate = scheduledDeliveryPST ? new Date(scheduledDeliveryPST) : null;
  
//   // Check if late (estimated delivery is after scheduled delivery)
//   if (scheduledDate && estimatedDeliveryTime > scheduledDate) {
//     return "LATE";
//   }
  
//   // Check delivery day
//   if (estimatedDeliveryTime >= todayStart && estimatedDeliveryTime < tomorrowStart) {
//     return "TODAY";
//   } else if (estimatedDeliveryTime >= tomorrowStart && estimatedDeliveryTime < tomorrowEnd) {
//     return "TOMORROW";
//   } else {
//     return "LATER";
//   }
// }

// /* ===============================
//    MAIN: Process In-Transit from Map
// ================================ */
// export async function processInTransitLoads(loads, truckMap, inTransitTruckMap) {
//   const nowPST = getPSTNow();
//   const results = { inTransit: [], errors: [] };

//   const entries = inTransitTruckMap instanceof Map 
//     ? Array.from(inTransitTruckMap.entries())
//     : Object.entries(inTransitTruckMap || {});

//   for (const [truckKey, truckData] of entries) {
//     try {
//       const {
//         truckName,
//         truckId,
//         companyName,
//         samsaraVehicleId,
//         loadNumber,
//         receiverAddress,
//         deliveryDateTime,
//         trailerName,
//         hasNextBooking
//       } = truckData;

//       if (!receiverAddress) {
//         throw new Error('No receiver address');
//       }

//       // Get truck location (Samsara or Skybitz)
//       let liveLocation = null;
//       const truckNumber = truckName?.match(/\d+/)?.[0];
      
//       try {
//         liveLocation = await getVehicleLocation(
//           companyName,
//           samsaraVehicleId,
//           truckNumber
//         );
//       } catch (locationError) {
//         throw new Error(`Location unavailable: ${locationError.message}`);
//       }

//       // Calculate ETA
//       let etaData = null;
//       if (liveLocation) {
//         etaData = await getGoogleRoutesETA(
//           liveLocation.lat,
//           liveLocation.lng,
//           receiverAddress
//         );
        
//         if (!etaData) {
//           const destCoords = await geocodeAddress(receiverAddress);
//           etaData = getFallbackETA(
//             liveLocation.lat,
//             liveLocation.lng,
//             destCoords.lat,
//             destCoords.lng,
//             liveLocation.speed
//           );
//         }
//       }

//       if (!etaData) {
//         throw new Error('Could not calculate ETA');
//       }

//       // Calculate delivery day and estimated delivery time
//       const deliveryDay = getDeliveryDay(
//         etaData.durationHours, 
//         nowPST,
//         deliveryDateTime
//       );

//       const estimatedDeliveryTime = new Date(nowPST);
//       estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + etaData.durationMinutes);

//       results.inTransit.push({
//         loadNumber,
//         truckName,
//         truckId,
//         trailerName,
//         receiver: receiverAddress,
//         scheduledDelivery: deliveryDateTime, // Already in PST from data source
//         etaHours: etaData.durationHours,
//         etaMinutes: etaData.durationMinutes,
//         distanceMiles: etaData.distanceMiles,
//         deliveryDay,
//         estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
//         currentSpeed: liveLocation?.speed || 0,
//         source: etaData.source,
//         locationSource: liveLocation.source,
//         hasNextBooking
//       });

//     } catch (err) {
//       results.errors.push({
//         truckName: truckData.truckName,
//         loadNumber: truckData.loadNumber,
//         error: err.message
//       });
//     }
//   }

//   if (results.errors.length > 0) {
//     console.log('Error details:', JSON.stringify(results.errors, null, 2));
//   }

//   return results;
// }

// /* ===============================
//    CALCULATE AVAILABLE TRUCKS
// ================================ */
// export function calculateAvailableTrucks(inTransitResults, bookedLoads, allTrucks) {
//   const nowPST = getPSTNow();
//   const todayStart = new Date(nowPST);
//   todayStart.setHours(0, 0, 0, 0);

//   const availableTrucks = [];
//   const inTransitTruckIds = new Set();
//   const bookedTruckIds = new Set();

//   // In-transit trucks
//   for (const inTransit of inTransitResults) {
//     inTransitTruckIds.add(inTransit.truckId);
//   }

//   // Booked trucks
//   for (const booking of bookedLoads) {
//     const truckId = extractSingleValue(booking.truck);
//     if (truckId) {
//       bookedTruckIds.add(truckId);
//     }
//   }

//   // Completely free trucks
//   for (const [truckId, truckData] of Object.entries(allTrucks)) {
//     if (inTransitTruckIds.has(truckId) || bookedTruckIds.has(truckId)) {
//       continue;
//     }

//     availableTrucks.push({
//       truckName: truckData.truckName,
//       truckId: truckId,
//       companyName: truckData.companyName,
//       reason: "Not in-transit and not booked",
//       availableFrom: todayStart.toLocaleDateString()
//     });
//   }

//   // In-transit trucks delivering today with NO next booking
//   const alreadyAddedTruckIds = new Set(availableTrucks.map(t => t.truckId));
  
//   for (const inTransit of inTransitResults) {
//     if (alreadyAddedTruckIds.has(inTransit.truckId)) {
//       continue;
//     }

//     if (!inTransit.hasNextBooking && inTransit.deliveryDay === "TODAY") {
//       availableTrucks.push({
//         truckName: inTransit.truckName,
//         truckId: inTransit.truckId,
//         reason: "Delivering today with no next booking",
//         availableFrom: new Date(inTransit.estimatedDeliveryTime).toLocaleDateString(),
//         estimatedFreeTime: new Date(inTransit.estimatedDeliveryTime).toLocaleString()
//       });
//       alreadyAddedTruckIds.add(inTransit.truckId);
//     }
//   }

//   const totalBusy = inTransitTruckIds.size + bookedTruckIds.size - 
//                     [...inTransitTruckIds].filter(id => bookedTruckIds.has(id)).length;

//   return {
//     availableTrucks,
//     inTransitTruckIds: Array.from(inTransitTruckIds),
//     bookedTruckIds: Array.from(bookedTruckIds),
//     summary: {
//       total: Object.keys(allTrucks).length,
//       inTransit: inTransitTruckIds.size,
//       booked: bookedTruckIds.size,
//       available: availableTrucks.length,
//       busy: totalBusy
//     }
//   };
// }
import axios from "axios";

function extractSingleValue(field) {
  if (Array.isArray(field)) {
    return field.length > 0 ? String(field[0]).trim() : null;
  }
  if (field === undefined || field === null) return null;
  return String(field).trim();
}

/* ===============================
   UTILITY: Distance calculation
   ================================ */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPSTNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
}

/* ===============================
   SAMSARA API
   ================================ */
async function fetchSamsaraLocation(samsaraVehicleId, apiKey, companySource) {
  if (!samsaraVehicleId || !apiKey) {
    throw new Error(`Missing credentials - VehicleID: ${!!samsaraVehicleId}, APIKey: ${!!apiKey}`);
  }

  try {
    const url = `https://api.samsara.com/fleet/vehicles/locations/feed`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      params: { vehicleIds: samsaraVehicleId },
      timeout: 15000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (res.status === 401) {
      throw new Error(`Unauthorized - Invalid API key for ${companySource}`);
    }
    if (res.status === 403) {
      throw new Error(`Forbidden - No access to vehicle ${samsaraVehicleId}`);
    }
    if (res.status === 404) {
      throw new Error(`Vehicle ${samsaraVehicleId} not found in Samsara`);
    }
    if (res.status >= 400) {
      throw new Error(`Samsara API error ${res.status}`);
    }

    if (!res.data?.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error(`Empty data array`);
    }

    const vehicle = res.data.data.find(v => v.id === samsaraVehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${samsaraVehicleId} not in response`);
    }

    if (!vehicle.locations || vehicle.locations.length === 0) {
      throw new Error(`No location data for vehicle ${samsaraVehicleId}`);
    }

    const loc = vehicle.locations[0];
    if (!loc.latitude || !loc.longitude) {
      throw new Error(`Invalid coordinates`);
    }

    return {
      lat: +loc.latitude,
      lng: +loc.longitude,
      speed: +(loc.speed || 0),
      time: loc.time,
      source: 'SAMSARA'
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Samsara API ${error.response.status}`);
    } else if (error.request) {
      throw new Error(`No response from Samsara - timeout or network issue`);
    } else {
      throw error;
    }
  }
}

/* ===============================
   SKYBITZ API with Auth
   ================================ */
let skybitzToken = null;
let skybitzTokenExpiry = null;

async function getSkybitzToken() {
  const username = process.env.SKYBITZ_USER;
  const password = process.env.SKYBITZ_PASS;

  if (!username || !password) {
    throw new Error('SKYBITZ_USERNAME or SKYBITZ_PASSWORD not set');
  }

  // Check if token is still valid (with 5 min buffer)
  if (skybitzToken && skybitzTokenExpiry && Date.now() < skybitzTokenExpiry - 300000) {
    return skybitzToken;
  }

  try {
    const res = await axios.post(
      'https://api.skybitz.com/auth/login',
      { username: username, password: password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    if (!res.data?.token) {
      throw new Error('No token in Skybitz auth response');
    }

    skybitzToken = res.data.token;
    // Token usually valid for 24 hours, store expiry
    skybitzTokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
    return skybitzToken;
  } catch (error) {
    skybitzToken = null;
    skybitzTokenExpiry = null;
    throw new Error(`Skybitz auth failed: ${error.message}`);
  }
}

async function fetchSkybitzLocation(truckNumber) {
  if (!truckNumber) {
    throw new Error('Missing truck number for Skybitz');
  }

  try {
    const token = await getSkybitzToken();
    const url = `https://api.skybitz.com/v1/assets/${truckNumber}/location`;
    
    const res = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (!res.data || !res.data.latitude || !res.data.longitude) {
      throw new Error('Invalid Skybitz response');
    }

    return {
      lat: +res.data.latitude,
      lng: +res.data.longitude,
      speed: +(res.data.speed || 0),
      time: res.data.timestamp,
      source: 'SKYBITZ'
    };
  } catch (error) {
    // If auth error, reset token and retry once
    if (error.response?.status === 401 && skybitzToken) {
      skybitzToken = null;
      skybitzTokenExpiry = null;
      
      try {
        const newToken = await getSkybitzToken();
        const retryRes = await axios.get(
          `https://api.skybitz.com/v1/assets/${truckNumber}/location`,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Accept': 'application/json'
            },
            timeout: 15000
          }
        );

        if (!retryRes.data || !retryRes.data.latitude || !retryRes.data.longitude) {
          throw new Error('Invalid Skybitz response on retry');
        }

        return {
          lat: +retryRes.data.latitude,
          lng: +retryRes.data.longitude,
          speed: +(retryRes.data.speed || 0),
          time: retryRes.data.timestamp,
          source: 'SKYBITZ'
        };
      } catch (retryError) {
        throw new Error(`Skybitz retry failed: ${retryError.message}`);
      }
    }
    throw new Error(`Skybitz error: ${error.message}`);
  }
}

/* ===============================
   SAMSARA: Company routing
   ================================ */
async function getVehicleLocation(companyName, samsaraVehicleId, truckNumber) {
  if (!companyName) {
    throw new Error("Missing company name");
  }

  const normalized = companyName.toUpperCase().trim();

  // Agar Samsara ID hai, try Samsara first
  if (samsaraVehicleId) {
    try {
      // HA TRANSPORTATION
      if (normalized.includes("HA TRANSPORTATION") || 
          normalized.includes("HA TRANS") || 
          normalized === "HA TRANSPORTATION LLC") {
        const apiKey = process.env.SAMSARA_API_KEY;
        if (apiKey) {
          return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_HA");
        }
      }

      // 313 LOGISTICS
      if (normalized.includes("313 LOGISTICS") || 
          normalized.includes("313LOGISTICS") || 
          normalized.includes("313 TRANSPORT") || 
          normalized === "313 LOGISTICS LLC" || 
          normalized === "313 TRANSPORT LLC") {
        const apiKey = process.env.SAMSARA_API_KEY313;
        if (apiKey) {
          return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_313");
        }
      }

      // CHANDI LOGISTICS
      if (normalized.includes("CHANDI LOGISTICS") || 
          normalized.includes("CHANDILOGISTICS") || 
          normalized === "CHANDI LOGISTICS LLC") {
        const apiKey = process.env.SAMSARA_API_KEY_CHANDI;
        if (apiKey) {
          return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_CHANDI");
        }
      }
    } catch (samsaraError) {
      // Samsara fail, try Skybitz fallback
    }
  }

  // Fallback to Skybitz if Samsara fails or no Samsara ID
  if (truckNumber) {
    return await fetchSkybitzLocation(truckNumber);
  }

  throw new Error(`Cannot get location - no Samsara ID or truck number`);
}

/* ===============================
   GEOCODING
   ================================ */
async function geocodeAddress(address) {
  if (!address) throw new Error("Address missing");

  try {
    const res = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY
        },
        timeout: 8000
      }
    );

    if (res.data.status === 'ZERO_RESULTS') {
      throw new Error("Address not found");
    }
    if (res.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${res.data.status}`);
    }

    const result = res.data?.results?.[0];
    if (!result) throw new Error("No geocoding results");

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    throw error;
  }
}

/* ===============================
   GOOGLE ROUTES ETA
   ================================ */
async function getGoogleRoutesETA(originLat, originLng, destAddress) {
  try {
    const res = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: {
          location: {
            latLng: { latitude: originLat, longitude: originLng }
          }
        },
        destination: { address: destAddress },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          vehicleInfo: { emissionType: "DIESEL" }
        },
        languageCode: "en-US",
        units: "IMPERIAL"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
        },
        timeout: 10000
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
    return null;
  }
}

/* ===============================
   FALLBACK ETA
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
   DELIVERY DAY - FIXED VERSION
   ================================ */
function getDeliveryDay(etaHours, nowPST, scheduledDeliveryPST) {
  const estimatedDeliveryTime = new Date(nowPST);
  estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + etaHours);

  const todayStart = new Date(nowPST);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  // Already in PST, just convert to Date object
  const scheduledDate = scheduledDeliveryPST ? new Date(scheduledDeliveryPST) : null;

  // Check if late (estimated delivery is after scheduled delivery)
  if (scheduledDate && estimatedDeliveryTime > scheduledDate) {
    return "LATE";
  }

  // Check delivery day
  if (estimatedDeliveryTime >= todayStart && estimatedDeliveryTime < tomorrowStart) {
    return "TODAY";
  } else if (estimatedDeliveryTime >= tomorrowStart && estimatedDeliveryTime < tomorrowEnd) {
    return "TOMORROW";
  } else {
    return "LATER";
  }
}

/* ===============================
   PARSE TRAILER ADDRESS
   ================================ */
function parseTrailerAddress(addressString) {
  if (!addressString || addressString.trim() === '') return null;
  
  // Format: ",City,State,Zip,Country" or "Street,City,State,Zip,Country"
  const parts = addressString.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  
  // At minimum we need city and state
  const city = parts[parts.length - 4] || parts[0];
  const state = parts[parts.length - 3];
  
  if (!city || !state) return null;
  
  return `${city}, ${state}`;
}

/* ===============================
   MAIN: Process In-Transit from Map
   ================================ */
export async function processInTransitLoads(loads, truckMap, inTransitTruckMap) {
  const nowPST = getPSTNow();
  const results = { inTransit: [], errors: [] };

  const entries = inTransitTruckMap instanceof Map 
    ? Array.from(inTransitTruckMap.entries()) 
    : Object.entries(inTransitTruckMap || {});

  for (const [truckKey, truckData] of entries) {
    try {
      const { 
        truckName, truckId, companyName, samsaraVehicleId, 
        loadNumber, receiverAddress, deliveryDateTime, 
        trailerName, hasNextBooking, currentTrailerAddress,
        trailerLocationUpdatedAt
      } = truckData;

      if (!receiverAddress) {
        throw new Error('No receiver address');
      }

      let liveLocation = null;
      let etaData = null;
      let deliveryDay = null;
      let estimatedDeliveryTime = null;
      let locationSource = 'NONE';

      // SCENARIO 1: Try Samsara first
      if (samsaraVehicleId) {
        try {
          liveLocation = await getVehicleLocation(
            companyName,
            samsaraVehicleId,
            null // Don't use Skybitz if Samsara available
          );
          locationSource = liveLocation.source;
        } catch (samsaraError) {
          console.log(`Samsara failed for ${truckName}: ${samsaraError.message}`);
        }
      }

      // SCENARIO 2: If no Samsara, try currentTrailerAddress
      if (!liveLocation && currentTrailerAddress) {
        try {
          const parsedAddress = parseTrailerAddress(currentTrailerAddress);
          if (parsedAddress) {
            const trailerCoords = await geocodeAddress(parsedAddress);
            liveLocation = {
              lat: trailerCoords.lat,
              lng: trailerCoords.lng,
              speed: 0, // Unknown speed from trailer
              time: trailerLocationUpdatedAt,
              source: 'TRAILER_ADDRESS'
            };
            locationSource = 'TRAILER_ADDRESS';
          }
        } catch (trailerError) {
          console.log(`Trailer address failed for ${truckName}: ${trailerError.message}`);
        }
      }

      // Calculate ETA if we have location
      if (liveLocation) {
        etaData = await getGoogleRoutesETA(
          liveLocation.lat,
          liveLocation.lng,
          receiverAddress
        );

        if (!etaData) {
          const destCoords = await geocodeAddress(receiverAddress);
          etaData = getFallbackETA(
            liveLocation.lat,
            liveLocation.lng,
            destCoords.lat,
            destCoords.lng,
            liveLocation.speed
          );
        }

        estimatedDeliveryTime = new Date(nowPST);
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + etaData.durationMinutes);
        
        deliveryDay = getDeliveryDay(
          etaData.durationHours,
          nowPST,
          deliveryDateTime
        );
      } 
      // SCENARIO 3: No location data - use scheduled delivery
      else {
        const scheduledDate = new Date(deliveryDateTime);
        const hoursUntilScheduled = (scheduledDate - nowPST) / (1000 * 60 * 60);
        
        etaData = {
          durationHours: Math.max(0, hoursUntilScheduled),
          durationMinutes: Math.max(0, Math.round(hoursUntilScheduled * 60)),
          distanceMiles: null,
          source: 'SCHEDULED_DELIVERY'
        };
        
        estimatedDeliveryTime = scheduledDate;
        deliveryDay = getDeliveryDay(
          etaData.durationHours,
          nowPST,
          deliveryDateTime
        );
        
        locationSource = 'SCHEDULED_ONLY';
      }

      results.inTransit.push({
        loadNumber,
        truckName,
        truckId,
        trailerName,
        receiver: receiverAddress,
        scheduledDelivery: deliveryDateTime,
        etaHours: etaData.durationHours,
        etaMinutes: etaData.durationMinutes,
        distanceMiles: etaData.distanceMiles,
        deliveryDay,
        estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
        currentSpeed: liveLocation?.speed || 0,
        source: etaData.source,
        locationSource: locationSource,
        hasNextBooking,
        lastKnownLocation: liveLocation ? `${liveLocation.lat.toFixed(4)}, ${liveLocation.lng.toFixed(4)}` : 'Unknown'
      });

    } catch (err) {
      results.errors.push({
        truckName: truckData.truckName,
        loadNumber: truckData.loadNumber,
        error: err.message
      });
    }
  }

  if (results.errors.length > 0) {
    console.log('Error details:', JSON.stringify(results.errors, null, 2));
  }

  return results;
}

/* ===============================
   CALCULATE AVAILABLE TRUCKS
   ================================ */
export function calculateAvailableTrucks(inTransitResults, bookedLoads, allTrucks) {
  const nowPST = getPSTNow();
  const todayStart = new Date(nowPST);
  todayStart.setHours(0, 0, 0, 0);

  const availableTrucks = [];
  const inTransitTruckIds = new Set();
  const bookedTruckIds = new Set();

  // In-transit trucks
  for (const inTransit of inTransitResults) {
    inTransitTruckIds.add(inTransit.truckId);
  }

  // Booked trucks
  for (const booking of bookedLoads) {
    const truckId = extractSingleValue(booking.truck);
    if (truckId) {
      bookedTruckIds.add(truckId);
    }
  }

  // Completely free trucks
  for (const [truckId, truckData] of Object.entries(allTrucks)) {
    if (inTransitTruckIds.has(truckId) || bookedTruckIds.has(truckId)) {
      continue;
    }

    availableTrucks.push({
      truckName: truckData.truckName,
      truckId: truckId,
      companyName: truckData.companyName,
      reason: "Not in-transit and not booked",
      availableFrom: todayStart.toLocaleDateString()
    });
  }

  // In-transit trucks delivering today with NO next booking
  const alreadyAddedTruckIds = new Set(availableTrucks.map(t => t.truckId));

  for (const inTransit of inTransitResults) {
    if (alreadyAddedTruckIds.has(inTransit.truckId)) {
      continue;
    }

    if (!inTransit.hasNextBooking && inTransit.deliveryDay === "TODAY") {
      availableTrucks.push({
        truckName: inTransit.truckName,
        truckId: inTransit.truckId,
        reason: "Delivering today with no next booking",
        availableFrom: new Date(inTransit.estimatedDeliveryTime).toLocaleDateString(),
        estimatedFreeTime: new Date(inTransit.estimatedDeliveryTime).toLocaleString()
      });
      alreadyAddedTruckIds.add(inTransit.truckId);
    }
  }

  const totalBusy = inTransitTruckIds.size + bookedTruckIds.size - 
    [...inTransitTruckIds].filter(id => bookedTruckIds.has(id)).length;

  return {
    availableTrucks,
    inTransitTruckIds: Array.from(inTransitTruckIds),
    bookedTruckIds: Array.from(bookedTruckIds),
    summary: {
      total: Object.keys(allTrucks).length,
      inTransit: inTransitTruckIds.size,
      booked: bookedTruckIds.size,
      available: availableTrucks.length,
      busy: totalBusy
    }
  };
}