const db = require('../config/db');
const lineModel = require('../models/lineModel');
const lineStopModel = require('../models/lineStopModel');
const timetableModel = require('../models/timetableModel');
const busStopModel = require('../models/busStopModel');

module.exports = {
  async showAllLineSchedules(req, res) {
    const lines = await lineModel.getAll(db);
    const result = [];
    for (const line of lines) {
      const stops = await lineStopModel.getAllByLineIdWithStopName(db, line.line_id);
      const lineStopIds = stops.map(s => s.line_stop_id);
      let timetables = [];
      if (lineStopIds.length > 0) {
        const allTimetables = await timetableModel.getAll(db);
        timetables = allTimetables.filter(t => lineStopIds.includes(t.line_stop_id));
      }
      const runNumbers = [...new Set(timetables.map(t => t.run_number))].sort((a,b) => a-b);
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
