import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AddApplicationForm from '@/components/AddApplicationForm';
import ApplicationList from '@/components/ApplicationList';
import StatsChart from '@/components/StatsChart';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedDate: 'desc' },
  });

  // Build status counts for the chart
  const statusCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>
      <StatsChart data={statusCounts} />
      <AddApplicationForm />
      <ApplicationList applications={applications} />
    </div>
  );
}