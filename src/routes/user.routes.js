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
        fs.unlinkSync(file.path);
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
      
      const report = analyzeCalls(callLogs);

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      // Return comprehensive report with daily and weekly breakdown
      res.json({
        success: true,
        message: "✅ Detailed day-wise and week-wise call report generated",
        
        // Overall Summary
        summary: {
          ...report.summary,
          message: `Analyzed ${report.summary.totalMissedCalls} missed calls across ${report.dailyReports.length} days. ${report.summary.totalCallbacksMade} were called back, ${report.summary.totalNotCalledBack} were not called back.`
        },

        // 📅 DAILY REPORTS - Har din ka complete breakdown
        dailyReports: {
          title: "📅 Day-wise Call Analysis",
          totalDays: report.dailyReports.length,
          reports: report.dailyReports.map(day => ({
            date: day.dateFormatted,
            dayOfWeek: day.dayOfWeek,
            summary: {
              totalMissedCalls: day.totalMissedCalls,
              totalCallbacks: day.totalCallbacks,
              notCalledBack: day.notCalledBack,
              onTimeCallbacks: day.onTimeCallbacks,
              lateCallbacks: day.lateCallbacks,
              callbackRate: day.callbackRate
            },
            timing: {
              jobHoursCalls: day.jobHoursCalls,
              afterHoursCalls: day.afterHoursCalls,
              averageResponseTime: day.averageResponseTime,
              fastestResponse: day.fastestResponseFormatted,
              slowestResponse: day.slowestResponseFormatted
            },
            details: {
              missedCalls: day.missedCallsList,
              callbacks: day.callbacksList
            }
          })),
          bestDay: report.dailyReports.length > 0 
            ? report.dailyReports.reduce((best, day) => {
                if (!best || (day.totalCallbacks > 0 && day.fastestResponse < best.fastestResponse)) {
                  return day;
                }
                return best;
              }, null)
            : null,
          worstDay: report.dailyReports.length > 0
            ? report.dailyReports.reduce((worst, day) => {
                if (!worst || day.notCalledBack > worst.notCalledBack) {
                  return day;
                }
                return worst;
              }, null)
            : null
        },

        // 📊 WEEKLY REPORTS - Har week ka summary
        weeklyReports: {
          title: "📊 Week-wise Call Summary",
          totalWeeks: report.weeklyReports.length,
          reports: report.weeklyReports.map(week => ({
            weekRange: week.weekRange,
            summary: {
              totalMissedCalls: week.totalMissedCalls,
              totalCallbacks: week.totalCallbacks,
              notCalledBack: week.notCalledBack,
              onTimeCallbacks: week.onTimeCallbacks,
              lateCallbacks: week.lateCallbacks,
              callbackRate: week.callbackRate
            },
            timing: {
              jobHoursCalls: week.jobHoursCalls,
              afterHoursCalls: week.afterHoursCalls,
              averageResponseTime: week.averageResponseTime
            }
          }))
        },

        // 👥 EMPLOYEE PERFORMANCE - Detailed employee-wise breakdown
        employeePerformance: {
          title: "👥 Employee Performance Report",
          totalEmployees: report.employeePerformance.length,
          ranking: report.employeePerformance.map((emp, index) => ({
            rank: index + 1,
            employeeName: emp.employeeName,
            overview: {
              totalMissedCallsReceived: emp.totalMissedCallsReceived,
              totalCallbacksMade: emp.totalCallbacksMade,
              notCalledBack: emp.notCalledBack,
              callbackRate: emp.callbackRate
            },
            performance: {
              onTimeCallbacks: emp.onTimeCallbacks,
              lateCallbacks: emp.lateCallbacks,
              averageResponseTime: emp.averageResponseTime,
              fastestCallback: emp.fastestCallbackFormatted,
              slowestCallback: emp.slowestCallbackFormatted,
              rating: emp.performanceRating
            },
            dailyBreakdown: Object.values(emp.dailyBreakdown || {})
          })),
          topPerformer: report.employeePerformance.length > 0
            ? report.employeePerformance.reduce((best, emp) => {
                if (emp.totalCallbacksMade === 0) return best;
                if (!best || emp.fastestCallback < best.fastestCallback) {
                  return emp;
                }
                return best;
              }, null)
            : null,
          mostMissedCalls: report.employeePerformance.length > 0
            ? report.employeePerformance[0]
            : null
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
      
      // Clean up file if it exists
      if (req.files?.[0]?.path) {
        try {
          fs.unlinkSync(req.files[0].path);
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