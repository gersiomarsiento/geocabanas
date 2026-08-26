import InstagramEmbed from "./InstagramEmbed";
// Only to display ONE POST - Needs more work

// Add or remove post URLs here to update the section.
const POST_URLS = [
  // "https://www.instagram.com/p/C3h7fSJArRN/?utm_source=ig_embed&amp;utm_campaign=loading",
  "https://www.instagram.com/reel/DRDVwGlkTG-/?utm_source=ig_embed&amp;utm_campaign=loading",
  // "https://www.instagram.com/reel/DTQsiaDElmP/?utm_source=ig_embed&amp;utm_campaign=loading",
  // "https://www.instagram.com/p/C2dn2QnpDMz/?utm_source=ig_embed&amp;utm_campaign=loading",
  // "https://www.instagram.com/p/Cm6aQqKOkvu/?utm_source=ig_embed&amp;utm_campaign=loading",
  // "https://www.instagram.com/p/CkRfvcWN-ia/?utm_source=ig_embed&amp;utm_campaign=loading",
];

export default function InstagramGallery() {
  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8">
          Seguinos en Instagram
        </h2>

        {/* Masonry via CSS columns: handles each embed's variable height
            without the uneven gaps a strict grid would produce. */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 *:mb-4 *:break-inside-avoid">
          {POST_URLS.map((url) => (
            <InstagramEmbed key={url} url={url} />
          ))}
        </div>
      </div>
    </section>
  );
}
