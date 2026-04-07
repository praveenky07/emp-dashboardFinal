/**
 * Email Service (Mock/Placeholder)
 * In a real-production app, you would configure Nodemailer with SMTP.
 */

exports.sendMeetingInvite = async (participantEmail, meetingDetails) => {
  console.log(`[EMAIL-MOCK] Sending meeting invite to: ${participantEmail}`);
  console.log(`[EMAIL-MOCK] Subject: Invitation - ${meetingDetails.purpose}`);
  console.log(`[EMAIL-MOCK] Body: Join our meeting at ${meetingDetails.videoLink}`);
  
  // Simulation of async operation
  return new Promise((resolve) => setTimeout(resolve, 500));
};
