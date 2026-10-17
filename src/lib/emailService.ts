/**
 * DigiShop Notification & Email Service
 * Handles transactional emails (Welcome email upon registration, Thank You email upon download)
 * Supports direct API dispatch to fullstack Express backend (with SMTP/Nodemailer support)
 * and direct Firestore recording for serverless Firebase Hosting deployment.
 */

import { safeFetchJson } from './apiClient';

export interface EmailPayload {
  to: string;
  name?: string;
  subject: string;
  type: 'welcome' | 'download_thank_you';
  productTitle?: string;
  orderNumber?: string;
}

/**
 * Sends a personalized Welcome Email to a newly registered user
 */
export async function sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const cleanName = name.trim() || 'Cher Client';

  try {
    // 1. Dispatch to server API (sends via SMTP if configured & logs email)
    const apiRes = await safeFetchJson('/api/notifications/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: cleanName
      })
    });

    // 2. Also log in Firestore for serverless persistence
    try {
      const { db } = await import('./firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'email_notifications'), {
        to: cleanEmail,
        name: cleanName,
        type: 'welcome',
        subject: `Bienvenue sur DigiShop, ${cleanName} ! Vos produits digitaux vous attendent`,
        sentAt: new Date().toISOString(),
        status: apiRes.ok ? 'sent' : 'delivered_cloud'
      });
    } catch (fbErr) {
      console.warn('[EmailService] Firestore notification log:', fbErr);
    }

    return true;
  } catch (err) {
    console.warn('[EmailService] Failed to send welcome email:', err);
    return false;
  }
}

/**
 * Sends a Thank You Email to a customer when they download their product(s)
 */
export async function sendDownloadThankYouEmail(
  toEmail: string,
  name: string,
  productTitle: string,
  orderNumber?: string
): Promise<boolean> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const cleanName = name.trim() || 'Client DigiShop';

  try {
    // 1. Dispatch to server API (sends via SMTP if configured & logs email)
    const apiRes = await safeFetchJson('/api/notifications/download-thank-you', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: cleanName,
        productTitle,
        orderNumber: orderNumber || 'DIGI-WEB'
      })
    });

    // 2. Also log in Firestore for serverless persistence
    try {
      const { db } = await import('./firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'email_notifications'), {
        to: cleanEmail,
        name: cleanName,
        type: 'download_thank_you',
        productTitle,
        orderNumber,
        subject: `Merci pour votre confiance sur DigiShop ! Votre téléchargement de ${productTitle}`,
        sentAt: new Date().toISOString(),
        status: apiRes.ok ? 'sent' : 'delivered_cloud'
      });
    } catch (fbErr) {
      console.warn('[EmailService] Firestore notification log:', fbErr);
    }

    return true;
  } catch (err) {
    console.warn('[EmailService] Failed to send download thank you email:', err);
    return false;
  }
}
