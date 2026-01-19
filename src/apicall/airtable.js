import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID);

const FIELDS = {
  LOAD_NUMBER: "Load Number",
  LOAD_STATUS: "Load Status",
  TRUCK: "Truck",
  CLIENT: "Client",
  LOAD_TYPE: "Load Type",
  SHIP_TYPE: "Ship Type",
  RECEIVER_TYPE: "Receiver Type",
  STOPS: "Stop",
  PU_DATE_TIME: "PU Date/Time",
  DEL_DATE_TIME: "Delivery Date/Time",
  SHIPPER: "Shipper",
  RECEIVER: "Receiver",
  TRAILER: "Trailers",
  TRACKOLAP_ASSET_ID: "Asset ID (from Truck)",
  SAMSARA_VEHICLE_ID: "Samsara Vehicle ID",
  STOP_NAME: "Stop",
  ADDRESS: "Address",
  CITY: "City",
  STATE: "State",
  ZIP: "Zip",
  DATE_TIME: "Date-Time",
  STATUS: "Status",
  TRUCK_ASSET_ID: "Asset ID",
  TRUCK_SAMSARA_ID: "Samsara Vehicle ID",
  TRUCK_NAME: "Name",
  TRUCK_COMPANY: "Company",
  FULL_ADDRESS: "Just Address"
};

function extractSingle(field) {
  if (Array.isArray(field)) return field[0] ?? null;
  return field ?? null;
}

export async function fetchCompleteAirtableData(config) {
  try {
    const {
      tableID,
      recordIDs,
      viewID,
      stopTableID,
      truckTableID,
      truckViewID,
      shipperReceiverTableID
    } = config;

    console.log("🚀 Starting data fetch...");

    const loadRecords = await fetchLoads(tableID, recordIDs, viewID);
    console.log(`✅ Fetched ${loadRecords.length} load records`);

    const truckRecords = await fetchTrucks(truckTableID, truckViewID);
    console.log(`✅ Fetched ${truckRecords.length} truck records`);

    const truckMap = {};
    for (const t of truckRecords) {
      const id = t.id;
      if (!id) continue;
      truckMap[id] = {
        id: t.id,
        truckName: t.truckName,
        companyName: t.companyName,
        assetId: t.assetId,
        samsaraVehicleId: t.samsaraVehicleId
      };
    }

    const srIds = new Set();
    const stopIds = new Set();

    loadRecords.forEach(r => {
      r.shipperIds?.forEach(id => srIds.add(id));
      r.receiverIds?.forEach(id => srIds.add(id));
      r.stopIds?.forEach(id => stopIds.add(id));
    });

    const { records: shipperReceiverRecords, recordMap: addressMap } = 
      srIds.size > 0
        ? await fetchShipperReceiver(shipperReceiverTableID, [...srIds])
        : { records: [], recordMap: new Map() };

    console.log(`✅ Fetched ${shipperReceiverRecords.length} shipper/receiver records`);

    const stops = stopTableID && stopIds.size > 0 
      ? await fetchStops(stopTableID, [...stopIds])
      : [];

    console.log(`✅ Fetched ${stops.length} stop records`);

    const loads = {};
    
    for (const r of loadRecords) {
      const id = r.recordId;
      if (!id) continue;

      loads[id] = {
        recordId: r.recordId,
        loadNumber: r.loadNumber,
        loadStatus: r.loadStatus,
        client: r.client,
        loadType: r.loadType,
        shipType: r.shipType,
        receiverType: r.receiverType,
        puDateTime: r.puDateTime,
        delDateTime: r.delDateTime,
        trailer: r.trailer,
        trackolapAssetId: r.trackolapAssetId,
        samsaraVehicleId: r.samsaraVehicleId,
        truck: r.truckIds,
        shipper: r.shipperIds?.[0] ? addressMap.get(r.shipperIds[0]) || "" : "",
        receiver: r.receiverIds?.[0] ? addressMap.get(r.receiverIds[0]) || "" : "",
        shipperIds: r.shipperIds,
        receiverIds: r.receiverIds,
        stopIds: r.stopIds
      };
    }

    console.log("✅ Data fetch complete");

    return {
      loads,
      loadRecords,
      trucks: truckRecords,
      truckMap,
      stops,
      shipperReceiver: shipperReceiverRecords,
      addressMap: Object.fromEntries(addressMap)
    };

  } catch (error) {
    console.error("❌ Error in fetchCompleteAirtableData:", error);
    throw error;
  }
}

