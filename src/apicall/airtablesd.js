import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();
// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
export async function fetchTableRecords(tableName, view) {
  try {
    const records = [];
    const query = view ? base(tableName).select({ view }) : base(tableName).select();
   
    await query.eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push(record.fields);
      });
      fetchNextPage();
    });
   
    return records;
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return [];
  }
}
export async function fetchSHipperReceiverwithRecordIds(tableName, recordIds ) {
  try{
    const records = [];
    const recordMap = new Map();
    const query = base(tableName).select({
      filterByFormula: `OR(${recordIds.map(id => `RECORD_ID()='${id}'`).join(",")})`
    });
   
    await query.eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push(record.fields);
        recordMap.set(record.id, record.get("Just Address") || "")
      });
      fetchNextPage();
    });

    return {records, recordMap};
  }catch (err) {
    console.error("Airtable fetch error:", err);
    return [];
  }
}

export async function trailersIfs(tableName, recordIds ) {
  try{
    const recordMap = new Map();
    const query = base(tableName).select({
      filterByFormula: `OR(${recordIds.map(id => `RECORD_ID()='${id}'`).join(",")})`
    });
   
    await query.eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        recordMap.set(record.id, record.fields)
      });
      fetchNextPage();
    });

    return { recordMap};
  }catch (err) {
    console.error("Airtable fetch error:", err);
    return [];
  }
}