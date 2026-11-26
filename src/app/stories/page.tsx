import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { Reveal } from "@/components/shared/Primitives";
import { db } from "@/lib/db";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Stories — Culture, Kitchen & Craft | ታሪኮች",
    description:
      "Essays and dispatches from Abem's kitchen: the berbere trail, the tej tradition, the buna ceremony and the people who keep the ember lit.",
    openGraph: { images: [{ url: "/images/coffee-ceremony.jpg" }] },
  };
}

const CATEGORY_STYLE: Record<string, string> = {
  culture: "border-gold/50 bg-gold/15 text-gold",
  kitchen: "border-ember/50 bg-ember/15 text-ember",
  people: "border-highland/50 bg-highland/15 text-[#8fd0a0]",
};

export default async function StoriesPage() {
  let stories: Awaited<ReturnType<typeof fetchStories>> = [];
  try {
    stories = await fetchStories();
  } catch {
    stories = [];
  }

  return (
    <main>
      <PageHero
        eyebrow="Abem Stories · ታሪኮች"
        title="Slow reads, hot takes."
        titleAm="ቀስ ያሉ ታሪኮች"
        description="From the berbere markets of Mercato to midnight tej bets — dispatches from fifteen years of keeping the ember lit."
        image="/images/coffee-ceremony.jpg"
      />

      <section className="container-x pb-28 pt-4" aria-label="All stories">
        {stories.length === 0 ? (
          <div className="card-elevated flex flex-col items-center gap-4 py-20 text-center" role="status">
            <BookOpen className="h-10 w-10 text-gold/30" aria-hidden="true" />
            <p className="max-w-sm text-cream/80">The first essays are still in the fire. Check back soon — or come taste the story in person.</p>
            <Link href="/menu" className="btn-ghost btn-sm">Browse the menu meanwhile</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story, i) => (
              <Reveal key={story.id} delay={Math.min(i * 0.06, 0.3)}>
                <Link
                  href={`/stories/${story.slug}`}
                  className="card-elevated card-hover group flex h-full flex-col overflow-hidden focus-visible:outline-2 focus-visible:outline-gold"
                  aria-label={`Read: ${story.title}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {story.cover ? (
                      <Image
                        src={story.cover}
                        alt=""
                        fill
                        sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 420px"
                        className="img-duotone object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-elevated">
                        <BookOpen className="h-8 w-8 text-gold/25" aria-hidden="true" />
                      </div>
                    )}
                    <span
                      className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm ${CATEGORY_STYLE[story.category] ?? "border-gold/40 bg-card/80 text-gold"}`}
                    >
                      {story.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-xl font-semibold leading-snug text-cream transition-colors group-hover:text-gold">
                      {story.title}
                    </h2>
                    <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{story.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
                      <span>
                        {formatDateShort(story.publishedAt ?? story.createdAt)} · {story.readMinutes} min read
                      </span>
                      <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {stories.length > 0 ? (
          <p className="mt-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> New essays every couple of weeks — read with a macchiato.
          </p>
        ) : null}
      </section>
    </main>
  );
}

async function fetchStories() {
  return db.story.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 24,
    select: { id: true, slug: true, title: true, excerpt: true, cover: true, category: true, readMinutes: true, publishedAt: true, createdAt: true },
  });
}
