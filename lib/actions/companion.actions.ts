
"use server"

import { auth } from "@clerk/nextjs/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
    try {
        const authSession = await auth();
        const { userId } = authSession;

        console.log('Auth session:', { userId, hasSession: !!authSession });

        if (!userId) {
            console.error('No userId found in auth session');
            throw new Error('Unauthorized - Please sign in first');
        }

        const { name, subject, topic, style, voice, duration } = formData;

        // Validate required fields
        if (!name || !subject || !topic || !style || !voice || !duration) {
            throw new Error('Missing required fields');
        }

        console.log('Creating companion for user:', userId);

        const result = await query(
            `INSERT INTO companions (name, subject, topic, style, voice, duration, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, subject, topic, style, voice, duration, author, created_at`,
            [name, subject, topic, style, voice, duration, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Failed to create companion');
        }

        revalidatePath('/companions');
        return result.rows[0];
    } catch (error) {
        console.error('Error in createCompanion:', error);
        throw error;
    }
}

export const getCompanions = async (subject?: string, page: number = 1, limit: number = 10) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const offset = (page - 1) * limit;
        let sqlQuery = 'SELECT * FROM companions WHERE author = $1';
        let params: any[] = [userId];
        let paramCount = 1;

        if (subject) {
            paramCount++;
            sqlQuery += ` AND subject = $${paramCount}`;
            params.push(subject);
        }

        sqlQuery += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
        params.push(limit, offset);

        const result = await query(sqlQuery, params);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

export const getCompanion = async (id: string) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const result = await query(
            'SELECT * FROM companions WHERE id = $1 AND author = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Companion not found');
        }

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const deleteCompanion = async (id: string) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const result = await query(
            'DELETE FROM companions WHERE id = $1 AND author = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Companion not found or unauthorized');
        }

        revalidatePath('/companions');
        return { message: 'Companion deleted successfully' };
    } catch (error) {
        throw error;
    }
}

export const updateCompanion = async (id: string, formData: CreateCompanion) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('Unauthorized');
        }

        const { name, subject, topic, style, voice, duration } = formData;

        const result = await query(
            `UPDATE companions 
             SET name = $1, subject = $2, topic = $3, style = $4, voice = $5, duration = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 AND author = $8
             RETURNING id, name, subject, topic, style, voice, duration, author, created_at, updated_at`,
            [name, subject, topic, style, voice, duration, id, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Companion not found or unauthorized');
        }

        revalidatePath('/companions');
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}