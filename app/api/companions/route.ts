import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, subject, topic, style, voice, duration } = body;

    // Validate required fields
    if (!name || !subject || !topic || !style || !voice || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO companions (name, subject, topic, style, voice, duration, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, subject, topic, style, voice, duration, author, created_at`,
      [name, subject, topic, style, voice, duration, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create companion' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating companion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching companions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
