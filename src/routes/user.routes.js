import { Router } from "express";
import { 
 
   
    ETAestimation,
    geofancing,
    analyzeCalls

   
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import fs from 'fs'
import csv from "csv-parser";
import dayjs from 'dayjs';



const router = Router()


function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export function cleanNumber(num) {
  if (!num) return '';
  return String(num).replace(/\D/g, "");
}
export function normalizeGoogleVoiceCSV(rawRows) {
  if (!rawRows || rawRows.length === 0) {
    console.log('No rows to normalize');
    return [];
  }

  // Log first row to see actual column names
  console.log('First CSV row keys:', Object.keys(rawRows[0]));
  console.log('Sample row:', rawRows[0]);

  return rawRows.map((row, index) => {
    try {
      // Detect format: Google Workspace vs Google Voice
      const isWorkspace = 'Event' in row;
      
      let type, from, to, date, duration;

      if (isWorkspace) {
        // Google Workspace format
        type = row.Event;
        from = row['Call source'];
        to = row['Call destination'];
        date = row.Date;
        duration = row.Duration || '0';

        // Map Workspace events to standard types
        const eventMapping = {
          'Call Placed': 'Call Placed',
          'Call Received': 'Call Received',
          'Missed Call': 'Call Received', // Treat missed calls as received
          'Voicemail': 'Call Received',
          // Skip these events
          'Network Statistics (client)': null,
          'Text Message Sent': null,
          'Text Message Received': null
        };

        const mappedType = eventMapping[type];
        
        // Skip non-call events
        if (mappedType === null || mappedType === undefined) {
          return null;
        }

        type = mappedType;

      } else {
        // Google Voice format
        type = row.Type || row.type || row.TYPE;
        from = row.From || row.from || row.FROM;
        to = row.To || row.to || row.TO;
        const dateField = row.Date || row.date || row.DATE;
        const time = row.Time || row.time || row.TIME;
        date = time ? `${dateField} ${time}` : dateField;
        duration = row.Duration || row.duration || row.DURATION || '0';
      }

      // Skip if essential fields are missing
      if (!type || !date) {
        return null;
      }

      // Parse date - try ISO format first (for Workspace), then other formats
      let parsed = dayjs(date);

      // If not valid, try common formats
      if (!parsed.isValid()) {
        const formats = [
          'MM/DD/YYYY HH:mm:ss',
          'MM/DD/YYYY h:mm:ss A',
          'M/D/YYYY HH:mm:ss',
          'M/D/YYYY h:mm:ss A',
          'YYYY-MM-DD HH:mm:ss',
          'MM/DD/YYYY HH:mm',
          'M/D/YYYY HH:mm',
          'MM/DD/YYYY',
          'M/D/YYYY'
        ];

        for (const format of formats) {
          parsed = dayjs(date, format, true);
          if (parsed.isValid()) {
            break;
          }
        }
      }

      // Final validation
      if (!parsed.isValid()) {
        console.warn(`Invalid date at row ${index}: "${date}"`);
        return null;
      }

      const timestamp = parsed.toISOString();

      // Convert duration from milliseconds to seconds if needed
      let durationSeconds = parseFloat(duration) || 0;
      if (durationSeconds >= 1000) {
        durationSeconds = durationSeconds / 1000; // Convert ms to seconds
      }

      return {
        type: type.trim(),
        from: cleanNumber(from || ''),
        to: cleanNumber(to || ''),
        timestamp: timestamp,
        duration: durationSeconds.toString(),
        actor: row.Actor || '', // Keep actor info for workspace format
        description: row.Description || ''
      };
    } catch (error) {
      console.error(`Error processing row ${index}:`, error.message);
      return null;
    }
  }).filter(call => call !== null && call.type && call.timestamp);
}




router
  .route("/call-report")
  .post(upload.any(), async (req, res) => {
    try {
      // Validate file upload
      if (!req.files || !req.files.length) {
        return res.status(400).json({
          success: false,
          message: "📂 CSV file is required"
        });
      }

      const file = req.files[0];

      // Validate file type
      if (!file.originalname.endsWith('.csv')) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          success: false,
          message: "⚠️ Only CSV files are accepted"
        });
      }

      console.log(`📥 Processing file: ${file.originalname}`);

      // Parse and analyze
      const rawRows = await parseCSV(file.path);
      console.log(`📊 Parsed ${rawRows.length} rows from CSV`);
      
      const callLogs = normalizeGoogleVoiceCSV(rawRows);
      console.log(`✅ Normalized ${callLogs.length} call logs`);
      
      // Use analyzeMissedCalls function (imported)
      const report = analyzeCalls(callLogs);

      // Validate report
      if (!report || !report.summary) {
        throw new Error('Analysis failed - no valid report generated');
      }

      // Clean up uploaded file (with safety check)
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('✅ Temp file deleted');
      }

      // Return comprehensive report with daily and weekly breakdown
      res.json({
        success: true,
        message: "✅ Detailed day-wise and week-wise call report generated",
        
        // Overall Summary
        summary: {
          totalMissedCalls: report.summary.totalMissedCalls || 0,
          totalCallbacksMade: report.summary.totalCallbacksMade || 0,
          totalNotCalledBack: report.summary.totalNotCalledBack || 0,
          callbackSuccessRate: report.summary.callbackSuccessRate || "0%",
          message: report.summary.message || `Analyzed ${report.summary.totalMissedCalls || 0} missed calls. ${report.summary.totalCallbacksMade || 0} were called back, ${report.summary.totalNotCalledBack || 0} were not called back.`
        },

        // 👥 EMPLOYEE REPORTS - Employee-wise breakdown
        employeeReports: {
          title: "👥 Employee Performance Report",
          totalEmployees: report.employeeReports ? report.employeeReports.length : 0,
          ranking: report.employeeReports ? report.employeeReports.map((emp, index) => ({
            rank: index + 1,
            employeeName: emp.employeeName,
            employeeEmail: emp.employeeEmail,
            overview: {
              totalMissedCallsReceived: emp.totalMissedCalls || 0,
              totalCallbacksMade: emp.totalCallbacks || 0,
              notCalledBack: emp.notCalledBack || 0,
              callbackRate: emp.callbackRate || "0%"
            },
            missedCalls: emp.missedCallsList || [],
            callbacks: emp.callbacksList || []
          })) : [],
          topPerformer: report.employeeReports && report.employeeReports.length > 0
            ? report.employeeReports.reduce((best, emp) => {
                if ((emp.totalCallbacks || 0) === 0) return best;
                if (!best || (emp.totalCallbacks || 0) > (best.totalCallbacks || 0)) {
                  return emp;
                }
                return best;
              }, null)
            : null,
          mostMissedCalls: report.employeeReports && report.employeeReports.length > 0
            ? report.employeeReports[0]
            : null
        },

        // 📋 ALL MISSED CALLS (Not Called Back)
        allMissedCallbacks: {
          title: "❌ All Missed Calls Not Returned",
          count: report.allMissedCallbacks ? report.allMissedCallbacks.length : 0,
          calls: report.allMissedCallbacks || []
        },

        // 📋 ALL SUCCESSFUL CALLBACKS
        allSuccessfulCallbacks: {
          title: "✅ All Successful Callbacks",
          count: report.allSuccessfulCallbacks ? report.allSuccessfulCallbacks.length : 0,
          calls: report.allSuccessfulCallbacks || []
        },

        // Metadata
        metadata: {
          totalCallsProcessed: callLogs.length,
          uploadedAt: new Date().toISOString(),
          fileName: file.originalname,
          reportGeneratedAt: new Date().toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short'
          })
        }
      });

    } catch (err) {
      console.error('❌ Call report error:', err);
      
      // Clean up file if it exists (with safety check)
      if (req.files?.[0]?.path && fs.existsSync(req.files[0].path)) {
        try {
          fs.unlinkSync(req.files[0].path);
          console.log('✅ Temp file deleted after error');
        } catch (unlinkErr) {
          console.error('Failed to delete temp file:', unlinkErr);
        }
      }

      res.status(500).json({ 
        success: false,
        message: '❌ Failed to process call report',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your file'
      });
    }
  });


router.route("/ETAestimation").get (
    ETAestimation
    )

    router.route("/geofancing").get (
    geofancing
    )

export default router