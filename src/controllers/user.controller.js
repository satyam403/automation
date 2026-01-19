import { fetchTableRecords, fetchSHipperReceiverwithRecordIds } from "../apicall/airtablesd.js";
import { processInTransitLoads, calculateAvailableTrucks } from "../services/tracking.js";
import {fetchCompleteAirtableData } from "../apicall/airtable.js";



const TABLEID = "tblO5X9igZQEzaWfw";
const VIEW_ID = "viwiCMhtDtFXbaPwg";
const TRUCK_TABLE_ID = "tbldhqN3luB9jqEpV";
const TRUCK_VIEW_ID = "viw7oAQoS4dKkP0te";
const SHIPPER_RECEIVER_TABLE_ID = "tblQ9aV00RCMgLOKr";

function extractSingle(field) {
  if (Array.isArray(field)) return field[0] ?? null;
  return field ?? null;
}

const ETAestimation = async (req, res) => {
  try {

     const data = await fetchCompleteAirtableData({
      tableID: TABLEID,
      viewID: VIEW_ID,
      truckTableID: TRUCK_TABLE_ID,
      truckViewID: TRUCK_VIEW_ID,
      shipperReceiverTableID: SHIPPER_RECEIVER_TABLE_ID,
      stopTableID: "tbl1J7lzbXukQrx5j" // Add your stop table ID
    });



    // const loadRecords = await fetchTableRecords(TABLEID, VIEW_ID);
    // const truckRecords = await fetchTableRecords(TRUCK_TABLE_ID, TRUCK_VIEW_ID);
    // const truckMap = {};
    // for (const t of truckRecords) {
    //   const id = t.id || t["Record ID"];
    //   if (!id) continue;

    //   truckMap[id] = {
    //     truckName: t.Name ?? "",
    //     companyName: t.Company ?? "",
    //     samsaraVehicleId: extractSingle(t["Samsara Vehicle ID"])
    //   };
    // }

    // const srIds = new Set();
    // loadRecords.forEach(r => {
    //   r.Shipper?.forEach(id => srIds.add(id));
    //   r.Receiver?.forEach(id => srIds.add(id));
    // });

    // const { recordMap } =
    //   srIds.size > 0
    //     ? await fetchSHipperReceiverwithRecordIds(
    //         SHIPPER_RECEIVER_TABLE_ID,
    //         [...srIds]
    //       )
    //     : { recordMap: new Map() };
    // const loads = {};
    // const bookedLoads = [];
    
    // for (const r of loadRecords) {
    //   const id = r.id || r.recordid;
    //   if (!id) continue;

    //   const loadData = {
    //     loadNumber: r["Load Number"] ?? "",
    //     loadStatus: r["Load Status"] ?? "",
    //     truck: r.Truck ?? [],
    //     receiver: r.Receiver?.[0]
    //       ? recordMap.get(r.Receiver[0]) ?? ""
    //       : "",
    //     puDateTime: r["PU Date/Time"] ?? "",
    //     delDateTime: r["Delivery Date/Time"] ?? "",
    //     samsaraVehicleId: r["Samsara Vehicle ID"] ?? []
    //   };

    //   loads[id] = loadData;

    //   // Separate booked loads
    //   if (loadData.loadStatus?.toUpperCase() === "BOOKED") {
    //     bookedLoads.push(loadData);
    //   }
    // }

    // const inTransitResults = await processInTransitLoads(loads, truckMap);

    // const availabilityResults = calculateAvailableTrucks(
    //   inTransitResults.inTransit,
    //   bookedLoads,
    //   truckMap
    // );

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: data,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};









export const geofancing = (req, res) => {

};
export { ETAestimation };