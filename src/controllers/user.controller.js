import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Airtable from "airtable";
import config from "../Airtable_config/config.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { haversine } from "../harversine/haversine.js";
import { processInTransitLoads } from "../services/tracking.js";

const truckTempStore = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const truckDataMap = new Map();
import {
  fetchSHipperReceiverwithRecordIds,
  fetchTableRecords
} from "../apicall/airtablesd.js";
const TABLEID = "tblO5X9igZQEzaWfw";
const VIEW_ID = "viwiCMhtDtFXbaPwg";
const TRUCK_TABLE_ID = "tbldhqN3luB9jqEpV";
const TRUCK_VIEW_ID = "viw7oAQoS4dKkP0te";
const SHIPPER_RECEIVER_TABLE_ID = "tblQ9aV00RCMgLOKr";
const FIELD_FULL_ADDRESS = "Just Address";
/* ---------------- HANDLER ---------------- */
const handleShecduleTrcuk = async (req, res) => {
  try {
    /* -------- FETCH LOADS & TRUCKS -------- */
    const loadRecords = await fetchTableRecords(TABLEID, VIEW_ID);
    const truckRecords = await fetchTableRecords(
      TRUCK_TABLE_ID,
      TRUCK_VIEW_ID
    );
    /* -------- BUILD TRUCK MAP -------- */
    const truckMap = Object.fromEntries(
      truckRecords
        .filter(r => r["Record ID"])
        .map(r => [
          r["Record ID"],
          {
            truckName: r.Name || "",
            companyName: r.Company || ""
          }
        ])
    );
    /* -------- COLLECT SHIPPER / RECEIVER IDS -------- */
    const shipperReceiverIds = new Set();
    for (const record of loadRecords) {
      if (Array.isArray(record.Shipper)) {
        record.Shipper.forEach(id => shipperReceiverIds.add(id));
      }
      if (Array.isArray(record.Receiver)) {
        record.Receiver.forEach(id => shipperReceiverIds.add(id));
      }
    }
    /* -------- FETCH SHIPPER / RECEIVER RECORDS -------- */
    const shipperReceiverIdsArray = [...shipperReceiverIds];
    const { recordMap } =
      shipperReceiverIdsArray.length > 0
        ? await fetchSHipperReceiverwithRecordIds(
            SHIPPER_RECEIVER_TABLE_ID,
            shipperReceiverIdsArray
          )
        : { recordMap: {} };
        //console.log("Fetched shipper/receiver records:", recordMap);
    /* -------- BUILD LOAD MAP -------- */
    const loads = {};
         // console.log("Processing load records:", loadRecords[10]);
    for (const record of loadRecords) {
      const recordId = record.recordid;
      if (!recordId) continue;
      const shipperId = Array.isArray(record.Shipper)
        ? record.Shipper[0]
        : null;
      const receiverId = Array.isArray(record.Receiver)
        ? record.Receiver[0]
        : null;
      loads[recordId] = {
        loadNumber: record["Load Number"] || "",
        loadStatus: record["Load Status"] || "",
        truck: record.Truck || "",
        trailer: record.Trailer || "",
        puDateTime: record["PU Date/Time"] || "",
        delDateTime: record["Delivery Date/Time"] || "",
        shipper: shipperId ? recordMap.get(shipperId) || "" : "",
        receiver: receiverId ? recordMap.get(receiverId) || "" : "",
        client: record.Client || "",
        load_type: record["Load Type"] || "",
        ship_type: record["Ship Type"] || "",
        receiver_type: record["Receiver Type"] || "",
        samsaraVehicleId: record["Samsara Vehicle ID"] || "",
        trackolapAssetId: record["Asset ID (from Truck)"] || ""
      };
    }
    /* -------- RESPONSE -------- */
    return {
      ok: true,
      data: { loads, truckMap}
    };
  } catch (error) {
    console.log(":siren: Error in handleShecduleTrcuk:", error);
    throw new Error("Internal Server Error ");
  }
};


 const ETAestimation = async (req, res) => {
  try {
      const resp = await handleShecduleTrcuk();
    const  { loads, truckMap} = resp.data;

console.log(`🚚 Total loads fetched:`,loads);

    if (!loads || Object.keys(loads).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No loads provided"
      });
    }

    // Build truckDataMap from truckMap
    const truckDataMap = new Map();
    
    if (truckMap && typeof truckMap === "object") {
      Object.entries(truckMap).forEach(([recordId, data]) => {
        truckDataMap.set(recordId, {
          truckName: data.truckName?.trim(),
          companyName: data.companyName?.trim()
        });
      });
    }

  

    // Process loads
    const results = await processInTransitLoads(loads, truckDataMap);

    // Send response
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      timezone: "PST (America/Los_Angeles)",
      
      summary: {
        totalLoads: Object.keys(loads).length,
        inTransitToday: results.inTransit.today.length,
        inTransitTomorrow: results.inTransit.tomorrow.length,
        inTransitFuture: results.inTransit.future.length,
        availableTrucks: {
          deliveredTodayNoNextLoad: results.availableTrucks.condition1_DeliveredTodayNoNextLoad.length,
          bookedButFarFuture: results.availableTrucks.condition2_BookedButFarFuture.length,
          notInLoadsList: results.availableTrucks.condition3_NotInLoadsList.length,
          total: results.availableTrucks.condition1_DeliveredTodayNoNextLoad.length +
                 results.availableTrucks.condition2_BookedButFarFuture.length +
                 results.availableTrucks.condition3_NotInLoadsList.length
        },
        errors: results.errors.length
      },

      inTransit: results.inTransit,
      availableTrucks: results.availableTrucks,
      errors: results.errors
    });

  } catch (error) {
    console.error("❌ ETAestimation Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export { ETAestimation };