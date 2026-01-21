// import { fetchTableRecords, fetchSHipperReceiverwithRecordIds } from "../apicall/airtablesd.js";
// import { processInTransitLoads, calculateAvailableTrucks } from "../services/tracking.js";
// import { trailersIfs } from "../apicall/airtablesd.js";
// import geolib from "geolib";




// const TABLEID = "tblO5X9igZQEzaWfw";
// const VIEW_ID = "viwiCMhtDtFXbaPwg";
// const TRUCK_TABLE_ID = "tbldhqN3luB9jqEpV";
// const TRUCK_VIEW_ID = "viw7oAQoS4dKkP0te";
// const SHIPPER_RECEIVER_TABLE_ID = "tblQ9aV00RCMgLOKr";
// const trailerTableId = 'tblJMWQu6fHj1zFp4'


// function extractSingle(field) {
//   if (Array.isArray(field)) return field[0] ?? null;
//   return field ?? null;
// }
// function getInTransitLoads(loads) {
//   return loads.filter(
//     load => load?.['Load Status']?.toLowerCase() === 'in transit'
//   );
// }



// async function resolveTrailersFromLoad(loadRecord, trailerTableId) {
 
 
 
//   // 2️⃣ Trailer record IDs
//   const trailerIds = loadRecord.map(load => extractSingle(load['Trailers'])).filter(id => id);
  
 
 


//   // 3️⃣ Airtable se trailer records lao
//   const {recordMap}  = await trailersIfs(
//     trailerTableId,
//     trailerIds
//   );





//   // 4️⃣ Clean & usable output
//   const trailers = [];
  

//   for (const trailerId of trailerIds) {
//     const trailer = recordMap.get(trailerId);
//     if (!trailer) continue;

//     trailers.push({
//       id: trailerId,
//       name: trailer.Name ?? "",
//       trailerNumber: trailer["Trailer Name"] ?? "",
//       type: trailer.Type ?? "",
//       status: trailer.Status ?? ""
//     });
//   }

//   return trailers;
// }

// const ETAestimation = async (req, res) => {
//   try {
//     const loadRecords = await fetchTableRecords(TABLEID,VIEW_ID);
//     const truckRecords = await fetchTableRecords(TRUCK_TABLE_ID, TRUCK_VIEW_ID);
//     const Trailer = await  fetchTableRecords('tblJMWQu6fHj1zFp4','viwld9SxKjPUKsxI5')
    
      


//    const inTransitLoads = getInTransitLoads(loadRecords);
//    console.log("fv,twvbjherivcmjnerjmn",loadRecords);

//   //  console.log("fv,twvbjherivcmjnerjmn",loadRecords[0]);
  

     


// const trailerDetails = await resolveTrailersFromLoad(
//   loadRecords, // jo bada object tune bheja
//   'tblJMWQu6fHj1zFp4'
// );


//   const MainData = new Map();
  
//   for (const trailer of trailerDetails) {
//     MainData.set(trailer.id, trailer);
//   }

//  console.log("fv,twvbjherivcmjnerjmn",MainData);







  
//     const truckMap = {};
//     for (const t of truckRecords) {
//       const id = t.id || t["Record ID"];
//       if (!id) continue;
    
//       truckMap[id] = {
//         truckName: t.Name ?? "",
//         companyName: t.Company ?? "",
//         samsaraVehicleId: extractSingle(t["Samsara Vehicle ID"]),
//         skybitAssetId: extractSingle(t["Trailers"])
//       };

      
//     }
   
     
//     const srIds = new Set();



//     loadRecords.forEach(r => {
//       r.Shipper?.forEach(id => srIds.add(id));
//       r.Receiver?.forEach(id => srIds.add(id));
//     });








//     const { recordMap } =
//       srIds.size > 0
//         ? await fetchSHipperReceiverwithRecordIds(
//             SHIPPER_RECEIVER_TABLE_ID,
//             [...srIds]
//           )
//         : { recordMap: new Map() };
    
    
        
//     const loads = {};
//     const bookedLoads = [];
    





