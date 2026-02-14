import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a payment failed email notification to the user.
 * Includes a link to update their payment method in the billing dashboard.
 *
 * @param userEmail - The user's email address
 * @param userName - The user's name (for personalization)
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendPaymentFailedEmail(
	userEmail: string,
	userName: string
): Promise<boolean> {
	try {
		const fromEmail = process.env.RESEND_FROM_EMAIL || 'Rachel Cloud <noreply@rachel.cloud>';
		const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

		await resend.emails.send({
			from: fromEmail,
			to: userEmail,
			subject: 'Payment Failed - Update Your Payment Method',
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Payment Failed</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
							<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #dc3545;">Payment Failed</h1>
							<p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${userName},</p>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								We were unable to process your recent payment for Rachel Cloud. This may happen due to insufficient funds, an expired card, or other payment issues.
							</p>
							<p style="margin: 0 0 20px 0; font-size: 16px;">
								To avoid service interruption, please update your payment method as soon as possible.
							</p>
							<div style="text-align: center; margin: 30px 0;">
								<a href="${baseUrl}/dashboard/billing"
									 style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
									Update Payment Method
								</a>
							</div>
							<p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d;">
								If you believe this is an error or need assistance, please reply to this email.
							</p>
						</div>
						<div style="text-align: center; font-size: 12px; color: #6c757d;">
							<p>Rachel Cloud - AI-powered cloud infrastructure</p>
							<p>You're receiving this email because your payment failed.</p>
						</div>
					</body>
				</html>
			`
		});

		console.log(`Payment failed email sent to ${userEmail}`);
		return true;
	} catch (error) {
		console.error('Failed to send payment failed email:', error);
		// Don't throw - email failure shouldn't break webhook processing
		return false;
	}
}

/**
 * Send a subscription canceled email notification to the user.
 * Informs them about the grace period and data retention policy.
 *
 * @param userEmail - The user's email address
 * @param userName - The user's name (for personalization)
 * @param gracePeriodEnd - When the grace period ends
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendSubscriptionCanceledEmail(
	userEmail: string,
	userName: string,
	gracePeriodEnd: Date
): Promise<boolean> {
	try {
		const fromEmail = process.env.RESEND_FROM_EMAIL || 'Rachel Cloud <noreply@rachel.cloud>';
		const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

		await resend.emails.send({
			from: fromEmail,
			to: userEmail,
			subject: 'Subscription Canceled - 3-Day Grace Period',
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Subscription Canceled</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
							<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #ffc107;">Subscription Canceled</h1>
							<p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${userName},</p>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								Your Rachel Cloud subscription has been canceled. You have a 3-day grace period before your VPS is deprovisioned.
							</p>
							<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0; font-weight: 600;">Grace Period Ends:</p>
								<p style="margin: 5px 0 0 0; font-size: 18px; color: #856404;">${gracePeriodEnd.toLocaleString()}</p>
							</div>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								During this time, your VPS will remain active. To keep your service, reactivate your subscription before the grace period ends.
							</p>
							<div style="text-align: center; margin: 30px 0;">
								<a href="${baseUrl}/dashboard/billing"
									 style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
									Reactivate Subscription
								</a>
							</div>
							<p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d;">
								If you have any questions, please reply to this email.
							</p>
						</div>
						<div style="text-align: center; font-size: 12px; color: #6c757d;">
							<p>Rachel Cloud - AI-powered cloud infrastructure</p>
						</div>
					</body>
				</html>
			`
		});

		console.log(`Subscription canceled email sent to ${userEmail}`);
		return true;
	} catch (error) {
		console.error('Failed to send subscription canceled email:', error);
		// Don't throw - email failure shouldn't break webhook processing
		return false;
	}
}
