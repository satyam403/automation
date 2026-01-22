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


async function buildTrailerMap(loadRecords) {
  const trailerIds = new Set();
  
  // Sabhi loads se trailer IDs nikalo
  for (const load of loadRecords) {
    const trailerId = extractSingle(load.Trailers);
    if (trailerId) trailerIds.add(trailerId);
  }

  if (trailerIds.size === 0) return new Map();

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


function getBookedLoadsByTruck(loadRecords, truckMap) {

  const bookedMap = new Map();

  const normalize = (v) =>
    v?.toUpperCase().replace(/\s+/g, " ").replace(/\s*-\s*/g, " - ").trim();

  // 🔹 truckName → truck
  const truckNameMap = new Map();
  for (const truck of truckMap.values()) {
    if (truck?.truckName) {
      truckNameMap.set(normalize(truck.truckName), truck);
    }
  }

  let processed = 0;
  let keyIndex = 0;

  for (const load of loadRecords) {

    if (load["Load Status"]?.toUpperCase() !== "BOOKED") continue;

    const truckNames =
      Array.isArray(load.Truckname) ? load.Truckname :
      Array.isArray(load.TruckName) ? load.TruckName :
      Array.isArray(load.Truck) ? load.Truck :
      [null];

    for (let tName of truckNames) {

      const normalized = normalize(tName);
      const truck = truckNameMap.get(normalized) || null;

      // ✅ GUARANTEED UNIQUE KEY
      const mapKey = `BOOKED_${keyIndex++}`;

      const deliveryDateTimePST = toPST(load["Delivery Date/Time"]);

      const puDateTimePST = toPST(load["PU Date/Time"]);

      bookedMap.set(mapKey, {
        truckName: truck?.truckName ?? tName ?? null,
        truckId: truck?.truckId ?? null,
        companyName: truck?.companyName ?? null,
        samsaraVehicleId: truck?.samsaraVehicleId ?? null,

        loadNumber: load["Load Number"] ?? null,
        puDateTime: puDateTimePST ?? null,
        deliveryDateTime: deliveryDateTimePST ?? null,
        shipper: load["Full Address Shipper Array"] ?? null,
        receiver: load["Full Address Receiver Array"] ?? null
      });

      processed++;
    }
  }

  console.log("✅ BOOKED loads processed:", processed);
  console.log("✅ BOOKED loads in MAP:", bookedMap.size);

  return bookedMap;
}


function toPST(dateInput) {
  if (!dateInput) return null;

  const pstDate = new Date(
    new Date(dateInput).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    })
  );

  const pad = (n) => String(n).padStart(2, "0");

  return `${pstDate.getFullYear()}-${pad(pstDate.getMonth() + 1)}-${pad(pstDate.getDate())} ` +
         `${pad(pstDate.getHours())}:${pad(pstDate.getMinutes())}:${pad(pstDate.getSeconds())}`;
}





