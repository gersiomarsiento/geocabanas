"use client";

// app/admin/propiedades/SiteInstagramCard.tsx

import { useEffect, useState } from "react";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

interface InstagramPost {
  id: string;
  url: string;
  postUrl: string;
  sortOrder: number;
}

export default function SiteInstagramCard() {
  const [posts, setPosts] = useState<InstagramPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newPostUrl, setNewPostUrl] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/instagram-posts")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los posteos");
        return res.json() as Promise<InstagramPost[]>;
      })
      .then(setPosts)
      .catch((e) => setError(e.message));
  }, []);

  async function handleAdd() {
    if (!newFile || !newPostUrl.trim()) {
      setError("Elegí una foto y pegá el link del posteo antes de agregar.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const resized = await resizeImageForUpload(newFile);
      const formData = new FormData();
      formData.append("file", resized);
      formData.append("postUrl", newPostUrl.trim());

      const res = await fetch("/api/admin/instagram-posts", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("No se pudo subir el posteo");
      const post = (await res.json()) as InstagramPost;
      setPosts((prev) => [...(prev ?? []), post]);
      setNewPostUrl("");
      setNewFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditUrl(post: InstagramPost) {
    const nextUrl = window.prompt(
      "Link del posteo de Instagram:",
      post.postUrl,
    );
    if (nextUrl == null || !nextUrl.trim() || nextUrl.trim() === post.postUrl)
      return;

    try {
      const res = await fetch(`/api/admin/instagram-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl: nextUrl.trim() }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el link");
      setPosts(
        (prev) =>
          prev?.map((p) =>
            p.id === post.id ? { ...p, postUrl: nextUrl.trim() } : p,
          ) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Eliminar este posteo?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/instagram-posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar el posteo");
      setPosts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        Estas fotos y links son los que se muestran en la sección &quot;Seguinos en
        Instagram&quot; del sitio. El @usuario que se muestra ahí sale del campo
        Instagram en &quot;Contacto y ubicación&quot;.
      </p>

      <div className="mb-5 rounded-md border border-dashed border-zinc-300 p-4">
        <span className="mb-2 block text-sm font-medium text-zinc-600">
          Agregar posteo
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            placeholder="https://www.instagram.com/p/..."
            value={newPostUrl}
            onChange={(e) => setNewPostUrl(e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm hover:bg-zinc-50">
            {newFile ? newFile.name : "Elegir foto"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          <button
            type="button"
            disabled={uploading || !newFile || !newPostUrl.trim()}
            onClick={handleAdd}
            className="rounded-md bg-foreground px-4 py-1.5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? "Subiendo…" : "Agregar"}
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!posts ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Todavía no hay posteos.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative aspect-square overflow-hidden rounded-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => handleEditUrl(post)}
                  className="rounded-md bg-primary/80 px-2 py-1 text-xs text-primary-foreground"
                >
                  Editar link
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="rounded-md bg-red-600/80 px-2 py-1 text-xs text-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
