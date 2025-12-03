import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

const TEMPLATES_LIST_KEY = 'templates/templates.json';
const SELECTED_TEMPLATE_KEY = 'templates/selected.json';

interface TemplateInfo {
    id: string;
    name: string;
    size?: number;
    uploadedAt?: number;
    url?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { templateId } = await request.json();

        if (!templateId) {
            return NextResponse.json(
                { error: 'Template ID is required' },
                { status: 400 }
            );
        }

        // Verify template exists
        const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
        if (templatesList.blobs.length > 0) {
            const listBlob = templatesList.blobs[0];
            const response = await fetch(listBlob.url);
            const templates: TemplateInfo[] = await response.json();
            const template = templates.find((t) => t.id === templateId);

            if (!template) {
                return NextResponse.json(
                    { error: 'Template not found' },
                    { status: 404 }
                );
            }
        }

        // Save selected template ID to Blob Storage
        const selectedBlob = new Blob([JSON.stringify({ templateId }, null, 2)], {
            type: 'application/json',
        });
        await put(SELECTED_TEMPLATE_KEY, selectedBlob, {
            access: 'public',
            contentType: 'application/json',
        });

        return NextResponse.json({
            success: true,
            message: 'Template selected successfully',
        });
    } catch (error) {
        console.error('Error selecting template:', error);
        return NextResponse.json(
            { error: 'Failed to select template' },
            { status: 500 }
        );
    }
}
