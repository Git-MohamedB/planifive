import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const matchId = resolvedParams.id;

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { date, location, scoreTeam1, scoreTeam2, team1Names, team2Names } = body;

        // First disconnect all existing players
        await prisma.match.update({
            where: { id: matchId },
            data: {
                team1: { set: [] },
                team2: { set: [] },
            },
        });

        // S'assurer que team1Names et team2Names sont des tableaux de strings
        const team1NamesArray = Array.isArray(team1Names) 
            ? team1Names.filter((name: any) => typeof name === 'string' && name.trim() !== '')
            : [];
        const team2NamesArray = Array.isArray(team2Names)
            ? team2Names.filter((name: any) => typeof name === 'string' && name.trim() !== '')
            : [];

        // Then update the match with new data
        const match = await prisma.match.update({
            where: { id: matchId },
            data: {
                date: new Date(date),
                location: location || null,
                scoreTeam1: parseInt(scoreTeam1) || 0,
                scoreTeam2: parseInt(scoreTeam2) || 0,
                team1Names: JSON.stringify(team1NamesArray),
                team2Names: JSON.stringify(team2NamesArray),
            },
        });

        return NextResponse.json({
            ...match,
            team1Names: JSON.parse(match.team1Names || '[]'),
            team2Names: JSON.parse(match.team2Names || '[]'),
            team1: [],
            team2: [],
        });
    } catch (error: any) {
        console.error("Error updating match:", error);
        
        // Gérer le cas où le match n'existe pas
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            error: 'Error updating match',
            message: error?.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const matchId = resolvedParams.id;

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
        }

        await prisma.match.delete({
            where: { id: matchId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting match:", error);
        
        // Gérer le cas où le match n'existe pas
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            error: 'Error deleting match',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
