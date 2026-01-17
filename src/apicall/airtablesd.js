import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();
// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
export async function fetchTableRecords(tableName, view) {
  try {
    const records = [];
    const query = view ? base(tableName).select({ view }) : base(tableName).select();
    console.log("Airtable query initialized for table:", tableName, "with view:", view);
    await query.eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push(record.fields);
      });
      fetchNextPage();
    });
    console.log(`Fetched ${records.length} records from table:`, tableName);
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
    console.log("Airtable query initialized for table:", tableName );
    await query.eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push(record.fields);
        recordMap.set(record.id, record.get("Just Address") || "")
      });
      fetchNextPage();
    });
    console.log(`Fetched ${records.length} records from table:`, tableName);
    //return Map with id as key and Full address as value
    return {records, recordMap};
  }catch (err) {
    console.error("Airtable fetch error:", err);
    return [];
  }
}