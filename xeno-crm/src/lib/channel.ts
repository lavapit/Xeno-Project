export async function sendToChannelService(messageId: string, recipient: string, message: string, channel: string) {
  const channelUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';
  const crmUrl = process.env.CRM_URL || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${channelUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId,
        recipient,
        message,
        channel,
        callbackUrl: `${crmUrl}/api/receipt`
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Channel service returned error (${res.status}): ${text}`);
      return { success: false, error: text };
    }

    return { success: true, data: await res.json() };
  } catch (error: any) {
    console.error(`Failed to connect to channel service: ${error.message}`);
    return { success: false, error: error.message };
  }
}
