/**
 * Shared image preparation for direct website uploads and Telegram AI drafts.
 * Never detects, covers, or writes over vehicle registration plates.
 * Adds only a consistent cardrive.uz watermark and optimizes the image.
 */
export async function prepareCarDriveListingImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    for (let attempt = 0; attempt < 6; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Rasmni qayta ishlash uchun canvas ochilmadi.");
      context.filter = "brightness(1.035) contrast(1.045)";
      context.drawImage(bitmap, 0, 0, width, height);
      context.filter = "none";

      // Consistent, clearly visible cardrive.uz watermark on every listing photo.
      const fontSize = Math.max(18, Math.min(72, Math.round(width * 0.05)));
      context.font = "900 " + fontSize + "px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const paddingX = Math.round(fontSize * 0.55);
      const paddingY = Math.round(fontSize * 0.34);
      const textWidth = context.measureText("cardrive.uz").width;
      const badgeWidth = textWidth + paddingX * 2;
      const badgeHeight = fontSize + paddingY * 2;
      const margin = Math.max(10, Math.round(width * 0.025));
      const badgeX = width - margin - badgeWidth;
      const badgeY = height - margin - badgeHeight;
      context.fillStyle = "rgba(8, 47, 73, 0.82)";
      context.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      context.fillStyle = "#ffffff";
      context.fillText("cardrive.uz", badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

      const quality = Math.max(0.5, 0.84 - attempt * 0.07);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob) throw new Error("Rasmni WebP formatiga o‘tkazib bo‘lmadi.");
      if (blob.size <= 220 * 1024) {
        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
      }
      width = Math.max(1, Math.round(width * 0.86));
      height = Math.max(1, Math.round(height * 0.86));
    }
    throw new Error("Rasm hajmi juda katta. Boshqa rasm tanlang.");
  } finally {
    bitmap.close();
  }
}
