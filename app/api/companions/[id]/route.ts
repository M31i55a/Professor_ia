import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await query(
      'SELECT * FROM companions WHERE id = $1 AND author = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Companion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching companion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await query(
      'DELETE FROM companions WHERE id = $1 AND author = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Companion not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Companion deleted successfully' });
  } catch (error) {
    console.error('Error deleting companion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, subject, topic, style, voice, duration } = body;

    const result = await query(
      `UPDATE companions 
       SET name = $1, subject = $2, topic = $3, style = $4, voice = $5, duration = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND author = $8
       RETURNING *`,
      [name, subject, topic, style, voice, duration, id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Companion not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating companion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