async function buildInTransitTruckMap(loadRecords, truckMap, trailerMap, bookedMap) {

  const inTransitMap = new Map();

  const extractSingle = (val) =>
    Array.isArray(val) ? val[0] : val ?? null;

  // 🔹 truckName → truck
  const truckNameMap = new Map();
  for (const truck of truckMap.values()) {
    if (truck?.truckName) {
      truckNameMap.set(truck.truckName.trim(), truck);
    }
  }

  for (const load of loadRecords) {

    if (load["Load Status"]?.toUpperCase() !== "IN TRANSIT") continue;

    const truckNames = Array.isArray(load.Truckname)
      ? load.Truckname
      : [load.TruckName].filter(Boolean);

    for (let truckName of truckNames) {

      truckName = truckName.trim();
      const truck = truckNameMap.get(truckName);
      if (!truck) continue;

      // ❗ already added → skip
      if (inTransitMap.has(truck.truckName)) continue;

      const samsaraVehicleId =
        truck.samsaraVehicleId ||
        extractSingle(load["Samsara Vehicle ID"]) ||
        null;

      // 🔹 Trailer
      let trailerId = null;
      let trailerName = null;
      let trailerNumber = null;
      let trailerType = null;
      let trailerStatus = null;




      // 🔹 Skybitz Trailer Location
const currentTrailerAddress = extractSingle(
  load["Current Address (Skybitz) (from Trailers)"]
);

const trailerLocationUpdatedAt = extractSingle(
  load["Last Modified Time (from Trailers)"]
);


      const trailerRecordId = extractSingle(load.Trailers);
      if (trailerRecordId && trailerMap.has(trailerRecordId)) {
        const trailer = trailerMap.get(trailerRecordId);
        trailerId = trailer?.id ?? null;
        trailerName = trailer?.name ?? null;
        trailerNumber = trailer?.trailerNumber ?? null;
        trailerType = trailer?.type ?? null;
        trailerStatus = trailer?.status ?? null;
      }

      // 🔹 NEXT BOOKED LOAD
      const nextBookings = bookedMap.get(truck.truckName.trim()) || [];
      const nextBooking = nextBookings[0] || null;


      const puDateTimePST = toPST(load["PU Date/Time"]);
      








      const deliveryDateTimePST = toPST(load["Delivery Date/Time"]);

      const nextPuDateTimePST = toPST(nextBooking?.puDateTime);
      const nextDeliveryDateTimePST = toPST(nextBooking?.deliveryDateTime);

      inTransitMap.set(truck.truckName, {
        truckName: truck.truckName,
        truckId: truck.truckId,
        companyName: truck.companyName,
        samsaraVehicleId,

        // 🔸 CURRENT IN TRANSIT LOAD (ALL PST)
        loadNumber: load["Load Number"] ?? "",
        shipperAddress: load["Full Address Shipper Array"] ?? "",
        receiverAddress: load["Full Address Receiver Array"] ?? "",
        puDateTime: puDateTimePST,
        deliveryDateTime: deliveryDateTimePST,

        // 🔸 TRAILER
        trailerId,
        trailerName,
        trailerNumber,
        trailerType,
        trailerStatus,
        currentTrailerAddress,
        trailerLocationUpdatedAt,
        
        nextLoadNumber: nextBooking?.loadNumber ?? null,
        nextPuDateTime: nextPuDateTimePST,
        nextDeliveryDateTime: nextDeliveryDateTimePST,
        nextShipper: nextBooking?.shipper ?? null,
        nextReceiver: nextBooking?.receiver ?? null,

        hasNextBooking: nextBookings.length > 0
      });
    }
  }

  return inTransitMap;
}






const ETAestimation = async (req, res) => {
  try {
    // 1️⃣ Data fetch karo
    const loadRecords = await fetchTableRecords(TABLEID, VIEW_ID);
    const truckRecords = await fetchTableRecords(TRUCK_TABLE_ID, TRUCK_VIEW_ID);
    const truckMapData = buildTruckMap(truckRecords);



    console.log(loadRecords[5])

    // 3️⃣ Trailer Map banao
   const trailerMap = await buildTrailerMap(loadRecords);

    
    const bookedMap = getBookedLoadsByTruck(loadRecords, truckMapData);
    const inTransitTruckMap = await buildInTransitTruckMap(
      loadRecords,
      truckMapData,
      trailerMap,
      bookedMap
    );

    console.log(inTransitTruckMap)












    const truckMap = {};
    for (const [id, truck] of truckMapData) {
      truckMap[id] = {
        truckName: truck.truckName,
        companyName: truck.companyName,
        samsaraVehicleId: truck.samsaraVehicleId,
        skybitAssetId: truck.trailerRecordId
      };
    }

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

     const inTransitResults = await processInTransitLoads(loads, truckMap, inTransitTruckMap);

    // 🔟 Calculate truck availability
    // const availabilityResults = calculateAvailableTrucks(
    //   inTransitResults.inTransit,
    //   bookedLoads,
    //   truckMap
    // );

    // ✅ Final Response
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // In-Transit Trucks with Full Details
      // inTransitTrucksDetails: Array.from(inTransitTruckMap.values()),
      
      // ETA Calculation Results
      inTransit: {
        count: inTransitResults.inTransit.length,
        loads: inTransitResults.inTransit
      },
      
      // Availability Results
      // availability: {
      //   summary: availabilityResults.summary,
      //   available: availabilityResults.availableTrucks,
      //   busy: availabilityResults.busyTrucks
      // },
      
      // Errors
      // errors: inTransitResults.errors
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