//     for (const r of loadRecords) {
//       const id = r.id || r.recordid;
//       if (!id) continue;

//       const loadData = {
//         loadNumber: r["Load Number"] ?? "",
//         loadStatus: r["Load Status"] ?? "",
//         truck: r.Truck ?? [],
//         receiver: r.Receiver?.[0]
//           ? recordMap.get(r.Receiver[0]) ?? ""
//           : "",
//         puDateTime: r["PU Date/Time"] ?? "",
//         delDateTime: r["Delivery Date/Time"] ?? "",
//         samsaraVehicleId: r["Samsara Vehicle ID"] ?? []
//       };

//       loads[id] = loadData;

//       // Separate booked loads
//       if (loadData.loadStatus?.toUpperCase() === "BOOKED") {
//         bookedLoads.push(loadData);
//       }
//     }

   
//     const inTransitResults = await processInTransitLoads(loads, truckMap);

//     const availabilityResults = calculateAvailableTrucks(
//       inTransitResults.inTransit,
//       bookedLoads,
//       truckMap
//     );


//     res.status(200).json({
//       success: true,
//       timestamp: new Date().toISOString(),
//       inTransit: {
//         count: inTransitResults.inTransit.length,
//         loads: inTransitResults.inTransit
//       },
//       availability: {
//         summary: availabilityResults.summary,
//         available: availabilityResults.availableTrucks,
//         busy: availabilityResults.busyTrucks
//       },
//       errors: inTransitResults.errors
//     });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message,
//       stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// };

// const geofancing = async (req , res ) => {

//   const airtable  = await fetchTableRecords(TABLEID, VIEW_ID);

//   console.log("Airtable Data:", airtable);


// return res.status(200).json({
//     success: true,
//     data: airtable[0]
// })





// }

// export { ETAestimation , geofancing };

import { fetchTableRecords, fetchSHipperReceiverwithRecordIds, trailersIfs } from "../apicall/airtablesd.js";
import { processInTransitLoads, calculateAvailableTrucks } from "../services/tracking.js";

const TABLEID = "tblO5X9igZQEzaWfw";
const VIEW_ID = "viwiCMhtDtFXbaPwg";
const TRUCK_TABLE_ID = "tbldhqN3luB9jqEpV";
const TRUCK_VIEW_ID = "viw7oAQoS4dKkP0te";
const SHIPPER_RECEIVER_TABLE_ID = "tblQ9aV00RCMgLOKr";
const TRAILER_TABLE_ID = 'tblJMWQu6fHj1zFp4';

function extractSingle(field) {
  if (Array.isArray(field)) return field[0] ?? null;
  return field ?? null;
}

/**
 * Step 1: Truck Map banao with Samsara Vehicle ID
 */
function buildTruckMap(truckRecords) {
  const truckMap = new Map();
  
  for (const truck of truckRecords) {
    const truckId = truck.id || truck["Record ID"];
    if (!truckId) continue;

    truckMap.set(truckId, {
      truckId,
      truckName: truck.Name ?? "",
      companyName: truck.Company ?? "",
      samsaraVehicleId: extractSingle(truck["Samsara Vehicle ID"]),
      trailerRecordId: extractSingle(truck["Trailers"])
    });
  }

  return truckMap;
}

/**
 * Step 2: Trailer Map banao (trailer record ID se trailer details)
 */
async function buildTrailerMap(loadRecords) {
  const trailerIds = new Set();
  
  // Sabhi loads se trailer IDs nikalo
  for (const load of loadRecords) {
    const trailerId = extractSingle(load.Trailers);
    if (trailerId) trailerIds.add(trailerId);
  }

  if (trailerIds.size === 0) return new Map();

  // Airtable se trailer data fetch karo
  const { recordMap } = await trailersIfs(TRAILER_TABLE_ID, [...trailerIds]);

  const trailerMap = new Map();
  for (const [id, trailer] of recordMap.entries()) {
    trailerMap.set(id, {
      id,
      name: trailer.Name ?? "",
      trailerNumber: trailer["Trailer Name"] ?? "",
      type: trailer.Type ?? "",
      status: trailer.Status ?? ""
    });
  }

  return trailerMap;
}

