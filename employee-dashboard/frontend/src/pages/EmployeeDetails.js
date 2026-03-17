import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI, attendanceAPI, breakAPI, leaveAPI, meetingAPI } from '../api/api';
import { User, Mail, Briefcase, DollarSign, Calendar, Clock, Coffee, CalendarDays, Video, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [breaks, setBreaks] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployeeData();
    }, [id]);

    const fetchEmployeeData = async () => {
        try {
            const [empRes, attRes, breakRes, leaveRes, meetRes] = await Promise.all([
                employeeAPI.getById(id),
                attendanceAPI.getAll(), // These are filtered by role in backend, but here we expect to see specifics if Admin/Manager
                breakAPI.getAll(),
                leaveAPI.getAll(),
                meetingAPI.getAll()
            ]);

            setEmployee(empRes.data);
            
            // Filter data for this specific employee (backend returns all if Admin/Manager, or just self)
            // But we want to ensure we only show data for THIS id on this detail page.
            setAttendance(attRes.data.filter(r => r.employee_id === parseInt(id)));
            setBreaks(breakRes.data.filter(r => r.employee_id === parseInt(id)));
            setLeaves(leaveRes.data.filter(r => r.employee_id === parseInt(id)));
            setMeetings(meetRes.data.filter(r => r.employee_id === parseInt(id)));

        } catch (err) {
            console.error(err);
            alert('Failed to fetch employee details or unauthorized');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Protocol Details...</div>;
    if (!employee) return <div style={{ padding: '2rem' }}>Employee not found.</div>;

    return (
        <div className="protocol-details">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-link" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                    <h1>Protocol Details: {employee.name}</h1>
                </div>
                <div className="user-role-badge">{employee.role}</div>
            </div>

            <div className="details-grid">
                {/* Profile Card */}
                <div className="detail-card profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <User size={40} />
                        </div>
                        <h2>{employee.name}</h2>
                        <p>{employee.department}</p>
                    </div>
                    <div className="profile-info">
                        <div className="info-item">
                            <Mail size={16} /> <span>{employee.email}</span>
                        </div>
                        <div className="info-item">
                            <Briefcase size={16} /> <span>{employee.role}</span>
                        </div>
                        <div className="info-item">
                            <DollarSign size={16} /> <span>${employee.salary.toLocaleString()} / year</span>
                        </div>
                        <div className="info-item">
                            <Calendar size={16} /> <span>Joined {employee.joining_date}</span>
                        </div>
                    </div>
                </div>

                {/* History Tabs / Sections */}
                <div className="history-sections">
                    <section className="history-block">
                        <div className="block-header">
                            <Clock size={20} /> <h3>Recent Attendance</h3>
                        </div>
                        <div className="small-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.slice(0, 5).map(r => (
                                        <tr key={r.id}>
                                            <td>{r.date}</td>
                                            <td>{new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td>{r.work_hours ? `${r.work_hours.toFixed(1)}h` : '-'}</td>
                                        </tr>
                                    ))}
                                    {attendance.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No attendance records</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="history-block">
                        <div className="block-header">
                            <Coffee size={20} /> <h3>Break Summary</h3>
                        </div>
                        <div className="small-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breaks.slice(0, 5).map(b => (
                                        <tr key={b.id}>
                                            <td>{b.date}</td>
                                            <td>{new Date(b.break_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{b.break_end ? new Date(b.break_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td>{b.break_duration ? `${b.break_duration.toFixed(0)}m` : '-'}</td>
                                        </tr>
                                    ))}
                                    {breaks.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No break records</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="history-block">
                        <div className="block-header">
                            <CalendarDays size={20} /> <h3>Leave History</h3>
                        </div>
                        <div className="small-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.slice(0, 5).map(l => (
                                        <tr key={l.id}>
                                            <td>{l.leave_type}</td>
                                            <td>{l.start_date} to {l.end_date}</td>
                                            <td>
                                                <span className={`badge badge-${l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {leaves.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No leave applications</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="history-block">
                        <div className="block-header">
                            <Video size={20} /> <h3>Meetings Log</h3>
                        </div>
                        <div className="small-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Date</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meetings.slice(0, 5).map(m => (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 'bold' }}>{m.title}</td>
                                            <td>{format(new Date(m.meeting_date), 'MMM d, p')}</td>
                                            <td>{m.duration}m</td>
                                        </tr>
                                    ))}
                                    {meetings.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No meetings logged</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                .protocol-details { padding: 1rem; }
                .details-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 2rem; }
                .detail-card { background: white; border-radius: 12px; box-shadow: var(--shadow); padding: 2rem; }
                .profile-header { text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
                .profile-avatar { width: 80px; height: 80px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
                .profile-info { display: flex; flex-direction: column; gap: 1rem; }
                .info-item { display: flex; alignItems: center; gap: 0.75rem; color: var(--text-secondary); }
                .history-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .history-block { background: white; border-radius: 12px; box-shadow: var(--shadow); padding: 1.5rem; }
                .block-header { display: flex; alignItems: center; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
                .small-table-container table { font-size: 0.85rem; }
                @media (max-width: 1200px) {
                    .details-grid { grid-template-columns: 1fr; }
                    .history-sections { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default EmployeeDetails;
