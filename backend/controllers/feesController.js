const supabase = require("../config/supabase");

exports.getStructures = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fee_structures")
      .select("*, classes(name)")
      .order('academic_year', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createStructure = async (req, res) => {
  try {
    const { classId, academicYear, tuitionFee, transportFee = 0, activityFee = 0, otherFee = 0 } = req.body;

    if (!classId || !academicYear || tuitionFee === undefined) {
      return res.status(400).json({
        message: 'classId, academicYear, and tuitionFee are required'
      });
    }

    const totalFee = tuitionFee + transportFee + activityFee + otherFee;

    const { data, error } = await supabase
      .from("fee_structures")
      .insert([{
        class_id: classId,
        academic_year: academicYear,
        tuition_fee: tuitionFee,
        transport_fee: transportFee,
        activity_fee: activityFee,
        other_fee: otherFee,
        total_fee: totalFee
      }])
      .select("*, classes(name)")
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fee_payments")
      .select("*, students(first_name, last_name, admission_no), users(first_name, last_name)")
      .order('payment_date', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { studentId, academicYear, amount, paymentDate, paymentMethod, transactionId, remarks } = req.body;

    if (!studentId || !academicYear || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({
        message: 'studentId, academicYear, amount, paymentDate, and paymentMethod are required'
      });
    }

    const { data, error } = await supabase
      .from("fee_payments")
      .insert([{
        student_id: studentId,
        academic_year: academicYear,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        remarks,
        received_by: req.user.id // Assuming auth middleware sets req.user
      }])
      .select("*, students(first_name, last_name, admission_no), users(first_name, last_name)")
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear = new Date().getFullYear().toString() } = req.query;

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, admission_no, first_name, last_name, class_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get fee structure for the class and year
    const { data: structure, error: structureError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('class_id', student.class_id)
      .eq('academic_year', academicYear)
      .single();

    if (structureError || !structure) {
      return res.status(404).json({ message: 'Fee structure not found for this class and year' });
    }

    // Get all payments for the student and year
    const { data: payments, error: paymentsError } = await supabase
      .from('fee_payments')
      .select('*, users!fee_payments_received_by_fkey(first_name, last_name)')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .order('payment_date', { ascending: false });

    if (paymentsError) return res.status(500).json({ message: paymentsError.message });

    // Calculate totals
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const currentBalance = structure.total_fee - totalPaid;
    const overdueAmount = currentBalance > 0 ? currentBalance : 0;

    // Determine next installment due (simplified: assume monthly installments)
    const installments = 12; // Assume 12 installments per year
    const installmentAmount = structure.total_fee / installments;
    const paidInstallments = Math.floor(totalPaid / installmentAmount);
    const nextInstallmentDue = paidInstallments < installments ? installmentAmount : 0;

    // Check for overdue (simplified: if balance > 0 and last payment was more than 30 days ago)
    const lastPaymentDate = payments.length > 0 ? new Date(payments[0].payment_date) : null;
    const isOverdue = overdueAmount > 0 && lastPaymentDate && (new Date() - lastPaymentDate) > 30 * 24 * 60 * 60 * 1000;

    res.json({
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admissionNo: student.admission_no
      },
      academicYear,
      feeStructure: {
        totalFee: structure.total_fee,
        tuitionFee: structure.tuition_fee,
        transportFee: structure.transport_fee,
        activityFee: structure.activity_fee,
        otherFee: structure.other_fee
      },
      payments: {
        totalPaid,
        count: payments.length,
        lastPayment: payments[0] || null,
        history: payments // Include full history
      },
      status: {
        currentBalance,
        overdueAmount,
        nextInstallmentDue,
        isOverdue,
        paymentStatus: currentBalance <= 0 ? 'paid' : isOverdue ? 'overdue' : 'pending'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPendingFees = async (req, res) => {
  try {
    const { academicYear = new Date().getFullYear().toString() } = req.query;

    // Get all students with their fee structures and payments
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        admission_no,
        first_name,
        last_name,
        class_id,
        classes!inner(name),
        fee_structures!inner(total_fee, academic_year),
        fee_payments(amount)
      `)
      .eq('fee_structures.academic_year', academicYear)
      .eq('is_active', true);

    if (studentsError) return res.status(500).json({ message: studentsError.message });

    // Calculate pending fees for each student
    const pendingFees = students
      .map(student => {
        const totalFee = student.fee_structures.total_fee;
        const totalPaid = student.fee_payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const balance = totalFee - totalPaid;

        if (balance > 0) {
          return {
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            admissionNo: student.admission_no,
            className: student.classes.name,
            totalFee,
            totalPaid,
            balance,
            academicYear
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.balance - a.balance); // Sort by highest balance first

    res.json({
      academicYear,
      totalPendingStudents: pendingFees.length,
      totalPendingAmount: pendingFees.reduce((sum, p) => sum + p.balance, 0),
      pendingFees
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Legacy alias
exports.getFees = exports.getStructures;