/**
 * Step 3: Booked Loads ka map banao (truck-wise next bookings)
 */
function getBookedLoadsByTruck(loadRecords, truckMap) {


  const bookedMap = new Map();

  for (const load of loadRecords) { 


    // console.log("Processing Load:", load["Load Number"], "Status:", load["Load Status"]);
    if (load["Load Status"]?.toUpperCase() !== "BOOKED") continue;
    





    const truckIds = Array.isArray(load.Truckname) ? load.Truckname : [load.TruckName].filter(Boolean);
     console.log("  Associated Trucks:", truckIds);
    
    for (const truckId of truckIds) {
      const truck = truckMap.get(truckId);
      if (!truck) continue;

      if (!bookedMap.has(truck.Truckname)) {
        bookedMap.set(truck.Truckname, []);
      }

      bookedMap.get(truck.Truckname).push({
        loadNumber: load["Load Number"] ?? "",
        puDateTime: load["PU Date/Time"] ?? "",
        deliveryDateTime: load["Delivery Date/Time"] ?? "",
        shipper: load["Full Address Shipper Array"] ?? "",
        receiver: load["Full Address Receiver Array"] ?? ""
      });
    }
  }
   console.log('bookedMap',bookedMap)
  return bookedMap;
}

/**
 * Step 4: MAIN - In-Transit Trucks ka complete map banao
 */
async function buildInTransitTruckMap(loadRecords, truckMap, trailerMap, bookedMap) {
  const inTransitMap = new Map();

  for (const load of loadRecords) {
    if (load["Load Status"]?.toUpperCase() !== "IN TRANSIT") continue;

    // Truck IDs nikalo
    const truckIds = Array.isArray(load.Truck) ? load.Truck : [load.Truck].filter(Boolean);
    
    for (const truckId of truckIds) {
      const truck = truckMap.get(truckId);
      if (!truck) continue;

      // Samsara Vehicle ID - pehle truck se, nahi toh load se
      let samsaraVehicleId = truck.samsaraVehicleId;
      if (!samsaraVehicleId) {
        samsaraVehicleId = extractSingle(load["Samsara Vehicle ID"]);
      }

      // Trailer details nikalo
      let trailerInfo = null;
      const trailerRecordId = extractSingle(load.Trailers);
      if (trailerRecordId && trailerMap.has(trailerRecordId)) {
        const trailer = trailerMap.get(trailerRecordId);
        trailerInfo = {
          trailerId: trailer.id,
          trailerName: trailer.name,
          trailerNumber: trailer.trailerNumber,
          trailerType: trailer.type,
          trailerStatus: trailer.status
        };
      }

      // Next booking info (agar hai toh)
      const nextBookings = bookedMap.get(truck.truckName) || [];

      // Final data save karo
      inTransitMap.set(truck.truckName, {
        truckName: truck.truckName,
        truckId,
        companyName: truck.companyName,
        samsaraVehicleId: samsaraVehicleId || null,
        
        // Current Load Info
        loadNumber: load["Load Number"] ?? "",
        shipperAddress: load["Full Address Shipper Array"] ?? "",
        receiverAddress: load["Full Address Receiver Array"] ?? "",
        puDateTime: load["PU Date/Time"] ?? "",
        deliveryDateTime: load["Delivery Date/Time"] ?? "",
        
        // Trailer Info (if available)
        trailer: trailerInfo,
        
        // Next Bookings (if any)
        nextBookings: nextBookings.length > 0 ? nextBookings : null,
        hasNextBooking: nextBookings.length > 0
      });
    }
  }

  return inTransitMap;
}

/**
 * ===================================
 * MAIN ETAestimation FUNCTION
 * ===================================
 */
