import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateLong } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getStory(slug: string) {
  try {
    return await db.story.findFirst({ where: { slug, published: true } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: `${story.title} | Abem Stories`,
    description: story.excerpt,
    openGraph: story.cover ? { images: [{ url: story.cover }] } : undefined,
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  const paragraphs = story.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const tags = Array.isArray(story.tags) ? (story.tags as string[]) : [];

  return (
    <main>
      <article className="pb-28">
        {/* Cover */}
        {story.cover ? (
          <div className="relative h-[42vh] min-h-64 w-full overflow-hidden md:h-[52vh]">
            <Image src={story.cover} alt={story.title} fill priority sizes="100vw" className="img-duotone object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0705] via-[#0b0705]/45 to-[#0b0705]/30" aria-hidden="true" />
          </div>
        ) : null}

        <div className="container-tight -mt-24 md:-mt-32">
          <Link href="/stories" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-cream">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All stories
          </Link>

          <header className="mt-5">
            <span className="rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
              {story.category}
            </span>
            <h1 className="display-1 mt-5 text-cream">{story.title}</h1>
            {story.titleAm ? <p className="am-text mt-3 text-xl text-gold/85">{story.titleAm}</p> : null}
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>By {story.author}</span>
              <span>{formatDateLong(story.publishedAt ?? story.createdAt)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> {story.readMinutes} min read
              </span>
            </p>
          </header>

          <p className="lead mt-8 border-l-2 border-gold/60 pl-5 text-cream/90 italic">{story.excerpt}</p>

          {/* Prose */}
          <div className="mt-10 space-y-6">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-sans text-[1.05rem] leading-[1.9] text-foreground/90 first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-playfair)] first-letter:text-6xl first-letter:leading-[0.85] first-letter:font-semibold first-letter:text-gold"
                    : "font-sans text-[1.05rem] leading-[1.9] text-foreground/90"
                }
              >
                {p}
              </p>
            ))}
          </div>

          {tags.length > 0 ? (
            <div className="mt-10 flex flex-wrap gap-2" aria-label="Story tags">
              {tags.map((t) => (
                <span key={t} className="rounded-full border border-cream/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/70">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="hairline mt-14" aria-hidden="true" />
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Hungry after that? The kitchen is open.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/order" className="btn-gold btn-sm">Order online</Link>
              <Link href="/stories" className="btn-ghost btn-sm">More stories</Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
