import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

const TEMPLATES_LIST_KEY = 'templates/templates.json';
const SELECTED_TEMPLATE_KEY = 'templates/selected.json';

interface TemplateInfo {
    id: string;
    name: string;
    size?: number;
    uploadedAt?: number;
    url?: string;
}

export async function GET() {
    try {
        // Get selected template ID
        let templateId = null;
        try {
            const selectedList = await list({ prefix: SELECTED_TEMPLATE_KEY });
            if (selectedList.blobs.length > 0) {
                const selectedBlob = selectedList.blobs[0];
                const response = await fetch(selectedBlob.url);
                const selected = await response.json();
                templateId = selected.templateId || null;
            }
        } catch {
            console.log('No selected template found');
        }

        if (!templateId) {
            return NextResponse.json({
                template: null,
            });
        }

        // Get template info
        let template = null;
        try {
            const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
            if (templatesList.blobs.length > 0) {
                const listBlob = templatesList.blobs[0];
                const response = await fetch(listBlob.url);
                const templates: TemplateInfo[] = await response.json();
                template = templates.find((t) => t.id === templateId);
            }
        } catch {
            console.log('No templates list found');
        }

        if (!template) {
            return NextResponse.json({
                template: null,
            });
        }

        // Fetch the actual template file from Blob Storage
        const templateFileName = `templates/${templateId}.docx`;
        const templateBlobs = await list({ prefix: templateFileName });

        if (templateBlobs.blobs.length === 0) {
            return NextResponse.json({
                template: null,
            });
        }

        const templateBlob = templateBlobs.blobs[0];
        const fileResponse = await fetch(templateBlob.url);
        const fileBuffer = await fileResponse.arrayBuffer();

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
        });
    } catch (error) {
        console.error('Error fetching selected template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch selected template' },
            { status: 500 }
        );
    }
}
