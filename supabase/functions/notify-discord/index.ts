import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const payload = await req.json()
        const { record, type, table, schema } = payload

        // Only process INSERT events on public.Users for now
        if (type !== 'INSERT' || table !== 'Users' || schema !== 'public') {
            return new Response('Ignored event type', { status: 200 })
        }

        if (!DISCORD_WEBHOOK_URL) {
            console.error('DISCORD_WEBHOOK_URL is not set')
            return new Response('Configuration Error', { status: 500 })
        }

        const { email, id, created_at, google_id } = record
        const name = email.split('@')[0]

        const message = {
            embeds: [
                {
                    title: "🎉 New User Signup!",
                    description: `**${name}** just joined the platform`,
                    color: 5763719, // green
                    fields: [
                        {
                            name: "📧 Email",
                            value: `\`${email}\``,
                            inline: true
                        },
                        {
                            name: "👤 Username",
                            value: `\`${name}\``,
                            inline: true
                        },
                        {
                            name: "🔢 User ID",
                            value: `\`${id}\``,
                            inline: true
                        },
                        {
                            name: "🔗 Google ID",
                            value: google_id ? `\`${google_id}\`` : '`Not set`',
                            inline: true
                        },
                    ],
                    footer: {
                        text: "User Registration System"
                    },
                    timestamp: new Date(created_at).toISOString()
                }
            ]
        }

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Failed to send Discord notification:', response.status, errorText)
            return new Response('Failed to send notification', { status: 500 })
        }

        return new Response('Notification sent', { status: 200 })

    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
})
