const db = require('../db/db');

exports.getFrontendPulse = async (req, res) => {
  try {
    const teamResult = await db.execute({
      sql: 'SELECT * FROM teams WHERE name = ?',
      args: ['Frontend Squad']
    });
    const team = teamResult.rows[0];
    if (!team) return res.status(404).json({ message: 'Frontend Squad not found' });

    const membersResult = await db.execute({
      sql: 'SELECT name, role, productivity_score FROM users WHERE team_id = ?',
      args: [team.id]
    });
    
    const projectsResult = await db.execute({
      sql: 'SELECT name, status, progress FROM projects WHERE team_id = ?',
      args: [team.id]
    });
    
    // Mocking some activity logs for Frontend
    const activityLogs = [
      { user: 'Sarah Frontend', action: 'Deployed UI Components', timestamp: '2026-03-17 14:30:00' },
      { user: 'John Employee', action: 'Fixed Navbar responsiveness', timestamp: '2026-03-17 11:20:00' }
    ];

    res.json({
      teamName: team.name,
      overallProductivity: team.overall_productivity,
      members: membersResult.rows,
      projects: projectsResult.rows,
      activityLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const projectsResult = await db.execute(`
        SELECT p.name as projectName, p.deadline, p.progress, p.status, t.name as assignedTeam
        FROM projects p
        JOIN teams t ON p.team_id = t.id
        WHERE p.deadline >= date('now')
        ORDER BY p.deadline ASC
    `);

    const result = projectsResult.rows.map(p => {
        const deadline = new Date(p.deadline);
        const now = new Date();
        const diffMs = deadline - now;
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        return {
            ...p,
            daysRemaining,
            isUrgent: daysRemaining <= 7
        };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
