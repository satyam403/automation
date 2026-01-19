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

/* ===============================
   HELPER: Safe date conversion to PST
================================ */
function toPSTDate(dateInput) {
  if (!dateInput) return null;
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  
  const pstString = date.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  return new Date(pstString);
}

function getPSTDayStart(dateInput) {
  const date = toPSTDate(dateInput);
  if (!date) return null;
  
  date.setHours(0, 0, 0, 0);
  return date;
}

function getPSTNow() {
  const now = new Date();
  const pstString = now.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  return new Date(pstString);
}

/* ===============================
   SAMSARA: Improved location fetcher
================================ */
async function fetchSamsaraLocation(samsaraVehicleId, apiKey, companySource) {
  console.log(`\n🚛 === SAMSARA DEBUG START ===`);
  console.log(`   Company: ${companySource}`);
  console.log(`   Vehicle ID: ${samsaraVehicleId}`);

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

    console.log(`   ✅ Response Status: ${res.status}`);

    if (res.status === 401) {
      throw new Error(`❌ Unauthorized - Invalid API key for ${companySource}`);
    }
    
    if (res.status === 403) {
      throw new Error(`❌ Forbidden - No access to vehicle ${samsaraVehicleId}`);
    }

    if (res.status === 404) {
      throw new Error(`❌ Vehicle ${samsaraVehicleId} not found in Samsara`);
    }

    if (res.status >= 400) {
      throw new Error(`❌ Samsara API error ${res.status}`);
    }

    if (!res.data?.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error(`❌ Empty data array`);
    }

    const vehicle = res.data.data.find(v => v.id === samsaraVehicleId);
    
    if (!vehicle) {
      throw new Error(`❌ Vehicle ${samsaraVehicleId} not in response`);
    }

    if (!vehicle.locations || vehicle.locations.length === 0) {
      throw new Error(`❌ No location data for vehicle ${samsaraVehicleId}`);
    }

    const loc = vehicle.locations[0];
    
    if (!loc.latitude || !loc.longitude) {
      throw new Error(`❌ Invalid coordinates`);
    }

    console.log(`   ✅ SUCCESS - Lat: ${loc.latitude}, Lng: ${loc.longitude}, Speed: ${loc.speed || 0}`);
    console.log(`🚛 === SAMSARA DEBUG END ===\n`);

    return {
      lat: +loc.latitude,
      lng: +loc.longitude,
      speed: +(loc.speed || 0),
      time: loc.time,
      source: companySource
    };

  } catch (error) {
    console.log(`   ❌ === SAMSARA ERROR ===`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      throw new Error(`Samsara API ${error.response.status}`);
    } else if (error.request) {
      console.log(`   No response received`);
      throw new Error(`No response from Samsara - timeout or network issue`);
    } else {
      console.log(`   Error:`, error.message);
      throw error;
    }
  }
}

/* ===============================
   SAMSARA: Company routing
================================ */
async function getVehicleLocation(companyName, samsaraVehicleId) {
  if (!companyName || !samsaraVehicleId) {
    throw new Error("Missing company name or Samsara Vehicle ID");
  }

  const normalized = companyName.toUpperCase().trim();
  
  console.log(`\n🏢 Company Routing: ${companyName} → ${normalized}`);

  // HA TRANSPORTATION
  if (normalized.includes("HA TRANSPORTATION") || 
      normalized.includes("HA TRANS") ||
      normalized === "HA TRANSPORTATION LLC") {
    
    const apiKey = process.env.SAMSARA_API_KEY;
    if (!apiKey) {
      throw new Error("❌ SAMSARA_API_KEY not set");
    }
    
    return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_HA");
  }
  
  // 313 LOGISTICS
  if (normalized.includes("313 LOGISTICS") || 
      normalized.includes("313LOGISTICS") ||
      normalized.includes("313 TRANSPORT") ||
      normalized === "313 LOGISTICS LLC" ||
      normalized === "313 TRANSPORT LLC") {
    
    const apiKey = process.env.SAMSARA_API_KEY313;
    if (!apiKey) {
      throw new Error("❌ SAMSARA_API_KEY313 not set");
    }
    
    return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_313");
  }
  
  // CHANDI LOGISTICS
  if (normalized.includes("CHANDI LOGISTICS") || 
      normalized.includes("CHANDILOGISTICS") ||
      normalized === "CHANDI LOGISTICS LLC") {
    
    const apiKey = process.env.SAMSARA_API_KEY_CHANDI;
    if (!apiKey) {
      throw new Error("❌ SAMSARA_API_KEY_CHANDI not set");
    }
    
    return await fetchSamsaraLocation(samsaraVehicleId, apiKey, "SAMSARA_CHANDI");
  }

  throw new Error(`❌ Unsupported company: "${companyName}"`);
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
    console.error(`❌ Geocoding Error for "${address}":`, error.message);
    throw error;
  }
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
          "X-Goog-Api-Key": 'AIzaSyDL5s9711qsNyZ7zJ4Tu68_np_Vq9lqMH8',
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
    console.error("❌ Google Routes API Error:", error.message);
    return null;
  }
}

