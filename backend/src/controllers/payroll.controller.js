const { db } = require('../db/db');
const PDFDocument = require('pdfkit');

exports.getMyPayslips = async (req, res) => {
    try {
        const monthOrder = { 'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12 };
        const result = await db.execute({
            sql: 'SELECT * FROM payslips WHERE user_id = ? ORDER BY id DESC',
            args: [req.user.id]
        });
        
        // Deduplicate: Keep only the latest for each month/year
        const seen = new Set();
        const deduplicated = result.rows.filter(p => {
            const key = `${p.month}-${p.year}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const sorted = deduplicated.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return monthOrder[b.month] - monthOrder[a.month];
        });
        
        res.json(sorted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllPayslips = async (req, res) => {
    try {
        const monthOrder = { 'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12 };
        const result = await db.execute(`
            SELECT p.*, u.name as user_name, e.employee_code 
            FROM payslips p 
            JOIN users u ON p.user_id = u.id 
            LEFT JOIN employees e ON u.id = e.user_id
            ORDER BY p.id DESC
        `);
        
        const seen = new Set();
        const deduplicated = result.rows.filter(p => {
            const key = `${p.user_id}-${p.month}-${p.year}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const sorted = deduplicated.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return monthOrder[b.month] - monthOrder[a.month];
        });
        
        res.json(sorted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPayslip = async (req, res) => {
    const { user_id, month, year, base_salary, hra = 0, allowances = 0, bonus = 0, tax = 0, pf = 0, insurance = 0 } = req.body;
    
    try {
        // IDEMPOTENCY CHECK: Return existing if month/year matches
        const existing = await db.execute({
            sql: 'SELECT * FROM payslips WHERE user_id = ? AND month = ? AND year = ?',
            args: [user_id, month, year]
        });

        if (existing.rows.length > 0) {
            return res.json({ message: 'Payslip already exists. Returning existing record.', payslip: existing.rows[0], alreadyExists: true });
        }

        // Calculate Net
        const earnings = parseFloat(base_salary || 0) + parseFloat(hra || 0) + parseFloat(allowances || 0) + parseFloat(bonus || 0);
        const deductions = parseFloat(tax || 0) + parseFloat(pf || 0) + parseFloat(insurance || 0);
        const net_salary = earnings - deductions;
        
        await db.execute({
            sql: 'INSERT INTO payslips (user_id, month, year, base_salary, hra, allowances, bonus, tax, pf, insurance, net_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [user_id, month, year, base_salary, hra, allowances, bonus, tax, pf, insurance, net_salary]
        });
        res.json({ message: 'Payslip generated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.downloadPayslip = async (req, res) => {
    const payslipId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const result = await db.execute({
            sql: `
                SELECT p.*, u.name as user_name, e.employee_code, d.name as department_name
                FROM payslips p 
                JOIN users u ON p.user_id = u.id 
                LEFT JOIN employees e ON u.id = e.user_id
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE p.id = ?
            `,
            args: [payslipId]
        });

        const p = result.rows[0];
        if (!p) return res.status(404).json({ error: 'Payslip not found' });

        if (role !== 'admin' && role !== 'hr' && p.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to payslip' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let filename = `Payslip_${p.month}_${p.year}_${p.employee_code || p.user_id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Header Section
        doc.rect(0, 0, 595.28, 120).fill('#4f46e5');
        doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('EMP PRO ENTERPRISE', 50, 45);
        doc.fontSize(10).font('Helvetica').text('CORPORATE PAYROLL & COMPENSATION SYSTEMS', 50, 75);
        doc.moveDown(4);

        // Employee Info Section
        doc.fillColor('#1e293b').fontSize(14).text(`Compensation Statement: ${p.month} ${p.year}`, 50, 140, { underline: true });
        doc.moveDown(1);
        
        const infoY = 170;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('EMPLOYEE DETAILS', 50, infoY);
        doc.rect(50, infoY+15, 500, 1).fill('#e2e8f0');

        doc.fillColor('#1e293b').fontSize(11).font('Helvetica').text(`Name:`, 50, infoY + 25);
        doc.font('Helvetica-Bold').text(p.user_name, 150, infoY + 25);
        
        doc.font('Helvetica').text(`Employee Code:`, 50, infoY + 40);
        doc.font('Helvetica-Bold').text(p.employee_code || 'N/A', 150, infoY + 40);

        doc.font('Helvetica').text(`Department:`, 50, infoY + 55);
        doc.font('Helvetica-Bold').text(p.department_name || 'General', 150, infoY + 55);

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
        renderRow('Basic Salary', p.base_salary, 60);
        renderRow('H.R.A.', p.hra || 0, 60);
        renderRow('Allowances', p.allowances || 0, 60);
        renderRow('Bonus/Incentives', p.bonus || 0, 60);
        const totalEarnings = parseFloat(p.base_salary) + (p.hra||0) + (p.allowances||0) + (p.bonus||0);
        
        // Render Deductions
        rowY = deductionsY;
        renderRow('Income Tax', p.tax || 0, 320);
        renderRow('Provident Fund', p.pf || 0, 320);
        renderRow('Insurance', p.insurance || 0, 320);
        const totalDeductions = parseFloat(p.tax||0) + (p.pf||0) + (p.insurance||0);

        // Subtotals
        doc.rect(50, 360, colWidth, 20).fill('#f1f5f9');
        doc.fillColor('#1e293b').font('Helvetica-Bold').text('Total Earnings', 60, 365);
        doc.text(totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 }), 180, 365, { width: 100, align: 'right' });

        doc.rect(310, 360, colWidth, 20).fill('#fecaca');
        doc.fillColor('#991b1b').text('Total Deductions', 320, 365);
        doc.text(totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 }), 440, 365, { width: 100, align: 'right' });

        // Net Pay Section
        doc.rect(50, 420, 500, 50).fill('#4f46e5');
        doc.fillColor('#ffffff').fontSize(16).text('NET TAKE-HOME PAY', 70, 437);
        doc.fontSize(20).text(`$${p.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 350, 435, { width: 180, align: 'right' });

        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('This is a computer-generated document and does not require an official signature.', 50, 750, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleDateString()} for Internal Corporate Records`, 50, 765, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('PDF Gen Error:', error);
        res.status(500).json({ error: error.message });
    }
};
