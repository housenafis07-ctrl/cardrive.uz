export type CarDrivePlateBox = { x: number; y: number; width: number; height: number };

export async function prepareCarDriveListingImage(file: File, plateBox?: CarDrivePlateBox): Promise<File> {
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

      if (plateBox) {
        const x = Math.max(0, Math.min(width, plateBox.x / 1000 * width));
        const y = Math.max(0, Math.min(height, plateBox.y / 1000 * height));
        const w = Math.max(1, Math.min(width - x, plateBox.width / 1000 * width));
        const h = Math.max(1, Math.min(height - y, plateBox.height / 1000 * height));
        context.fillStyle = "#f8fafc";
        context.fillRect(x, y, w, h);
        context.strokeStyle = "#14532d";
        context.lineWidth = Math.max(1, h * 0.045);
        context.strokeRect(x, y, w, h);
        context.fillStyle = "#14532d";
        let fontSize = Math.max(7, Math.floor(h * 0.52));
        context.font = "900 " + fontSize + "px Arial, sans-serif";
        while (context.measureText("CARDRIVE").width > w * 0.9 && fontSize > 5) {
          fontSize -= 1;
          context.font = "900 " + fontSize + "px Arial, sans-serif";
        }
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("CARDRIVE", x + w / 2, y + h / 2, Math.max(1, w * 0.92));
      } else {
        // Stronger corner watermark remains legible in small admin/listing thumbnails.
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
      }

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