/* ===============================
   FALLBACK: Speed-based ETA
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
   DELIVERY TIME CHECK: Aaj ya Kal?
================================ */
function getDeliveryDay(etaHours, nowPST) {
  const deliveryTime = new Date(nowPST);
  deliveryTime.setHours(deliveryTime.getHours() + etaHours);
  
  const todayStart = new Date(nowPST);
  todayStart.setHours(0, 0, 0, 0);
  
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  
  if (deliveryTime >= todayStart && deliveryTime < tomorrowStart) {
    return "TODAY";
  } else if (deliveryTime >= tomorrowStart && deliveryTime < tomorrowEnd) {
    return "TOMORROW";
  } else {
    return "LATER";
  }
}

/* ===============================
   MAIN: Process In-Transit Loads
================================ */
export async function processInTransitLoads(loads, truckMap) {
  const truckDataMap = new Map(Object.entries(truckMap));
  const nowPST = getPSTNow();
  const results = { inTransit: [], errors: [] };

  for (const [loadId, load] of Object.entries(loads)) {
    if (load.loadStatus?.toUpperCase() !== "IN TRANSIT") continue;

    console.log(`\n📦 Processing Load: ${load.loadNumber}`);

    try {
      const loadTruckId = extractSingleValue(load.truck);
      const loadSamsaraId = extractSingleValue(load.samsaraVehicleId);

      let truckData =
        truckDataMap.get(loadTruckId) ||
        [...truckDataMap.values()].find(
          t => t.samsaraVehicleId === loadSamsaraId
        );

      if (!truckData) {
        throw new Error(
          `Truck not resolvable (truckId=${loadTruckId}, samsara=${loadSamsaraId})`
        );
      }


      let liveLocation = null;
      if (loadSamsaraId) {
        liveLocation = await getVehicleLocation(
          truckData.companyName,
          loadSamsaraId
        );
      }

      let etaData = null;
      if (liveLocation && load.receiver) {
        etaData = await getGoogleRoutesETA(
          liveLocation.lat,
          liveLocation.lng,
          load.receiver
        );
        
        if (!etaData) {
          const destCoords = await geocodeAddress(load.receiver);
          etaData = getFallbackETA(
            liveLocation.lat,
            liveLocation.lng,
            destCoords.lat,
            destCoords.lng,
            liveLocation.speed
          );
        }
      }

      if (!etaData) {
        throw new Error("Could not calculate ETA");
      }

      const deliveryDay = getDeliveryDay(etaData.durationHours, nowPST);
      results.inTransit.push({
        loadNumber: load.loadNumber,
        truckName: truckData.truckName,
        truckId: loadTruckId,
        receiver: load.receiver,
        etaHours: etaData.durationHours,
        etaMinutes: etaData.durationMinutes,
        distanceMiles: etaData.distanceMiles,
        deliveryDay: deliveryDay,
        currentSpeed: liveLocation?.speed || 0,
        source: etaData.source
      });

    } catch (err) {
      console.error(`❌ ERROR: ${err.message}`);
      results.errors.push({
        loadNumber: load.loadNumber,
        error: err.message
      });
    }
  }
  return results;
}

