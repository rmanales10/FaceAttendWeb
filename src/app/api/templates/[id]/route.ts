import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

const TEMPLATES_LIST_KEY = 'templates/templates.json';
const SELECTED_TEMPLATE_KEY = 'templates/selected.json';

interface TemplateInfo {
    id: string;
    name: string;
    size?: number;
    uploadedAt?: number;
    url?: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get templates list
        const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
        if (templatesList.blobs.length === 0) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        const listBlob = templatesList.blobs[0];
        const response = await fetch(listBlob.url);
        const templates: TemplateInfo[] = await response.json();

        const template = templates.find((t) => t.id === id);

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Fetch the template file from Blob Storage
        const templateFileName = `templates/${id}.docx`;
        const templateBlobs = await list({ prefix: templateFileName });

        if (templateBlobs.blobs.length === 0) {
            return NextResponse.json(
                { error: 'Template file not found' },
                { status: 404 }
            );
        }

        const templateBlob = templateBlobs.blobs[0];
        const fileResponse = await fetch(templateBlob.url);
        const fileBuffer = await fileResponse.arrayBuffer();

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${template.name}"`,
            },
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get templates list
        const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
        if (templatesList.blobs.length === 0) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        const listBlob = templatesList.blobs[0];
        const response = await fetch(listBlob.url);
        const templates: TemplateInfo[] = await response.json();

        const templateIndex = templates.findIndex((t) => t.id === id);

        if (templateIndex === -1) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Delete the template file from Blob Storage
        const templateFileName = `templates/${id}.docx`;
        const templateBlobs = await list({ prefix: templateFileName });
        if (templateBlobs.blobs.length > 0) {
            await del(templateBlobs.blobs[0].url);
        }

        // Remove from templates list
        templates.splice(templateIndex, 1);

        // Update templates list in Blob Storage
        const { put } = await import('@vercel/blob');
        const templatesListBlob = new Blob([JSON.stringify(templates, null, 2)], {
            type: 'application/json',
        });
        await put(TEMPLATES_LIST_KEY, templatesListBlob, {
            access: 'public',
            contentType: 'application/json',
        });

        // If deleted template was selected, clear selection
        try {
            const selectedList = await list({ prefix: SELECTED_TEMPLATE_KEY });
            if (selectedList.blobs.length > 0) {
                const selectedBlob = selectedList.blobs[0];
                const selectedResponse = await fetch(selectedBlob.url);
                const selected = await selectedResponse.json();
                if (selected.templateId === id) {
                    const selectedBlobData = new Blob([JSON.stringify({ templateId: null }, null, 2)], {
                        type: 'application/json',
                    });
                    await put(SELECTED_TEMPLATE_KEY, selectedBlobData, {
                        access: 'public',
                        contentType: 'application/json',
                    });
                }
            }
        } catch (error) {
            console.log('Error updating selected template:', error);
        }

        return NextResponse.json({
            success: true,
            message: 'Template deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
