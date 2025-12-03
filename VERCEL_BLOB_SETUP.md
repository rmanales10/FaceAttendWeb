# Vercel Blob Storage Setup

This project uses **Vercel Blob Storage** for storing DOCX templates. Vercel Blob is a fast, globally distributed object storage solution that works seamlessly with Vercel deployments.

## Why Vercel Blob?

- ✅ **Works on Vercel**: Unlike file system storage, Vercel Blob works perfectly with serverless functions
- ✅ **Persistent Storage**: Files persist across deployments
- ✅ **Global CDN**: Fast access worldwide
- ✅ **No External Services**: Built into Vercel, no need for Firebase Storage or AWS S3
- ✅ **Simple API**: Easy to use with `@vercel/blob` package

## Setup Instructions

### 1. Create a Blob Store in Vercel

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** or **Add Storage**
4. Select **Blob** from the options
5. Follow the prompts to create your blob store
6. Note the `BLOB_READ_WRITE_TOKEN` that will be automatically added to your environment variables

### 2. Environment Variables

Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` to your environment variables when you create a blob store. Make sure it's available in your deployment.

To verify:
- Go to **Settings** → **Environment Variables** in your Vercel project
- You should see `BLOB_READ_WRITE_TOKEN` listed

### 3. Local Development

For local development, you need to add the token to your `.env.local` file:

```bash
BLOB_READ_WRITE_TOKEN=your_token_here
```

You can find your token in the Vercel dashboard under your Blob store settings.

### 4. Usage

Once set up, templates will be automatically stored in Vercel Blob Storage when you upload them through the Reports page. The templates are stored with the prefix `templates/` and include:

- Template files: `templates/{templateId}.docx`
- Templates list: `templates/templates.json`
- Selected template: `templates/selected.json`

## Benefits

- **No File System Limitations**: Works perfectly with Vercel's serverless architecture
- **Scalable**: Can handle unlimited templates
- **Fast**: Global CDN ensures quick access
- **Reliable**: 99.999999999% durability (11 nines)

## Migration from File System

If you were previously using local file system storage, your templates will need to be re-uploaded through the web interface. The old `/templates` folder is no longer used.