const ETAestimation = async (req, res) => {
  try {
    // 1️⃣ Data fetch karo
    const loadRecords = await fetchTableRecords(TABLEID, VIEW_ID);
    const truckRecords = await fetchTableRecords(TRUCK_TABLE_ID, TRUCK_VIEW_ID);

   const firstLoad = loadRecords[2];
   console.log("First Load Record:", firstLoad);



















    // 2️⃣ Truck Map banao (Map format)
    const truckMapData = buildTruckMap(truckRecords);
    // console.log(`✅ Truck Map:`, Array.from(truckMapData.entries()));

    // 3️⃣ Trailer Map banao
   const trailerMap = await buildTrailerMap(loadRecords);
    // console.log(`✅ Trailer Map: ${trailerMap.size} trailers loaded`);
    // console.log('Trailer Details:', Array.from(trailerMap.values()));

    // 4️⃣ Booked Loads ka map banao
    const bookedMap = getBookedLoadsByTruck(loadRecords, truckMapData);
     console.log(`✅ Booked Map: ${Array.from(bookedMap.entries())} trucks have next bookings`);

    // 5️⃣ In-Transit Trucks Map
    const inTransitTruckMap = await buildInTransitTruckMap(
      loadRecords,
      truckMapData,
      trailerMap,
      bookedMap
    );
    // console.log(`✅ In-Transit Map: ${inTransitTruckMap.size} trucks in transit`);

    // 6️⃣ Convert truck map to object for existing tracking functions
    const truckMap = {};
    for (const [id, truck] of truckMapData) {
      truckMap[id] = {
        truckName: truck.truckName,
        companyName: truck.companyName,
        samsaraVehicleId: truck.samsaraVehicleId,
        skybitAssetId: truck.trailerRecordId
      };
    }

    // 7️⃣ Shipper/Receiver records fetch karo
    const srIds = new Set();
    loadRecords.forEach(r => {
      r.Shipper?.forEach(id => srIds.add(id));
      r.Receiver?.forEach(id => srIds.add(id));
    });

    const { recordMap } = srIds.size > 0
      ? await fetchSHipperReceiverwithRecordIds(SHIPPER_RECEIVER_TABLE_ID, [...srIds])
      : { recordMap: new Map() };

    // 8️⃣ Loads data prepare karo
    const loads = {};
    const bookedLoads = [];

    for (const r of loadRecords) {
      const id = r.id || r.recordid;
      if (!id) continue;

      const loadData = {
        loadNumber: r["Load Number"] ?? "",
        loadStatus: r["Load Status"] ?? "",
        truck: r.Truck ?? [],
        receiver: r.Receiver?.[0] ? recordMap.get(r.Receiver[0]) ?? "" : "",
        puDateTime: r["PU Date/Time"] ?? "",
        delDateTime: r["Delivery Date/Time"] ?? "",
        samsaraVehicleId: r["Samsara Vehicle ID"] ?? []
      };

      loads[id] = loadData;

      if (loadData.loadStatus?.toUpperCase() === "BOOKED") {
        bookedLoads.push(loadData);
      }
    }

    // 9️⃣ Process in-transit loads for ETA calculation
    const inTransitResults = await processInTransitLoads(loads, truckMap);

    // 🔟 Calculate truck availability
    const availabilityResults = calculateAvailableTrucks(
      inTransitResults.inTransit,
      bookedLoads,
      truckMap
    );

    // ✅ Final Response
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // In-Transit Trucks with Full Details
      inTransitTrucksDetails: Array.from(inTransitTruckMap.values()),
      
      // ETA Calculation Results
      inTransit: {
        count: inTransitResults.inTransit.length,
        loads: inTransitResults.inTransit
      },
      
      // Availability Results
      availability: {
        summary: availabilityResults.summary,
        available: availabilityResults.availableTrucks,
        busy: availabilityResults.busyTrucks
      },
      
      // Errors
      errors: inTransitResults.errors
    });

  } catch (err) {
    console.error("❌ Error in ETAestimation:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const geofancing = async (req, res) => {
  const airtable = await fetchTableRecords(TABLEID, VIEW_ID);
  console.log("Airtable Data:", airtable);

  return res.status(200).json({
    success: true,
    data: airtable[0]
  });
};

export { ETAestimation, geofancing };