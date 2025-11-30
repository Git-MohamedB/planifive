import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const matches = await prisma.match.findMany({
            orderBy: {
                date: 'desc',
            },
        });

        // Transformer les données pour inclure les noms personnalisés depuis les champs JSON
        const transformedMatches = matches.map(match => {
            let team1Names = [];
            let team2Names = [];

            try {
                team1Names = match.team1Names ? JSON.parse(match.team1Names) : [];
            } catch (e) {
                console.error('Error parsing team1Names for match', match.id, e);
                team1Names = [];
            }

            try {
                team2Names = match.team2Names ? JSON.parse(match.team2Names) : [];
            } catch (e) {
                console.error('Error parsing team2Names for match', match.id, e);
                team2Names = [];
            }

            return {
                ...match,
                team1: [], // Liste vide car on utilise les noms personnalisés
                team2: [], // Liste vide car on utilise les noms personnalisés
                team1Names,
                team2Names,
            };
        });

        return NextResponse.json(transformedMatches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        return NextResponse.json({ error: 'Error fetching matches' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const ADMIN_EMAILS = ["sheizeracc@gmail.com"];

        if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        console.log("POST /api/matches - Received body:", body);
        const { date, location, scoreTeam1, scoreTeam2, team1Names, team2Names } = body;

        // S'assurer que team1Names et team2Names sont des tableaux de strings
        const team1NamesArray = Array.isArray(team1Names)
            ? team1Names.filter((name: any) => typeof name === 'string' && name.trim() !== '')
            : [];
        const team2NamesArray = Array.isArray(team2Names)
            ? team2Names.filter((name: any) => typeof name === 'string' && name.trim() !== '')
            : [];

        console.log("Creating match with data:", {
            date: new Date(date),
            location,
            scoreTeam1: parseInt(scoreTeam1) || 0,
            scoreTeam2: parseInt(scoreTeam2) || 0,
            team1NamesArray,
            team2NamesArray,
        });

        const match = await prisma.match.create({
            data: {
                date: new Date(date),
                location: location || null,
                scoreTeam1: parseInt(scoreTeam1) || 0,
                scoreTeam2: parseInt(scoreTeam2) || 0,
                team1Names: JSON.stringify(team1NamesArray),
                team2Names: JSON.stringify(team2NamesArray),
                // Ne pas inclure team1 et team2 - elles seront vides par défaut
            },
        });

        // Send Discord Notification
        try {
            const { sendDiscordWebhook } = await import('@/lib/discord');
            const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

            await sendDiscordWebhook({
                title: "⚽ Nouveau Match Ajouté !",
                description: `Un match a été ajouté à l'historique.`,
                fields: [
                    { name: "📅 Date", value: formattedDate, inline: true },
                    { name: "📍 Lieu", value: location || "Non spécifié", inline: true },
                    { name: "🏆 Score", value: `${parseInt(scoreTeam1) || 0} - ${parseInt(scoreTeam2) || 0}`, inline: false },
                    { name: "🔵 Équipe 1", value: team1NamesArray.length > 0 ? team1NamesArray.join(", ") : "Aucun joueur", inline: false },
                    { name: "🔴 Équipe 2", value: team2NamesArray.length > 0 ? team2NamesArray.join(", ") : "Aucun joueur", inline: false },
                ],
                color: 0x5865F2, // Blurple
                url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/history`
            });
        } catch (discordError) {
            console.error("Failed to send Discord webhook:", discordError);
            // Don't fail the request if discord fails
        }

        const response = {
            ...match,
            team1Names: JSON.parse(match.team1Names || '[]'),
            team2Names: JSON.parse(match.team2Names || '[]'),
            team1: [],
            team2: [],
        };

        console.log("Match created successfully:", response.id);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Error creating match:", error);
        console.error("Error details:", {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack
        });

        // Message d'erreur plus détaillé
        let errorMessage = 'Erreur lors de la création du match';
        if (error?.message) {
            errorMessage = error.message;
        } else if (error?.code) {
            errorMessage = `Erreur Prisma (${error.code}): ${error.message || 'Erreur inconnue'}`;
        }

        return NextResponse.json({
            error: 'Error creating match',
            message: errorMessage,
            code: error?.code,
            details: process.env.NODE_ENV === 'development' ? {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
            } : undefined
        }, { status: 500 });
    }
}
