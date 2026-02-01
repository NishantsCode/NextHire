import nodemailer from 'nodemailer';

// Create transporter - supports both Gmail (local) and Resend (production)
const createTransporter = () => {
  // Option 1: Use Resend (recommended for production - works on all hosting platforms)
  if (process.env.RESEND_API_KEY) {
    console.log('📧 Creating email transporter with Resend API');
    return nodemailer.createTransporter({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Option 2: Use Gmail (for local development only - may not work in production)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing');
    console.error('For production: Set RESEND_API_KEY');
    console.error('For local dev: Set EMAIL_USER and EMAIL_PASSWORD');
    throw new Error('Email service not configured properly');
  }

  console.log('📧 Creating email transporter with Gmail');
  console.log('⚠️  Note: Gmail may not work in production due to SMTP port blocking');
  console.log('⚠️  For production, use Resend: https://resend.com');

  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
  });
};

// Email templates
const getApplicationConfirmationEmail = (applicantName, jobTitle, companyName) => {
  return {
    subject: `Application Received - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Received! ✓</h1>
          </div>
          <div class="content">
            <p>Dear ${applicantName},</p>
            
            <p>Thank you for applying to the position at <strong>${companyName}</strong>!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #10b981;">Position Applied For:</h3>
              <p style="font-size: 18px; margin: 0;"><strong>${jobTitle}</strong></p>
            </div>
            
            <p>We have successfully received your application and our hiring team will review it shortly.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will review your application</li>
              <li>You'll receive email updates as your application status changes</li>
              <li>If shortlisted, we'll contact you for the next steps</li>
            </ul>
            
            <p>You can track your application status anytime by logging into your NextHire account.</p>
            
            <p>Best of luck!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>NextHire Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getStatusUpdateEmail = (applicantName, jobTitle, companyName, newStatus) => {
  const statusConfig = {
    reviewed: {
      emoji: '👀',
      title: 'Application Under Review',
      message: 'Great news! Your application is currently being reviewed by our hiring team.',
      color: '#06b6d4',
    },
    shortlisted: {
      emoji: '🎉',
      title: 'Congratulations! You\'ve Been Shortlisted',
      message: 'Excellent news! You have been shortlisted for the next round. Our team will contact you soon with further details.',
      color: '#10b981',
    },
    rejected: {
      emoji: '📋',
      title: 'Application Status Update',
      message: 'Thank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for other opportunities that match your skills.',
      color: '#64748b',
    },
    pending: {
      emoji: '⏳',
      title: 'Application Pending Review',
      message: 'Your application is in queue and will be reviewed by our hiring team soon.',
      color: '#f59e0b',
    },
  };

  const config = statusConfig[newStatus] || statusConfig.pending;

  return {
    subject: `${config.title} - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${config.color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 10px 20px; background: ${config.color}; color: white; border-radius: 20px; font-weight: bold; text-transform: capitalize; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid ${config.color}; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.emoji} ${config.title}</h1>
          </div>
          <div class="content">
            <p>Dear ${applicantName},</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: ${config.color};">Position:</h3>
              <p style="font-size: 18px; margin: 5px 0;"><strong>${jobTitle}</strong></p>
              <p style="margin: 0; color: #64748b;">${companyName}</p>
            </div>
            
            <p><strong>Status Update:</strong></p>
            <div style="text-align: center;">
              <span class="status-badge">${newStatus}</span>
            </div>
            
            <p>${config.message}</p>
            
            ${newStatus === 'shortlisted' ? '<p><strong>Next Steps:</strong> Please keep an eye on your email and phone for communication from our hiring team.</p>' : ''}
            
            ${newStatus === 'rejected' ? '<p>We appreciate the time you invested in the application process and wish you the best in your job search.</p>' : ''}
            
            <p>You can view your complete application history by logging into your NextHire account.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${companyName}</strong><br>
              <em>via NextHire</em>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Send application confirmation email
export const sendApplicationConfirmationEmail = async (applicantEmail, applicantName, jobTitle, companyName) => {
  try {
    console.log(`📧 Attempting to send application confirmation email to ${applicantEmail}`);
    console.log(`📧 Email provider: ${process.env.RESEND_API_KEY ? 'Resend' : 'Gmail'}`);
    
    const transporter = createTransporter();
    const emailContent = getApplicationConfirmationEmail(applicantName, jobTitle, companyName);

    // Determine from email based on provider
    const fromEmail = process.env.RESEND_API_KEY 
      ? (process.env.EMAIL_FROM || 'onboarding@resend.dev')
      : process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"NextHire" <${fromEmail}>`,
      to: applicantEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`✅ Application confirmation email sent to ${applicantEmail}`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending application confirmation email:', {
      to: applicantEmail,
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (applicantEmail, applicantName, jobTitle, companyName, newStatus) => {
  try {
    console.log(`📧 Attempting to send status update email to ${applicantEmail} - Status: ${newStatus}`);
    console.log(`📧 Email provider: ${process.env.RESEND_API_KEY ? 'Resend' : 'Gmail'}`);
    
    const transporter = createTransporter();
    const emailContent = getStatusUpdateEmail(applicantName, jobTitle, companyName, newStatus);

    // Determine from email based on provider
    const fromEmail = process.env.RESEND_API_KEY 
      ? (process.env.EMAIL_FROM || 'onboarding@resend.dev')
      : process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"NextHire" <${fromEmail}>`,
      to: applicantEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`✅ Status update email sent to ${applicantEmail} - Status: ${newStatus}`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending status update email:', {
      to: applicantEmail,
      status: newStatus,
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, error: error.message };
  }
};
