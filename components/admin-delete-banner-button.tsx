"use client";

export default function AdminDeleteBannerButton({ action, id, imageUrl }: { action: (formData: FormData) => void | Promise<void>; id: string; imageUrl: string | null }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("Bu bannerni o‘chirishni tasdiqlaysizmi?")) event.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      <button type="submit" className="font-bold text-red-600">O‘chirish</button>
    </form>
  );
}
