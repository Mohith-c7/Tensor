/**
 * Dashboard Service
 * Aggregates KPIs, charts, and recent activity from existing tables
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');

class DashboardService {
  /**
   * Get KPI summary for the dashboard
   */
  async getKPIs() {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: upcomingExams },
      attendanceToday,
      pendingFees,
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
      supabase.from('exams').select('*', { count: 'exact', head: true }).gte('exam_date', today),
      supabase.from('attendance').select('status').eq('date', today),
      supabase.from('students')
        .select('id, fee_payments(amount)', { count: 'exact' })
        .eq('is_active', true),
    ]);

    // Attendance rate today
    const records = attendanceToday.data ?? [];
    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const attendanceRateToday = records.length > 0
      ? Math.round((presentCount / records.length) * 100)
      : 0;

    // Pending fees: students with outstanding balance
    // Simplified: count students who have no payments at all this academic year
    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const { count: pendingFeesCount } = await supabase
      .from('fee_payments')
      .select('student_id', { count: 'exact', head: true })
      .eq('academic_year', academicYear);

    return {
      totalStudents: totalStudents ?? 0,
      totalTeachers: totalTeachers ?? 0,
      attendanceRateToday,
      pendingFeesCount: Math.max(0, (totalStudents ?? 0) - (pendingFeesCount ?? 0)),
      upcomingExamsCount: upcomingExams ?? 0,
    };
  }

  /**
   * Attendance trend for the last 7 days
   */
  async getAttendanceTrend() {
    const days = 7;
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', dateStr);

      const records = data ?? [];
      const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const percentage = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

      results.push({ date: dateStr, percentage });
    }

    return results;
  }

  /**
   * Fee collection totals for the last 6 months
   */
  async getFeeCollection() {
    const results = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('fee_payments')
        .select('amount')
        .gte('payment_date', start)
        .lte('payment_date', end);

      const amount = (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
      results.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        amount,
      });
    }

    return results;
  }

  /**
   * Recent audit log activity
   */
  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, performed_by, created_at, users(email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('audit_logs query failed', { error: error.message });
      return [];
    }

    return (data ?? []).map(row => ({
      id: row.id,
      action: row.action,
      entity: row.entity_type,
      entityId: row.entity_id,
      performedBy: row.users?.email ?? 'system',
      createdAt: row.created_at,
    }));
  }
}

module.exports = new DashboardService();
