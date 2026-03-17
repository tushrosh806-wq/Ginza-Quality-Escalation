import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Nodemailer transporter using provided SMTP credentials
const transporter = process.env.SMTP_USER && process.env.SMTP_PASS ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Supabase Database Webhook Handler
  app.post('/api/notify-unit-head', async (req, res) => {
    console.log('--- NOTIFICATION REQUEST RECEIVED ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    // Supabase Webhook sends data in a specific format: { record: { ... }, type: 'INSERT', ... }
    const payload = req.body.record ? req.body.record : req.body;
    
    const unit = payload.unit;
    const title = payload.title;
    const description = payload.description;
    const reporterName = payload.reporter_name || payload.reporterName;
    const reporterEmail = payload.reporter_email || payload.reporterEmail;
    const caseId = payload.case_id || payload.caseId;
    const photoUrls = payload.photoUrls || (payload.photo_url ? payload.photo_url.split(',') : []);

    console.log('Normalized Data:', { unit, title, reporterName, reporterEmail, caseId, photoCount: photoUrls.length });

    if (!transporter) {
      console.error('CRITICAL: Transporter not initialized. Check SMTP_USER and SMTP_PASS secrets.');
      console.log('SMTP_USER exists:', !!process.env.SMTP_USER);
      console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
      return res.status(500).json({ error: 'Email service not configured on server' });
    }

    try {
      // 1. Find Unit Heads for this unit from profiles table
      console.log(`Searching for Unit Heads for unit: "${unit}"...`);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email, unit, role')
        .eq('role', 'Unit Head');

      if (profileError) {
        console.error('Database Error fetching profiles:', profileError);
        throw profileError;
      }

      console.log(`Found ${profiles?.length || 0} total Unit Heads in database.`);

      const targetUnitHeads = (profiles || []).filter(p => {
        const assignedUnits = (p.unit || '').split(',').map((u: string) => u.trim());
        const match = assignedUnits.includes(unit);
        if (match) console.log(`Match found: ${p.email} is assigned to ${unit}`);
        return match;
      });

      if (targetUnitHeads.length === 0) {
        console.warn(`No Unit Heads matched the unit: "${unit}"`);
        return res.json({ 
          success: false, 
          message: 'No unit heads found for this unit',
          debug: { unit, totalUnitHeads: profiles?.length }
        });
      }

    const emails = targetUnitHeads.map(p => p.email);
      
      // Always include Rohit Sethia in the 'To' list
      if (!emails.includes('rohit.sethia@ginzalimited.com')) {
        emails.push('rohit.sethia@ginzalimited.com');
      }
      
      console.log('Target Emails (To):', emails);

      // Branch Head Mapping
      const branchHeadMapping: Record<string, string> = {
        'amit.korgaonkar@ginzalimited.com': 'vishal.ambhore@ginzalimited.com',
        'shivginza123@gmail.com': 'sachin.bhosle@ginzalimited.com',
        'rajesh.jain@ginzalimited.com': 'vishal.ambhore@ginzalimited.com',
        'lalit.delhi@ginzalimited.com': 'vinay.chhajer@ginzalimited.com',
        'ahmedabad@ginzalimited.com': 'ahmedabad@ginzalimited.com',
        'ginzabala1985@gmail.com': 'murali.krishna@ginzalimited.com',
        'tps@ginzalimited.com': 'murali.krishna@ginzalimited.com, tirupur@ginzalimited.com',
        'anil.udhna@ginzalimted.com': 'piyush.baid@ginzalimited.com',
        'mahesh.chandeliya@ginzalimited.com': 'mahesh.chandeliya@ginzalimited.com'
      };

      const ccEmails: string[] = [];
      if (reporterEmail && branchHeadMapping[reporterEmail.toLowerCase()]) {
        ccEmails.push(branchHeadMapping[reporterEmail.toLowerCase()]);
        console.log(`CC added for Branch Head: ${branchHeadMapping[reporterEmail.toLowerCase()]}`);
      }

      // 2. Send emails using Nodemailer
      const mailOptions = {
        from: `"${reporterName}" <${process.env.SMTP_USER}>`,
        to: emails.join(', '),
        cc: ccEmails.join(', '),
        replyTo: reporterEmail,
        subject: `New Quality Escalation: ${caseId} - ${unit}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
            <h2 style="color: #000;">New Quality Escalation Raised</h2>
            <p>A new quality issue has been reported for your unit: <strong>${unit}</strong>.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Case ID:</strong> ${caseId}</p>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Reporter:</strong> ${reporterName} (${reporterEmail || 'N/A'})</p>
              <p><strong>Description:</strong></p>
              <p style="white-space: pre-wrap;">${description}</p>
              
              ${photoUrls.length > 0 ? `
                <p><strong>Defect Photos:</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                  ${photoUrls.map((url: string) => `
                    <img src="${url}" alt="Defect" style="width: 100%; max-width: 500px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #eee;" />
                  `).join('')}
                </div>
              ` : ''}
            </div>
            
            <p><strong>Note:</strong> You can reply directly to this email to contact the reporter.</p>
            <p>Please check the Escalation Center dashboard for more details.</p>
            
            <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
               style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               View Dashboard
            </a>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888;">This is an automated notification from Ginza Industries Ltd. Quality Escalation Center.</p>
          </div>
        `
      };

      console.log('Attempting to send email via SMTP...');
      const info = await transporter.sendMail(mailOptions);
      console.log('SUCCESS: Email sent. Message ID:', info.messageId);

      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('--- NOTIFICATION FAILED ---');
      console.error('Error Details:', err);
      res.status(500).json({ 
        error: 'Failed to process notification', 
        details: err.message,
        code: err.code 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
