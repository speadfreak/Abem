"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader, AdminSkeleton } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { ContentPayload } from "@/components/admin/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import HeroTab from "@/components/admin/content/hero-tab";
import TeamTab from "@/components/admin/content/team-tab";
import TestimonialsTab from "@/components/admin/content/testimonials-tab";
import FaqsTab from "@/components/admin/content/faqs-tab";
import EventsTab from "@/components/admin/content/events-tab";
import StoriesTab from "@/components/admin/content/stories-tab";
import OpeningsTab from "@/components/admin/content/openings-tab";

export default function AdminContentPage() {
  const [data, setData] = useState<ContentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const d = await apiFetch<ContentPayload>("/api/admin/content");
      setData(d);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Content"
        subtitle="Everything the public site says — hero, pages, people, voices, stories and hiring."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <div role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : data ? (
        <Tabs defaultValue="hero" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-elevated/60 p-1">
            <TabsTrigger value="hero">Hero &amp; Pages</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="openings">Openings</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <HeroTab />
          </TabsContent>
          <TabsContent value="team">
            <TeamTab rows={data.team} onChanged={() => void load()} />
          </TabsContent>
          <TabsContent value="testimonials">
            <TestimonialsTab rows={data.testimonials} onChanged={() => void load()} />
          </TabsContent>
          <TabsContent value="faqs">
            <FaqsTab rows={data.faqs} onChanged={() => void load()} />
          </TabsContent>
          <TabsContent value="events">
            <EventsTab rows={data.eventPackages} onChanged={() => void load()} />
          </TabsContent>
          <TabsContent value="stories">
            <StoriesTab rows={data.stories} onChanged={() => void load()} />
          </TabsContent>
          <TabsContent value="openings">
            <OpeningsTab rows={data.openings} onChanged={() => void load()} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
