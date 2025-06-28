const db = require('../config/db');
const lineModel = require('../models/lineModel');
const lineStopModel = require('../models/lineStopModel');
const timetableModel = require('../models/timetableModel');
const busStopModel = require('../models/busStopModel');

module.exports = {
  async showAllLineSchedules(req, res) {
    // Get all lines
    const lines = await lineModel.getAll(db);
    // For each line, get stops (ordered) and all departure times for each stop
    const result = [];
    for (const line of lines) {
      // Get stops for this line (ordered)
      const stops = await lineStopModel.getAllByLineIdWithStopName(db, line.line_id);
      // Get all timetable entries for this line (all stops)
      const lineStopIds = stops.map(s => s.line_stop_id);
      let timetables = [];
      if (lineStopIds.length > 0) {
        const allTimetables = await timetableModel.getAll(db);
        timetables = allTimetables.filter(t => lineStopIds.includes(t.line_stop_id));
      }
      // Group timetable entries by run_number (each run is a column)
      const runNumbers = [...new Set(timetables.map(t => t.run_number))].sort((a,b) => a-b);
      // For each stop, collect departure times for each run_number
      const timesByStop = {};
      stops.forEach(stop => {
        timesByStop[stop.line_stop_id] = runNumbers.map(run => {
          const entry = timetables.find(t => t.line_stop_id === stop.line_stop_id && t.run_number === run);
          return entry ? entry.departure_time : null;
        });
      });
      result.push({
        code: line.line_code,
        name: line.line_name,
        stops: stops.map(s => ({ id: s.line_stop_id, name: s.stop_name })),
        departureTimes: runNumbers.map(rn => `Kurs ${rn}`),
        timesByStop
      });
    }
    res.render('line_schedules', { lines: result });
  }
};
