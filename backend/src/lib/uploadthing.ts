import mongoose from "mongoose";
import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      let token = "";
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined") {
        token = authHeader.substring(7);
      } else {
        // Fallback to Better Auth cookie
        const cookies = (req as any).cookies;
        token = cookies?.["better-auth.session_token"] || "";
      }

      if (!token) {
        console.error("Upload rejected: No token found in Authorization header or better-auth.session_token cookie");
        throw new Error("Unauthorized");
      }

      const session = await mongoose.connection.collection("session").findOne({
        token: token,
      });
      if (!session) {
        console.error("Upload rejected: Session not found in DB for token:", token.slice(0, 10) + "...");
        throw new Error("Unauthorized");
      }
      // check expireAt

      if (new Date(session.expiresAt) < new Date()) {
        console.error("Upload rejected: Session expired");
        throw new Error("Unauthorized");
      }
      return {
        uploaderId: session.userId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`✅ Uploaded by Doctor ID: ${metadata.uploaderId}`);
      console.log(`✅ File URL: ${file.ufsUrl}`);

      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
