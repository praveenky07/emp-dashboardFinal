const db = require('../db/db');

exports.createProject = async (req, res) => {
  const { name, description, deadline } = req.body;
  const createdBy = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const result = await db.execute({
      sql: 'INSERT INTO projects (name, description, deadline, created_by) VALUES (?, ?, ?, ?)',
      args: [name, description, deadline, createdBy]
    });
    res.status(201).json({ message: 'Project created successfully', projectId: result.lastInsertRowid.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    // Managers and Admins see all projects
    // Employees see only assigned projects
    let result;
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      result = await db.execute(`
        SELECT p.*, GROUP_CONCAT(u.name) as assigned_employees
        FROM projects p
        LEFT JOIN project_assignments pa ON p.id = pa.project_id
        LEFT JOIN users u ON pa.employee_id = u.id
        GROUP BY p.id
      `);
    } else {
      result = await db.execute({
        sql: `
          SELECT p.*, GROUP_CONCAT(u.name) as assigned_employees
          FROM projects p
          JOIN project_assignments pa ON p.id = pa.project_id
          LEFT JOIN users u ON pa.employee_id = u.id
          WHERE pa.employee_id = ?
          GROUP BY p.id
        `,
        args: [req.user.id]
      });
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignProject = async (req, res) => {
  const { project_id, employee_id } = req.body;

  if (!project_id || !employee_id) {
    return res.status(400).json({ error: 'Project ID and Employee ID are required' });
  }

  try {
    await db.execute({
      sql: 'INSERT INTO project_assignments (project_id, employee_id) VALUES (?, ?)',
      args: [project_id, employee_id]
    });
    res.status(201).json({ message: 'Project assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
