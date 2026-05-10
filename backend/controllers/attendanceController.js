const supabase = require("../config/supabase");

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        students!inner(admission_no, first_name, last_name, class_id, section_id),
        users!attendance_marked_by_fkey(first_name, last_name)
      `)
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.mark = async (req, res) => {
  try {
    const attendanceRecords = Array.isArray(req.body) ? req.body : [req.body];

    // Validate each record
    for (const record of attendanceRecords) {
      if (!record.student_id || !record.date || !record.status || !record.period_number) {
        return res.status(400).json({
          message: 'Missing required fields: student_id, date, status, period_number'
        });
      }

      if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be: present, absent, late, excused'
        });
      }
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert(attendanceRecords)
      .select(`
        *,
        students!inner(admission_no, first_name, last_name),
        users!attendance_marked_by_fkey(first_name, last_name)
      `);

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from("attendance")
      .select(`
        *,
        users!attendance_marked_by_fkey(first_name, last_name)
      `)
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getClassAttendance = async (req, res) => {
  try {
    const { classId, sectionId, date, periodNumber } = req.query;

    if (!classId || !date) {
      return res.status(400).json({
        message: 'classId and date are required'
      });
    }

    let query = supabase
      .from("attendance")
      .select(`
        *,
        students!inner(admission_no, first_name, last_name, class_id, section_id),
        users!attendance_marked_by_fkey(first_name, last_name)
      `)
      .eq('date', date);

    if (sectionId) query = query.eq('students.section_id', sectionId);
    if (periodNumber) query = query.eq('period_number', periodNumber);

    const { data, error } = await query.eq('students.class_id', classId);
    if (error) return res.status(500).json({ message: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, threshold = 75 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'startDate and endDate are required'
      });
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, admission_no, first_name, last_name, class_id, section_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get total scheduled periods from timetable
    const { data: timetable, error: timetableError } = await supabase
      .from('timetable')
      .select('id, day_of_week, period_number')
      .eq('class_id', student.class_id)
      .eq('section_id', student.section_id);

    if (timetableError) return res.status(500).json({ message: timetableError.message });

    // Calculate total scheduled periods in date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalScheduled = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleLowerCase('en-US', { weekday: 'long' });
      const dayPeriods = timetable.filter(t => t.day_of_week === dayName).length;
      totalScheduled += dayPeriods;
    }

    // Get attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status, period_number')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (attendanceError) return res.status(500).json({ message: attendanceError.message });

    // Calculate present periods
    const presentPeriods = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalScheduled > 0 ? (presentPeriods / totalScheduled * 100).toFixed(2) : 0;

    // Check for alerts
    const alerts = [];
    if (parseFloat(attendancePercentage) < parseFloat(threshold)) {
      alerts.push({
        type: 'low_attendance',
        message: `Attendance below ${threshold}% threshold`,
        severity: 'warning'
      });
    }

    // Additional stats
    const totalMarked = attendance.length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const excusedCount = attendance.filter(a => a.status === 'excused').length;

    res.json({
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no
      },
      period: { startDate, endDate },
      attendance: {
        percentage: parseFloat(attendancePercentage),
        present: presentPeriods,
        totalScheduled,
        totalMarked,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount
      },
      alerts
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
