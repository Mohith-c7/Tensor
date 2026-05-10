const supabase = require("../config/supabase");

// Helper function to calculate grade and pass/fail
function calculateGradeAndPass(marksObtained, maxMarks, passingMarks) {
  const percentage = (marksObtained / maxMarks) * 100;
  let grade = 'F';
  let isPassed = false;

  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';
  else if (percentage >= passingMarks / maxMarks * 100) grade = 'E';

  isPassed = percentage >= (passingMarks / maxMarks * 100);

  return { grade, isPassed, percentage };
}

exports.getExams = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*, classes(name)")
      .order('exam_date', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("exams")
      .insert([req.body])
      .select("*, classes(name)")
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marks")
      .select(`
        *,
        students!inner(admission_no, first_name, last_name),
        exams!inner(name, max_marks, passing_marks),
        users!marks_entered_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    // Add calculated fields
    const marksWithGrades = data.map(mark => ({
      ...mark,
      ...calculateGradeAndPass(mark.marks_obtained, mark.exams.max_marks, mark.exams.passing_marks)
    }));

    res.json(marksWithGrades);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.enterMarks = async (req, res) => {
  try {
    const marksData = Array.isArray(req.body) ? req.body : [req.body];

    // Validate and calculate grades
    const marksWithGrades = [];
    for (const mark of marksData) {
      // Get exam details for validation
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('max_marks, passing_marks')
        .eq('id', mark.exam_id)
        .single();

      if (examError || !exam) {
        return res.status(400).json({ message: `Invalid exam_id: ${mark.exam_id}` });
      }

      if (mark.marks_obtained > exam.max_marks) {
        return res.status(400).json({
          message: `Marks obtained (${mark.marks_obtained}) cannot exceed max marks (${exam.max_marks})`
        });
      }

      const { grade, isPassed, percentage } = calculateGradeAndPass(
        mark.marks_obtained,
        exam.max_marks,
        exam.passing_marks
      );

      marksWithGrades.push({
        ...mark,
        grade,
        is_passed: isPassed,
        percentage
      });
    }

    const { data, error } = await supabase
      .from("marks")
      .insert(marksWithGrades)
      .select(`
        *,
        students!inner(admission_no, first_name, last_name),
        exams!inner(name, max_marks, passing_marks),
        users!marks_entered_by_fkey(first_name, last_name)
      `);

    if (error) return res.status(400).json({ message: error.message });

    // Add calculated fields to response
    const responseData = data.map(mark => ({
      ...mark,
      ...calculateGradeAndPass(mark.marks_obtained, mark.exams.max_marks, mark.exams.passing_marks)
    }));

    res.status(201).json(responseData);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from("marks")
      .select(`
        *,
        exams!inner(name, exam_type, subject, max_marks, passing_marks, exam_date, class_id),
        users!marks_entered_by_fkey(first_name, last_name)
      `)
      .eq('student_id', studentId)
      .order('exams(exam_date)', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    // Group by exam type and calculate analytics
    const resultsByType = {};
    const overallStats = {
      totalExams: data.length,
      totalMarks: 0,
      totalMaxMarks: 0,
      passedExams: 0,
      failedExams: 0,
      averagePercentage: 0
    };

    data.forEach(mark => {
      const exam = mark.exams;
      const { grade, isPassed, percentage } = calculateGradeAndPass(
        mark.marks_obtained,
        exam.max_marks,
        exam.passing_marks
      );

      if (!resultsByType[exam.exam_type]) {
        resultsByType[exam.exam_type] = {
          examType: exam.exam_type,
          exams: [],
          totalMarks: 0,
          totalMaxMarks: 0,
          averagePercentage: 0,
          passedCount: 0
        };
      }

      resultsByType[exam.exam_type].exams.push({
        ...mark,
        grade,
        isPassed,
        percentage
      });

      resultsByType[exam.exam_type].totalMarks += mark.marks_obtained;
      resultsByType[exam.exam_type].totalMaxMarks += exam.max_marks;
      if (isPassed) resultsByType[exam.exam_type].passedCount++;

      overallStats.totalMarks += mark.marks_obtained;
      overallStats.totalMaxMarks += exam.max_marks;
      if (isPassed) overallStats.passedExams++;
      else overallStats.failedExams++;
    });

    // Calculate averages
    Object.values(resultsByType).forEach(typeStats => {
      typeStats.averagePercentage = typeStats.totalMaxMarks > 0 ?
        (typeStats.totalMarks / typeStats.totalMaxMarks * 100) : 0;
    });

    overallStats.averagePercentage = overallStats.totalMaxMarks > 0 ?
      (overallStats.totalMarks / overallStats.totalMaxMarks * 100) : 0;

    res.json({
      studentId: parseInt(studentId),
      resultsByType,
      overallStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const { data, error } = await supabase
      .from("marks")
      .select(`
        *,
        students!inner(admission_no, first_name, last_name),
        exams!inner(name, max_marks, passing_marks)
      `)
      .eq('exam_id', examId)
      .order('marks_obtained', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    // Calculate statistics
    const marks = data.map(mark => mark.marks_obtained);
    const stats = {
      totalStudents: data.length,
      average: marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0,
      highest: marks.length > 0 ? Math.max(...marks) : 0,
      lowest: marks.length > 0 ? Math.min(...marks) : 0,
      passCount: 0,
      failCount: 0,
      distribution: {}
    };

    // Calculate grades and pass/fail
    const resultsWithGrades = data.map(mark => {
      const { grade, isPassed, percentage } = calculateGradeAndPass(
        mark.marks_obtained,
        mark.exams.max_marks,
        mark.exams.passing_marks
      );

      if (isPassed) stats.passCount++;
      else stats.failCount++;

      // Distribution
      if (!stats.distribution[grade]) stats.distribution[grade] = 0;
      stats.distribution[grade]++;

      return {
        ...mark,
        grade,
        isPassed,
        percentage,
        rank: 0 // Will set after sorting
      };
    });

    // Assign ranks
    resultsWithGrades.forEach((result, index) => {
      result.rank = index + 1;
    });

    res.json({
      examId: parseInt(examId),
      exam: data[0]?.exams,
      results: resultsWithGrades,
      statistics: stats
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
