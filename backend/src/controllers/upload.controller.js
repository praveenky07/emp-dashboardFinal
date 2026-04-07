const cloudinary = require('cloudinary').v2;
const { db } = require('../db/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log(`[UPLOAD] Processing file: ${req.file.originalname}`);

        let imageUrl = '';
        
        // Check if Cloudinary is fully configured and not using placeholder credentials
        const hasCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_key';

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        if (hasCloudinary) {
            // Production: Upload to Cloudinary using base64 URI
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'emp_pro_profiles',
                transformation: [{ width: 400, height: 400, crop: 'fill' }]
            });
            imageUrl = result.secure_url;
        } else {
            // Local/Fallback: Store Base64 string directly in generic DB 
            // Ensures feature remains fully functional even without third party keys
            imageUrl = dataURI;
        }

        // Save generated URL to Database for persistence
        await db.execute({
            sql: "UPDATE users SET profile_image = ? WHERE id = ?",
            args: [imageUrl, req.user.id]
        });

        return res.json({
            message: "Upload successful",
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error("[UPLOAD] Failed to process profile image:", error);
        res.status(500).json({ error: "Upload failed" });
    }
};
