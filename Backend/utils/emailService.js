import { createTransport } from 'nodemailer';
import { Resend } from 'resend';

// Determine which email provider to use
const getEmailProvider = () => {
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return 'gmail';
  }
  return null;
};

// Create Resend client
const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Email configuration missing: RESEND_API_KEY not set');
    throw new Error('Resend API key not configured');
  }

  console.log('📧 Creating Resend email client');
  console.log('📧 Email From:', process.env.EMAIL_FROM || 'onboarding@resend.dev');
  
  return new Resend(process.env.RESEND_API_KEY);
};

// Create transporter with Gmail (fallback for local development)
const createGmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
    throw new Error('Gmail credentials not configured');
  }

  console.log('📧 Creating Gmail transporter');
  console.log('📧 Email User:', process.env.EMAIL_USER);

  return createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
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
    
    const provider = getEmailProvider();
    
    if (!provider) {
      throw new Error('No email provider configured. Set either RESEND_API_KEY or EMAIL_USER/EMAIL_PASSWORD');
    }

    console.log(`📧 Email provider: ${provider === 'resend' ? 'Resend' : 'Gmail'}`);
    
    const emailContent = getApplicationConfirmationEmail(applicantName, jobTitle, companyName);

    let info;
    
    if (provider === 'resend') {
      // Use Resend
      const resend = createResendClient();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'NextHire <onboarding@resend.dev>',
        to: applicantEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      
      info = { messageId: result.data?.id || result.id };
      console.log(`✅ Application confirmation email sent successfully via Resend!`);
    } else {
      // Use Gmail
      const transporter = createGmailTransporter();
      info = await transporter.sendMail({
        from: `"NextHire" <${process.env.EMAIL_USER}>`,
        to: applicantEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      console.log(`✅ Application confirmation email sent successfully via Gmail!`);
    }

    console.log(`✅ Message ID: ${info.messageId}`);
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
    
    const provider = getEmailProvider();
    
    if (!provider) {
      throw new Error('No email provider configured. Set either RESEND_API_KEY or EMAIL_USER/EMAIL_PASSWORD');
    }

    console.log(`📧 Email provider: ${provider === 'resend' ? 'Resend' : 'Gmail'}`);
    
    const emailContent = getStatusUpdateEmail(applicantName, jobTitle, companyName, newStatus);

    let info;
    
    if (provider === 'resend') {
      // Use Resend
      const resend = createResendClient();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'NextHire <onboarding@resend.dev>',
        to: applicantEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      
      info = { messageId: result.data?.id || result.id };
      console.log(`✅ Status update email sent successfully via Resend!`);
    } else {
      // Use Gmail
      const transporter = createGmailTransporter();
      info = await transporter.sendMail({
        from: `"NextHire" <${process.env.EMAIL_USER}>`,
        to: applicantEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      console.log(`✅ Status update email sent successfully via Gmail!`);
    }

    console.log(`✅ Message ID: ${info.messageId}`);
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
