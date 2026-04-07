const { db } = require('../db/db');

exports.getBenefitPlans = async (req, res) => {
    try {
        const plans = await db.execute("SELECT * FROM benefit_plans");
        res.json(plans.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyBenefits = async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT b.*, p.name, p.description, p.max_limit FROM user_benefits b JOIN benefit_plans p ON b.benefit_id = p.id WHERE b.user_id = ?",
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.enrollInBenefit = async (req, res) => {
    const { benefit_id, amount } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO user_benefits (user_id, benefit_id, amount) VALUES (?, ?, ?)",
            args: [req.user.id, benefit_id, amount]
        });
        res.json({ message: 'Enrolled in benefit plan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBenefitEnrollment = async (req, res) => {
    const { id, amount } = req.body;
    try {
        await db.execute({
            sql: "UPDATE user_benefits SET amount = ? WHERE id = ? AND user_id = ?",
            args: [amount, id, req.user.id]
        });
        res.json({ message: 'Enrollment updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