async function fetchLoads(tableId, recordIDs, viewID) {
  const loads = [];
  let query;

  if (recordIDs && recordIDs.length > 0) {
    const formula = `OR(${recordIDs.map(id => `RECORD_ID()='${id}'`).join(",")})`;
    query = base(tableId).select({ filterByFormula: formula });
  } else if (viewID) {
    query = base(tableId).select({ view: viewID });
  } else {
    query = base(tableId).select();
  }

  await query.eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach((record) => {
      loads.push({
        recordId: record.id,
        id: record.id,
        loadNumber: record.get(FIELDS.LOAD_NUMBER) || "",
        loadStatus: record.get(FIELDS.LOAD_STATUS) || "",
        client: record.get(FIELDS.CLIENT) || "",
        loadType: record.get(FIELDS.LOAD_TYPE) || "",
        shipType: record.get(FIELDS.SHIP_TYPE) || "",
        receiverType: record.get(FIELDS.RECEIVER_TYPE) || "",
        puDateTime: record.get(FIELDS.PU_DATE_TIME) || "",
        delDateTime: record.get(FIELDS.DEL_DATE_TIME) || "",
        trailer: record.get(FIELDS.TRAILER) || "",
        trackolapAssetId: record.get(FIELDS.TRACKOLAP_ASSET_ID) || "",
        samsaraVehicleId: record.get(FIELDS.SAMSARA_VEHICLE_ID) || [],
        truckIds: (record.get(FIELDS.TRUCK) || []).map(t => t.id),
        stopIds: (record.get(FIELDS.STOPS) || []).map(s => s.id),
        shipperIds: (record.get(FIELDS.SHIPPER) || []).map(s => s.id),
        receiverIds: (record.get(FIELDS.RECEIVER) || []).map(r => r.id),
        Truck: record.get(FIELDS.TRUCK) || [],
        Shipper: (record.get(FIELDS.SHIPPER) || []).map(s => s.id),
        Receiver: (record.get(FIELDS.RECEIVER) || []).map(r => r.id),
        "Load Number": record.get(FIELDS.LOAD_NUMBER) || "",
        "Load Status": record.get(FIELDS.LOAD_STATUS) || "",
        "PU Date/Time": record.get(FIELDS.PU_DATE_TIME) || "",
        "Delivery Date/Time": record.get(FIELDS.DEL_DATE_TIME) || "",
        "Samsara Vehicle ID": record.get(FIELDS.SAMSARA_VEHICLE_ID) || []
      });
    });
    fetchNextPage();
  });

  return loads;
}

async function fetchTrucks(tableId, viewID) {
  const trucks = [];
  const query = viewID 
    ? base(tableId).select({ view: viewID })
    : base(tableId).select();

  await query.eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach((record) => {
      trucks.push({
        id: record.id,
        truckName: record.get(FIELDS.TRUCK_NAME) || "",
        companyName: record.get(FIELDS.TRUCK_COMPANY) || "",
        assetId: record.get(FIELDS.TRUCK_ASSET_ID) || "",
        samsaraVehicleId: extractSingle(record.get(FIELDS.TRUCK_SAMSARA_ID)),
        Name: record.get(FIELDS.TRUCK_NAME) || "",
        Company: record.get(FIELDS.TRUCK_COMPANY) || "",
        "Samsara Vehicle ID": record.get(FIELDS.TRUCK_SAMSARA_ID)
      });
    });
    fetchNextPage();
  });

  return trucks;
}

async function fetchStops(tableId, stopIds) {
  if (!stopIds || stopIds.length === 0) return [];

  const stops = [];
  const formula = `OR(${stopIds.map(id => `RECORD_ID()='${id}'`).join(",")})`;
  const query = base(tableId).select({ filterByFormula: formula });

  await query.eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach((record) => {
      stops.push({
        id: record.id,
        stopName: record.get(FIELDS.STOP_NAME) || "",
        address: record.get(FIELDS.ADDRESS) || "",
        city: record.get(FIELDS.CITY) || "",
        state: record.get(FIELDS.STATE) || "",
        zip: record.get(FIELDS.ZIP) || "",
        dateTime: record.get(FIELDS.DATE_TIME) || null,
        status: record.get(FIELDS.STATUS) || ""
      });
    });
    fetchNextPage();
  });

  return stops;
}

async function fetchShipperReceiver(tableId, shipperReceiverIds) {
  if (!shipperReceiverIds || shipperReceiverIds.length === 0) {
    return { records: [], recordMap: new Map() };
  }

  const records = [];
  const recordMap = new Map();
  const formula = `OR(${shipperReceiverIds.map(id => `RECORD_ID()='${id}'`).join(",")})`;
  const query = base(tableId).select({ filterByFormula: formula });

  await query.eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach((record) => {
      const fullAddress = record.get(FIELDS.FULL_ADDRESS) || "";
      records.push({
        id: record.id,
        fullAddress: fullAddress
      });
      recordMap.set(record.id, fullAddress);
    });
    fetchNextPage();
  });

  return { records, recordMap };
}