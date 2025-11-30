export async function sendDiscordWebhook(embed: any, content?: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("❌ DISCORD_WEBHOOK_URL is not defined");
        return;
    }

    try {
        const body: any = { embeds: [embed] };
        if (content) {
            body.content = content;
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error("❌ Failed to send Discord webhook:", await response.text());
        } else {
            console.log("✅ Discord webhook sent successfully");
        }
    } catch (error) {
        console.error("❌ Error sending Discord webhook:", error);
    }
}
