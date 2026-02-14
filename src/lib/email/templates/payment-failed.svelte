<script lang="ts">
	export let userName: string;
	export let billingUrl: string = '/dashboard/billing';
</script>

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Payment Failed</title>
	</head>
	<body
		style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"
	>
		<div
			style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;"
		>
			<h1 style="margin: 0 0 20px 0; font-size: 24px; color: #dc3545;">Payment Failed</h1>
			<p style="margin: 0 0 15px 0; font-size: 16px;">Hi {userName},</p>
			<p style="margin: 0 0 15px 0; font-size: 16px;">
				We were unable to process your recent payment for Rachel Cloud. This may happen due to
				insufficient funds, an expired card, or other payment issues.
			</p>
			<p style="margin: 0 0 20px 0; font-size: 16px;">
				To avoid service interruption, please update your payment method as soon as possible.
			</p>
			<div style="text-align: center; margin: 30px 0;">
				<a
					href={billingUrl}
					style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;"
				>
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
