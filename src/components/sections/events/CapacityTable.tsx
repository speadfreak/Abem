"use client";

import { Reveal } from "@/components/shared/Primitives";

type CapacityRow = {
  area: string;
  am: string;
  seated: string;
  standing: string;
  bestFor: string;
};

const ROWS: CapacityRow[] = [
  { area: "The Dining Hall", am: "የመግቢያ አዳራሽ", seated: "120", standing: "150", bestFor: "Azmari nights & family feasts" },
  { area: "The Courtyard Garden", am: "የአትክልት ስፍራ", seated: "300", standing: "400", bestFor: "Weddings & festival feasts" },
  { area: "The Tej Bar & Lounge", am: "የጠጅ ባር", seated: "40", standing: "55", bestFor: "Birthdays & send-offs" },
  { area: "The Buna Pavilion", am: "የቡና ጥምቀት", seated: "24", standing: "30", bestFor: "Ceremonies & quiet meetings" },
  { area: "The Ember Room (VIP)", am: "የእሳት ክፍል", seated: "8", standing: "—", bestFor: "Chef's table tastings" },
  { area: "Both houses combined", am: "ሁለቱ ቅርንጫፎች", seated: "450", standing: "550", bestFor: "Full-house takeovers" },
];

export default function CapacityTable() {
  return (
    <Reveal className="mt-12">
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="px-6 pt-6 text-left text-xs text-muted-foreground">
              Seated counts assume full mesob service; standing counts apply to cocktail receptions.
            </caption>
            <thead>
              <tr className="border-b border-gold/15 text-[11px] uppercase tracking-[0.18em] text-gold">
                <th scope="col" className="px-6 py-4 font-semibold">Venue area</th>
                <th scope="col" className="px-6 py-4 font-semibold">Seated</th>
                <th scope="col" className="px-6 py-4 font-semibold">Standing</th>
                <th scope="col" className="px-6 py-4 font-semibold">Best for</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.area} className="border-b border-gold/10 transition-colors last:border-0 hover:bg-gold/5">
                  <th scope="row" className="px-6 py-4 font-medium text-cream">
                    {r.area}
                    <span className="am-text ml-2 text-xs font-normal text-gold/70" lang="am">
                      {r.am}
                    </span>
                  </th>
                  <td className="px-6 py-4 font-display text-lg gold-text">{r.seated}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.standing}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Reveal>
  );
}
