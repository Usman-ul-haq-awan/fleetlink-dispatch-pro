import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_url } = body;

    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const schema = {
      type: 'object',
      properties: {
        carriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              usdot: { type: 'string' },
              mc: { type: 'string' },
              name: { type: 'string' },
              phone: { type: 'string' },
              state: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    };

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: schema,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}