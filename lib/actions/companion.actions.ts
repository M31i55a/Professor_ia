
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

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions, userOnly: boolean = false) => {
    try {
        const offset = (page - 1) * limit;
        let sqlQuery = 'SELECT * FROM companions WHERE 1=1';
        let params: any[] = [];
        let paramCount = 0;

        // Filter by current user if requested
        if (userOnly) {
            const { userId } = await auth();
            if (!userId) {
                throw new Error('Unauthorized - Please sign in first');
            }
            paramCount++;
            sqlQuery += ` AND author = $${paramCount}`;
            params.push(userId);
        }

        // Filter by subject if provided
        if (subject) {
            paramCount++;
            sqlQuery += ` AND subject ILIKE $${paramCount}`;
            params.push(`%${subject}%`);
        }

        // Filter by topic or name if provided
        if (topic) {
            paramCount++;
            const topicParam = `%${topic}%`;
            sqlQuery += ` AND (topic ILIKE $${paramCount} OR name ILIKE $${paramCount})`;
            params.push(topicParam);
        }

        // Add pagination
        paramCount++;
        sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        sqlQuery += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await query(sqlQuery, params);
        return result.rows;
    } catch (error) {
        console.error('Error in getAllCompanions:', error);
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

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();

    if (!userId) throw new Error('Unauthorized');

    const result = await query(
        `INSERT INTO session_history (companion_id, user_id)
         VALUES ($1, $2)
         RETURNING id`,
        [companionId, userId]
    );

    return result.rows[0];
}

export const getMyRecentSessions = async (limit = 5) => {
    const { userId } = await auth();
    if (!userId) return [];

    const result = await query(
        `SELECT DISTINCT ON (sh.companion_id) c.*
         FROM session_history sh
         JOIN companions c ON c.id = sh.companion_id
         WHERE sh.user_id = $1
         ORDER BY sh.companion_id, sh.created_at DESC`,
        [userId]
    );

    // Re-sort by most recent session and limit
    const sorted = result.rows
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

    return sorted;
}

export const getRecentSessions = async (limit = 10) => {
    const result = await query(
        `SELECT c.* FROM session_history sh
         JOIN companions c ON c.id = sh.companion_id
         ORDER BY sh.created_at DESC
         LIMIT $1`,
        [limit]
    );

    return result.rows;
}

export const getPopularCompanions = async (limit = 3) => {
    const result = await query(
        `SELECT c.*, COUNT(sh.id) AS session_count,
                COUNT(sh.id) * c.duration AS total_minutes
         FROM companions c
         LEFT JOIN session_history sh ON sh.companion_id = c.id
         GROUP BY c.id
         ORDER BY total_minutes DESC, session_count DESC, c.created_at DESC
         LIMIT $1`,
        [limit]
    );

    return result.rows;
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const result = await query(
        `SELECT c.* FROM session_history sh
         JOIN companions c ON c.id = sh.companion_id
         WHERE sh.user_id = $1
         ORDER BY sh.created_at DESC
         LIMIT $2`,
        [userId, limit]
    );

    return result.rows;
}

export const getUserCompanions = async (userId: string) => {
    const result = await query(
        `SELECT * FROM companions WHERE author = $1`,
        [userId]
    );

    return result.rows;
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();

    if (!userId) throw new Error('Unauthorized');

    let limit = 0;

    if (has({ plan: 'pro' })) {
        return true;
    } else if (has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if (has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const result = await query(
        `SELECT COUNT(*) as count FROM companions WHERE author = $1`,
        [userId]
    );

    const companionCount = parseInt(result.rows[0].count);

    if (companionCount >= limit) {
        return false;
    } else {
        return true;
    }
}

export const addBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;

    await query(
        `INSERT INTO bookmarks (companion_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (companion_id, user_id) DO NOTHING`,
        [companionId, userId]
    );

    revalidatePath(path);
}

export const removeBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;

    await query(
        `DELETE FROM bookmarks WHERE companion_id = $1 AND user_id = $2`,
        [companionId, userId]
    );

    revalidatePath(path);
}

export const getBookmarkedCompanions = async (userId: string) => {
    const result = await query(
        `SELECT c.* FROM bookmarks b
         JOIN companions c ON c.id = b.companion_id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
    );

    return result.rows;
}

export const getMyBookmarkedIds = async (): Promise<string[]> => {
    const { userId } = await auth();
    if (!userId) return [];

    const result = await query(
        `SELECT companion_id FROM bookmarks WHERE user_id = $1`,
        [userId]
    );

    return result.rows.map((r: any) => String(r.companion_id));
}