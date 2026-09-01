import Image from "next/image";
import Link from "next/link";

interface InstagramPost {
  /** Path under /public — e.g. an image you saved from Instagram. */
  imageSrc: string;
  /** The real Instagram post URL, opened when the tile is clicked. */
  url: string;
}

// Edit this list to change which photos show up. Add image files to
// public/images/instagram/ and reference them here.
const POSTS: InstagramPost[] = [
  {
    imageSrc: "/images/instagram/post-1.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/C3h7fSJArRN/",
  },
  {
    imageSrc: "/images/instagram/post-2.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/DHJaz8jJCKc/",
  },
  {
    imageSrc: "/images/instagram/post-5.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/C2dQULvRcD_/",
  },
  {
    imageSrc: "/images/instagram/post-3.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/C2dn2QnpDMz/",
  },
  {
    imageSrc: "/images/instagram/post-4.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/Cm6aQqKOkvu/",
  },
  {
    imageSrc: "/images/instagram/post-6.jpg",
    url: "https://www.instagram.com/geopuntadeldiablo/p/CkRfvcWN-ia/",
  },
];

export default function InstagramGallery() {
  return (
    <section className="py-16 px-4 bg-secondary-900">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Seguinos en Instagram
        </h2>
        <p className="text-white mb-8">@geopuntadeldiablo</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
          {POSTS.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative block aspect-3/4 overflow-hidden bg-transparent"
            >
              <Image
                src={post.imageSrc}
                alt="Foto de Instagram de Geo Punta del Diablo"
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                <svg
                  className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.948-.198-4.354-2.622-6.78-6.98-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
