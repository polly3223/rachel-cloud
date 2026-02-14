/**
 * Email notification functions for health monitoring events.
 *
 * Sends user-facing emails on instance state transitions (down, recovered)
 * and admin alerts when a circuit breaker trips. All functions follow the
 * same pattern as sender.ts: HTML email via Resend, boolean return, never throws.
 *
 * @module health-notifications
 */

import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getResend(): Resend {
	return new Resend(process.env.RESEND_API_KEY);
}

function getFromEmail(): string {
	return process.env.RESEND_FROM_EMAIL || 'Rachel Cloud <noreply@get-rachel.com>';
}

function getBaseUrl(): string {
	return process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Notify a user that their Rachel instance was detected as down.
 * Called on the first failure detection (after auto-restart fails), NOT on every check.
 *
 * @param userEmail - The user's email address
 * @param userName - The user's display name (for personalization)
 * @returns true if the email was sent successfully, false otherwise
 */
export async function sendInstanceDownEmail(
	userEmail: string,
	userName: string
): Promise<boolean> {
	try {
		const resend = getResend();
		const fromEmail = getFromEmail();
		const baseUrl = getBaseUrl();

		await resend.emails.send({
			from: fromEmail,
			to: userEmail,
			subject: 'Rachel Instance Down - Auto-Recovery in Progress',
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Instance Down</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
							<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #dc3545;">Rachel Instance Down</h1>
							<p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${userName},</p>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								We detected that your Rachel instance is currently down. Our system has already attempted an automatic restart, but the service did not come back up.
							</p>
							<div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0; font-weight: 600; color: #721c24;">Auto-recovery is in progress</p>
								<p style="margin: 5px 0 0 0; font-size: 14px; color: #721c24;">
									We will continue attempting to restore your service. You will receive another email when your instance is back online.
								</p>
							</div>
							<p style="margin: 0 0 20px 0; font-size: 16px;">
								You can check the current status of your instance on your dashboard.
							</p>
							<div style="text-align: center; margin: 30px 0;">
								<a href="${baseUrl}/dashboard"
									 style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
									View Dashboard
								</a>
							</div>
							<p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d;">
								If you need immediate assistance, please reply to this email.
							</p>
						</div>
						<div style="text-align: center; font-size: 12px; color: #6c757d;">
							<p>Rachel Cloud - AI-powered cloud infrastructure</p>
						</div>
					</body>
				</html>
			`
		});

		console.log(`[health-notifications] Instance down email sent to ${userEmail}`);
		return true;
	} catch (error) {
		console.error(`[health-notifications] Failed to send instance down email to ${userEmail}:`, error);
		return false;
	}
}

/**
 * Notify a user that their Rachel instance has recovered from an unhealthy state.
 * Called when status transitions from unhealthy/down/circuit_open back to healthy.
 *
 * @param userEmail - The user's email address
 * @param userName - The user's display name (for personalization)
 * @param downtimeMinutes - Approximate downtime duration in minutes
 * @returns true if the email was sent successfully, false otherwise
 */
export async function sendInstanceRecoveredEmail(
	userEmail: string,
	userName: string,
	downtimeMinutes: number
): Promise<boolean> {
	try {
		const resend = getResend();
		const fromEmail = getFromEmail();
		const baseUrl = getBaseUrl();

		const downtimeText =
			downtimeMinutes < 1
				? 'less than a minute'
				: downtimeMinutes === 1
					? '1 minute'
					: `${downtimeMinutes} minutes`;

		await resend.emails.send({
			from: fromEmail,
			to: userEmail,
			subject: 'Rachel Instance Recovered',
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Instance Recovered</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
							<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #28a745;">Instance Recovered</h1>
							<p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${userName},</p>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								Great news! Your Rachel instance is back online and running normally.
							</p>
							<div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0; font-weight: 600; color: #155724;">Service restored</p>
								<p style="margin: 5px 0 0 0; font-size: 14px; color: #155724;">
									Approximate downtime: ${downtimeText}
								</p>
							</div>
							<p style="margin: 0 0 20px 0; font-size: 16px;">
								Your Telegram bot and all services should be fully operational. No action is needed on your part.
							</p>
							<div style="text-align: center; margin: 30px 0;">
								<a href="${baseUrl}/dashboard"
									 style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
									View Dashboard
								</a>
							</div>
						</div>
						<div style="text-align: center; font-size: 12px; color: #6c757d;">
							<p>Rachel Cloud - AI-powered cloud infrastructure</p>
						</div>
					</body>
				</html>
			`
		});

		console.log(`[health-notifications] Instance recovered email sent to ${userEmail}`);
		return true;
	} catch (error) {
		console.error(`[health-notifications] Failed to send instance recovered email to ${userEmail}:`, error);
		return false;
	}
}

/**
 * Alert the admin when a circuit breaker trips for a user's VPS.
 * Called when consecutiveFailures reaches 3 and the circuit transitions to open.
 *
 * @param adminEmail - The admin's email address (from ADMIN_EMAIL env var)
 * @param userId - The affected user's ID
 * @param userEmail - The affected user's email address
 * @param vpsIp - The VPS IP address
 * @param consecutiveFailures - Number of consecutive failures
 * @param lastError - The most recent error message
 * @returns true if the email was sent successfully, false otherwise
 */
export async function sendCircuitBreakerAlert(
	adminEmail: string,
	userId: string,
	userEmail: string,
	vpsIp: string,
	consecutiveFailures: number,
	lastError: string
): Promise<boolean> {
	try {
		const resend = getResend();
		const fromEmail = getFromEmail();
		const timestamp = new Date().toISOString();

		await resend.emails.send({
			from: fromEmail,
			to: adminEmail,
			subject: `[ADMIN ALERT] Circuit Breaker Tripped for ${userEmail}`,
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Circuit Breaker Alert</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
							<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #dc3545;">Circuit Breaker Tripped</h1>
							<p style="margin: 0 0 15px 0; font-size: 16px;">
								Auto-recovery has failed ${consecutiveFailures} consecutive times for a user's VPS. Manual investigation is required.
							</p>
							<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
								<tr style="border-bottom: 1px solid #dee2e6;">
									<td style="padding: 10px; font-weight: 600; color: #495057;">User ID</td>
									<td style="padding: 10px;">${userId}</td>
								</tr>
								<tr style="border-bottom: 1px solid #dee2e6;">
									<td style="padding: 10px; font-weight: 600; color: #495057;">User Email</td>
									<td style="padding: 10px;">${userEmail}</td>
								</tr>
								<tr style="border-bottom: 1px solid #dee2e6;">
									<td style="padding: 10px; font-weight: 600; color: #495057;">VPS IP</td>
									<td style="padding: 10px;">${vpsIp}</td>
								</tr>
								<tr style="border-bottom: 1px solid #dee2e6;">
									<td style="padding: 10px; font-weight: 600; color: #495057;">Consecutive Failures</td>
									<td style="padding: 10px; color: #dc3545; font-weight: 600;">${consecutiveFailures}</td>
								</tr>
								<tr style="border-bottom: 1px solid #dee2e6;">
									<td style="padding: 10px; font-weight: 600; color: #495057;">Last Error</td>
									<td style="padding: 10px; font-family: monospace; font-size: 13px;">${lastError}</td>
								</tr>
								<tr>
									<td style="padding: 10px; font-weight: 600; color: #495057;">Timestamp</td>
									<td style="padding: 10px;">${timestamp}</td>
								</tr>
							</table>
							<div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0; font-weight: 600; color: #721c24;">Action Required</p>
								<p style="margin: 5px 0 0 0; font-size: 14px; color: #721c24;">
									The circuit breaker has stopped automatic restart attempts. SSH into the VPS to investigate, or check the Hetzner console. The circuit breaker will automatically reset after 30 minutes and retry.
								</p>
							</div>
						</div>
						<div style="text-align: center; font-size: 12px; color: #6c757d;">
							<p>Rachel Cloud Admin Alert</p>
						</div>
					</body>
				</html>
			`
		});

		console.log(`[health-notifications] Circuit breaker alert sent to admin for user ${userEmail}`);
		return true;
	} catch (error) {
		console.error(`[health-notifications] Failed to send circuit breaker alert for user ${userEmail}:`, error);
		return false;
	}
}
