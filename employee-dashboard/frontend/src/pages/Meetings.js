import React, { useState, useEffect } from 'react';
import { Plus, X, Video } from 'lucide-react';
import { meetingAPI } from '../api/api';
import { format } from 'date-fns';

const Meetings = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';

    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meeting_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duration: 30
    });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = role === 'Employee' ? await meetingAPI.getMy() : await meetingAPI.getAll();
            setMeetings(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await meetingAPI.log(formData);
            fetchMeetings();
            setShowModal(false);
            setFormData({
                title: '',
                description: '',
                meeting_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                duration: 30
            });
        } catch (err) {
            alert('Failed to log meeting');
        }
    };

    if (loading) return <div>Loading meetings...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>{role === 'Employee' ? 'My Meetings' : 'Corporate Meetings'}</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Log Meeting
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {role !== 'Employee' && <th>Employee</th>}
                            <th>Title</th>
                            <th>Date & Time</th>
                            <th>Duration</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.map((m) => (
                            <tr key={m.id}>
                                {role !== 'Employee' && <td>{m.employee_name}</td>}
                                <td style={{ fontWeight: 'bold' }}>{m.title}</td>
                                <td>{format(new Date(m.meeting_date), 'PPP p')}</td>
                                <td>{m.duration} mins</td>
                                <td>{m.description || '-'}</td>
                            </tr>
                        ))}
                        {meetings.length === 0 && (
                            <tr>
                                <td colSpan={role === 'Employee' ? 4 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No meetings logged yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Log New Meeting</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Meeting Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                                    placeholder="e.g. Daily Standup"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="2"
                                />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={formData.meeting_date} 
                                        onChange={(e) => setFormData({...formData, meeting_date: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label>Duration (mins)</label>
                                    <input 
                                        type="number" 
                                        value={formData.duration} 
                                        onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Log Meeting
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
                .modal-content { background: white; width: 450px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; }
                .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; }
            `}</style>
        </div>
    );
};

export default Meetings;
