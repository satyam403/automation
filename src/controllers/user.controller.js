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
import multer from "multer"
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

export {ETAestimation,geofancing}
// Call details 

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const JOB_START_HOUR = 9;  // 9 AM
const JOB_END_HOUR = 18;   // 6 PM
const CALLBACK_WINDOW_MINUTES = 30;

function cleanNumber(num) {
  if (!num) return '';
  return num.replace(/\D/g, '');
}

function formatDuration(minutes) {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} seconds`;
  } else if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? mins + ' minute' + (mins !== 1 ? 's' : '') : ''}`;
  }
}

// 🔥 MANUAL INTERNAL NUMBERS LIST (Optional - can be empty)
// Only add numbers here if you want to force them as internal
const MANUAL_INTERNAL_NUMBERS = [
  // Leave empty to rely on auto-detection only
  // Add specific numbers only if needed
].map(num => cleanNumber(num));

export function analyzeCalls(callLogs) {
  if (!Array.isArray(callLogs) || callLogs.length === 0) {
    return {
      summary: { totalIncomingCalls: 0, totalMissedCalls: 0, totalCallbacksMade: 0, totalNotCalledBack: 0, averageCallbackTime: "0 minutes", callbackSuccessRate: "0%" },
      dailyReports: [],
      weeklyReports: [],
      employeePerformance: [],
      internalNumbersDetected: { count: 0, numbers: [], employees: [] }
    };
  }

  // 🔥 AUTO-DETECT INTERNAL EMPLOYEE NUMBERS
  const employeeNumbers = new Set();
  const employeeEmails = new Set();
  
  callLogs.forEach(log => {
    if (log.actor || log.description) {
      if (log.from) employeeNumbers.add(cleanNumber(log.from));
      if (log.to) employeeNumbers.add(cleanNumber(log.to));
      if (log.actor && log.actor.includes('@')) employeeEmails.add(log.actor);
      if (log.description && log.description.includes('@')) employeeEmails.add(log.description);
    }
  });

  const incomingNumbers = new Set();
  const outgoingNumbers = new Set();
  
  callLogs.forEach(log => {
    const cleanNum = cleanNumber(log.from || log.to);
    if (log.type === "Call Received") {
      incomingNumbers.add(cleanNum);
    } else if (log.type === "Call Placed") {
      outgoingNumbers.add(cleanNum);
    }
  });

  incomingNumbers.forEach(num => {
    if (outgoingNumbers.has(num)) {
      employeeNumbers.add(num);
    }
  });

  console.log(`🔍 Auto-detected ${employeeNumbers.size} internal employee numbers`);

  const isInternalNumber = (number) => {
    const cleanNum = cleanNumber(number);
    return cleanNum && employeeNumbers.has(cleanNum);
  };

  const incomingCalls = callLogs.filter(c => c.type === "Call Received");
  const outgoingCalls = callLogs.filter(c => c.type === "Call Placed");

  console.log(`📊 Processing ${incomingCalls.length} incoming and ${outgoingCalls.length} outgoing calls`);

  const dailyData = {};
  const weeklyData = {};
  const employeeData = {};
  
  let totalCallbackTime = 0;
  let totalCallbackCount = 0;
  const allMissedCallbacks = [];
  const allSuccessfulCallbacks = [];
  const processedIncoming = new Set();

  incomingCalls.forEach((inCall, index) => {
    const receivedTime = dayjs(inCall.timestamp);
    const dateKey = receivedTime.format('YYYY-MM-DD');
    const weekKey = `${receivedTime.year()}-W${receivedTime.isoWeek()}`;
    const dayName = receivedTime.format('dddd');
    const hour = receivedTime.hour();
    const callId = `${inCall.from}_${inCall.timestamp}`;

    if (processedIncoming.has(callId)) return;
    processedIncoming.add(callId);

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        dateFormatted: receivedTime.format('DD MMM YYYY (dddd)'),
        dayOfWeek: dayName,
        totalMissedCalls: 0,
        totalCallbacks: 0,
        onTimeCallbacks: 0,
        lateCallbacks: 0,
        notCalledBack: 0,
        jobHoursCalls: 0,
        afterHoursCalls: 0,
        totalResponseTime: 0,
        fastestResponse: null,
        slowestResponse: null,
        missedCallsList: [],
        callbacksList: []
      };
    }

    if (!weeklyData[weekKey]) {
      const weekStart = receivedTime.startOf('isoWeek').format('DD MMM');
      const weekEnd = receivedTime.endOf('isoWeek').format('DD MMM YYYY');
      weeklyData[weekKey] = {
        week: weekKey,
        weekRange: `${weekStart} - ${weekEnd}`,
        totalMissedCalls: 0,
        totalCallbacks: 0,
        onTimeCallbacks: 0,
        lateCallbacks: 0,
        notCalledBack: 0,
        jobHoursCalls: 0,
        afterHoursCalls: 0,
        totalResponseTime: 0
      };
    }

    const isJobHours = hour >= JOB_START_HOUR && hour < JOB_END_HOUR;
    dailyData[dateKey][isJobHours ? 'jobHoursCalls' : 'afterHoursCalls']++;
    weeklyData[weekKey][isJobHours ? 'jobHoursCalls' : 'afterHoursCalls']++;

    const callerNumber = cleanNumber(inCall.from);
    if (!callerNumber) return;

    const callDuration = parseFloat(inCall.duration) || 0;
    const isMissedCall = callDuration === 0;

    // Skip non-missed calls (only track missed calls - duration = 0)
    if (!isMissedCall) {
      return;
    }

    // Track all missed calls (duration = 0)
    dailyData[dateKey].totalMissedCalls++;
    weeklyData[weekKey].totalMissedCalls++;

    // Find callback for this missed call
    let callback = outgoingCalls.find(outCall => {
      const outgoingTo = cleanNumber(outCall.to);
      const outTime = dayjs(outCall.timestamp);
      return outgoingTo === callerNumber && outTime.isAfter(receivedTime);
    });
      callback = outgoingCalls.find(outCall => {
      const outgoingTo = cleanNumber(outCall.to);
      const outTime = dayjs(outCall.timestamp);
      
      if (isInternalNumber(outCall.to)) return false;
      
      return outgoingTo === callerNumber && outTime.isAfter(receivedTime);
    });

    const employeeName = inCall.description || inCall.actor || 'Unknown';
    
    if (!employeeData[employeeName]) {
      employeeData[employeeName] = {
        employeeName: employeeName,
        totalMissedCallsReceived: 0,
        totalCallbacksMade: 0,
        notCalledBack: 0,
        onTimeCallbacks: 0,
        lateCallbacks: 0,
        totalResponseTime: 0,
        fastestCallback: null,
        slowestCallback: null,
        dailyBreakdown: {}
      };
    }

    employeeData[employeeName].totalMissedCallsReceived++;

    if (!callback) {
      const missedCallInfo = {
        callerName: inCall.actor || 'Unknown Caller',
        callerNumber: inCall.from,
        receivedAt: receivedTime.format('DD MMM YYYY, hh:mm A'),
        receivedDuring: isJobHours ? 'Job Hours' : 'After Hours',
        status: "❌ NOT CALLED BACK",
        whoReceivedCall: employeeName,
        date: dateKey,
        dayOfWeek: dayName
      };

      dailyData[dateKey].notCalledBack++;
      dailyData[dateKey].missedCallsList.push(missedCallInfo);
      weeklyData[weekKey].notCalledBack++;
      employeeData[employeeName].notCalledBack++;
      allMissedCallbacks.push(missedCallInfo);
      return;
    }

    const callbackTime = dayjs(callback.timestamp);
    const diffMinutes = callbackTime.diff(receivedTime, "minute", true);
    const roundedDiff = Math.round(diffMinutes);
    const isOnTime = diffMinutes <= CALLBACK_WINDOW_MINUTES;

    const callbackInfo = {
      callerName: inCall.actor || 'Unknown Caller',
      callerNumber: inCall.from,
      receivedAt: receivedTime.format('DD MMM YYYY, hh:mm A'),
      calledBackAt: callbackTime.format('DD MMM YYYY, hh:mm A'),
      responseTime: formatDuration(diffMinutes),
      responseTimeMinutes: roundedDiff,
      status: isOnTime ? "✅ On Time" : "⚠️ Late",
      whoReceivedCall: employeeName,
      whoCalledBack: callback.actor || callback.description || 'Unknown',
      date: dateKey,
      dayOfWeek: dayName
    };

    dailyData[dateKey].totalCallbacks++;
    dailyData[dateKey][isOnTime ? 'onTimeCallbacks' : 'lateCallbacks']++;
    dailyData[dateKey].totalResponseTime += diffMinutes;
    dailyData[dateKey].callbacksList.push(callbackInfo);

    if (dailyData[dateKey].fastestResponse === null || diffMinutes < dailyData[dateKey].fastestResponse) {
      dailyData[dateKey].fastestResponse = diffMinutes;
    }
    if (dailyData[dateKey].slowestResponse === null || diffMinutes > dailyData[dateKey].slowestResponse) {
      dailyData[dateKey].slowestResponse = diffMinutes;
    }

    weeklyData[weekKey].totalCallbacks++;
    weeklyData[weekKey][isOnTime ? 'onTimeCallbacks' : 'lateCallbacks']++;
    weeklyData[weekKey].totalResponseTime += diffMinutes;

    employeeData[employeeName].totalCallbacksMade++;
    employeeData[employeeName][isOnTime ? 'onTimeCallbacks' : 'lateCallbacks']++;
    employeeData[employeeName].totalResponseTime += diffMinutes;

    if (employeeData[employeeName].fastestCallback === null || diffMinutes < employeeData[employeeName].fastestCallback) {
      employeeData[employeeName].fastestCallback = diffMinutes;
    }
    if (employeeData[employeeName].slowestCallback === null || diffMinutes > employeeData[employeeName].slowestCallback) {
      employeeData[employeeName].slowestCallback = diffMinutes;
    }

    if (!employeeData[employeeName].dailyBreakdown[dateKey]) {
      employeeData[employeeName].dailyBreakdown[dateKey] = {
        date: dateKey,
        missedCalls: 0,
        callbacks: 0,
        onTime: 0,
        late: 0
      };
    }
    employeeData[employeeName].dailyBreakdown[dateKey].callbacks++;
    employeeData[employeeName].dailyBreakdown[dateKey][isOnTime ? 'onTime' : 'late']++;

    allSuccessfulCallbacks.push(callbackInfo);
    totalCallbackTime += diffMinutes;
    totalCallbackCount++;
  });

  const totalExternalMissedCalls = allMissedCallbacks.length + allSuccessfulCallbacks.length;
  const totalInternalCallsSkipped = incomingCalls.length - totalExternalMissedCalls;

  console.log(`✅ Analysis complete: ${totalCallbackCount} callbacks, ${allMissedCallbacks.length} not called back`);
  console.log(`⏭️ Skipped ${totalInternalCallsSkipped} internal calls`);

  const dailyReports = Object.values(dailyData).map(day => ({
    ...day,
    averageResponseTime: day.totalCallbacks > 0 ? formatDuration(day.totalResponseTime / day.totalCallbacks) : "N/A",
    fastestResponseFormatted: day.fastestResponse !== null ? formatDuration(day.fastestResponse) : "N/A",
    slowestResponseFormatted: day.slowestResponse !== null ? formatDuration(day.slowestResponse) : "N/A",
    callbackRate: day.totalMissedCalls > 0 ? `${((day.totalCallbacks / day.totalMissedCalls) * 100).toFixed(1)}%` : "0%"
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  const weeklyReports = Object.values(weeklyData).map(week => ({
    ...week,
    averageResponseTime: week.totalCallbacks > 0 ? formatDuration(week.totalResponseTime / week.totalCallbacks) : "N/A",
    callbackRate: week.totalMissedCalls > 0 ? `${((week.totalCallbacks / week.totalMissedCalls) * 100).toFixed(1)}%` : "0%"
  })).sort((a, b) => a.week.localeCompare(b.week));

  const employeePerformance = Object.values(employeeData).map(emp => ({
    ...emp,
    averageResponseTime: emp.totalCallbacksMade > 0 ? formatDuration(emp.totalResponseTime / emp.totalCallbacksMade) : "N/A",
    fastestCallbackFormatted: emp.fastestCallback !== null ? formatDuration(emp.fastestCallback) : "N/A",
    slowestCallbackFormatted: emp.slowestCallback !== null ? formatDuration(emp.slowestCallback) : "N/A",
    callbackRate: emp.totalMissedCallsReceived > 0 ? `${((emp.totalCallbacksMade / emp.totalMissedCallsReceived) * 100).toFixed(1)}%` : "0%",
    performanceRating: emp.totalCallbacksMade > 0
      ? (emp.onTimeCallbacks / emp.totalCallbacksMade >= 0.8 ? "⭐⭐⭐ Excellent" : 
         emp.onTimeCallbacks / emp.totalCallbacksMade >= 0.6 ? "⭐⭐ Good" : "⭐ Needs Improvement")
      : "❌ No Callbacks"
  })).sort((a, b) => b.totalMissedCallsReceived - a.totalMissedCallsReceived);

  return {
    summary: {
      totalIncomingCalls: incomingCalls.length,
      totalExternalCalls: totalExternalMissedCalls,
      totalInternalCallsSkipped: totalInternalCallsSkipped,
      totalMissedCalls: totalExternalMissedCalls,
      totalCallbacksMade: totalCallbackCount,
      totalNotCalledBack: allMissedCallbacks.length,
      averageCallbackTime: totalCallbackCount > 0 ? formatDuration(totalCallbackTime / totalCallbackCount) : "0 minutes",
      callbackSuccessRate: totalExternalMissedCalls > 0 ? `${((totalCallbackCount / totalExternalMissedCalls) * 100).toFixed(1)}%` : "0%",
      dateRange: callLogs.length > 0 ? {
        from: dayjs(callLogs[0].timestamp).format('DD MMM YYYY'),
        to: dayjs(callLogs[callLogs.length - 1].timestamp).format('DD MMM YYYY')
      } : null
    },
    internalNumbersDetected: {
      count: employeeNumbers.size,
      manualCount: MANUAL_INTERNAL_NUMBERS.length,
      autoDetectedCount: employeeNumbers.size - MANUAL_INTERNAL_NUMBERS.length,
      numbers: Array.from(employeeNumbers),
      employees: Array.from(employeeEmails),
      detectionMethod: "Manual List + Auto-Detection"
    },
    dailyReports: dailyReports,
    weeklyReports: weeklyReports,
    employeePerformance: employeePerformance,
    allCallbacks: allSuccessfulCallbacks,
    allMissedCallbacks: allMissedCallbacks
  };
}