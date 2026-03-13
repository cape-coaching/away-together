import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const s3 = new S3Client({
  region:      process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const RequestSchema = z.object({
  filename:    z.string(),
  contentType: z.string().regex(/^image\//),
});

// POST /api/upload
// Returns a pre-signed S3 PUT URL + the final public CloudFront URL.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ext        = parsed.data.filename.split(".").pop() ?? "jpg";
  const key        = `uploads/${session.user.id}/${Date.now()}.${ext}`;
  const bucketName = process.env.S3_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket:      bucketName,
    Key:         key,
    ContentType: parsed.data.contentType,
  });

  const uploadUrl  = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl  = `${process.env.CLOUDFRONT_URL}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl });
}
