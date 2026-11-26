import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";

export const dynamic = "force-dynamic";

/* Full JSON backup of every table. Password hashes are stripped for safety. */
export async function GET() {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const [
      adminUsers,
      activityLogs,
      settings,
      pageSections,
      menuCategories,
      menuItems,
      reservations,
      galleryItems,
      teamMembers,
      testimonials,
      faqs,
      eventPackages,
      stories,
      careerOpenings,
      jobApplications,
      contactMessages,
      newsletterSubscribers,
      branches,
      diningTables,
      serviceRequests,
      orders,
      deliveryZones,
      riders,
      coupons,
      loyaltyMembers,
    ] = await Promise.all([
      db.adminUser.findMany({ take: 5000 }),
      db.activityLog.findMany({ take: 5000, orderBy: { createdAt: "desc" } }),
      db.setting.findMany({ take: 5000 }),
      db.pageSection.findMany({ take: 5000 }),
      db.menuCategory.findMany({ take: 5000 }),
      db.menuItem.findMany({ take: 5000 }),
      db.reservation.findMany({ take: 5000 }),
      db.galleryItem.findMany({ take: 5000 }),
      db.teamMember.findMany({ take: 5000 }),
      db.testimonial.findMany({ take: 5000 }),
      db.faq.findMany({ take: 5000 }),
      db.eventPackage.findMany({ take: 5000 }),
      db.story.findMany({ take: 5000 }),
      db.careerOpening.findMany({ take: 5000 }),
      db.jobApplication.findMany({ take: 5000 }),
      db.contactMessage.findMany({ take: 5000 }),
      db.newsletterSubscriber.findMany({ take: 5000 }),
      db.branch.findMany({ take: 5000 }),
      db.diningTable.findMany({ take: 5000 }),
      db.serviceRequest.findMany({ take: 5000 }),
      db.order.findMany({ take: 5000 }),
      db.deliveryZone.findMany({ take: 5000 }),
      db.rider.findMany({ take: 5000 }),
      db.coupon.findMany({ take: 5000 }),
      db.loyaltyMember.findMany({ take: 5000 }),
    ]);

    const dump = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      adminUsers: adminUsers.map(({ passwordHash: _hash, ...u }) => u),
      activityLogs,
      settings,
      pageSections,
      menuCategories,
      menuItems,
      reservations,
      galleryItems,
      teamMembers,
      testimonials,
      faqs,
      eventPackages,
      stories,
      careerOpenings,
      jobApplications,
      contactMessages,
      newsletterSubscribers,
      branches,
      diningTables,
      serviceRequests,
      orders,
      deliveryZones,
      riders,
      coupons,
      loyaltyMembers,
    };

    await logActivity(user.email, "exported", "Backup");

    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="abem-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("[admin/export]", err);
    return NextResponse.json({ ok: false, error: "Export failed" }, { status: 500 });
  }
}