/* ===============================
   NEW: Calculate Available Trucks (FRESH LOGIC)
================================ */
export function calculateAvailableTrucks(inTransitResults, bookedLoads, allTrucks) {
  const nowPST = getPSTNow();
  const todayStart = new Date(nowPST);
  todayStart.setHours(0, 0, 0, 0);
  
  const twoDaysLater = new Date(todayStart);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  // Single source of truth for truck status
  const truckStatus = {}; // truckId -> {status: 'available'/'busy', reason: string}

  /* ==========================================
     STEP 1: Mark all In-Transit trucks
  ========================================== */
  console.log(`\n📋 STEP 1: Processing In-Transit Trucks`);
  
  for (const inTransit of inTransitResults) {
    const truckId = inTransit.truckId;
    
    if (inTransit.deliveryDay === "TODAY") {
      console.log(`   🚚 ${inTransit.truckName} (${truckId}) delivers TODAY`);
      
      // Check if truck has booking today
      const hasBookingToday = bookedLoads.some(booking => {
        const bookingTruckId = extractSingleValue(booking.truck);
        const puDate = getPSTDayStart(booking.puDateTime);
        
        return bookingTruckId === truckId && 
               puDate && 
               puDate.getTime() === todayStart.getTime();
      });

      if (hasBookingToday) {
        console.log(`      ❌ BUSY (has booking today)`);
        truckStatus[truckId] = {
          status: 'busy',
          reason: 'In-transit today with booking afterwards'
        };
      } else {
        console.log(`      ✅ AVAILABLE (no booking today)`);
        truckStatus[truckId] = {
          status: 'available',
          reason: 'In-transit today, no booking afterwards',
          truckName: inTransit.truckName,
          availableFrom: todayStart.toLocaleDateString()
        };
      }
    } else {
      console.log(`   🚚 ${inTransit.truckName} (${truckId}) delivers TOMORROW/LATER`);
      console.log(`      ❌ BUSY`);
      truckStatus[truckId] = {
        status: 'busy',
        reason: 'In-transit, delivers tomorrow or later'
      };
    }
  }

  /* ==========================================
     STEP 2: Process Booked trucks
  ========================================== */
  console.log(`\n📋 STEP 2: Processing Booked Trucks`);
  
  for (const booking of bookedLoads) {
    const truckId = extractSingleValue(booking.truck);
    if (!truckId) continue;
    
    // Skip if already processed
    if (truckStatus[truckId]) {
      continue;
    }

    const puDate = getPSTDayStart(booking.puDateTime);
    if (!puDate) continue;

    console.log(`   🚚 Load ${booking.loadNumber} on truck ${truckId}: PU on ${puDate.toLocaleDateString()}`);

    if (puDate >= twoDaysLater) {
      console.log(`      ✅ AVAILABLE (2+ days free)`);
      truckStatus[truckId] = {
        status: 'available',
        reason: 'Booked 2+ days later',
        truckName: allTrucks[truckId]?.truckName || truckId,
        availableFrom: todayStart.toLocaleDateString(),
        availableUntil: puDate.toLocaleDateString()
      };
    } else {
      console.log(`      ❌ BUSY (pickup within 2 days)`);
      truckStatus[truckId] = {
        status: 'busy',
        reason: 'Booked within 2 days'
      };
    }
  }

  /* ==========================================
     BUILD FINAL RESULTS
  ========================================== */
  const availableTrucks = [];
  const busyTrucks = [];

  for (const [truckId, status] of Object.entries(truckStatus)) {
    if (status.status === 'available') {
      availableTrucks.push({
        truckId: truckId,
        truckName: status.truckName,
        reason: status.reason,
        availableFrom: status.availableFrom,
        availableUntil: status.availableUntil
      });
    } else {
      busyTrucks.push(truckId);
    }
  }

  const totalTrucks = Object.keys(allTrucks).length;

  console.log(`\n📊 FINAL SUMMARY:`);
  console.log(`   Total Trucks: ${totalTrucks}`);
  console.log(`   Available: ${availableTrucks.length}`);
  console.log(`   Busy: ${busyTrucks.length}`);
  console.log(`   Verification: ${availableTrucks.length} + ${busyTrucks.length} = ${availableTrucks.length + busyTrucks.length} (should be ${totalTrucks})`);

  return {
    availableTrucks,
    busyTrucks,
    summary: {
      total: totalTrucks,
      available: availableTrucks.length,
      busy: busyTrucks.length
    }
  };
}