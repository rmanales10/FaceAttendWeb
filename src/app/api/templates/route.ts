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
        let templates: TemplateInfo[] = [];
        let selectedTemplateId = null;

        // Get templates list
        try {
            const templatesList = await list({ prefix: TEMPLATES_LIST_KEY });
            if (templatesList.blobs.length > 0) {
                const listBlob = templatesList.blobs[0];
                const response = await fetch(listBlob.url);
                templates = await response.json();
            }
        } catch {
            console.log('No templates list found');
        }

        // Get selected template ID
        try {
            const selectedList = await list({ prefix: SELECTED_TEMPLATE_KEY });
            if (selectedList.blobs.length > 0) {
                const selectedBlob = selectedList.blobs[0];
                const response = await fetch(selectedBlob.url);
                const selected = await response.json();
                selectedTemplateId = selected.templateId || null;
            }
        } catch {
            console.log('No selected template found');
        }

        return NextResponse.json({
            templates,
            selectedTemplateId,
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}
