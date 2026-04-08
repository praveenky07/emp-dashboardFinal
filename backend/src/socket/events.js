// Centralized socket event emitters for EMP PRO Dashboard

const emitEvent = (io, eventName, payload) => {
    if (io) io.emit(eventName, payload);
};

// ATTENDANCE
const emitAttendanceStarted = (io, payload) => emitEvent(io, 'attendanceStarted', payload);
const emitAttendanceEnded = (io, payload) => emitEvent(io, 'attendanceEnded', payload);
const emitAttendanceUpdated = (io, payload) => emitEvent(io, 'attendanceUpdated', payload);

// LEAVE
const emitLeaveRequested = (io, payload) => emitEvent(io, 'leaveRequested', payload);
const emitLeaveApproved = (io, payload) => emitEvent(io, 'leaveApproved', payload);
const emitLeaveRejected = (io, payload) => emitEvent(io, 'leaveRejected', payload);

// MEETINGS
const emitMeetingCreated = (io, payload) => emitEvent(io, 'meetingCreated', payload);
const emitMeetingJoined = (io, payload) => emitEvent(io, 'meetingJoined', payload);
const emitMeetingStarted = (io, payload) => emitEvent(io, 'meetingStarted', payload);
const emitMeetingEnded = (io, payload) => emitEvent(io, 'meetingEnded', payload);
const emitMeetingUpdated = (io, payload) => emitEvent(io, 'meetingUpdated', payload);

// ADMIN & USERS
const emitUserCreated = (io, payload) => emitEvent(io, 'userCreated', payload);
const emitUserDeleted = (io, payload) => emitEvent(io, 'userDeleted', payload);
const emitStatsUpdated = (io, payload) => emitEvent(io, 'statsUpdated', payload);
const emitActiveUsersUpdated = (io, payload) => emitEvent(io, 'activeUsersUpdated', payload);

// PERFORMANCE
const emitReviewSubmitted = (io, payload) => emitEvent(io, 'reviewSubmitted', payload);

module.exports = {
    emitAttendanceStarted,
    emitAttendanceEnded,
    emitAttendanceUpdated,
    emitLeaveRequested,
    emitLeaveApproved,
    emitLeaveRejected,
    emitMeetingCreated,
    emitMeetingJoined,
    emitMeetingStarted,
    emitMeetingEnded,
    emitMeetingUpdated,
    emitUserCreated,
    emitUserDeleted,
    emitStatsUpdated,
    emitActiveUsersUpdated,
    emitReviewSubmitted
};

