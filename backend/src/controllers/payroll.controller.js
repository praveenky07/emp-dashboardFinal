const { db } = require('../db/db');
const PDFDocument = require('pdfkit');

// Get my payroll (Employee)
exports.getMyPayslips = async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM payroll WHERE user_id = ? ORDER BY generated_at DESC',
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// Get all payroll (Admin/Manager)
exports.getAllPayslips = async (req, res) => {
    try {
        const sql = `
            SELECT p.*, u.name as user_name 
            FROM payroll p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.generated_at DESC
        `;
        const result = await db.execute(sql);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// Generate Payroll API
exports.generatePayroll = async (req, res) => {
    const { user_id, month } = req.body;

    if (!user_id || !month) return res.status(400).json({ error: 'User ID and Month are required' });

    try {
        // 1. Fetch Salary Structure
        const structRes = await db.execute({
            sql: 'SELECT * FROM salary_structure WHERE user_id = ?',
            args: [user_id]
        });
        if (structRes.rows.length === 0) {
            return res.status(400).json({ error: 'Salary structure not defined for this user.' });
        }
        const struct = structRes.rows[0];

        // 2. Attendance Integration
        const attRes = await db.execute({
            sql: "SELECT COUNT(*) as count FROM attendance WHERE user_id = ? AND date LIKE ? AND status IN ('Present', 'Half Day')",
            args: [user_id, `${month}%`]
        });
        const present_days = attRes.rows[0].count;

        const leaveRes = await db.execute({
            sql: "SELECT SUM(total_days) as count FROM leaves WHERE user_id = ? AND start_date LIKE ? AND status = 'Approved' AND type != 'Unpaid'",
            args: [user_id, `${month}%`]
        });
        const leave_days = leaveRes.rows[0].count || 0;

        const working_days = 22;
        const total_paid_days = present_days + leave_days;
        const unpaid_days = Math.max(0, working_days - total_paid_days);

        // 3. Formula
        const per_day_salary = struct.basic / working_days;
        const deduction = Math.round(unpaid_days * per_day_salary);
        const gross_salary = struct.basic + struct.hra + struct.bonus;
        const tax = Math.round((gross_salary * struct.tax_percent) / 100);
        const final_salary = Math.round(gross_salary - deduction - tax);

        // 4. Update or Insert
        const exist = await db.execute({
            sql: 'SELECT id FROM payroll WHERE user_id = ? AND month = ?',
            args: [user_id, month]
        });

        if (exist.rows.length > 0) {
            await db.execute({
                sql: 'UPDATE payroll SET working_days=?, present_days=?, leave_days=?, unpaid_days=?, gross_salary=?, deduction=?, tax=?, final_salary=?, generated_at=CURRENT_TIMESTAMP WHERE id=?',
                args: [working_days, present_days, leave_days, unpaid_days, gross_salary, deduction, tax, final_salary, exist.rows[0].id]
            });
        } else {
            await db.execute({
                sql: 'INSERT INTO payroll (user_id, month, working_days, present_days, leave_days, unpaid_days, gross_salary, deduction, tax, final_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                args: [user_id, month, working_days, present_days, leave_days, unpaid_days, gross_salary, deduction, tax, final_salary]
            });
        }
        res.json({ message: 'Payroll generated successfully', data: { gross_salary, deduction, tax, final_salary, unpaid_days } });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// Get Structure
exports.getSalaryStructure = async (req, res) => {
    try {
        const result = await db.execute({ sql: 'SELECT * FROM salary_structure WHERE user_id = ?', args: [req.user.id] });
        res.json(result.rows[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllSalaryStructures = async (req, res) => {
    try {
        const result = await db.execute({ 
             sql: 'SELECT s.*, u.name as user_name FROM salary_structure s JOIN users u ON s.user_id = u.id' 
        });
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.setSalaryStructure = async (req, res) => {
    const { user_id, basic, hra, bonus, tax_percent } = req.body;
    try {
        const exist = await db.execute({ sql: 'SELECT user_id FROM salary_structure WHERE user_id = ?', args: [user_id] });
        if (exist.rows.length > 0) {
            await db.execute({
                sql: 'UPDATE salary_structure SET basic=?, hra=?, bonus=?, tax_percent=? WHERE user_id=?',
                args: [basic, hra, bonus, tax_percent, user_id]
            });
        } else {
            await db.execute({
                sql: 'INSERT INTO salary_structure (user_id, basic, hra, bonus, tax_percent) VALUES (?, ?, ?, ?, ?)',
                args: [user_id, basic, hra, bonus, tax_percent]
            });
        }
        res.json({ message: 'Salary structure updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.downloadPayslip = async (req, res) => {
    const payslipId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const result = await db.execute({
            sql: `
                SELECT p.*, u.name as user_name, s.basic as s_basic, s.hra as s_hra, s.bonus as s_bonus, s.tax_percent as s_tax_pct
                FROM payroll p 
                JOIN users u ON p.user_id = u.id 
                LEFT JOIN salary_structure s ON u.id = s.user_id
                WHERE p.id = ?
            `,
            args: [payslipId]
        });

        const p = result.rows[0];
        if (!p) return res.status(404).json({ error: 'Payroll not found' });

        if (role !== 'admin' && role !== 'hr' && p.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to payslip' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let filename = `Payslip_${p.month}_${p.user_name.replace(' ','_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Header Section
        doc.rect(0, 0, 595.28, 120).fill('#4f46e5');
        doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('EMP PRO ENTERPRISE', 50, 45);
        doc.fontSize(10).font('Helvetica').text('CORPORATE PAYROLL & COMPENSATION SYSTEMS', 50, 75);
        doc.moveDown(4);

        // Employee Info Section
        doc.fillColor('#1e293b').fontSize(14).text(`Compensation Statement: ${p.month}`, 50, 140, { underline: true });
        doc.moveDown(1);
        
        const infoY = 170;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('EMPLOYEE DETAILS', 50, infoY);
        doc.rect(50, infoY+15, 500, 1).fill('#e2e8f0');

        doc.fillColor('#1e293b').fontSize(11).font('Helvetica').text(`Name:`, 50, infoY + 25);
        doc.font('Helvetica-Bold').text(p.user_name, 150, infoY + 25);
        
        doc.font('Helvetica').text(`Working Days:`, 50, infoY + 40);
        doc.font('Helvetica-Bold').text(`${p.working_days}`, 150, infoY + 40);

        doc.font('Helvetica').text(`Present & Leaves:`, 50, infoY + 55);
        doc.font('Helvetica-Bold').text(`P: ${p.present_days} | L: ${p.leave_days} | U: ${p.unpaid_days}`, 150, infoY + 55);

        // Earnings and Deductions Layout
        const payY = 260;
        const colWidth = 240;

        // Earnings Header
        doc.rect(50, payY, colWidth, 25).fill('#f8fafc');
        doc.fillColor('#4f46e5').fontSize(11).font('Helvetica-Bold').text('EARNINGS', 60, payY + 8);
        doc.text('AMOUNT', 220, payY + 8);

        // Deductions Header
        doc.rect(310, payY, colWidth, 25).fill('#fff1f2');
        doc.fillColor('#be123c').text('DEDUCTIONS', 320, payY + 8);
        doc.text('AMOUNT', 480, payY + 8);

        let rowY = payY + 35;
        const renderRow = (label, amt, x) => {
            doc.fillColor('#475569').font('Helvetica').fontSize(10).text(label, x, rowY);
            doc.fillColor('#1e293b').font('Helvetica-Bold').text(amt.toLocaleString(undefined, { minimumFractionDigits: 2 }), x + 120, rowY, { width: 110, align: 'right' });
            rowY += 20;
        };

        let earningsY = payY + 35;
        let deductionsY = payY + 35;

        // Render Earnings
        rowY = earningsY;
        renderRow('Basic Salary', p.s_basic || 0, 60);
        renderRow('H.R.A.', p.s_hra || 0, 60);
        renderRow('Bonus', p.s_bonus || 0, 60);
        
        // Render Deductions
        rowY = deductionsY;
        renderRow('Unpaid Leaves Deduction', p.deduction || 0, 320);
        renderRow('Income Tax', p.tax || 0, 320);

        // Subtotals
        doc.rect(50, 360, colWidth, 20).fill('#f1f5f9');
        doc.fillColor('#1e293b').font('Helvetica-Bold').text('Gross Earnings', 60, 365);
        doc.text(p.gross_salary.toLocaleString(undefined, { minimumFractionDigits: 2 }), 180, 365, { width: 100, align: 'right' });

        doc.rect(310, 360, colWidth, 20).fill('#fecaca');
        const totalDeductions = (p.deduction || 0) + (p.tax || 0);
        doc.fillColor('#991b1b').text('Total Deductions', 320, 365);
        doc.text(totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 }), 440, 365, { width: 100, align: 'right' });

        // Net Pay Section
        doc.rect(50, 420, 500, 50).fill('#4f46e5');
        doc.fillColor('#ffffff').fontSize(16).text('NET TAKE-HOME PAY', 70, 437);
        doc.fontSize(20).text(`Rs. ${p.final_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 350, 435, { width: 180, align: 'right' });

        doc.end();
    } catch (error) {
        console.error('PDF Gen Error:', error);
        res.status(500).json({ error: error.message });
    }
};
