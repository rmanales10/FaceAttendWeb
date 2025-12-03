import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

interface TemplateInfo {
    id: string;
    name: string;
    size?: number;
    uploadedAt?: number;
    url?: string;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.name.endsWith('.docx')) {
            return NextResponse.json(
                { error: 'Only .docx files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        // Generate unique ID for the template
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileName = `templates/${templateId}.docx`;

        // Upload to Vercel Blob Storage
        const blob = await put(fileName, file, {
            access: 'public',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // Get template metadata
        const templateInfo = {
            id: templateId,
            name: file.name,
            size: file.size,
            uploadedAt: Date.now(),
            url: blob.url,
        };

        // Update templates list in Blob Storage
        const templatesListKey = 'templates/templates.json';
        let templates: TemplateInfo[] = [];

        try {
            const existingList = await list({ prefix: templatesListKey });
            if (existingList.blobs.length > 0) {
                const listBlob = existingList.blobs[0];
                const response = await fetch(listBlob.url);
                templates = await response.json();
            }
        } catch {
            // If no list exists, start with empty array
            console.log('No existing templates list, starting fresh');
        }

        templates.push(templateInfo);

        // Save updated templates list to Blob Storage
        const templatesListBlob = new Blob([JSON.stringify(templates, null, 2)], {
            type: 'application/json',
        });
        await put(templatesListKey, templatesListBlob, {
            access: 'public',
            contentType: 'application/json',
        });

        // Auto-select the newly uploaded template
        const selectedKey = 'templates/selected.json';
        const selectedBlob = new Blob([JSON.stringify({ templateId }, null, 2)], {
            type: 'application/json',
        });
        await put(selectedKey, selectedBlob, {
            access: 'public',
            contentType: 'application/json',
        });

        return NextResponse.json({
            success: true,
            template: templateInfo,
        });
    } catch (error) {
        console.error('Error uploading template:', error);
        return NextResponse.json(
            { error: 'Failed to upload template' },
            { status: 500 }
        );
    }
}
