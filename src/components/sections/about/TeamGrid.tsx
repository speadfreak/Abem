"use client";

import Image from "next/image";
import { Reveal } from "@/components/shared/Primitives";
import { useLang } from "@/lib/i18n/lang-context";

export type TeamMemberDTO = {
  id: string;
  name: string;
  nameAm: string | null;
  role: string;
  bio: string | null;
  photo: string | null;
};

const FALLBACK_TEAM: TeamMemberDTO[] = [
  {
    id: "chef-almaz",
    name: "Chef Almaz Bekele",
    nameAm: "ሼፍ አልማዝ በቀለ",
    role: "Executive Chef",
    bio: "Fifteen years at the berbere pot. Trained in her mother's kitchen in Gondar, sharpened in Addis. Guards the doro wot recipe like a national secret.",
    photo: "/images/chef.jpg",
  },
  {
    id: "dawit",
    name: "Dawit Tesfaye",
    nameAm: "ዳዊት ተስፋዬ",
    role: "Head of the Grill",
    bio: "Charcoal whisperer. If the tibs aren't singing when they leave the shekla, they don't leave.",
    photo: "/images/dishes/tibs.jpg",
  },
  {
    id: "hanna",
    name: "Hanna Girma",
    nameAm: "ሐና ግርማ",
    role: "Buna Ceremony Host",
    bio: "Roasts green beans tableside with the patience of the highlands. Ask her about the third cup.",
    photo: "/images/coffee-ceremony.jpg",
  },
  {
    id: "yonas",
    name: "Yonas Abebe",
    nameAm: "ዮናስ አበበ",
    role: "General Manager",
    bio: "Runs the floor like an orchestra — gursha, tej and conversation in perfect time.",
    photo: "/images/interior.jpg",
  },
];

export default function TeamGrid({ members }: { members: TeamMemberDTO[] }) {
  const { pick } = useLang();
  const list = members.length > 0 ? members : FALLBACK_TEAM;

  return (
    <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((m, i) => (
        <Reveal key={m.id} delay={i * 0.08}>
          <figure className="group img-frame card-hover relative overflow-hidden">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={m.photo || "/images/chef.jpg"}
                alt={`${m.name} — ${m.role} at Abem Restaurant`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="img-duotone object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/95 via-[#0b0705]/45 to-transparent"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{m.role}</p>
              <p className="display-3 mt-1.5 text-cream">{pick(m, "name")}</p>
              {m.bio ? (
                <p className="mt-2 text-xs leading-relaxed text-cream/75 transition-all duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
                  {m.bio}
                </p>
              ) : null}
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}
